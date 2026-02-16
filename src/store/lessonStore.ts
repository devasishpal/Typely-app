import { create } from 'zustand';
import {
  getNextExpectedKey,
  isMatch,
  normalizeDisplayKey,
  pushMistake,
  type MistakesMap,
} from '@/utils/typingUtils';

export type LessonNode = {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  content: string;
  moduleId: string;
  moduleTitle: string;
  unitId: string;
  unitTitle: string;
};

export type LessonFlashEvent = {
  token: number;
  index: number;
  correct: boolean;
} | null;

export type PersistedLessonSnapshot = {
  currentIndex: number;
  correctCount: number;
  incorrectCount: number;
  backspaceCount: number;
  elapsedMs: number;
  mistakes: MistakesMap;
};

type RegisterResult = {
  accepted: boolean;
  correct: boolean;
};

interface LessonStore {
  lesson: LessonNode | null;
  currentIndex: number;
  correctCount: number;
  incorrectCount: number;
  backspaceCount: number;
  elapsedMs: number;
  startedAt: number | null;
  running: boolean;
  completed: boolean;
  activeKey: string | null;
  nextKey: string;
  mistakes: MistakesMap;
  flashEvent: LessonFlashEvent;
  setLesson: (lesson: LessonNode) => void;
  applyProgress: (snapshot: PersistedLessonSnapshot) => void;
  start: () => void;
  stop: () => void;
  tick: (now: number) => void;
  registerKey: (key: string) => RegisterResult;
  releaseKey: () => void;
  resetLesson: () => void;
}

const initialRuntimeState = {
  currentIndex: 0,
  correctCount: 0,
  incorrectCount: 0,
  backspaceCount: 0,
  elapsedMs: 0,
  startedAt: null as number | null,
  running: false,
  completed: false,
  activeKey: null as string | null,
  nextKey: '',
  mistakes: {} as MistakesMap,
  flashEvent: null as LessonFlashEvent,
};

export const useLessonStore = create<LessonStore>((set, get) => ({
  lesson: null,
  ...initialRuntimeState,
  setLesson: (lesson) => {
    set({
      lesson,
      ...initialRuntimeState,
      nextKey: getNextExpectedKey(lesson.content, 0),
    });
  },
  applyProgress: (snapshot) => {
    const lesson = get().lesson;
    if (!lesson) return;

    const boundedIndex = Math.max(0, Math.min(snapshot.currentIndex, lesson.content.length));
    const completed = boundedIndex >= lesson.content.length;
    const normalizedElapsedMs = Math.max(0, snapshot.elapsedMs);

    set({
      currentIndex: boundedIndex,
      correctCount: Math.max(0, snapshot.correctCount),
      incorrectCount: Math.max(0, snapshot.incorrectCount),
      backspaceCount: Math.max(0, snapshot.backspaceCount),
      elapsedMs: normalizedElapsedMs,
      startedAt: completed ? null : performance.now() - normalizedElapsedMs,
      running: false,
      completed,
      activeKey: null,
      nextKey: getNextExpectedKey(lesson.content, boundedIndex),
      mistakes: snapshot.mistakes,
      flashEvent: null,
    });
  },
  start: () => {
    const state = get();
    if (state.running || state.completed) return;
    const baseline = state.elapsedMs;
    set({
      running: true,
      startedAt: performance.now() - baseline,
    });
  },
  stop: () => {
    set({
      running: false,
      startedAt: null,
      activeKey: null,
    });
  },
  tick: (now) => {
    const state = get();
    if (!state.running || state.startedAt === null) return;
    const elapsed = Math.max(0, Math.floor(now - state.startedAt));
    set({ elapsedMs: elapsed });
  },
  registerKey: (key) => {
    const state = get();
    const lesson = state.lesson;
    if (!lesson || state.completed) return { accepted: false, correct: false };

    const keyLabel = normalizeDisplayKey(key);
    if (key === 'Backspace') {
      set({
        backspaceCount: state.backspaceCount + 1,
        activeKey: keyLabel,
        flashEvent: {
          token: Date.now(),
          index: Math.max(0, state.currentIndex - 1),
          correct: false,
        },
      });
      return { accepted: true, correct: false };
    }

    if (!state.running) {
      get().start();
    }

    const expectedChar = lesson.content[state.currentIndex] ?? '';
    const isCorrect = isMatch(expectedChar, key);

    if (isCorrect) {
      const nextIndex = state.currentIndex + 1;
      const isCompleted = nextIndex >= lesson.content.length;
      const nextExpected = getNextExpectedKey(lesson.content, nextIndex);

      set({
        currentIndex: nextIndex,
        correctCount: state.correctCount + 1,
        completed: isCompleted,
        running: isCompleted ? false : state.running,
        startedAt: isCompleted ? null : state.startedAt,
        activeKey: keyLabel,
        nextKey: isCompleted ? '' : nextExpected,
        flashEvent: {
          token: Date.now(),
          index: state.currentIndex,
          correct: true,
        },
      });

      return { accepted: true, correct: true };
    }

    const nextMistakes = pushMistake(state.mistakes, keyLabel);
    set({
      incorrectCount: state.incorrectCount + 1,
      activeKey: keyLabel,
      mistakes: nextMistakes,
      flashEvent: {
        token: Date.now(),
        index: state.currentIndex,
        correct: false,
      },
    });

    return { accepted: true, correct: false };
  },
  releaseKey: () => {
    set({ activeKey: null });
  },
  resetLesson: () => {
    const lesson = get().lesson;
    if (!lesson) return;
    set({
      ...initialRuntimeState,
      lesson,
      nextKey: getNextExpectedKey(lesson.content, 0),
    });
  },
}));
