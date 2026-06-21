import React, { useCallback } from 'react';
import { MatrixError, Room } from 'matrix-js-sdk';
import { Avatar, Box, Button, Spinner, Text, color, config, toRem } from 'folds';
import { NavItem, NavItemContent } from '../../components/nav';
import { RoomAvatar } from '../../components/room-avatar';
import {
  getDirectRoomAvatarUrl,
  getMemberDisplayName,
  getRoomAvatarUrl,
  isDirectInvite,
} from '../../utils/room';
import { nameInitials } from '../../utils/common';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { addRoomIdToMDirect, getMxIdLocalPart, guessDmRoomUserId } from '../../utils/matrix';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';

type InviteNavItemProps = {
  room: Room;
  direct?: boolean;
  onJoined?: (roomId: string) => void;
};
export function InviteNavItem({ room, direct, onJoined }: InviteNavItemProps) {
  const mx = useMatrixClient();
  const userId = mx.getSafeUserId();
  const useAuthentication = useMediaAuthentication();

  const roomName = room.name || room.getCanonicalAlias() || room.roomId;
  const senderId = room.getMember(userId)?.events.member?.getSender();
  const senderName = senderId
    ? getMemberDisplayName(room, senderId) ?? getMxIdLocalPart(senderId) ?? senderId
    : 'Unknown';

  const [joinState, join] = useAsyncCallback<void, MatrixError, []>(
    useCallback(async () => {
      const dmUserId = isDirectInvite(room, userId) ? guessDmRoomUserId(room, userId) : undefined;
      await mx.joinRoom(room.roomId);
      if (dmUserId) {
        await addRoomIdToMDirect(mx, room.roomId, dmUserId);
      }
      onJoined?.(room.roomId);
    }, [mx, room, userId, onJoined])
  );

  const joining =
    joinState.status === AsyncStatus.Loading || joinState.status === AsyncStatus.Success;

  return (
    <Box direction="Column">
      <NavItem variant="Background" radii="400">
        <NavItemContent>
          <Box
            as="span"
            grow="Yes"
            alignItems="Center"
            gap="200"
            style={{ padding: `${toRem(6)} 0` }}
          >
            <Avatar size="300" radii="Pill">
              <RoomAvatar
                roomId={room.roomId}
                src={
                  direct
                    ? getDirectRoomAvatarUrl(mx, room, 96, useAuthentication)
                    : getRoomAvatarUrl(mx, room, 96, useAuthentication)
                }
                alt={roomName}
                renderFallback={() => (
                  <Text as="span" size="T300">
                    {nameInitials(roomName)}
                  </Text>
                )}
              />
            </Avatar>
            <Box as="span" grow="Yes" direction="Column" style={{ minWidth: 0 }}>
              <Text as="span" size="T300" truncate style={{ fontWeight: 600 }}>
                {roomName}
              </Text>
              <Text as="span" size="T200" priority="300" truncate>
                Invited by {senderName}
              </Text>
            </Box>
            <Button
              size="300"
              variant="Success"
              fill="Soft"
              radii="300"
              outlined
              onClick={join}
              disabled={joining}
              before={joining ? <Spinner variant="Success" fill="Soft" size="100" /> : undefined}
            >
              <Text size="B300">Join</Text>
            </Button>
          </Box>
        </NavItemContent>
      </NavItem>
      {joinState.status === AsyncStatus.Error && (
        <Text
          size="T200"
          style={{ color: color.Critical.Main, padding: `0 ${config.space.S200}` }}
        >
          {joinState.error.message}
        </Text>
      )}
    </Box>
  );
}
