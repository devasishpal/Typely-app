import { motion } from 'motion/react';
import { Crown, Medal } from 'lucide-react';
import type { LeaderboardSectionProps } from '@/components/games/scenes/types';
import { cn } from '@/lib/utils';

export default function LeaderboardSection({ leaderboard, activeGame, difficulty }: LeaderboardSectionProps) {
  const rows = leaderboard
    .filter((entry) => entry.gameId === activeGame)
    .filter((entry) => entry.difficulty === difficulty || entry.isCurrentPlayer)
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : b.wpm - a.wpm))
    .slice(0, 10)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return (
    <section className="space-y-3" aria-label="Leaderboard">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Local Leaderboard</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Simulated + Personal</p>
      </div>

      <div className="rounded-3xl border border-border/65 bg-card/75 p-4 shadow-card">
        <div className="mb-3 grid grid-cols-[56px_1fr_100px_90px] gap-2 rounded-xl border border-border/60 bg-muted/25 px-3 py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-right">Score</span>
          <span className="text-right">WPM</span>
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => (
            <motion.div
              key={`${row.id}-${row.rank}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.04, duration: 0.28 }}
              className={cn(
                'grid grid-cols-[56px_1fr_100px_90px] items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                row.isCurrentPlayer
                  ? 'border-primary/45 bg-primary/10 shadow-glow'
                  : 'border-border/60 bg-background/60'
              )}
            >
              <span className="font-semibold text-foreground">
                {row.rank === 1 ? (
                  <span className="inline-flex items-center gap-1 text-warning">
                    <Crown className="h-4 w-4" /> #1
                  </span>
                ) : row.rank === 2 || row.rank === 3 ? (
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Medal className="h-4 w-4" /> #{row.rank}
                  </span>
                ) : (
                  `#${row.rank}`
                )}
              </span>

              <span className="truncate font-medium text-foreground">
                {row.playerName} {row.isCurrentPlayer ? <em className="ml-1 text-xs text-primary">(You)</em> : null}
              </span>

              <span className="text-right font-semibold text-foreground">{Math.round(row.score)}</span>
              <span className="text-right text-muted-foreground">{Math.round(row.wpm)}</span>
            </motion.div>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/25 px-3 py-8 text-center text-sm text-muted-foreground">
            No entries yet for this game and difficulty. Complete a run to place on the board.
          </div>
        )}
      </div>
    </section>
  );
}
