export type LessonThemeMode = 'light' | 'dark';
export type FingerZone = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';

export const FINGER_ZONE_LABELS: Record<FingerZone, string> = {
  pinky: 'Pinky',
  ring: 'Ring',
  middle: 'Middle',
  index: 'Index',
  thumb: 'Thumb',
};

export const FINGER_ZONE_CLASSES: Record<FingerZone, string> = {
  pinky:
    'border-fuchsia-400/40 bg-fuchsia-500/12 text-fuchsia-200 shadow-[0_0_16px_rgba(232,121,249,0.25)] dark:text-fuchsia-200',
  ring:
    'border-violet-400/40 bg-violet-500/12 text-violet-200 shadow-[0_0_16px_rgba(167,139,250,0.25)] dark:text-violet-200',
  middle:
    'border-cyan-400/40 bg-cyan-500/12 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.25)] dark:text-cyan-200',
  index:
    'border-blue-400/40 bg-blue-500/12 text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.25)] dark:text-blue-200',
  thumb:
    'border-emerald-400/40 bg-emerald-500/12 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.25)] dark:text-emerald-200',
};

export const LESSON_THEME_CLASSNAMES: Record<LessonThemeMode, { page: string; card: string; nav: string }> = {
  dark: {
    page: 'bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.16),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_40%_90%,rgba(99,102,241,0.18),transparent_36%),linear-gradient(145deg,#050a1d_0%,#08112b_45%,#0a173a_100%)] text-slate-100',
    card: 'border-white/10 bg-slate-950/55 backdrop-blur-xl shadow-[0_10px_38px_rgba(2,6,23,0.55)]',
    nav: 'border-white/10 bg-slate-950/45 backdrop-blur-2xl shadow-[0_12px_40px_rgba(2,6,23,0.45)]',
  },
  light: {
    page: 'bg-[radial-gradient(circle_at_12%_18%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(147,197,253,0.2),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(125,211,252,0.2),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#edf2ff_100%)] text-slate-900',
    card: 'border-slate-300/70 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_rgba(71,85,105,0.18)]',
    nav: 'border-slate-200/80 bg-white/70 backdrop-blur-2xl shadow-[0_10px_36px_rgba(59,130,246,0.14)]',
  },
};

export const LESSON_NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Lessons', to: '/lessons' },
  { label: 'Practice', to: '/practice' },
  { label: 'Test', to: '/typing-test' },
  { label: 'Statistics', to: '/statistics' },
  { label: 'Achievements', to: '/achievements' },
] as const;

export const LESSON_PROGRESS_STORAGE_KEY = 'typely-lesson-progress-v1';
export const LESSON_THEME_STORAGE_KEY = 'typely-lesson-theme';
export const LESSON_COACH_INTERVAL_MS = 30_000;
