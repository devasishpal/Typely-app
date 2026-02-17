import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { gameIconById } from '@/components/games/scenes/helpers';
import type { GameCardsGridSectionProps } from '@/components/games/scenes/types';
import { cn } from '@/lib/utils';

export default function GameCardsGridSection({ cards, activeGame, onSelectGame }: GameCardsGridSectionProps) {
  return (
    <section aria-label="Game Cards" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Choose A Game</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">4 Modes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = gameIconById[card.id];
          const active = card.id === activeGame;

          return (
            <motion.button
              type="button"
              key={card.id}
              onClick={() => onSelectGame(card.id)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.05, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.01 }}
              className={cn(
                'group relative overflow-hidden rounded-3xl border p-4 text-left shadow-card transition-all',
                active
                  ? 'border-primary/55 bg-primary/8 shadow-hover'
                  : 'border-border/60 bg-card/75 hover:border-primary/35 hover:bg-card'
              )}
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity', card.gradientClassName, active && 'opacity-100')} />

              <div className="relative z-10">
                <div className="mb-3 flex items-center justify-between">
                  <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-background/60', card.accentClassName)}>
                    <Icon className="h-5 w-5" />
                  </span>

                  {active ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success/45 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{card.playTimeLabel}</span>
                  )}
                </div>

                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>

                <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>

                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {card.objectives.map((objective) => (
                    <li key={objective} className="flex items-start gap-1">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/65" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {active ? 'Ready to launch' : 'Select game'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
