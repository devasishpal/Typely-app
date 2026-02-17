import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type GameId = 'falling-words' | 'speed-racer' | 'zombie-survival' | 'target-practice';

export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export type GameStatus = 'idle' | 'running' | 'paused' | 'game-over';

export interface DifficultyConfig {
  id: GameDifficulty;
  label: string;
  description: string;
  speedMultiplier: number;
  spawnMultiplier: number;
  healthMultiplier: number;
  scoreMultiplier: number;
  comboWindowMs: number;
  targetWpm: number;
}

export interface CoreMetrics {
  score: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  combo: number;
  maxCombo: number;
  elapsedMs: number;
}

export interface GameRunSnapshot {
  gameId: GameId;
  difficulty: GameDifficulty;
  endedAt: string;
  durationMs: number;
  score: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  maxCombo: number;
}

export interface PlayerStatsSummary {
  bestScore: number;
  highestWpm: number;
  bestAccuracy: number;
  totalTimePlayedMs: number;
  gamesCompleted: number;
  totalRuns: number;
  totalCorrectKeystrokes: number;
  totalKeystrokes: number;
  favoriteGame: GameId;
  recentRuns: GameRunSnapshot[];
  perGame: Record<GameId, PlayerGameStats>;
}

export interface PlayerGameStats {
  bestScore: number;
  highestWpm: number;
  bestAccuracy: number;
  gamesCompleted: number;
  totalTimePlayedMs: number;
  totalRuns: number;
  totalMistakes: number;
  averageAccuracy: number;
}

export interface GameLeaderboardEntry {
  id: string;
  playerName: string;
  gameId: GameId;
  difficulty: GameDifficulty;
  score: number;
  wpm: number;
  accuracy: number;
  playedAt: string;
  rank?: number;
  isCurrentPlayer?: boolean;
}

export interface AchievementPreviewItem {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  unlocked: boolean;
}

export interface GameCardDescriptor {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accentClassName: string;
  gradientClassName: string;
  playTimeLabel: string;
  difficultyHint: string;
  objectives: string[];
}

export interface FloatingWordEntity {
  id: string;
  text: string;
  typedText: string;
  x: number;
  y: number;
  velocityY: number;
  width: number;
  createdAt: number;
  value: number;
}

export interface ParticleEntity {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  lifeMs: number;
  maxLifeMs: number;
  size: number;
  hue: number;
  alpha: number;
}

export interface RacerWordChallenge {
  id: string;
  text: string;
  typed: string;
  distanceValue: number;
  speedBonus: number;
}

export interface ZombieEntity {
  id: string;
  word: string;
  typed: string;
  lane: number;
  distance: number;
  speed: number;
  health: number;
  maxHealth: number;
  isBoss: boolean;
  spawnTime: number;
  attackCooldownMs: number;
}

export interface ZombieWaveState {
  wave: number;
  zombiesDefeated: number;
  bossDefeated: number;
  nextWaveAt: number;
}

export interface TargetEntity {
  id: string;
  word: string;
  typed: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
  points: number;
  createdAt: number;
}

export interface CrosshairState {
  x: number;
  y: number;
  visible: boolean;
}

export interface EngineInputState {
  typedBuffer: string;
  lastKey: string;
  isBackspace: boolean;
  timestamp: number;
}

export interface GameLifecycleHandlers {
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export interface GameCompletionPayload {
  gameId: GameId;
  score: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  maxCombo: number;
  elapsedMs: number;
  difficulty: GameDifficulty;
}

export interface GameComponentProps {
  difficulty: GameDifficulty;
  onComplete: (payload: GameCompletionPayload) => void;
  onBackToHub?: () => void;
}

export interface PerformanceFrameInfo {
  now: number;
  deltaMs: number;
  elapsedMs: number;
}

export interface GameTimerProps {
  elapsedMs: number;
  maxMs?: number;
  status: GameStatus;
}

export interface ScoreBoardProps {
  score: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  status: GameStatus;
}

export interface HealthBarProps {
  label?: string;
  current: number;
  max: number;
  warningThreshold?: number;
}

export interface ComboMeterProps {
  combo: number;
  maxCombo: number;
  multiplier: number;
}

export interface AnimatedBackgroundProps {
  gameId: GameId;
  intensity: number;
  speed: number;
  paused?: boolean;
}

export interface ParticleSystemProps {
  particles: ParticleEntity[];
}

export interface GameOverModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  score: number;
  wpm: number;
  accuracy: number;
  maxCombo: number;
  onRestart: () => void;
  onBack: () => void;
}

