import { motion } from 'motion/react';
import { CardContent } from '@/components/ui/card';
import LessonCardWrapper from '@/components/lesson/LessonCardWrapper';
import { formatPercent } from '@/utils/formatUtils';

interface FocusMeterCardProps {
  progressPercent: number;
}

export default function FocusMeterCard({ progressPercent }: FocusMeterCardProps) {
  return (
    <LessonCardWrapper className="border-white/15 bg-black/20" interactive>
      <CardContent className="space-y-3 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Focus Meter</h4>

        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.32, ease: [0.2, 1, 0.3, 1] }}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{formatPercent(progressPercent)}</span> lesson completion
        </p>
      </CardContent>
    </LessonCardWrapper>
  );
}
