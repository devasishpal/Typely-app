import { Check, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { comparisonPoints, landingFeatureHighlights } from '@/components/landing/data';
import { fadeUpVariant } from '@/components/landing/animations';

export default function FeaturesComparisonSection() {
  return (
    <section
      id="comparison"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="comparison-title"
    >
      <SectionHeading
        eyebrow="Feature Comparison"
        title="Why Typely stands out from traditional typing practice tools."
        description="A focused training stack with modern UX, actionable analytics, and structured progression."
      />

      <motion.div
        className="mt-10 overflow-hidden rounded-3xl border border-border/65 bg-background/80 shadow-card"
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-120px 0px' }}
      >
        <div className="hidden grid-cols-[1.1fr_1fr_1fr] border-b border-border/60 bg-muted/25 px-6 py-4 text-sm font-semibold text-muted-foreground md:grid">
          <span>Capability</span>
          <span className="text-primary">Typely</span>
          <span>Traditional Platforms</span>
        </div>

        {comparisonPoints.map((point) => (
          <div
            key={point.id}
            className="grid gap-3 border-b border-border/55 px-5 py-5 last:border-b-0 md:grid-cols-[1.1fr_1fr_1fr] md:gap-5 md:px-6"
          >
            <div className="space-y-1">
              <p className="font-semibold tracking-tight text-foreground">{point.feature}</p>
              <p className="text-sm text-muted-foreground">{point.description}</p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Check className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm text-foreground">{point.typely}</p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/25 p-3">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Minus className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm text-muted-foreground">{point.traditional}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-120px 0px' }}
      >
        {landingFeatureHighlights.map((highlight) => {
          const Icon = highlight.icon;
          return (
            <div key={highlight.id} className="rounded-xl border border-border/60 bg-background/70 p-4">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">{highlight.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{highlight.description}</p>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
