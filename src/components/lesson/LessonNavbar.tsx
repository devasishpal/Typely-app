import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ThemeToggle from '@/components/lesson/ThemeToggle';
import { LESSON_NAV_ITEMS } from '@/constants/lessonTheme';
import { cn } from '@/lib/utils';

export default function LessonNavbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <div className="mx-auto max-w-[1500px]">
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-background/60 px-3 py-2 shadow-[0_14px_36px_rgba(15,23,42,0.26)] backdrop-blur-2xl sm:px-4 lg:px-5">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
            <Link to="/dashboard" className="lesson-ripple group flex items-center gap-2 rounded-xl px-1 py-1">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-inner">
                <img src="/favicon.png" alt="Typely logo" className="h-full w-full object-cover" />
              </span>
              <span className="hidden bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-lg font-extrabold tracking-[0.18em] text-transparent sm:inline">
                TYPELY
              </span>
            </Link>

            <nav className="hidden min-w-0 items-center justify-center gap-2 md:flex lg:gap-3">
              {LESSON_NAV_ITEMS.map((item) => {
                const active = location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'lesson-ripple relative rounded-xl px-3 py-2 text-sm font-semibold tracking-wide transition-all duration-300',
                      active
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:scale-[1.03]'
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="lesson-nav-active"
                        className="absolute inset-0 -z-10 rounded-xl border border-cyan-400/40 bg-cyan-400/12 shadow-[0_0_20px_rgba(34,211,238,0.28)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <span className="relative z-10">{item.label}</span>
                    <span className="pointer-events-none absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/90 to-cyan-400/0 transition-transform duration-300 group-hover:scale-x-100" />
                  </NavLink>
                );
              })}
            </nav>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <ThemeToggle />
              <button
                type="button"
                className="lesson-ripple inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-muted-foreground transition-all hover:scale-105 hover:border-primary/50 hover:text-foreground"
                aria-label="Open settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              <Avatar className="h-10 w-10 border border-cyan-400/40 bg-gradient-to-br from-cyan-500/25 to-indigo-500/35 text-cyan-100">
                <AvatarFallback className="bg-transparent font-semibold">A</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <nav className="mt-2 flex gap-2 overflow-x-auto pb-0.5 md:hidden lesson-scrollbar">
            {LESSON_NAV_ITEMS.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'border-cyan-400/45 bg-cyan-500/15 text-foreground'
                      : 'border-white/15 bg-white/5 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
