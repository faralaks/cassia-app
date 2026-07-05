import { useCallback } from 'react';
import { NavigateOptions, To, useNavigate } from 'react-router-dom';
import { ScreenSize, useScreenSizeContext } from './useScreenSize';

export type VtDirection = 'forward' | 'back' | 'fade';

const supportsViewTransitions = (): boolean =>
  typeof document !== 'undefined' && typeof document.startViewTransition === 'function';

let vtCleanupTimer: number | undefined;

// Remove the direction attributes right after the ~280ms slide finishes.
// They used to stay on <html> forever, so any later view transition (e.g. a
// follow-up router navigation) replayed the slide animation on an unchanged
// screen — the "double animation" jerk after swiping back. Once cleared,
// stray transitions fall back to an imperceptible cross-fade.
const scheduleVtCleanup = () => {
  window.clearTimeout(vtCleanupTimer);
  vtCleanupTimer = window.setTimeout(() => {
    document.documentElement.removeAttribute('data-vt-mobile');
    document.documentElement.removeAttribute('data-vt');
  }, 400);
};

/**
 * Navigate with a native-feeling slide transition on mobile.
 *
 * Sets `data-vt-mobile` + `data-vt` (direction) on <html> so the CSS
 * ::view-transition rules in index.css animate the screen slide, then hands off
 * to React Router with `viewTransition: true`. On desktop, unsupported
 * browsers, or when reduced motion makes the CSS a no-op, it just navigates —
 * fully progressive-enhanced.
 */
export const useMobileViewTransitionNavigate = () => {
  const navigate = useNavigate();
  const screenSize = useScreenSizeContext();

  return useCallback(
    (to: To | number, direction: VtDirection = 'forward', options: NavigateOptions = {}) => {
      const animate = screenSize === ScreenSize.Mobile && supportsViewTransitions();

      if (animate) {
        const html = document.documentElement;
        html.setAttribute('data-vt-mobile', '');
        html.setAttribute('data-vt', direction);
        scheduleVtCleanup();
      }

      if (typeof to === 'number') {
        navigate(to);
        return;
      }
      navigate(to, animate ? { ...options, viewTransition: true } : options);
    },
    [navigate, screenSize]
  );
};
