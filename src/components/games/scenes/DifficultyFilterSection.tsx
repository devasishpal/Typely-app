import type { ComponentType } from 'react';
import { motion } from 'motion/react';
import { Flame, Gauge, Mountain, Zap } from 'lucide-react';
import { DIFFICULTY_OPTIONS } from '@/components/games/constants';
import type { DifficultyFilterSectionProps } from '@/components/games/scenes/types';
import type { GameDifficulty } from '@/components/games/types';
import { cn } from '@/lib/utils';

const iconByDifficulty: Record<GameDifficulty, ComponentType<{ className?: string }>> = {
  easy: Gauge,
  medium: Flame,
  hard: Mountain,
  extreme: Zap,
};

export default function DifficultyFilterSection({ difficulty, onChangeDifficulty }: DifficultyFilterSectionProps) {
  return (
    <section className="space-y-3" aria-label="Difficulty Filter">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Difficulty Filter</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Easy to Extreme</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DIFFICULTY_OPTIONS.map((item, index) => {
          const Icon = iconByDifficulty[item.value];
          const active = item.value === difficulty;
          return (
            <motion.button
              type="button"
              key={item.value}
              onClick={() => onChangeDifficulty(item.value)}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              whileHover={{ y: -4 }}
              className={cn(
                'rounded-2xl border p-4 text-left transition-colors',
                active
                  ? 'border-primary/55 bg-primary/8 shadow-hover'
                  : 'border-border/65 bg-card/75 hover:border-primary/35'
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60">
                  <Icon className={cn('h-4.5 w-4.5', active ? 'text-primary' : 'text-muted-foreground')} />
                </span>
                {active && <span className="text-[11px] font-medium text-primary">Selected</span>}
              </div>
              <p className="text-lg font-semibold capitalize">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.helper}</p>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

