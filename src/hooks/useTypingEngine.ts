import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateAccuracy,
  calculateErrorRate,
  calculateProgress,
  calculateWpm,
  getTopMistakes,
  isTypingKey,
  parseLessonText,
} from '@/utils/typingUtils';
import { useLessonStore, type LessonNode } from '@/store/lessonStore';
import { useLessonProgress } from '@/hooks/useLessonProgress';

export function useTypingEngine(lesson: LessonNode | null) {
  const setLesson = useLessonStore((state) => state.setLesson);
  const applyProgress = useLessonStore((state) => state.applyProgress);
  const start = useLessonStore((state) => state.start);
  const stop = useLessonStore((state) => state.stop);
  const tick = useLessonStore((state) => state.tick);
  const registerKey = useLessonStore((state) => state.registerKey);
  const releaseKey = useLessonStore((state) => state.releaseKey);
  const resetLesson = useLessonStore((state) => state.resetLesson);

  const currentIndex = useLessonStore((state) => state.currentIndex);
  const correctCount = useLessonStore((state) => state.correctCount);
  const incorrectCount = useLessonStore((state) => state.incorrectCount);
  const backspaceCount = useLessonStore((state) => state.backspaceCount);
  const elapsedMs = useLessonStore((state) => state.elapsedMs);
  const running = useLessonStore((state) => state.running);
  const completed = useLessonStore((state) => state.completed);
  const activeKey = useLessonStore((state) => state.activeKey);
  const nextKey = useLessonStore((state) => state.nextKey);
  const mistakes = useLessonStore((state) => state.mistakes);
  const flashEvent = useLessonStore((state) => state.flashEvent);

  const { loadProgress, saveProgress, clearProgress } = useLessonProgress();

  const [errorFlashIndex, setErrorFlashIndex] = useState<number | null>(null);
  const [correctFlashIndex, setCorrectFlashIndex] = useState<number | null>(null);

  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lesson) return;

    setLesson(lesson);
    const progress = loadProgress(lesson.id);

    if (progress) {
      applyProgress({
        currentIndex: progress.currentIndex,
        correctCount: progress.correctCount,
        incorrectCount: progress.incorrectCount,
        backspaceCount: progress.backspaceCount,
        elapsedMs: progress.elapsedMs,
        mistakes: progress.mistakes,
      });
    }
  }, [lesson, setLesson, loadProgress, applyProgress]);

  useEffect(() => {
    if (!flashEvent) return;

    if (flashEvent.correct) {
      setCorrectFlashIndex(flashEvent.index);
      const timeout = window.setTimeout(() => setCorrectFlashIndex(null), 220);
      return () => window.clearTimeout(timeout);
    }

    setErrorFlashIndex(flashEvent.index);
    const timeout = window.setTimeout(() => setErrorFlashIndex(null), 320);
    return () => window.clearTimeout(timeout);
  }, [flashEvent]);

  useEffect(() => {
    if (!running) return;

    let raf = 0;
    const frame = (now: number) => {
      tick(now);
      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);

    return () => window.cancelAnimationFrame(raf);
  }, [running, tick]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!lesson || completed) return;
      if (!isTypingKey(event.key)) return;

      event.preventDefault();
      if (!running) start();
      registerKey(event.key);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!isTypingKey(event.key)) return;
      releaseKey();
    };

    const onWindowBlur = () => {
      releaseKey();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [lesson, completed, running, registerKey, releaseKey, start]);

  useEffect(() => {
    if (!lesson) return;
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveProgress({
        lessonId: lesson.id,
        currentIndex,
        correctCount,
        incorrectCount,
        backspaceCount,
        elapsedMs,
        mistakes,
        updatedAt: Date.now(),
      });
    }, 120);

    return () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    lesson,
    currentIndex,
    correctCount,
    incorrectCount,
    backspaceCount,
    elapsedMs,
    mistakes,
    saveProgress,
  ]);

  const progressPercent = useMemo(
    () => calculateProgress(currentIndex, lesson?.content.length ?? 0),
    [currentIndex, lesson]
  );

  const wpm = useMemo(() => calculateWpm(correctCount, elapsedMs), [correctCount, elapsedMs]);
  const accuracy = useMemo(
    () => calculateAccuracy(correctCount, incorrectCount),
    [correctCount, incorrectCount]
  );
  const errorRate = useMemo(
    () => calculateErrorRate(correctCount, incorrectCount),
    [correctCount, incorrectCount]
  );

  const topMistakes = useMemo(() => getTopMistakes(mistakes, 4), [mistakes]);
  const contentCharacters = useMemo(
    () => parseLessonText(lesson?.content ?? ''),
    [lesson?.content]
  );

  const resetEngine = useCallback(() => {
    if (!lesson) return;
    resetLesson();
    clearProgress(lesson.id);
  }, [lesson, resetLesson, clearProgress]);

  const pauseEngine = useCallback(() => {
    stop();
  }, [stop]);

  return {
    lesson,
    contentCharacters,
    currentIndex,
    correctCount,
    incorrectCount,
    backspaceCount,
    elapsedMs,
    running,
    completed,
    activeKey,
    nextKey,
    progressPercent,
    wpm,
    accuracy,
    errorRate,
    topMistakes,
    errorFlashIndex,
    correctFlashIndex,
    resetEngine,
    pauseEngine,
    start,
  };
}

export type TypingEngine = ReturnType<typeof useTypingEngine>;
export type TypedLessonNode = LessonNode;
