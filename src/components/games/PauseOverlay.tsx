import { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PauseOverlayProps } from '@/components/games/types';

function PauseOverlayBase({ open, onResume, onRestart, onBack }: PauseOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-background/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl border border-border/70 bg-card/90 p-6 shadow-card"
            initial={{ y: 8, opacity: 0.6, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 6, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary">
                <Pause className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Game Paused</h3>
                <p className="text-sm text-muted-foreground">Take a breath and resume when ready.</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Button onClick={onResume}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
              <Button variant="outline" onClick={onRestart}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restart
              </Button>
              <Button variant="ghost" onClick={onBack}>
                <X className="mr-2 h-4 w-4" />
                Back To Hub
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const PauseOverlay = memo(PauseOverlayBase);

export default PauseOverlay;
