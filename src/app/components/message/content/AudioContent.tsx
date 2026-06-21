/* eslint-disable jsx-a11y/media-has-caption */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Spinner, Text, toRem } from 'folds';
import { EncryptedAttachmentInfo } from 'browser-encrypt-attachment';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { IAudioInfo } from '../../../../types/matrix/common';
import {
  PlayTimeCallback,
  useMediaLoading,
  useMediaPlay,
  useMediaPlayTimeCallback,
  useMediaSeek,
} from '../../../hooks/media';
import { useThrottle } from '../../../hooks/useThrottle';
import { secondsToMinutesAndSeconds } from '../../../utils/common';
import {
  decryptFile,
  downloadEncryptedMedia,
  downloadMedia,
  mxcUrlToHttp,
} from '../../../utils/matrix';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useVoiceMessageQueue } from '../../../hooks/useVoiceMessageQueue';
import { useBubbleFooterContext } from '../../../hooks/useBubbleFooter';
import * as css from './AudioContent.css';

const PLAY_TIME_THROTTLE_OPS = {
  wait: 500,
  immediate: true,
};

// Bubble width scales with the voice message length: short clips stay near
// MIN_WIDTH, longer ones grow up to MAX_WIDTH (twice MIN_WIDTH), reaching the
// cap at WIDTH_CAP_DURATION seconds.
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
const WIDTH_CAP_DURATION = 600; // 10 minutes

const getVoiceWidth = (durationSeconds: number): number => {
  if (!durationSeconds || durationSeconds <= 0) return MIN_WIDTH;
  const ratio = Math.sqrt(Math.min(durationSeconds, WIDTH_CAP_DURATION) / WIDTH_CAP_DURATION);
  return Math.round(MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * ratio);
};

// Width consumed by the play button column: button itself (46px) + Box gap="300" (~12px).
const BUTTON_AREA = 58;

// Target bar width in px. Must match the `width` value in AudioContent.css.ts
// VoiceWaveformBarBase. Gap between bars is 2px (CSS gap on VoiceWaveform).
const BAR_WIDTH = 3;
const BAR_GAP = 2;

// How many bars to render for a given duration so every bar is BAR_WIDTH px wide.
const getTargetBarCount = (durationSeconds: number): number => {
  const waveformArea = getVoiceWidth(durationSeconds) - BUTTON_AREA;
  return Math.max(16, Math.floor(waveformArea / (BAR_WIDTH + BAR_GAP)));
};

// Resample an already-normalised waveform array to targetCount entries.
// Downsampling uses max-pooling to preserve amplitude peaks.
// Upsampling uses linear interpolation between neighbours.
const resampleWaveform = (samples: number[], targetCount: number): number[] => {
  if (targetCount <= 0) return [];
  if (samples.length === 0) return new Array(targetCount).fill(0.08);
  if (samples.length === targetCount) return [...samples];
  if (targetCount === 1) return [Math.max(...samples)];

  return Array.from({ length: targetCount }, (_, i) => {
    if (samples.length < targetCount) {
      // Upsample: linear interpolation
      const srcPos = (i / (targetCount - 1)) * (samples.length - 1);
      const lo = Math.floor(srcPos);
      const hi = Math.min(lo + 1, samples.length - 1);
      const t = srcPos - lo;
      return samples[lo] * (1 - t) + samples[hi] * t;
    }
    // Downsample: max-pool so peaks stay visible
    const startF = (i / targetCount) * samples.length;
    const endF = ((i + 1) / targetCount) * samples.length;
    const start = Math.floor(startF);
    const end = Math.min(Math.ceil(endF), samples.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      if (samples[j] > max) max = samples[j];
    }
    return max;
  });
};

const VOICE_PLAY_EVENT = 'cassia:voice-play';

const ICON_SIZE = 36;

function PlayIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ transform: 'translateY(2px)' }}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

