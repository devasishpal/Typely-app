import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { Gauge, Target } from 'lucide-react';
import { SectionShell } from '@/components/guide/SectionShell';
import { speedStrategySteps } from '@/components/guide/data';
import { cn } from '@/lib/utils';

interface SpeedStrategyProps {
  className?: string;
}

export default function SpeedStrategy({ className }: SpeedStrategyProps) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 75%', 'end 20%'],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.45,
  });

  const glowOpacity = useTransform(progress, [0, 1], [0.2, 0.95]);

  return (
    <SectionShell
      id="guide-speed-strategy"
      title="Typing Speed Strategy"
      subtitle="Follow a structured roadmap from precision to performance. Each phase builds on the previous one so speed gains remain stable under real typing conditions."
      className={className}
    >
      <div ref={timelineRef} className="relative">
        <div className="pointer-events-none absolute left-[20px] top-0 h-full w-[3px] rounded-full bg-border/60 sm:left-[24px]" />
        <motion.div
          className="pointer-events-none absolute left-[20px] top-0 w-[3px] rounded-full bg-[linear-gradient(180deg,hsl(var(--secondary))_0%,hsl(var(--primary))_40%,hsl(var(--accent))_100%)] sm:left-[24px]"
          style={{ height: useTransform(progress, [0, 1], ['0%', '100%']), opacity: glowOpacity }}
        />

        <div className="space-y-5">
          {speedStrategySteps.map((step, index) => (
            <motion.article
              key={step.id}
              className="relative pl-14 sm:pl-20"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <motion.span
                className={cn(
                  'absolute left-[12px] top-5 inline-flex h-4 w-4 items-center justify-center rounded-full border sm:left-[16px]',
                  'border-primary/50 bg-primary/25'
                )}
                animate={{
                  boxShadow: [
                    '0 0 0 0 hsl(var(--primary)/0.0)',
                    '0 0 0 8px hsl(var(--primary)/0.15)',
                    '0 0 0 0 hsl(var(--primary)/0.0)',
                  ],
                }}
                transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.12 }}
              />

              <div className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-card sm:p-5">
                <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>
                  </div>

                  <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {step.targetRange}
                  </div>
                </header>

                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{step.description}</p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {step.tacticalChecklist.map((checkItem) => (
                    <motion.div
                      key={`${step.id}-${checkItem}`}
                      className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-muted-foreground"
                      whileHover={{ x: 3 }}
                    >
                      {checkItem}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <motion.article
          className="rounded-2xl border border-border/70 bg-background/75 p-4 shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-primary" />
            Execution Rule
          </h3>
          <p className="text-sm text-muted-foreground">
            Never accelerate when control is unstable. If error rate spikes, step back one pace level, re-center finger mapping,
            and rebuild momentum.
          </p>
        </motion.article>

        <motion.article
          className="rounded-2xl border border-border/70 bg-background/75 p-4 shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.08 }}
        >
          <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Gauge className="h-4 w-4 text-secondary" />
            Measurement Rule
          </h3>
          <p className="text-sm text-muted-foreground">
            Track median WPM and sustained accuracy instead of one peak run. Reliable metrics provide a clearer signal of real progress.
          </p>
        </motion.article>
      </div>
    </SectionShell>
  );
}
