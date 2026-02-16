import { motion } from 'motion/react';
import type { CSSProperties, PointerEvent, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { authCardSpringVariants } from '@/utils/animations';

interface AuthCardProps {
  className?: string;
  children: ReactNode;
  tiltStyle?: CSSProperties;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: () => void;
}

const MotionCard = motion(Card);

export default function AuthCard({
  className,
  children,
  tiltStyle,
  onPointerMove,
  onPointerLeave,
}: AuthCardProps) {
  return (
    <MotionCard
      variants={authCardSpringVariants}
      initial="hidden"
      animate="visible"
      className={cn('auth-premium-card auth-card-float', className)}
      style={tiltStyle}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      {children}
    </MotionCard>
  );
}
