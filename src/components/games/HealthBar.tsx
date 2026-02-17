import { memo } from 'react';
import { motion } from 'motion/react';
import type { HealthBarProps } from '@/components/games/types';

function HealthBarBase({ label = 'Health', current, max, warningThreshold = 0.35 }: HealthBarProps) {
  const safeMax = Math.max(1, max);
  const ratio = Math.max(0, Math.min(1, current / safeMax));
  const percent = ratio * 100;
  const isWarning = ratio <= warningThreshold;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/85 p-3 shadow-card">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums font-semibold text-foreground">
          {Math.max(0, Math.round(current))}/{Math.round(max)}
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-muted/70">
        <motion.div
          className={isWarning ? 'h-full rounded-full bg-destructive' : 'h-full rounded-full bg-gradient-progress'}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        />
        {isWarning && (
          <motion.div
            className="absolute inset-0 rounded-full bg-destructive/35"
            animate={{ opacity: [0.35, 0.1, 0.35] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
          />
        )}
      </div>
    </div>
  );
}

export const HealthBar = memo(HealthBarBase);

export default HealthBar;
