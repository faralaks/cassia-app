/* eslint-disable no-param-reassign */
import React, {
  ClipboardEventHandler,
  KeyboardEventHandler,
  ReactNode,
  forwardRef,
  useCallback,
  useState,
} from 'react';
import { Box, Scroll, Text } from 'folds';
import { Descendant, Editor, Element, Transforms, createEditor } from 'slate';
import {
  Slate,
  Editable,
  withReact,
  RenderLeafProps,
  RenderElementProps,
  RenderPlaceholderProps,
} from 'slate-react';
import { withHistory } from 'slate-history';
import { BlockType } from './types';
import { RenderElement, RenderLeaf } from './Elements';
import { CustomElement } from './slate';
import * as css from './Editor.css';
import { toggleKeyboardShortcut } from './keyboard';

const initialValue: CustomElement[] = [
  {
    type: BlockType.Paragraph,
    children: [{ text: '' }],
  },
];

const withInline = (editor: Editor): Editor => {
  const { isInline } = editor;

  editor.isInline = (element) =>
    [BlockType.Mention, BlockType.Emoticon, BlockType.Link, BlockType.Command].includes(
      element.type
    ) || isInline(element);

  return editor;
};

const withVoid = (editor: Editor): Editor => {
  const { isVoid } = editor;

  editor.isVoid = (element) =>
    [BlockType.Mention, BlockType.Emoticon, BlockType.Command].includes(element.type) ||
    isVoid(element);

  return editor;
};

const withCustomNormalize = (editor: Editor): Editor => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (Element.isElement(node) && node.type === BlockType.Link && Editor.string(editor, path) === '') {
      Transforms.unwrapNodes(editor, { at: path });
      return;
    }

    normalizeNode(entry);
  };

  return editor;
};

export const useEditor = (): Editor => {
  const [editor] = useState(() =>
    withInline(withVoid(withCustomNormalize(withReact(withHistory(createEditor())))))
  );
  return editor;
};

export type EditorChangeHandler = (value: Descendant[]) => void;
type CustomEditorProps = {
  editableName?: string;
  top?: ReactNode;
  bottom?: ReactNode;
  before?: ReactNode;
  after?: ReactNode;
  replaceTextarea?: ReactNode;
  maxHeight?: string;
  editor: Editor;
  placeholder?: string;
  style?: React.CSSProperties;
  onKeyDown?: KeyboardEventHandler;
  onKeyUp?: KeyboardEventHandler;
  onChange?: EditorChangeHandler;
  onPaste?: ClipboardEventHandler;
};
export const CustomEditor = forwardRef<HTMLDivElement, CustomEditorProps>(
  (
    {
      editableName,
      top,
      bottom,
      before,
      after,
      replaceTextarea,
      maxHeight = '50vh',
      editor,
      placeholder,
      style,
      onKeyDown,
      onKeyUp,
      onChange,
      onPaste,
    },
    ref
  ) => {
    const renderElement = useCallback(
      (props: RenderElementProps) => <RenderElement {...props} />,
      []
    );

    const renderLeaf = useCallback((props: RenderLeafProps) => <RenderLeaf {...props} />, []);

    const handleKeydown: KeyboardEventHandler = useCallback(
      (evt) => {
        onKeyDown?.(evt);
        const shortcutToggled = toggleKeyboardShortcut(editor, evt);
        if (shortcutToggled) evt.preventDefault();
      },
      [editor, onKeyDown]
    );

    const renderPlaceholder = useCallback(
      ({ attributes, children }: RenderPlaceholderProps) => (
        <span {...attributes} className={css.EditorPlaceholderContainer}>
          {/* Inner component to style the actual text position and appearance */}
          <Text as="span" className={css.EditorPlaceholderTextVisual} truncate>
            {children}
          </Text>
        </span>
      ),
      []
    );

    return (
      <div className={css.Editor} style={style} ref={ref}>
        <Slate editor={editor} initialValue={initialValue} onChange={onChange}>
          {top}
          <Box alignItems="Start">
            {before && (
              <Box className={css.EditorOptions} alignItems="Center" gap="100" shrink="No">
                {before}
              </Box>
            )}
            {replaceTextarea ?? (
              <Scroll
                className={css.EditorTextareaScroll}
                variant="SurfaceVariant"
                style={{ maxHeight }}
                size="300"
                visibility="Hover"
                hideTrack
              >
                <Editable
                  data-editable-name={editableName}
                  className={css.EditorTextarea}
                  placeholder={placeholder}
                  renderPlaceholder={renderPlaceholder}
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  onKeyDown={handleKeydown}
                  onKeyUp={onKeyUp}
                  onPaste={onPaste}
                  // Best-effort iOS keyboard hints. Safari still draws the
                  // accessory bar over contentEditable, but these keep the
                  // keyboard sensible (sentence case, send key). Spread+cast
                  // because slate's Editable prop types omit these DOM attrs,
                  // though it forwards them to the contentEditable node.
                  {...({
                    enterKeyHint: 'send',
                    autoCapitalize: 'sentences',
                    autoCorrect: 'on',
                  } as Record<string, string>)}
                />
              </Scroll>
            )}
            {after && (
              <Box className={css.EditorOptions} alignItems="Center" gap="100" shrink="No">
                {after}
              </Box>
            )}
          </Box>
          {bottom}
        </Slate>
      </div>
    );
  }
);
