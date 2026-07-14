import { style } from '@vanilla-extract/css';
import { recipe, RecipeVariants } from '@vanilla-extract/recipes';
import { color, config, DefaultReset, toRem } from 'folds';

export const BottomNav = style([
  DefaultReset,
  {
    flexShrink: 0,
    display: 'flex',
    // Transparent wrapper that reserves space and the bottom inset; the
    // visible bar is the floating pill inside, detached from the screen
    // edges like modern iOS tab bars (Telegram-style, minus the glass).
    padding: `${toRem(6)} ${toRem(12)} calc(${toRem(6)} + var(--bottom-bar-inset, 0px))`,
    zIndex: config.zIndex.Z100,
  },
]);

export const BottomNavPill = style([
  DefaultReset,
  {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    height: toRem(52),
    borderRadius: toRem(26),
    // Item press highlights are square; clip them to the pill shape.
    overflow: 'hidden',
    backgroundColor: color.Surface.Container,
    border: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
    color: color.Surface.OnContainer,
  },
]);

export const BottomNavItem = recipe({
  base: [
    DefaultReset,
    {
      flexGrow: 1,
      flexBasis: 0,
      minWidth: 0,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: toRem(2),
      cursor: 'pointer',
      color: color.Surface.OnContainer,
      // Subtle press feedback (matches chat list rows).
      transition: 'transform 120ms ease, background-color 120ms ease',

      selectors: {
        '&:active': {
          backgroundColor: color.Surface.ContainerActive,
          transform: 'scale(0.96)',
        },
      },
    },
  ],
  variants: {
    active: {
      true: {
        color: color.Primary.Main,
      },
    },
  },
});
export type BottomNavItemVariants = RecipeVariants<typeof BottomNavItem>;

export const BottomNavItemBadge = style([
  DefaultReset,
  {
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 1,
    top: toRem(4),
    left: 'calc(50% + 6px)',
    lineHeight: 0,
  },
]);
