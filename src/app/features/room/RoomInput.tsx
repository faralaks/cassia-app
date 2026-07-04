import React, {
  KeyboardEventHandler,
  RefObject,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { atom, useAtom, useAtomValue } from 'jotai';
import { isKeyHotkey } from 'is-hotkey';
import { EventType, IContent, MsgType, RelationType, Room } from 'matrix-js-sdk';
import { ReactEditor } from 'slate-react';
import { Transforms, Editor, Range } from 'slate';
import {
  Box,
  Dialog,
  Icon,
  IconButton,
  Icons,
  Line,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  PopOut,
  Scroll,
  Text,
  color,
  config,
  toRem,
} from 'folds';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { getPopupMotionProps } from '../../components/popupMotion';

import { useMatrixClient } from '../../hooks/useMatrixClient';
import {
  CustomEditor,
  Toolbar,
  toMatrixCustomHTML,
  toPlainText,
  AUTOCOMPLETE_PREFIXES,
  AutocompletePrefix,
  AutocompleteQuery,
  getAutocompleteQuery,
  getPrevWorldRange,
  resetEditor,
  RoomMentionAutocomplete,
  UserMentionAutocomplete,
  EmoticonAutocomplete,
  createEmoticonElement,
  createLinkElement,
  moveCursor,
  replaceWithElement,
  selectInsertedLink,
  resetEditorHistory,
  customHtmlEqualsPlainText,
  trimCustomHtml,
  isEmptyEditor,
  getBeginCommand,
  trimCommand,
  getMentions,
} from '../../components/editor';
import { EmojiBoard, EmojiBoardTab } from '../../components/emoji-board';
import { UseStateProvider } from '../../components/UseStateProvider';
import {
  TUploadContent,
  encryptFile,
  getImageInfo,
  getMxIdLocalPart,
  mxcUrlToHttp,
} from '../../utils/matrix';
import { useTypingStatusUpdater } from '../../hooks/useTypingStatusUpdater';
import { useFilePicker } from '../../hooks/useFilePicker';
import { useFilePasteHandler } from '../../hooks/useFilePasteHandler';
import { useFileDropZone } from '../../hooks/useFileDrop';
import {
  TUploadItem,
  TUploadMetadata,
  roomIdToMsgDraftAtomFamily,
  roomIdToReplyDraftAtomFamily,
  roomIdToUploadItemsAtomFamily,
  roomUploadAtomFamily,
} from '../../state/room/roomInputDrafts';
import { dragDropPendingAtom } from '../../state/dragDropPending';
import { UploadCardRenderer } from '../../components/upload-card';
import {
  UploadBoard,
  UploadBoardContent,
  UploadBoardHeader,
  UploadBoardImperativeHandlers,
} from '../../components/upload-board';
import {
  Upload,
  UploadStatus,
  UploadSuccess,
  createUploadFamilyObserverAtom,
} from '../../state/upload';
import { getImageUrlBlob, loadImageElement } from '../../utils/dom';
import { safeFile } from '../../utils/mimeTypes';
import { compressImageFile, isCompressibleImage } from '../../utils/imageCompression';
import { fulfilledPromiseSettledResult } from '../../utils/common';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import {
  getAudioMsgContent,
  getFileMsgContent,
  getImageMsgContent,
  getVideoMsgContent,
  getVoiceMsgContent,
} from './msgContent';
import { getMemberDisplayName, getMentionContent, trimReplyFromBody } from '../../utils/room';
import { CommandAutocomplete } from './CommandAutocomplete';
import { Command, SHRUG, TABLEFLIP, UNFLIP, useCommands } from '../../hooks/useCommands';
import { mobileOrTablet } from '../../utils/user-agent';
import { useElementSizeObserver } from '../../hooks/useElementSizeObserver';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { ReplyLayout, ThreadIndicator } from '../../components/message';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useImagePackRooms } from '../../hooks/useImagePackRooms';
import { usePowerLevelsContext } from '../../hooks/usePowerLevels';
import colorMXID from '../../../util/colorMXID';
import { useIsDirectRoom } from '../../hooks/useRoom';
import { useAccessiblePowerTagColors, useGetMemberPowerTag } from '../../hooks/useMemberPowerTag';
import { useRoomCreators } from '../../hooks/useRoomCreators';
import { useTheme } from '../../hooks/useTheme';
import { useRoomCreatorsTag } from '../../hooks/useRoomCreatorsTag';
import { usePowerLevelTags } from '../../hooks/usePowerLevelTags';
import { useComposingCheck } from '../../hooks/useComposingCheck';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { VoiceRecordingBar } from './VoiceRecordingBar';

