import { supabase } from '@/db/supabase';
import type {
  AchievementWithStatus,
  DailyStats,
  GuestTypingResult,
  Lesson,
  LessonProgress,
  LessonWithProgress,
  OverallStats,
  TypingSession,
} from '@/types';

export const LOCAL_USER_DATA_STORAGE_KEY = 'typely_local_user_data';
export const GUEST_PROGRESS_STORAGE_KEY = 'typely_guest_progress';
const MAX_TEST_RECORDS = 200;
const MAX_LEADERBOARD_RECORDS = 200;

type LocalTypingSource = 'typing-test' | 'practice' | 'lesson';

export type LocalTypingTest = GuestTypingResult & {
  source: LocalTypingSource;
  lesson_id?: string | null;
};

type LocalLessonProgressState = {
  completed: boolean;
  best_wpm: number | null;
  best_accuracy: number | null;
  attempts: number;
  last_practiced_at: string | null;
};

export type LocalLeaderboardEntry = {
  id: string;
  nickname: string;
  wpm: number;
  accuracy: number;
  duration: number;
  date: string;
  user_id: string | null;
};

export type LocalUserData = {
  tests: LocalTypingTest[];
  streak: number;
  settings: Record<string, unknown>;
  achievements: string[];
  lesson_progress: Record<string, LocalLessonProgressState>;
  leaderboard: LocalLeaderboardEntry[];
  nickname: string | null;
  lastUpdated: string;
};

type GuestTypingResultInput = {
  wpm: number;
  accuracy: number;
  mistakes: number;
  duration: number;
  date?: string;
  source?: LocalTypingSource;
  lesson_id?: string | null;
};

type MergeGuestProgressResult = {
  mergedCount: number;
  error: string | null;
};

type LocalLeaderboardInput = {
  nickname?: string | null;
  wpm: number;
  accuracy: number;
  duration: number;
  user_id?: string | null;
  date?: string;
};

const LOCAL_ACHIEVEMENTS = [
  {
    id: 'guest-first-session',
    title: 'Warm Up',
    description: 'Complete your first typing session.',
    icon: '🎯',
    requirement_type: 'sessions',
    requirement_value: 1,
    badge_color: '#3B82F6',
    predicate: (summary: LocalSummary) => summary.totalSessions >= 1,
  },
  {
    id: 'guest-accuracy-95',
    title: 'Precision 95',
    description: 'Reach at least 95% accuracy.',
    icon: '🎯',
    requirement_type: 'accuracy',
    requirement_value: 95,
    badge_color: '#10B981',
    predicate: (summary: LocalSummary) => summary.bestAccuracy >= 95,
  },
  {
    id: 'guest-speed-40',
    title: 'Speed 40',
    description: 'Reach 40 WPM in any session.',
    icon: '⚡',
    requirement_type: 'wpm',
    requirement_value: 40,
    badge_color: '#F59E0B',
    predicate: (summary: LocalSummary) => summary.bestWpm >= 40,
  },
  {
    id: 'guest-speed-60',
    title: 'Speed 60',
    description: 'Reach 60 WPM in any session.',
    icon: '🚀',
    requirement_type: 'wpm',
    requirement_value: 60,
    badge_color: '#EF4444',
    predicate: (summary: LocalSummary) => summary.bestWpm >= 60,
  },
  {
    id: 'guest-sessions-25',
    title: 'Consistency',
    description: 'Complete 25 sessions.',
    icon: '🏅',
    requirement_type: 'sessions',
    requirement_value: 25,
    badge_color: '#8B5CF6',
    predicate: (summary: LocalSummary) => summary.totalSessions >= 25,
  },
  {
    id: 'guest-lesson-10',
    title: 'Lesson Explorer',
    description: 'Complete 10 lessons.',
    icon: '📘',
    requirement_type: 'lessons_completed',
    requirement_value: 10,
    badge_color: '#14B8A6',
    predicate: (summary: LocalSummary) => summary.lessonsCompleted >= 10,
  },
] as const;

