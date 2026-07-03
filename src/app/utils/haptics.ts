/**
 * Best-effort haptic tap for touch gestures (long-press menu, swipe-to-reply).
 *
 * Haptics are decorative: every path is allowed to silently do nothing.
 *
 * - Android/Chromium: the standard Vibration API.
 * - iOS Safari: no Vibration API, but toggling an `<input type="checkbox"
 *   switch>` (Safari 17.4+) via a label click fires the Taptic Engine. Apple
 *   patched this side effect in iOS 26.5, where it degrades to a no-op.
 */
const hasTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

const iosSwitchTap = () => {
  const label = document.createElement('label');
  label.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;visibility:hidden;';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.appendChild(input);
  document.body.appendChild(label);
  label.click();
  label.remove();
};

export const hapticTap = (): void => {
  if (!hasTouch) return;
  try {
    if ('vibrate' in navigator && navigator.vibrate(10)) return;
    iosSwitchTap();
  } catch {
    // never let a missing haptic break the gesture that asked for it
  }
};
