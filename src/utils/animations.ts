import type { Variants } from 'motion/react';

export const authPageEntryVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.04,
    },
  },
};

export const authCardSpringVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.985,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 155,
      damping: 18,
      mass: 0.9,
    },
  },
};

export const authCardIdleFloatVariants: Variants = {
  idle: {
    y: [0, -2.4, 0, 2.4, 0],
    transition: {
      duration: 7,
      ease: 'easeInOut',
      repeat: Number.POSITIVE_INFINITY,
    },
  },
};

export const authInputFocusVariants: Variants = {
  idle: {
    boxShadow: '0 0 0 0 rgba(59,130,246,0)',
  },
  focused: {
    boxShadow: [
      '0 0 0 0 rgba(56,189,248,0)',
      '0 0 0 3px rgba(56,189,248,0.16)',
      '0 0 0 0 rgba(56,189,248,0)',
    ],
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const authButtonHoverVariants: Variants = {
  rest: {
    scale: 1,
    filter: 'brightness(1)',
  },
  hover: {
    scale: 1.013,
    filter: 'brightness(1.04)',
    transition: {
      type: 'spring',
      stiffness: 360,
      damping: 22,
    },
  },
  tap: {
    scale: 0.988,
    transition: {
      duration: 0.07,
    },
  },
};

export const authLinkUnderlineVariants: Variants = {
  initial: {
    scaleX: 0,
    opacity: 0.2,
  },
  hover: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const authErrorShakeVariants: Variants = {
  idle: {
    x: 0,
  },
  shake: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: {
      duration: 0.36,
      ease: 'easeInOut',
    },
  },
};

export const authSuccessGlowVariants: Variants = {
  idle: {
    filter: 'drop-shadow(0 0 0 rgba(16,185,129,0))',
  },
  success: {
    filter: [
      'drop-shadow(0 0 0 rgba(16,185,129,0))',
      'drop-shadow(0 0 8px rgba(16,185,129,0.45))',
      'drop-shadow(0 0 0 rgba(16,185,129,0))',
    ],
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const authBlobVariants: Variants = {
  initial: {
    opacity: 0.6,
    scale: 1,
  },
  animate: {
    opacity: [0.45, 0.7, 0.45],
    scale: [1, 1.08, 1],
    transition: {
      duration: 9,
      ease: 'easeInOut',
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'mirror',
    },
  },
};

export const authParticleVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: [0, 0.5, 0],
    y: [-4, -26, -52],
    transition: {
      duration: 6,
      ease: 'easeInOut',
      repeat: Number.POSITIVE_INFINITY,
      repeatDelay: 0.2,
    },
  },
};
