import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Timer } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import LessonCardWrapper from '@/components/lesson/LessonCardWrapper';
import { formatTimer } from '@/utils/formatUtils';

interface LessonStatsCardProps {
  wpm: number;
  accuracy: number;
  errorRate: number;
  errorCount: number;
  elapsedMs: number;
}

function useAnimatedCounter(target: number, duration = 420): number {
  const [display, setDisplay] = useState<number>(target);
  const frameRef = useRef<number | null>(null);
  const previousValueRef = useRef<number>(target);

  useEffect(() => {
    const start = performance.now();
    const from = previousValueRef.current;
    const delta = target - from;

    if (Math.abs(delta) < 0.0001) {
      setDisplay(target);
      return;
    }

    const update = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + delta * eased);

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(update);
      } else {
        previousValueRef.current = target;
      }
    };

    frameRef.current = window.requestAnimationFrame(update);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, duration]);

  return display;
}

function StatCapsule({
  label,
  value,
  suffix,
  toneClass,
}: {
  label: string;
  value: number;
  suffix?: string;
  toneClass: string;
}) {
  const animated = useAnimatedCounter(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    setFlash(true);
    const timeout = window.setTimeout(() => setFlash(false), 180);
    return () => window.clearTimeout(timeout);
  }, [value]);

  return (
    <motion.div
      className={`rounded-2xl border border-white/15 bg-white/5 p-2.5 shadow-inner transition-all ${toneClass} ${flash ? 'scale-[1.01]' : ''}`}
      animate={flash ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 0.26, ease: [0.2, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {suffix === '%' ? animated.toFixed(1) : Math.round(animated)}
          {suffix ?? ''}
        </p>
      </div>
    </motion.div>
  );
}

export default function LessonStatsCard({ wpm, accuracy, errorRate, errorCount, elapsedMs }: LessonStatsCardProps) {
  return (
    <LessonCardWrapper className="h-full border-white/15 bg-black/20" interactive>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Live Stats</p>
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-foreground">
            <Timer className="mr-1 h-3.5 w-3.5" />
            {formatTimer(elapsedMs)}
          </span>
        </div>

        <div className="space-y-2.5">
          <StatCapsule label="WPM" value={wpm} toneClass="hover:border-cyan-400/40" />
          <StatCapsule label="Accuracy" value={accuracy} suffix="%" toneClass="hover:border-emerald-400/40" />
          <StatCapsule label="Error Rate" value={errorRate} suffix="%" toneClass="hover:border-rose-400/40" />
          <StatCapsule label="Error Count" value={errorCount} toneClass="hover:border-amber-400/40" />
        </div>
      </CardContent>
    </LessonCardWrapper>
  );
}
