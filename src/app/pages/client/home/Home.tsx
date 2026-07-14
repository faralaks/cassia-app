import React, { MouseEventHandler, forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Spinner,
  Text,
  config,
  toRem,
} from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAtom, useAtomValue } from 'jotai';
import FocusTrap from 'focus-trap-react';
import { RoomEvent, Room } from 'matrix-js-sdk';
import { factoryRoomIdByActivity, factoryRoomIdByAtoZ } from '../../../utils/sort';
import {
  NavButton,
  NavCategory,
  NavCategoryHeader,
  NavEmptyCenter,
  NavEmptyLayout,
  NavItem,
  NavItemContent,
  NavLink,
} from '../../../components/nav';
import {
  encodeSearchParamValueArray,
  getDirectCreatePath,
  getExplorePath,
  getHomeCreatePath,
  getHomeRoomPath,
  getHomeSearchPath,
  withSearchParam,
} from '../../pathUtils';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import {
  useHomeCreateSelected,
  useHomeSearchSelected,
} from '../../../hooks/router/useHomeSelected';
import { useHomeRooms } from './useHomeRooms';
import { useDirectRooms } from '../direct/useDirectRooms';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavCategoryButton, RoomNavItem, InviteNavItem } from '../../../features/room-nav';
import { allInvitesAtom } from '../../../state/room-list/inviteList';
import { isDirectInvite, isSpace } from '../../../utils/room';
import { makeNavCategoryId } from '../../../state/closedNavCategories';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useCategoryHandler } from '../../../hooks/useCategoryHandler';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { PageNav, PageNavHeader, PageNavContent } from '../../../components/page';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { markAsRead } from '../../../utils/notifications';
import { useClosedNavCategoriesAtom } from '../../../state/hooks/closedNavCategories';
import { stopPropagation } from '../../../utils/keyboard';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { JoinAddressPrompt } from '../../../components/join-address-prompt';
import { _RoomSearchParams } from '../../paths';

type HomeMenuProps = {
  requestClose: () => void;
};
const HomeMenu = forwardRef<HTMLDivElement, HomeMenuProps>(({ requestClose }, ref) => {
  const orphanRooms = useHomeRooms();
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const unread = useRoomsUnread(orphanRooms, roomToUnreadAtom);
  const mx = useMatrixClient();

  const handleMarkAsRead = () => {
    if (!unread) return;
    orphanRooms.forEach((rId) => markAsRead(mx, rId, hideActivity));
    requestClose();
  };

  return (
    <Menu ref={ref} style={{ maxWidth: toRem(160), width: '100vw' }}>
      <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
        <MenuItem
          onClick={handleMarkAsRead}
          size="300"
          after={<Icon size="100" src={Icons.CheckTwice} />}
          radii="300"
          aria-disabled={!unread}
        >
          <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
            Mark as Read
          </Text>
        </MenuItem>
      </Box>
    </Menu>
  );
});

