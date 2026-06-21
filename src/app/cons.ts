// App-wide constants. Single source of truth so values like the version or repo
// URL are changed in one place and used everywhere.

export const APP_NAME = 'Cassia';

// User-facing app version (shown on the login page and the About screen). Bump
// here to update it everywhere.
export const APP_VERSION = '1.0.0';

export const REPO_URL = 'https://github.com/faralaks/cassia-desktop';
export const RELEASES_URL = `${REPO_URL}/releases`;

// Preferred default homeserver. When non-empty it is used as the default server
// on the login page (instead of matrix.org) and added as the first suggested
// server. When empty (''), it is ignored entirely. Just the server name, e.g.
// 'matrix.example.org'.
export const DEFAULT_HOMESERVER = '';
