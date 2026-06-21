import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { color, config, toRem } from 'folds';

export const MembersDrawer = style({
  width: toRem(266),
});

export const MembersDrawerHeader = style({
  flexShrink: 0,
  padding: `0 ${config.space.S200} 0 ${config.space.S300}`,
  borderBottomWidth: config.borderWidth.B300,
});

export const MemberDrawerContentBase = style({
  position: 'relative',
  overflow: 'hidden',
});

export const MemberDrawerContent = style({
  padding: `${config.space.S200} 0`,
});

const ScrollBtnAnime = keyframes({
  '0%': {
    transform: `translate(-50%, -100%) scale(0)`,
  },
  '100%': {
    transform: `translate(-50%, 0) scale(1)`,
  },
});

export const DrawerScrollTop = style({
  position: 'absolute',
  top: config.space.S200,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1,
  animation: `${ScrollBtnAnime} 100ms`,
});

export const DrawerGroup = style({
  paddingLeft: config.space.S200,
});

export const MembersGroup = style({
  paddingLeft: config.space.S200,
});
export const MembersGroupLabel = style({
  padding: config.space.S200,
  selectors: {
    '&:not(:first-child)': {
      paddingTop: config.space.S500,
    },
  },
});

export const DrawerVirtualItem = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
});

export const OpacitySlider = style({
  flex: 1,
  height: toRem(4),
  borderRadius: toRem(2),
  outline: 'none',
  cursor: 'pointer',
  WebkitAppearance: 'none' as any,
  border: 'none',
});

globalStyle(`${OpacitySlider}::-webkit-slider-thumb`, {
  WebkitAppearance: 'none' as any,
  width: toRem(14),
  height: toRem(14),
  borderRadius: '50%',
  backgroundColor: color.Primary.Main,
  cursor: 'pointer',
  border: 'none',
  boxShadow: `0 0 0 2px ${color.Primary.Container}`,
});

globalStyle(`${OpacitySlider}::-webkit-slider-runnable-track`, {
  height: toRem(4),
  borderRadius: toRem(2),
});
