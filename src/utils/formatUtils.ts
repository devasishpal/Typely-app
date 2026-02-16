export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function formatPercent(value: number, decimals = 0): string {
  return `${clamp(value).toFixed(decimals)}%`;
}

export function formatTimer(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function toInitial(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'A';
  return trimmed.charAt(0).toUpperCase();
}

export function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}
