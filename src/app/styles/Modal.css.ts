import { style } from '@vanilla-extract/css';
import { MOBILE_BREAKPOINT } from '../hooks/useScreenSize';

export const ModalWide = style({
  minWidth: '85vw',
  minHeight: '90vh',

  '@media': {
    // Full-screen on phones so the image viewer reads as a native lightbox
    // rather than a floating card.
    [`screen and (max-width: ${MOBILE_BREAKPOINT}px)`]: {
      width: '100vw',
      height: '100dvh',
      minWidth: '100vw',
      minHeight: '100dvh',
      maxWidth: '100vw',
      maxHeight: '100dvh',
      borderRadius: 0,
    },
  },
});