export interface PauseOverlayProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
  onBack: () => void;
}

export interface GameLayoutProps {
  gameId: GameId;
  title: string;
  subtitle: string;
  status: GameStatus;
  onPauseToggle: () => void;
  onRestart: () => void;
  onBack: () => void;
  timer: {
    elapsedMs: number;
    maxMs?: number;
  };
  stats: {
    score: number;
    wpm: number;
    accuracy: number;
    mistakes: number;
    combo: number;
    maxCombo: number;
    health?: {
      current: number;
      max: number;
      label?: string;
      warningThreshold?: number;
    };
  };
  children: ReactNode;
  particles?: ParticleEntity[];
  className?: string;
}

export interface GamesPersistentPayload {
  stats: PlayerStatsSummary;
  leaderboard: GameLeaderboardEntry[];
  updatedAt: string;
}

export interface DifficultyOption {
  value: GameDifficulty;
  label: string;
  helper: string;
}

export interface WordPoolByDifficulty {
  easy: string[];
  medium: string[];
  hard: string[];
  extreme: string[];
}

export interface SpawnWindowConfig {
  minMs: number;
  maxMs: number;
}

export interface FallingWordsDifficultyTuning {
  spawn: SpawnWindowConfig;
  baseWordSpeed: number;
  maxConcurrentWords: number;
  startingHealth: number;
  scoreScale: number;
}

export interface SpeedRacerDifficultyTuning {
  startingSpeed: number;
  accelerationGain: number;
  maxSpeed: number;
  speedDecayPerSecond: number;
  mistakePenalty: number;
  finishDistance: number;
}

export interface ZombieDifficultyTuning {
  spawn: SpawnWindowConfig;
  zombieSpeed: number;
  bossIntervalWaves: number;
  startingHealth: number;
  laneCount: number;
}

export interface TargetPracticeDifficultyTuning {
  spawn: SpawnWindowConfig;
  maxTargets: number;
  minRadius: number;
  maxRadius: number;
  targetSpeed: number;
  roundTimeMs: number;
}

export interface DifficultyTuningMap {
  fallingWords: Record<GameDifficulty, FallingWordsDifficultyTuning>;
  speedRacer: Record<GameDifficulty, SpeedRacerDifficultyTuning>;
  zombieSurvival: Record<GameDifficulty, ZombieDifficultyTuning>;
  targetPractice: Record<GameDifficulty, TargetPracticeDifficultyTuning>;
}

export interface GamePreviewMetric {
  id: string;
  label: string;
  value: string;
  delta?: string;
}

export interface LeaderboardSeedRecord {
  playerName: string;
  score: number;
  wpm: number;
  accuracy: number;
  gameId: GameId;
  difficulty: GameDifficulty;
}

export interface KeyboardCaptureOptions {
  enabled: boolean;
  allowSpaces?: boolean;
  allowBackspace?: boolean;
  onType: (key: string) => void;
  onBackspace?: () => void;
  onSubmit?: () => void;
}

export interface UseAnimationFrameLoopOptions {
  enabled: boolean;
  onFrame: (frame: PerformanceFrameInfo) => void;
}

export interface UseGameSessionOptions {
  gameId: GameId;
  difficulty: GameDifficulty;
  initialStatus?: GameStatus;
  maxDurationMs?: number;
}

export interface GameSessionState {
  status: GameStatus;
  elapsedMs: number;
  startTimeMs: number;
  pauseTimeMs: number;
}

export interface UseGameSessionResult {
  session: GameSessionState;
  setStatus: Dispatch<SetStateAction<GameStatus>>;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  setElapsedMs: Dispatch<SetStateAction<number>>;
}

export interface ScorePulse {
  id: string;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

export interface AudioSettings {
  enabled: boolean;
  volume: number;
}

export interface AchievementProgress {
  wordsDestroyed: number;
  topSpeed: number;
  zombiesEliminated: number;
  precisionHits: number;
  longestCombo: number;
}

export interface GameEngineMetrics {
  score: number;
  combo: number;
  maxCombo: number;
  correctKeystrokes: number;
  totalKeystrokes: number;
  mistakes: number;
  elapsedMs: number;
}

export interface GameEngineComputedMetrics extends GameEngineMetrics {
  accuracy: number;
  wpm: number;
  multiplier: number;
}

