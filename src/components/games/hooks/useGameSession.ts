import { useCallback, useMemo, useState } from 'react';
import type { GameStatus, UseGameSessionOptions, UseGameSessionResult } from '@/components/games/types';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export const useGameSession = ({ initialStatus = 'idle' }: UseGameSessionOptions): UseGameSessionResult => {
  const [status, setStatus] = useState<GameStatus>(initialStatus);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [startTimeMs, setStartTimeMs] = useState(0);
  const [pauseTimeMs, setPauseTimeMs] = useState(0);

  const start = useCallback(() => {
    const current = now();
    setStatus('running');
    setElapsedMs(0);
    setStartTimeMs(current);
    setPauseTimeMs(0);
  }, []);

  const pause = useCallback(() => {
    setStatus('paused');
    setPauseTimeMs(now());
  }, []);

  const resume = useCallback(() => {
    const pausedAt = pauseTimeMs;
    const current = now();
    if (pausedAt > 0) {
      setStartTimeMs((prev) => prev + (current - pausedAt));
    }
    setStatus('running');
    setPauseTimeMs(0);
  }, [pauseTimeMs]);

  const reset = useCallback(() => {
    setStatus('idle');
    setElapsedMs(0);
    setStartTimeMs(0);
    setPauseTimeMs(0);
  }, []);

  return useMemo(
    () => ({
      session: {
        status,
        elapsedMs,
        startTimeMs,
        pauseTimeMs,
      },
      setStatus,
      start,
      pause,
      resume,
      reset,
      setElapsedMs,
    }),
    [status, elapsedMs, startTimeMs, pauseTimeMs, start, pause, resume, reset]
  );
};
