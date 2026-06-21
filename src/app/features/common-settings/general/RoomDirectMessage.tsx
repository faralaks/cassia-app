import React from 'react';
import { Box, color, Spinner, Switch, Text } from 'folds';
import { MatrixError } from 'matrix-js-sdk';
import { useAtomValue } from 'jotai';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../../room-settings/styles.css';
import { SettingTile } from '../../../components/setting-tile';
import { useRoom } from '../../../hooks/useRoom';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import {
  addRoomIdToMDirect,
  guessDmRoomUserId,
  removeRoomIdFromMDirect,
} from '../../../utils/matrix';
import { mDirectAtom } from '../../../state/mDirectList';

export function RoomDirectMessage() {
  const mx = useMatrixClient();
  const room = useRoom();
  const mDirects = useAtomValue(mDirectAtom);
  const isDirect = mDirects.has(room.roomId);

  const [toggleState, toggle] = useAsyncCallback(
    React.useCallback(
      async (direct: boolean) => {
        if (direct) {
          const userId = guessDmRoomUserId(room, mx.getSafeUserId());
          await addRoomIdToMDirect(mx, room.roomId, userId);
        } else {
          await removeRoomIdFromMDirect(mx, room.roomId);
        }
      },
      [mx, room]
    )
  );

  const loading = toggleState.status === AsyncStatus.Loading;

  if (room.isSpaceRoom()) return null;

  return (
    <SequenceCard
      className={SequenceCardStyle}
      variant="SurfaceVariant"
      direction="Column"
      gap="400"
    >
      <SettingTile
        title="Direct Message"
        description="Treat this room as a direct message. It will appear under Direct instead of Rooms."
        after={
          <Box gap="200" alignItems="Center">
            {loading && <Spinner variant="Secondary" />}
            <Switch value={isDirect} onChange={toggle} disabled={loading} />
          </Box>
        }
      >
        {toggleState.status === AsyncStatus.Error && (
          <Text style={{ color: color.Critical.Main }} size="T200">
            {(toggleState.error as MatrixError).message}
          </Text>
        )}
      </SettingTile>
    </SequenceCard>
  );
}
