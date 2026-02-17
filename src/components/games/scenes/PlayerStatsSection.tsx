import { motion } from 'motion/react';
import { Clock3, Gauge, Medal, Trophy } from 'lucide-react';
import type { PlayerStatsSectionProps } from '@/components/games/scenes/types';
import { GAME_ID_TO_LABEL } from '@/components/games/constants';

const formatMinutes = (ms: number): string => `${(ms / 60000).toFixed(1)} min`;

export default function PlayerStatsSection({ stats, lastRun }: PlayerStatsSectionProps) {
  const overallAccuracy = stats.totalKeystrokes > 0 ? (stats.totalCorrectKeystrokes / stats.totalKeystrokes) * 100 : 0;

  return (
    <section className="space-y-3" aria-label="Player Stats">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Player Stats</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Local Saved</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-border/65 bg-card/75 p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Best Score</p>
          <p className="mt-2 text-2xl font-bold text-primary">{Math.round(stats.bestScore)}</p>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-border/65 bg-card/75 p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Highest WPM</p>
          <p className="mt-2 text-2xl font-bold text-accent">{Math.round(stats.highestWpm)}</p>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-border/65 bg-card/75 p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall Accuracy</p>
          <p className="mt-2 text-2xl font-bold text-success">{overallAccuracy.toFixed(1)}%</p>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-border/65 bg-card/75 p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Played</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{formatMinutes(stats.totalTimePlayedMs)}</p>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-border/65 bg-card/75 p-4 shadow-card">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Games Completed</p>
          <p className="mt-2 text-2xl font-bold text-warning">{stats.gamesCompleted}</p>
        </motion.div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/65 bg-card/75 p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold">Per-Game Records</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(stats.perGame).map(([id, game]) => (
              <div key={id} className="rounded-xl border border-border/60 bg-muted/35 p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-semibold text-foreground">{GAME_ID_TO_LABEL[id as keyof typeof GAME_ID_TO_LABEL]}</p>
                <p className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-primary" /> Best {Math.round(game.bestScore)}</p>
                <p className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5 text-accent" /> WPM {Math.round(game.highestWpm)}</p>
                <p className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-muted-foreground" /> {formatMinutes(game.totalTimePlayedMs)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/65 bg-card/75 p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold">Latest Run</p>
          {lastRun ? (
            <div className="rounded-xl border border-primary/35 bg-primary/8 p-4 text-sm">
              <p className="mb-1 font-semibold text-foreground">{GAME_ID_TO_LABEL[lastRun.gameId]}</p>
              <p className="text-muted-foreground">
                Score {Math.round(lastRun.score)} • WPM {Math.round(lastRun.wpm)} • Accuracy {lastRun.accuracy.toFixed(1)}%
              </p>
              <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-card/70 px-2 py-0.5 text-xs text-primary">
                <Medal className="h-3.5 w-3.5" /> Difficulty {lastRun.difficulty}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              Complete your first game to populate session highlights.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