type LocalSummary = {
  totalSessions: number;
  bestWpm: number;
  bestAccuracy: number;
  lessonsCompleted: number;
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function buildId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function toSafeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toIsoDate(value?: string | null) {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function toDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function generateGuestNickname() {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `Guest${random}`;
}

function normalizeNickname(value: string | null | undefined) {
  if (!value || typeof value !== 'string') return null;
  const sanitized = value.trim().slice(0, 24);
  return sanitized.length >= 3 ? sanitized : null;
}

function buildDefaultLocalUserData(): LocalUserData {
  return {
    tests: [],
    streak: 0,
    settings: {},
    achievements: [],
    lesson_progress: {},
    leaderboard: [],
    nickname: null,
    lastUpdated: new Date().toISOString(),
  };
}

function normalizeTest(raw: unknown): LocalTypingTest | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === 'string' && item.id.trim() ? item.id : buildId();
  const date = toIsoDate(typeof item.date === 'string' ? item.date : undefined);
  const sourceValue = typeof item.source === 'string' ? item.source : 'typing-test';
  const source: LocalTypingSource =
    sourceValue === 'practice' || sourceValue === 'lesson' ? sourceValue : 'typing-test';

  return {
    id,
    wpm: Math.max(0, Math.round(toSafeNumber(item.wpm))),
    accuracy: Math.min(100, Math.max(0, Number(toSafeNumber(item.accuracy).toFixed(2)))),
    mistakes: Math.max(0, Math.round(toSafeNumber(item.mistakes))),
    duration: Math.max(1, Math.round(toSafeNumber(item.duration, 1))),
    date,
    source,
    lesson_id: typeof item.lesson_id === 'string' && item.lesson_id.trim() ? item.lesson_id : null,
  };
}

function normalizeLessonProgress(raw: unknown): Record<string, LocalLessonProgressState> {
  if (!raw || typeof raw !== 'object') return {};
  const input = raw as Record<string, unknown>;
  const output: Record<string, LocalLessonProgressState> = {};

  for (const [lessonId, value] of Object.entries(input)) {
    if (!lessonId || !value || typeof value !== 'object') continue;
    const state = value as Record<string, unknown>;
    output[lessonId] = {
      completed: Boolean(state.completed),
      best_wpm:
        state.best_wpm === null || typeof state.best_wpm === 'undefined'
          ? null
          : Math.max(0, Math.round(toSafeNumber(state.best_wpm))),
      best_accuracy:
        state.best_accuracy === null || typeof state.best_accuracy === 'undefined'
          ? null
          : Math.min(100, Math.max(0, Number(toSafeNumber(state.best_accuracy).toFixed(2)))),
      attempts: Math.max(0, Math.round(toSafeNumber(state.attempts))),
      last_practiced_at:
        typeof state.last_practiced_at === 'string' ? toIsoDate(state.last_practiced_at) : null,
    };
  }

  return output;
}

function normalizeLeaderboardEntry(raw: unknown): LocalLeaderboardEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const nickname = normalizeNickname(typeof item.nickname === 'string' ? item.nickname : null);
  if (!nickname) return null;

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id : buildId(),
    nickname,
    wpm: Math.max(0, Math.round(toSafeNumber(item.wpm))),
    accuracy: Math.min(100, Math.max(0, Number(toSafeNumber(item.accuracy).toFixed(2)))),
    duration: Math.max(1, Math.round(toSafeNumber(item.duration, 1))),
    date: toIsoDate(typeof item.date === 'string' ? item.date : undefined),
    user_id: typeof item.user_id === 'string' && item.user_id.trim() ? item.user_id : null,
  };
}

