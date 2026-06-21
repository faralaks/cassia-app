import React, { ReactNode, useEffect } from 'react';
import { configClass, varsClass } from 'folds';
import { useSetAtom } from 'jotai';
import {
  DarkTheme,
  LightTheme,
  ThemeContextProvider,
  ThemeKind,
  useActiveTheme,
  useSystemThemeKind,
} from '../hooks/useTheme';
import { useSetting } from '../state/hooks/settings';
import { settingsAtom } from '../state/settings';
import { themeGroupAtom } from '../state/room/roomStyles';

export function UnAuthRouteThemeManager() {
  const systemThemeKind = useSystemThemeKind();

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(configClass, varsClass);
    if (systemThemeKind === ThemeKind.Dark) {
      document.body.classList.add(...DarkTheme.classNames);
    }
    if (systemThemeKind === ThemeKind.Light) {
      document.body.classList.add(...LightTheme.classNames);
    }
  }, [systemThemeKind]);

  return null;
}

export function AuthRouteThemeManager({ children }: { children: ReactNode }) {
  const activeTheme = useActiveTheme();
  const [monochromeMode] = useSetting(settingsAtom, 'monochromeMode');
  const setThemeGroup = useSetAtom(themeGroupAtom);

  useEffect(() => {
    document.body.className = '';
    document.body.classList.add(configClass, varsClass);

    document.body.classList.add(...activeTheme.classNames);

    if (monochromeMode) {
      document.body.style.filter = 'grayscale(1)';
    } else {
      document.body.style.filter = '';
    }
  }, [activeTheme, monochromeMode]);

  // Keep the chat-style default group in sync with the active theme group, so
  // chats without per-room overrides follow light vs dark defaults.
  useEffect(() => {
    setThemeGroup(activeTheme.kind === ThemeKind.Light ? 'light' : 'dark');
  }, [activeTheme.kind, setThemeGroup]);

  return <ThemeContextProvider value={activeTheme}>{children}</ThemeContextProvider>;
}
