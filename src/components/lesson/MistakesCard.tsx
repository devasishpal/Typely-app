import { Sparkles, TriangleAlert } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import LessonCardWrapper from '@/components/lesson/LessonCardWrapper';

interface MistakesCardProps {
  mistakes: Array<{ key: string; total: number }>;
}

export default function MistakesCard({ mistakes }: MistakesCardProps) {
  return (
    <LessonCardWrapper className="border-white/15 bg-black/20" interactive>
      <CardContent className="space-y-3 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Top Mistakes</h4>

        {mistakes.length === 0 ? (
          <p className="inline-flex items-center rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.28)]">
            <Sparkles className="mr-2 h-4 w-4" />
            Clean run so far.
          </p>
        ) : (
          <div className="space-y-2">
            {mistakes.map((mistake) => (
              <div
                key={mistake.key}
                className="flex items-center justify-between rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2"
              >
                <p className="inline-flex items-center text-sm text-rose-100">
                  <TriangleAlert className="mr-1.5 h-4 w-4 text-rose-300" />
                  {mistake.key}
                </p>
                <span className="text-sm font-semibold text-rose-300">{mistake.total}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </LessonCardWrapper>
  );
}
