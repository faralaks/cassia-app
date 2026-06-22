// App-wide constants. Single source of truth so values like the version or repo
// URL are changed in one place and used everywhere.

export const APP_NAME = 'Cassia';

// User-facing app version (shown on the login page and the About screen).
// Injected at build time from the git tag via Vite's `define` (see
// vite.config.js). Defaults to 'unknown' for local/dev builds and any build
// without an explicit version (e.g. no CASSIA_VERSION env at build time).
declare const __APP_VERSION__: string;
export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';

export const REPO_URL = 'https://github.com/faralaks/cassia-desktop';
export const RELEASES_URL = `${REPO_URL}/releases`;

// Preferred default homeserver. When non-empty it is used as the default server
// on the login page (instead of matrix.org) and added as the first suggested
// server. When empty (''), it is ignored entirely. Just the server name, e.g.
// 'matrix.example.org'.
//
// Build-time fallback only. Both deploy paths instead set the preferred server
// at the config.json layer (the `preferredHomeserver` field), which overrides
// this: the Docker entrypoint patches it at container start, and the Cloudflare
// deploy patches it in dist/config.json before upload.
export const DEFAULT_HOMESERVER = '';
