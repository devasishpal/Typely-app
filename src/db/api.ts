import { isSupabaseConfigured, supabase } from './supabase';
import { buildBlogPath, normalizeBlogSlug } from '@/lib/blogPosts';
import { isUuidLike, normalizeLessonSlug } from '@/lib/lessons';
import type {
  Profile,
  Lesson,
  LessonProgress,
  LessonWithProgress,
  TypingSession,
  TypingSessionData,
  TypingTest,
  TypingTestData,
  Achievement,
  AchievementWithStatus,
  UserAchievement,
  Statistics,
  DailyStats,
  OverallStats,
  TestParagraph,
  PracticeTest,
  AdminNotification,
  AccountDeletionRequest,
  DeletionRequestStatus,
  LeaderboardScore,
  LeaderboardPeriod,
  LeaderboardPersonalStats,
  LeaderboardRankingRow,
  FooterSupportSection,
  FooterFaqItem,
  FooterAboutSection,
  FooterManagedBlogPost,
  FooterCareer,
  FooterPrivacyPolicySection,
  FooterTermsOfServiceSection,
  FooterContentVersion,
  FooterContentTab,
  SiteContactInfo,
  FooterGenericStatus,
  FooterCareerStatus,
} from '@/types';

type FooterVersionAction = FooterContentVersion['action'];
type FooterManagedTable =
  | 'footer_support_sections'
  | 'footer_faq_items'
  | 'footer_about_sections'
  | 'footer_blog_posts'
  | 'footer_careers'
  | 'footer_privacy_policy_sections'
  | 'footer_terms_of_service_sections';

const FOOTER_VERSION_TABLE = 'footer_content_versions';

function isMissingRelationError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ((error as { code?: unknown }).code === '42P01' ||
      (error as { code?: unknown }).code === 'PGRST205')
  );
}

async function logFooterVersion(
  tabKey: FooterContentTab,
  itemId: string,
  action: FooterVersionAction,
  snapshot: Record<string, unknown>
) {
  const { error } = await (supabase.from(FOOTER_VERSION_TABLE as any))
    .insert({
      tab_key: tabKey,
      item_id: itemId,
      action,
      snapshot,
    });

  if (error && !isMissingRelationError(error)) {
    console.error('Error creating footer content version snapshot:', error);
  }
}

function cleanNullableText(value: string | null | undefined) {
  const next = (value ?? '').trim();
  return next.length > 0 ? next : null;
}

async function listFooterRows<T extends { id: string }>(
  table: FooterManagedTable,
  options?: {
    includeDeleted?: boolean;
    primaryOrderBy?: string;
    secondaryOrderBy?: string;
  }
): Promise<T[]> {
  let query = (supabase.from(table as any) as any)
    .select('*')
    .order(options?.primaryOrderBy ?? 'sort_order', { ascending: true })
    .order(options?.secondaryOrderBy ?? 'updated_at', { ascending: true });

  if (!options?.includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? (data as T[]) : [];
}

async function insertFooterRow<T>(
  table: FooterManagedTable,
  payload: Record<string, unknown>
): Promise<T> {
  const { data, error } = await (supabase.from(table as any) as any)
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('No row returned after insert.');
  return data as T;
}

async function updateFooterRow<T>(
  table: FooterManagedTable,
  id: string,
  payload: Record<string, unknown>
): Promise<T> {
  const { data, error } = await (supabase.from(table as any) as any)
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('No row returned after update.');
  return data as T;
}

async function deleteFooterRow(table: FooterManagedTable, id: string) {
  const { error } = await (supabase.from(table as any) as any)
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function reorderFooterRows(table: FooterManagedTable, ids: string[]) {
  const now = new Date().toISOString();
  for (const [index, id] of ids.entries()) {
    const { error } = await (supabase.from(table as any) as any)
      .update({
        sort_order: index,
        updated_at: now,
      })
      .eq('id', id);

    if (error) throw error;
  }
}

async function assertUniqueBlogSlug(slug: string, excludeId?: string) {
  const normalized = normalizeBlogSlug(slug);
  if (!normalized) {
    throw new Error('Blog slug is required.');
  }

  let query = (supabase.from('footer_blog_posts' as any) as any)
    .select('id')
    .eq('slug', normalized)
    .eq('is_deleted', false)
    .limit(1);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error && !isMissingRelationError(error)) throw error;
  if (data) {
    throw new Error('A blog post with this slug already exists.');
  }

  return normalized;
}

// Profile API
export const profileApi = {
  getProfile: async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  updateProfile: async (
    userId: string,
    updates: Partial<Profile>
  ): Promise<{ data: Profile | null; error: Error | null }> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
    return { data: data ?? null, error: null };
  },

  getAllUsers: async (): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  updateUserRole: async (userId: string, role: 'user' | 'admin'): Promise<boolean> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }
    return true;
  },
};

type LessonWriteInput = Omit<Lesson, 'id' | 'created_at' | 'updated_at'> & { slug?: string };

function normalizeLessonWriteInput(input: LessonWriteInput): Omit<Lesson, 'id' | 'created_at' | 'updated_at'> {
  const normalizedSlug = normalizeLessonSlug(input.slug ?? input.title);
  return {
    ...input,
    slug: normalizedSlug,
  };
}

function normalizeLessonUpdateInput(input: Partial<Lesson>): Partial<Lesson> {
  const updates = { ...input };
  if (typeof input.slug === 'string' || typeof input.title === 'string') {
    const slugSource =
      typeof input.slug === 'string' && input.slug.trim().length > 0
        ? input.slug
        : input.title ?? '';
    const normalizedSlug = normalizeLessonSlug(slugSource);
    if (normalizedSlug) {
      updates.slug = normalizedSlug;
    }
  }
  return updates;
}

