import { motion, useScroll, useTransform } from 'motion/react';
import { Sparkles, Swords, Timer } from 'lucide-react';
import type { GamesHeroSectionProps } from '@/components/games/scenes/types';
import { getGameLabel } from '@/components/games/scenes/helpers';

export default function GamesHeroSection({ activeGame, difficulty, totalGamesCompleted }: GamesHeroSectionProps) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.25], [0, -24]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.86]);

  return (
    <motion.section
      style={{ y, opacity }}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-card px-5 py-8 shadow-card sm:px-8 sm:py-10"
      aria-label="Games Hero"
    >
      <div className="absolute -right-16 -top-12 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Typely Games Hub
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.04 }}
            className="text-3xl font-bold leading-tight sm:text-4xl"
          >
            Animated Typing Games,
            <span className="gradient-text"> Built For Real Progress</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.1 }}
            className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base"
          >
            Train speed, precision, and control with four full typing game modes. Play instantly,
            track local stats, and push your personal leaderboard without sign-in.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14 }}
            className="mt-5 flex flex-wrap gap-2"
          >
            <span className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">
              <Swords className="h-3.5 w-3.5 text-primary" /> Active: {getGameLabel(activeGame)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">
              <Timer className="h-3.5 w-3.5 text-accent" /> Difficulty: {difficulty}
            </span>
            <span className="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground">
              Games Completed: <strong className="font-semibold text-foreground">{totalGamesCompleted}</strong>
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="w-full max-w-[320px] rounded-3xl border border-border/70 bg-card/75 p-4 shadow-card"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Session Focus</p>
          <p className="mt-1 text-xl font-semibold">Precision + Rhythm</p>
          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2">
              Start with accurate streaks before speed.
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2">
              Use medium difficulty for balanced score growth.
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
