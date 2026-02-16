import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { guideSectionVariant } from '@/components/guide/animations';
import { cn } from '@/lib/utils';

interface SectionShellProps {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}

export function SectionShell({ id, title, subtitle, children, className }: SectionShellProps) {
  return (
    <motion.section
      id={id}
      aria-labelledby={`${id}-title`}
      variants={guideSectionVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-border/60 bg-card/75 p-5 shadow-card backdrop-blur-sm sm:p-8 lg:p-10',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.08)_0%,transparent_45%),radial-gradient(circle_at_85%_80%,hsl(var(--secondary)/0.08)_0%,transparent_42%)]" />
      <div className="relative z-10 space-y-8">
        <header className="space-y-3">
          <p className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Typely Guide
          </p>
          <h2 id={`${id}-title`} className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
        </header>
        {children}
      </div>
    </motion.section>
  );
}
