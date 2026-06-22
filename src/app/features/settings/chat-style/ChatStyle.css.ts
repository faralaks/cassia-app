import { style } from '@vanilla-extract/css';
import { color, toRem } from 'folds';
import { MOBILE_BREAKPOINT } from '../../../hooks/useScreenSize';

export const RangeSlider = style({
  flexGrow: 1,
  margin: 0,
  height: toRem(20),
  background: 'transparent',
  cursor: 'pointer',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',

  selectors: {
    '&::-webkit-slider-runnable-track': {
      height: toRem(4),
      borderRadius: toRem(2),
      background: color.SurfaceVariant.ContainerLine,
    },
    '&::-moz-range-track': {
      height: toRem(4),
      borderRadius: toRem(2),
      background: color.SurfaceVariant.ContainerLine,
    },
    '&::-webkit-slider-thumb': {
      WebkitAppearance: 'none',
      appearance: 'none',
      width: toRem(16),
      height: toRem(16),
      marginTop: toRem(-6),
      borderRadius: '50%',
      background: color.Primary.Main,
      border: `2px solid ${color.Surface.Container}`,
      cursor: 'pointer',
    },
    '&::-moz-range-thumb': {
      width: toRem(16),
      height: toRem(16),
      borderRadius: '50%',
      background: color.Primary.Main,
      border: `2px solid ${color.Surface.Container}`,
      cursor: 'pointer',
    },
    '&:disabled': {
      cursor: 'default',
    },
    '&:disabled::-webkit-slider-thumb': {
      background: color.SurfaceVariant.ContainerLine,
    },
    '&:disabled::-moz-range-thumb': {
      background: color.SurfaceVariant.ContainerLine,
    },
  },
});

export const ColorSwatchGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(9, ' + toRem(24) + ')',
  gap: toRem(8),
});

export const ColorSwatch = style({
  width: toRem(24),
  height: toRem(24),
  borderRadius: '50%',
  cursor: 'pointer',
  padding: 0,
  outline: 'none',
  border: '2px solid transparent',
  transition: 'transform 0.1s ease',

  selectors: {
    '&:hover': {
      transform: 'scale(1.1)',
    },
  },
});

export const ColorSwatchActive = style({
  border: `2px solid ${color.SurfaceVariant.OnContainer}`,
});

export const HexSwatch = style({
  width: toRem(28),
  height: toRem(28),
  borderRadius: toRem(6),
  flexShrink: 0,
  border: '1px solid rgba(255, 255, 255, 0.2)',
});

export const HexInput = style({
  width: toRem(96),
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: toRem(8),
  padding: `${toRem(6)} ${toRem(10)}`,
  color: 'inherit',
  fontSize: toRem(13),
  fontFamily: 'monospace',
  outline: 'none',
});

export const SectionDivider = style({
  height: 1,
  background: 'rgba(255, 255, 255, 0.08)',
});

// Background row: image + "Upload image" chip + Dim slider in one line on
// desktop. On mobile the line would overflow (slider runs off the edge, chip
// wraps), so the slider drops onto its own full-width line below.
export const BackgroundRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: toRem(12),
  flexWrap: 'wrap',
});

export const BackgroundDim = style({
  display: 'flex',
  alignItems: 'center',
  gap: toRem(8),
  flexGrow: 1,
  minWidth: toRem(160),

  '@media': {
    [`screen and (max-width: ${MOBILE_BREAKPOINT}px)`]: {
      // Force onto its own line, full width, under the image/upload controls.
      flexBasis: '100%',
    },
  },
});