function HomeHeader() {
  const navigate = useNavigate();
  const createRoomSelected = useHomeCreateSelected();
  const searchSelected = useHomeSearchSelected();
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  return (
    <>
      <PageNavHeader>
        <Box alignItems="Center" grow="Yes" gap="300">
          <Box grow="Yes">
            <Text size="H4" truncate>
              Home
            </Text>
          </Box>
          <Box alignItems="Center" gap="100">
            <UseStateProvider<RectCords | undefined> initial={undefined}>
              {(createAnchor, setCreateAnchor) => (
                <PopOut
                  anchor={createAnchor}
                  position="Bottom"
                  align="Start"
                  offset={6}
                  content={
                    <FocusTrap
                      focusTrapOptions={{
                        initialFocus: false,
                        returnFocusOnDeactivate: false,
                        onDeactivate: () => setCreateAnchor(undefined),
                        clickOutsideDeactivates: true,
                        isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
                        isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
                        escapeDeactivates: stopPropagation,
                      }}
                    >
                      <Menu style={{ maxWidth: toRem(180), width: '100vw' }}>
                        <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
                          <MenuItem
                            size="300"
                            radii="300"
                            after={<Icon size="100" src={Icons.User} />}
                            onClick={() => {
                              setCreateAnchor(undefined);
                              navigate(getDirectCreatePath());
                            }}
                          >
                            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                              Create Direct
                            </Text>
                          </MenuItem>
                          <MenuItem
                            size="300"
                            radii="300"
                            after={<Icon size="100" src={Icons.Hash} />}
                            onClick={() => {
                              setCreateAnchor(undefined);
                              navigate(getHomeCreatePath());
                            }}
                          >
                            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                              Create Room
                            </Text>
                          </MenuItem>
                        </Box>
                      </Menu>
                    </FocusTrap>
                  }
                >
                  <IconButton
                    title="Create"
                    variant="Background"
                    radii="300"
                    size="300"
                    aria-pressed={!!createAnchor || createRoomSelected}
                    onClick={(evt: React.MouseEvent<HTMLButtonElement>) =>
                      setCreateAnchor(
                        createAnchor ? undefined : evt.currentTarget.getBoundingClientRect()
                      )
                    }
                  >
                    <Icon src={Icons.Plus} size="200" />
                  </IconButton>
                </PopOut>
              )}
            </UseStateProvider>
            <UseStateProvider initial={false}>
              {(open, setOpen) => (
                <>
                  <IconButton
                    title="Join with Address"
                    variant="Background"
                    radii="300"
                    size="300"
                    aria-pressed={open}
                    onClick={() => setOpen(true)}
                  >
                    <Icon src={Icons.Link} size="200" />
                  </IconButton>
                  {open && (
                    <JoinAddressPrompt
                      onCancel={() => setOpen(false)}
                      onOpen={(roomIdOrAlias, viaServers, eventId) => {
                        setOpen(false);
                        const path = getHomeRoomPath(roomIdOrAlias, eventId);
                        navigate(
                          viaServers
                            ? withSearchParam<_RoomSearchParams>(path, {
                                viaServers: encodeSearchParamValueArray(viaServers),
                              })
                            : path
                        );
                      }}
                    />
                  )}
                </>
              )}
            </UseStateProvider>
            <IconButton
              title="Message Search"
              variant="Background"
              radii="300"
              size="300"
              aria-pressed={searchSelected}
              onClick={() => navigate(getHomeSearchPath())}
            >
              <Icon src={Icons.Search} size="200" />
            </IconButton>
            <IconButton aria-pressed={!!menuAnchor} variant="Background" onClick={handleOpenMenu}>
              <Icon src={Icons.VerticalDots} size="200" />
            </IconButton>
          </Box>
        </Box>
      </PageNavHeader>
      <PopOut
        anchor={menuAnchor}
        position="Bottom"
        align="End"
        offset={6}
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              returnFocusOnDeactivate: false,
              onDeactivate: () => setMenuAnchor(undefined),
              clickOutsideDeactivates: true,
              isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
              isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
              escapeDeactivates: stopPropagation,
            }}
          >
            <HomeMenu requestClose={() => setMenuAnchor(undefined)} />
          </FocusTrap>
        }
      />
    </>
  );
}

function HomeEmpty() {
  const navigate = useNavigate();

  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Hash} />}
        title={
          <Text size="H5" align="Center">
            No Rooms
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            You do not have any rooms yet.
          </Text>
        }
        options={
          <>
            <Button onClick={() => navigate(getHomeCreatePath())} variant="Secondary" size="300">
              <Text size="B300" truncate>
                Create Room
              </Text>
            </Button>
            <Button
              onClick={() => navigate(getExplorePath())}
              variant="Secondary"
              fill="Soft"
              size="300"
            >
              <Text size="B300" truncate>
                Explore Community Rooms
              </Text>
            </Button>
          </>
        }
      />
    </NavEmptyCenter>
  );
}

const DEFAULT_CATEGORY_ID = makeNavCategoryId('home', 'room');
const DIRECT_CATEGORY_ID = makeNavCategoryId('home', 'direct');

