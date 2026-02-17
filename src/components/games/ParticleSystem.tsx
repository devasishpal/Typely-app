import { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ParticleSystemProps } from '@/components/games/types';

function ParticleSystemBase({ particles }: ParticleSystemProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <AnimatePresence>
        {particles.map((particle) => {
          const lifeRatio = particle.lifeMs / particle.maxLifeMs;
          return (
            <motion.span
              key={particle.id}
              className="absolute rounded-full"
              initial={{ opacity: particle.alpha, scale: 0.4 }}
              animate={{
                x: particle.x + particle.velocityX * (1 - lifeRatio),
                y: particle.y + particle.velocityY * (1 - lifeRatio),
                opacity: Math.max(0, lifeRatio * particle.alpha),
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.12, ease: 'linear' }}
              style={{
                width: particle.size,
                height: particle.size,
                background: `hsla(${particle.hue} 100% 60% / ${Math.max(0.15, lifeRatio)})`,
                transform: 'translate3d(0,0,0)',
                willChange: 'transform, opacity',
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export const ParticleSystem = memo(ParticleSystemBase);

export default ParticleSystem;
