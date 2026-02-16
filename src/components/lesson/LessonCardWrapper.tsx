import { forwardRef } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LessonCardWrapperProps {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
}

const MotionCard = motion(Card);

const LessonCardWrapper = forwardRef<HTMLDivElement, LessonCardWrapperProps>(
  ({ className, children, interactive = false }, ref) => {
    return (
      <MotionCard
        ref={ref}
        className={cn(
          'lesson-card-glow rounded-3xl border bg-card/60 backdrop-blur-xl transition-all duration-300',
          interactive &&
            'hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(37,99,235,0.24)] hover:border-primary/50',
          className
        )}
        whileHover={interactive ? { y: -2 } : undefined}
        transition={{ duration: 0.22, ease: [0.2, 1, 0.3, 1] }}
      >
        {children}
      </MotionCard>
    );
  }
);

LessonCardWrapper.displayName = 'LessonCardWrapper';

export default LessonCardWrapper;
