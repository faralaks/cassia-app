import React, { ReactNode } from 'react';
import { motion, useReducedMotion, type PanInfo } from 'motion/react';
import { ScreenSize, useScreenSizeContext } from '../hooks/useScreenSize';

// Drag distance / velocity past which a downward swipe dismisses the surface.
const DISMISS_DISTANCE = 64;
const DISMISS_VELOCITY = 400;

type SwipeToDismissProps = {
  onDismiss: () => void;
  children: ReactNode;
};

// Wraps a full-screen mobile surface so a downward swipe dismisses it. On
// desktop/tablet it renders the children untouched (no drag), keeping the
// existing modal behavior intact.
export function SwipeToDismiss({ onDismiss, children }: SwipeToDismissProps) {
  const screenSize = useScreenSizeContext();
  const reduceMotion = useReducedMotion();

  if (screenSize !== ScreenSize.Mobile) {
    return children;
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > DISMISS_VELOCITY) {
      onDismiss();
    }
  };

  return (
    <motion.div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        // Mark as a gesture surface so the page touchmove-guard lets the drag
        // through and the browser doesn't hijack the vertical gesture.
        touchAction: 'pan-y',
      }}
      drag="y"
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: 0 }}
      // 1:1 downward follow (no resistance) so a short swipe from anywhere on
      // the surface registers without having to pull from the very top.
      dragElastic={{ top: 0, bottom: 1 }}
      onDragEnd={handleDragEnd}
      transition={reduceMotion ? { duration: 0 } : undefined}
    >
      {children}
    </motion.div>
  );
}
