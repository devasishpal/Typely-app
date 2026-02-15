import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  target: number;
  duration?: number;
  decimals?: number;
  start: boolean;
}

export function useCountUp({ target, duration = 1700, decimals = 0, start }: UseCountUpOptions) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

    const startTime = performance.now();

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = target * easedProgress;

      setValue(nextValue);

      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [duration, start, target]);

  return Number(value.toFixed(decimals));
}
