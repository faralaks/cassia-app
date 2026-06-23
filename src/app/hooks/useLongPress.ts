import { useCallback, useRef } from 'react';

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 10; // px of finger movement that cancels the press

type LongPressHandlers = {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
};

/**
 * Fires `onLongPress(x, y)` after the user holds a touch still for ~450ms.
 * Movement beyond a small tolerance, or an early release, cancels it. Intended
 * to open a context menu on touch devices (where there is no right-click),
 * mirroring the desktop onContextMenu behavior.
 *
 * Note: pair with `user-select: none` / `-webkit-touch-callout: none` on the
 * target so iOS doesn't start a text selection during the hold.
 */
export const useLongPress = (onLongPress: (x: number, y: number) => void): LongPressHandlers => {
  const timer = useRef<number>();
  const start = useRef<{ x: number; y: number }>();

  const clear = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      start.current = { x: t.clientX, y: t.clientY };
      clear();
      timer.current = window.setTimeout(() => {
        timer.current = undefined;
        onLongPress(start.current?.x ?? t.clientX, start.current?.y ?? t.clientY);
      }, LONG_PRESS_MS);
    },
    [clear, onLongPress]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (!t || !start.current) return;
      const dx = Math.abs(t.clientX - start.current.x);
      const dy = Math.abs(t.clientY - start.current.y);
      if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) clear();
    },
    [clear]
  );

  return { onTouchStart, onTouchMove, onTouchEnd: clear, onTouchCancel: clear };
};
