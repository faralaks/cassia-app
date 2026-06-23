/**
 * Locks the app to the visible viewport so the iOS keyboard moves only the
 * composer, never the page.
 *
 * On iOS the layout viewport does NOT shrink for the keyboard — instead the
 * keyboard overlays it and the *visual* viewport shrinks. Two things are needed
 * to make a chat composer behave like a native app:
 *
 *   1. Size the app to `visualViewport.height` via `--app-height` so the flex
 *      column shrinks (content area gives up space, composer rides up).
 *   2. Stop the page itself from scrolling/rubber-banding while the keyboard is
 *      up. `html, body { position: fixed; overflow: hidden }` plus blocking
 *      `touchmove` everywhere except inside an element that is actually
 *      scrollable does this — otherwise iOS lets you drag the whole page.
 *
 * Idempotent and framework-agnostic — call once at app startup.
 */
let installed = false;

// Decide whether to allow a touchmove (vs. block it to stop the page dragging).
// Allow it when the gesture starts inside something that legitimately consumes
// touch movement: a scrollable element, or a gesture surface that sets its own
// touch-action (motion draggables — swipe-to-reply, swipe-to-go-back, etc.).
const shouldAllowTouchMove = (start: EventTarget | null): boolean => {
  let node = start as HTMLElement | null;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const { overflowY } = style;
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight;
    if (canScroll) return true;
    // motion/draggable surfaces opt out of the browser's default touch handling
    // via touch-action; let those gestures through.
    if (style.touchAction && style.touchAction !== 'auto') return true;
    node = node.parentElement;
  }
  return false;
};

export function setupViewportHeight(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const root = document.documentElement;
  const vv = window.visualViewport;

  const apply = () => {
    const height = vv?.height ?? window.innerHeight;
    root.style.setProperty('--app-height', `${Math.round(height)}px`);
    // Undo any auto-scroll iOS applied to push content behind the keyboard.
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  };

  apply();

  if (vv) {
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
  } else {
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
  }

  // Block page-level touch dragging: allow a touchmove only when it starts
  // inside something that can actually scroll. This is what stops the whole
  // page from scrolling when the keyboard is open. Single-touch only so
  // pinch-zoom in the image viewer still works.
  let startTarget: EventTarget | null = null;
  document.addEventListener(
    'touchstart',
    (e) => {
      startTarget = e.touches.length === 1 ? e.target : null;
    },
    { passive: true }
  );
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length !== 1) return; // let multi-touch (zoom) through
      if (!shouldAllowTouchMove(startTarget)) e.preventDefault();
    },
    { passive: false }
  );
}
