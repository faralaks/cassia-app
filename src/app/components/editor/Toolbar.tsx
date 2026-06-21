import FocusTrap from 'focus-trap-react';
import {
  Badge,
  Box,
  Button,
  config,
  Icon,
  IconButton,
  Icons,
  IconSrc,
  Input,
  Line,
  Menu,
  PopOut,
  RectCords,
  Scroll,
  Text,
  Tooltip,
  TooltipProvider,
  toRem,
} from 'folds';
import React, { FormEventHandler, MouseEventHandler, ReactNode, useState } from 'react';
import { BaseRange, Editor, Element, Node, Path, Range, Transforms } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';
import { LinkElement } from './slate';
import {
  createLinkElement,
  headingLevel,
  isAnyMarkActive,
  isBlockActive,
  isMarkActive,
  moveCursor,
  removeAllMark,
  replaceWithElement,
  toggleBlock,
  toggleMark,
} from './utils';
import * as css from './Editor.css';
import { BlockType, MarkType } from './types';
import { HeadingLevel } from './slate';
import { isMacOS } from '../../utils/user-agent';
import { KeySymbol } from '../../utils/key-symbol';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { stopPropagation } from '../../utils/keyboard';

function BtnTooltip({ text, shortCode }: { text: string; shortCode?: string }) {
  return (
    <Tooltip style={{ padding: config.space.S300 }}>
      <Box gap="200" direction="Column" alignItems="Center">
        <Text align="Center">{text}</Text>
        {shortCode && (
          <Badge as="kbd" radii="300" size="500">
            <Text size="T200" align="Center">
              {shortCode}
            </Text>
          </Badge>
        )}
      </Box>
    </Tooltip>
  );
}

type MarkButtonProps = { format: MarkType; icon: IconSrc; tooltip: ReactNode };
export function MarkButton({ format, icon, tooltip }: MarkButtonProps) {
  const editor = useSlate();
  const disableInline = isBlockActive(editor, BlockType.CodeBlock);

  if (disableInline) {
    removeAllMark(editor);
  }

  const handleClick = () => {
    toggleMark(editor, format);
    ReactEditor.focus(editor);
  };

  return (
    <TooltipProvider tooltip={tooltip} delay={500}>
      {(triggerRef) => (
        <IconButton
          ref={triggerRef}
          variant="SurfaceVariant"
          fill="None"
          onClick={handleClick}
          aria-pressed={isMarkActive(editor, format)}
          size="400"
          radii="300"
          disabled={disableInline}
        >
          <Icon size="200" src={icon} />
        </IconButton>
      )}
    </TooltipProvider>
  );
}

type BlockButtonProps = {
  format: BlockType;
  icon: IconSrc;
  tooltip: ReactNode;
};
export function BlockButton({ format, icon, tooltip }: BlockButtonProps) {
  const editor = useSlate();

  const handleClick = () => {
    toggleBlock(editor, format, { level: 1 });
    ReactEditor.focus(editor);
  };

  return (
    <TooltipProvider tooltip={tooltip} delay={500}>
      {(triggerRef) => (
        <IconButton
          ref={triggerRef}
          variant="SurfaceVariant"
          fill="None"
          onClick={handleClick}
          aria-pressed={isBlockActive(editor, format)}
          size="400"
          radii="300"
        >
          <Icon size="200" src={icon} />
        </IconButton>
      )}
    </TooltipProvider>
  );
}