function normalizeLocalUserData(raw: unknown): LocalUserData {
  const base = buildDefaultLocalUserData();
  if (!raw || typeof raw !== 'object') return base;

  const input = raw as Record<string, unknown>;
  const tests = Array.isArray(input.tests)
    ? input.tests
        .map((item) => normalizeTest(item))
        .filter((item): item is LocalTypingTest => Boolean(item))
    : [];

  const dedupedTests = Array.from(new Map(tests.map((item) => [item.id, item])).values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_TEST_RECORDS);

  const leaderboard = Array.isArray(input.leaderboard)
    ? input.leaderboard
        .map((entry) => normalizeLeaderboardEntry(entry))
        .filter((entry): entry is LocalLeaderboardEntry => Boolean(entry))
        .sort((a, b) => {
          if (b.wpm !== a.wpm) return b.wpm - a.wpm;
          if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })
        .slice(0, MAX_LEADERBOARD_RECORDS)
    : [];

  const data: LocalUserData = {
    tests: dedupedTests,
    streak: Math.max(0, Math.round(toSafeNumber(input.streak))),
    settings: input.settings && typeof input.settings === 'object' ? (input.settings as Record<string, unknown>) : {},
    achievements: Array.isArray(input.achievements)
      ? input.achievements.filter((item): item is string => typeof item === 'string')
      : [],
    lesson_progress: normalizeLessonProgress(input.lesson_progress),
    leaderboard,
    nickname: normalizeNickname(typeof input.nickname === 'string' ? input.nickname : null),
    lastUpdated: toIsoDate(typeof input.lastUpdated === 'string' ? input.lastUpdated : undefined),
  };

  return recalculateDerivedFields(data);
}

function readLegacyGuestResults(): LocalTypingTest[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeTest({ ...(item as Record<string, unknown>), source: 'typing-test' }))
      .filter((item): item is LocalTypingTest => Boolean(item))
      .slice(0, MAX_TEST_RECORDS);
  } catch {
    return [];
  }
}

function writeLocalUserData(data: LocalUserData) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(LOCAL_USER_DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to write local Typely data:', error);
  }
}

function computeStreak(tests: LocalTypingTest[]) {
  if (tests.length === 0) return 0;

  const uniqueDates = Array.from(new Set(tests.map((test) => toDateKey(test.date))))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const first = new Date(uniqueDates[0]);
  if (first.getTime() !== today.getTime() && first.getTime() !== yesterday.getTime()) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date(first);
  for (const date of uniqueDates) {
    const current = new Date(date);
    if (current.getTime() === cursor.getTime()) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function summarize(data: LocalUserData): LocalSummary {
  const bestWpm = data.tests.reduce((max, test) => Math.max(max, test.wpm), 0);
  const bestAccuracy = data.tests.reduce((max, test) => Math.max(max, test.accuracy), 0);
  const lessonsCompleted = Object.values(data.lesson_progress).filter((item) => item.completed).length;
  return {
    totalSessions: data.tests.length,
    bestWpm,
    bestAccuracy,
    lessonsCompleted,
  };
}

function recalculateAchievements(data: LocalUserData) {
  const info = summarize(data);
  const unlocked = LOCAL_ACHIEVEMENTS.filter((item) => item.predicate(info)).map((item) => item.id);
  return unlocked;
}

function recalculateDerivedFields(data: LocalUserData): LocalUserData {
  const next: LocalUserData = {
    ...data,
    tests: [...data.tests]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_TEST_RECORDS),
    leaderboard: [...data.leaderboard]
      .sort((a, b) => {
        if (b.wpm !== a.wpm) return b.wpm - a.wpm;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, MAX_LEADERBOARD_RECORDS),
    lastUpdated: new Date().toISOString(),
  };

  next.streak = computeStreak(next.tests);
  next.achievements = recalculateAchievements(next);
  return next;
}

function updateLocalUserData(updater: (current: LocalUserData) => LocalUserData) {
  const current = readLocalUserData();
  const updated = recalculateDerivedFields(updater(current));
  writeLocalUserData(updated);
  return updated;
}

export function readLocalUserData(): LocalUserData {
  if (!canUseStorage()) return buildDefaultLocalUserData();

  const raw = window.localStorage.getItem(LOCAL_USER_DATA_STORAGE_KEY);
  let data = buildDefaultLocalUserData();

  if (raw) {
    try {
      data = normalizeLocalUserData(JSON.parse(raw));
    } catch (error) {
      console.error('Failed to parse local Typely data:', error);
      window.localStorage.removeItem(LOCAL_USER_DATA_STORAGE_KEY);
    }
  }

  const legacy = readLegacyGuestResults();
  if (legacy.length > 0) {
    const merged = [...legacy, ...data.tests]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_TEST_RECORDS);
    data = recalculateDerivedFields({ ...data, tests: merged });
    writeLocalUserData(data);
    window.localStorage.removeItem(GUEST_PROGRESS_STORAGE_KEY);
  }

  return data;
}

export function clearLocalUserData() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(LOCAL_USER_DATA_STORAGE_KEY);
  window.localStorage.removeItem(GUEST_PROGRESS_STORAGE_KEY);
}

