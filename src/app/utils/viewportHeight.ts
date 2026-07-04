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

// TEMPORARY diagnostic (remove after the iOS 26 bottom-band issue is nailed):
// tiny overlay with the real viewport numbers so device screenshots tell us
// exactly where the layout viewport ends vs. the physical screen.
const VIEWPORT_DEBUG = true;
let debugEl: HTMLElement | null = null;

const renderViewportDebug = () => {
  if (!VIEWPORT_DEBUG) return;
  if (!debugEl) {
    debugEl = document.createElement('div');
    debugEl.style.cssText =
      'position:fixed;left:8px;bottom:120px;z-index:99999;pointer-events:none;' +
      'font:10px/1.5 monospace;color:#0f0;background:rgba(0,0,0,0.72);' +
      'padding:4px 6px;border-radius:4px;white-space:pre;';
    document.body.appendChild(debugEl);
  }
  const vv = window.visualViewport;
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) ' +
    'env(safe-area-inset-bottom) env(safe-area-inset-left);';
  document.body.appendChild(probe);
  const ps = getComputedStyle(probe);
  const sat = ps.paddingTop;
  const sab = ps.paddingBottom;
  probe.remove();
  debugEl.textContent = [
    `scrH ${window.screen.height}`,
    `inH  ${window.innerHeight}`,
    `docH ${document.documentElement.clientHeight}`,
    `vvH  ${vv ? Math.round(vv.height) : '-'} top ${vv ? Math.round(vv.offsetTop) : '-'}`,
    `sat ${sat} sab ${sab}`,
    `appH ${document.documentElement.style.getPropertyValue('--app-height')}`,
    `kb ${document.documentElement.hasAttribute('data-keyboard') ? '1' : '0'}`,
  ].join('\n');
};

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
    // Height of the app column, measured from the top of the (pinned) page:
    // offsetTop + height = where the visible area ends. In iOS 26 standalone
    // (viewport-fit=cover) visualViewport excludes the safe-area bands, so
    // raw vv.height is up to ~90pt short of the screen — using it directly
    // left an empty strip under the bottom nav / composer.
    const layoutHeight = root.clientHeight;
    const visualBottom = vv ? Math.round(vv.offsetTop + vv.height) : window.innerHeight;
    // Keyboard heuristic: only the keyboard occludes hundreds of px; safe
    // areas and minor UI are well under 150. Compare against the *layout*
    // viewport — window.innerHeight tracks the visual viewport on iOS and
    // shrinks together with it, so it can't be the baseline.
    const keyboard = layoutHeight - visualBottom > 150;
    // Full layout height (screen incl. safe areas — bars pad themselves via
    // --bottom-bar-inset) normally; the keyboard-clipped height while typing
    // so the composer rides up and sits right on the keyboard.
    root.style.setProperty('--app-height', `${keyboard ? visualBottom : layoutHeight}px`);
    // Collapses the bottom safe-area paddings (composer, bottom nav) while
    // the keyboard covers the home-indicator area — see index.css.
    root.toggleAttribute('data-keyboard', keyboard);
    // Undo any auto-scroll iOS applied to push content behind the keyboard.
    if (window.scrollY !== 0) window.scrollTo(0, 0);
    renderViewportDebug();
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