// Lesson API
export const lessonApi = {
  getAllLessons: async (): Promise<Lesson[]> => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  getLessonsWithProgress: async (userId: string): Promise<LessonWithProgress[]> => {
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      return [];
    }

    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId);

    if (progressError) {
      console.error('Error fetching lesson progress:', progressError);
      return Array.isArray(lessons) ? lessons : [];
    }

    const progressByLesson = new Map(
      (Array.isArray(progress) ? progress : []).map((p: any) => [p.lesson_id, p])
    );

    return (Array.isArray(lessons) ? lessons : []).map((lesson: any) => ({
      ...lesson,
      progress: progressByLesson.get(lesson.id),
    }));
  },

  getLessonById: async (lessonId: string): Promise<Lesson | null> => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching lesson by id:', error);
      return null;
    }

    return data;
  },

  getLessonBySlug: async (slug: string): Promise<Lesson | null> => {
    const normalizedSlug = normalizeLessonSlug(slug);
    if (!normalizedSlug) return null;

    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching lesson by slug:', error);
      return null;
    }

    return data;
  },

  getLessonByIdentifier: async (identifier: string): Promise<Lesson | null> => {
    const value = identifier.trim();
    if (!value) return null;

    if (isUuidLike(value)) {
      return lessonApi.getLessonById(value);
    }

    return lessonApi.getLessonBySlug(value);
  },

  getLesson: async (identifier: string): Promise<Lesson | null> => {
    return lessonApi.getLessonByIdentifier(identifier);
  },

  isLessonSlugAvailable: async (
    slug: string,
    excludeLessonId?: string
  ): Promise<{ available: boolean; normalizedSlug: string }> => {
    const normalizedSlug = normalizeLessonSlug(slug);
    if (!normalizedSlug) {
      return { available: false, normalizedSlug: '' };
    }

    let query = supabase.from('lessons').select('id').eq('slug', normalizedSlug).limit(1);
    if (excludeLessonId) {
      query = query.neq('id', excludeLessonId);
    }

    const { data, error } = await query.maybeSingle();
    if (error && (error as { code?: string }).code !== 'PGRST116') {
      console.error('Error validating lesson slug uniqueness:', error);
      throw error;
    }

    return {
      available: !data,
      normalizedSlug,
    };
  },

  createLesson: async (lesson: LessonWriteInput): Promise<Lesson | null> => {
    const payload = normalizeLessonWriteInput(lesson);
    const { data, error } = await supabase
      .from('lessons')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
    return data;
  },

  updateLesson: async (lessonId: string, updates: Partial<Lesson>): Promise<Lesson | null> => {
    const payload = normalizeLessonUpdateInput(updates);
    const { data, error } = await supabase
      .from('lessons')
      .update(payload)
      .eq('id', lessonId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
    return data;
  },

  deleteLesson: async (lessonId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      console.error('Error deleting lesson:', error);
      return false;
    }
    return true;
  },
};

// Lesson Progress API
export const lessonProgressApi = {
  getProgress: async (userId: string, lessonId: string): Promise<LessonProgress | null> => {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching lesson progress:', error);
      return null;
    }
    return data;
  },

  getUserProgress: async (userId: string): Promise<LessonProgress[]> => {
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_practiced_at', { ascending: false });

    if (error) {
      console.error('Error fetching user progress:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  upsertProgress: async (progress: Omit<LessonProgress, 'id' | 'created_at' | 'updated_at'>): Promise<LessonProgress | null> => {
    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(progress, { onConflict: 'user_id,lesson_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error upserting lesson progress:', error);
      return null;
    }
    return data;
  },
};

// Typing Session API
export const typingSessionApi = {
  createSession: async (userId: string, sessionData: TypingSessionData): Promise<TypingSession | null> => {
    const { data, error } = await supabase
      .from('typing_sessions')
      .insert({ ...sessionData, user_id: userId })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating typing session:', error);
      return null;
    }
    return data;
  },

  getUserSessions: async (userId: string, limit = 50): Promise<TypingSession[]> => {
    const { data, error } = await supabase
      .from('typing_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  getRecentSessions: async (userId: string, days = 7): Promise<TypingSession[]> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('typing_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent sessions:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },
};

// Typing Test API
export const typingTestApi = {
  createTest: async (userId: string, testData: TypingTestData): Promise<TypingTest | null> => {
    const { data, error } = await supabase
      .from('typing_tests')
      .insert({ ...testData, user_id: userId })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating typing test:', error);
      return null;
    }
    return data;
  },

  getUserTests: async (userId: string, limit = 50): Promise<TypingTest[]> => {
    const { data, error } = await supabase
      .from('typing_tests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user tests:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },
};

const LEADERBOARD_CACHE_TTL_MS = 60_000;
const LEADERBOARD_ROW_CACHE = new Map<
  string,
  { expiresAt: number; data: LeaderboardRankingRow[] }
>();
const LEADERBOARD_PERSONAL_CACHE = new Map<
  string,
  { expiresAt: number; data: LeaderboardPersonalStats | null }
>();

const toSafeLeaderboardLimit = (limit: number) => Math.max(1, Math.min(Math.round(limit), 100));

const normalizeTestMode = (input?: string): 'practice' | 'timed' | 'custom' => {
  const value = input?.trim().toLowerCase();
  if (value === 'practice') return 'practice';
  if (value === 'custom') return 'custom';
  return 'timed';
};

const isSuspiciousLeaderboardScore = (input: {
  wpm: number;
  accuracy: number;
  mistakes: number;
  duration: number;
}) => {
  if (input.wpm > 300) return true;
  if (input.accuracy < 85) return true;
  if (input.duration < 15) return true;
  if (input.mistakes < 0) return true;
  if (input.mistakes > input.duration * 12) return true;
  if (input.wpm >= 220 && input.accuracy >= 99.5 && input.mistakes === 0) return true;
  if (input.wpm >= 260 && input.accuracy >= 98) return true;
  return false;
};

const normalizeLeaderboardRow = (row: any): LeaderboardRankingRow => ({
  rank: Number(row?.rank ?? 0),
  user_id: String(row?.user_id ?? ''),
  username: String(row?.username ?? 'Member'),
  net_wpm: Number(row?.net_wpm ?? 0),
  wpm: Number(row?.wpm ?? 0),
  accuracy: Number(row?.accuracy ?? 0),
  mistakes: Number(row?.mistakes ?? 0),
  test_mode: normalizeTestMode(String(row?.test_mode ?? 'timed')),
  created_at: String(row?.created_at ?? new Date(0).toISOString()),
});

const normalizeLeaderboardPersonalStats = (row: any): LeaderboardPersonalStats => ({
  global_rank: Number(row?.global_rank ?? 0),
  best_net_wpm: Number(row?.best_net_wpm ?? 0),
  accuracy: Number(row?.accuracy ?? 0),
  percentile: Number(row?.percentile ?? 0),
});

// Leaderboard API
export const leaderboardApi = {
  clearCache: () => {
    LEADERBOARD_ROW_CACHE.clear();
    LEADERBOARD_PERSONAL_CACHE.clear();
  },

  getRankings: async (input: {
    userId?: string | null;
    period?: LeaderboardPeriod;
    limit?: number;
    forceRefresh?: boolean;
  }): Promise<LeaderboardRankingRow[]> => {
    const userId = input.userId?.trim();
    if (!userId) return [];

    const period = input.period ?? 'global';
    const limit = toSafeLeaderboardLimit(input.limit ?? 100);
    const key = `${userId}:${period}:${limit}`;
    const now = Date.now();

    if (!input.forceRefresh) {
      const cached = LEADERBOARD_ROW_CACHE.get(key);
      if (cached && cached.expiresAt > now) {
        return cached.data;
      }
    }

    const { data, error } = await supabase.rpc('get_leaderboard_rankings', {
      p_period: period,
      p_limit: limit,
    });

    if (error) {
      console.error('Error fetching leaderboard rankings:', error);
      return [];
    }

    const rows = Array.isArray(data) ? data.map(normalizeLeaderboardRow) : [];
    LEADERBOARD_ROW_CACHE.set(key, { data: rows, expiresAt: now + LEADERBOARD_CACHE_TTL_MS });
    return rows;
  },

  getPersonalStats: async (input: {
    userId?: string | null;
    period?: LeaderboardPeriod;
    forceRefresh?: boolean;
  }): Promise<LeaderboardPersonalStats | null> => {
    const userId = input.userId?.trim();
    if (!userId) return null;

    const period = input.period ?? 'global';
    const key = `${userId}:${period}`;
    const now = Date.now();

    if (!input.forceRefresh) {
      const cached = LEADERBOARD_PERSONAL_CACHE.get(key);
      if (cached && cached.expiresAt > now) {
        return cached.data;
      }
    }

    const { data, error } = await supabase.rpc('get_leaderboard_personal_stats', {
      p_period: period,
    });

    if (error) {
      console.error('Error fetching personal leaderboard stats:', error);
      return null;
    }

    const first = Array.isArray(data) ? data[0] : null;
    const stats = first ? normalizeLeaderboardPersonalStats(first) : null;
    LEADERBOARD_PERSONAL_CACHE.set(key, { data: stats, expiresAt: now + LEADERBOARD_CACHE_TTL_MS });
    return stats;
  },

  submitScore: async (input: {
    user_id?: string | null;
    nickname: string;
    wpm: number;
    accuracy: number;
    mistakes?: number;
    duration: number;
    test_mode?: 'practice' | 'timed' | 'custom';
    source?: string;
  }): Promise<LeaderboardScore | null> => {
    const userId = input.user_id?.trim();
    if (!userId) return null;

    const normalizedNickname = input.nickname.trim().slice(0, 24);
    const accuracy = Math.min(100, Math.max(0, Number(input.accuracy.toFixed(2))));
    const wpm = Math.max(0, Math.round(input.wpm));
    const mistakes = Math.max(0, Math.round(input.mistakes ?? 0));
    const duration = Math.max(1, Math.round(input.duration));
    const testMode = normalizeTestMode(input.test_mode ?? input.source);

    if (accuracy < 85 || wpm > 300) {
      return null;
    }

    if (isSuspiciousLeaderboardScore({ wpm, accuracy, mistakes, duration })) {
      return null;
    }

    const payload = {
      user_id: userId,
      nickname: normalizedNickname.length >= 3 ? normalizedNickname : 'Typist',
      wpm,
      accuracy,
      mistakes,
      duration,
      test_mode: testMode,
      source: input.source ?? 'typing-test',
    };

    const { data, error } = await supabase
      .from('leaderboard_scores')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error submitting leaderboard score:', error);
      return null;
    }

    LEADERBOARD_ROW_CACHE.clear();
    LEADERBOARD_PERSONAL_CACHE.clear();
    return (data as LeaderboardScore | null) ?? null;
  },
};

// Achievement API
export const achievementApi = {
  getAllAchievements: async (): Promise<Achievement[]> => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  getUserAchievements: async (userId: string): Promise<AchievementWithStatus[]> => {
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError);
      return [];
    }

    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError);
      return [];
    }

    const earnedMap = new Map(
      (Array.isArray(userAchievements) ? userAchievements : []).map(ua => [ua.achievement_id, ua.earned_at])
    );

    return (Array.isArray(achievements) ? achievements : []).map(achievement => ({
      ...achievement,
      earned: earnedMap.has(achievement.id),
      earned_at: earnedMap.get(achievement.id),
    }));
  },

  earnAchievement: async (userId: string, achievementId: string): Promise<UserAchievement | null> => {
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({ user_id: userId, achievement_id: achievementId })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error earning achievement:', error);
      return null;
    }
    return data;
  },
};

