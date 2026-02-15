import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { testimonialData } from '@/components/landing/data';
import { cn } from '@/lib/utils';

const AUTOPLAY_MS = 4200;

export default function SocialProofSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const activeTestimonial = testimonialData[activeIndex] ?? testimonialData[0];
  const visibleAvatars = useMemo(
    () => testimonialData.slice(activeIndex, activeIndex + 5).concat(testimonialData.slice(0, 5)).slice(0, 5),
    [activeIndex]
  );

  useEffect(() => {
    if (paused) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonialData.length);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(interval);
  }, [paused]);

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % testimonialData.length);
  };

  const goToPrev = () => {
    setActiveIndex((current) => (current - 1 + testimonialData.length) % testimonialData.length);
  };

  return (
    <section
      id="social-proof"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="social-proof-title"
    >
      <SectionHeading
        eyebrow="Social Proof"
        title="Loved by learners, students, and professionals across different workflows."
        description="Real progress stories from people who improved speed, sharpened accuracy, and built lasting confidence with Typely."
      />

      <div
        className="mt-12 rounded-3xl border border-border/60 bg-gradient-to-br from-background/90 via-background/75 to-primary/10 p-4 shadow-card md:p-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={`star-${index}`} className="h-3.5 w-3.5 fill-current" />
            ))}
            <span className="ml-1 text-foreground">4.9/5 from active learners</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={goToPrev}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background/75 transition-colors hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next testimonial"
              onClick={goToNext}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-background/75 transition-colors hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-border/65 bg-background/80 p-5 md:p-7">
            <AnimatePresence mode="wait">
              <motion.article
                key={activeTestimonial.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
                aria-label={`${activeTestimonial.name} testimonial`}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Quote className="h-5 w-5" />
                </div>
                <p className="text-pretty text-base leading-relaxed text-foreground md:text-lg">
                  “{activeTestimonial.quote}”
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
                  <div>
                    <p className="text-sm font-semibold">{activeTestimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeTestimonial.role} · {activeTestimonial.company}
                    </p>
                  </div>
                  <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                    {activeTestimonial.progressLabel}
                  </span>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            {visibleAvatars.map((testimonial, index) => {
              const isActive = testimonial.id === activeTestimonial.id;
              return (
                <button
                  type="button"
                  key={`${testimonial.id}-${index}`}
                  onClick={() => setActiveIndex(testimonialData.findIndex((item) => item.id === testimonial.id))}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all',
                    isActive
                      ? 'border-primary/35 bg-primary/10 shadow-card'
                      : 'border-border/60 bg-background/75 hover:border-primary/25'
                  )}
                  aria-label={`View testimonial from ${testimonial.name}`}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                    {testimonial.avatarFallback}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{testimonial.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{testimonial.company}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {testimonialData.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to testimonial ${index + 1}`}
              className={cn(
                'h-2.5 rounded-full transition-all',
                activeIndex === index ? 'w-8 bg-primary' : 'w-2.5 bg-primary/25 hover:bg-primary/45'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