export function HeadingBlockButton() {
  const editor = useSlate();
  const level = headingLevel(editor);
  const [anchor, setAnchor] = useState<RectCords>();
  const isActive = isBlockActive(editor, BlockType.Heading);
  const modKey = isMacOS() ? KeySymbol.Command : 'Ctrl';

  const handleMenuSelect = (selectedLevel: HeadingLevel) => {
    setAnchor(undefined);
    toggleBlock(editor, BlockType.Heading, { level: selectedLevel });
    ReactEditor.focus(editor);
  };

  const handleMenuOpen: MouseEventHandler<HTMLButtonElement> = (evt) => {
    if (isActive) {
      toggleBlock(editor, BlockType.Heading);
      return;
    }
    setAnchor(evt.currentTarget.getBoundingClientRect());
  };
  return (
    <PopOut
      anchor={anchor}
      offset={5}
      position="Top"
      content={
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: () => setAnchor(undefined),
            clickOutsideDeactivates: true,
            isKeyForward: (evt: KeyboardEvent) =>
              evt.key === 'ArrowDown' || evt.key === 'ArrowRight',
            isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp' || evt.key === 'ArrowLeft',
            escapeDeactivates: stopPropagation,
          }}
        >
          <Menu style={{ padding: config.space.S100 }}>
            <Box gap="100">
              <TooltipProvider
                tooltip={<BtnTooltip text="Heading 1" shortCode={`${modKey} + 1`} />}
                delay={500}
              >
                {(triggerRef) => (
                  <IconButton
                    ref={triggerRef}
                    onClick={() => handleMenuSelect(1)}
                    size="400"
                    radii="300"
                  >
                    <Icon size="200" src={Icons.Heading1} />
                  </IconButton>
                )}
              </TooltipProvider>
              <TooltipProvider
                tooltip={<BtnTooltip text="Heading 2" shortCode={`${modKey} + 2`} />}
                delay={500}
              >
                {(triggerRef) => (
                  <IconButton
                    ref={triggerRef}
                    onClick={() => handleMenuSelect(2)}
                    size="400"
                    radii="300"
                  >
                    <Icon size="200" src={Icons.Heading2} />
                  </IconButton>
                )}
              </TooltipProvider>
              <TooltipProvider
                tooltip={<BtnTooltip text="Heading 3" shortCode={`${modKey} + 3`} />}
                delay={500}
              >
                {(triggerRef) => (
                  <IconButton
                    ref={triggerRef}
                    onClick={() => handleMenuSelect(3)}
                    size="400"
                    radii="300"
                  >
                    <Icon size="200" src={Icons.Heading3} />
                  </IconButton>
                )}
              </TooltipProvider>
            </Box>
          </Menu>
        </FocusTrap>
      }
    >
      <IconButton
        style={{ width: 'unset' }}
        variant="SurfaceVariant"
        fill="None"
        onClick={handleMenuOpen}
        aria-pressed={isActive}
        size="400"
        radii="300"
      >
        <Icon size="200" src={level ? Icons[`Heading${level}`] : Icons.Heading1} />
        <Icon size="200" src={isActive ? Icons.Cross : Icons.ChevronBottom} />
      </IconButton>
    </PopOut>
  );
}

const getActiveLink = (editor: Editor): [LinkElement, Path] | undefined => {
  const { selection } = editor;
  if (!selection) return undefined;

  const matches = Array.from(
    Editor.nodes<LinkElement>(editor, {
      at: selection,
      match: (n) => Element.isElement(n) && n.type === BlockType.Link,
    })
  );
  if (matches.length !== 1) return undefined;

  const [node, path] = matches[0];
  const linkText = Node.string(node);
  const selectedText = Editor.string(editor, selection);

  if (!linkText || !selectedText.includes(linkText)) return undefined;
  return [node, path];
};

