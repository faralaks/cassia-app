import { style } from '@vanilla-extract/css';
import { MOBILE_BREAKPOINT } from '../hooks/useScreenSize';

// On mobile the centered card looks out of place — let the modal fill the
// screen so settings and other 500-modals read as full-screen views like the
// rest of the mobile UI.
export const Modal500Mobile = style({
  '@media': {
    [`screen and (max-width: ${MOBILE_BREAKPOINT}px)`]: {
      width: '100vw',
      height: '100dvh',
      maxWidth: '100vw',
      maxHeight: '100dvh',
      borderRadius: 0,
    },
  },
});