export function clearGuestTypingResults() {
  clearLocalUserData();
}

export function hasGuestTypingResults() {
  return readLocalUserData().tests.length > 0;
}

export function readGuestTypingResults(): GuestTypingResult[] {
  return readLocalUserData().tests.map((test) => ({
    id: test.id,
    wpm: test.wpm,
    accuracy: test.accuracy,
    mistakes: test.mistakes,
    duration: test.duration,
    date: test.date,
  }));
}

export function saveGuestTypingResult(input: GuestTypingResultInput): GuestTypingResult[] {
  const date = toIsoDate(input.date);
  const entry: LocalTypingTest = {
    id: buildId(),
    wpm: Math.max(0, Math.round(toSafeNumber(input.wpm))),
    accuracy: Math.min(100, Math.max(0, Number(toSafeNumber(input.accuracy).toFixed(2)))),
    mistakes: Math.max(0, Math.round(toSafeNumber(input.mistakes))),
    duration: Math.max(1, Math.round(toSafeNumber(input.duration, 1))),
    date,
    source: input.source ?? 'typing-test',
    lesson_id: input.lesson_id ?? null,
  };

  const updated = updateLocalUserData((current) => ({
    ...current,
    tests: [entry, ...current.tests].slice(0, MAX_TEST_RECORDS),
  }));

  return updated.tests.map((test) => ({
    id: test.id,
    wpm: test.wpm,
    accuracy: test.accuracy,
    mistakes: test.mistakes,
    duration: test.duration,
    date: test.date,
  }));
}

export function upsertLocalLessonProgress(args: {
  lessonId: string;
  completed: boolean;
  wpm: number;
  accuracy: number;
}) {
  updateLocalUserData((current) => {
    const prev = current.lesson_progress[args.lessonId];
    const next: LocalLessonProgressState = {
      completed: args.completed || Boolean(prev?.completed),
      best_wpm:
        prev?.best_wpm === null || typeof prev?.best_wpm === 'undefined'
          ? args.wpm
          : Math.max(prev.best_wpm, args.wpm),
      best_accuracy:
        prev?.best_accuracy === null || typeof prev?.best_accuracy === 'undefined'
          ? args.accuracy
          : Math.max(prev.best_accuracy, args.accuracy),
      attempts: (prev?.attempts || 0) + 1,
      last_practiced_at: new Date().toISOString(),
    };

    return {
      ...current,
      lesson_progress: {
        ...current.lesson_progress,
        [args.lessonId]: next,
      },
    };
  });
}

export function getLocalLessonProgressMap(): Record<string, LessonProgress> {
  const data = readLocalUserData();
  const output: Record<string, LessonProgress> = {};

  for (const [lessonId, value] of Object.entries(data.lesson_progress)) {
    output[lessonId] = {
      id: `guest-${lessonId}`,
      user_id: 'guest',
      lesson_id: lessonId,
      completed: value.completed,
      best_wpm: value.best_wpm,
      best_accuracy: value.best_accuracy,
      attempts: value.attempts,
      last_practiced_at: value.last_practiced_at,
      created_at: value.last_practiced_at || new Date().toISOString(),
      updated_at: value.last_practiced_at || new Date().toISOString(),
    };
  }

  return output;
}

