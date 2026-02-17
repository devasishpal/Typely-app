import { useEffect, useRef } from 'react';
import type { KeyboardCaptureOptions } from '@/components/games/types';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export const useKeyboardCapture = ({
  enabled,
  allowSpaces = true,
  allowBackspace = true,
  onType,
  onBackspace,
  onSubmit,
}: KeyboardCaptureOptions): void => {
  const callbacksRef = useRef({ onType, onBackspace, onSubmit });

  useEffect(() => {
    callbacksRef.current = { onType, onBackspace, onSubmit };
  }, [onType, onBackspace, onSubmit]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (INPUT_TAGS.has(target.tagName) || target.isContentEditable)) {
        return;
      }

      const key = event.key;

      if (key === 'Escape') {
        event.preventDefault();
        callbacksRef.current.onSubmit?.();
        return;
      }

      if (key === 'Enter') {
        event.preventDefault();
        callbacksRef.current.onSubmit?.();
        return;
      }

      if (key === 'Backspace') {
        if (!allowBackspace) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        callbacksRef.current.onBackspace?.();
        return;
      }

      if (key === ' ') {
        if (!allowSpaces) {
          event.preventDefault();
          callbacksRef.current.onSubmit?.();
          return;
        }

        event.preventDefault();
        callbacksRef.current.onType(' ');
        return;
      }

      if (key.length === 1) {
        event.preventDefault();
        callbacksRef.current.onType(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allowBackspace, allowSpaces, enabled]);
};
