import { globalStyle, style } from '@vanilla-extract/css';
import { DefaultReset, config, toRem } from 'folds';
import { MOBILE_BREAKPOINT } from '../../../hooks/useScreenSize';

export const MessageBase = style({
  position: 'relative',
  outline: 'none',
});
export const MessageBaseBubbleCollapsed = style({
  paddingTop: 0,
});

/*
 * Mobile bottom-corner bubble tails, Telegram-style: a wedge growing out of
 * the bottom outer corner — left for incoming, right for outgoing — only on
 * the LAST message of a sender group. "Last of group" is pure CSS: a row NOT
 * immediately followed by a collapsed continuation row. The wedge sits fully
 * outside the bubble so the semi-transparent bubble colors don't double up,
 * and the adjacent corner is squared so the two shapes read as one.
 */
const MOBILE = `screen and (max-width: ${MOBILE_BREAKPOINT}px)`;
const lastOfGroup = `.${MessageBase}:not(:has(+ .${MessageBaseBubbleCollapsed}))`;

globalStyle(`${lastOfGroup} [data-bubble='own']`, {
  '@media': {
    [MOBILE]: {
      borderBottomRightRadius: toRem(2),
    },
  },
});
globalStyle(`${lastOfGroup} [data-bubble='own']::after`, {
  '@media': {
    [MOBILE]: {
      content: '""',
      position: 'absolute',
      right: toRem(-8),
      bottom: 0,
      width: 0,
      height: 0,
      borderTop: `${toRem(9)} solid transparent`,
      borderLeft: `${toRem(8)} solid var(--bubble-outgoing-bg, rgba(70, 90, 180, 0.85))`,
    },
  },
});
globalStyle(`${lastOfGroup} [data-bubble='in']`, {
  '@media': {
    [MOBILE]: {
      borderBottomLeftRadius: toRem(2),
    },
  },
});
globalStyle(`${lastOfGroup} [data-bubble='in']::after`, {
  '@media': {
    [MOBILE]: {
      content: '""',
      position: 'absolute',
      left: toRem(-8),
      bottom: 0,
      width: 0,
      height: 0,
      borderTop: `${toRem(9)} solid transparent`,
      borderRight: `${toRem(8)} solid var(--bubble-incoming-bg, rgba(60, 60, 80, 0.85))`,
    },
  },
});

export const MessageOptionsBase = style([
  DefaultReset,
  {
    position: 'absolute',
    top: toRem(-30),
    right: 0,
    zIndex: 1,
    opacity: 0,
    pointerEvents: 'none',
  },
]);
export const MessageOptionsBar = style([
  DefaultReset,
  {
    padding: config.space.S100,
  },
]);

export const BubbleAvatarBase = style({
  paddingTop: 0,
});

export const MessageAvatar = style({
  cursor: 'pointer',
});

export const MessageQuickReaction = style({
  minWidth: toRem(32),
});

export const MessageMenuGroup = style({
  padding: config.space.S100,
});

export const MessageMenuItemText = style({
  flexGrow: 1,
});

export const ReactionsContainer = style({
  selectors: {
    '&:empty': {
      display: 'none',
    },
  },
});

export const ReactionsTooltipText = style({
  wordBreak: 'break-word',
});
