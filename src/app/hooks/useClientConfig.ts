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

// Default server shown on the login page. A previously used server (saved in
// localStorage) always wins so returning users keep their choice. Only on first
// login — when there's no last-used server — does the configured
// DEFAULT_HOMESERVER (if set) get preselected, sparing private-server users from
// typing it. Falls back to the bundled config list, then matrix.org.
export const clientDefaultServer = (clientConfig: ClientConfig): string =>
  getLastUsedServer() ??
  (DEFAULT_HOMESERVER || undefined) ??
  clientConfig.homeserverList?.[clientConfig.defaultHomeserver ?? 0] ??
  'matrix.org';

// Suggested-server list for the picker, with DEFAULT_HOMESERVER (if set) pinned
// first and de-duplicated against the configured list.
export const clientServerList = (clientConfig: ClientConfig): string[] => {
  const list = clientConfig.homeserverList ?? [];
  if (!DEFAULT_HOMESERVER) return list;
  return [DEFAULT_HOMESERVER, ...list.filter((s) => s !== DEFAULT_HOMESERVER)];
};

export const clientAllowedServer = (clientConfig: ClientConfig, server: string): boolean => {
  const { allowCustomHomeservers } = clientConfig;

  if (allowCustomHomeservers) return true;

  return clientServerList(clientConfig).includes(server);
};
