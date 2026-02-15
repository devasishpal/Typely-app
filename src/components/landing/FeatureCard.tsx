import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { FeatureCardData, FeatureAccent } from '@/components/landing/types';
import { cn } from '@/lib/utils';
import { clamp } from '@/components/landing/utils';

interface FeatureCardProps {
  feature: FeatureCardData;
  index: number;
}

const accentClassMap: Record<FeatureAccent, string> = {
  primary: 'text-primary bg-primary/10 border-primary/20',
  secondary: 'text-secondary bg-secondary/10 border-secondary/20',
  accent: 'text-accent bg-accent/10 border-accent/20',
  success: 'text-success bg-success/10 border-success/20',
  info: 'text-info bg-info/10 border-info/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
};

export function FeatureCard({ feature, index }: FeatureCardProps) {
  const reduceMotion = useReducedMotion();
  const Icon = feature.icon;
  const [tiltStyle, setTiltStyle] = useState<{ rotateX: number; rotateY: number }>({
    rotateX: 0,
    rotateY: 0,
  });

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const targetElement = event.currentTarget;
    const rect = targetElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateY = clamp((event.clientX - centerX) / 20, -5, 5);
    const rotateX = clamp((centerY - event.clientY) / 22, -5, 5);
    setTiltStyle({ rotateX, rotateY });
  };

  const resetTilt = () => {
    setTiltStyle({ rotateX: 0, rotateY: 0 });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-120px 0px' }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.35) }}
      whileHover={reduceMotion ? undefined : { y: -10, scale: 1.01 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={reduceMotion ? undefined : { rotateX: tiltStyle.rotateX, rotateY: tiltStyle.rotateY }}
      className={cn(
        'group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-background/70 p-6 shadow-card backdrop-blur-md transition-all duration-300',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:border before:border-primary/0 before:opacity-0 before:transition-opacity before:duration-300 hover:before:border-primary/30 hover:before:opacity-100',
        'after:pointer-events-none after:absolute after:inset-x-6 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/50 after:to-transparent'
      )}
      role="article"
      aria-label={feature.title}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-70" />
      <div className="relative z-[1] flex h-full flex-col gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl border shadow-inner transition-transform duration-300 group-hover:scale-110',
            accentClassMap[feature.accent]
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{feature.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{feature.description}</p>
      </div>
    </motion.article>
  );
}
