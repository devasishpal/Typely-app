import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { GameEngineComputedMetrics, GameEngineMetrics } from '@/components/games/types';
import { computeMetrics } from '@/components/games/utils/gameMath';

const createInitialMetrics = (): GameEngineMetrics => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  correctKeystrokes: 0,
  totalKeystrokes: 0,
  mistakes: 0,
  elapsedMs: 0,
});

interface UseGameMetricsResult {
  metrics: GameEngineComputedMetrics;
  setElapsedMs: (elapsedMs: number) => void;
  addScore: (value: number) => void;
  registerCorrect: (keystrokes?: number, scoreGain?: number) => void;
  registerMistake: () => void;
  reset: () => void;
  setScore: Dispatch<SetStateAction<number>>;
  setCombo: Dispatch<SetStateAction<number>>;
}

export const useGameMetrics = (): UseGameMetricsResult => {
  const [raw, setRaw] = useState<GameEngineMetrics>(createInitialMetrics);

  const setElapsedMs = useCallback((elapsedMs: number) => {
    setRaw((current) => ({
      ...current,
      elapsedMs,
    }));
  }, []);

  const addScore = useCallback((value: number) => {
    setRaw((current) => ({
      ...current,
      score: Math.max(0, current.score + value),
    }));
  }, []);

  const registerCorrect = useCallback((keystrokes = 1, scoreGain = 0) => {
    setRaw((current) => {
      const nextCombo = current.combo + 1;
      return {
        ...current,
        combo: nextCombo,
        maxCombo: Math.max(current.maxCombo, nextCombo),
        totalKeystrokes: current.totalKeystrokes + keystrokes,
        correctKeystrokes: current.correctKeystrokes + keystrokes,
        score: current.score + scoreGain,
      };
    });
  }, []);

  const registerMistake = useCallback(() => {
    setRaw((current) => ({
      ...current,
      combo: 0,
      totalKeystrokes: current.totalKeystrokes + 1,
      mistakes: current.mistakes + 1,
    }));
  }, []);

  const reset = useCallback(() => {
    setRaw(createInitialMetrics());
  }, []);

  const setScore: Dispatch<SetStateAction<number>> = useCallback((next) => {
    setRaw((current) => {
      const value = typeof next === 'function' ? (next as (value: number) => number)(current.score) : next;
      return {
        ...current,
        score: Math.max(0, value),
      };
    });
  }, []);

  const setCombo: Dispatch<SetStateAction<number>> = useCallback((next) => {
    setRaw((current) => {
      const value = typeof next === 'function' ? (next as (value: number) => number)(current.combo) : next;
      return {
        ...current,
        combo: Math.max(0, value),
        maxCombo: Math.max(current.maxCombo, value),
      };
    });
  }, []);

  return useMemo(
    () => ({
      metrics: computeMetrics(raw),
      setElapsedMs,
      addScore,
      registerCorrect,
      registerMistake,
      reset,
      setScore,
      setCombo,
    }),
    [raw, setElapsedMs, addScore, registerCorrect, registerMistake, reset, setScore, setCombo]
  );
};

export default useGameMetrics;

