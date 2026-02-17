import { memo } from 'react';
import { motion } from 'motion/react';
import { formatTimeMs } from '@/components/games/utils/gameMath';
import type { GameTimerProps } from '@/components/games/types';

function GameTimerBase({ elapsedMs, maxMs, status }: GameTimerProps) {
  const remainingMs = typeof maxMs === 'number' ? Math.max(0, maxMs - elapsedMs) : null;
  const label = remainingMs !== null ? formatTimeMs(remainingMs) : formatTimeMs(elapsedMs);
  const progress =
    typeof maxMs === 'number' && maxMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / maxMs) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/85 p-3 shadow-card backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span>{remainingMs !== null ? 'Time Left' : 'Elapsed'}</span>
        <span className="font-semibold text-foreground">{status === 'paused' ? 'Paused' : 'Live'}</span>
      </div>
      <div className="flex items-center gap-3">
        <motion.span
          key={label}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-lg font-semibold tabular-nums"
        >
          {label}
        </motion.span>
        {remainingMs !== null && (
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted/70">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-accent to-secondary"
              animate={{ width: `${100 - progress}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const GameTimer = memo(GameTimerBase);

export default GameTimer;