export function LinkButton() {
  const editor = useSlate();
  const disableInline = isBlockActive(editor, BlockType.CodeBlock);
  const [anchor, setAnchor] = useState<RectCords>();
  const [selectionRange, setSelectionRange] = useState<BaseRange>();
  const [linkPath, setLinkPath] = useState<Path>();

  const activeLink = getActiveLink(editor);

  const handleMenuOpen: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const link = getActiveLink(editor);
    if (link) {
      const [, path] = link;
      setLinkPath(path);
      setSelectionRange(undefined);
    } else {
      setLinkPath(undefined);
      setSelectionRange(editor.selection ?? undefined);
    }
    setAnchor(evt.currentTarget.getBoundingClientRect());
  };

  const closeMenu = () => {
    setAnchor(undefined);
    setLinkPath(undefined);
    setSelectionRange(undefined);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    const target = evt.target as HTMLFormElement;
    const urlInput = target.linkUrlInput as HTMLInputElement;
    let href = urlInput.value.trim();
    if (!href) return;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      href = `https://${href}`;
    }

    if (linkPath) {
      Transforms.setNodes<LinkElement>(editor, { href }, { at: linkPath });
    } else {
      const range = selectionRange;
      const text = range && !Range.isCollapsed(range) ? Editor.string(editor, range) : href;
      const linkEl = createLinkElement(href, text);

      if (range) {
        replaceWithElement(editor, range, linkEl);
      } else {
        Transforms.insertNodes(editor, linkEl);
        Transforms.collapse(editor, { edge: 'end' });
      }
      moveCursor(editor, true);
    }

    closeMenu();
    ReactEditor.focus(editor);
  };

  const handleRemove = () => {
    if (linkPath) {
      Transforms.unwrapNodes(editor, {
        at: linkPath,
        match: (n) => Element.isElement(n) && n.type === BlockType.Link,
      });
    }
    closeMenu();
    ReactEditor.focus(editor);
  };

  return (
    <PopOut
      anchor={anchor}
      offset={5}
      position="Top"
      content={
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: closeMenu,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Menu style={{ padding: config.space.S200 }}>
            <Box as="form" onSubmit={handleSubmit} gap="200" alignItems="Center">
              <Input
                name="linkUrlInput"
                size="300"
                variant="Background"
                placeholder="example.com"
                defaultValue={linkPath ? activeLink?.[0].href : undefined}
                style={{ width: toRem(200) }}
                autoFocus
                required
              />
              {linkPath && (
                <Button
                  type="button"
                  variant="Critical"
                  fill="Soft"
                  size="300"
                  radii="300"
                  onClick={handleRemove}
                >
                  <Text size="B300">Remove</Text>
                </Button>
              )}
              <Button type="submit" variant="Primary" size="300" radii="300">
                <Text size="B300">{linkPath ? 'Save' : 'Add Link'}</Text>
              </Button>
            </Box>
          </Menu>
        </FocusTrap>
      }
    >
      <TooltipProvider tooltip={<BtnTooltip text="Link" />} delay={500}>
        {(triggerRef) => (
          <IconButton
            ref={triggerRef}
            variant="SurfaceVariant"
            fill="None"
            onClick={handleMenuOpen}
            aria-pressed={!!activeLink}
            size="400"
            radii="300"
            disabled={disableInline}
          >
            <Icon size="200" src={Icons.Link} filled={!!activeLink} />
          </IconButton>
        )}
      </TooltipProvider>
    </PopOut>
  );
}

type ExitFormattingProps = { tooltip: ReactNode };
export function ExitFormatting({ tooltip }: ExitFormattingProps) {
  const editor = useSlate();

  const handleClick = () => {
    if (isAnyMarkActive(editor)) {
      removeAllMark(editor);
    } else if (!isBlockActive(editor, BlockType.Paragraph)) {
      toggleBlock(editor, BlockType.Paragraph);
    }
    ReactEditor.focus(editor);
  };

  return (
    <TooltipProvider tooltip={tooltip} delay={500}>
      {(triggerRef) => (
        <IconButton
          ref={triggerRef}
          variant="SurfaceVariant"
          fill="None"
          onClick={handleClick}
          size="400"
          radii="300"
        >
          <Text size="B400">{`Exit ${KeySymbol.Hyper}`}</Text>
        </IconButton>
      )}
    </TooltipProvider>
  );
}