// Statistics API
export const statisticsApi = {
  getDailyStats: async (userId: string, days = 30): Promise<DailyStats[]> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('statistics')
      .select('date, average_wpm, average_accuracy, total_sessions')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching daily stats:', error);
      return [];
    }

    return (Array.isArray(data) ? data : []).map(stat => ({
      date: stat.date,
      wpm: stat.average_wpm || 0,
      accuracy: stat.average_accuracy || 0,
      sessions: stat.total_sessions,
    }));
  },

  getOverallStats: async (userId: string): Promise<OverallStats | null> => {
    // Get aggregated statistics
    const { data: stats, error: statsError } = await supabase
      .from('statistics')
      .select('*')
      .eq('user_id', userId);

    if (statsError) {
      console.error('Error fetching statistics:', statsError);
      return null;
    }

    // Get best performance from sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('typing_sessions')
      .select('wpm, accuracy')
      .eq('user_id', userId)
      .order('wpm', { ascending: false })
      .limit(1);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // Get lessons completed
    const { data: progress, error: progressError } = await supabase
      .from('lesson_progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('completed', true);

    if (progressError) {
      console.error('Error fetching progress:', progressError);
    }

    // Get total lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true });

    if (lessonsError) {
      console.error('Error fetching lessons count:', lessonsError);
    }

    const statsArray = Array.isArray(stats) ? stats : [];
    const totalSessions = statsArray.reduce((sum, s) => sum + s.total_sessions, 0);
    const totalKeystrokes = statsArray.reduce((sum, s) => sum + s.total_keystrokes, 0);
    const totalDuration = statsArray.reduce((sum, s) => sum + s.total_duration_seconds, 0);
    
    const avgWpm = statsArray.length > 0
      ? statsArray.reduce((sum, s) => sum + (s.average_wpm || 0), 0) / statsArray.length
      : 0;
    
    const avgAccuracy = statsArray.length > 0
      ? statsArray.reduce((sum, s) => sum + (s.average_accuracy || 0), 0) / statsArray.length
      : 0;

    const bestWpm = Array.isArray(sessions) && sessions.length > 0 ? sessions[0].wpm : 0;
    const bestAccuracy = Array.isArray(sessions) && sessions.length > 0 ? sessions[0].accuracy : 0;

    return {
      total_sessions: totalSessions,
      total_keystrokes: totalKeystrokes,
      total_duration_seconds: totalDuration,
      average_wpm: Math.round(avgWpm),
      average_accuracy: Math.round(avgAccuracy * 100) / 100,
      best_wpm: bestWpm,
      best_accuracy: bestAccuracy,
      lessons_completed: Array.isArray(progress) ? progress.length : 0,
      total_lessons: 20, // We have 20 lessons
    };
  },

  upsertDailyStats: async (userId: string, date: string, stats: Partial<Statistics>): Promise<Statistics | null> => {
    const { data, error } = await supabase
      .from('statistics')
      .upsert(
        { user_id: userId, date, ...stats },
        { onConflict: 'user_id,date' }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error upserting daily stats:', error);
      return null;
    }
    return data;
  },
};

