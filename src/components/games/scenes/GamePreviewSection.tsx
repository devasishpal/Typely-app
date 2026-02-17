import { motion } from 'motion/react';
import type { GamePreviewSectionProps } from '@/components/games/scenes/types';
import { getGameLabel } from '@/components/games/scenes/helpers';

const previewNotes: Record<GamePreviewSectionProps['activeGame'], string> = {
  'falling-words': 'Words descend with accelerating pressure. Maintain combo by clearing clusters fast.',
  'speed-racer': 'Momentum system rewards clean streaks. Nitro engages after sustained accuracy.',
  'zombie-survival': 'Lane defense with wave spikes and boss units. Misses directly damage base integrity.',
  'target-practice': 'Moving target arena emphasizing one-pass precision and reaction control.',
};

export default function GamePreviewSection({ activeGame, difficulty }: GamePreviewSectionProps) {
  const isRacer = activeGame === 'speed-racer';
  const isZombie = activeGame === 'zombie-survival';
  const isRain = activeGame === 'falling-words';

  return (
    <section className="space-y-3" aria-label="Game Preview">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Game Preview</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Live Animation</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="relative overflow-hidden rounded-3xl border border-border/65 bg-card/75 p-4 shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

          <div className="relative z-10 h-52 overflow-hidden rounded-2xl border border-border/60 bg-background/60">
            {isRain && (
              <>
                {Array.from({ length: 15 }).map((_, index) => (
                  <motion.span
                    key={`drop-${index}`}
                    className="absolute rounded-lg border border-border/70 bg-card/80 px-2 py-1 text-[11px] font-semibold"
                    initial={{ y: -24, x: `${(index * 7) % 92}%`, opacity: 0 }}
                    animate={{ y: '120%', opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: 3 + (index % 5) * 0.4,
                      delay: index * 0.12,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'linear',
                    }}
                  >
                    type
                  </motion.span>
                ))}
              </>
            )}

            {isRacer && (
              <>
                <motion.div
                  className="absolute inset-x-0 bottom-0 top-8"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(to right, hsl(var(--muted-foreground) / 0.22) 0, hsl(var(--muted-foreground) / 0.22) 10px, transparent 10px, transparent 28px)',
                  }}
                  animate={{ backgroundPositionX: [0, 180] }}
                  transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                />
                <motion.div
                  className="absolute bottom-6 left-1/2 h-14 w-28 -translate-x-1/2 rounded-2xl border border-accent/45 bg-accent/20"
                  animate={{ x: [0, 12, -10, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 1.3, repeat: Number.POSITIVE_INFINITY }}
                />
              </>
            )}

            {isZombie && (
              <>
                {Array.from({ length: 4 }).map((_, lane) => (
                  <motion.div
                    key={`z-lane-${lane}`}
                    className="absolute left-3 right-3 h-px bg-border/60"
                    style={{ top: `${18 + lane * 22}%` }}
                  />
                ))}
                {Array.from({ length: 5 }).map((_, index) => (
                  <motion.div
                    key={`zombie-${index}`}
                    className="absolute rounded-xl border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px]"
                    style={{ top: `${16 + (index % 4) * 22}%` }}
                    animate={{ x: ['105%', '-12%'] }}
                    transition={{ duration: 3 + index * 0.35, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                  >
                    zombie
                  </motion.div>
                ))}
              </>
            )}

            {!isRain && !isRacer && !isZombie && (
              <>
                {Array.from({ length: 7 }).map((_, index) => (
                  <motion.div
                    key={`target-${index}`}
                    className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/45 bg-primary/10"
                    animate={{
                      x: [12 + index * 8, 40 + index * 6, 18 + index * 7],
                      y: [20 + index * 10, 40 + index * 5, 28 + index * 7],
                    }}
                    transition={{ duration: 2.4 + index * 0.25, repeat: Number.POSITIVE_INFINITY }}
                  />
                ))}
                <motion.div
                  className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                />
              </>
            )}
          </div>

          <div className="relative z-10 mt-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">{getGameLabel(activeGame)}</strong> • {difficulty}
            <p className="mt-1 text-xs">{previewNotes[activeGame]}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border/65 bg-card/75 p-4 shadow-card">
          <p className="mb-3 text-sm font-semibold">Preview Signals</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="rounded-xl border border-border/60 bg-muted/35 px-3 py-2">Staggered animation mirrors live gameplay pacing.</div>
            <div className="rounded-xl border border-border/60 bg-muted/35 px-3 py-2">GPU-accelerated transforms keep transitions fluid at 60fps.</div>
            <div className="rounded-xl border border-border/60 bg-muted/35 px-3 py-2">Difficulty setting adapts spawn and velocity curves in each game.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
