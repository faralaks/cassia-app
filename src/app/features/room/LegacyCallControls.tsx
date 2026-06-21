import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Icon, Icons, IconButton, Text, Tooltip, TooltipProvider } from 'folds';
import { CallState, CallDirection } from 'matrix-js-sdk/lib/webrtc/call';
import { useRoom, useIsDirectRoom } from '../../hooks/useRoom';
import { useLegacyVoip } from '../../state/call/legacyVoip';
import { webRTCSupported } from '../../utils/rtc';
import { secondsToMinutesAndSeconds } from '../../utils/common';
import * as css from './LegacyCallControls.css';

const METER_BARS = 9;
// Gain applied to raw mic RMS so normal speech visibly moves the bars.
const LEVEL_GAIN = 5;

type MicMeterProps = {
  stream: MediaStream | null;
  muted: boolean;
};

// Compact rolling mic-input meter (newest sample on the right), mirroring the
// voice-message recording waveform but sized for the chat header.
function MicMeter({ stream, muted }: MicMeterProps) {
  const [levels, setLevels] = useState<number[]>(() => new Array(METER_BARS).fill(0));

  useEffect(() => {
    if (!stream || muted) {
      setLevels(new Array(METER_BARS).fill(0));
      return undefined;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const buf = new Uint8Array(analyser.fftSize);
    let raf = 0;
    let last = 0;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 60) return;
      last = t;

      analyser.getByteTimeDomainData(buf);
      let sumSq = 0;
      for (let i = 0; i < buf.length; i += 1) {
        const v = (buf[i] - 128) / 128;
        sumSq += v * v;
      }
      const rms = Math.min(Math.sqrt(sumSq / buf.length), 1);
      const level = Math.min(rms * LEVEL_GAIN, 1);
      setLevels((prev) => {
        const next = prev.slice(1);
        next.push(level);
        return next;
      });
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      analyser.disconnect();
      ctx.close().catch(() => undefined);
    };
  }, [stream, muted]);

  return (
    <div className={css.MicMeter} aria-hidden>
      {levels.map((level, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          className={classNames(css.MicMeterBar, muted && css.MicMeterBarMuted)}
          style={{ height: `${Math.max(Math.round(level * 100), 12)}%` }}
        />
      ))}
    </div>
  );
}

// Active-call status shown next to the recipient name in the header.
export function LegacyCallStatusIndicator() {
  const room = useRoom();
  const direct = useIsDirectRoom();
  const voip = useLegacyVoip();

  if (!direct || !voip.active || voip.roomId !== room.roomId) return null;

  let label: string;
  if (voip.state === CallState.Connected) {
    label = secondsToMinutesAndSeconds(voip.length);
  } else if (voip.direction === CallDirection.Outbound) {
    label = voip.state === CallState.InviteSent ? 'Ringing…' : 'Calling…';
  } else {
    label = 'Connecting…';
  }

  return (
    <span className={css.StatusIndicator}>
      <span className={css.StatusDot} />
      <Text as="span" size="T200" priority="300" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {label}
      </Text>
    </span>
  );
}

// Header call controls: a Call button when idle, swapping to
// [mic meter] [mute] [stop] (left-to-right) while a call is active in this room.
export function LegacyCallControls() {
  const room = useRoom();
  const direct = useIsDirectRoom();
  const voip = useLegacyVoip();

  if (!direct || !webRTCSupported()) return null;

  const activeHere = voip.active && voip.roomId === room.roomId;
  const busyElsewhere = voip.active && voip.roomId !== room.roomId;

  if (activeHere) {
    return (
      <span className={css.Controls}>
        <MicMeter stream={voip.localStream} muted={voip.muted} />
        <TooltipProvider
          position="Bottom"
          offset={4}
          tooltip={
            <Tooltip>
              <Text>{voip.muted ? 'Unmute' : 'Mute'}</Text>
            </Tooltip>
          }
        >
          {(triggerRef) => (
            <IconButton
              fill="None"
              ref={triggerRef}
              onClick={voip.toggleMute}
              aria-pressed={voip.muted}
              aria-label={voip.muted ? 'Unmute microphone' : 'Mute microphone'}
            >
              <Icon size="400" src={voip.muted ? Icons.MicMute : Icons.Mic} filled={voip.muted} />
            </IconButton>
          )}
        </TooltipProvider>
        <TooltipProvider
          position="Bottom"
          offset={4}
          tooltip={
            <Tooltip>
              <Text>End Call</Text>
            </Tooltip>
          }
        >
          {(triggerRef) => (
            <IconButton
              variant="Critical"
              fill="None"
              ref={triggerRef}
              onClick={voip.hangup}
              aria-label="End call"
            >
              <Icon size="400" src={Icons.PhoneDown} filled />
            </IconButton>
          )}
        </TooltipProvider>
      </span>
    );
  }

  return (
    <TooltipProvider
      position="Bottom"
      offset={4}
      tooltip={
        <Tooltip>
          <Text>{busyElsewhere ? 'Already in a call' : 'Audio Call'}</Text>
        </Tooltip>
      }
    >
      {(triggerRef) => (
        <IconButton
          fill="None"
          ref={triggerRef}
          onClick={() => voip.placeCall(room.roomId)}
          disabled={busyElsewhere}
          aria-label="Start audio call"
        >
          <Icon size="400" src={Icons.Phone} />
        </IconButton>
      )}
    </TooltipProvider>
  );
}
