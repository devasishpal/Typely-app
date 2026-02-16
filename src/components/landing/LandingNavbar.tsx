import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedButton } from '@/components/landing/AnimatedButton';
import { landingNavItems, landingSectionOrder } from '@/components/landing/data';
import { useActiveSection } from '@/components/landing/hooks/useActiveSection';
import { scrollToSection } from '@/components/landing/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';

export function LandingNavbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeSection, hasScrolled } = useActiveSection(landingSectionOrder);
  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, { stiffness: 130, damping: 28, mass: 0.2 });

  const currentSectionLabel = useMemo(
    () => landingNavItems.find((item) => item.id === activeSection)?.label ?? 'Home',
    [activeSection]
  );

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  const handleSectionJump = (sectionId: string) => {
    scrollToSection(sectionId);
    setMobileOpen(false);
  };

  return (
    <>
      <motion.header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b border-transparent transition-all duration-300',
          hasScrolled
            ? 'border-border/60 bg-background/75 shadow-card backdrop-blur-xl'
            : 'bg-background/35 backdrop-blur-md'
        )}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Typely home"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-primary/20 bg-primary/10 shadow-card">
              <img src="/favicon.png" alt="Typely logo" className="h-full w-full object-cover" loading="eager" />
            </div>
            <span className="text-lg font-bold tracking-wide gradient-text">TYPELY</span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
            {landingNavItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSectionJump(item.id)}
                  className={cn(
                    'relative rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="landing-nav-pill"
                      className="absolute inset-0 -z-[1] rounded-full border border-primary/25 bg-primary/12"
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    />
                  ) : null}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <ModeToggle />
            {user ? (
              <>
                <AnimatedButton to="/dashboard" variant="outline" size="sm" ariaLabel="Go to dashboard">
                  Dashboard
                </AnimatedButton>
                <AnimatedButton to="/profile" size="sm" ariaLabel="Open profile">
                  Profile
                </AnimatedButton>
              </>
            ) : (
              <>
                <AnimatedButton to="/login" variant="outline" size="sm" ariaLabel="Sign in">
                  Sign In
                </AnimatedButton>
                <AnimatedButton to="/typing-test" size="sm" ariaLabel="Start typing now">
                  Start Typing
                </AnimatedButton>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ModeToggle />
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/70 text-foreground transition-colors hover:bg-muted"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <motion.div
          aria-hidden="true"
          className="h-[2px] origin-left bg-gradient-primary"
          style={{ scaleX: progressScale }}
        />
      </motion.header>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu overlay"
              className="fixed inset-0 z-40 bg-brand-navy/45 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed right-0 top-0 z-50 flex h-dvh w-[85%] max-w-sm flex-col border-l border-border/70 bg-background/95 p-6 shadow-2xl backdrop-blur-xl lg:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Section: {currentSectionLabel}</p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background"
                  aria-label="Close mobile menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="space-y-2" aria-label="Mobile section navigation">
                {landingNavItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSectionJump(item.id)}
                      className={cn(
                        'w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all',
                        isActive
                          ? 'border-primary/35 bg-primary/10 text-foreground'
                          : 'border-border/60 bg-background/80 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-3 pt-8">
                {user ? (
                  <>
                    <AnimatedButton to="/dashboard" variant="outline" className="w-full" ariaLabel="Open dashboard">
                      Dashboard
                    </AnimatedButton>
                    <AnimatedButton to="/profile" className="w-full" ariaLabel="Open profile">
                      Profile
                    </AnimatedButton>
                  </>
                ) : (
                  <>
                    <AnimatedButton to="/login" variant="outline" className="w-full" ariaLabel="Sign in to account">
                      Sign In
                    </AnimatedButton>
                    <AnimatedButton to="/typing-test" className="w-full" ariaLabel="Start typing as a guest">
                      Start Typing
                    </AnimatedButton>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
