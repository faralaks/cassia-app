import React, { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Membership } from '../../../../types/matrix/room';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { IsDirectRoomProvider, RoomProvider } from '../../../hooks/useRoom';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { JoinBeforeNavigate } from '../../../features/join-before-navigate';
import { getHomePath } from '../../pathUtils';
import { useHomeRooms } from './useHomeRooms';
import { useDirectRooms } from '../direct/useDirectRooms';
import { useSearchParamsViaServers } from '../../../hooks/router/useSearchParamsViaServers';

export function HomeRouteRoomProvider({ children }: { children: ReactNode }) {
  const mx = useMatrixClient();
  const rooms = useHomeRooms();
  const directs = useDirectRooms();

  const { roomIdOrAlias, eventId } = useParams();
  const viaServers = useSearchParamsViaServers();
  const roomId = useSelectedRoom();
  const room = mx.getRoom(roomId);

  const isDirect = room ? directs.includes(room.roomId) : false;

  if (!room || (!rooms.includes(room.roomId) && !isDirect)) {
    // If we just left (or were removed from) this room, don't show its Join
    // preview — go back to the empty home state. The preview is only meant for
    // rooms we were never in (e.g. opening a matrix.to link).
    if (room && room.getMyMembership() === Membership.Leave) {
      return <Navigate to={getHomePath()} replace />;
    }

    return (
      <JoinBeforeNavigate
        roomIdOrAlias={roomIdOrAlias!}
        eventId={eventId}
        viaServers={viaServers}
      />
    );
  }

  return (
    <RoomProvider key={room.roomId} value={room}>
      <IsDirectRoomProvider value={isDirect}>{children}</IsDirectRoomProvider>
    </RoomProvider>
  );
}
