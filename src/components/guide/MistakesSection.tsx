import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, TriangleAlert } from 'lucide-react';
import { SectionShell } from '@/components/guide/SectionShell';
import { commonMistakes } from '@/components/guide/data';
import { cn } from '@/lib/utils';

interface MistakesSectionProps {
  className?: string;
}

export default function MistakesSection({ className }: MistakesSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(commonMistakes[0]?.id ?? null);

  return (
    <SectionShell
      id="guide-mistakes"
      title="Common Typing Mistakes"
      subtitle="These habits create friction, reduce confidence, and cap speed growth. Expand each card for a practical correction plan."
      className={className}
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {commonMistakes.map((mistake, index) => {
          const isExpanded = expandedId === mistake.id;

          return (
            <motion.article
              key={mistake.id}
              className={cn(
                'overflow-hidden rounded-2xl border bg-card/85 shadow-sm transition-all',
                isExpanded ? 'border-primary/35 shadow-card' : 'border-border/70'
              )}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              whileHover={{ y: -3, scale: 1.01 }}
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls={`mistake-panel-${mistake.id}`}
                onClick={() => setExpandedId((current) => (current === mistake.id ? null : mistake.id))}
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-destructive">
                    <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    Mistake {index + 1}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{mistake.title}</h3>
                  <p className="text-sm text-muted-foreground">{mistake.shortDescription}</p>
                </div>

                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border/70 bg-background/75 text-muted-foreground"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded ? (
                  <motion.div
                    id={`mistake-panel-${mistake.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden border-t border-border/60"
                  >
                    <div className="space-y-4 p-4 pt-3">
                      <p className="text-sm leading-relaxed text-muted-foreground">{mistake.detailedExplanation}</p>

                      <div className="rounded-xl border border-info/30 bg-info/10 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-info">Impact</p>
                        <p className="mt-1 text-sm text-muted-foreground">{mistake.impact}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Correction Plan</h4>
                        <ul className="mt-2 space-y-2">
                          {mistake.correctionPlan.map((planStep) => (
                            <li
                              key={`${mistake.id}-${planStep}`}
                              className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground"
                            >
                              {planStep}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </SectionShell>
  );
}
