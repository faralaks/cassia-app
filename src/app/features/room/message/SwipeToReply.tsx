import React, { ReactNode } from 'react';
import { motion, useReducedMotion, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import { Icon, Icons } from 'folds';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';

// Drag distance (leftward) past which the swipe triggers a reply.
const REPLY_THRESHOLD = 64;

type SwipeToReplyProps = {
  onReply: () => void;
  children: ReactNode;
};

// Wraps a message row so a left swipe drags it leftward (revealing a reply
// icon) and, past the threshold, sets it as the reply draft before snapping
// back. Mobile only; on desktop the children render untouched.
export function SwipeToReply({ onReply, children }: SwipeToReplyProps) {
  const screenSize = useScreenSizeContext();
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  // Reply icon fades/scales in as the row is dragged left toward the threshold.
  const iconOpacity = useTransform(x, [-REPLY_THRESHOLD, -REPLY_THRESHOLD / 3, 0], [1, 0.4, 0]);
  const iconScale = useTransform(x, [-REPLY_THRESHOLD, 0], [1, 0.6]);

  if (screenSize !== ScreenSize.Mobile) {
    return children;
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -REPLY_THRESHOLD) onReply();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Reply affordance revealed under the row on the right as it slides left. */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          opacity: iconOpacity,
          scale: iconScale,
          pointerEvents: 'none',
        }}
      >
        <Icon src={Icons.ReplyArrow} size="200" />
      </motion.div>
      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        drag="x"
        dragDirectionLock
        dragSnapToOrigin
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.7, right: 0 }}
        onDragEnd={handleDragEnd}
        transition={
          reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 600, damping: 40 }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