export function attachLocalProgressToLessons(lessons: Lesson[]): LessonWithProgress[] {
  const progressMap = getLocalLessonProgressMap();
  return lessons.map((lesson) => ({
    ...lesson,
    progress: progressMap[lesson.id],
  }));
}

function estimateTotalKeystrokes(test: LocalTypingTest) {
  const cpm = test.wpm * 5;
  return Math.max(1, Math.round((cpm * test.duration) / 60));
}

export function getLocalOverallStats(totalLessons = 20): OverallStats {
  const data = readLocalUserData();
  const tests = data.tests;

  if (tests.length === 0) {
    return {
      total_sessions: 0,
      total_keystrokes: 0,
      total_duration_seconds: 0,
      average_wpm: 0,
      average_accuracy: 0,
      best_wpm: 0,
      best_accuracy: 0,
      lessons_completed: Object.values(data.lesson_progress).filter((item) => item.completed).length,
      total_lessons: totalLessons,
    };
  }

  const totalSessions = tests.length;
  const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);
  const totalKeystrokes = tests.reduce((sum, test) => sum + estimateTotalKeystrokes(test), 0);
  const averageWpm = Math.round(tests.reduce((sum, test) => sum + test.wpm, 0) / totalSessions);
  const averageAccuracy = Number(
    (
      tests.reduce((sum, test) => sum + test.accuracy, 0) / totalSessions
    ).toFixed(2)
  );
  const bestWpm = tests.reduce((max, test) => Math.max(max, test.wpm), 0);
  const bestAccuracy = tests.reduce((max, test) => Math.max(max, test.accuracy), 0);
  const lessonsCompleted = Object.values(data.lesson_progress).filter((item) => item.completed).length;

  return {
    total_sessions: totalSessions,
    total_keystrokes: totalKeystrokes,
    total_duration_seconds: totalDuration,
    average_wpm: averageWpm,
    average_accuracy: averageAccuracy,
    best_wpm: bestWpm,
    best_accuracy: bestAccuracy,
    lessons_completed: lessonsCompleted,
    total_lessons: totalLessons,
  };
}

