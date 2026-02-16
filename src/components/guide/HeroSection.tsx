import { motion, useScroll, useTransform } from 'motion/react';
import { Keyboard, MousePointerClick, Sparkles } from 'lucide-react';
import { heroFloatingKeys, heroInsights, heroPracticeHighlights } from '@/components/guide/data';
import { guideContainerVariant, guideCardVariant, quickFadeVariant } from '@/components/guide/animations';

export default function HeroSection() {
  const { scrollY } = useScroll();
  const parallaxFar = useTransform(scrollY, [0, 900], [0, 110]);
  const parallaxNear = useTransform(scrollY, [0, 900], [0, 70]);

  return (
    <motion.section
      id="guide-hero"
      aria-labelledby="guide-hero-title"
      variants={guideContainerVariant}
      initial="hidden"
      animate="visible"
      className="relative isolate overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 px-5 pb-12 pt-14 shadow-card backdrop-blur-xl sm:px-8 lg:px-12 lg:pb-16 lg:pt-16"
    >
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_10%,hsl(var(--primary)/0.24)_0%,transparent_44%),radial-gradient(circle_at_80%_20%,hsl(var(--secondary)/0.24)_0%,transparent_48%),radial-gradient(circle_at_50%_90%,hsl(var(--accent)/0.14)_0%,transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.05)_1px,transparent_0)] [background-size:18px_18px]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-20 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        style={{ y: parallaxNear }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-36 -z-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"
        style={{ y: parallaxFar }}
      />

      <div className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        {heroFloatingKeys.map((floatingKey) => (
          <motion.span
            key={floatingKey.id}
            className="absolute inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-primary/20 bg-background/80 px-3 text-sm font-semibold text-primary shadow-card backdrop-blur"
            style={{ left: floatingKey.left, top: floatingKey.top }}
            variants={quickFadeVariant}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.35, delay: floatingKey.delay },
              y: {
                duration: floatingKey.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
                delay: floatingKey.delay,
              },
            }}
          >
            {floatingKey.value}
          </motion.span>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div variants={guideCardVariant} className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Complete Typing Guide
          </span>

          <div className="space-y-4">
            <h1 id="guide-hero-title" className="text-balance text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
              Master Typing The Right Way
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Learn correct finger placement, posture, and speed techniques.
            </p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2" aria-label="Guide highlights">
            {heroPracticeHighlights.map((highlight, index) => (
              <motion.li
                key={highlight}
                className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground shadow-sm"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.24 + index * 0.08 }}
              >
                {highlight}
              </motion.li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-3">
            {heroInsights.map((insight, index) => (
              <motion.article
                key={insight.id}
                className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-sm"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.38 + index * 0.08 }}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{insight.label}</p>
                <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">{insight.value}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{insight.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>

        <motion.div variants={guideCardVariant} className="relative mx-auto w-full max-w-2xl">
          <div className="relative overflow-hidden rounded-[1.8rem] border border-border/70 bg-gradient-to-br from-background/95 via-background/85 to-primary/10 p-5 shadow-glow md:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Animated Keyboard Preview</p>
                <p className="text-lg font-semibold text-foreground">Precision + Rhythm + Posture</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
                Interactive Guide
              </span>
            </div>

            <motion.div
              className="rounded-2xl border border-border/70 bg-background/75 p-4"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
                  Finger Placement Visualization
                </span>
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  Home Row Active
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-card/80 text-xs font-semibold text-foreground"
                      animate={{ y: [0, -3, 0] }}
                      transition={{
                        duration: 2.4,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: index * 0.07,
                        ease: 'easeInOut',
                      }}
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-1.5 pl-4">
                  {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-success/40 bg-success/15 text-xs font-semibold text-success shadow-[0_0_12px_hsl(var(--success)/0.25)]"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 2.8,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: index * 0.08,
                        ease: 'easeInOut',
                      }}
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-1.5 pl-8">
                  {['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/70 bg-card/80 text-xs font-semibold text-foreground"
                      animate={{ y: [0, -2, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: index * 0.09,
                        ease: 'easeInOut',
                      }}
                    >
                      {item}
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="mx-auto mt-1 h-9 w-3/4 rounded-xl border border-info/35 bg-info/15 text-center text-xs font-semibold leading-9 text-info"
                  animate={{ boxShadow: ['0 0 0 0 hsl(var(--info)/0)', '0 0 0 8px hsl(var(--info)/0.08)', '0 0 0 0 hsl(var(--info)/0)'] }}
                  transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                >
                  SPACE (Thumbs)
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
