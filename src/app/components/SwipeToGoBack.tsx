import React from 'react';
import { motion, useReducedMotion, type PanInfo } from 'motion/react';
import { ScreenSize, useScreenSizeContext } from '../hooks/useScreenSize';

// Drag distance / velocity past which a rightward swipe navigates back.
const BACK_DISTANCE = 80;
const BACK_VELOCITY = 400;
// Width of the left-edge zone that starts the gesture (iOS-style edge swipe).
const EDGE_WIDTH = 24;

type SwipeToGoBackProps = {
  onBack: () => void;
};

// iOS-style "swipe from the left edge to go back" gesture for mobile. Renders a
// thin, transparent strip pinned to the left edge of the nearest positioned
// ancestor, so the gesture never interferes with scrolling or horizontal
// content. Renders nothing on desktop/tablet.
export function SwipeToGoBack({ onBack }: SwipeToGoBackProps) {
  const screenSize = useScreenSizeContext();
  const reduceMotion = useReducedMotion();

  if (screenSize !== ScreenSize.Mobile) {
    return null;
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > BACK_DISTANCE || info.velocity.x > BACK_VELOCITY) {
      onBack();
    }
  };

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: EDGE_WIDTH,
        height: '100%',
        zIndex: 1,
        touchAction: 'pan-y',
      }}
      drag="x"
      dragSnapToOrigin
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.8 }}
      onDragEnd={handleDragEnd}
      transition={reduceMotion ? { duration: 0 } : undefined}
    />
  );
}
