import { useCallback } from 'react';
import { atom, useAtom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { clearUserAvatar, getUserAvatar, setUserAvatar } from '../utils/userAvatar';

// Single source of truth for per-user custom avatar overrides (data URLs).
// Keyed by userId, initialized from localStorage, persisted on every change.
// Any UserAvatar (and DM RoomAvatar) reads from here, so setting an override
// once updates the avatar everywhere it's shown.
export const userIdToAvatarAtomFamily = atomFamily((userId: string) =>
  atom<string | undefined>(getUserAvatar(userId))
);

export const useUserAvatarOverrideValue = (userId: string): string | undefined =>
  useAtomValue(userIdToAvatarAtomFamily(userId));

export type UseUserAvatarOverride = {
  value: string | undefined;
  set: (dataUrl: string) => void;
  clear: () => void;
};

export const useUserAvatarOverride = (userId: string): UseUserAvatarOverride => {
  const [value, setValue] = useAtom(userIdToAvatarAtomFamily(userId));

  const set = useCallback(
    (dataUrl: string) => {
      setUserAvatar(userId, dataUrl);
      setValue(dataUrl);
    },
    [userId, setValue]
  );

  const clear = useCallback(() => {
    clearUserAvatar(userId);
    setValue(undefined);
  }, [userId, setValue]);

  return { value, set, clear };
};
