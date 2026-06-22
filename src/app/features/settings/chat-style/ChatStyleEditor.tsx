import React, {
  ChangeEventHandler,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Box,
  Button,
  Chip,
  color,
  config,
  Icon,
  Icons,
  Switch,
  Text,
  Tooltip,
  TooltipProvider,
} from 'folds';
import classNames from 'classnames';
import { SequenceCard } from '../../../components/sequence-card';
import { SequenceCardStyle } from '../styles.css';
import * as css from './ChatStyle.css';
import {
  bgImageCss,
  builtinDefaultStyle,
  ChatStyle,
  defaultBgImageFor,
  hexToRgba,
  makeThumb,
  resizeAndEncode,
  ThemeGroup,
} from '../../../utils/chatStyle';

// The swatch grid is 9 columns: row 1 (first 9) = colors suited to dark themes,
// row 2 (next 9) = colors suited to light themes. The first swatch of each row is
// that theme group's default (dark: #242424 incoming / #2E7D32 outgoing;
// light: #606060 incoming / #2E7D32 outgoing).
const INCOMING_PRESETS = [
  // Row 1 — dark themes (deep, low-luminance)
  '#242424', '#1a1a1a', '#2a2d3e', '#1e2028', '#28201e', '#1e2820', '#1e2830', '#281e28', '#1a237e',
  // Row 2 — light themes (mid greys / soft tints)
  '#606060', '#444444', '#555555', '#3a3a3a', '#4a4458', '#3e4a5a', '#3e4a3e', '#5a4a3e', '#4a3e4a',
];
const OUTGOING_PRESETS = [
  // Row 1 — dark themes (saturated, pops on dark)
  '#2e7d32', '#1565c0', '#4527a0', '#6a1b9a', '#880e4f', '#c62828', '#bf360c', '#00695c', '#f9a825',
  // Row 2 — light themes (deep, readable on light)
  '#2e7d32', '#0d47a1', '#1a237e', '#5e35b1', '#7b1fa2', '#ad1457', '#b71c1c', '#004d40', '#e65100',
];
const TEXT_PRESETS = [
  '#ffffff', '#e0e0e0', '#b0b0b0', '#9e9e9e', '#000000', '#ffd54f', '#4fc3f7', '#81c784', '#ff8a80',
];

const sanitizeHex = (raw: string): string =>
  raw.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 6);

