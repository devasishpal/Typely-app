import { Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="lesson-ripple relative inline-flex h-10 w-[78px] items-center rounded-full border border-white/20 bg-white/10 px-1.5 backdrop-blur-lg transition-all hover:border-primary/50"
      aria-label="Toggle theme"
    >
      <Sun className={cn('absolute left-2.5 h-3.5 w-3.5 transition-colors', isDark ? 'text-slate-500' : 'text-amber-500')} />
      <Moon className={cn('absolute right-2.5 h-3.5 w-3.5 transition-colors', isDark ? 'text-cyan-300' : 'text-slate-400')} />
      <motion.span
        layout
        className="relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg"
        animate={{ x: isDark ? 34 : 0 }}
        transition={{ type: 'spring', stiffness: 430, damping: 28 }}
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </motion.span>
    </button>
  );
}
