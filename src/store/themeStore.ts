import { create } from 'zustand';
import { LESSON_THEME_STORAGE_KEY } from '@/constants/lessonTheme';

export type ThemeMode = 'light' | 'dark';

interface ThemeStore {
  theme: ThemeMode;
  hydrated: boolean;
  hydrateTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';

  const fromLessonStorage = window.localStorage.getItem(LESSON_THEME_STORAGE_KEY);
  const fromAppStorage = window.localStorage.getItem('typely-ui-theme');
  const stored = fromLessonStorage ?? fromAppStorage;

  if (stored === 'light' || stored === 'dark') return stored;

  if (window.document.documentElement.classList.contains('dark')) return 'dark';
  if (window.document.documentElement.classList.contains('light')) return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDocument = (theme: ThemeMode): void => {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  root.style.setProperty('--lesson-theme-transition', '300ms');
};

const persistTheme = (theme: ThemeMode): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LESSON_THEME_STORAGE_KEY, theme);
  window.localStorage.setItem('typely-ui-theme', theme);
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: resolveInitialTheme(),
  hydrated: false,
  hydrateTheme: () => {
    const initial = resolveInitialTheme();
    applyThemeToDocument(initial);
    persistTheme(initial);
    set({ theme: initial, hydrated: true });
  },
  setTheme: (theme) => {
    applyThemeToDocument(theme);
    persistTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyThemeToDocument(next);
    persistTheme(next);
    set({ theme: next });
  },
}));
