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
  slug: string;
  description: string | null;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  order_index: number;
  content: string;
  target_keys: string[];
  target_wpm?: number | null;
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

export interface CertificateTemplate {
  id: string;
  name: string;
  background_image_url: string | null;
  background_storage_path?: string | null;
  template_version?: number;
  title_text: string;
  show_wpm: boolean;
  show_accuracy: boolean;
  show_date: boolean;
  show_certificate_id: boolean;
  name_x_pct?: number;
  name_y_pct?: number;
  wpm_x_pct?: number;
  wpm_y_pct?: number;
  accuracy_x_pct?: number;
  accuracy_y_pct?: number;
  date_x_pct?: number;
  date_y_pct?: number;
  certificate_id_x_pct?: number;
  certificate_id_y_pct?: number;
  font_family?: string;
  font_weight?: string;
  font_color?: string;
  title_font_size?: number;
  subtitle_font_size?: number;
  body_font_size?: number;
  name_font_size?: number;
  wpm_font_size?: number;
  accuracy_font_size?: number;
  date_font_size?: number;
  certificate_id_font_size?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CertificateRule {
  id: string;
  minimum_wpm: number;
  minimum_accuracy: number;
  test_type: string;
  is_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserCertificate {
  id: string;
  certificate_code: string;
  user_id: string;
  test_id: string;
  template_id: string;
  template_version?: number;
  wpm: number;
  accuracy: number;
  issued_at: string;
  pdf_url: string;
  verification_url: string;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CertificateIssuePayload {
  certificateCode: string;
  issuedAt: string;
  wpm: number;
  accuracy: number;
  templateVersion?: number;
  verificationUrl: string;
  verifyPath: string;
  downloadApiUrl: string;
  linkedInShareUrl: string;
}

export interface CertificateIssueResponse {
  issued: boolean;
  alreadyExisted?: boolean;
  reason?: string;
  message?: string;
  certificate?: CertificateIssuePayload;
  rule?: {
    minimumWpm: number;
    minimumAccuracy: number;
    testType: string;
  };
  result?: {
    wpm: number;
    accuracy: number;
    testType: string;
  };
}

export interface CertificateVerificationRecord {
  certificateId: string;
  studentName: string;
  testName: string;
  wpm: number;
  accuracy: number;
  issuedAt: string;
  templateVersion?: number;
  revokedAt?: string | null;
  revokedReason?: string | null;
}

export interface CertificateVerificationResponse {
  valid: boolean;
  message?: string;
  certificate?: CertificateVerificationRecord;
}

export interface AdminCertificateTopEarner {
  userId: string;
  username: string;
  fullName: string | null;
  certificateCount: number;
}

export interface AdminCertificateListItem {
  certificateCode: string;
  studentName: string;
  testName: string;
  wpm: number;
  accuracy: number;
  issuedAt: string;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
}

export interface AdminCertificateOverviewResponse {
  totals: {
    totalIssued: number;
    totalRevoked: number;
    activeTemplates: number;
  };
  activeRule: {
    minimumWpm: number;
    minimumAccuracy: number;
    testType: string;
    isEnabled: boolean;
  } | null;
  topEarners: AdminCertificateTopEarner[];
  recentCertificates: AdminCertificateListItem[];
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

export interface LeaderboardScore {
  id: string;
  user_id: string | null;
  nickname: string;
  wpm: number;
  accuracy: number;
  mistakes?: number;
  duration: number;
  test_mode?: 'practice' | 'timed' | 'custom';
  net_wpm?: number;
  source: string;
  created_at: string;
}

export type LeaderboardPeriod = 'global' | 'daily' | 'weekly' | 'monthly';
export type LeaderboardMode = 'all' | 'practice' | 'timed' | 'custom';

export interface LeaderboardRankingRow {
  rank: number;
  user_id: string;
  username: string;
  net_wpm: number;
  wpm: number;
  accuracy: number;
  mistakes: number;
  test_mode: 'practice' | 'timed' | 'custom';
  created_at: string;
}

export interface LeaderboardPersonalStats {
  global_rank: number;
  best_net_wpm: number;
  accuracy: number;
  percentile: number;
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

export type FooterGenericStatus = 'active' | 'inactive';
export type FooterCareerStatus = 'open' | 'closed';

export interface FooterSupportSection {
  id: string;
  title: string;
  short_description: string | null;
  icon_url: string | null;
  content: string | null;
  status: FooterGenericStatus;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface FooterFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  order_number: number;
  status: FooterGenericStatus;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface FooterAboutSection {
  id: string;
  section_title: string;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  highlight_text: string | null;
  status: FooterGenericStatus;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface FooterManagedBlogPost {
  id: string;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  date_label: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  is_published: boolean;
  is_draft: boolean;
  is_deleted: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FooterCareer {
  id: string;
  job_title: string;
  location: string | null;
  job_type: string | null;
  description: string | null;
  requirements: string | null;
  status: FooterCareerStatus;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface FooterPrivacyPolicySection {
  id: string;
  section_title: string;
  content: string | null;
  last_updated_date: string | null;
  status: FooterGenericStatus;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface FooterTermsOfServiceSection {
  id: string;
  section_title: string;
  content: string | null;
  last_updated_date: string | null;
  status: FooterGenericStatus;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export type FooterContentTab =
  | 'support_center'
  | 'faq'
  | 'about'
  | 'blog'
  | 'careers'
  | 'privacy_policy'
  | 'terms_of_service';

export interface FooterContentVersion {
  id: string;
  tab_key: FooterContentTab;
  item_id: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface SiteContactInfo {
  key: string;
  emails: string[] | null;
  phones: string[] | null;
  address: string | null;
  hours: string[] | null;
  notes: string | null;
  updated_at: string | null;
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
