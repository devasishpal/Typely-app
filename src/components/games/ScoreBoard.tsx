import { memo } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Gauge, Trophy, Type } from 'lucide-react';
import { formatCompactNumber } from '@/components/games/utils/gameMath';
import type { ScoreBoardProps } from '@/components/games/types';

function ScoreBoardBase({ score, wpm, accuracy, mistakes, status }: ScoreBoardProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <motion.div
        className="rounded-2xl border border-border/60 bg-card/85 p-3 shadow-card"
        animate={{ boxShadow: status === 'running' ? 'var(--shadow-glow)' : 'var(--shadow-card)' }}
        transition={{ duration: 0.3 }}
      >
        <p className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> Score
        </p>
        <p className="text-lg font-bold text-foreground">{formatCompactNumber(score)}</p>
      </motion.div>

      <div className="rounded-2xl border border-border/60 bg-card/85 p-3 shadow-card">
        <p className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          <Gauge className="h-3.5 w-3.5" /> WPM
        </p>
        <p className="text-lg font-semibold text-primary">{Math.round(wpm)}</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/85 p-3 shadow-card">
        <p className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          <Type className="h-3.5 w-3.5" /> Accuracy
        </p>
        <p className="text-lg font-semibold text-success">{accuracy.toFixed(1)}%</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/85 p-3 shadow-card">
        <p className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" /> Mistakes
        </p>
        <p className="text-lg font-semibold text-destructive">{mistakes}</p>
      </div>
    </div>
  );
}

export const ScoreBoard = memo(ScoreBoardBase);

export default ScoreBoard;
