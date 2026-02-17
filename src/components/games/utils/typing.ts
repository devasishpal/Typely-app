import type { GameDifficulty, WordPoolByDifficulty } from '@/components/games/types';

export const getWordPoolForDifficulty = (
  words: WordPoolByDifficulty,
  difficulty: GameDifficulty
): string[] => {
  if (difficulty === 'easy') return words.easy;
  if (difficulty === 'medium') return words.medium;
  if (difficulty === 'hard') return words.hard;
  return words.extreme;
};

export const createInitialTypedBuffer = (): string => '';

export const applyTypedCharacter = (buffer: string, key: string): string => `${buffer}${key}`;

export const applyBackspace = (buffer: string): string => (buffer.length > 0 ? buffer.slice(0, -1) : '');

export const cleanInputKey = (key: string): string => {
  if (key === 'Spacebar') return ' ';
  return key;
};

export const isTypingKey = (key: string): boolean => key.length === 1;

export const isSubmitKey = (key: string): boolean => key === 'Enter' || key === ' ';

export const isBackspaceKey = (key: string): boolean => key === 'Backspace';

export const sanitizeBuffer = (buffer: string): string =>
  buffer
    .replace(/\s+/g, ' ')
    .trimStart();

export const bufferWordCount = (buffer: string): number =>
  buffer
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

export const extractLastWord = (buffer: string): string => {
  const trimmed = buffer.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] ?? '';
};
