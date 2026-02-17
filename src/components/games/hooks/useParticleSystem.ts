import { useCallback, useState } from 'react';
import type { ParticleEntity } from '@/components/games/types';
import { randomBetween, uid } from '@/components/games/utils/gameMath';

interface UseParticleSystemResult {
  particles: ParticleEntity[];
  spawnBurst: (x: number, y: number, hue?: number, count?: number) => void;
  updateParticles: (deltaMs: number) => void;
  clearParticles: () => void;
}

export const useParticleSystem = (): UseParticleSystemResult => {
  const [particles, setParticles] = useState<ParticleEntity[]>([]);

  const spawnBurst = useCallback((x: number, y: number, hue = 190, count = 14) => {
    setParticles((current) => {
      const created = Array.from({ length: count }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / count + randomBetween(-0.22, 0.22);
        const speed = randomBetween(40, 180);
        return {
          id: uid('particle'),
          x,
          y,
          velocityX: Math.cos(angle) * speed,
          velocityY: Math.sin(angle) * speed,
          lifeMs: randomBetween(320, 700),
          maxLifeMs: randomBetween(320, 700),
          size: randomBetween(3, 9),
          hue: hue + randomBetween(-16, 16),
          alpha: randomBetween(0.65, 1),
        } satisfies ParticleEntity;
      });

      return [...current, ...created].slice(-240);
    });
  }, []);

  const updateParticles = useCallback((deltaMs: number) => {
    setParticles((current) =>
      current
        .map((particle) => {
          const nextLife = particle.lifeMs - deltaMs;
          if (nextLife <= 0) return null;
          const gravity = 24;
          return {
            ...particle,
            x: particle.x + (particle.velocityX * deltaMs) / 1000,
            y: particle.y + (particle.velocityY * deltaMs) / 1000,
            velocityY: particle.velocityY + gravity * (deltaMs / 1000),
            lifeMs: nextLife,
          };
        })
        .filter((particle): particle is ParticleEntity => particle !== null)
    );
  }, []);

  const clearParticles = useCallback(() => {
    setParticles([]);
  }, []);

  return {
    particles,
    spawnBurst,
    updateParticles,
    clearParticles,
  };
};

export default useParticleSystem;
