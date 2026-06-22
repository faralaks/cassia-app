import React, { useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Box, Scroll, Text } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SettingsPageCloseButton } from '../../../components/SettingsPageCloseButton';
import { defaultStyleAtom, themeGroupAtom } from '../../../state/room/roomStyles';
import { ChatStyleEditor } from './ChatStyleEditor';
import { builtinDefaultStyle, ChatStyle, clearDefaultStyle } from '../../../utils/chatStyle';

type ChatStylePageProps = { requestClose: () => void };
export function ChatStylePage({ requestClose }: ChatStylePageProps) {
  const [style, setStyleAtom] = useAtom(defaultStyleAtom);
  const themeGroup = useAtomValue(themeGroupAtom);

  const update = useCallback(
    (patch: Partial<ChatStyle>) => setStyleAtom({ ...style, ...patch }),
    [style, setStyleAtom]
  );

  const reset = useCallback(() => {
    // Restore the built-in defaults for the active theme group (bundled
    // background + preferred colors), not an empty style.
    clearDefaultStyle(themeGroup);
    setStyleAtom(builtinDefaultStyle(themeGroup));
  }, [setStyleAtom, themeGroup]);

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Chat Style
            </Text>
          </Box>
          <SettingsPageCloseButton onClose={requestClose} />
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="500">
              <Box direction="Column" gap="100">
                <Text size="T300" style={{ opacity: 0.6 }}>
                  Defaults applied to all chats. Per-chat settings (in a room&apos;s settings) take
                  priority.
                </Text>
              </Box>
              <ChatStyleEditor
                value={style}
                onChange={update}
                onReset={reset}
                resetLabel="Reset all defaults"
                themeGroup={themeGroup}
              />
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
