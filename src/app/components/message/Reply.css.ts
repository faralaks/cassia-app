import { style } from '@vanilla-extract/css';
import { config, toRem } from 'folds';

export const ReplyBend = style({
  flexShrink: 0,
});

export const ThreadIndicator = style({
  opacity: config.opacity.P300,

  selectors: {
    'button&': {
      cursor: 'pointer',
    },
    ':hover&': {
      opacity: config.opacity.P500,
    },
  },
});

export const Reply = style({
  borderLeft: `${toRem(3)} solid transparent`,
  borderRadius: `0 ${config.radii.R300} ${config.radii.R300} 0`,
  paddingLeft: config.space.S200,
  paddingTop: toRem(4),
  paddingBottom: toRem(4),
  marginBottom: config.space.S100,
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  minWidth: 0,
  maxWidth: '100%',

  selectors: {
    'button&': {
      cursor: 'pointer',
    },
    'button&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
    },
  },
});

export const ReplyContent = style({
  opacity: 0.75,
  color: 'inherit',
});
