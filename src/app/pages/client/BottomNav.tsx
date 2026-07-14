import React, { ReactNode, useState } from 'react';
import { Avatar, Icon, Icons, Text, toRem } from 'folds';
import { useAtomValue } from 'jotai';

import * as css from './BottomNav.css';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getMxIdLocalPart, getMxIdServer, mxcUrlToHttp } from '../../utils/matrix';
import { nameInitials } from '../../utils/common';
import { UserAvatar } from '../../components/user-avatar';
import { UnreadBadge } from '../../components/unread-badge';
import { Modal500 } from '../../components/Modal500';
import { Settings } from '../../features/settings';
import { useClientConfig } from '../../hooks/useClientConfig';
import { useHomeSelected } from '../../hooks/router/useHomeSelected';
import { useDirectSelected } from '../../hooks/router/useDirectSelected';
import { useExploreSelected } from '../../hooks/router/useExploreSelected';
import { useMobileViewTransitionNavigate } from '../../hooks/useMobileViewTransition';
import {
  getDirectPath,
  getExploreFeaturedPath,
  getExplorePath,
  getExploreServerPath,
  getHomePath,
} from '../pathUtils';
import { useOrphanRooms, useDirects } from '../../state/hooks/roomList';
import { mDirectAtom } from '../../state/mDirectList';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { roomToUnreadAtom } from '../../state/room/roomToUnread';
import { useRoomsUnread } from '../../state/hooks/unread';

type BottomNavItemProps = {
  label: string;
  active: boolean;
  icon: ReactNode;
  badge?: ReactNode;
  onClick: () => void;
};
function BottomNavItem({ label, active, icon, badge, onClick }: BottomNavItemProps) {
  return (
    <button
      type="button"
      className={css.BottomNavItem({ active })}
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
    >
      {badge && <span className={css.BottomNavItemBadge}>{badge}</span>}
      {icon}
      <Text as="span" size="T200">
        {label}
      </Text>
    </button>
  );
}

function HomeNavItem() {
  const mx = useMatrixClient();
  const navigate = useMobileViewTransitionNavigate();
  const mDirects = useAtomValue(mDirectAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const orphanRooms = useOrphanRooms(mx, allRoomsAtom, mDirects, roomToParents);
  const homeUnread = useRoomsUnread(orphanRooms, roomToUnreadAtom);
  const selected = useHomeSelected();

  return (
    <BottomNavItem
      label="Home"
      active={selected}
      icon={<Icon src={Icons.Home} filled={selected} />}
      badge={
        homeUnread && <UnreadBadge highlight={homeUnread.highlight > 0} count={homeUnread.total} />
      }
      onClick={() => navigate(getHomePath(), 'fade')}
    />
  );
}

function DirectNavItem() {
  const mx = useMatrixClient();
  const navigate = useMobileViewTransitionNavigate();
  const mDirects = useAtomValue(mDirectAtom);
  const directs = useDirects(mx, allRoomsAtom, mDirects);
  const directUnread = useRoomsUnread(directs, roomToUnreadAtom);
  const selected = useDirectSelected();

  return (
    <BottomNavItem
      label="Direct"
      active={selected}
      icon={<Icon src={Icons.User} filled={selected} />}
      badge={
        directUnread && (
          <UnreadBadge highlight={directUnread.highlight > 0} count={directUnread.total} />
        )
      }
      onClick={() => navigate(getDirectPath(), 'fade')}
    />
  );
}

function ExploreNavItem() {
  const mx = useMatrixClient();
  const navigate = useMobileViewTransitionNavigate();
  const clientConfig = useClientConfig();
  const selected = useExploreSelected();

  const handleClick = () => {
    if (clientConfig.featuredCommunities?.openAsDefault) {
      navigate(getExploreFeaturedPath(), 'fade');
      return;
    }
    const userId = mx.getUserId();
    const userServer = userId ? getMxIdServer(userId) : undefined;
    navigate(userServer ? getExploreServerPath(userServer) : getExplorePath(), 'fade');
  };

  return (
    <BottomNavItem
      label="Explore"
      active={selected}
      icon={<Icon src={Icons.Explore} filled={selected} />}
      onClick={handleClick}
    />
  );
}

function SettingsNavItem() {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const userId = mx.getUserId()!;
  const profile = useUserProfile(userId);
  const [open, setOpen] = useState(false);

  const displayName = profile.displayName ?? getMxIdLocalPart(userId) ?? userId;
  const avatarUrl = profile.avatarUrl
    ? mxcUrlToHttp(mx, profile.avatarUrl, useAuthentication, 96, 96, 'crop') ?? undefined
    : undefined;

  return (
    <>
      <BottomNavItem
        label="Settings"
        active={open}
        icon={
          <Avatar radii="Pill" style={{ width: toRem(24), height: toRem(24) }}>
            <UserAvatar
              userId={userId}
              src={avatarUrl}
              renderFallback={() => <Text size="T200">{nameInitials(displayName)}</Text>}
            />
          </Avatar>
        }
        onClick={() => setOpen(true)}
      />
      <Modal500 open={open} requestClose={() => setOpen(false)}>
        <Settings requestClose={() => setOpen(false)} />
      </Modal500>
    </>
  );
}

export function BottomNav() {
  return (
    <nav className={css.BottomNav}>
      <div className={css.BottomNavPill}>
        <HomeNavItem />
        <DirectNavItem />
        <ExploreNavItem />
        <SettingsNavItem />
      </div>
    </nav>
  );
}
