import { memo } from 'react';
import { motion } from 'motion/react';
import type { ComboMeterProps } from '@/components/games/types';

function ComboMeterBase({ combo, maxCombo, multiplier }: ComboMeterProps) {
  const normalized = Math.min(1, combo / 30);
  return (
    <div className="rounded-2xl border border-border/60 bg-card/85 p-3 shadow-card">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>Combo Chain</span>
        <span className="font-semibold text-primary">x{multiplier.toFixed(1)}</span>
      </div>
      <div className="mb-2 flex items-baseline gap-2">
        <motion.span
          key={combo}
          initial={{ scale: 0.9, opacity: 0.4 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.16 }}
          className="text-xl font-semibold text-foreground tabular-nums"
        >
          {combo}
        </motion.span>
        <span className="text-xs text-muted-foreground">Best {maxCombo}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted/70">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-success via-primary to-accent"
          animate={{ width: `${Math.max(5, normalized * 100)}%` }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export const ComboMeter = memo(ComboMeterBase);

export default ComboMeter;
