import { atom } from 'jotai';

// Holds files dropped onto a sidebar nav item so the target room's RoomInput
// can pick them up on mount and queue them for upload.
export type DragDropPending = { roomId: string; files: File[] } | null;

export const dragDropPendingAtom = atom<DragDropPending>(null);
