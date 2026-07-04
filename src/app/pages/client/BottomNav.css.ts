import { style } from '@vanilla-extract/css';
import { recipe, RecipeVariants } from '@vanilla-extract/recipes';
import { color, config, DefaultReset, toRem } from 'folds';

export const BottomNav = style([
  DefaultReset,
  {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    // Compact bar: 48px of content + the shared bottom inset (half the
    // home-indicator safe area, zero while the keyboard is open). The old
    // 56px + full inset pushed the icons up against the top border and left
    // a large dead band underneath.
    height: toRem(48),
    paddingBottom: 'var(--bottom-bar-inset, 0px)',
    backgroundColor: color.Background.Container,
    borderTop: `${config.borderWidth.B300} solid ${color.Background.ContainerLine}`,
    color: color.Background.OnContainer,
    zIndex: config.zIndex.Z100,
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
      color: color.Background.OnContainer,
      // Subtle press feedback (matches chat list rows).
      transition: 'transform 120ms ease, background-color 120ms ease',

      selectors: {
        '&:active': {
          backgroundColor: color.Background.ContainerActive,
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
