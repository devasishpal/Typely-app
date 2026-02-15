import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion, useScroll, useSpring } from 'motion/react';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { fadeUpVariant } from '@/components/landing/animations';
import { timelineSteps } from '@/components/landing/data';
import { scrollToSection } from '@/components/landing/utils';
import { cn } from '@/lib/utils';

export function HowItWorksTimelineSection() {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 70%', 'end 20%'],
  });
  const progressY = useSpring(scrollYProgress, { stiffness: 160, damping: 28 });

  return (
    <section
      id="how-it-works"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="how-it-works-title"
    >
      <SectionHeading
        eyebrow="How It Works"
        title="A clear, modern workflow from first session to typing mastery."
        description="Typely combines guided onboarding, adaptive practice, and measurable progress into a consistent system you can trust."
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-120px 0px' }}
        variants={fadeUpVariant}
        className="mt-8 flex flex-wrap items-center justify-center gap-2"
      >
        {timelineSteps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => scrollToSection(step.id)}
            className="rounded-full border border-border/60 bg-background/75 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {step.anchorLabel}
          </button>
        ))}
      </motion.div>

      <div ref={timelineRef} className="relative mt-12">
        <div className="absolute left-5 top-2 hidden h-[calc(100%-2rem)] w-[2px] rounded-full bg-border/70 md:block" />
        <motion.div
          aria-hidden="true"
          className="absolute left-5 top-2 hidden h-[calc(100%-2rem)] w-[2px] origin-top rounded-full bg-gradient-primary md:block"
          style={{ scaleY: progressY }}
        />

        <div className="space-y-6 md:space-y-10">
          {timelineSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                id={step.id}
                key={step.id}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.55, delay: Math.min(index * 0.06, 0.2) }}
                className="group relative flex flex-col gap-3 md:pl-16"
                aria-label={`${step.number} ${step.title}`}
              >
                <div className="absolute left-0 top-3 hidden h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-background shadow-card md:flex">
                  <motion.span
                    className="absolute inset-0 rounded-full border border-primary/20"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }}
                  />
                  <span className="relative z-[1] text-xs font-semibold text-primary">{step.number}</span>
                </div>

                <div
                  className={cn(
                    'rounded-2xl border border-border/65 bg-background/75 p-5 shadow-card backdrop-blur-sm transition-all duration-300',
                    'hover:border-primary/30 hover:bg-background/92 hover:shadow-glow'
                  )}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Step {step.number}</p>
                      <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{step.description}</p>
                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      Guided progression
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
