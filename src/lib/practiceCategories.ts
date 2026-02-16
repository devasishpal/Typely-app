import type { PracticeTest } from '@/types';

export type PracticeCategory = 'word' | 'sentence' | 'long';

export const PRACTICE_CATEGORY_ORDER: PracticeCategory[] = ['word', 'sentence', 'long'];

export const PRACTICE_CATEGORY_LABELS: Record<PracticeCategory, string> = {
  word: 'Word Practice',
  sentence: 'Sentence Practice',
  long: 'Long Paragraph Practice',
};

const PRACTICE_CATEGORY_DURATION_MAP: Record<PracticeCategory, number> = {
  word: 1,
  sentence: 2,
  long: 3,
};

export const practiceCategoryToDuration = (category: PracticeCategory): number =>
  PRACTICE_CATEGORY_DURATION_MAP[category];

export const durationToPracticeCategory = (durationMinutes: number): PracticeCategory | null => {
  if (durationMinutes === PRACTICE_CATEGORY_DURATION_MAP.word) return 'word';
  if (durationMinutes === PRACTICE_CATEGORY_DURATION_MAP.sentence) return 'sentence';
  if (durationMinutes === PRACTICE_CATEGORY_DURATION_MAP.long) return 'long';
  return null;
};

export const inferPracticeCategory = (
  practice: Pick<PracticeTest, 'title' | 'content' | 'word_count' | 'duration_minutes'>
): PracticeCategory => {
  const explicitCategory = durationToPracticeCategory(practice.duration_minutes);
  if (explicitCategory) return explicitCategory;

  const haystack = `${practice.title} ${practice.content}`.toLowerCase();

  if (
    haystack.includes('word') ||
    haystack.includes('drill') ||
    haystack.includes('vocabulary') ||
    practice.word_count <= 20
  ) {
    return 'word';
  }

  if (
    haystack.includes('paragraph') ||
    haystack.includes('passage') ||
    haystack.includes('article') ||
    haystack.includes('essay') ||
    practice.word_count >= 50
  ) {
    return 'long';
  }

  return 'sentence';
};

