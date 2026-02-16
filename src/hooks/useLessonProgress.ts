import { useCallback } from 'react';
import { LESSON_PROGRESS_STORAGE_KEY } from '@/constants/lessonTheme';
import type { MistakesMap } from '@/utils/typingUtils';

export type StoredLessonProgress = {
  lessonId: string;
  currentIndex: number;
  correctCount: number;
  incorrectCount: number;
  backspaceCount: number;
  elapsedMs: number;
  mistakes: MistakesMap;
  updatedAt: number;
};

type LessonProgressRecord = Record<string, StoredLessonProgress>;

function readProgressMap(): LessonProgressRecord {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(LESSON_PROGRESS_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as LessonProgressRecord;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function writeProgressMap(record: LessonProgressRecord): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(record));
}

export function useLessonProgress() {
  const loadProgress = useCallback((lessonId: string): StoredLessonProgress | null => {
    const progressMap = readProgressMap();
    return progressMap[lessonId] ?? null;
  }, []);

  const saveProgress = useCallback((progress: StoredLessonProgress): void => {
    const progressMap = readProgressMap();
    progressMap[progress.lessonId] = progress;
    writeProgressMap(progressMap);
  }, []);

  const clearProgress = useCallback((lessonId: string): void => {
    const progressMap = readProgressMap();
    if (!(lessonId in progressMap)) return;
    delete progressMap[lessonId];
    writeProgressMap(progressMap);
  }, []);

  const clearAllProgress = useCallback((): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(LESSON_PROGRESS_STORAGE_KEY);
  }, []);

  return {
    loadProgress,
    saveProgress,
    clearProgress,
    clearAllProgress,
  };
}
