'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface ParticleBackgroundProps {
  particleCount?: number;
  colors?: string[];
  className?: string;
}

// Seeded random generator for consistent values
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function ParticleBackground({
  particleCount = 50,
  colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'],
  className = '',
}: ParticleBackgroundProps) {
  // Generate particles with deterministic seeded random
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      // Use index as seed for deterministic values
      const seed = i * 1000;
      return {
        id: i,
        size: seededRandom(seed + 1) * 4 + 2,
        x: seededRandom(seed + 2) * 100,
        y: seededRandom(seed + 3) * 100,
        duration: seededRandom(seed + 4) * 20 + 15,
        delay: seededRandom(seed + 5) * 5,
        xDrift: seededRandom(seed + 6) * 20 - 10,
        color: colors[Math.floor(seededRandom(seed + 7) * colors.length)],
        opacity: seededRandom(seed + 8) * 0.5 + 0.2,
      };
    });
  }, [particleCount, colors]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, particle.xDrift, 0],
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50 dark:to-gray-900/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
    </div>
  );
}
