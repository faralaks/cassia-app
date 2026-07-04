/* eslint-disable import/first */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { enableMapSet } from 'immer';
import '@fontsource/inter/variable.css';
import 'folds/dist/style.css';
import { configClass, varsClass } from 'folds';

enableMapSet();

import './index.css';

import { trimTrailingSlash } from './app/utils/common';
import App from './app/pages/App';

// import i18n (needs to be bundled ;))
import './app/i18n';
import { pushSessionToSW } from './sw-session';
import { getFallbackSession } from './app/state/sessions';
import { setupViewportHeight } from './app/utils/viewportHeight';

document.body.classList.add(configClass, varsClass);

// Track the visible viewport height (keeps the composer above the iOS keyboard).
setupViewportHeight();

// Register Service Worker
if ('serviceWorker' in navigator) {
  const swUrl =
    import.meta.env.MODE === 'production'
      ? `${trimTrailingSlash(import.meta.env.BASE_URL)}/sw.js`
      : `/dev-sw.js?dev-sw`;

  const sendSessionToSW = () => {
    const session = getFallbackSession();
    pushSessionToSW(session?.baseUrl, session?.accessToken);
  };

  navigator.serviceWorker.register(swUrl).then((reg) => {
    sendSessionToSW();
    // Updates install in the background and normally activate only when every
    // window is gone — safe for running pages, but a long-lived tab would stay
    // on the old version forever. A page load is the safe moment to switch:
    // nothing old is running yet. If an update is already waiting, promote it
    // and boot into the new version once (sessionStorage guards a reload loop).
    const RELOADED_FLAG = 'cassia_sw_update_reload';
    const waiting = reg?.waiting;
    if (waiting && navigator.serviceWorker.controller) {
      if (!sessionStorage.getItem(RELOADED_FLAG)) {
        sessionStorage.setItem(RELOADED_FLAG, '1');
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => window.location.reload(),
          { once: true }
        );
        waiting.postMessage({ type: 'skipWaiting' });
      }
    } else {
      sessionStorage.removeItem(RELOADED_FLAG);
    }
  });
  navigator.serviceWorker.ready.then(sendSessionToSW);

  navigator.serviceWorker.addEventListener('message', (ev) => {
    const { type } = ev.data ?? {};

    if (type === 'requestSession') {
      sendSessionToSW();
    }
  });
}

const mountApp = () => {
  const rootContainer = document.getElementById('root');

  if (rootContainer === null) {
    console.error('Root container element not found!');
    return;
  }

  const root = createRoot(rootContainer);
  root.render(<App />);
};

mountApp();
