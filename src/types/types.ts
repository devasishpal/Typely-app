// Database types
export type UserRole = 'user' | 'admin';
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonCategory = string;

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  country: string | null;
  bio: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  order_index: number;
  content: string;
  target_keys: string[];
  finger_guidance: Record<string, string> | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  best_wpm: number | null;
  best_accuracy: number | null;
  attempts: number;
  last_practiced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TypingSession {
  id: string;
  user_id: string;
  lesson_id: string | null;
  wpm: number;
  cpm: number;
  accuracy: number;
  total_keystrokes: number;
  correct_keystrokes: number;
  incorrect_keystrokes: number;
  backspace_count: number;
  error_keys: Record<string, number> | null;
  duration_seconds: number;
  created_at: string;
}

export interface TypingTest {
  id: string;
  user_id: string;
  test_type: string;
  test_content: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  total_keystrokes: number;
  correct_keystrokes: number;
  incorrect_keystrokes: number;
  backspace_count: number;
  error_keys: Record<string, number> | null;
  duration_seconds: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  badge_color: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface Statistics {
  id: string;
  user_id: string;
  date: string;
  total_sessions: number;
  total_keystrokes: number;
  total_duration_seconds: number;
  average_wpm: number | null;
  average_accuracy: number | null;
  lessons_completed: number;
  created_at: string;
  updated_at: string;
}

export interface TestParagraph {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface PracticeTest {
  id: string;
  title: string;
  content: string;
  duration_minutes: number;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  created_at: string;
}

export interface TypingResult {
  id: string;
  user_id: string;
  client_result_id: string;
  wpm: number;
  accuracy: number;
  mistakes: number;
  duration: number;
  created_at: string;
}

export interface GuestTypingResult {
  id: string;
  wpm: number;
  accuracy: number;
  mistakes: number;
  duration: number;
  date: string;
}

export type DeletionRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AccountDeletionRequest {
  id: string;
  user_id: string;
  status: DeletionRequestStatus;
  source: string;
  requested_at: string;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface LessonWithProgress extends Lesson {
  progress?: LessonProgress;
}

export interface AchievementWithStatus extends Achievement {
  earned: boolean;
  earned_at?: string;
}

// Form types
export interface TypingSessionData {
  lesson_id?: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  total_keystrokes: number;
  correct_keystrokes: number;
  incorrect_keystrokes: number;
  backspace_count: number;
  error_keys: Record<string, number>;
  duration_seconds: number;
}

export interface TypingTestData {
  test_type: string;
  test_content: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  total_keystrokes: number;
  correct_keystrokes: number;
  incorrect_keystrokes: number;
  backspace_count: number;
  error_keys: Record<string, number>;
  duration_seconds: number;
}

// Statistics types
export interface DailyStats {
  date: string;
  wpm: number;
  accuracy: number;
  sessions: number;
}

export interface OverallStats {
  total_sessions: number;
  total_keystrokes: number;
  total_duration_seconds: number;
  average_wpm: number;
  average_accuracy: number;
  best_wpm: number;
  best_accuracy: number;
  lessons_completed: number;
  total_lessons: number;
}
