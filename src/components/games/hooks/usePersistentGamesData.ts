import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  GameCompletionPayload,
  GameLeaderboardEntry,
  GamesPersistentPayload,
  PlayerStatsSummary,
} from '@/components/games/types';
import {
  applyGameCompletionToStats,
  loadGamesPersistence,
  mergePlayerRunIntoLeaderboard,
  saveGamesPersistence,
} from '@/components/games/utils/storage';

interface UsePersistentGamesDataResult {
  stats: PlayerStatsSummary;
  leaderboard: GameLeaderboardEntry[];
  addRun: (payload: GameCompletionPayload) => void;
  reset: () => void;
}

export const usePersistentGamesData = (): UsePersistentGamesDataResult => {
  const [payload, setPayload] = useState<GamesPersistentPayload>(() => loadGamesPersistence());

  useEffect(() => {
    saveGamesPersistence(payload);
  }, [payload]);

  const addRun = useCallback((run: GameCompletionPayload) => {
    setPayload((current) => {
      const updatedStats = applyGameCompletionToStats(current.stats, run);
      const updatedLeaderboard = mergePlayerRunIntoLeaderboard(current.leaderboard, run, 'You');
      return {
        stats: updatedStats,
        leaderboard: updatedLeaderboard,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const reset = useCallback(() => {
    const next = loadGamesPersistence();
    setPayload(next);
  }, []);

  return useMemo(
    () => ({
      stats: payload.stats,
      leaderboard: payload.leaderboard,
      addRun,
      reset,
    }),
    [payload.stats, payload.leaderboard, addRun, reset]
  );
};
