import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Icon, Icons, Text, config, toRem } from 'folds';
import { EventType } from 'matrix-js-sdk';
import { ReactEditor } from 'slate-react';
import { isKeyHotkey } from 'is-hotkey';
import { useAtomValue } from 'jotai';
import { useStateEvent } from '../../hooks/useStateEvent';
import { StateEvent } from '../../../types/matrix/room';
import { usePowerLevelsContext } from '../../hooks/usePowerLevels';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useEditor } from '../../components/editor';
import { RoomInputPlaceholder } from './RoomInputPlaceholder';
import { RoomTimeline } from './RoomTimeline';
import { RoomViewTyping } from './RoomViewTyping';
import { RoomTombstone } from './RoomTombstone';
import { RoomInput } from './RoomInput';
import { Page } from '../../components/page';
import { useKeyDown } from '../../hooks/useKeyDown';
import { editableActiveElement } from '../../utils/dom';
import { useRoomPermissions } from '../../hooks/useRoomPermissions';
import { useRoomCreators } from '../../hooks/useRoomCreators';
import { useRoom } from '../../hooks/useRoom';
import { roomIdToStyleAtomFamily, defaultStyleAtom } from '../../state/room/roomStyles';
import { bgImageCss, hexToRgba } from '../../utils/chatStyle';

const FN_KEYS_REGEX = /^F\d+$/;
const shouldFocusMessageField = (evt: KeyboardEvent): boolean => {
  const { code } = evt;
  if (evt.metaKey || evt.altKey || evt.ctrlKey) {
    return false;
  }

  if (FN_KEYS_REGEX.test(code)) return false;

  if (
    code.startsWith('OS') ||
    code.startsWith('Meta') ||
    code.startsWith('Shift') ||
    code.startsWith('Alt') ||
    code.startsWith('Control') ||
    code.startsWith('Arrow') ||
    code.startsWith('Page') ||
    code.startsWith('End') ||
    code.startsWith('Home') ||
    code === 'Tab' ||
    code === 'Space' ||
    code === 'Enter' ||
    code === 'NumLock' ||
    code === 'ScrollLock'
  ) {
    return false;
  }

  return true;
};

export function RoomView({ eventId }: { eventId?: string }) {
  const roomInputRef = useRef<HTMLDivElement>(null);
  const roomViewRef = useRef<HTMLDivElement>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);

  const room = useRoom();
  const { roomId } = room;
  const editor = useEditor();
  const roomStyleOverride = useAtomValue(roomIdToStyleAtomFamily(roomId));
  const defaultStyle = useAtomValue(defaultStyleAtom);
  const roomStyle = { ...defaultStyle, ...roomStyleOverride };
  const incomingBg = roomStyle.incomingColor
    ? hexToRgba(roomStyle.incomingColor, roomStyle.incomingOpacity ?? 1)
    : undefined;
  const outgoingBg = roomStyle.outgoingColor
    ? hexToRgba(roomStyle.outgoingColor, roomStyle.outgoingOpacity ?? 1)
    : undefined;

  const mx = useMatrixClient();

  const tombstoneEvent = useStateEvent(room, StateEvent.RoomTombstone);
  const powerLevels = usePowerLevelsContext();
  const creators = useRoomCreators(room);

  const permissions = useRoomPermissions(creators, powerLevels);
  const canMessage = permissions.event(EventType.RoomMessage, mx.getSafeUserId());

  useKeyDown(
    window,
    useCallback(
      (evt) => {
        if (editableActiveElement()) return;
        const portalContainer = document.getElementById('portalContainer');
        if (portalContainer && portalContainer.children.length > 0) {
          return;
        }
        if (shouldFocusMessageField(evt) || isKeyHotkey('mod+v', evt)) {
          ReactEditor.focus(editor);
        }
      },
      [editor]
    )
  );

  return (
    <Page
      ref={roomViewRef}
      style={{
        position: 'relative',
        ...(incomingBg ? { ['--bubble-incoming-bg' as string]: incomingBg } : {}),
        ...(outgoingBg ? { ['--bubble-outgoing-bg' as string]: outgoingBg } : {}),
        ...(roomStyle.incomingTextColor ? { ['--bubble-incoming-text' as string]: roomStyle.incomingTextColor } : {}),
        ...(roomStyle.outgoingTextColor ? { ['--bubble-outgoing-text' as string]: roomStyle.outgoingTextColor } : {}),
        ...(roomStyle.bubbleRadius !== undefined ? { ['--bubble-radius' as string]: `${roomStyle.bubbleRadius}px` } : {}),
        ...(roomStyle.bgImage && !roomStyle.bgPlain ? {
          background: bgImageCss(roomStyle.bgImage, roomStyle.bgDim ?? 0),
          backgroundAttachment: 'local',
        } : {}),
      } as React.CSSProperties}
    >
      {dropZoneActive && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Box
            direction="Column"
            alignItems="Center"
            gap="400"
            style={{
              backgroundColor: 'rgba(30, 30, 30, 0.95)',
              borderRadius: toRem(16),
              padding: toRem(48),
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Icon size="600" src={Icons.File} />
            <Text size="H4" align="Center">
              {`Drop in "${room.name || 'Room'}"`}
            </Text>
          </Box>
        </div>
      )}
      <Box grow="Yes" direction="Column">
        <RoomTimeline
          key={roomId}
          room={room}
          eventId={eventId}
          roomInputRef={roomInputRef}
          editor={editor}
        />
        <RoomViewTyping room={room} />
      </Box>
      <Box shrink="No" direction="Column">
        <div style={{ padding: 0 }}>
          {tombstoneEvent ? (
            <RoomTombstone
              roomId={roomId}
              body={tombstoneEvent.getContent().body}
              replacementRoomId={tombstoneEvent.getContent().replacement_room}
            />
          ) : (
            <>
              {canMessage && (
                <RoomInput
                  room={room}
                  editor={editor}
                  roomId={roomId}
                  fileDropContainerRef={roomViewRef}
                  onDropZoneActiveChange={setDropZoneActive}
                  ref={roomInputRef}
                />
              )}
              {!canMessage && (
                <RoomInputPlaceholder
                  style={{ padding: config.space.S200 }}
                  alignItems="Center"
                  justifyContent="Center"
                >
                  <Text align="Center">You do not have permission to post in this room</Text>
                </RoomInputPlaceholder>
              )}
            </>
          )}
        </div>
      </Box>
    </Page>
  );
}
