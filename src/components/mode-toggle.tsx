import { Moon, Sun } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const getResolvedTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(getResolvedTheme);

  useEffect(() => {
    setResolvedTheme(getResolvedTheme());

    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolvedTheme(media.matches ? 'dark' : 'light');

    if (media.addEventListener) {
      media.addEventListener('change', handler);
    } else {
      media.addListener(handler);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handler);
      } else {
        media.removeListener(handler);
      }
    };
  }, [theme]);

  const isDark = resolvedTheme === 'dark';
  const label = useMemo(() => (isDark ? 'DARK' : 'LIGHT'), [isDark]);

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="group inline-flex items-center gap-2 rounded-full px-1 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-foreground/70 transition-colors hover:text-foreground"
    >
      <span className="hidden sm:inline">{label}</span>
      <span
        className={cn(
          'relative inline-flex h-8 w-[70px] items-center rounded-full border p-1 transition-colors',
          isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-100'
        )}
      >
        <Sun className="absolute left-2 h-3 w-3 text-neutral-400" />
        <Moon className="absolute right-2 h-3 w-3 text-neutral-400" />
        <span
          className={cn(
            'relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition-all duration-300',
            isDark ? 'translate-x-[38px]' : 'translate-x-0'
          )}
        >
          {isDark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
        </span>
      </span>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