// Admin API
export const adminApi = {
  extractFunctionError: async (invokeError: unknown): Promise<string | null> => {
    if (!(invokeError instanceof Error)) return null;
    const context = (invokeError as Error & { context?: unknown }).context;
    if (!(context instanceof Response)) return invokeError.message || null;

    try {
      const payload = await context.clone().json();
      if (payload && typeof payload === 'object' && 'error' in payload) {
        const value = (payload as { error?: unknown }).error;
        if (typeof value === 'string' && value.trim()) return value;
      }
    } catch {
      // Ignore JSON parse failure and fall back to status text / generic message.
    }

    return context.statusText || invokeError.message || null;
  },

  getAllUserStats: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        email,
        created_at,
        lesson_progress!lesson_progress_user_id_fkey(completed),
        typing_sessions!typing_sessions_user_id_fkey(wpm, accuracy, created_at)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user stats:', error);
      return [];
    }

    return Array.isArray(data) ? data.map(user => {
      const sessions = Array.isArray(user.typing_sessions) ? user.typing_sessions : [];
      const progress = Array.isArray(user.lesson_progress) ? user.lesson_progress : [];
      
      return {
        ...user,
        total_sessions: sessions.length,
        lessons_completed: progress.filter((p: any) => p.completed).length,
        average_wpm: sessions.length > 0
          ? Math.round(sessions.reduce((sum: number, s: any) => sum + s.wpm, 0) / sessions.length)
          : 0,
        average_accuracy: sessions.length > 0
          ? Math.round((sessions.reduce((sum: number, s: any) => sum + s.accuracy, 0) / sessions.length) * 100) / 100
          : 0,
      };
    }) : [];
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  updateUserRole: async (userId: string, role: 'user' | 'admin') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      );
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        throw new Error('Session expired. Please sign in again.');
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
      }

      const callDeleteFunction = async (token: string) => {
        const response = await fetch(`${supabaseUrl}/functions/v1/admin-delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        });

        const responseText = await response.text();
        let payload: any = null;
        try {
          payload = responseText ? JSON.parse(responseText) : null;
        } catch {
          payload = null;
        }

        return { response, payload };
      };

      let { response, payload } = await callDeleteFunction(accessToken);

      const firstMessage = (payload?.error || payload?.message || '').toString().toLowerCase();
      if (response.status === 401 && firstMessage.includes('invalid jwt')) {
        const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
        const refreshedToken = refreshedData.session?.access_token;
        if (refreshError || !refreshedToken) {
          throw new Error('Unauthorized: Invalid JWT. Please sign out and sign in again.');
        }
        ({ response, payload } = await callDeleteFunction(refreshedToken));
      }

      if (!response.ok) {
        const msg =
          payload?.error ||
          payload?.message ||
          `admin-delete-user failed with status ${response.status}.`;

        if (response.status === 401) {
          throw new Error(
            msg.toLowerCase().includes('invalid jwt')
              ? 'Unauthorized: Invalid JWT. Please sign out and sign in again.'
              : `Unauthorized: ${msg}`
          );
        }
        if (response.status === 404) {
          throw new Error('admin-delete-user function is not deployed.');
        }
        throw new Error(msg);
      }

      if (!payload || !payload.success) {
        const msg = payload?.error || 'Failed to delete user';
        throw new Error(msg);
      }

      return (payload?.message as string | undefined) || 'User has been deleted successfully.';
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  getDeletionRequests: async () => {
    const { data, error } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching deletion requests:', error);
      throw error;
    }

    return (Array.isArray(data) ? data : []) as AccountDeletionRequest[];
  },

  clearAllDeletionRequests: async () => {
    const { error } = await supabase
      .from('account_deletion_requests')
      .delete()
      .not('id', 'is', null);

    if (error) {
      console.error('Error clearing deletion requests:', error);
      throw error;
    }
  },

  updateDeletionRequestStatus: async (
    requestId: string,
    status: DeletionRequestStatus,
    errorMessage?: string | null
  ) => {
    const updates: {
      status: DeletionRequestStatus;
      updated_at: string;
      processed_at?: string | null;
      error_message?: string | null;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updates.processed_at = new Date().toISOString();
    } else {
      updates.processed_at = null;
    }

    if (typeof errorMessage !== 'undefined') {
      updates.error_message = errorMessage;
    } else if (status !== 'failed') {
      updates.error_message = null;
    }

    const { error } = await supabase
      .from('account_deletion_requests')
      .update(updates)
      .eq('id', requestId);

    if (error) {
      console.error('Error updating deletion request status:', error);
      throw error;
    }
  },

  getAllLessons: async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  createLesson: async (lesson: {
    title: string;
    description: string;
    category: string;
    difficulty: string;
    slug?: string;
    content: string;
    target_keys: string[];
    order_index: number;
    target_wpm?: number;
  }) => {
    const payload = {
      ...lesson,
      slug: normalizeLessonSlug(lesson.slug ?? lesson.title),
    };

    const { data, error } = await supabase
      .from('lessons')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }

    return data;
  },

  updateLesson: async (lessonId: string, updates: any) => {
    const payload = { ...updates };
    if (typeof payload.slug === 'string' || typeof payload.title === 'string') {
      const source =
        typeof payload.slug === 'string' && payload.slug.trim().length > 0
          ? payload.slug
          : payload.title ?? '';
      const normalizedSlug = normalizeLessonSlug(source);
      if (normalizedSlug) {
        payload.slug = normalizedSlug;
      }
    }

    const { error } = await supabase
      .from('lessons')
      .update(payload)
      .eq('id', lessonId);

    if (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  },

  deleteLesson: async (lessonId: string) => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  },

  getAllAchievements: async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  createAchievement: async (achievement: {
    title: string;
    description: string;
    icon: string;
    requirement_type: string;
    requirement_value: number;
    badge_color: string;
  }) => {
    const { data, error } = await supabase
      .from('achievements')
      .insert([achievement])
      .select()
      .single();

    if (error) {
      console.error('Error creating achievement:', error);
      throw error;
    }

    return data;
  },

  updateAchievement: async (achievementId: string, updates: any) => {
    const { error } = await supabase
      .from('achievements')
      .update(updates)
      .eq('id', achievementId);

    if (error) {
      console.error('Error updating achievement:', error);
      throw error;
    }
  },

  deleteAchievement: async (achievementId: string) => {
    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', achievementId);

    if (error) {
      console.error('Error deleting achievement:', error);
      throw error;
    }
  },

  getAllSessions: async () => {
    const { data, error } = await supabase
      .from('typing_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  getAllTestParagraphs: async () => {
    const { data, error } = await supabase
      .from('test_paragraphs')
      .select('*')
      .order('difficulty', { ascending: true });

    if (error) {
      console.error('Error fetching test paragraphs:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  createTestParagraph: async (paragraph: {
    difficulty: 'easy' | 'medium' | 'hard';
    content: string;
    word_count: number;
  }) => {
    const { data, error } = await supabase
      .from('test_paragraphs')
      .insert([paragraph])
      .select()
      .single();

    if (error) {
      console.error('Error creating test paragraph:', error);
      throw error;
    }

    return data;
  },

  updateTestParagraph: async (paragraphId: string, updates: any) => {
    const { error } = await supabase
      .from('test_paragraphs')
      .update(updates)
      .eq('id', paragraphId);

    if (error) {
      console.error('Error updating test paragraph:', error);
      throw error;
    }
  },

  deleteTestParagraph: async (paragraphId: string) => {
    const { error } = await supabase
      .from('test_paragraphs')
      .delete()
      .eq('id', paragraphId);

    if (error) {
      console.error('Error deleting test paragraph:', error);
      throw error;
    }
  },

  getAllPracticeTests: async (): Promise<PracticeTest[]> => {
    const { data, error } = await supabase
      .from('practice_tests')
      .select('*')
      .order('duration_minutes', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching practice tests:', error);
      throw error;
    }

    return Array.isArray(data) ? data : [];
  },

  createPracticeTest: async (practiceTest: {
    title: string;
    content: string;
    duration_minutes: number;
    word_count: number;
  }) => {
    const { data, error } = await supabase
      .from('practice_tests')
      .insert([practiceTest])
      .select()
      .single();

    if (error) {
      console.error('Error creating practice test:', error);
      throw error;
    }

    return data;
  },

  updatePracticeTest: async (practiceTestId: string, updates: any) => {
    const { error } = await supabase
      .from('practice_tests')
      .update(updates)
      .eq('id', practiceTestId);

    if (error) {
      console.error('Error updating practice test:', error);
      throw error;
    }
  },

  deletePracticeTest: async (practiceTestId: string) => {
    const { error } = await supabase
      .from('practice_tests')
      .delete()
      .eq('id', practiceTestId);

    if (error) {
      console.error('Error deleting practice test:', error);
      throw error;
    }
  },
};

// Admin Footer CMS API
export const adminFooterApi = {
  getSupportSections: async (includeDeleted = false): Promise<FooterSupportSection[]> => {
    try {
      return await listFooterRows<FooterSupportSection>('footer_support_sections', {
        includeDeleted,
      });
    } catch (error) {
      if (isMissingRelationError(error)) return [];
      console.error('Error fetching support sections:', error);
      throw error;
    }
  },

  createSupportSection: async (
    payload: Partial<
      Pick<
        FooterSupportSection,
        'title' | 'short_description' | 'icon_url' | 'content' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterSupportSection> => {
    const row = await insertFooterRow<FooterSupportSection>('footer_support_sections', {
      title: payload.title?.trim() ?? '',
      short_description: cleanNullableText(payload.short_description),
      icon_url: cleanNullableText(payload.icon_url),
      content: cleanNullableText(payload.content),
      status: payload.status ?? 'active',
      sort_order: payload.sort_order ?? 0,
      is_deleted: false,
    });

    await logFooterVersion('support_center', row.id, 'create', row as Record<string, unknown>);
    return row;
  },

  updateSupportSection: async (
    id: string,
    payload: Partial<
      Pick<
        FooterSupportSection,
        'title' | 'short_description' | 'icon_url' | 'content' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterSupportSection> => {
    const row = await updateFooterRow<FooterSupportSection>('footer_support_sections', id, {
      title: payload.title?.trim() ?? '',
      short_description: cleanNullableText(payload.short_description),
      icon_url: cleanNullableText(payload.icon_url),
      content: cleanNullableText(payload.content),
      status: payload.status ?? 'active',
      sort_order: payload.sort_order ?? 0,
    });

    await logFooterVersion('support_center', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  setSupportSectionStatus: async (
    id: string,
    status: FooterGenericStatus
  ): Promise<FooterSupportSection> => {
    const row = await updateFooterRow<FooterSupportSection>('footer_support_sections', id, {
      status,
    });
    await logFooterVersion('support_center', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  deleteSupportSection: async (id: string, softDelete = true): Promise<void> => {
    if (softDelete) {
      const row = await updateFooterRow<FooterSupportSection>('footer_support_sections', id, {
        is_deleted: true,
        status: 'inactive',
      });
      await logFooterVersion('support_center', row.id, 'delete', row as Record<string, unknown>);
      return;
    }

    await deleteFooterRow('footer_support_sections', id);
  },

  reorderSupportSections: async (ids: string[]) => {
    await reorderFooterRows('footer_support_sections', ids);
  },

  getFaqItems: async (includeDeleted = false): Promise<FooterFaqItem[]> => {
    try {
      return await listFooterRows<FooterFaqItem>('footer_faq_items', {
        includeDeleted,
        secondaryOrderBy: 'order_number',
      });
    } catch (error) {
      if (isMissingRelationError(error)) return [];
      console.error('Error fetching FAQ items:', error);
      throw error;
    }
  },

  createFaqItem: async (
    payload: Partial<
      Pick<
        FooterFaqItem,
        'question' | 'answer' | 'category' | 'order_number' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterFaqItem> => {
    const row = await insertFooterRow<FooterFaqItem>('footer_faq_items', {
      question: payload.question?.trim() ?? '',
      answer: payload.answer?.trim() ?? '',
      category: cleanNullableText(payload.category),
      order_number: payload.order_number ?? 0,
      status: payload.status ?? 'active',
      sort_order: payload.sort_order ?? 0,
      is_deleted: false,
    });

    await logFooterVersion('faq', row.id, 'create', row as Record<string, unknown>);
    return row;
  },

  updateFaqItem: async (
    id: string,
    payload: Partial<
      Pick<
        FooterFaqItem,
        'question' | 'answer' | 'category' | 'order_number' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterFaqItem> => {
    const row = await updateFooterRow<FooterFaqItem>('footer_faq_items', id, {
      question: payload.question?.trim() ?? '',
      answer: payload.answer?.trim() ?? '',
      category: cleanNullableText(payload.category),
      order_number: payload.order_number ?? 0,
      status: payload.status ?? 'active',
      sort_order: payload.sort_order ?? 0,
    });

    await logFooterVersion('faq', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  setFaqStatus: async (id: string, status: FooterGenericStatus): Promise<FooterFaqItem> => {
    const row = await updateFooterRow<FooterFaqItem>('footer_faq_items', id, {
      status,
    });
    await logFooterVersion('faq', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  deleteFaqItem: async (id: string, softDelete = true): Promise<void> => {
    if (softDelete) {
      const row = await updateFooterRow<FooterFaqItem>('footer_faq_items', id, {
        is_deleted: true,
        status: 'inactive',
      });
      await logFooterVersion('faq', row.id, 'delete', row as Record<string, unknown>);
      return;
    }

    await deleteFooterRow('footer_faq_items', id);
  },

  reorderFaqItems: async (ids: string[]) => {
    await reorderFooterRows('footer_faq_items', ids);
  },

  getAboutSections: async (includeDeleted = false): Promise<FooterAboutSection[]> => {
    try {
      return await listFooterRows<FooterAboutSection>('footer_about_sections', {
        includeDeleted,
      });
    } catch (error) {
      if (isMissingRelationError(error)) return [];
      console.error('Error fetching about sections:', error);
      throw error;
    }
  },

  createAboutSection: async (
    payload: Partial<
      Pick<
        FooterAboutSection,
        'section_title' | 'subtitle' | 'content' | 'image_url' | 'highlight_text' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterAboutSection> => {
    const row = await insertFooterRow<FooterAboutSection>('footer_about_sections', {
      section_title: payload.section_title?.trim() ?? '',
      subtitle: cleanNullableText(payload.subtitle),
      content: cleanNullableText(payload.content),
      image_url: cleanNullableText(payload.image_url),
      highlight_text: cleanNullableText(payload.highlight_text),
      status: payload.status ?? 'active',
      sort_order: payload.sort_order ?? 0,
      is_deleted: false,
    });

    await logFooterVersion('about', row.id, 'create', row as Record<string, unknown>);
    return row;
  },

  updateAboutSection: async (
    id: string,
    payload: Partial<
      Pick<
        FooterAboutSection,
        'section_title' | 'subtitle' | 'content' | 'image_url' | 'highlight_text' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterAboutSection> => {
    const row = await updateFooterRow<FooterAboutSection>('footer_about_sections', id, {
      section_title: payload.section_title?.trim() ?? '',
      subtitle: cleanNullableText(payload.subtitle),
      content: cleanNullableText(payload.content),
      image_url: cleanNullableText(payload.image_url),
      highlight_text: cleanNullableText(payload.highlight_text),
      status: payload.status ?? 'active',
      sort_order: payload.sort_order ?? 0,
    });

    await logFooterVersion('about', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  setAboutSectionStatus: async (
    id: string,
    status: FooterGenericStatus
  ): Promise<FooterAboutSection> => {
    const row = await updateFooterRow<FooterAboutSection>('footer_about_sections', id, {
      status,
    });
    await logFooterVersion('about', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  deleteAboutSection: async (id: string, softDelete = true): Promise<void> => {
    if (softDelete) {
      const row = await updateFooterRow<FooterAboutSection>('footer_about_sections', id, {
        is_deleted: true,
        status: 'inactive',
      });
      await logFooterVersion('about', row.id, 'delete', row as Record<string, unknown>);
      return;
    }

    await deleteFooterRow('footer_about_sections', id);
  },

  reorderAboutSections: async (ids: string[]) => {
    await reorderFooterRows('footer_about_sections', ids);
  },

  getBlogPosts: async (includeDeleted = false): Promise<FooterManagedBlogPost[]> => {
    try {
      return await listFooterRows<FooterManagedBlogPost>('footer_blog_posts', {
        includeDeleted,
      });
    } catch (error) {
      if (isMissingRelationError(error)) return [];
      console.error('Error fetching footer blog posts:', error);
      throw error;
    }
  },

  createBlogPost: async (
    payload: Partial<
      Pick<
        FooterManagedBlogPost,
        | 'title'
        | 'slug'
        | 'excerpt'
        | 'content'
        | 'image_url'
        | 'date_label'
        | 'meta_title'
        | 'meta_description'
        | 'is_published'
        | 'is_draft'
        | 'sort_order'
      >
    >
  ): Promise<FooterManagedBlogPost> => {
    const title = payload.title?.trim() ?? '';
    const slug = await assertUniqueBlogSlug(payload.slug || title);
    const isPublished = payload.is_published === true;
    const publishedAt = isPublished ? new Date().toISOString() : null;

    const row = await insertFooterRow<FooterManagedBlogPost>('footer_blog_posts', {
      title,
      slug,
      excerpt: cleanNullableText(payload.excerpt),
      content: cleanNullableText(payload.content),
      image_url: cleanNullableText(payload.image_url),
      link_url: buildBlogPath(slug),
      date_label: cleanNullableText(payload.date_label),
      meta_title: cleanNullableText(payload.meta_title),
      meta_description: cleanNullableText(payload.meta_description),
      is_published: isPublished,
      is_draft: payload.is_draft ?? !isPublished,
      is_deleted: false,
      published_at: publishedAt,
      sort_order: payload.sort_order ?? 0,
    });

    await logFooterVersion('blog', row.id, 'create', row as Record<string, unknown>);
    return row;
  },

  updateBlogPost: async (
    id: string,
    payload: Partial<
      Pick<
        FooterManagedBlogPost,
        | 'title'
        | 'slug'
        | 'excerpt'
        | 'content'
        | 'image_url'
        | 'date_label'
        | 'meta_title'
        | 'meta_description'
        | 'is_published'
        | 'is_draft'
        | 'sort_order'
      >
    >
  ): Promise<FooterManagedBlogPost> => {
    const title = payload.title?.trim() ?? '';
    const slug = await assertUniqueBlogSlug(payload.slug || title, id);
    const isPublished = payload.is_published === true;
    const publishedAt = isPublished ? new Date().toISOString() : null;

    const row = await updateFooterRow<FooterManagedBlogPost>('footer_blog_posts', id, {
      title,
      slug,
      excerpt: cleanNullableText(payload.excerpt),
      content: cleanNullableText(payload.content),
      image_url: cleanNullableText(payload.image_url),
      link_url: buildBlogPath(slug),
      date_label: cleanNullableText(payload.date_label),
      meta_title: cleanNullableText(payload.meta_title),
      meta_description: cleanNullableText(payload.meta_description),
      is_published: isPublished,
      is_draft: payload.is_draft ?? !isPublished,
      published_at: publishedAt,
      sort_order: payload.sort_order ?? 0,
    });

    await logFooterVersion('blog', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  setBlogPublished: async (id: string, isPublished: boolean): Promise<FooterManagedBlogPost> => {
    const row = await updateFooterRow<FooterManagedBlogPost>('footer_blog_posts', id, {
      is_published: isPublished,
      is_draft: !isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
    });
    await logFooterVersion('blog', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  deleteBlogPost: async (id: string, softDelete = true): Promise<void> => {
    if (softDelete) {
      const row = await updateFooterRow<FooterManagedBlogPost>('footer_blog_posts', id, {
        is_deleted: true,
        is_published: false,
        is_draft: true,
      });
      await logFooterVersion('blog', row.id, 'delete', row as Record<string, unknown>);
      return;
    }

    await deleteFooterRow('footer_blog_posts', id);
  },

  reorderBlogPosts: async (ids: string[]) => {
    await reorderFooterRows('footer_blog_posts', ids);
  },

  getCareers: async (includeDeleted = false): Promise<FooterCareer[]> => {
    try {
      return await listFooterRows<FooterCareer>('footer_careers', {
        includeDeleted,
      });
    } catch (error) {
      if (isMissingRelationError(error)) return [];
      console.error('Error fetching careers entries:', error);
      throw error;
    }
  },

  createCareer: async (
    payload: Partial<
      Pick<
        FooterCareer,
        'job_title' | 'location' | 'job_type' | 'description' | 'requirements' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterCareer> => {
    const row = await insertFooterRow<FooterCareer>('footer_careers', {
      job_title: payload.job_title?.trim() ?? '',
      location: cleanNullableText(payload.location),
      job_type: cleanNullableText(payload.job_type),
      description: cleanNullableText(payload.description),
      requirements: cleanNullableText(payload.requirements),
      status: payload.status ?? 'open',
      sort_order: payload.sort_order ?? 0,
      is_deleted: false,
    });

    await logFooterVersion('careers', row.id, 'create', row as Record<string, unknown>);
    return row;
  },

  updateCareer: async (
    id: string,
    payload: Partial<
      Pick<
        FooterCareer,
        'job_title' | 'location' | 'job_type' | 'description' | 'requirements' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterCareer> => {
    const row = await updateFooterRow<FooterCareer>('footer_careers', id, {
      job_title: payload.job_title?.trim() ?? '',
      location: cleanNullableText(payload.location),
      job_type: cleanNullableText(payload.job_type),
      description: cleanNullableText(payload.description),
      requirements: cleanNullableText(payload.requirements),
      status: payload.status ?? 'open',
      sort_order: payload.sort_order ?? 0,
    });

    await logFooterVersion('careers', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  setCareerStatus: async (id: string, status: FooterCareerStatus): Promise<FooterCareer> => {
    const row = await updateFooterRow<FooterCareer>('footer_careers', id, {
      status,
    });
    await logFooterVersion('careers', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  deleteCareer: async (id: string, softDelete = true): Promise<void> => {
    if (softDelete) {
      const row = await updateFooterRow<FooterCareer>('footer_careers', id, {
        is_deleted: true,
        status: 'closed',
      });
      await logFooterVersion('careers', row.id, 'delete', row as Record<string, unknown>);
      return;
    }

    await deleteFooterRow('footer_careers', id);
  },

  reorderCareers: async (ids: string[]) => {
    await reorderFooterRows('footer_careers', ids);
  },

  getPrivacyPolicySections: async (
    includeDeleted = false
  ): Promise<FooterPrivacyPolicySection[]> => {
    try {
      return await listFooterRows<FooterPrivacyPolicySection>('footer_privacy_policy_sections', {
        includeDeleted,
      });
    } catch (error) {
      if (isMissingRelationError(error)) return [];
      console.error('Error fetching privacy policy sections:', error);
      throw error;
    }
  },

  createPrivacyPolicySection: async (
    payload: Partial<
      Pick<
        FooterPrivacyPolicySection,
        'section_title' | 'content' | 'last_updated_date' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterPrivacyPolicySection> => {
    const row = await insertFooterRow<FooterPrivacyPolicySection>(
      'footer_privacy_policy_sections',
      {
        section_title: payload.section_title?.trim() ?? '',
        content: cleanNullableText(payload.content),
        last_updated_date: cleanNullableText(payload.last_updated_date),
        status: payload.status ?? 'active',
        sort_order: payload.sort_order ?? 0,
        is_deleted: false,
      }
    );

    await logFooterVersion('privacy_policy', row.id, 'create', row as Record<string, unknown>);
    return row;
  },

  updatePrivacyPolicySection: async (
    id: string,
    payload: Partial<
      Pick<
        FooterPrivacyPolicySection,
        'section_title' | 'content' | 'last_updated_date' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterPrivacyPolicySection> => {
    const row = await updateFooterRow<FooterPrivacyPolicySection>(
      'footer_privacy_policy_sections',
      id,
      {
        section_title: payload.section_title?.trim() ?? '',
        content: cleanNullableText(payload.content),
        last_updated_date: cleanNullableText(payload.last_updated_date),
        status: payload.status ?? 'active',
        sort_order: payload.sort_order ?? 0,
      }
    );

    await logFooterVersion('privacy_policy', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  setPrivacyPolicyStatus: async (
    id: string,
    status: FooterGenericStatus
  ): Promise<FooterPrivacyPolicySection> => {
    const row = await updateFooterRow<FooterPrivacyPolicySection>(
      'footer_privacy_policy_sections',
      id,
      {
        status,
      }
    );
    await logFooterVersion('privacy_policy', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  deletePrivacyPolicySection: async (id: string, softDelete = true): Promise<void> => {
    if (softDelete) {
      const row = await updateFooterRow<FooterPrivacyPolicySection>(
        'footer_privacy_policy_sections',
        id,
        {
          is_deleted: true,
          status: 'inactive',
        }
      );
      await logFooterVersion('privacy_policy', row.id, 'delete', row as Record<string, unknown>);
      return;
    }

    await deleteFooterRow('footer_privacy_policy_sections', id);
  },

  reorderPrivacyPolicySections: async (ids: string[]) => {
    await reorderFooterRows('footer_privacy_policy_sections', ids);
  },

  getTermsOfServiceSections: async (
    includeDeleted = false
  ): Promise<FooterTermsOfServiceSection[]> => {
    try {
      return await listFooterRows<FooterTermsOfServiceSection>('footer_terms_of_service_sections', {
        includeDeleted,
      });
    } catch (error) {
      if (isMissingRelationError(error)) return [];
      console.error('Error fetching terms of service sections:', error);
      throw error;
    }
  },

  createTermsOfServiceSection: async (
    payload: Partial<
      Pick<
        FooterTermsOfServiceSection,
        'section_title' | 'content' | 'last_updated_date' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterTermsOfServiceSection> => {
    const row = await insertFooterRow<FooterTermsOfServiceSection>(
      'footer_terms_of_service_sections',
      {
        section_title: payload.section_title?.trim() ?? '',
        content: cleanNullableText(payload.content),
        last_updated_date: cleanNullableText(payload.last_updated_date),
        status: payload.status ?? 'active',
        sort_order: payload.sort_order ?? 0,
        is_deleted: false,
      }
    );

    await logFooterVersion('terms_of_service', row.id, 'create', row as Record<string, unknown>);
    return row;
  },

  updateTermsOfServiceSection: async (
    id: string,
    payload: Partial<
      Pick<
        FooterTermsOfServiceSection,
        'section_title' | 'content' | 'last_updated_date' | 'status' | 'sort_order'
      >
    >
  ): Promise<FooterTermsOfServiceSection> => {
    const row = await updateFooterRow<FooterTermsOfServiceSection>(
      'footer_terms_of_service_sections',
      id,
      {
        section_title: payload.section_title?.trim() ?? '',
        content: cleanNullableText(payload.content),
        last_updated_date: cleanNullableText(payload.last_updated_date),
        status: payload.status ?? 'active',
        sort_order: payload.sort_order ?? 0,
      }
    );

    await logFooterVersion('terms_of_service', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  setTermsOfServiceStatus: async (
    id: string,
    status: FooterGenericStatus
  ): Promise<FooterTermsOfServiceSection> => {
    const row = await updateFooterRow<FooterTermsOfServiceSection>(
      'footer_terms_of_service_sections',
      id,
      {
        status,
      }
    );
    await logFooterVersion('terms_of_service', row.id, 'update', row as Record<string, unknown>);
    return row;
  },

  deleteTermsOfServiceSection: async (id: string, softDelete = true): Promise<void> => {
    if (softDelete) {
      const row = await updateFooterRow<FooterTermsOfServiceSection>(
        'footer_terms_of_service_sections',
        id,
        {
          is_deleted: true,
          status: 'inactive',
        }
      );
      await logFooterVersion('terms_of_service', row.id, 'delete', row as Record<string, unknown>);
      return;
    }

    await deleteFooterRow('footer_terms_of_service_sections', id);
  },

  reorderTermsOfServiceSections: async (ids: string[]) => {
    await reorderFooterRows('footer_terms_of_service_sections', ids);
  },

  getHistory: async (
    tabKey: FooterContentTab,
    itemId?: string,
    limit = 30
  ): Promise<FooterContentVersion[]> => {
    try {
      let query = (supabase.from(FOOTER_VERSION_TABLE as any) as any)
        .select('*')
        .eq('tab_key', tabKey)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (itemId) {
        query = query.eq('item_id', itemId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return Array.isArray(data) ? (data as FooterContentVersion[]) : [];
    } catch (error) {
      if (isMissingRelationError(error)) return [];
      console.error('Error fetching footer content version history:', error);
      throw error;
    }
  },

  getContactInfo: async (): Promise<SiteContactInfo | null> => {
    const { data, error } = await (supabase.from('site_contact_info' as any) as any)
      .select('key, emails, phones, address, hours, notes, updated_at')
      .eq('key', 'default')
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error)) return null;
      console.error('Error fetching contact info:', error);
      throw error;
    }

    return (data ?? null) as SiteContactInfo | null;
  },

  upsertContactInfo: async (payload: {
    emails: string[];
    phones: string[];
    address: string | null;
    hours: string[];
    notes: string | null;
  }) => {
    const { data, error } = await (supabase.from('site_contact_info' as any) as any)
      .upsert(
        {
          key: 'default',
          emails: payload.emails,
          phones: payload.phones,
          address: payload.address,
          hours: payload.hours,
          notes: payload.notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select('key, emails, phones, address, hours, notes, updated_at')
      .maybeSingle();

    if (error) {
      console.error('Error upserting contact info:', error);
      throw error;
    }

    return (data ?? null) as SiteContactInfo | null;
  },
};

// Test Paragraph API
export const testParagraphApi = {
  getRandomParagraph: async (difficulty: 'easy' | 'medium' | 'hard') => {
    const { data, error } = await supabase
      .from('test_paragraphs')
      .select('*')
      .eq('difficulty', difficulty);

    if (error) {
      console.error('Error fetching test paragraphs:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Return a random paragraph from the results
    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  },

  getAllParagraphs: async () => {
    const { data, error } = await supabase
      .from('test_paragraphs')
      .select('*')
      .order('difficulty', { ascending: true });

    if (error) {
      console.error('Error fetching all test paragraphs:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },
};

// Practice Test API
export const practiceTestApi = {
  getAllPracticeTests: async (): Promise<PracticeTest[]> => {
    const { data, error } = await supabase
      .from('practice_tests')
      .select('*')
      .order('duration_minutes', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching practice tests:', error);
      throw error;
    }

    return Array.isArray(data) ? data : [];
  },
};

// Admin Notifications API
export const adminNotificationsApi = {
  getLatest: async (limit = 20): Promise<AdminNotification[]> => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching admin notifications:', error);
      throw error;
    }

    return Array.isArray(data) ? data : [];
  },

  clearAll: async () => {
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .not('id', 'is', null);

    if (error) {
      console.error('Error clearing admin notifications:', error);
      throw error;
    }
  },
};
