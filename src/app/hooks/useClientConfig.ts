import { createContext, useContext } from 'react';
import { DEFAULT_HOMESERVER } from '../cons';

export type HashRouterConfig = {
  enabled?: boolean;
  basename?: string;
};

export type ClientConfig = {
  defaultHomeserver?: number;
  homeserverList?: string[];
  allowCustomHomeservers?: boolean;
  // Preferred homeserver, pinned first in the picker and preselected on first
  // login. Set at runtime (e.g. the Docker entrypoint patches it from the
  // CASSIA_HOMESERVER env), so the same image works for any deployment. Falls
  // back to the build-time DEFAULT_HOMESERVER constant when unset.
  preferredHomeserver?: string;

  featuredCommunities?: {
    openAsDefault?: boolean;
    spaces?: string[];
    rooms?: string[];
    servers?: string[];
  };

  hashRouter?: HashRouterConfig;
};

const ClientConfigContext = createContext<ClientConfig | null>(null);

export const ClientConfigProvider = ClientConfigContext.Provider;

export function useClientConfig(): ClientConfig {
  const config = useContext(ClientConfigContext);
  if (!config) throw new Error('Client config are not provided!');
  return config;
}

const LAST_USED_SERVER_KEY = 'cassia_last_used_server';

export const getLastUsedServer = (): string | undefined =>
  localStorage.getItem(LAST_USED_SERVER_KEY) ?? undefined;

export const setLastUsedServer = (server: string): void => {
  localStorage.setItem(LAST_USED_SERVER_KEY, server);
};

// Preferred homeserver: the runtime config field (e.g. set by the Docker
// entrypoint) wins; falls back to the build-time DEFAULT_HOMESERVER constant.
const preferredHomeserver = (clientConfig: ClientConfig): string =>
  clientConfig.preferredHomeserver || DEFAULT_HOMESERVER;

// Default server shown on the login page. A previously used server (saved in
// localStorage) always wins so returning users keep their choice. Only on first
// login — when there's no last-used server — does the preferred homeserver (if
// set) get preselected, sparing private-server users from typing it. Falls back
// to the bundled config list, then matrix.org.
export const clientDefaultServer = (clientConfig: ClientConfig): string =>
  getLastUsedServer() ??
  (preferredHomeserver(clientConfig) || undefined) ??
  clientConfig.homeserverList?.[clientConfig.defaultHomeserver ?? 0] ??
  'matrix.org';

// Suggested-server list for the picker, with the preferred homeserver (if set)
// pinned first and de-duplicated against the configured list.
export const clientServerList = (clientConfig: ClientConfig): string[] => {
  const list = clientConfig.homeserverList ?? [];
  const preferred = preferredHomeserver(clientConfig);
  if (!preferred) return list;
  return [preferred, ...list.filter((s) => s !== preferred)];
};

export const clientAllowedServer = (clientConfig: ClientConfig, server: string): boolean => {
  const { allowCustomHomeservers } = clientConfig;

  if (allowCustomHomeservers) return true;

  return clientServerList(clientConfig).includes(server);
};
