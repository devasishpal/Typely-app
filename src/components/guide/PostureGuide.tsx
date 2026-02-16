import { useMemo, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SectionShell } from '@/components/guide/SectionShell';
import { postureRules } from '@/components/guide/data';
import { cn } from '@/lib/utils';

interface PostureGuideProps {
  className?: string;
}

function PostureIllustration({ activeIndex }: { activeIndex: number }) {
  const isActive = (index: number) => activeIndex >= index;

  return (
    <div className="rounded-3xl border border-border/60 bg-background/75 p-4 shadow-card lg:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground sm:text-base">Scroll-Activated Posture Corrections</h3>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-background/80 to-muted/30 p-4">
        <svg viewBox="0 0 760 440" className="h-auto w-full" role="img" aria-label="Typing posture illustration">
          <title>Typing posture with good and bad alignment highlights</title>

          <defs>
            <linearGradient id="deskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.85" />
              <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          <rect x="110" y="280" width="540" height="36" rx="18" fill="url(#deskGradient)" />
          <rect x="200" y="120" width="130" height="84" rx="12" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
          <rect x="213" y="133" width="104" height="58" rx="8" fill="hsl(var(--muted)/0.5)" />

          <rect x="350" y="246" width="116" height="24" rx="12" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />

          <rect x="474" y="204" width="98" height="74" rx="24" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
          <rect x="474" y="278" width="98" height="96" rx="28" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />

          <circle cx="550" cy="138" r="36" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
          <path d="M550 174 C 525 208 520 255 520 280" stroke="hsl(var(--border))" strokeWidth="18" fill="none" strokeLinecap="round" />

          <path d="M520 220 C 492 222 470 236 454 254" stroke="hsl(var(--border))" strokeWidth="16" fill="none" strokeLinecap="round" />
          <path d="M520 220 C 548 222 576 236 588 252" stroke="hsl(var(--border))" strokeWidth="16" fill="none" strokeLinecap="round" />

          <path d="M520 280 C 506 318 508 354 512 390" stroke="hsl(var(--border))" strokeWidth="18" fill="none" strokeLinecap="round" />
          <path d="M548 280 C 560 320 562 354 558 390" stroke="hsl(var(--border))" strokeWidth="18" fill="none" strokeLinecap="round" />

          <line x1="546" y1="102" x2="546" y2="36" stroke={isActive(4) ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} strokeWidth="4" strokeDasharray="8 6" />
          <line x1="546" y1="102" x2="274" y2="160" stroke={isActive(4) ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} strokeWidth="3" strokeDasharray="6 5" />

          <circle cx="518" cy="224" r="16" fill={isActive(1) ? 'hsl(var(--success)/0.25)' : 'hsl(var(--destructive)/0.25)'} />
          <circle cx="454" cy="252" r="16" fill={isActive(2) ? 'hsl(var(--success)/0.25)' : 'hsl(var(--destructive)/0.25)'} />
          <circle cx="512" cy="390" r="16" fill={isActive(3) ? 'hsl(var(--success)/0.25)' : 'hsl(var(--destructive)/0.25)'} />
          <circle cx="550" cy="192" r="16" fill={isActive(0) ? 'hsl(var(--success)/0.25)' : 'hsl(var(--destructive)/0.25)'} />

          <text x="564" y="46" className="fill-muted-foreground text-[11px] font-semibold">Eye Level</text>
          <text x="494" y="208" className="fill-muted-foreground text-[11px] font-semibold">Back</text>
          <text x="436" y="280" className="fill-muted-foreground text-[11px] font-semibold">Wrists</text>
          <text x="504" y="414" className="fill-muted-foreground text-[11px] font-semibold">Feet</text>
        </svg>
      </div>
    </div>
  );
}

function PostureTimeline({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-card lg:p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground sm:text-base">Good vs Bad Posture Checklist</h3>
      <div className="space-y-3">
        {postureRules.map((rule, index) => {
          const isChecked = activeIndex >= index;
          return (
            <motion.article
              key={rule.id}
              className={cn(
                'rounded-2xl border p-4 transition-colors',
                isChecked ? 'border-success/35 bg-success/10' : 'border-destructive/25 bg-destructive/10'
              )}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <header className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground sm:text-base">{rule.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{rule.detail}</p>
                </div>
                <span
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-full border',
                    isChecked ? 'border-success/45 bg-success/15 text-success' : 'border-destructive/40 bg-destructive/15 text-destructive'
                  )}
                >
                  {isChecked ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </span>
              </header>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-destructive">Bad Posture</p>
                  <p className="mt-1 text-xs text-muted-foreground">{rule.bad}</p>
                </div>
                <div className="rounded-xl border border-success/30 bg-success/10 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-success">Correct Posture</p>
                  <p className="mt-1 text-xs text-muted-foreground">{rule.good}</p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

function PostureProgressMeter({ progress }: { progress: number }) {
  const progressPct = Math.min(100, Math.max(0, Math.round(progress * 100)));
  return (
    <div className="rounded-3xl border border-border/60 bg-background/75 p-4 shadow-card">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Posture Correction Progress</p>
        <p className="text-xs font-semibold text-primary">{progressPct}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/80">
        <motion.div
          className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--secondary))_0%,hsl(var(--primary))_100%)]"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Scroll through this section to activate each ergonomic correction checkpoint.
      </p>
    </div>
  );
}

export default function PostureGuide({ className }: PostureGuideProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 70%', 'end 25%'],
  });

  const clampedProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(clampedProgress, 'change', (latestProgress) => {
    const computedIndex = Math.min(postureRules.length - 1, Math.floor(latestProgress * postureRules.length));
    setActiveIndex(computedIndex);
  });

  const numericProgress = useMemo(() => {
    return Math.min(1, Math.max(0, (activeIndex + 1) / postureRules.length));
  }, [activeIndex]);

  return (
    <SectionShell
      id="guide-posture"
      title="Typing Posture Guide"
      subtitle="Proper ergonomics keeps you comfortable and efficient. As you scroll, each checkpoint transitions from risk to correction with red-to-green visual feedback."
      className={className}
    >
      <div ref={sectionRef} className="space-y-5">
        <PostureProgressMeter progress={numericProgress} />

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <PostureIllustration activeIndex={activeIndex} />
          <PostureTimeline activeIndex={activeIndex} />
        </div>
      </div>
    </SectionShell>
  );
}
