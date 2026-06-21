import React, { ReactNode, createContext, useCallback, useContext, useMemo, useRef } from 'react';

type VoicePlayFn = () => void;

type QueueEntry = {
  eventId: string;
  play: VoicePlayFn;
};

export type VoiceMessageQueue = {
  register: (groupId: string, eventId: string, play: VoicePlayFn) => () => void;
  notifyEnded: (groupId: string, eventId: string) => void;
};

const VoiceMessageQueueContext = createContext<VoiceMessageQueue | null>(null);

export function VoiceMessageQueueProvider({ children }: { children: ReactNode }) {
  const groupsRef = useRef<Map<string, QueueEntry[]>>(new Map());

  const register = useCallback<VoiceMessageQueue['register']>((groupId, eventId, play) => {
    const groups = groupsRef.current;
    const list = groups.get(groupId) ?? [];
    const idx = list.findIndex((entry) => entry.eventId === eventId);
    if (idx >= 0) {
      list[idx] = { eventId, play };
    } else {
      list.push({ eventId, play });
    }
    groups.set(groupId, list);

    return () => {
      const current = groups.get(groupId);
      if (!current) return;
      const filtered = current.filter((entry) => entry.eventId !== eventId);
      if (filtered.length === 0) groups.delete(groupId);
      else groups.set(groupId, filtered);
    };
  }, []);

  const notifyEnded = useCallback<VoiceMessageQueue['notifyEnded']>((groupId, eventId) => {
    const list = groupsRef.current.get(groupId);
    if (!list) return;
    const idx = list.findIndex((entry) => entry.eventId === eventId);
    if (idx === -1) return;
    const next = list[idx + 1];
    if (next) next.play();
  }, []);

  const value = useMemo<VoiceMessageQueue>(
    () => ({ register, notifyEnded }),
    [register, notifyEnded]
  );

  return (
    <VoiceMessageQueueContext.Provider value={value}>{children}</VoiceMessageQueueContext.Provider>
  );
}

export const useVoiceMessageQueue = (): VoiceMessageQueue | null =>
  useContext(VoiceMessageQueueContext);
