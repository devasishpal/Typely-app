import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AchievementWithStatus } from '@/types';

interface AchievementBadgeProps {
  achievement: AchievementWithStatus;
  className?: string;
}

export default function AchievementBadge({ achievement, className }: AchievementBadgeProps) {
  const isEarned = achievement.earned;

  return (
    <Card
      className={cn(
        'h-full transition-all duration-300',
        isEarned ? 'border-primary shadow-card' : 'opacity-60',
        className
      )}
    >
      <CardContent className="p-4 h-full">
        <div className="flex h-full flex-col items-center text-center gap-2">
          <div
            className={cn(
              'w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300',
              isEarned ? 'bg-primary/10 scale-100' : 'bg-muted scale-90'
            )}
            style={isEarned ? { backgroundColor: `${achievement.badge_color}20` } : undefined}
          >
            {isEarned ? achievement.icon : <Lock className="w-8 h-8 text-muted-foreground" />}
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-sm flex items-center justify-center gap-1">
              {achievement.title}
              {isEarned && <CheckCircle2 className="w-4 h-4 text-success" />}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 break-words">
              {achievement.description}
            </p>
          </div>

          <Badge
            variant={isEarned ? 'default' : 'secondary'}
            className="text-xs"
          >
            {achievement.requirement_type === 'lessons_completed' && `${achievement.requirement_value} Lessons`}
            {achievement.requirement_type === 'wpm' && `${achievement.requirement_value} WPM`}
            {achievement.requirement_type === 'accuracy' && `${achievement.requirement_value}% Accuracy`}
            {achievement.requirement_type === 'sessions' && `${achievement.requirement_value} Sessions`}
          </Badge>

          {isEarned && achievement.earned_at && (
            <p className="text-xs text-muted-foreground">
              Earned {new Date(achievement.earned_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
