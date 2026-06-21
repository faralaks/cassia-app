import React, { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { IsDirectRoomProvider, RoomProvider } from '../../../hooks/useRoom';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { JoinBeforeNavigate } from '../../../features/join-before-navigate';
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
