/**
 * Best-effort OS integration for an active call in a web app.
 *
 * There is no CallKit for the web: a PWA cannot show the native incoming-call
 * UI, ring on the lock screen, or keep the microphone alive through a
 * user-initiated screen lock. What the web CAN do — and what this module
 * wires up — is:
 *
 * - Audio Session API (WebKit/iOS): declare `play-and-record` so iOS treats
 *   the page like a call app (correct audio route, ducking, best chance of
 *   the call surviving backgrounding).
 * - Screen Wake Lock: keep the screen from auto-locking mid-call — the most
 *   common way calls died. Re-acquired whenever the page becomes visible
 *   again (the sentinel is auto-released on hide/lock).
 * - Media Session "call" surface: metadata + hangup / toggle-microphone
 *   action handlers + microphone state, shown in OS media UIs where
 *   supported.
 *
 * Everything is feature-detected and failure-tolerant: on browsers without
 * these APIs the module silently does nothing.
 */

type AudioSessionLike = { type: string };
type WakeLockSentinelLike = { release: () => Promise<void> };
type MediaSessionLike = {
  metadata: unknown;
  setActionHandler: (action: string, handler: (() => void) | null) => void;
  setMicrophoneActive?: (active: boolean) => void;
};

type CallSessionHandlers = {
  onHangup: () => void;
  onToggleMic: () => void;
};

const audioSession = (): AudioSessionLike | undefined =>
  (navigator as unknown as { audioSession?: AudioSessionLike }).audioSession;

const mediaSession = (): MediaSessionLike | undefined =>
  (navigator as unknown as { mediaSession?: MediaSessionLike }).mediaSession;

let wakeLock: WakeLockSentinelLike | null = null;
let reacquireWakeLock: (() => void) | null = null;
let sessionActive = false;

const requestWakeLock = async (): Promise<void> => {
  try {
    const wl = (
      navigator as unknown as {
        wakeLock?: { request: (type: string) => Promise<WakeLockSentinelLike> };
      }
    ).wakeLock;
    if (!wl) return;
    wakeLock = await wl.request('screen');
  } catch {
    wakeLock = null;
  }
};

const setMediaSessionAction = (action: string, handler: (() => void) | null) => {
  try {
    mediaSession()?.setActionHandler(action, handler);
  } catch {
    // action not supported by this browser — fine
  }
};

export const endCallSession = (): void => {
  if (!sessionActive) return;
  sessionActive = false;

  try {
    const session = audioSession();
    if (session) session.type = 'auto';
  } catch {
    // ignore
  }

  if (reacquireWakeLock) {
    document.removeEventListener('visibilitychange', reacquireWakeLock);
    reacquireWakeLock = null;
  }
  wakeLock?.release().catch(() => undefined);
  wakeLock = null;

  try {
    const ms = mediaSession();
    if (ms) ms.metadata = null;
  } catch {
    // ignore
  }
  setMediaSessionAction('hangup', null);
  setMediaSessionAction('togglemicrophone', null);
};

export const startCallSession = (peerName: string, handlers: CallSessionHandlers): void => {
  if (sessionActive) endCallSession();
  sessionActive = true;

  // iOS: behave like a call app (route/ducking, background survival chances).
  try {
    const session = audioSession();
    if (session) session.type = 'play-and-record';
  } catch {
    // not WebKit — ignore
  }

  // Don't let auto-lock kill the call; re-grab the lock on return to
  // foreground since hiding the page releases the sentinel.
  requestWakeLock();
  reacquireWakeLock = () => {
    if (document.visibilityState === 'visible') requestWakeLock();
  };
  document.addEventListener('visibilitychange', reacquireWakeLock);

  try {
    const ms = mediaSession();
    if (ms && typeof MediaMetadata !== 'undefined') {
      ms.metadata = new MediaMetadata({ title: `Call — ${peerName}`, artist: 'Cassia' });
    }
  } catch {
    // metadata is cosmetic
  }
  setMediaSessionAction('hangup', handlers.onHangup);
  setMediaSessionAction('togglemicrophone', handlers.onToggleMic);
};

export const updateCallSessionMic = (muted: boolean): void => {
  if (!sessionActive) return;
  try {
    mediaSession()?.setMicrophoneActive?.(!muted);
  } catch {
    // cosmetic
  }
};
