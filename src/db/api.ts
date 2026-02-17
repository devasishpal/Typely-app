import { isSupabaseConfigured, supabase } from './supabase';
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
} from '@/types';

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

  getLesson: async (lessonId: string): Promise<Lesson | null> => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching lesson:', error);
      return null;
    }
    return data;
  },

  createLesson: async (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>): Promise<Lesson | null> => {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
    return data;
  },

  updateLesson: async (lessonId: string, updates: Partial<Lesson>): Promise<Lesson | null> => {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
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
    content: string;
    target_keys: string[];
    order_index: number;
  }) => {
    const { data, error } = await supabase
      .from('lessons')
      .insert([lesson])
      .select()
      .single();

    if (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }

    return data;
  },

  updateLesson: async (lessonId: string, updates: any) => {
    const { error } = await supabase
      .from('lessons')
      .update(updates)
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
