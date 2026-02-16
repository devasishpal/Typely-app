import type { Variants } from 'motion/react';

export const guideContainerVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      when: 'beforeChildren',
      staggerChildren: 0.08,
    },
  },
};

export const guideSectionVariant: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const guideCardVariant: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const listStaggerVariant = (staggerChildren = 0.08): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
    },
  },
});

export const quickFadeVariant: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const floatVariant: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: [0, -8, 0],
    transition: {
      opacity: {
        duration: 0.4,
      },
      y: {
        duration: 3.2,
        ease: 'easeInOut',
        repeat: Number.POSITIVE_INFINITY,
      },
    },
  },
};
