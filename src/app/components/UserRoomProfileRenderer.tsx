import React, { useEffect, useState } from 'react';
import { Menu, PopOut, toRem } from 'folds';
import FocusTrap from 'focus-trap-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCloseUserRoomProfile, useUserRoomProfileState } from '../state/hooks/userRoomProfile';
import { UserRoomProfile } from './user-profile';
import { UserRoomProfileState } from '../state/userRoomProfile';
import { useAllJoinedRoomsSet, useGetRoom } from '../hooks/useGetRoom';
import { stopPropagation } from '../utils/keyboard';
import { SpaceProvider } from '../hooks/useSpace';
import { RoomProvider } from '../hooks/useRoom';
import { getPopupMotionProps } from './popupMotion';

function UserRoomProfileContextMenu({
  state,
  open,
  onClosed,
}: {
  state: UserRoomProfileState;
  open: boolean;
  onClosed: () => void;
}) {
  const { roomId, spaceId, userId, cords, position } = state;
  const allJoinedRooms = useAllJoinedRoomsSet();
  const getRoom = useGetRoom(allJoinedRooms);
  const room = getRoom(roomId);
  const space = spaceId ? getRoom(spaceId) : undefined;

  const close = useCloseUserRoomProfile();
  const reduceMotion = useReducedMotion();

  if (!room) return null;

  return (
    <PopOut
      anchor={cords}
      position={position ?? 'Top'}
      align="Start"
      content={
        <AnimatePresence onExitComplete={onClosed}>
          {open && (
            <motion.div
              key="user-card"
              {...getPopupMotionProps(reduceMotion)}
              style={{
                transformOrigin: (position ?? 'Top') === 'Top' ? 'bottom left' : 'top left',
              }}
            >
              <FocusTrap
                focusTrapOptions={{
                  initialFocus: false,
                  onDeactivate: close,
                  clickOutsideDeactivates: true,
                  escapeDeactivates: stopPropagation,
                }}
              >
                <Menu style={{ width: toRem(340) }}>
                  <SpaceProvider value={space ?? null}>
                    <RoomProvider value={room}>
                      <UserRoomProfile userId={userId} />
                    </RoomProvider>
                  </SpaceProvider>
                </Menu>
              </FocusTrap>
            </motion.div>
          )}
        </AnimatePresence>
      }
    />
  );
}

export function UserRoomProfileRenderer() {
  const state = useUserRoomProfileState();
  const [render, setRender] = useState(state);

  useEffect(() => {
    if (state) setRender(state);
  }, [state]);

  if (!render) return null;
  return (
    <UserRoomProfileContextMenu
      state={render}
      open={!!state}
      onClosed={() => setRender(undefined)}
    />
  );
}
