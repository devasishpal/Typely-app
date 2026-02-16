import { AnimatePresence, motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CardContent } from '@/components/ui/card';
import LessonCardWrapper from '@/components/lesson/LessonCardWrapper';
import { tipSwap } from '@/components/lesson/animations';
import type { CoachTip } from '@/data/coachTips';

interface CoachTipCardProps {
  tip: CoachTip;
  loadingNextTip: boolean;
}

const badgeStyle: Record<CoachTip['badge'], string> = {
  Flow: 'border-cyan-400/45 bg-cyan-500/15 text-cyan-200',
  Accuracy: 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200',
  Speed: 'border-amber-400/45 bg-amber-500/15 text-amber-200',
  Consistency: 'border-indigo-400/45 bg-indigo-500/15 text-indigo-200',
};

export default function CoachTipCard({ tip, loadingNextTip }: CoachTipCardProps) {
  return (
    <LessonCardWrapper className="border-white/15 bg-black/20" interactive>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Coach Tip</h4>
          <Badge className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeStyle[tip.badge]}`}>
            {tip.badge}
          </Badge>
        </div>

        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/85">
          Updates every 30s
        </p>

        <AnimatePresence mode="wait">
          {loadingNextTip ? (
            <motion.div key="loading" variants={tipSwap} initial="initial" animate="animate" exit="exit" className="mt-3 space-y-2">
              <Skeleton className="h-5 w-40 rounded-md bg-white/10" />
              <Skeleton className="h-4 w-full rounded-md bg-white/10" />
              <Skeleton className="h-4 w-[90%] rounded-md bg-white/10" />
            </motion.div>
          ) : (
            <motion.div key={tip.id} variants={tipSwap} initial="initial" animate="animate" exit="exit" className="mt-3">
              <h5 className="text-sm font-semibold text-foreground">{tip.title}</h5>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{tip.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </LessonCardWrapper>
  );
}
