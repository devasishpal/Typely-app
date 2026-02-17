import type { GameEngineComputedMetrics, GameEngineMetrics } from '@/components/games/types';

export const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

export const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

export const randomIntBetween = (min: number, max: number): number =>
  Math.floor(randomBetween(min, max + 1));

export const randomFrom = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

export const calcAccuracy = (correctKeystrokes: number, totalKeystrokes: number): number => {
  if (totalKeystrokes <= 0) return 100;
  return clamp((correctKeystrokes / totalKeystrokes) * 100, 0, 100);
};

export const calcWpm = (correctKeystrokes: number, elapsedMs: number): number => {
  if (elapsedMs <= 0 || correctKeystrokes <= 0) return 0;
  const minutes = elapsedMs / 60000;
  if (minutes <= 0) return 0;
  return (correctKeystrokes / 5) / minutes;
};

export const calcMultiplier = (combo: number): number => {
  if (combo >= 45) return 5;
  if (combo >= 30) return 4;
  if (combo >= 20) return 3;
  if (combo >= 10) return 2;
  return 1;
};

export const computeMetrics = (metrics: GameEngineMetrics): GameEngineComputedMetrics => {
  const accuracy = calcAccuracy(metrics.correctKeystrokes, metrics.totalKeystrokes);
  const wpm = calcWpm(metrics.correctKeystrokes, metrics.elapsedMs);
  const multiplier = calcMultiplier(metrics.combo);
  return {
    ...metrics,
    accuracy,
    wpm,
    multiplier,
  };
};

export const formatTimeMs = (timeMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatCompactNumber = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
};

export const uid = (prefix = 'id'): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 11)}-${Date.now().toString(36)}`;

export const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, current) => sum + current, 0) / values.length;
};

export const safeDivide = (numerator: number, denominator: number): number => {
  if (denominator === 0) return 0;
  return numerator / denominator;
};

export const weightedScore = (
  score: number,
  wpm: number,
  accuracy: number,
  difficultyWeight: number
): number => {
  const scoreTerm = score;
  const speedTerm = wpm * 10;
  const accuracyTerm = accuracy * 3;
  return Math.round((scoreTerm + speedTerm + accuracyTerm) * difficultyWeight);
};
