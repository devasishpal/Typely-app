import {
  DEFAULT_PLAYER_STATS,
  GAME_STORAGE_KEY,
  LEADERBOARD_SEED,
  MAX_RECENT_RUNS,
} from '@/components/games/constants';
import { GAME_ID_TO_LABEL } from '@/components/games/constants';
import type {
  GameCompletionPayload,
  GameLeaderboardEntry,
  GamesPersistentPayload,
  GameRunSnapshot,
  PlayerStatsSummary,
} from '@/components/games/types';

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const buildSeedLeaderboard = (): GameLeaderboardEntry[] =>
  LEADERBOARD_SEED.map((entry, index) => ({
    id: `seed-${index + 1}`,
    playerName: entry.playerName,
    gameId: entry.gameId,
    difficulty: entry.difficulty,
    score: entry.score,
    wpm: entry.wpm,
    accuracy: entry.accuracy,
    playedAt: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
    rank: index + 1,
    isCurrentPlayer: false,
  }));

const cloneDefaultStats = (): PlayerStatsSummary =>
  JSON.parse(JSON.stringify(DEFAULT_PLAYER_STATS)) as PlayerStatsSummary;

export const loadGamesPersistence = (): GamesPersistentPayload => {
  if (!canUseStorage()) {
    return {
      stats: cloneDefaultStats(),
      leaderboard: buildSeedLeaderboard(),
      updatedAt: new Date(0).toISOString(),
    };
  }

  try {
    const raw = window.localStorage.getItem(GAME_STORAGE_KEY);
    if (!raw) {
      return {
        stats: cloneDefaultStats(),
        leaderboard: buildSeedLeaderboard(),
        updatedAt: new Date(0).toISOString(),
      };
    }

    const parsed = JSON.parse(raw) as Partial<GamesPersistentPayload>;

    return {
      stats: {
        ...cloneDefaultStats(),
        ...(parsed.stats ?? {}),
        perGame: {
          ...cloneDefaultStats().perGame,
          ...(parsed.stats?.perGame ?? {}),
        },
        recentRuns: Array.isArray(parsed.stats?.recentRuns) ? parsed.stats.recentRuns.slice(0, MAX_RECENT_RUNS) : [],
      },
      leaderboard: Array.isArray(parsed.leaderboard) && parsed.leaderboard.length > 0
        ? parsed.leaderboard
        : buildSeedLeaderboard(),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return {
      stats: cloneDefaultStats(),
      leaderboard: buildSeedLeaderboard(),
      updatedAt: new Date(0).toISOString(),
    };
  }
};

export const saveGamesPersistence = (payload: GamesPersistentPayload): void => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(payload));
};

const toRunSnapshot = (payload: GameCompletionPayload): GameRunSnapshot => ({
  gameId: payload.gameId,
  difficulty: payload.difficulty,
  endedAt: new Date().toISOString(),
  durationMs: payload.elapsedMs,
  score: payload.score,
  wpm: payload.wpm,
  accuracy: payload.accuracy,
  mistakes: payload.mistakes,
  correctKeystrokes: Math.max(0, Math.round((payload.wpm * payload.elapsedMs) / 12000) * 5),
  totalKeystrokes: Math.max(
    Math.round((payload.wpm * payload.elapsedMs) / 12000) * 5 + payload.mistakes,
    payload.mistakes
  ),
  maxCombo: payload.maxCombo,
});

const updateFavoriteGame = (stats: PlayerStatsSummary): PlayerStatsSummary => {
  const candidates = Object.entries(stats.perGame);
  const favorite = candidates.sort((a, b) => b[1].gamesCompleted - a[1].gamesCompleted)[0]?.[0] ?? 'falling-words';
  return {
    ...stats,
    favoriteGame: favorite as PlayerStatsSummary['favoriteGame'],
  };
};

export const applyGameCompletionToStats = (
  currentStats: PlayerStatsSummary,
  payload: GameCompletionPayload
): PlayerStatsSummary => {
  const snapshot = toRunSnapshot(payload);
  const gameStats = currentStats.perGame[payload.gameId];

  const updatedGameStats = {
    ...gameStats,
    bestScore: Math.max(gameStats.bestScore, payload.score),
    highestWpm: Math.max(gameStats.highestWpm, payload.wpm),
    bestAccuracy: Math.max(gameStats.bestAccuracy, payload.accuracy),
    gamesCompleted: gameStats.gamesCompleted + 1,
    totalTimePlayedMs: gameStats.totalTimePlayedMs + payload.elapsedMs,
    totalRuns: gameStats.totalRuns + 1,
    totalMistakes: gameStats.totalMistakes + payload.mistakes,
    averageAccuracy:
      gameStats.totalRuns === 0
        ? payload.accuracy
        : (gameStats.averageAccuracy * gameStats.totalRuns + payload.accuracy) / (gameStats.totalRuns + 1),
  };

  const merged: PlayerStatsSummary = {
    ...currentStats,
    bestScore: Math.max(currentStats.bestScore, payload.score),
    highestWpm: Math.max(currentStats.highestWpm, payload.wpm),
    bestAccuracy: Math.max(currentStats.bestAccuracy, payload.accuracy),
    totalTimePlayedMs: currentStats.totalTimePlayedMs + payload.elapsedMs,
    gamesCompleted: currentStats.gamesCompleted + 1,
    totalRuns: currentStats.totalRuns + 1,
    totalCorrectKeystrokes: currentStats.totalCorrectKeystrokes + snapshot.correctKeystrokes,
    totalKeystrokes: currentStats.totalKeystrokes + snapshot.totalKeystrokes,
    recentRuns: [snapshot, ...currentStats.recentRuns].slice(0, MAX_RECENT_RUNS),
    perGame: {
      ...currentStats.perGame,
      [payload.gameId]: updatedGameStats,
    },
  };

  return updateFavoriteGame(merged);
};

export const mergePlayerRunIntoLeaderboard = (
  currentLeaderboard: GameLeaderboardEntry[],
  payload: GameCompletionPayload,
  playerName = 'You'
): GameLeaderboardEntry[] => {
  const entry: GameLeaderboardEntry = {
    id: `player-${Date.now().toString(36)}`,
    playerName,
    gameId: payload.gameId,
    difficulty: payload.difficulty,
    score: payload.score,
    wpm: payload.wpm,
    accuracy: payload.accuracy,
    playedAt: new Date().toISOString(),
    isCurrentPlayer: true,
  };

  const filtered = currentLeaderboard.filter((row) => !row.isCurrentPlayer).slice(0, 150);

  const withPlayer = [entry, ...filtered]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      return b.accuracy - a.accuracy;
    })
    .slice(0, 150)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      isCurrentPlayer: row.id === entry.id,
    }));

  return withPlayer;
};

export const summarizeRunForUi = (payload: GameCompletionPayload): string => {
  const game = GAME_ID_TO_LABEL[payload.gameId];
  const minutes = (payload.elapsedMs / 60000).toFixed(1);
  return `${game}: ${payload.score} pts, ${payload.wpm.toFixed(0)} WPM, ${payload.accuracy.toFixed(1)}%, ${minutes} min`;
};