export function Home() {
  const mx = useMatrixClient();
  useNavToActivePathMapper('home');
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const rooms = useHomeRooms();
  const directs = useDirectRooms();
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  const roomToUnread = useAtomValue(roomToUnreadAtom);
  const navigate = useNavigate();

  const selectedRoomId = useSelectedRoom();

  const allInviteIds = useAtomValue(allInvitesAtom);
  const inviteRooms = useMemo(
    () => allInviteIds.map((id) => mx.getRoom(id)).filter((room): room is Room => !!room),
    [mx, allInviteIds]
  );
  const directInvites = useMemo(
    () => inviteRooms.filter((room) => isDirectInvite(room, mx.getSafeUserId())),
    [mx, inviteRooms]
  );
  const roomInvites = useMemo(
    () => inviteRooms.filter((room) => !isDirectInvite(room, mx.getSafeUserId()) && !isSpace(room)),
    [mx, inviteRooms]
  );

  const noRoomToDisplay = rooms.length === 0 && directs.length === 0 && inviteRooms.length === 0;
  // Don't flash the "No Rooms" empty state during startup: the room list is
  // briefly empty while the client hydrates — and the room-list atoms fill in
  // *after* isInitialSyncComplete() flips, so a sync check alone still
  // flashed. Only trust an empty list once it has stayed empty for a moment;
  // until then show a quiet spinner.
  const [emptySettled, setEmptySettled] = useState(false);
  useEffect(() => {
    if (!noRoomToDisplay) {
      setEmptySettled(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setEmptySettled(true), 800);
    return () => window.clearTimeout(timer);
  }, [noRoomToDisplay]);
  const [closedCategories, setClosedCategories] = useAtom(useClosedNavCategoriesAtom());

  const [activityTick, setActivityTick] = useState(0);
  useEffect(() => {
    const handle = () => setActivityTick((t) => t + 1);
    mx.on(RoomEvent.Timeline, handle);
    return () => {
      mx.off(RoomEvent.Timeline, handle);
    };
  }, [mx]);

  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const sortedDirects = useMemo(
    () =>
      Array.from(directs)
        .sort(factoryRoomIdByActivity(mx))
        .filter((roomId) => {
          const room = mx.getRoom(roomId);
          const lastTs = room?.getLastActiveTimestamp() ?? 0;
          return Date.now() - lastTs < ONE_WEEK;
        }),
    [mx, directs, roomToUnread, activityTick]
  );

  const sortedRooms = useMemo(
    () => Array.from(rooms).sort(factoryRoomIdByActivity(mx)),
    [mx, rooms, activityTick]
  );

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );

  return (
    <PageNav>
      <HomeHeader />
      {noRoomToDisplay && !emptySettled ? (
        <Box grow="Yes" alignItems="Center" justifyContent="Center">
          <Spinner size="600" variant="Secondary" fill="Soft" />
        </Box>
      ) : null}
      {noRoomToDisplay && emptySettled ? <HomeEmpty /> : null}
      {!noRoomToDisplay && (
        <PageNavContent scrollRef={scrollRef}>
          <Box direction="Column" gap="300">
            {(sortedDirects.length > 0 || directInvites.length > 0) && (
              <NavCategory>
                <NavCategoryHeader>
                  <RoomNavCategoryButton
                    closed={closedCategories.has(DIRECT_CATEGORY_ID)}
                    data-category-id={DIRECT_CATEGORY_ID}
                    onClick={handleCategoryClick}
                  >
                    Direct
                  </RoomNavCategoryButton>
                </NavCategoryHeader>
                <AnimatePresence initial={false}>
                  {directInvites.map((room) => (
                    <motion.div
                      key={room.roomId}
                      layout={!reduceMotion}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <InviteNavItem
                        room={room}
                        direct
                        onJoined={(roomId) =>
                          navigate(getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId)))
                        }
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {!closedCategories.has(DIRECT_CATEGORY_ID) && (
                    <motion.div
                      key="direct-fold"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {sortedDirects.map((roomId) => {
                        const room = mx.getRoom(roomId);
                        if (!room) return null;
                        const selected = selectedRoomId === roomId;
                        return (
                          <motion.div key={roomId} layout={!reduceMotion}>
                            <RoomNavItem
                              room={room}
                              selected={selected}
                              showAvatar
                              direct
                              showPreview
                              linkPath={getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
                              notificationMode={getRoomNotificationMode(
                                notificationPreferences,
                                room.roomId
                              )}
                            />
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </NavCategory>
            )}

            {(rooms.length > 0 || roomInvites.length > 0) && (
              <NavCategory>
                <NavCategoryHeader>
                  <RoomNavCategoryButton
                    closed={closedCategories.has(DEFAULT_CATEGORY_ID)}
                    data-category-id={DEFAULT_CATEGORY_ID}
                    onClick={handleCategoryClick}
                  >
                    Rooms
                  </RoomNavCategoryButton>
                </NavCategoryHeader>
                <AnimatePresence initial={false}>
                  {roomInvites.map((room) => (
                    <motion.div
                      key={room.roomId}
                      layout={!reduceMotion}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <InviteNavItem
                        room={room}
                        onJoined={(roomId) =>
                          navigate(getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId)))
                        }
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                <AnimatePresence initial={false}>
                  {!closedCategories.has(DEFAULT_CATEGORY_ID) && (
                    <motion.div
                      key="rooms-fold"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {sortedRooms.map((roomId) => {
                        const room = mx.getRoom(roomId);
                        if (!room) return null;
                        const selected = selectedRoomId === roomId;
                        return (
                          <motion.div key={roomId} layout={!reduceMotion}>
                            <RoomNavItem
                              room={room}
                              selected={selected}
                              showPreview
                              compact
                              linkPath={getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
                              notificationMode={getRoomNotificationMode(
                                notificationPreferences,
                                room.roomId
                              )}
                            />
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </NavCategory>
            )}
          </Box>
        </PageNavContent>
      )}
    </PageNav>
  );
}
