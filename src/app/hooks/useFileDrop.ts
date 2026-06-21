import { useCallback, DragEventHandler, RefObject, useState, useEffect, useRef } from 'react';
import { getDataTransferFiles } from '../utils/dom';

export const useFileDropHandler = (onDrop: (file: File[]) => void): DragEventHandler =>
  useCallback(
    (evt) => {
      const files = getDataTransferFiles(evt.dataTransfer);
      if (files) onDrop(files);
    },
    [onDrop]
  );

export const useFileDropZone = (
  zoneRef: RefObject<HTMLElement>,
  onDrop: (file: File[]) => void
): boolean => {
  const dragStateRef = useRef<'start' | 'leave' | 'over'>();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const target = zoneRef.current;
    const handleDrop = (evt: DragEvent) => {
      evt.preventDefault();
      dragStateRef.current = undefined;
      setActive(false);
      if (!evt.dataTransfer) return;
      const files = getDataTransferFiles(evt.dataTransfer);
      if (files) onDrop(files);
    };

    target?.addEventListener('drop', handleDrop);
    return () => {
      target?.removeEventListener('drop', handleDrop);
    };
  }, [zoneRef, onDrop]);

  useEffect(() => {
    const target = zoneRef.current;
    const handleDragEnter = (evt: DragEvent) => {
      if (evt.dataTransfer?.types.includes('Files')) {
        dragStateRef.current = 'start';
        setActive(true);
      }
    };
    const handleDragLeave = () => {
      if (dragStateRef.current !== 'over') return;
      dragStateRef.current = 'leave';
      setActive(false);
    };
    const handleDragOver = (evt: DragEvent) => {
      evt.preventDefault();
      dragStateRef.current = 'over';
    };

    target?.addEventListener('dragenter', handleDragEnter);
    target?.addEventListener('dragleave', handleDragLeave);
    target?.addEventListener('dragover', handleDragOver);
    return () => {
      target?.removeEventListener('dragenter', handleDragEnter);
      target?.removeEventListener('dragleave', handleDragLeave);
      target?.removeEventListener('dragover', handleDragOver);
    };
  }, [zoneRef]);

  return active;
};

// Tracks whether any file drag is in progress anywhere in the window.
// Uses a counter to handle nested element enter/leave pairs correctly.
export const useIsDraggingFiles = (): boolean => {
  const [dragging, setDragging] = useState(false);
  const counter = useRef(0);

  useEffect(() => {
    const handleEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      counter.current += 1;
      if (counter.current === 1) setDragging(true);
    };
    const handleLeave = () => {
      counter.current = Math.max(0, counter.current - 1);
      if (counter.current === 0) setDragging(false);
    };
    const handleEnd = () => {
      counter.current = 0;
      setDragging(false);
    };
    window.addEventListener('dragenter', handleEnter);
    window.addEventListener('dragleave', handleLeave);
    window.addEventListener('drop', handleEnd);
    window.addEventListener('dragend', handleEnd);
    return () => {
      window.removeEventListener('dragenter', handleEnter);
      window.removeEventListener('dragleave', handleLeave);
      window.removeEventListener('drop', handleEnd);
      window.removeEventListener('dragend', handleEnd);
    };
  }, []);

  return dragging;
};
