import { motion } from 'motion/react';
import { ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CTASectionProps {
  className?: string;
}

export default function CTASection({ className }: CTASectionProps) {
  const navigate = useNavigate();

  return (
    <motion.section
      id="guide-cta"
      aria-labelledby="guide-cta-title"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 px-5 py-10 shadow-glow backdrop-blur sm:px-8 sm:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(var(--primary)/0.2),transparent_45%),radial-gradient(circle_at_80%_80%,hsl(var(--secondary)/0.2),transparent_45%)]" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-5 text-center">
          <p className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Ready To Train
          </p>
          <h2 id="guide-cta-title" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Build Fast, Accurate Typing Habits With Daily Practice
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Apply everything from this guide inside your Typely dashboard and practice with focused sessions that improve speed without sacrificing accuracy.
          </p>

          <motion.button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="group mx-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-primary/35 bg-primary/15 px-7 py-3.5 text-base font-semibold text-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_10px_24px_-12px_hsl(var(--primary)/0.6)] transition-colors hover:bg-primary hover:text-primary-foreground"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              boxShadow: [
                '0 0 0 1px hsl(var(--primary)/0.2), 0 10px 24px -12px hsl(var(--primary)/0.45)',
                '0 0 0 1px hsl(var(--primary)/0.4), 0 14px 30px -12px hsl(var(--primary)/0.65)',
                '0 0 0 1px hsl(var(--primary)/0.2), 0 10px 24px -12px hsl(var(--primary)/0.45)',
              ],
            }}
            transition={{ duration: 2.3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            aria-label="Start practicing now and open dashboard"
          >
            Start Practicing Now
            <ArrowRightCircle className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
