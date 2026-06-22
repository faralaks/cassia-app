import { createClient, MatrixClient, IndexedDBStore, IndexedDBCryptoStore } from 'matrix-js-sdk';

import { cryptoCallbacks } from './secretStorageKeys';
import { clearNavToActivePathStore } from '../app/state/navToActivePath';
import { pushSessionToSW } from '../sw-session';
import { getLastUsedServer, setLastUsedServer } from '../app/hooks/useClientConfig';
import { getOriginBaseUrl } from '../app/pages/pathUtils';

// Send the browser to the app root and reload. Used after logout / account
// switch so a fresh session doesn't reopen the previous account's last room
// (the URL otherwise persists across the reload).
export const reloadToHome = () => {
  window.location.href = getOriginBaseUrl();
};

type Session = {
  baseUrl: string;
  accessToken: string;
  userId: string;
  deviceId: string;
};

// Deletes the IndexedDB databases that hold sync + crypto data. Used to recover
// from a store left behind by a previous account (e.g. an incomplete logout, or
// signing into a different account): the SDK refuses to load when the persisted
// account doesn't match the session, so we wipe and start fresh.
const deleteStoreDatabases = async (): Promise<void> => {
  const dbs = await global.indexedDB.databases();
  await Promise.all(
    dbs.map(
      ({ name }) =>
        new Promise<void>((resolve) => {
          if (!name) {
            resolve();
            return;
          }
          const req = global.indexedDB.deleteDatabase(name);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
          req.onblocked = () => resolve();
        })
    )
  );
};

const createAndStartStores = async (session: Session): Promise<MatrixClient> => {
  const indexedDBStore = new IndexedDBStore({
    indexedDB: global.indexedDB,
    localStorage: global.localStorage,
    dbName: 'web-sync-store',
  });

  const legacyCryptoStore = new IndexedDBCryptoStore(global.indexedDB, 'crypto-store');

  const mx = createClient({
    baseUrl: session.baseUrl,
    accessToken: session.accessToken,
    userId: session.userId,
    store: indexedDBStore,
    cryptoStore: legacyCryptoStore,
    deviceId: session.deviceId,
    timelineSupport: true,
    cryptoCallbacks: cryptoCallbacks as any,
    verificationMethods: ['m.sas.v1'],
  });

  try {
    await indexedDBStore.startup();
    await mx.initRustCrypto();
  } catch (e) {
    // Release the IndexedDB connection from this failed attempt so the caller
    // can delete the databases without the delete being blocked, then retry.
    mx.stopClient();
    await indexedDBStore.destroy().catch(() => undefined);
    throw e;
  }

  mx.setMaxListeners(50);

  return mx;
};

// The SDK throws this when the persisted store belongs to a different account
// than the session we're loading.
const isAccountMismatchError = (e: unknown): boolean =>
  e instanceof Error && /account in the store doesn't match/i.test(e.message);

export const initClient = async (session: Session): Promise<MatrixClient> => {
  try {
    return await createAndStartStores(session);
  } catch (e) {
    // Only recover from a stale-account store — wipe and start fresh. Other
    // failures (network, etc.) are re-thrown so we don't needlessly destroy a
    // valid local store / crypto keys.
    if (!isAccountMismatchError(e)) throw e;
    await deleteStoreDatabases();
    return createAndStartStores(session);
  }
};

export const startClient = async (mx: MatrixClient) => {
  await mx.startClient({
    lazyLoadMembers: true,
  });
};

export const clearCacheAndReload = async (mx: MatrixClient) => {
  mx.stopClient();
  clearNavToActivePathStore(mx.getSafeUserId());
  await mx.store.deleteAllData();
  window.location.reload();
};

export const logoutClient = async (mx: MatrixClient) => {
  pushSessionToSW();
  mx.stopClient();
  try {
    await mx.logout();
  } catch {
    // ignore if failed to logout
  }
  await mx.clearStores();
  const lastUsedServer = getLastUsedServer();
  window.localStorage.clear();
  if (lastUsedServer) setLastUsedServer(lastUsedServer);
  reloadToHome();
};

export const clearLoginData = async () => {
  const dbs = await window.indexedDB.databases();

  dbs.forEach((idbInfo) => {
    const { name } = idbInfo;
    if (name) {
      window.indexedDB.deleteDatabase(name);
    }
  });

  const lastUsedServer = getLastUsedServer();
  window.localStorage.clear();
  if (lastUsedServer) setLastUsedServer(lastUsedServer);
  reloadToHome();
};
