import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react';
import { Milestone } from 'lucide-react';
import { SectionShell } from '@/components/guide/SectionShell';
import { progressMilestones } from '@/components/guide/data';
import { cn } from '@/lib/utils';

interface ProgressPathProps {
  className?: string;
}

export default function ProgressPath({ className }: ProgressPathProps) {
  const journeyRef = useRef<HTMLDivElement | null>(null);
  const [reachedIndex, setReachedIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ['start 75%', 'end 20%'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.45,
  });

  useMotionValueEvent(smoothProgress, 'change', (value) => {
    const step = Math.min(progressMilestones.length - 1, Math.floor(value * progressMilestones.length));
    setReachedIndex(step);
  });

  const fillHeight = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  return (
    <SectionShell
      id="guide-progress-path"
      title="Animated Progress Path"
      subtitle="Track the long-form journey from setup to expert-level typing. As you scroll, the path fills and each milestone lights up to visualize progression."
      className={className}
    >
      <div ref={journeyRef} className="relative rounded-3xl border border-border/60 bg-background/75 p-4 shadow-card sm:p-6">
        <div className="pointer-events-none absolute left-8 top-8 h-[calc(100%-4rem)] w-[4px] rounded-full bg-border/60 md:left-12" />
        <motion.div
          className="pointer-events-none absolute left-8 top-8 w-[4px] rounded-full bg-[linear-gradient(180deg,hsl(var(--secondary))_0%,hsl(var(--primary))_35%,hsl(var(--accent))_70%,hsl(var(--success))_100%)] md:left-12"
          style={{ height: fillHeight }}
        />

        <div className="space-y-4">
          {progressMilestones.map((milestone, index) => {
            const isReached = index <= reachedIndex;
            return (
              <motion.article
                key={milestone.id}
                className="relative pl-12 sm:pl-16 md:pl-24"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.42, delay: index * 0.05 }}
              >
                <motion.span
                  className={cn(
                    'absolute left-[21px] top-5 inline-flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold md:left-[37px]',
                    isReached
                      ? 'border-primary/45 bg-primary/18 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.35)]'
                      : 'border-border/70 bg-card/80 text-muted-foreground'
                  )}
                  animate={
                    isReached
                      ? {
                          boxShadow: [
                            '0 0 0 0 hsl(var(--primary)/0)',
                            '0 0 0 8px hsl(var(--primary)/0.15)',
                            '0 0 0 0 hsl(var(--primary)/0)',
                          ],
                        }
                      : undefined
                  }
                  transition={{ duration: 2.3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                >
                  {index + 1}
                </motion.span>

                <div
                  className={cn(
                    'rounded-2xl border p-4 shadow-sm transition-colors sm:p-5',
                    isReached ? 'border-primary/30 bg-primary/8' : 'border-border/70 bg-card/80'
                  )}
                >
                  <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground">{milestone.title}</h3>
                    <span className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {milestone.metric}
                    </span>
                  </header>

                  <p className="text-sm font-medium text-muted-foreground">{milestone.subtitle}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{milestone.details}</p>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          className="mt-6 flex items-center gap-2 rounded-2xl border border-border/70 bg-card/80 p-3 text-sm text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <Milestone className="h-4 w-4 text-primary" aria-hidden="true" />
          Scroll progress powers this journey animation and reveals milestone activation states.
        </motion.div>
      </div>
    </SectionShell>
  );
}
