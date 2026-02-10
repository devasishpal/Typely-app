import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, CheckCircle2, Trophy, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LessonWithProgress } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LessonCardProps {
  lesson: LessonWithProgress;
  onClick?: () => void;
  className?: string;
}

const difficultyColors = {
  beginner: 'bg-success text-success-foreground',
  intermediate: 'bg-warning text-warning-foreground',
  advanced: 'bg-destructive text-destructive-foreground',
};
const difficultyLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const categoryLabels = {
  home_row: 'Home Row',
  top_row: 'Top Row',
  bottom_row: 'Bottom Row',
  numbers: 'Numbers',
  special_chars: 'Special Characters',
  punctuation: 'Punctuation',
  combination: 'Combination',
};

export default function LessonCard({ lesson, onClick, className }: LessonCardProps) {
  const isCompleted = lesson.progress?.completed || false;
  const isLocked = lesson.is_locked;
  const attempts = lesson.progress?.attempts || 0;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-300 hover:shadow-hover card-hover',
        isLocked && 'opacity-60 cursor-not-allowed',
        isCompleted && 'border-success/60 border-2',
        className
      )}
      onClick={!isLocked ? onClick : undefined}
    >
      <CardHeader className="pb-1 pt-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {lesson.title}
              {isCompleted && <CheckCircle2 className="w-5 h-5 text-success" />}
              {isLocked && <Lock className="w-5 h-5 text-muted-foreground" />}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-3">
              {lesson.description}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
            <Badge className={difficultyColors[lesson.difficulty]}>
              {difficultyLabels[lesson.difficulty]}
            </Badge>
            {lesson.description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground hover:text-foreground hover:border-primary/60 hover:bg-primary/10 h-8 w-8 transition"
                    aria-label="Lesson description"
                  >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs text-sm">
                {lesson.description}
              </TooltipContent>
            </Tooltip>
          )}
            </div>
            <span className="inline-flex items-center justify-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-semibold text-foreground">
              {attempts} attempt{attempts !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-full pt-0 pb-2">
        <div className="flex flex-col h-full gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{categoryLabels[lesson.category]}</span>
            <span className="text-muted-foreground">Lesson {lesson.order_index}</span>
          </div>

          <div className="flex items-center justify-end text-xs text-muted-foreground">
            {isCompleted && (
              <div className="flex items-center gap-1 text-success">
                <Trophy className="w-3 h-3" />
                <span>Completed</span>
              </div>
            )}
          </div>

          {!isLocked && (
            <div className="text-center mt-auto pt-4">
              <div className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground px-4 py-2 rounded-md bg-gradient-primary shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-0.5">
                Start Practice
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
