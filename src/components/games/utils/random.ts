export const pickRandom = <T,>(items: readonly T[]): T => {
  if (items.length === 0) {
    throw new Error('pickRandom requires a non-empty array.');
  }
  return items[Math.floor(Math.random() * items.length)];
};

export const sampleMany = <T,>(items: readonly T[], count: number): T[] => {
  if (count <= 0 || items.length === 0) return [];
  const clone = [...items];
  const output: T[] = [];
  const picks = Math.min(count, clone.length);

  for (let i = 0; i < picks; i += 1) {
    const index = Math.floor(Math.random() * clone.length);
    const [selected] = clone.splice(index, 1);
    output.push(selected);
  }

  return output;
};

export const normalizeWord = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

export const startsWithTyped = (word: string, typed: string): boolean => {
  if (!typed) return true;
  return normalizeWord(word).startsWith(normalizeWord(typed));
};

export const isExactTyped = (word: string, typed: string): boolean =>
  normalizeWord(word) === normalizeWord(typed);

export const mutateWordCase = (word: string): string => {
  if (word.length < 5) return word;
  if (Math.random() < 0.2) return word.toUpperCase();
  if (Math.random() < 0.35) return `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`;
  return word;
};

export const chooseLane = (laneCount: number): number => Math.floor(Math.random() * laneCount);

export const wrapPosition = (value: number, min: number, max: number): number => {
  const range = max - min;
  if (range <= 0) return min;

  let wrapped = value;
  while (wrapped < min) wrapped += range;
  while (wrapped > max) wrapped -= range;
  return wrapped;
};
