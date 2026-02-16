import { useEffect, useMemo, useState } from 'react';
import { coachTips, type CoachTip } from '@/data/coachTips';
import { LESSON_COACH_INTERVAL_MS } from '@/constants/lessonTheme';

const randomIndex = (max: number, exclude: number): number => {
  if (max <= 1) return 0;
  let next = exclude;
  while (next === exclude) {
    next = Math.floor(Math.random() * max);
  }
  return next;
};

export function useCoachTips() {
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [loadingNextTip, setLoadingNextTip] = useState<boolean>(false);

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * coachTips.length));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLoadingNextTip(true);
      window.setTimeout(() => {
        setTipIndex((current) => randomIndex(coachTips.length, current));
        setLoadingNextTip(false);
      }, 420);
    }, LESSON_COACH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  const tip: CoachTip = useMemo(() => coachTips[tipIndex] ?? coachTips[0], [tipIndex]);

  return {
    tip,
    loadingNextTip,
  };
}
