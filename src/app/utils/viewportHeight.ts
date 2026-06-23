/**
 * Keeps the CSS custom property `--app-height` in sync with the *visible*
 * viewport height. On iOS Safari the layout viewport does not shrink when the
 * virtual keyboard opens, so a bottom-anchored composer would slide behind the
 * keyboard. By tracking `visualViewport.height` and feeding it to `#root`'s
 * height (see index.css), the app column shrinks to the visible area and the
 * composer stays above the keyboard.
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
    // Prefer the visual viewport (accounts for the keyboard); fall back to the
    // layout viewport when the API is unavailable.
    const height = vv?.height ?? window.innerHeight;
    root.style.setProperty('--app-height', `${Math.round(height)}px`);
  };

  apply();

  if (vv) {
    vv.addEventListener('resize', apply);
    // Scrolling the visual viewport (keyboard show/hide) also changes the
    // usable area on some iOS versions.
    vv.addEventListener('scroll', apply);
  } else {
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
  }
}
