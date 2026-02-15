import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Gauge, Keyboard, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { demoKeyboardRows, typingDemoSentences } from '@/components/landing/data';
import { fadeUpVariant, staggerParentVariant } from '@/components/landing/animations';
import { toPercentage } from '@/components/landing/utils';
import { cn } from '@/lib/utils';

const TYPING_INTERVAL_MS = 92;
const SENTENCE_PAUSE_MS = 900;
const MAX_VISIBLE_CHARS = 88;

const normalizeToKey = (rawChar: string) => {
  if (!rawChar) return '';
  const char = rawChar.toUpperCase();
  if (char === ' ') return 'SPACE';
  if (char === '\n') return 'ENTER';
  return char;
};

const statsCards = [
  { id: 'wpm', label: 'WPM', icon: Gauge },
  { id: 'accuracy', label: 'Accuracy', icon: ShieldCheck },
  { id: 'streak', label: 'Focus Streak', icon: Activity },
  { id: 'keys', label: 'Live Keys', icon: Keyboard },
] as const;

export default function TypingDemoSection() {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const [typingWpm, setTypingWpm] = useState(73);
  const [accuracy, setAccuracy] = useState(96.2);
  const [focusStreak, setFocusStreak] = useState(18);

  const sentence = typingDemoSentences[sentenceIndex % typingDemoSentences.length] ?? '';
  const typedText = sentence.slice(0, typedCount);
  const remainingText = sentence.slice(typedCount);
  const progress = toPercentage(typedCount, 0, sentence.length || 1);
  const activeKey = normalizeToKey(sentence[typedCount] ?? ' ');

  const recentText = useMemo(() => {
    if (typedText.length <= MAX_VISIBLE_CHARS) {
      return typedText;
    }
    return typedText.slice(typedText.length - MAX_VISIBLE_CHARS);
  }, [typedText]);

  useEffect(() => {
    if (typedCount >= sentence.length) return;

    const timeout = window.setTimeout(() => {
      const next = typedCount + 1;
      const completion = next / Math.max(sentence.length, 1);
      setTypedCount(next);
      setTypingWpm(Math.round(68 + Math.sin(Date.now() / 780) * 7 + completion * 12));
      setAccuracy(Number((95.2 + Math.cos(Date.now() / 1220) * 1.2).toFixed(1)));
      setFocusStreak((current) => {
        const candidate = current + (next % 18 === 0 ? 1 : 0);
        return Math.min(candidate, 42);
      });
    }, TYPING_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [sentence.length, typedCount]);

  useEffect(() => {
    if (typedCount < sentence.length) return;

    const timeout = window.setTimeout(() => {
      setSentenceIndex((current) => (current + 1) % typingDemoSentences.length);
      setTypedCount(0);
    }, SENTENCE_PAUSE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [sentence.length, typedCount]);

  return (
    <section
      id="typing-demo"
      className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="typing-demo-title"
    >
      <SectionHeading
        eyebrow="Live Typing Demo"
        title="Watch Typely simulate a focused, high-performance typing session."
        description="Preview how the typing engine tracks speed, accuracy, and active key guidance in real time."
      />

      <motion.div
        variants={staggerParentVariant(0.12, 0.05)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-120px 0px' }}
        className="mt-12 grid gap-5 lg:grid-cols-[1.6fr_1fr]"
      >
        <motion.article
          variants={fadeUpVariant}
          className="overflow-hidden rounded-3xl border border-primary/20 bg-brand-navy/95 p-6 text-white shadow-2xl"
          aria-label="Typing demo panel"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/65">Session playback</p>
              <h3 className="text-xl font-semibold">Guided typing stream</h3>
            </div>
            <span className="inline-flex items-center rounded-full border border-success/35 bg-success/15 px-3 py-1 text-xs font-medium text-success">
              Live
            </span>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/5 p-4 md:p-5">
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="font-mono text-sm leading-relaxed text-white/75 md:text-base">
                <span className="text-success">{recentText}</span>
                <span className="inline-block h-5 w-[2px] animate-pulse bg-white align-middle" />
                <span className="text-white/45">{remainingText}</span>
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/65">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2.5 bg-white/12 [&>div]:bg-gradient-to-r [&>div]:from-secondary [&>div]:to-primary" />
            </div>
          </div>

          <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black/25 p-4">
            {demoKeyboardRows.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex flex-wrap justify-center gap-1.5">
                {row.map((key) => {
                  const isActive = key.value.toUpperCase() === activeKey;
                  return (
                    <span
                      key={key.id}
                      className={cn(
                        'inline-flex h-8 items-center justify-center rounded-md border border-white/15 bg-white/6 px-2 text-xs font-semibold text-white/75 transition-all duration-200',
                        key.widthClass ?? 'min-w-[2rem]',
                        isActive && 'scale-105 border-secondary/55 bg-secondary/30 text-white shadow-[0_0_0_1px_hsl(var(--secondary)/0.35),0_10px_20px_-12px_hsl(var(--secondary)/0.95)]'
                      )}
                    >
                      {key.value}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.article>

        <motion.aside variants={fadeUpVariant} className="space-y-4" aria-label="Typing demo stats">
          {statsCards.map((card) => {
            const Icon = card.icon;
            let valueNode: React.ReactNode = null;

            if (card.id === 'wpm') {
              valueNode = <span className="text-2xl font-semibold text-foreground">{typingWpm}</span>;
            }
            if (card.id === 'accuracy') {
              valueNode = <span className="text-2xl font-semibold text-foreground">{accuracy}%</span>;
            }
            if (card.id === 'streak') {
              valueNode = <span className="text-2xl font-semibold text-foreground">{focusStreak} min</span>;
            }
            if (card.id === 'keys') {
              valueNode = <span className="text-2xl font-semibold text-foreground">{activeKey || 'SPACE'}</span>;
            }

            return (
              <div
                key={card.id}
                className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-card backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-3">{valueNode}</div>
              </div>
            );
          })}
        </motion.aside>
      </motion.div>
    </section>
  );
}
