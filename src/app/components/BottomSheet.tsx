import React, { ReactNode } from 'react';
import { motion, useReducedMotion, type PanInfo } from 'motion/react';
import { color, toRem } from 'folds';

// Drag distance / velocity past which a downward swipe dismisses the sheet.
const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 500;

/**
 * Bottom-anchored counterpart to folds' OverlayCenter, for mobile sheet
 * presentation: place inside an <Overlay> and put a BottomSheet in it.
 *
 * Sized with --app-height (the visual viewport, kept by setupViewportHeight)
 * instead of the layout viewport, so when the iOS keyboard opens the sheet
 * rides up above it like a native sheet instead of being covered.
 */
export function OverlayBottom({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--app-height, 100dvh)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {children}
    </div>
  );
}

type BottomSheetProps = {
  onDismiss: () => void;
  children: ReactNode;
};

/**
 * Native-feeling mobile bottom sheet: slides up from the screen edge, shows a
 * grabber, and a downward drag (or flick) dismisses it. The visual chrome
 * (background, rounded top corners, safe-area padding) belongs to the child
 * dialog — this wrapper only does presentation and gestures. Desktop dialogs
 * should keep using OverlayCenter; this is for ScreenSize.Mobile.
 */
export function BottomSheet({ onDismiss, children }: BottomSheetProps) {
  const reduceMotion = useReducedMotion();

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) {
      onDismiss();
    }
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { y: '100%' }}
      animate={{ y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 40 }}
      drag="y"
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: 0 }}
      // 1:1 downward follow, no upward overdrag.
      dragElastic={{ top: 0, bottom: 1 }}
      onDragEnd={handleDragEnd}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        // Gesture surface: lets the page touchmove-guard pass vertical drags.
        touchAction: 'pan-y',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: toRem(8),
          left: '50%',
          transform: 'translateX(-50%)',
          width: toRem(36),
          height: toRem(4),
          borderRadius: toRem(2),
          backgroundColor: color.Surface.ContainerLine,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      {children}
    </motion.div>
  );
}