export type AudioContentProps = {
  mimeType: string;
  url: string;
  info: IAudioInfo;
  encInfo?: EncryptedAttachmentInfo;
  eventId?: string;
  groupId?: string;
  isOwn?: boolean;
  waveform?: number[];
};
export function AudioContent({
  mimeType,
  url,
  info,
  encInfo,
  eventId,
  groupId,
  isOwn,
  waveform,
}: AudioContentProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const voiceQueue = useVoiceMessageQueue();

  const [srcState, loadSrc] = useAsyncCallback(
    useCallback(async () => {
      const mediaUrl = mxcUrlToHttp(mx, url, useAuthentication);
      if (!mediaUrl) throw new Error('Invalid media URL');
      const fileContent = encInfo
        ? await downloadEncryptedMedia(mediaUrl, (encBuf) => decryptFile(encBuf, mimeType, encInfo))
        : await downloadMedia(mediaUrl);
      return URL.createObjectURL(fileContent);
    }, [mx, url, useAuthentication, mimeType, encInfo])
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoPlayRef = useRef(false);

  const [currentTime, setCurrentTime] = useState(0);
  // duration in seconds. (NOTE: info.duration is in milliseconds)
  const infoDuration = info.duration ?? 0;
  const [duration, setDuration] = useState((infoDuration >= 0 ? infoDuration : 0) / 1000);

  const getAudioRef = useCallback(() => audioRef.current, []);
  const { loading } = useMediaLoading(getAudioRef);
  const { playing, setPlaying } = useMediaPlay(getAudioRef);
  const { seek } = useMediaSeek(getAudioRef);
  const handlePlayTimeCallback: PlayTimeCallback = useCallback((d, ct) => {
    setDuration(d);
    setCurrentTime(ct);
  }, []);
  useMediaPlayTimeCallback(
    getAudioRef,
    useThrottle(handlePlayTimeCallback, PLAY_TIME_THROTTLE_OPS)
  );

  // If the Matrix event has no duration metadata (info.duration === 0 / missing),
  // eagerly fetch the audio so onLoadedMetadata fires and populates the real
  // duration before the user interacts. Voice messages are small enough that
  // this is acceptable; messages with valid duration are unaffected.
  useEffect(() => {
    if (infoDuration > 0) return;
    loadSrc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureLoaded = useCallback(() => {
    if (srcState.status === AsyncStatus.Idle || srcState.status === AsyncStatus.Error) {
      loadSrc();
    }
  }, [srcState, loadSrc]);

  const handlePlay = useCallback(() => {
    if (srcState.status === AsyncStatus.Success) {
      if (!playing) {
        window.dispatchEvent(new CustomEvent(VOICE_PLAY_EVENT, { detail: { id: eventId ?? '' } }));
      }
      setPlaying(!playing);
    } else if (srcState.status !== AsyncStatus.Loading) {
      window.dispatchEvent(new CustomEvent(VOICE_PLAY_EVENT, { detail: { id: eventId ?? '' } }));
      autoPlayRef.current = true;
      loadSrc();
    }
  }, [srcState, playing, setPlaying, loadSrc, eventId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      if (id === (eventId ?? '')) return;
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      setCurrentTime(0);
    };
    window.addEventListener(VOICE_PLAY_EVENT, handler);
    return () => window.removeEventListener(VOICE_PLAY_EVENT, handler);
  }, [eventId]);

  // entry point for the voice-message queue to start playback of this message
  const playFromQueue = useCallback(() => {
    if (srcState.status === AsyncStatus.Success) {
      audioRef.current?.play();
    } else if (srcState.status !== AsyncStatus.Loading) {
      autoPlayRef.current = true;
      loadSrc();
    }
  }, [srcState, loadSrc]);

  // keep a stable reference so the queue registration below doesn't need to
  // re-run (and reorder) every time srcState changes
  const playFromQueueRef = useRef(playFromQueue);
  playFromQueueRef.current = playFromQueue;

  // once the source finishes loading, (re)load the element and continue
  // playback if it was requested before the source was ready
  useEffect(() => {
    const el = audioRef.current;
    if (!el || srcState.status !== AsyncStatus.Success) return;
    el.load();
    if (autoPlayRef.current) {
      autoPlayRef.current = false;
      el.play();
    }
  }, [srcState]);

  // join the sequential autoplay queue for this message group. Registers
  // once per message (stable eventId/groupId) so playback order matches
  // the order messages were rendered in, regardless of load state changes.
  useEffect(() => {
    if (!voiceQueue || !eventId || !groupId) return undefined;
    return voiceQueue.register(groupId, eventId, () => playFromQueueRef.current());
  }, [voiceQueue, eventId, groupId]);

  const handleEnded = useCallback(() => {
    if (voiceQueue && eventId && groupId) voiceQueue.notifyEnded(groupId, eventId);
  }, [voiceQueue, eventId, groupId]);

  const safeDuration = duration > 0 ? duration : 1;
  const safeCurrent = Math.min(Math.max(currentTime, 0), safeDuration);
  const progress = safeDuration > 0 ? (safeCurrent / safeDuration) * 100 : 0;

  const trackRef = useRef<HTMLDivElement | null>(null);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio =
        rect.width > 0 ? Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) : 0;
      seek(ratio * safeDuration);
    },
    [seek, safeDuration]
  );

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      ensureLoaded();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      seekFromClientX(e.clientX);
    },
    [ensureLoaded, seekFromClientX]
  );

  const handleTrackPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.buttons & 1) === 0) return;
      seekFromClientX(e.clientX);
    },
    [seekFromClientX]
  );

  // MSC1767 waveform values are 0-1024. Normalize relative to the loudest
  // sample so quiet recordings still produce a visible waveform, with a
  // floor so silent stretches stay faintly visible. Then resample to
  // getTargetBarCount(duration) so every bar is BAR_WIDTH px wide regardless
  // of how many samples the sender provided or how wide this bubble is.
  const waveformBars = useMemo(() => {
    if (!waveform || waveform.length === 0) return undefined;
    const max = Math.max(...waveform, 1);
    const normalized = waveform.map((v) => Math.max(v / max, 0.08));
    return resampleWaveform(normalized, getTargetBarCount(duration));
  }, [waveform, duration]);

  const timeText = `${secondsToMinutesAndSeconds(currentTime)} / ${secondsToMinutesAndSeconds(
    duration
  )}`;

  const footerCtx = useBubbleFooterContext();

  useEffect(() => {
    footerCtx?.setExtraText(timeText);
  }, [footerCtx, timeText]);

  useEffect(() => {
    if (!footerCtx) return undefined;
    return () => footerCtx.setExtraText(undefined);
  }, [footerCtx]);

  return (
    <Box
      alignItems="Center"
      gap="300"
      className={css.VoiceContainer}
      style={{ width: toRem(getVoiceWidth(duration)) }}
      onClick={handlePlay}
    >
      <Box direction="Column" alignItems="Center" gap="100" shrink="No">
        <button
          type="button"
          className={isOwn ? css.VoicePlayButtonOwn : css.VoicePlayButtonIncoming}
          onClick={(e) => {
            e.stopPropagation();
            handlePlay();
          }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {srcState.status === AsyncStatus.Loading || loading ? (
            <Spinner variant="Secondary" size="600" style={{ width: toRem(ICON_SIZE), height: toRem(ICON_SIZE) }} />
          ) : playing ? (
            <PauseIcon size={ICON_SIZE} />
          ) : (
            <PlayIcon size={ICON_SIZE} />
          )}
        </button>
        {!footerCtx && (
          <Text className={css.VoiceTimeText} size="T200">
            {timeText}
          </Text>
        )}
      </Box>
      <Box
        grow="Yes"
        alignItems="Center"
        className={css.VoiceTrackWrapper}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div
          ref={trackRef}
          className={css.VoiceRangeTrack}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
        >
          {waveformBars ? (
            <div className={css.VoiceWaveform}>
              {waveformBars.map((amp, i) => {
                const barPos =
                  waveformBars.length <= 1 ? 100 : (i / (waveformBars.length - 1)) * 100;
                // Resting state (playback at start: never played, reset, or ended)
                // is fully filled. Once playback advances, bars fill up to the
                // current position — so play empties them and fills from the start,
                // and pausing mid-track keeps the current progress. Starting another
                // message resets this one to position 0 → fully filled again.
                const atStart = progress <= 0;
                const filled = atStart || barPos <= progress;
                return (
                  <div
                    key={i}
                    className={filled ? css.VoiceWaveformBarPlayed : css.VoiceWaveformBarUnplayed}
                    style={{ height: `${Math.round(amp * 100)}%` }}
                  />
                );
              })}
            </div>
          ) : (
            <>
              <div className={css.VoiceRangeTrackBg} />
              <div
                className={css.VoiceRangeTrackFill}
                style={{ width: `${progress <= 0 ? 100 : progress}%` }}
              />
            </>
          )}
        </div>
      </Box>
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (d && isFinite(d)) setDuration(d);
        }}
      >
        {srcState.status === AsyncStatus.Success && <source src={srcState.data} type={mimeType} />}
      </audio>
    </Box>
  );
}