export function getLocalDailyStats(days = 30): DailyStats[] {
  const data = readLocalUserData();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const grouped = new Map<string, { wpmTotal: number; accuracyTotal: number; count: number }>();

  for (const test of data.tests) {
    const date = new Date(test.date);
    if (Number.isNaN(date.getTime()) || date < start) continue;
    const key = date.toISOString().slice(0, 10);
    const current = grouped.get(key) || { wpmTotal: 0, accuracyTotal: 0, count: 0 };
    current.wpmTotal += test.wpm;
    current.accuracyTotal += test.accuracy;
    current.count += 1;
    grouped.set(key, current);
  }

  return Array.from(grouped.entries())
    .map(([date, value]) => ({
      date,
      wpm: Math.round(value.wpmTotal / value.count),
      accuracy: Number((value.accuracyTotal / value.count).toFixed(2)),
      sessions: value.count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getLocalRecentSessions(days = 30, limit = 50): TypingSession[] {
  const data = readLocalUserData();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return data.tests
    .filter((test) => new Date(test.date) >= start)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map((test) => {
      const total = estimateTotalKeystrokes(test);
      const correct = Math.round((total * test.accuracy) / 100);
      const incorrect = Math.max(0, total - correct);
      return {
        id: test.id,
        user_id: 'guest',
        lesson_id: test.lesson_id ?? null,
        wpm: test.wpm,
        cpm: test.wpm * 5,
        accuracy: test.accuracy,
        total_keystrokes: total,
        correct_keystrokes: correct,
        incorrect_keystrokes: incorrect,
        backspace_count: 0,
        error_keys: null,
        duration_seconds: test.duration,
        created_at: test.date,
      };
    });
}

export function getLocalAchievementStatuses(): AchievementWithStatus[] {
  const data = readLocalUserData();
  const summary = summarize(data);

  return LOCAL_ACHIEVEMENTS.map((achievement) => {
    const earned = achievement.predicate(summary);
    const earnedAt = earned ? data.tests[0]?.date : undefined;
    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      requirement_type: achievement.requirement_type,
      requirement_value: achievement.requirement_value,
      badge_color: achievement.badge_color,
      created_at: '1970-01-01T00:00:00.000Z',
      earned,
      earned_at: earnedAt,
    };
  });
}

export function getGuestNickname() {
  const data = readLocalUserData();
  if (data.nickname) return data.nickname;

  const generated = generateGuestNickname();
  updateLocalUserData((current) => ({
    ...current,
    nickname: generated,
  }));
  return generated;
}

export function setGuestNickname(nickname: string) {
  const normalized = normalizeNickname(nickname);
  if (!normalized) return null;

  const updated = updateLocalUserData((current) => ({
    ...current,
    nickname: normalized,
  }));

  return updated.nickname;
}

export function getLocalLeaderboardEntries(limit = 100): LocalLeaderboardEntry[] {
  return readLocalUserData().leaderboard.slice(0, limit);
}

export function addLocalLeaderboardEntry(input: LocalLeaderboardInput) {
  const nickname = normalizeNickname(input.nickname) ?? getGuestNickname();
  const entry: LocalLeaderboardEntry = {
    id: buildId(),
    nickname,
    wpm: Math.max(0, Math.round(toSafeNumber(input.wpm))),
    accuracy: Math.min(100, Math.max(0, Number(toSafeNumber(input.accuracy).toFixed(2)))),
    duration: Math.max(1, Math.round(toSafeNumber(input.duration, 1))),
    date: toIsoDate(input.date),
    user_id: input.user_id ?? null,
  };

  return updateLocalUserData((current) => ({
    ...current,
    leaderboard: [entry, ...current.leaderboard].slice(0, MAX_LEADERBOARD_RECORDS),
  })).leaderboard;
}

export async function mergeGuestTypingResults(
  userId: string,
  options?: { clearLocalOnSuccess?: boolean }
): Promise<MergeGuestProgressResult> {
  const clearLocalOnSuccess = options?.clearLocalOnSuccess ?? true;
  const local = readLocalUserData();
  if (local.tests.length === 0) {
    return { mergedCount: 0, error: null };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const sessionUserId = sessionData.session?.user?.id;

  if (sessionError || !sessionUserId || sessionUserId !== userId) {
    return { mergedCount: 0, error: 'Session validation failed. Please sign in again.' };
  }

  const rows = local.tests.map((result) => ({
    user_id: userId,
    client_result_id: result.id,
    wpm: result.wpm,
    accuracy: result.accuracy,
    mistakes: result.mistakes,
    duration: result.duration,
    created_at: result.date,
  }));

  const { error } = await supabase
    .from('typing_results')
    .upsert(rows, { onConflict: 'user_id,client_result_id' });

  if (error) {
    console.error('Failed to merge guest typing results:', error);
    return { mergedCount: 0, error: error.message || 'Unable to sync guest progress right now.' };
  }

  const localProgressRows = Object.entries(local.lesson_progress).map(([lessonId, progress]) => ({
    user_id: userId,
    lesson_id: lessonId,
    completed: progress.completed,
    best_wpm: progress.best_wpm ?? 0,
    best_accuracy: progress.best_accuracy ?? 0,
    attempts: progress.attempts,
    last_practiced_at: progress.last_practiced_at ?? new Date().toISOString(),
  }));

  if (localProgressRows.length > 0) {
    const { error: progressError } = await supabase
      .from('lesson_progress')
      .upsert(localProgressRows, { onConflict: 'user_id,lesson_id' });

    if (progressError) {
      console.error('Failed to merge guest lesson progress:', progressError);
      return {
        mergedCount: rows.length,
        error: progressError.message || 'Progress sync failed. Your local data is still available.',
      };
    }
  }

  if (clearLocalOnSuccess) {
    clearLocalUserData();
  }

  return { mergedCount: rows.length, error: null };
}
