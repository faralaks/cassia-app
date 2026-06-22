import darkBgImage from '../../../public/res/bg/default-chat-bg-dark.jpeg';
import lightBgImage from '../../../public/res/bg/default-chat-bg-light.jpeg';

export type ChatStyle = {
  bgImage?: string;
  bgThumb?: string;
  // Explicit "no background image" — plain themed UI. Distinct from bgImage being
  // unset (which inherits the theme group's default image).
  bgPlain?: boolean;
  // Darken the background image with a black overlay, 0 (none) to 1 (black).
  bgDim?: number;
  outgoingColor?: string;
  incomingColor?: string;
  outgoingOpacity?: number;
  incomingOpacity?: number;
  incomingTextColor?: string;
  outgoingTextColor?: string;
  separateTextColors?: boolean;
  bubbleRadius?: number; // px, default 16
};

// The global default chat style depends on the active theme group: dark/butter
// share one default, light/silver share another. Kept as a plain string union
// (not ThemeKind) to avoid importing from the theme hook here.
export type ThemeGroup = 'dark' | 'light';

export const DEFAULT_BG_IMAGE_DARK = darkBgImage;
export const DEFAULT_BG_IMAGE_LIGHT = lightBgImage;

// Built-in defaults, used when the user hasn't saved a global default of their
// own for that theme group. Each ships a bundled background + preferred colors.
export const BUILTIN_DEFAULT_STYLE_DARK: ChatStyle = {
  bgImage: darkBgImage,
  bgDim: 0.1,
  incomingColor: '#242424',
  incomingOpacity: 0.8,
  outgoingColor: '#2e7d32',
  outgoingOpacity: 0.8,
  incomingTextColor: '#ffffff',
  outgoingTextColor: '#ffffff',
  separateTextColors: false,
  bubbleRadius: 20,
};
export const BUILTIN_DEFAULT_STYLE_LIGHT: ChatStyle = {
  bgImage: lightBgImage,
  bgDim: 0.1,
  incomingColor: '#606060',
  incomingOpacity: 0.8,
  outgoingColor: '#2e7d32',
  outgoingOpacity: 0.8,
  incomingTextColor: '#ffffff',
  outgoingTextColor: '#ffffff',
  separateTextColors: false,
  bubbleRadius: 20,
};

export const builtinDefaultStyle = (group: ThemeGroup): ChatStyle =>
  group === 'light' ? { ...BUILTIN_DEFAULT_STYLE_LIGHT } : { ...BUILTIN_DEFAULT_STYLE_DARK };

export const defaultBgImageFor = (group: ThemeGroup): string =>
  group === 'light' ? lightBgImage : darkBgImage;

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
};

// CSS `background` shorthand for a chat background image, with an optional black
// dim overlay stacked on top (a flat gradient over the image). Shared by RoomView,
// the welcome page, and the editor preview so the dim is applied consistently.
export const bgImageCss = (url: string, dim = 0): string => {
  const d = Math.min(Math.max(dim, 0), 1);
  const overlay =
    d > 0
      ? `linear-gradient(rgba(0,0,0,${d.toFixed(2)}), rgba(0,0,0,${d.toFixed(2)})), `
      : '';
  return `${overlay}url(${url}) center / cover`;
};

const KEY = 'cassia_room_styles_v1';

const readAll = (): Record<string, ChatStyle> => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeAll = (all: Record<string, ChatStyle>): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
};

export const getRoomStyle = (roomId: string): ChatStyle =>
  readAll()[roomId] ?? {};

export const patchRoomStyle = (roomId: string, patch: Partial<ChatStyle>): void => {
  const all = readAll();
  all[roomId] = { ...(all[roomId] ?? {}), ...patch };
  writeAll(all);
};

export const clearRoomStyle = (roomId: string): void => {
  const all = readAll();
  delete all[roomId];
  writeAll(all);
};

const DEFAULT_KEY: Record<ThemeGroup, string> = {
  dark: 'cassia_default_style_dark_v1',
  light: 'cassia_default_style_light_v1',
};

export const getDefaultStyle = (group: ThemeGroup): ChatStyle => {
  try {
    const raw = localStorage.getItem(DEFAULT_KEY[group]);
    return raw ? JSON.parse(raw) : builtinDefaultStyle(group);
  } catch {
    return builtinDefaultStyle(group);
  }
};

export const setDefaultStyle = (group: ThemeGroup, style: ChatStyle): void => {
  try {
    localStorage.setItem(DEFAULT_KEY[group], JSON.stringify(style));
  } catch {}
};

export const clearDefaultStyle = (group: ThemeGroup): void => {
  try {
    localStorage.removeItem(DEFAULT_KEY[group]);
  } catch {}
};

export const resizeAndEncode = (
  file: File,
  maxW = 1920,
  maxH = 1080
): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(1, maxW / img.width, maxH / img.height);
      const w = Math.floor(img.width * ratio);
      const h = Math.floor(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });

export const makeThumb = (dataUrl: string, size = 40): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no ctx')); return; }
      const ratio = Math.max(size / img.width, size / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
