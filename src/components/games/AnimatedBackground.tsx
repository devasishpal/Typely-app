import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { AnimatedBackgroundProps } from '@/components/games/types';

function AnimatedBackgroundBase({ gameId, intensity, speed, paused = false }: AnimatedBackgroundProps) {
  const drift = paused ? 0 : Math.max(6, speed * 0.15);
  const opacity = Math.max(0.18, Math.min(0.9, intensity));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <motion.div
        className={cn(
          'absolute -left-16 -top-20 h-64 w-64 rounded-full blur-3xl',
          gameId === 'falling-words' && 'bg-primary/25',
          gameId === 'speed-racer' && 'bg-accent/25',
          gameId === 'zombie-survival' && 'bg-success/25',
          gameId === 'target-practice' && 'bg-warning/25'
        )}
        animate={{
          x: [0, 20 * drift, -12 * drift, 0],
          y: [0, 16 * drift, -6 * drift, 0],
          opacity: [opacity * 0.8, opacity, opacity * 0.75, opacity * 0.8],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className={cn(
          'absolute -bottom-16 -right-12 h-72 w-72 rounded-full blur-3xl',
          gameId === 'falling-words' && 'bg-secondary/20',
          gameId === 'speed-racer' && 'bg-primary/20',
          gameId === 'zombie-survival' && 'bg-destructive/20',
          gameId === 'target-practice' && 'bg-accent/20'
        )}
        animate={{
          x: [0, -24 * drift, 10 * drift, 0],
          y: [0, -18 * drift, 7 * drift, 0],
          opacity: [opacity * 0.7, opacity * 0.95, opacity * 0.75, opacity * 0.7],
        }}
        transition={{
          duration: 15,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.08) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
        animate={paused ? { opacity: 0.16 } : { backgroundPositionX: [0, 26], backgroundPositionY: [0, 26], opacity: [0.1, 0.2, 0.1] }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />
    </div>
  );
}

export const AnimatedBackground = memo(AnimatedBackgroundBase);

export default AnimatedBackground;
