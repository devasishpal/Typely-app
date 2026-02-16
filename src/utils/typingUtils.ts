export type MistakesMap = Record<string, number>;

const CONTROL_KEY_MAP: Record<string, string> = {
  ' ': 'Space',
  Spacebar: 'Space',
  Enter: 'Enter',
  Tab: 'Tab',
  Backspace: 'Backspace',
};

export function normalizeDisplayKey(key: string): string {
  if (key in CONTROL_KEY_MAP) return CONTROL_KEY_MAP[key];
  if (key.length === 1) return key.toLowerCase();
  return key;
}

export function mapEventKeyToContentKey(key: string): string {
  if (key === 'Enter') return '\n';
  if (key === 'Tab') return '\t';
  if (key === 'Spacebar') return ' ';
  return key;
}

export function isTypingKey(key: string): boolean {
  if (key.length === 1) return true;
  return key === 'Enter' || key === 'Backspace' || key === 'Tab' || key === 'Spacebar';
}

export function calculateWpm(correctCharacters: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  const words = correctCharacters / 5;
  return Math.max(0, Math.round(words / minutes));
}

export function calculateAccuracy(correctCount: number, incorrectCount: number): number {
  const total = correctCount + incorrectCount;
  if (total <= 0) return 100;
  return Math.max(0, Math.min(100, (correctCount / total) * 100));
}

export function calculateErrorRate(correctCount: number, incorrectCount: number): number {
  const total = correctCount + incorrectCount;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (incorrectCount / total) * 100));
}

export function calculateProgress(currentIndex: number, totalLength: number): number {
  if (totalLength <= 0) return 0;
  return Math.max(0, Math.min(100, (currentIndex / totalLength) * 100));
}

export function pushMistake(mistakes: MistakesMap, key: string): MistakesMap {
  const mappedKey = normalizeDisplayKey(key);
  return {
    ...mistakes,
    [mappedKey]: (mistakes[mappedKey] ?? 0) + 1,
  };
}

export function getTopMistakes(mistakes: MistakesMap, count = 4): Array<{ key: string; total: number }> {
  return Object.entries(mistakes)
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, count);
}

export function getNextExpectedKey(content: string, index: number): string {
  const char = content[index] ?? '';
  if (char === ' ') return 'Space';
  if (char === '\n') return 'Enter';
  return char;
}

export function isMatch(expected: string, typedRawKey: string): boolean {
  const typed = mapEventKeyToContentKey(typedRawKey);
  if (expected === '\n') return typed === '\n';
  if (expected === '\t') return typed === '\t';
  if (expected === ' ') return typed === ' ';
  return typed.length === 1 && typed === expected;
}

export function parseLessonText(text: string): string[] {
  return text.split('');
}
