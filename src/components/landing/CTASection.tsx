import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { AnimatedButton } from '@/components/landing/AnimatedButton';
import { fadeUpVariant } from '@/components/landing/animations';

export function CTASection() {
  return (
    <section id="cta" className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8" aria-labelledby="cta-title">
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-120px 0px' }}
        className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-background/92 to-secondary/14 p-8 shadow-glow md:p-12"
      >
        <div className="pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 bottom-10 h-44 w-44 rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative z-[1] mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Start Today
          </span>
          <h2 id="cta-title" className="mt-4 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to train smarter and type with confidence?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Join Typely and build measurable speed and accuracy gains with a structured, professional training flow.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-4 sm:flex-row">
            <AnimatedButton to="/typing-test" size="lg" ariaLabel="Start typing as guest">
              Start Typing
              <ArrowRight className="h-5 w-5" />
            </AnimatedButton>
            <AnimatedButton to="/login" variant="outline" size="lg" ariaLabel="Sign in to Typely">
              Sign In
            </AnimatedButton>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