const emojiBoardTabAtom = atom<EmojiBoardTab>(EmojiBoardTab.Emoji);

interface RoomInputProps {
  editor: Editor;
  fileDropContainerRef: RefObject<HTMLElement>;
  roomId: string;
  room: Room;
  onDropZoneActiveChange?: (active: boolean) => void;
}
export const RoomInput = forwardRef<HTMLDivElement, RoomInputProps>(
  ({ editor, fileDropContainerRef, roomId, room, onDropZoneActiveChange }, ref) => {
    const mx = useMatrixClient();
    const useAuthentication = useMediaAuthentication();
    const reduceMotion = useReducedMotion();
    const screenSize = useScreenSizeContext();
    const mobile = screenSize === ScreenSize.Mobile;
    // Telegram-style mobile composer: circled outline icon buttons flanking
    // the rounded text pill (see the Editor `pill` prop). Desktop keeps the
    // compact square buttons.
    const composerBtnProps = mobile
      ? ({ size: '400', radii: 'Pill', outlined: true } as const)
      : ({ size: '300', radii: '300' } as const);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [emojiMounted, setEmojiMounted] = useState(false);
    const [emojiTab, setEmojiTab] = useAtom(emojiBoardTabAtom);
    const [enterForNewline] = useSetting(settingsAtom, 'enterForNewline');
    const [isMarkdown] = useSetting(settingsAtom, 'isMarkdown');
    const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
    const [legacyUsernameColor] = useSetting(settingsAtom, 'legacyUsernameColor');
    const [compressImages] = useSetting(settingsAtom, 'compressImages');
    const [imageUploadLimitMB] = useSetting(settingsAtom, 'imageUploadLimitMB');
    const [imageCompressQuality] = useSetting(settingsAtom, 'imageCompressQuality');
    const direct = useIsDirectRoom();
    const commands = useCommands(mx, room);
    const emojiBtnRef = useRef<HTMLButtonElement>(null);
    const roomToParents = useAtomValue(roomToParentsAtom);
    const powerLevels = usePowerLevelsContext();
    const creators = useRoomCreators(room);

    const [msgDraft, setMsgDraft] = useAtom(roomIdToMsgDraftAtomFamily(roomId));
    const [replyDraft, setReplyDraft] = useAtom(roomIdToReplyDraftAtomFamily(roomId));
    const replyUserID = replyDraft?.userId;

    const powerLevelTags = usePowerLevelTags(room, powerLevels);
    const creatorsTag = useRoomCreatorsTag();
    const getMemberPowerTag = useGetMemberPowerTag(room, creators, powerLevels);
    const theme = useTheme();
    const accessibleTagColors = useAccessiblePowerTagColors(
      theme.kind,
      creatorsTag,
      powerLevelTags
    );

    const replyPowerTag = replyUserID ? getMemberPowerTag(replyUserID) : undefined;
    const replyPowerColor = replyPowerTag?.color
      ? accessibleTagColors.get(replyPowerTag.color)
      : undefined;
    const replyUsernameColor =
      legacyUsernameColor || direct ? colorMXID(replyUserID ?? '') : replyPowerColor;

    const [uploadBoard, setUploadBoard] = useState(true);
    const [selectedFiles, setSelectedFiles] = useAtom(roomIdToUploadItemsAtomFamily(roomId));
    const uploadFamilyObserverAtom = createUploadFamilyObserverAtom(
      roomUploadAtomFamily,
      selectedFiles.map((f) => f.file)
    );
    const uploadBoardHandlers = useRef<UploadBoardImperativeHandlers>();

    const imagePackRooms: Room[] = useImagePackRooms(roomId, roomToParents);

    const [toolbar, setToolbar] = useSetting(settingsAtom, 'editorToolbar');
    const [autocompleteQuery, setAutocompleteQuery] =
      useState<AutocompleteQuery<AutocompletePrefix>>();

    const sendTypingStatus = useTypingStatusUpdater(mx, roomId);

    const handleFiles = useCallback(
      async (files: File[]) => {
        setUploadBoard(true);
        const safeFiles = files.map(safeFile);
        const limitBytes = imageUploadLimitMB * 1024 * 1024;
        const processedFiles = await Promise.all(
          safeFiles.map(async (f) => {
            if (!compressImages || !isCompressibleImage(f) || f.size <= limitBytes) return f;
            try {
              return await compressImageFile(f, {
                quality: imageCompressQuality,
                maxBytes: limitBytes,
              });
            } catch {
              return f;
            }
          })
        );
        const fileItems: TUploadItem[] = [];

        if (room.hasEncryptionStateEvent()) {
          const encryptFiles = fulfilledPromiseSettledResult(
            await Promise.allSettled(processedFiles.map((f) => encryptFile(f)))
          );
          encryptFiles.forEach((ef) =>
            fileItems.push({
              ...ef,
              metadata: {
                markedAsSpoiler: false,
              },
            })
          );
        } else {
          processedFiles.forEach((f) =>
            fileItems.push({
              file: f,
              originalFile: f,
              encInfo: undefined,
              metadata: {
                markedAsSpoiler: false,
              },
            })
          );
        }
        setSelectedFiles({
          type: 'PUT',
          item: fileItems,
        });
      },
      [setSelectedFiles, room, compressImages, imageUploadLimitMB, imageCompressQuality]
    );
    const pickFile = useFilePicker(handleFiles, true);
    const handlePaste = useFilePasteHandler(handleFiles);

    const handleLinkPaste = useCallback(
      (evt: React.ClipboardEvent): boolean => {
        const { selection } = editor;
        if (!selection || Range.isCollapsed(selection)) return false;

        const text = evt.clipboardData.getData('text/plain').trim();
        if (!/^https?:\/\/\S+$/i.test(text)) return false;

        evt.preventDefault();
        const selectedText = Editor.string(editor, selection);
        const linkEl = createLinkElement(text, selectedText);
        replaceWithElement(editor, selection, linkEl);
        selectInsertedLink(editor, text);
        ReactEditor.focus(editor);
        return true;
      },
      [editor]
    );

    const handleEditorPaste: React.ClipboardEventHandler = useCallback(
      (evt) => {
        if (handleLinkPaste(evt)) return;
        handlePaste(evt);
      },
      [handleLinkPaste, handlePaste]
    );
    const dropZoneVisible = useFileDropZone(fileDropContainerRef, handleFiles);

    useEffect(() => {
      onDropZoneActiveChange?.(dropZoneVisible);
    }, [dropZoneVisible, onDropZoneActiveChange]);

    // Consume files queued by a sidebar nav-item drop for this room.
    const [pendingDrop, setPendingDrop] = useAtom(dragDropPendingAtom);
    useEffect(() => {
      if (!pendingDrop || pendingDrop.roomId !== roomId) return;
      setPendingDrop(null);
      handleFiles(pendingDrop.files);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, pendingDrop]);

    const [hideStickerBtn, setHideStickerBtn] = useState(document.body.clientWidth < 500);

    const isComposing = useComposingCheck();

    const [isEmpty, setIsEmpty] = useState(true);
    const voice = useVoiceRecorder();
    const recording = voice.state === 'recording';

    useElementSizeObserver(
      useCallback(() => fileDropContainerRef.current, [fileDropContainerRef]),
      useCallback((width) => setHideStickerBtn(width < 500), [])
    );

    useEffect(() => {
      Transforms.insertFragment(editor, msgDraft);
    }, [editor, msgDraft]);

    useEffect(
      () => () => {
        if (!isEmptyEditor(editor)) {
          const parsedDraft = JSON.parse(JSON.stringify(editor.children));
          setMsgDraft(parsedDraft);
        } else {
          setMsgDraft([]);
        }
        resetEditor(editor);
        resetEditorHistory(editor);
      },
      [roomId, editor, setMsgDraft]
    );

    const handleFileMetadata = useCallback(
      (fileItem: TUploadItem, metadata: TUploadMetadata) => {
        setSelectedFiles({
          type: 'REPLACE',
          item: fileItem,
          replacement: { ...fileItem, metadata },
        });
      },
      [setSelectedFiles]
    );

    const handleRemoveUpload = useCallback(
      (upload: TUploadContent | TUploadContent[]) => {
        const uploads = Array.isArray(upload) ? upload : [upload];
        setSelectedFiles({
          type: 'DELETE',
          item: selectedFiles.filter((f) => uploads.find((u) => u === f.file)),
        });
        uploads.forEach((u) => roomUploadAtomFamily.remove(u));
      },
      [setSelectedFiles, selectedFiles]
    );

    const handleReplaceFile = useCallback(
      async (fileItem: TUploadItem, newOriginalFile: File) => {
        let replacement: TUploadItem;
        if (room.hasEncryptionStateEvent()) {
          const enc = await encryptFile(newOriginalFile);
          replacement = {
            file: enc.file,
            originalFile: enc.originalFile,
            encInfo: enc.encInfo,
            metadata: fileItem.metadata,
          };
        } else {
          replacement = {
            file: newOriginalFile,
            originalFile: newOriginalFile,
            encInfo: undefined,
            metadata: fileItem.metadata,
          };
        }
        roomUploadAtomFamily.remove(fileItem.file);
        setSelectedFiles({ type: 'REPLACE', item: fileItem, replacement });
      },
      [room, setSelectedFiles]
    );

    const handleCancelUpload = (uploads: Upload[]) => {
      uploads.forEach((upload) => {
        if (upload.status === UploadStatus.Loading) {
          mx.cancelUpload(upload.promise);
        }
      });
      handleRemoveUpload(uploads.map((upload) => upload.file));
    };

    const handleSendUpload = async (uploads: UploadSuccess[]) => {
      const contentsPromises = uploads.map(async (upload) => {
        const fileItem = selectedFiles.find((f) => f.file === upload.file);
        if (!fileItem) throw new Error('Broken upload');

        if (fileItem.file.type.startsWith('image')) {
          return getImageMsgContent(mx, fileItem, upload.mxc);
        }
        if (fileItem.file.type.startsWith('video')) {
          return getVideoMsgContent(mx, fileItem, upload.mxc);
        }
        if (fileItem.file.type.startsWith('audio')) {
          return getAudioMsgContent(fileItem, upload.mxc);
        }
        return getFileMsgContent(fileItem, upload.mxc);
      });
      handleCancelUpload(uploads);
      const contents = fulfilledPromiseSettledResult(await Promise.allSettled(contentsPromises));
      contents.forEach((content) => mx.sendMessage(roomId, content as any));
    };

    const submit = useCallback(() => {
      uploadBoardHandlers.current?.handleSend();

      const commandName = getBeginCommand(editor);
      let plainText = toPlainText(editor.children, isMarkdown).trim();
      let customHtml = trimCustomHtml(
        toMatrixCustomHTML(editor.children, {
          allowTextFormatting: true,
          allowBlockMarkdown: isMarkdown,
          allowInlineMarkdown: isMarkdown,
        })
      );
      let msgType = MsgType.Text;

      if (commandName) {
        plainText = trimCommand(commandName, plainText);
        customHtml = trimCommand(commandName, customHtml);
      }
      if (commandName === Command.Me) {
        msgType = MsgType.Emote;
      } else if (commandName === Command.Notice) {
        msgType = MsgType.Notice;
      } else if (commandName === Command.Shrug) {
        plainText = `${SHRUG} ${plainText}`;
        customHtml = `${SHRUG} ${customHtml}`;
      } else if (commandName === Command.TableFlip) {
        plainText = `${TABLEFLIP} ${plainText}`;
        customHtml = `${TABLEFLIP} ${customHtml}`;
      } else if (commandName === Command.UnFlip) {
        plainText = `${UNFLIP} ${plainText}`;
        customHtml = `${UNFLIP} ${customHtml}`;
      } else if (commandName) {
        const commandContent = commands[commandName as Command];
        if (commandContent) {
          commandContent.exe(plainText);
        }
        resetEditor(editor);
        resetEditorHistory(editor);
        sendTypingStatus(false);
        return;
      }

      if (plainText === '') {
        if (selectedFiles.length === 0) return;
        resetEditor(editor);
        resetEditorHistory(editor);
        setReplyDraft(undefined);
        sendTypingStatus(false);
        return;
      }

      const body = plainText;
      const formattedBody = customHtml;
      const mentionData = getMentions(mx, roomId, editor);

      const content: IContent = {
        msgtype: msgType,
        body,
      };

      if (replyDraft && replyDraft.userId !== mx.getUserId()) {
        mentionData.users.add(replyDraft.userId);
      }

      const mMentions = getMentionContent(Array.from(mentionData.users), mentionData.room);
      content['m.mentions'] = mMentions;

      if (replyDraft || !customHtmlEqualsPlainText(formattedBody, body)) {
        content.format = 'org.matrix.custom.html';
        content.formatted_body = formattedBody;
      }
      if (replyDraft) {
        content['m.relates_to'] = {
          'm.in_reply_to': {
            event_id: replyDraft.eventId,
          },
        };
        if (replyDraft.relation?.rel_type === RelationType.Thread) {
          content['m.relates_to'].event_id = replyDraft.relation.event_id;
          content['m.relates_to'].rel_type = RelationType.Thread;
          content['m.relates_to'].is_falling_back = false;
        }
      }
      mx.sendMessage(roomId, content as any);
      resetEditor(editor);
      resetEditorHistory(editor);
      setReplyDraft(undefined);
      sendTypingStatus(false);
    }, [
      mx,
      roomId,
      editor,
      replyDraft,
      sendTypingStatus,
      setReplyDraft,
      isMarkdown,
      commands,
      selectedFiles,
    ]);

    const handleKeyDown: KeyboardEventHandler = useCallback(
      (evt) => {
        if (
          (isKeyHotkey('mod+enter', evt) || (!enterForNewline && isKeyHotkey('enter', evt))) &&
          !isComposing(evt)
        ) {
          evt.preventDefault();
          submit();
        }
        if (isKeyHotkey('escape', evt)) {
          evt.preventDefault();
          if (autocompleteQuery) {
            setAutocompleteQuery(undefined);
            return;
          }
          setReplyDraft(undefined);
        }
      },
      [submit, setReplyDraft, enterForNewline, autocompleteQuery, isComposing]
    );

    const handleKeyUp: KeyboardEventHandler = useCallback(
      (evt) => {
        if (isKeyHotkey('escape', evt)) {
          evt.preventDefault();
          return;
        }

        if (!hideActivity) {
          sendTypingStatus(!isEmptyEditor(editor));
        }

        const prevWordRange = getPrevWorldRange(editor);
        const query = prevWordRange
          ? getAutocompleteQuery<AutocompletePrefix>(editor, prevWordRange, AUTOCOMPLETE_PREFIXES)
          : undefined;
        setAutocompleteQuery(query);
      },
      [editor, sendTypingStatus, hideActivity]
    );

    const handleCloseAutocomplete = useCallback(() => {
      setAutocompleteQuery(undefined);
      ReactEditor.focus(editor);
    }, [editor]);

    const handleEmoticonSelect = (key: string, shortcode: string) => {
      editor.insertNode(createEmoticonElement(key, shortcode));
      moveCursor(editor);
    };

    const handleStickerSelect = async (mxc: string, shortcode: string, label: string) => {
      const stickerUrl = mxcUrlToHttp(mx, mxc, useAuthentication);
      if (!stickerUrl) return;

      const info = await getImageInfo(
        await loadImageElement(stickerUrl),
        await getImageUrlBlob(stickerUrl)
      );

      mx.sendEvent(roomId, EventType.Sticker, {
        body: label,
        url: mxc,
        info,
      });
    };

    const handleEditorChange = useCallback(() => {
      setIsEmpty(isEmptyEditor(editor));
    }, [editor]);

    const sendVoice = useCallback(async () => {
      const result = await voice.stop();
      if (!result) return;
      const { blob, mimeType, durationMs, waveform } = result;
      // ignore accidental taps that produce a sub-second clip
      if (durationMs < 500 || blob.size === 0) return;

      const encrypt = room.hasEncryptionStateEvent();
      let uploadFile: TUploadContent = blob;
      let encInfo: Awaited<ReturnType<typeof encryptFile>>['encInfo'] | undefined;
      if (encrypt) {
        const enc = await encryptFile(new File([blob], 'voice-message', { type: mimeType }));
        uploadFile = enc.file;
        encInfo = enc.encInfo;
      }

      const data = await mx.uploadContent(uploadFile, {
        type: mimeType,
        includeFilename: false,
      });
      const mxc = data?.content_uri;
      if (!mxc) return;

      const content = getVoiceMsgContent(
        mxc,
        mimeType,
        blob.size,
        Math.round(durationMs),
        waveform,
        encInfo
      );
      mx.sendMessage(roomId, content as any);
    }, [voice, room, mx, roomId]);

    return (
      <div ref={ref}>
        {selectedFiles.length > 0 && (
          <UploadBoard
            header={
              <UploadBoardHeader
                open={uploadBoard}
                onToggle={() => setUploadBoard(!uploadBoard)}
                uploadFamilyObserverAtom={uploadFamilyObserverAtom}
                onSend={handleSendUpload}
                imperativeHandlerRef={uploadBoardHandlers}
                onCancel={handleCancelUpload}
              />
            }
          >
            {uploadBoard && (
              <Scroll size="300" hideTrack visibility="Hover">
                <UploadBoardContent>
                  {Array.from(selectedFiles)
                    .reverse()
                    .map((fileItem, index) => (
                      <UploadCardRenderer
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        isEncrypted={!!fileItem.encInfo}
                        fileItem={fileItem}
                        setMetadata={handleFileMetadata}
                        onRemove={handleRemoveUpload}
                        onReplace={handleReplaceFile}
                      />
                    ))}
                </UploadBoardContent>
              </Scroll>
            )}
          </UploadBoard>
        )}
        {autocompleteQuery?.prefix === AutocompletePrefix.RoomMention && (
          <RoomMentionAutocomplete
            roomId={roomId}
            editor={editor}
            query={autocompleteQuery}
            requestClose={handleCloseAutocomplete}
          />
        )}
        {autocompleteQuery?.prefix === AutocompletePrefix.UserMention && (
          <UserMentionAutocomplete
            room={room}
            editor={editor}
            query={autocompleteQuery}
            requestClose={handleCloseAutocomplete}
          />
        )}
        {autocompleteQuery?.prefix === AutocompletePrefix.Emoticon && (
          <EmoticonAutocomplete
            imagePackRooms={imagePackRooms}
            editor={editor}
            query={autocompleteQuery}
            requestClose={handleCloseAutocomplete}
          />
        )}
        {autocompleteQuery?.prefix === AutocompletePrefix.Command && (
          <CommandAutocomplete
            room={room}
            editor={editor}
            query={autocompleteQuery}
            requestClose={handleCloseAutocomplete}
          />
        )}
        <CustomEditor
          editableName="RoomInput"
          editor={editor}
          placeholder="Send a message..."
          pill={mobile}
          style={{
            backgroundColor: color.Background.Container,
            borderRadius: 0,
            boxShadow: 'none',
            borderTop: `${config.borderWidth.B300} solid ${color.Background.ContainerLine}`,
            // Extend the input bar into the iOS home-indicator / gesture area so
            // the text row sits above it instead of under it. Collapses to zero
            // while the keyboard is open (see --bottom-bar-inset in index.css).
            paddingBottom: 'var(--bottom-bar-inset, 0px)',
            // Breathing room so the circled buttons aren't glued to the screen
            // edges (Telegram-style bar).
            ...(mobile ? { paddingLeft: config.space.S200, paddingRight: config.space.S200 } : {}),
          }}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onChange={handleEditorChange}
          onPaste={handleEditorPaste}
          replaceTextarea={
            recording ? (
              <VoiceRecordingBar elapsed={voice.elapsed} levels={voice.levels} />
            ) : undefined
          }
          top={
            <>
              <AnimatePresence initial={false}>
                {toolbar && (
                  <motion.div
                    key="editor-toolbar"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.15, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <Toolbar />
                    <Line variant="SurfaceVariant" size="300" />
                  </motion.div>
                )}
              </AnimatePresence>
              {replyDraft && (
                <div>
                  <Box
                    alignItems="Center"
                    gap="300"
                    style={{ padding: `${config.space.S200} ${config.space.S300} 0` }}
                  >
                    <IconButton
                      onClick={() => setReplyDraft(undefined)}
                      variant="SurfaceVariant"
                      size="300"
                      radii="300"
                    >
                      <Icon src={Icons.Cross} size="50" />
                    </IconButton>
                    <Box direction="Row" gap="200" alignItems="Center">
                      {replyDraft.relation?.rel_type === RelationType.Thread && <ThreadIndicator />}
                      <ReplyLayout
                        userColor={replyUsernameColor}
                        username={
                          <Text size="T300" truncate>
                            <b>
                              {getMemberDisplayName(room, replyDraft.userId) ??
                                getMxIdLocalPart(replyDraft.userId) ??
                                replyDraft.userId}
                            </b>
                          </Text>
                        }
                      >
                        <Text size="T300" truncate>
                          {trimReplyFromBody(replyDraft.body)}
                        </Text>
                      </ReplyLayout>
                    </Box>
                  </Box>
                </div>
              )}
            </>
          }
          before={
            recording ? (
              <IconButton
                onClick={voice.cancel}
                variant="SurfaceVariant"
                fill="None"
                {...composerBtnProps}
                aria-label="Delete recording"
              >
                <Icon src={Icons.Delete} />
              </IconButton>
            ) : (
              <IconButton
                onClick={() => pickFile('*')}
                variant="SurfaceVariant"
                fill="None"
                {...composerBtnProps}
              >
                <Icon src={Icons.PlusCircle} />
              </IconButton>
            )
          }
          after={
            recording ? (
              <IconButton
                onClick={sendVoice}
                variant="SurfaceVariant"
                fill="None"
                {...composerBtnProps}
                aria-label="Send voice message"
              >
                <Icon src={Icons.Send} />
              </IconButton>
            ) : (
              <>
                <IconButton
                  variant="SurfaceVariant"
                  fill="None"
                  {...composerBtnProps}
                  onClick={() => setToolbar(!toolbar)}
                >
                  <Icon src={toolbar ? Icons.AlphabetUnderline : Icons.Alphabet} />
                </IconButton>
                <PopOut
                  offset={16}
                  alignOffset={-44}
                  position="Top"
                  align="End"
                  anchor={
                    emojiMounted
                      ? emojiBtnRef.current?.getBoundingClientRect() ?? undefined
                      : undefined
                  }
                  content={
                    <AnimatePresence onExitComplete={() => setEmojiMounted(false)}>
                      {emojiOpen && (
                        <motion.div
                          key="emoji-board"
                          {...getPopupMotionProps(reduceMotion)}
                          style={{ transformOrigin: 'bottom right' }}
                        >
                          <EmojiBoard
                            tab={emojiTab}
                            onTabChange={setEmojiTab}
                            imagePackRooms={imagePackRooms}
                            returnFocusOnDeactivate={false}
                            onEmojiSelect={handleEmoticonSelect}
                            onCustomEmojiSelect={handleEmoticonSelect}
                            onStickerSelect={handleStickerSelect}
                            requestClose={() => {
                              setEmojiOpen(false);
                              if (!mobileOrTablet()) ReactEditor.focus(editor);
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  }
                >
                  <IconButton
                    ref={emojiBtnRef}
                    aria-pressed={emojiOpen}
                    onClick={() => {
                      if (emojiOpen) {
                        setEmojiOpen(false);
                      } else {
                        setEmojiMounted(true);
                        setEmojiOpen(true);
                      }
                    }}
                    variant="SurfaceVariant"
                    fill="None"
                    {...composerBtnProps}
                  >
                    <Icon src={Icons.Smile} filled={emojiOpen} />
                  </IconButton>
                </PopOut>
                {isEmpty && selectedFiles.length === 0 ? (
                  <IconButton
                    onClick={() => voice.start()}
                    variant="SurfaceVariant"
                    fill="None"
                    {...composerBtnProps}
                    aria-label="Record voice message"
                  >
                    <Icon src={Icons.Mic} />
                  </IconButton>
                ) : (
                  <IconButton
                    onClick={submit}
                    variant="SurfaceVariant"
                    fill="None"
                    {...composerBtnProps}
                  >
                    <Icon src={Icons.Send} />
                  </IconButton>
                )}
              </>
            )
          }
        />
      </div>
    );
  }
);
