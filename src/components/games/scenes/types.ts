import type {
  AchievementPreviewItem,
  GameCardDescriptor,
  GameCompletionPayload,
  GameDifficulty,
  GameId,
  GameLeaderboardEntry,
  PlayerStatsSummary,
} from '@/components/games/types';

export interface GamesHeroSectionProps {
  activeGame: GameId;
  difficulty: GameDifficulty;
  totalGamesCompleted: number;
}

export interface GameCardsGridSectionProps {
  cards: GameCardDescriptor[];
  activeGame: GameId;
  onSelectGame: (id: GameId) => void;
}

export interface PlayerStatsSectionProps {
  stats: PlayerStatsSummary;
  lastRun?: GameCompletionPayload | null;
}

export interface DifficultyFilterSectionProps {
  difficulty: GameDifficulty;
  onChangeDifficulty: (difficulty: GameDifficulty) => void;
}

export interface GamePreviewSectionProps {
  activeGame: GameId;
  difficulty: GameDifficulty;
}

export interface LeaderboardSectionProps {
  leaderboard: GameLeaderboardEntry[];
  activeGame: GameId;
  difficulty: GameDifficulty;
}

export interface AchievementPreviewSectionProps {
  achievements: AchievementPreviewItem[];
}

export interface GamesCtaSectionProps {
  onLaunch: () => void;
  activeGame: GameId;
  difficulty: GameDifficulty;
}
