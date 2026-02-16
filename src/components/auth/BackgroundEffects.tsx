import { motion } from 'motion/react';
import { authBlobVariants } from '@/utils/animations';

export default function BackgroundEffects() {
  return (
    <>
      <div className="auth-vignette pointer-events-none absolute inset-0 z-0" />
      <div className="auth-noise-overlay pointer-events-none absolute inset-0 z-0" />

      <motion.div
        variants={authBlobVariants}
        initial="initial"
        animate="animate"
        className="pointer-events-none absolute -left-28 -top-24 z-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl"
      />
      <motion.div
        variants={authBlobVariants}
        initial="initial"
        animate="animate"
        className="pointer-events-none absolute right-[-96px] top-[22%] z-0 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
        style={{ animationDelay: '1.2s' }}
      />
      <motion.div
        variants={authBlobVariants}
        initial="initial"
        animate="animate"
        className="pointer-events-none absolute bottom-[-88px] left-[24%] z-0 h-72 w-72 rounded-full bg-blue-500/18 blur-3xl"
        style={{ animationDelay: '2.4s' }}
      />

      <div className="auth-gradient-glow pointer-events-none absolute inset-0 z-0" />
    </>
  );
}
