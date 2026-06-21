import { keyframes, style } from '@vanilla-extract/css';
import { DefaultReset, color, config, toRem } from 'folds';

export const VoiceRecordingBar = style([
  DefaultReset,
  {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S300,
    padding: `${toRem(11)} ${toRem(13)}`,
    minHeight: toRem(48),
  },
]);

const pulse = keyframes({
  '0%': { opacity: 1 },
  '50%': { opacity: 0.25 },
  '100%': { opacity: 1 },
});

export const RecordingDot = style([
  DefaultReset,
  {
    flexShrink: 0,
    width: toRem(10),
    height: toRem(10),
    borderRadius: '50%',
    backgroundColor: color.Critical.Main,
    animation: `${pulse} 1.4s ease-in-out infinite`,
  },
]);

export const RecordingTime = style([
  DefaultReset,
  {
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
]);

export const Waveform = style([
  DefaultReset,
  {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    height: toRem(28),
    overflow: 'hidden',
  },
]);

// Fixed thin bars matching the chat voice-message playback (BAR_WIDTH = 3px).
export const WaveformBar = style([
  DefaultReset,
  {
    flexShrink: 0,
    flexGrow: 0,
    width: '3px',
    minHeight: '2px',
    borderRadius: '2px',
    backgroundColor: color.SurfaceVariant.OnContainer,
    opacity: 0.6,
  },
]);
