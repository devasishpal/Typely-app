import type { ComponentType } from 'react';
import { motion } from 'motion/react';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { statsCounterData } from '@/components/landing/data';
import { useCountUp } from '@/components/landing/hooks/useCountUp';
import { useInViewport } from '@/components/landing/hooks/useInViewport';
import { formatCompactNumber } from '@/components/landing/utils';

function StatCard({
  target,
  duration,
  prefix,
  suffix,
  label,
  description,
  icon: Icon,
  inView,
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  inView: boolean;
}) {
  const rawValue = useCountUp({ target, duration, start: inView });
  const displayNumber =
    target >= 1000 ? formatCompactNumber(Math.round(rawValue)) : Math.round(rawValue).toString();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-90px 0px' }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border/65 bg-background/75 p-5 shadow-card backdrop-blur-sm"
      aria-label={label}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Live metric</span>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-foreground">
        {prefix}
        {displayNumber}
        {suffix}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.article>
  );
}

export default function StatsCounterSection() {
  const { ref, inView } = useInViewport<HTMLDivElement>({ threshold: 0.2, rootMargin: '-60px', once: true });

  return (
    <section id="stats" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="stats-title">
      <SectionHeading
        eyebrow="Results"
        title="Measurable outcomes backed by consistent daily training."
        description="Typely helps learners maintain momentum and convert focused practice into long-term performance gains."
      />

      <div ref={ref} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCounterData.map((item) => (
          <StatCard
            key={item.id}
            target={item.value}
            duration={item.duration}
            prefix={item.prefix}
            suffix={item.suffix}
            label={item.label}
            description={item.description}
            icon={item.icon}
            inView={inView}
          />
        ))}
      </div>
    </section>
  );
}
