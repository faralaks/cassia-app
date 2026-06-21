import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceRecordingResult = {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  waveform: number[];
};

export type VoiceRecorderState = 'inactive' | 'recording';

// Largest number of waveform samples we ship in the event. Playback resamples
// to the bubble width anyway, so there's no point bloating the event.
const MAX_WAVEFORM = 100;
// One waveform sample is collected every SAMPLE_INTERVAL_MS.
const SAMPLE_INTERVAL_MS = 100;
// Rolling live levels kept for the recording UI animation. Sized generously so
// the on-screen waveform can fill wide windows with thin fixed-width bars.
const MAX_LIVE_LEVELS = 256;
// Gain applied to the live levels so normal speech visibly moves the bars
// (raw mic RMS is small). Only affects the on-screen animation, not the
// waveform stored in the sent event.
const LIVE_LEVEL_GAIN = 5;

const SUPPORTED_MIME_TYPES = [
  'audio/ogg;codecs=opus',
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
];

const pickMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined') return '';
  for (let i = 0; i < SUPPORTED_MIME_TYPES.length; i += 1) {
    const candidate = SUPPORTED_MIME_TYPES[i];
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return '';
};

// Placeholder minute-tick: a short, quiet sine blip generated on the fly so we
// don't need to ship an asset. Swap for a real sound file later if desired.
const playMinuteTick = (ctx: AudioContext) => {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // audio output is non-critical; ignore failures
  }
};

// Map raw RMS samples (0..1) to MSC1767 waveform values (0..1024), max-pooling
// down to MAX_WAVEFORM entries so the event stays small.
const normalizeWaveform = (samples: number[]): number[] => {
  if (samples.length === 0) return [];
  let pooled = samples;
  if (samples.length > MAX_WAVEFORM) {
    pooled = [];
    for (let i = 0; i < MAX_WAVEFORM; i += 1) {
      const start = Math.floor((i / MAX_WAVEFORM) * samples.length);
      const end = Math.floor(((i + 1) / MAX_WAVEFORM) * samples.length);
      let max = 0;
      for (let j = start; j < end && j < samples.length; j += 1) {
        if (samples[j] > max) max = samples[j];
      }
      pooled.push(max);
    }
  }
  return pooled.map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 1024));
};

export type UseVoiceRecorder = {
  state: VoiceRecorderState;
  elapsed: number;
  levels: number[];
  start: () => Promise<void>;
  stop: () => Promise<VoiceRecordingResult | null>;
  cancel: () => void;
};

export const useVoiceRecorder = (): UseVoiceRecorder => {
  const [state, setState] = useState<VoiceRecorderState>('inactive');
  const [elapsed, setElapsed] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTsRef = useRef(0);
  const lastMinuteRef = useRef(0);
  const waveformRef = useRef<number[]>([]);
  const mimeRef = useRef('');
  const cancelledRef = useRef(false);
  const resolveRef = useRef<((r: VoiceRecordingResult | null) => void) | null>(null);

  const teardown = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    recorderRef.current = null;
  }, []);

  const sample = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioCtxRef.current;
    if (!analyser || !ctx) return;

    const buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    let sumSq = 0;
    for (let i = 0; i < buf.length; i += 1) {
      const v = (buf[i] - 128) / 128;
      sumSq += v * v;
    }
    const rms = Math.min(Math.sqrt(sumSq / buf.length), 1);
    const level = Math.min(rms * LIVE_LEVEL_GAIN, 1);

    waveformRef.current.push(rms);
    setLevels((prev) => {
      const next = prev.concat(level);
      return next.length > MAX_LIVE_LEVELS ? next.slice(next.length - MAX_LIVE_LEVELS) : next;
    });

    const elapsedSec = Math.floor((performance.now() - startTsRef.current) / 1000);
    setElapsed(elapsedSec);

    const minute = Math.floor(elapsedSec / 60);
    if (minute >= 1 && minute > lastMinuteRef.current) {
      lastMinuteRef.current = minute;
      playMinuteTick(ctx);
    }
  }, []);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      mimeRef.current = mimeType;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;

      chunksRef.current = [];
      waveformRef.current = [];
      cancelledRef.current = false;
      lastMinuteRef.current = 0;
      setElapsed(0);
      setLevels(new Array(MAX_LIVE_LEVELS).fill(0));

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const durationMs = performance.now() - startTsRef.current;
        const cancelled = cancelledRef.current;
        const resolve = resolveRef.current;
        const chunks = chunksRef.current;
        const waveform = normalizeWaveform(waveformRef.current);
        const mime = mimeRef.current || 'audio/webm';

        chunksRef.current = [];
        resolveRef.current = null;
        teardown();
        setState('inactive');

        if (cancelled) {
          resolve?.(null);
          return;
        }
        const blob = new Blob(chunks, { type: mime });
        resolve?.({ blob, mimeType: mime, durationMs, waveform });
      };

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      sourceRef.current = source;
      analyserRef.current = analyser;

      startTsRef.current = performance.now();
      recorder.start();
      setState('recording');
      intervalRef.current = window.setInterval(sample, SAMPLE_INTERVAL_MS);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Voice recording failed to start', err);
      teardown();
      setState('inactive');
    }
  }, [sample, teardown]);

  const stop = useCallback(
    (): Promise<VoiceRecordingResult | null> =>
      new Promise((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
          resolve(null);
          return;
        }
        cancelledRef.current = false;
        resolveRef.current = resolve;
        recorder.stop();
      }),
    []
  );

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      teardown();
      setState('inactive');
      return;
    }
    cancelledRef.current = true;
    resolveRef.current = null;
    recorder.stop();
  }, [teardown]);

  useEffect(
    () => () => {
      teardown();
    },
    [teardown]
  );

  return { state, elapsed, levels, start, stop, cancel };
};
