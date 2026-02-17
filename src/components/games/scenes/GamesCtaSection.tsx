import { motion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GamesCtaSectionProps } from '@/components/games/scenes/types';
import { getGameLabel } from '@/components/games/scenes/helpers';

export default function GamesCtaSection({ onLaunch, activeGame, difficulty }: GamesCtaSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.32 }}
      className="relative overflow-hidden rounded-3xl border border-border/65 bg-gradient-card px-5 py-7 shadow-card sm:px-7"
      aria-label="Call To Action"
    >
      <div className="absolute -right-16 -top-10 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-primary/18 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Launch Your Next Challenge</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start <strong className="text-foreground">{getGameLabel(activeGame)}</strong> on <strong className="text-foreground">{difficulty}</strong> difficulty.
          </p>
        </div>

        <Button size="lg" onClick={onLaunch} className="min-w-[220px]">
          <Play className="mr-2 h-4 w-4" />
          Play Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.section>
  );
}
