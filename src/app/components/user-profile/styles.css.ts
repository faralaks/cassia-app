import { style } from '@vanilla-extract/css';
import { color, config, toRem } from 'folds';

export const UserHeader = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1,
  padding: config.space.S200,
});

export const UserHero = style({
  position: 'relative',
});

export const UserHeroCoverContainer = style({
  height: toRem(96),
  overflow: 'hidden',
});
export const UserHeroCover = style({
  height: '100%',
  width: '100%',
  objectFit: 'cover',
  filter: 'blur(16px)',
  transform: 'scale(2)',
});

export const UserHeroAvatarContainer = style({
  position: 'relative',
  height: toRem(29),
});
export const UserAvatarContainer = style({
  position: 'absolute',
  left: config.space.S400,
  top: 0,
  transform: 'translateY(-50%)',
  backgroundColor: color.Surface.Container,
});
export const UserHeroAvatar = style({
  boxShadow: `0 0 0 ${config.borderWidth.B600} ${color.Surface.Container}`,
  selectors: {
    'button&': {
      cursor: 'pointer',
    },
  },
});
export const UserHeroAvatarImg = style({
  selectors: {
    [`button${UserHeroAvatar}:hover &`]: {
      filter: 'brightness(0.5)',
    },
  },
});

export const AvatarEditButton = style({
  position: 'absolute',
  right: 0,
  bottom: 0,
  transform: 'translate(15%, 15%)',
  zIndex: 2,
  borderRadius: config.radii.Pill,
  backgroundColor: color.Surface.Container,
  boxShadow: `0 0 0 ${config.borderWidth.B300} ${color.Surface.ContainerLine}`,
});
