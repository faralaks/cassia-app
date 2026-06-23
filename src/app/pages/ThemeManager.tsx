import React, { ReactNode, useEffect } from 'react';
import { color, configClass, varsClass } from 'folds';
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

// `color.Background.Container` is a folds CSS variable like "var(--xxxx)". To
// get the actual color of the active theme we resolve that variable against the
// themed <body> and push it into <meta name="theme-color"> so the mobile
// browser/OS chrome (iOS status bar, Android address bar) matches the app
// instead of flashing white.
const themeColorVarName = color.Background.Container.replace(/^var\(/, '').replace(/\)$/, '').trim();
const syncThemeColorMeta = () => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const value = getComputedStyle(document.body).getPropertyValue(themeColorVarName).trim();
  if (value) meta.setAttribute('content', value);
};

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
    syncThemeColorMeta();
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
    syncThemeColorMeta();
  }, [activeTheme, monochromeMode]);

  // Keep the chat-style default group in sync with the active theme group, so
  // chats without per-room overrides follow light vs dark defaults.
  useEffect(() => {
    setThemeGroup(activeTheme.kind === ThemeKind.Light ? 'light' : 'dark');
  }, [activeTheme.kind, setThemeGroup]);

  return <ThemeContextProvider value={activeTheme}>{children}</ThemeContextProvider>;
}
