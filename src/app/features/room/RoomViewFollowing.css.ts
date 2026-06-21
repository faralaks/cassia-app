import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { DefaultReset, color, config, toRem } from 'folds';

export const RoomViewFollowingPlaceholder = style([
  DefaultReset,
  {
    height: toRem(28),
  },
]);

// Compact, transparent variant used inside the room header (under the name)
// instead of the old full-width bar at the bottom of the timeline.
export const RoomViewFollowingInline = style([
  DefaultReset,
  {
    maxWidth: '100%',
    background: 'none',
    outline: 'none',
    opacity: 0.6,
    cursor: 'pointer',
    selectors: {
      '&:hover, &:focus-visible': {
        opacity: 1,
        color: color.Primary.Main,
      },
      '&:active': {
        color: color.Primary.Main,
      },
    },
  },
]);

export const RoomViewFollowing = recipe({
  base: [
    DefaultReset,
    {
      minHeight: toRem(28),
      padding: `0 ${config.space.S400}`,
      width: '100%',
      backgroundColor: color.Surface.Container,
      color: color.Surface.OnContainer,
      outline: 'none',
    },
  ],
  variants: {
    clickable: {
      true: {
        cursor: 'pointer',
        selectors: {
          '&:hover, &:focus-visible': {
            color: color.Primary.Main,
          },
          '&:active': {
            color: color.Primary.Main,
          },
        },
      },
    },
  },
});
