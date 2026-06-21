import React, { useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Box, Icon, IconButton, Icons, Scroll, Text } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { ChatStyleEditor } from '../../settings/chat-style/ChatStyleEditor';
import { useRoom } from '../../../hooks/useRoom';
import {
  defaultStyleAtom,
  roomIdToStyleAtomFamily,
  themeGroupAtom,
} from '../../../state/room/roomStyles';
import { ChatStyle, clearRoomStyle, patchRoomStyle } from '../../../utils/chatStyle';

type RoomChatStylePageProps = { requestClose: () => void };
export function ChatStylePage({ requestClose }: RoomChatStylePageProps) {
  const { roomId } = useRoom();
  const defaultStyle = useAtomValue(defaultStyleAtom);
  const themeGroup = useAtomValue(themeGroupAtom);
  const [roomStyle, setRoomStyle] = useAtom(roomIdToStyleAtomFamily(roomId));

  // Display the effective style (global defaults + this room's overrides) so the
  // controls show what's currently in effect, but every edit writes per-room only.
  const effective: ChatStyle = { ...defaultStyle, ...roomStyle };

  const update = useCallback(
    (patch: Partial<ChatStyle>) => {
      setRoomStyle({ ...roomStyle, ...patch });
      patchRoomStyle(roomId, patch);
    },
    [roomId, roomStyle, setRoomStyle]
  );

  const reset = useCallback(() => {
    setRoomStyle({});
    clearRoomStyle(roomId);
  }, [roomId, setRoomStyle]);

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>Chat Style</Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="500">
              <Box direction="Column" gap="100">
                <Text size="T300" style={{ opacity: 0.6 }}>
                  Starts from your global defaults. Changes here apply only to this chat.
                </Text>
              </Box>
              <ChatStyleEditor
                value={effective}
                onChange={update}
                onReset={reset}
                resetLabel="Reset to defaults"
                themeGroup={themeGroup}
              />
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
