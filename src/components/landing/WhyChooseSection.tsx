import { motion } from 'motion/react';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { fadeUpVariant, staggerParentVariant } from '@/components/landing/animations';
import { motionCards, whyChooseFeatures } from '@/components/landing/data';

export function WhyChooseSection() {
  return (
    <section
      id="why-typely"
      className="relative isolate mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="why-typely-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[1] rounded-[2.2rem]"
        style={{
          background:
            'linear-gradient(180deg, hsl(var(--primary)/0.08) 0%, hsl(var(--background)/0.08) 52%, hsl(var(--secondary)/0.08) 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-12 top-0 -z-[1] h-56 rounded-full bg-primary/15 blur-3xl" />

      <SectionHeading
        eyebrow="Why Choose Typely"
        title="A polished, data-driven typing experience built for real outcomes."
        description="Every lesson, feedback surface, and progression cue is designed to improve typing speed, increase precision, and sustain confidence over time."
      />

      <motion.div
        className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        variants={staggerParentVariant(0.1, 0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-120px 0px' }}
      >
        {whyChooseFeatures.map((feature, index) => (
          <FeatureCard key={feature.id} feature={feature} index={index} />
        ))}
      </motion.div>

      <motion.div
        className="mt-12 grid gap-4 rounded-2xl border border-border/60 bg-background/70 p-4 shadow-card backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4"
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-120px 0px' }}
      >
        {motionCards.map((motionCard) => {
          const Icon = motionCard.icon;
          return (
            <div key={motionCard.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/85 p-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/12 text-secondary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-foreground">{motionCard.label}</span>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
