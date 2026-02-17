import type { ComponentType } from 'react';
import { CloudRain, Crosshair, Skull, Trophy, Car } from 'lucide-react';
import type { GameId } from '@/components/games/types';

type IconType = ComponentType<{ className?: string }>;

export const gameIconById: Record<GameId, IconType> = {
  'falling-words': CloudRain,
  'speed-racer': Car,
  'zombie-survival': Skull,
  'target-practice': Crosshair,
};

export const getGameLabel = (id: GameId): string => {
  if (id === 'falling-words') return 'Falling Words';
  if (id === 'speed-racer') return 'Speed Racer';
  if (id === 'zombie-survival') return 'Zombie Survival';
  if (id === 'target-practice') return 'Target Practice';
  return 'Typing Game';
};

export const getDifficultyWeight = (difficulty: string): number => {
  if (difficulty === 'easy') return 0.9;
  if (difficulty === 'medium') return 1;
  if (difficulty === 'hard') return 1.2;
  return 1.4;
};

export const rankIcon = (rank: number): IconType | null => {
  if (rank === 1) return Trophy;
  return null;
};

