/**
 * Keeps the app sized and pinned to the *visible* viewport.
 *
 * On iOS Safari the layout viewport does not shrink when the virtual keyboard
 * opens — instead the page is scrolled up behind the keyboard. Left alone, a
 * bottom-anchored composer slides off-screen and the whole page becomes
 * scrollable. We counter this by tracking the VisualViewport and writing:
 *   --app-height: the visible height        → #root shrinks, composer rides up
 *   --app-offset-top: the visual offsetTop  → #root is translated back into view
 * so only the composer moves while the page itself stays put.
 *
 * Idempotent and framework-agnostic — call once at app startup.
 */
let installed = false;

export function setupViewportHeight(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const root = document.documentElement;
  const vv = window.visualViewport;

  const apply = () => {
    const height = vv?.height ?? window.innerHeight;
    const offsetTop = vv?.offsetTop ?? 0;
    root.style.setProperty('--app-height', `${Math.round(height)}px`);
    root.style.setProperty('--app-offset-top', `${Math.round(offsetTop)}px`);
    // If iOS scrolled the window to push content behind the keyboard, undo it so
    // the pinned app stays aligned with the visible area.
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
}
