import { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameOverModalProps } from '@/components/games/types';

function GameOverModalBase({
  open,
  title,
  subtitle,
  score,
  wpm,
  accuracy,
  maxCombo,
  onRestart,
  onBack,
}: GameOverModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-background/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg rounded-3xl border border-border/70 bg-card/95 p-6 shadow-hover"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold gradient-text">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary">
                <Trophy className="h-5 w-5" />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Score</p>
                <p className="mt-1 text-xl font-semibold">{Math.round(score)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">WPM</p>
                <p className="mt-1 text-xl font-semibold">{Math.round(wpm)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Accuracy</p>
                <p className="mt-1 text-xl font-semibold">{accuracy.toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Max Combo</p>
                <p className="mt-1 text-xl font-semibold">{maxCombo}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onBack} className="sm:min-w-36">
                <X className="mr-2 h-4 w-4" />
                Back To Hub
              </Button>
              <Button onClick={onRestart} className="sm:min-w-36">
                <RotateCcw className="mr-2 h-4 w-4" />
                Play Again
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const GameOverModal = memo(GameOverModalBase);

export default GameOverModal;
