import { keyframes, style } from '@vanilla-extract/css';
import { DefaultReset, color, config, toRem } from 'folds';

const slideIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-12px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

// Non-blocking floating card pinned top-center so the timeline stays usable
// (sending/receiving messages while ringing).
export const IncomingCallPrompt = style([
  DefaultReset,
  {
    position: 'fixed',
    top: toRem(16),
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: config.zIndex.Max,
    width: toRem(360),
    maxWidth: 'calc(100vw - 32px)',
    padding: config.space.S300,
    borderRadius: config.radii.R400,
    backgroundColor: color.SurfaceVariant.Container,
    color: color.SurfaceVariant.OnContainer,
    boxShadow: config.shadow.E400,
    animation: `${slideIn} 0.2s ease-out`,
  },
]);