type ChatStyleEditorProps = {
  value: ChatStyle;
  onChange: (patch: Partial<ChatStyle>) => void;
  onReset: () => void;
  resetLabel: string;
  // Active theme group, used for the Cassia default background and the color
  // fallback when a custom color is cleared.
  themeGroup: ThemeGroup;
};
export function ChatStyleEditor({
  value: style,
  onChange: update,
  onReset,
  resetLabel,
  themeGroup,
}: ChatStyleEditorProps) {
  const groupDefault = builtinDefaultStyle(themeGroup);
  const defaultBg = defaultBgImageFor(themeGroup);
  const fileRef = useRef<HTMLInputElement>(null);
  const inColorRef = useRef<HTMLInputElement>(null);
  const outColorRef = useRef<HTMLInputElement>(null);
  const inTextColorRef = useRef<HTMLInputElement>(null);
  const outTextColorRef = useRef<HTMLInputElement>(null);

  const separate = !!style.separateTextColors;

  const [inHexRaw, setInHexRaw] = useState(style.incomingColor?.slice(1) ?? '');
  const [outHexRaw, setOutHexRaw] = useState(style.outgoingColor?.slice(1) ?? '');
  const [inTextHexRaw, setInTextHexRaw] = useState(style.incomingTextColor?.slice(1) ?? '');
  const [outTextHexRaw, setOutTextHexRaw] = useState(style.outgoingTextColor?.slice(1) ?? '');

  useEffect(() => { setInHexRaw(style.incomingColor?.slice(1) ?? ''); }, [style.incomingColor]);
  useEffect(() => { setOutHexRaw(style.outgoingColor?.slice(1) ?? ''); }, [style.outgoingColor]);
  useEffect(() => { setInTextHexRaw(style.incomingTextColor?.slice(1) ?? ''); }, [style.incomingTextColor]);
  useEffect(() => { setOutTextHexRaw(style.outgoingTextColor?.slice(1) ?? ''); }, [style.outgoingTextColor]);

  const handleInHex: ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = sanitizeHex(e.target.value);
    setInHexRaw(v);
    if (v.length === 6) update({ incomingColor: `#${v}` });
    // Cleared → fall back to the active theme group's default color, not unset
    // (which would drop to a hardcoded fallback).
    else if (v.length === 0)
      update({ incomingColor: groupDefault.incomingColor, incomingOpacity: groupDefault.incomingOpacity });
  };

  const handleOutHex: ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = sanitizeHex(e.target.value);
    setOutHexRaw(v);
    if (v.length === 6) update({ outgoingColor: `#${v}` });
    else if (v.length === 0)
      update({ outgoingColor: groupDefault.outgoingColor, outgoingOpacity: groupDefault.outgoingOpacity });
  };

  // Incoming text control. When "separate" is off it drives both bubbles at once.
  const setIncomingText = (color?: string) => {
    if (separate) update({ incomingTextColor: color });
    else update({ incomingTextColor: color, outgoingTextColor: color });
  };
  const setOutgoingText = (color?: string) => update({ outgoingTextColor: color });

  const handleInTextHex: ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = sanitizeHex(e.target.value);
    setInTextHexRaw(v);
    if (v.length === 6) setIncomingText(`#${v}`);
    else if (v.length === 0) setIncomingText(undefined);
  };
  const handleOutTextHex: ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = sanitizeHex(e.target.value);
    setOutTextHexRaw(v);
    if (v.length === 6) setOutgoingText(`#${v}`);
    else if (v.length === 0) setOutgoingText(undefined);
  };

  const pickIncomingText = (c: string) => {
    const next = (style.incomingTextColor ?? '#ffffff').toLowerCase() === c ? undefined : c;
    setIncomingText(next);
  };
  const pickOutgoingText = (c: string) => {
    const next = (style.outgoingTextColor ?? '#ffffff').toLowerCase() === c ? undefined : c;
    setOutgoingText(next);
  };

  const toggleSeparate = (checked: boolean) => {
    // When turning off, the incoming color wins for both bubbles (overwrites outgoing).
    if (checked) update({ separateTextColors: true });
    else update({ separateTextColors: false, outgoingTextColor: style.incomingTextColor });
  };

  const handleFile = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const full = await resizeAndEncode(file);
    const thumb = await makeThumb(full);
    update({ bgImage: full, bgThumb: thumb, bgPlain: false });
    if (fileRef.current) fileRef.current.value = '';
  };

  // Background state. An image shows when bgImage is set and not explicitly plain.
  // The Cassia default is the active theme group's bundled image.
  const bgIsPlain = !!style.bgPlain;
  const bgShowing = !bgIsPlain && !!style.bgImage;
  const bgIsDefault = bgShowing && style.bgImage === defaultBg;
  const bgThumbUrl = style.bgThumb ?? style.bgImage;

  // × cycle: custom image → restore Cassia default; default image → plain UI.
  const handleBgRemove = () => {
    if (bgIsDefault) update({ bgImage: undefined, bgThumb: undefined, bgPlain: true });
    else update({ bgImage: defaultBg, bgThumb: undefined, bgPlain: false });
  };

  const inPct = Math.round((style.incomingOpacity ?? 1) * 100);
  const outPct = Math.round((style.outgoingOpacity ?? 1) * 100);
  const dimPct = Math.round((style.bgDim ?? 0) * 100);
  const radius = style.bubbleRadius ?? 16;
  const inTextColor = style.incomingTextColor ?? '#ffffff';
  const outTextColor = style.outgoingTextColor ?? '#ffffff';

  const inBg = style.incomingColor
    ? hexToRgba(style.incomingColor, style.incomingOpacity ?? 1)
    : 'rgba(60,60,80,0.85)';
  const outBg = style.outgoingColor
    ? hexToRgba(style.outgoingColor, style.outgoingOpacity ?? 1)
    : 'rgba(70,90,180,0.85)';

  const xBtn = (onClick: () => void, title: string) => (
    <TooltipProvider
      position="Bottom"
      align="End"
      offset={4}
      tooltip={
        <Tooltip>
          <Text size="T200">{title}</Text>
        </Tooltip>
      }
    >
      {(triggerRef) => (
        <button type="button" onClick={onClick} aria-label={title} ref={triggerRef}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
          <Icon src={Icons.Cross} size="50" />
        </button>
      )}
    </TooltipProvider>
  );

  const hexInput = (
    val: string,
    onChange: ChangeEventHandler<HTMLInputElement>,
    placeholder: string,
    color?: string,
    onPickClick?: () => void
  ) => (
    <Box alignItems="Center" gap="300">
      {color && <div className={css.HexSwatch} style={{ backgroundColor: color }} />}
      <Box alignItems="Center" gap="100">
        <Text size="T300" style={{ opacity: 0.5 }}>#</Text>
        <input
          value={val}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={6}
          className={css.HexInput}
        />
      </Box>
      {onPickClick && (
        <Chip variant="Background" size="400" radii="300" onClick={onPickClick} style={{ flexShrink: 0, padding: '6px 14px' }}>
          <Text size="T200">Pick</Text>
        </Chip>
      )}
    </Box>
  );

  const textBlock = (
    hexRaw: string,
    onHex: ChangeEventHandler<HTMLInputElement>,
    current: string | undefined,
    onPickPreset: (c: string) => void,
    pickRef: RefObject<HTMLInputElement>
  ) => (
    <Box direction="Column" gap="200">
      {hexInput(hexRaw, onHex, 'e.g. FFFFFF', current, () => pickRef.current?.click())}
      <div className={css.ColorSwatchGrid}>
        {TEXT_PRESETS.map((c) => (
          <button key={c} type="button"
            onClick={() => onPickPreset(c)}
            className={classNames(css.ColorSwatch, (current ?? '#ffffff').toLowerCase() === c && css.ColorSwatchActive)}
            style={{ backgroundColor: c }} />
        ))}
      </div>
    </Box>
  );

  return (
    <SequenceCard className={SequenceCardStyle} variant="SurfaceVariant" direction="Column">
      <Box direction="Column" gap="400" style={{ padding: config.space.S400 }}>

        <div style={{
          borderRadius: 12, overflow: 'hidden', height: 160,
          background: bgShowing && style.bgImage
            ? bgImageCss(style.bgImage, style.bgDim ?? 0)
            : color.Background.Container,
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 12,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: inBg, borderRadius: radius, padding: '6px 10px', maxWidth: '65%', fontSize: 13, color: inTextColor }}>
              Hey there! 👋
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: outBg, borderRadius: radius, padding: '6px 10px', maxWidth: '65%', fontSize: 13, color: outTextColor }}>
              Hello! How are you?
            </div>
          </div>
        </div>

        <Box direction="Column" gap="200">
          <Box alignItems="Center" justifyContent="SpaceBetween">
            <Text size="T200" style={{ opacity: 0.7 }}>Background</Text>
            {bgShowing &&
              xBtn(
                handleBgRemove,
                bgIsDefault ? 'Remove background (use plain color)' : 'Reset to default background'
              )}
          </Box>
          <div className={css.BackgroundRow}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundImage: bgShowing && bgThumbUrl ? `url(${bgThumbUrl})` : undefined,
                backgroundSize: 'cover', backgroundColor: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {!bgShowing && <Icon src={Icons.Attachment} size="200" />}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            <Chip variant="Background" size="400" radii="300" onClick={() => fileRef.current?.click()}>
              <Text size="T200">Upload image</Text>
            </Chip>
            <div className={css.BackgroundDim} style={{ opacity: bgShowing ? 1 : 0.35 }}>
              <Text size="T200" style={{ opacity: 0.6, flexShrink: 0 }}>Dim</Text>
              <input type="range" min="0" max="80" value={dimPct}
                disabled={!bgShowing}
                onChange={(e) => update({ bgDim: parseInt(e.target.value, 10) / 100 })}
                className={css.RangeSlider}
              />
              <Text size="T200" style={{ opacity: 0.6, flexShrink: 0, minWidth: 32 }}>{dimPct}%</Text>
            </div>
          </div>
        </Box>

        <div className={css.SectionDivider} />

        {/* Hidden native color pickers — display:none blocks .click() in WebKit */}
        <input
          ref={inColorRef}
          type="color"
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          value={style.incomingColor ?? '#1a1a1a'}
          onChange={(e) => { setInHexRaw(e.target.value.slice(1).toUpperCase()); update({ incomingColor: e.target.value }); }}
        />
        <input
          ref={outColorRef}
          type="color"
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          value={style.outgoingColor ?? '#1565c0'}
          onChange={(e) => { setOutHexRaw(e.target.value.slice(1).toUpperCase()); update({ outgoingColor: e.target.value }); }}
        />
        <input
          ref={inTextColorRef}
          type="color"
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          value={inTextColor}
          onChange={(e) => { setInTextHexRaw(e.target.value.slice(1).toUpperCase()); setIncomingText(e.target.value); }}
        />
        <input
          ref={outTextColorRef}
          type="color"
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          value={outTextColor}
          onChange={(e) => { setOutTextHexRaw(e.target.value.slice(1).toUpperCase()); setOutgoingText(e.target.value); }}
        />

        <Box direction="Column" gap="200">
          <Box alignItems="Center" justifyContent="SpaceBetween">
            <Text size="T200" style={{ opacity: 0.7 }}>Incoming</Text>
            {style.incomingColor &&
              xBtn(
                () => update({ incomingColor: undefined, incomingOpacity: undefined }),
                'Clear incoming color'
              )}
          </Box>
          {hexInput(inHexRaw, handleInHex, 'e.g. 1A1A2E', style.incomingColor, () => inColorRef.current?.click())}
          <div className={css.ColorSwatchGrid}>
            {INCOMING_PRESETS.map((c, i) => {
              const active = (style.incomingColor ?? '').toLowerCase() === c;
              return (
                <button key={`${c}-${i}`} type="button"
                  onClick={() => update({ incomingColor: active ? undefined : c })}
                  className={classNames(css.ColorSwatch, active && css.ColorSwatchActive)}
                  style={{ backgroundColor: c }} />
              );
            })}
          </div>
          <Box alignItems="Center" gap="200" style={{ opacity: style.incomingColor ? 1 : 0.35 }}>
            <Text size="T200" style={{ opacity: 0.6, flexShrink: 0 }}>Opacity</Text>
            <input type="range" min="20" max="100" value={inPct}
              disabled={!style.incomingColor}
              onChange={(e) => update({ incomingOpacity: parseInt(e.target.value, 10) / 100 })}
              className={css.RangeSlider}
            />
            <Text size="T200" style={{ opacity: 0.6, flexShrink: 0, minWidth: 32 }}>{inPct}%</Text>
          </Box>
        </Box>

        <div className={css.SectionDivider} />

        <Box direction="Column" gap="200">
          <Box alignItems="Center" justifyContent="SpaceBetween">
            <Text size="T200" style={{ opacity: 0.7 }}>Outgoing</Text>
            {style.outgoingColor &&
              xBtn(
                () => update({ outgoingColor: undefined, outgoingOpacity: undefined }),
                'Clear outgoing color'
              )}
          </Box>
          {hexInput(outHexRaw, handleOutHex, 'e.g. 1565C0', style.outgoingColor, () => outColorRef.current?.click())}
          <div className={css.ColorSwatchGrid}>
            {OUTGOING_PRESETS.map((c, i) => {
              const active = (style.outgoingColor ?? '').toLowerCase() === c;
              return (
                <button key={`${c}-${i}`} type="button"
                  onClick={() => update({ outgoingColor: active ? undefined : c })}
                  className={classNames(css.ColorSwatch, active && css.ColorSwatchActive)}
                  style={{ backgroundColor: c }} />
              );
            })}
          </div>
          <Box alignItems="Center" gap="200" style={{ opacity: style.outgoingColor ? 1 : 0.35 }}>
            <Text size="T200" style={{ opacity: 0.6, flexShrink: 0 }}>Opacity</Text>
            <input type="range" min="20" max="100" value={outPct}
              disabled={!style.outgoingColor}
              onChange={(e) => update({ outgoingOpacity: parseInt(e.target.value, 10) / 100 })}
              className={css.RangeSlider}
            />
            <Text size="T200" style={{ opacity: 0.6, flexShrink: 0, minWidth: 32 }}>{outPct}%</Text>
          </Box>
        </Box>

        <div className={css.SectionDivider} />

        <Box direction="Column" gap="200">
          <Box alignItems="Center" justifyContent="SpaceBetween">
            <Text size="T200" style={{ opacity: 0.7 }}>Text color</Text>
            <Box alignItems="Center" gap="200">
              <Text size="T200" style={{ opacity: 0.6 }}>Separate</Text>
              <Switch variant="Primary" value={separate} onChange={toggleSeparate} />
            </Box>
          </Box>

          {separate && <Text size="T200" style={{ opacity: 0.6 }}>Incoming</Text>}
          {textBlock(inTextHexRaw, handleInTextHex, style.incomingTextColor, pickIncomingText, inTextColorRef)}

          {separate && (
            <>
              <Text size="T200" style={{ opacity: 0.6 }}>Outgoing</Text>
              {textBlock(outTextHexRaw, handleOutTextHex, style.outgoingTextColor, pickOutgoingText, outTextColorRef)}
            </>
          )}
        </Box>

        <div className={css.SectionDivider} />

        <Box direction="Column" gap="200">
          <Text size="T200" style={{ opacity: 0.7 }}>Bubble shape</Text>
          <Box alignItems="Center" gap="200">
            <Text size="T200" style={{ opacity: 0.4, flexShrink: 0 }}>▪</Text>
            <input type="range" min="4" max="24" step="1" value={radius}
              onChange={(e) => update({ bubbleRadius: parseInt(e.target.value, 10) })}
              className={css.RangeSlider}
            />
            <Text size="T200" style={{ opacity: 0.4, flexShrink: 0 }}>●</Text>
          </Box>
        </Box>

        <div className={css.SectionDivider} />

        <Box>
          <Button
            variant="Critical"
            fill="None"
            size="300"
            radii="Pill"
            before={<Icon src={Icons.Reload} size="100" />}
            onClick={() => { onReset(); setInHexRaw(''); setOutHexRaw(''); setInTextHexRaw(''); setOutTextHexRaw(''); }}>
            <Text size="B400">{resetLabel}</Text>
          </Button>
        </Box>

      </Box>
    </SequenceCard>
  );
}