export function Toolbar() {
  const editor = useSlate();
  const modKey = isMacOS() ? KeySymbol.Command : 'Ctrl';
  const disableInline = isBlockActive(editor, BlockType.CodeBlock);

  const canEscape = isBlockActive(editor, BlockType.Paragraph)
    ? isAnyMarkActive(editor)
    : ReactEditor.isFocused(editor);
  const [isMarkdown, setIsMarkdown] = useSetting(settingsAtom, 'isMarkdown');

  return (
    <Box className={css.EditorToolbarBase}>
      <Scroll direction="Horizontal" size="0">
        <Box className={css.EditorToolbar} alignItems="Center" gap="300">
          <>
            <Box shrink="No" gap="100">
              <MarkButton
                format={MarkType.Bold}
                icon={Icons.Bold}
                tooltip={<BtnTooltip text="Bold" shortCode={`${modKey} + B`} />}
              />
              <MarkButton
                format={MarkType.Italic}
                icon={Icons.Italic}
                tooltip={<BtnTooltip text="Italic" shortCode={`${modKey} + I`} />}
              />
              <MarkButton
                format={MarkType.Underline}
                icon={Icons.Underline}
                tooltip={<BtnTooltip text="Underline" shortCode={`${modKey} + U`} />}
              />
              <MarkButton
                format={MarkType.StrikeThrough}
                icon={Icons.Strike}
                tooltip={<BtnTooltip text="Strike Through" shortCode={`${modKey} + S`} />}
              />
              <MarkButton
                format={MarkType.Code}
                icon={Icons.Code}
                tooltip={<BtnTooltip text="Inline Code" shortCode={`${modKey} + [`} />}
              />
              <MarkButton
                format={MarkType.Spoiler}
                icon={Icons.EyeBlind}
                tooltip={<BtnTooltip text="Spoiler" shortCode={`${modKey} + H`} />}
              />
              <LinkButton />
            </Box>
            <Line variant="SurfaceVariant" direction="Vertical" style={{ height: toRem(12) }} />
          </>
          <Box shrink="No" gap="100">
            <BlockButton
              format={BlockType.BlockQuote}
              icon={Icons.BlockQuote}
              tooltip={<BtnTooltip text="Block Quote" shortCode={`${modKey} + '`} />}
            />
            <BlockButton
              format={BlockType.CodeBlock}
              icon={Icons.BlockCode}
              tooltip={<BtnTooltip text="Block Code" shortCode={`${modKey} + ;`} />}
            />
            <BlockButton
              format={BlockType.OrderedList}
              icon={Icons.OrderList}
              tooltip={<BtnTooltip text="Ordered List" shortCode={`${modKey} + 7`} />}
            />
            <BlockButton
              format={BlockType.UnorderedList}
              icon={Icons.UnorderList}
              tooltip={<BtnTooltip text="Unordered List" shortCode={`${modKey} + 8`} />}
            />
            <HeadingBlockButton />
          </Box>
          {canEscape && (
            <>
              <Line variant="SurfaceVariant" direction="Vertical" style={{ height: toRem(12) }} />
              <Box shrink="No" gap="100">
                <ExitFormatting
                  tooltip={
                    <BtnTooltip text="Exit Formatting" shortCode={`Escape, ${modKey} + E`} />
                  }
                />
              </Box>
            </>
          )}
          <Box className={css.MarkdownBtnBox} shrink="No" grow="Yes" justifyContent="End">
            <TooltipProvider
              align="End"
              tooltip={<BtnTooltip text={isMarkdown ? 'Disable Markdown' : 'Enable Markdown'} />}
              delay={500}
            >
              {(triggerRef) => (
                <IconButton
                  ref={triggerRef}
                  variant="SurfaceVariant"
                  fill="None"
                  onClick={() => setIsMarkdown(!isMarkdown)}
                  aria-pressed={isMarkdown}
                  size="300"
                  radii="300"
                  disabled={disableInline || !!isAnyMarkActive(editor)}
                >
                  <Icon size="200" src={Icons.Markdown} filled={isMarkdown} />
                </IconButton>
              )}
            </TooltipProvider>
            <span />
          </Box>
        </Box>
      </Scroll>
    </Box>
  );
}
