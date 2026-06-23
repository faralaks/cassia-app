import { globalStyle, style } from '@vanilla-extract/css';
import { DefaultReset, color, toRem } from 'folds';
import { MOBILE_BREAKPOINT } from '../../../hooks/useScreenSize';

export const VoiceContainer = style([
  DefaultReset,
  {
    width: '100%',
    maxWidth: '100%',
    cursor: 'pointer',

    '@media': {
      // Voice messages are oversized on phones — scale the whole player down
      // ~30% proportionally (keeps the px-based waveform math intact), anchored
      // to the start edge, and reclaim the freed layout width.
      [`screen and (max-width: ${MOBILE_BREAKPOINT}px)`]: {
        transform: 'scale(0.7)',
        transformOrigin: 'left center',
        marginRight: '-30%',
      },
    },
  },
]);

const VoicePlayButtonBase = style([
  DefaultReset,
  {
    flexShrink: 0,
    width: toRem(46),
    height: toRem(46),
    borderRadius: '50%',
    padding: 0,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    transition: 'background-color 100ms ease',
  },
]);

export const VoicePlayButtonOwn = style([
  VoicePlayButtonBase,
  {
    color: `var(--bubble-outgoing-bg, ${color.Primary.Container})`,
  },
]);

export const VoicePlayButtonIncoming = style([
  VoicePlayButtonBase,
  {
    color: `var(--bubble-incoming-bg, ${color.SurfaceVariant.Container})`,
  },
]);

globalStyle(`${VoicePlayButtonOwn}:hover, ${VoicePlayButtonIncoming}:hover`, {
  backgroundColor: 'rgba(255, 255, 255, 1)',
});
globalStyle(`${VoicePlayButtonOwn}:active, ${VoicePlayButtonIncoming}:active`, {
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
});

export const VoiceTrackWrapper = style({
  cursor: 'pointer',
});

export const VoiceRangeTrack = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: toRem(28),
  cursor: 'pointer',
  touchAction: 'none',
});

export const VoiceWaveform = style({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  pointerEvents: 'none',
});

// Fixed-width bars so all voice messages look visually consistent regardless
// of bubble width or original waveform sample count. Width here must match
// BAR_WIDTH in AudioContent.tsx.
const VoiceWaveformBarBase = style({
  flexShrink: 0,
  flexGrow: 0,
  width: '3px',
  borderRadius: '2px',
});

export const VoiceWaveformBarPlayed = style([
  VoiceWaveformBarBase,
  {
    backgroundColor: 'currentColor',
    opacity: 0.9,
  },
]);

export const VoiceWaveformBarUnplayed = style([
  VoiceWaveformBarBase,
  {
    backgroundColor: 'currentColor',
    opacity: 0.3,
  },
]);

export const VoiceRangeTrackBg = style({
  position: 'absolute',
  left: 0,
  right: 0,
  height: toRem(3),
  borderRadius: toRem(2),
  backgroundColor: 'color-mix(in srgb, currentColor 22%, transparent)',
});

export const VoiceRangeTrackFill = style({
  position: 'absolute',
  left: 0,
  height: toRem(3),
  borderRadius: toRem(2),
  backgroundColor: 'currentColor',
  opacity: 0.8,
  pointerEvents: 'none',
});

export const VoiceTimeText = style({
  opacity: 0.4,
  fontVariantNumeric: 'tabular-nums',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  fontSize: toRem(11),
  textAlign: 'center',
});

export const VoiceTimeRow = style({
  paddingLeft: toRem(58),
});
