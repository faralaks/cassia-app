import { atom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import {
  ChatStyle,
  ThemeGroup,
  getRoomStyle,
  getDefaultStyle,
  setDefaultStyle,
} from '../../utils/chatStyle';

export const roomIdToStyleAtomFamily = atomFamily((roomId: string) =>
  atom<ChatStyle>(getRoomStyle(roomId))
);

// Active theme group ('dark' for dark/butter, 'light' for light/silver). Kept in
// sync with the active theme by ThemeChatStyleSync (mounted in the client layout).
export const themeGroupAtom = atom<ThemeGroup>('dark');

// Per-group saved/built-in default style, cached so reads are reactive after a
// write. Initialized lazily from localStorage on first access per group.
const _defByGroup = atom<Partial<Record<ThemeGroup, ChatStyle>>>({});

// The global default chat style for the *currently active* theme group. Reading
// falls back to the group's saved (or built-in) style; writing persists it.
export const defaultStyleAtom = atom<ChatStyle, [ChatStyle], void>(
  (get) => {
    const group = get(themeGroupAtom);
    const cache = get(_defByGroup);
    return cache[group] ?? getDefaultStyle(group);
  },
  (get, set, next) => {
    const group = get(themeGroupAtom);
    set(_defByGroup, { ...get(_defByGroup), [group]: next });
    setDefaultStyle(group, next);
  }
);

// Per-chat settings take priority over the global (theme-group) default.
export const useEffectiveChatStyle = (roomId: string): ChatStyle => {
  const def = useAtomValue(defaultStyleAtom);
  const room = useAtomValue(roomIdToStyleAtomFamily(roomId));
  return { ...def, ...room };
};
