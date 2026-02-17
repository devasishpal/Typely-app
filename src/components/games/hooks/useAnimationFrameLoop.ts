import { useEffect, useRef } from 'react';
import type { PerformanceFrameInfo, UseAnimationFrameLoopOptions } from '@/components/games/types';

export const useAnimationFrameLoop = ({ enabled, onFrame }: UseAnimationFrameLoopOptions): void => {
  const onFrameRef = useRef(onFrame);
  const frameRef = useRef<number>(0);
  const previousRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled) {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = 0;
      previousRef.current = 0;
      startRef.current = 0;
      return;
    }

    const tick = (now: number) => {
      if (!startRef.current) {
        startRef.current = now;
      }

      const previous = previousRef.current || now;
      const deltaMs = Math.min(64, Math.max(0, now - previous));
      const elapsedMs = now - startRef.current;
      previousRef.current = now;

      const frameInfo: PerformanceFrameInfo = {
        now,
        deltaMs,
        elapsedMs,
      };

      onFrameRef.current(frameInfo);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = 0;
      previousRef.current = 0;
      startRef.current = 0;
    };
  }, [enabled]);
};
