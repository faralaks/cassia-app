import { ReactNode } from 'react';
import { useMatch, useParams } from 'react-router-dom';
import { ScreenSize, useScreenSizeContext } from '../hooks/useScreenSize';

type MobileFriendlyClientNavProps = {
  children: ReactNode;
};
export function MobileFriendlyClientNav({ children }: MobileFriendlyClientNavProps) {
  const screenSize = useScreenSizeContext();

  // On mobile the vertical left rail is replaced by the bottom bar, so it is
  // never shown. Desktop/tablet keep the rail as-is.
  if (screenSize === ScreenSize.Mobile) {
    return null;
  }

  return children;
}

export function MobileFriendlyBottomNav({ children }: MobileFriendlyClientNavProps) {
  const screenSize = useScreenSizeContext();
  // A room/chat is open whenever the route carries a room param. The composer
  // lives there, so hide the bar to give it the full width — every other
  // (list-level) screen, including explore/inbox sub-pages, keeps the bar.
  const { roomIdOrAlias } = useParams();

  if (screenSize !== ScreenSize.Mobile || roomIdOrAlias) {
    return null;
  }

  return children;
}

type MobileFriendlyPageNavProps = {
  path: string;
  children: ReactNode;
};
export function MobileFriendlyPageNav({ path, children }: MobileFriendlyPageNavProps) {
  const screenSize = useScreenSizeContext();
  const exactPath = useMatch({
    path,
    caseSensitive: true,
    end: true,
  });

  if (screenSize === ScreenSize.Mobile && !exactPath) {
    return null;
  }

  return children;
}
