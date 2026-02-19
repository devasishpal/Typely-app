import { useMemo } from 'react';
import { ArrowDown, ArrowRight, PlayCircle } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { AnimatedButton } from '@/components/landing/AnimatedButton';
import { fadeUpVariant, staggerParentVariant } from '@/components/landing/animations';
import { floatingKeys, heroMetrics, heroTypingPhrases, trustSignals } from '@/components/landing/data';
import { useTypingLoop } from '@/components/landing/hooks/useTypingLoop';
import { scrollToSection } from '@/components/landing/utils';

export function HeroSection() {
  const { text } = useTypingLoop(heroTypingPhrases);
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 800], [0, 90]);
  const parallaxYSlow = useTransform(scrollY, [0, 900], [0, 45]);

  const floatingKeyPositions = useMemo(
    () => [
      'left-[5%] top-[16%]',
      'left-[13%] top-[30%]',
      'left-[8%] top-[48%]',
      'left-[16%] top-[66%]',
      'right-[9%] top-[20%]',
      'right-[13%] top-[36%]',
      'right-[7%] top-[52%]',
      'right-[14%] top-[68%]',
      'left-[25%] top-[12%]',
      'right-[25%] top-[10%]',
    ],
    []
  );

  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pt-40"
      aria-labelledby="landing-hero-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[2]"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, hsl(var(--primary)/0.22), transparent 45%), radial-gradient(circle at 80% 22%, hsl(var(--secondary)/0.22), transparent 48%), radial-gradient(circle at 50% 85%, hsl(var(--accent)/0.16), transparent 44%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 -z-[2] bg-[radial-gradient(circle_at_1px_1px,hsl(var(--primary)/0.08)_1px,transparent_0)] [background-size:16px_16px]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-16 -z-[1] h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        style={{ y: parallaxYSlow }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-40 -z-[1] h-72 w-72 rounded-full bg-secondary/20 blur-3xl"
        style={{ y: parallaxY }}
      />

      <div className="pointer-events-none absolute inset-0 -z-[1] hidden lg:block">
        {floatingKeys.map((key, index) => (
          <motion.span
            key={key.id}
            className={`absolute ${floatingKeyPositions[index]} inline-flex h-10 items-center justify-center rounded-xl border border-primary/25 bg-background/80 px-3 text-sm font-semibold text-primary shadow-card backdrop-blur-md ${key.widthClass ?? 'w-10'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.5, delay: index * 0.04 },
              y: {
                duration: 3.2 + index * 0.15,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.12,
              },
            }}
          >
            {key.value}
          </motion.span>
        ))}
      </div>

      <motion.div
        className="mx-auto flex w-full max-w-6xl flex-col items-center gap-14 lg:flex-row lg:items-center lg:justify-between"
        variants={staggerParentVariant(0.14)}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUpVariant} className="mx-auto w-full max-w-3xl space-y-8 text-center lg:mx-0 lg:text-left">
          <span className="mx-auto inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-primary lg:mx-0">
            Premium Typing Platform
          </span>

          <h1
            id="landing-hero-title"
            className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Master Typing with <span className="gradient-text">TYPELY</span>
          </h1>

          <div className="mx-auto flex min-h-8 items-center justify-center lg:mx-0 lg:justify-start">
            <p className="text-xl font-medium text-muted-foreground md:text-2xl">
              <span className="text-foreground">{text}</span>
              <span
                aria-hidden="true"
                className="ml-1 inline-block h-6 w-[2px] animate-pulse rounded bg-primary align-middle"
              />
            </p>
          </div>

          <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg lg:mx-0">
            Typely delivers structured lessons, live feedback, and measurable analytics so you can increase speed
            without sacrificing accuracy. Build lasting confidence with a training flow designed for real progress.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <AnimatedButton to="/signup" size="lg" ariaLabel="Get started free">
              Get Started Free
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </AnimatedButton>
            <AnimatedButton to="/login" variant="outline" size="lg" ariaLabel="Sign in">
              <PlayCircle className="h-5 w-5" aria-hidden="true" />
              Sign In
            </AnimatedButton>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroMetrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                className="rounded-xl border border-border/70 bg-background/70 p-3 text-center backdrop-blur-md lg:text-left"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.42 + index * 0.08 }}
              >
                <div className="text-lg font-bold tracking-tight text-foreground md:text-xl">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUpVariant} className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-background/95 via-background/85 to-primary/10 p-6 shadow-glow backdrop-blur-xl md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Live Session Preview</p>
                <p className="text-lg font-semibold text-foreground">Typing Performance</p>
              </div>
              <div className="rounded-full border border-success/30 bg-success/15 px-3 py-1 text-xs font-medium text-success">
                Active
              </div>
            </div>

            <div className="space-y-4">
              {trustSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <motion.div
                    key={signal.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/75 px-4 py-3"
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-sm text-foreground">{signal.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-12 flex justify-center">
        <button
          type="button"
          aria-label="Scroll to Why Typely section"
          onClick={() => scrollToSection('why-typely')}
          className="group inline-flex flex-col items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Scroll to explore
          <motion.span
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </motion.span>
        </button>
      </div>
    </section>
  );
}
