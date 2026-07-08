import { createVar, globalStyle, keyframes, style, styleVariants } from '@vanilla-extract/css';
import { recipe, RecipeVariants } from '@vanilla-extract/recipes';
import { DefaultReset, color, config, toRem } from 'folds';
import { MOBILE_BREAKPOINT } from '../../../hooks/useScreenSize';

export const StickySection = style({
  position: 'sticky',
  top: config.space.S100,
});

const SpacingVar = createVar();
const SpacingVariant = styleVariants({
  '0': {
    vars: {
      [SpacingVar]: config.space.S0,
    },
  },
  '100': {
    vars: {
      [SpacingVar]: config.space.S100,
    },
  },
  '200': {
    vars: {
      [SpacingVar]: config.space.S200,
    },
  },
  '300': {
    vars: {
      [SpacingVar]: config.space.S300,
    },
  },
  '400': {
    vars: {
      [SpacingVar]: config.space.S400,
    },
  },
  '500': {
    vars: {
      [SpacingVar]: config.space.S500,
    },
  },
});

const highlightAnime = keyframes({
  '0%': { backgroundColor: 'transparent' },
  '12%': { backgroundColor: color.Primary.Container },
  '60%': { backgroundColor: color.Primary.Container },
  '100%': { backgroundColor: 'transparent' },
});
const HighlightVariant = styleVariants({
  true: {
    animation: `${highlightAnime} 2500ms ease-in-out`,
    animationIterationCount: '1',
    animationFillMode: 'forwards',
  },
});

const SelectedVariant = styleVariants({
  true: {
    backgroundColor: 'transparent',
  },
});

const AutoCollapse = style({
  selectors: {
    [`&+&`]: {
      marginTop: 0,
    },
  },
});

export const MessageBase = recipe({
  base: [
    DefaultReset,
    {
      marginTop: SpacingVar,
      padding: `${config.space.S100} ${config.space.S200} ${config.space.S100} ${config.space.S400}`,
      borderRadius: `0 ${config.radii.R400} ${config.radii.R400} 0`,

      '@media': {
        // On phones bubbles hug their own edge with a symmetric 8px inset —
        // exactly the width of the bottom-corner tails (message/styles.css.ts),
        // so on the last message of a group the tail tip touches the screen
        // edge instead of overflowing the scroller.
        [`screen and (max-width: ${MOBILE_BREAKPOINT}px)`]: {
          paddingLeft: toRem(8),
          paddingRight: toRem(8),
        },
      },
    },
  ],
  variants: {
    space: SpacingVariant,
    collapse: {
      true: {
        marginTop: 0,
      },
    },
    autoCollapse: {
      true: AutoCollapse,
    },
    highlight: HighlightVariant,
    selected: SelectedVariant,
  },
  defaultVariants: {
    space: '400',
  },
});

export type MessageBaseVariants = RecipeVariants<typeof MessageBase>;

export const CompactHeader = style([
  DefaultReset,
  StickySection,
  {
    maxWidth: toRem(170),
    width: '100%',
  },
]);

export const AvatarBase = style({
  paddingTop: toRem(4),
  transition: 'transform 200ms cubic-bezier(0, 0.8, 0.67, 0.97)',
  display: 'flex',
  alignSelf: 'start',

  selectors: {
    '&:hover': {
      transform: `translateY(${toRem(-2)})`,
    },
  },
});

export const ModernBefore = style({
  minWidth: toRem(36),
});

export const BubbleBefore = style({
  minWidth: toRem(36),
});

export const BubbleContent = style({
  maxWidth: toRem(800),
  paddingTop: config.space.S200,
  paddingLeft: config.space.S200,
  paddingRight: config.space.S200,
  paddingBottom: config.space.S200,
  backgroundColor: `var(--bubble-incoming-bg, rgba(60, 60, 80, 0.85))`,
  color: `var(--bubble-incoming-text, #ffffff)`,
  borderRadius: `var(--bubble-radius, ${config.radii.R500})`,
  position: 'relative',

  '@media': {
    // On phones cap the bubble at 75% of the row so it never spans the screen,
    // and shrink the message text a touch so long messages fit comfortably.
    // Also disable text selection / the iOS long-press callout so a tap-and-hold
    // opens the message menu instead of starting a selection.
    [`screen and (max-width: ${MOBILE_BREAKPOINT}px)`]: {
      // With the avatar gutter gone the row has the full width — cap a bit
      // higher so bubbles can use it (Telegram sits around ~80%).
      maxWidth: '80vw',
      fontSize: toRem(14),
      WebkitTouchCallout: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none',
    },
  },
});

export const BubbleContentArrowLeft = style({
  borderTopLeftRadius: 0,
});

export const BubbleLeftArrow = style({
  width: toRem(9),
  height: toRem(8),

  position: 'absolute',
  top: 0,
  left: toRem(-8),
  zIndex: 1,
});

export const BubbleContentOwn = style([
  BubbleContent,
  {
    backgroundColor: `var(--bubble-outgoing-bg, rgba(70, 90, 180, 0.85))`,
    color: `var(--bubble-outgoing-text, #ffffff)`,
    borderTopRightRadius: 0,

    '@media': {
      // No tail on mobile (it would overhang the hairline edge inset) — keep
      // the corner rounded like the rest of the bubble.
      [`screen and (max-width: ${MOBILE_BREAKPOINT}px)`]: {
        borderTopRightRadius: `var(--bubble-radius, ${config.radii.R500})`,
      },
    },
  },
]);

export const BubbleRightArrow = style({
  width: toRem(9),
  height: toRem(8),

  position: 'absolute',
  top: 0,
  right: toRem(-8),
  zIndex: 1,

  '@media': {
    [`screen and (max-width: ${MOBILE_BREAKPOINT}px)`]: {
      display: 'none',
    },
  },
});

globalStyle(`[data-selected="true"] .${BubbleContent}`, {
  filter: 'brightness(1.5)',
});

// On phones a long-press should only open the message menu — never start a text
// selection. Force selection/callout off on the whole bubble subtree (the
// rendered message HTML would otherwise re-enable it). Desktop keeps text
// selectable for copy.
globalStyle(`.${BubbleContent}, .${BubbleContent} *`, {
  '@media': {
    [`screen and (max-width: ${MOBILE_BREAKPOINT}px)`]: {
      WebkitUserSelect: 'none',
      userSelect: 'none',
      WebkitTouchCallout: 'none',
    },
  },
});

export const Username = style({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  userSelect: 'text',
  selectors: {
    'button&': {
      cursor: 'pointer',
    },
    'button&:hover, button&:focus-visible': {
      textDecoration: 'underline',
    },
  },
});

export const UsernameBold = style({
  fontWeight: 550,
});

export const MessageTextBody = recipe({
  base: {
    wordBreak: 'break-word',
    userSelect: 'text',
  },
  variants: {
    preWrap: {
      true: {
        whiteSpace: 'pre-wrap',
      },
    },
    jumboEmoji: {
      true: {
        fontSize: '1.504em',
        lineHeight: '1.4962em',
      },
    },
    emote: {
      true: {
        color: color.Success.Main,
        fontStyle: 'italic',
      },
    },
  },
});

export type MessageTextBodyVariants = RecipeVariants<typeof MessageTextBody>;
