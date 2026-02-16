import { motion } from 'motion/react';
import { authParticleVariants } from '@/utils/animations';

const PARTICLES = Array.from({ length: 18 }).map((_, index) => ({
  id: index,
  left: `${(index * 7.7 + 6) % 100}%`,
  size: index % 3 === 0 ? 3 : index % 3 === 1 ? 2 : 1.5,
  delay: (index % 7) * 0.45,
  duration: 5 + (index % 5) * 0.8,
}));

export default function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {PARTICLES.map((particle) => (
        <motion.span
          key={particle.id}
          variants={authParticleVariants}
          initial="initial"
          animate="animate"
          className="absolute bottom-[-40px] rounded-full bg-cyan-300/30"
          style={{
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
