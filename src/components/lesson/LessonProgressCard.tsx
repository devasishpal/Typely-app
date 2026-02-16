import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CardContent } from '@/components/ui/card';
import LessonCardWrapper from '@/components/lesson/LessonCardWrapper';
import { formatPercent } from '@/utils/formatUtils';
import { cn } from '@/lib/utils';

interface LessonProgressCardProps {
  contentCharacters: string[];
  currentIndex: number;
  progressPercent: number;
  errorFlashIndex: number | null;
  correctFlashIndex: number | null;
}

function getCharacterClassName(
  index: number,
  currentIndex: number,
  errorFlashIndex: number | null,
  correctFlashIndex: number | null
): string {
  if (index < currentIndex) {
    return 'text-cyan-100 dark:text-cyan-100 text-sky-700 drop-shadow-[0_0_8px_rgba(14,165,233,0.25)]';
  }

  if (index === errorFlashIndex) {
    return 'text-rose-300 bg-rose-500/25 animate-[shake_0.28s_ease-in-out]';
  }

  if (index === correctFlashIndex) {
    return 'text-emerald-200 bg-emerald-500/20 animate-[correctPulse_0.3s_ease-out]';
  }

  if (index === currentIndex) {
    return 'bg-cyan-400/25 text-cyan-100 border border-cyan-300/45 shadow-[0_0_14px_rgba(34,211,238,0.35)] animate-[lesson-current-pulse_1.1s_ease-in-out_infinite]';
  }

  return 'text-muted-foreground';
}

export default function LessonProgressCard({
  contentCharacters,
  currentIndex,
  progressPercent,
  errorFlashIndex,
  correctFlashIndex,
}: LessonProgressCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentCharRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!currentCharRef.current || !containerRef.current) return;

    currentCharRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [currentIndex]);

  return (
    <LessonCardWrapper className="min-h-[260px] border-white/15 bg-black/20" interactive>
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Lesson Progress</h3>
          <p className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-200">
            {formatPercent(progressPercent, 0)}
          </p>
        </div>

        <motion.div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10" initial={false}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.25, ease: [0.2, 1, 0.3, 1] }}
          />
        </motion.div>

        <div
          ref={containerRef}
          className="lesson-scrollbar relative min-h-[180px] flex-1 overflow-y-auto rounded-2xl border border-white/15 bg-black/25 px-4 py-4 scroll-smooth"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/35 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/35 to-transparent" />

          <p className="whitespace-pre-wrap font-mono text-xl leading-[2.1rem] tracking-[0.02em] text-foreground/90">
            {contentCharacters.map((char, index) => {
              const isActive = index === currentIndex;
              const displayChar = char === ' ' ? '\u00A0' : char === '\n' ? '\u23CE\n' : char;

              return (
                <span
                  key={`${char}-${index}`}
                  ref={isActive ? currentCharRef : null}
                  className={cn(
                    'relative rounded-md px-0.5 py-[1px] transition-all duration-150',
                    getCharacterClassName(index, currentIndex, errorFlashIndex, correctFlashIndex)
                  )}
                >
                  {displayChar}
                  {isActive ? (
                    <span className="ml-[1px] inline-block h-5 w-[2px] align-middle bg-cyan-200 animate-[lesson-caret-blink_1s_steps(1)_infinite]" />
                  ) : null}
                </span>
              );
            })}
          </p>
        </div>
      </CardContent>
    </LessonCardWrapper>
  );
}
