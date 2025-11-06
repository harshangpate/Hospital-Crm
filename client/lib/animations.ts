/**
 * Advanced Animation Library
 * Reusable Framer Motion animation variants and transitions
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const easings = {
  smooth: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number],
  snappy: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
  elastic: [0.175, 0.885, 0.32, 1.275] as [number, number, number, number],
  bounce: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
  spring: { type: "spring" as const, stiffness: 300, damping: 30 },
};

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: easings.smooth },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easings.smooth },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easings.smooth },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easings.smooth },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: easings.smooth },
  },
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easings.smooth },
  },
};

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: easings.bounce },
  },
};

export const scaleInSpring: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: easings.spring,
  },
};

// ============================================================================
// ROTATE ANIMATIONS
// ============================================================================

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -180, scale: 0.5 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { duration: 0.6, ease: easings.smooth },
  },
};

export const flip: Variants = {
  hidden: { opacity: 0, rotateY: -90 },
  visible: {
    opacity: 1,
    rotateY: 0,
    transition: { duration: 0.6, ease: easings.smooth },
  },
};

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

export const slideInFromLeft: Variants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: easings.smooth },
  },
};

export const slideInFromRight: Variants = {
  hidden: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: easings.smooth },
  },
};

export const slideInFromTop: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: easings.smooth },
  },
};

export const slideInFromBottom: Variants = {
  hidden: { y: 100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: easings.smooth },
  },
};

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerFastContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easings.smooth },
  },
};

// ============================================================================
// HOVER & TAP ANIMATIONS
// ============================================================================

export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2, ease: easings.smooth },
};

export const tapScale = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

export const hoverGlow = {
  boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
  transition: { duration: 0.3 },
};

export const hoverLift = {
  y: -5,
  transition: { duration: 0.2, ease: easings.smooth },
};

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)',
  },
  hover: {
    scale: 1.02,
    y: -8,
    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
    transition: { duration: 0.3, ease: easings.smooth },
  },
};

export const card3D: Variants = {
  rest: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.3 },
  },
};

// ============================================================================
// BOUNCE ANIMATIONS
// ============================================================================

export const bounce = {
  y: [0, -20, 0],
  transition: {
    duration: 0.6,
    repeat: Infinity,
    repeatType: "loop" as const,
    ease: easings.smooth,
  },
};

export const pulse = {
  scale: [1, 1.1, 1],
  transition: {
    duration: 1,
    repeat: Infinity,
    repeatType: "loop" as const,
    ease: easings.smooth,
  },
};

export const wiggle = {
  rotate: [0, -5, 5, -5, 5, 0],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    repeatDelay: 3,
    ease: easings.smooth,
  },
};

// ============================================================================
// BLUR ANIMATIONS
// ============================================================================

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: 'blur(20px)' },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: easings.smooth },
  },
};

// ============================================================================
// MORPHING ANIMATIONS
// ============================================================================

export const morphShape = {
  borderRadius: ['20%', '50%', '20%'],
  transition: {
    duration: 2,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: easings.smooth,
  },
};

// ============================================================================
// REVEAL ANIMATIONS (for scroll)
// ============================================================================

export const revealFromBottom: Variants = {
  hidden: {
    opacity: 0,
    y: 100,
    clipPath: 'inset(100% 0 0 0)',
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: 'inset(0% 0 0 0)',
    transition: { duration: 0.8, ease: easings.smooth },
  },
};

export const revealFromLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -100,
    clipPath: 'inset(0 100% 0 0)',
  },
  visible: {
    opacity: 1,
    x: 0,
    clipPath: 'inset(0 0% 0 0)',
    transition: { duration: 0.8, ease: easings.smooth },
  },
};

// ============================================================================
// SHIMMER EFFECT
// ============================================================================

export const shimmer = {
  backgroundPosition: ['200% 0', '-200% 0'],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear',
  },
};

// ============================================================================
// FLOATING ANIMATION
// ============================================================================

export const float = {
  y: [0, -15, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    repeatType: "loop" as const,
    ease: easings.smooth,
  },
};

// ============================================================================
// PAGE TRANSITION VARIANTS
// ============================================================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easings.smooth },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: easings.smooth },
  },
};

export const slideTransition: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: easings.smooth },
  },
  exit: {
    x: -100,
    opacity: 0,
    transition: { duration: 0.3, ease: easings.smooth },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create stagger animation with custom delay
 */
export const createStagger = (staggerDelay: number = 0.1, delayChildren: number = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
});

/**
 * Create custom fade animation with duration
 */
export const createFade = (duration: number = 0.6): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration, ease: easings.smooth },
  },
});

/**
 * Combine multiple animation variants
 */
export const combine = (...variants: Variants[]): Variants => {
  const combined: Variants = {};
  
  variants.forEach(variant => {
    Object.keys(variant).forEach(key => {
      if (!combined[key]) {
        combined[key] = variant[key];
      } else {
        combined[key] = { ...combined[key], ...variant[key] };
      }
    });
  });
  
  return combined;
};

/**
 * Create delayed animation
 */
export const withDelay = (variants: Variants, delay: number): Variants => {
  const delayed: Variants = {};
  
  Object.keys(variants).forEach(key => {
    const variant = variants[key];
    if (typeof variant === 'object' && 'transition' in variant) {
      delayed[key] = {
        ...variant,
        transition: {
          ...(typeof variant.transition === 'object' ? variant.transition : {}),
          delay,
        },
      };
    } else {
      delayed[key] = variant;
    }
  });
  
  return delayed;
};
