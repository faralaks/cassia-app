import { keyframes, style } from '@vanilla-extract/css';
import { DefaultReset, color, config, toRem } from 'folds';

export const Controls = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S100,
  },
]);

// Compact live mic-input meter for the chat header (rolling bars, like the
// voice-message waveform but sized small to fit the header).
export const MicMeter = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    height: toRem(28),
    padding: `0 ${toRem(4)}`,
  },
]);

export const MicMeterBar = style([
  DefaultReset,
  {
    flexShrink: 0,
    width: '3px',
    minHeight: '2px',
    borderRadius: '2px',
    backgroundColor: color.Primary.Main,
    opacity: 0.9,
    transition: 'height 60ms linear',
  },
]);

export const MicMeterBarMuted = style({
  backgroundColor: color.SurfaceVariant.OnContainer,
  opacity: 0.35,
});

const pulse = keyframes({
  '0%': { opacity: 1 },
  '50%': { opacity: 0.3 },
  '100%': { opacity: 1 },
});

export const StatusIndicator = style([
  DefaultReset,
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: config.space.S200,
    flexShrink: 0,
  },
]);

export const StatusDot = style([
  DefaultReset,
  {
    width: toRem(8),
    height: toRem(8),
    borderRadius: '50%',
    backgroundColor: color.Primary.Main,
    animation: `${pulse} 1.4s ease-in-out infinite`,
  },
]);
