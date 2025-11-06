'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ReactNode, useRef, MouseEvent } from 'react';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  shine?: boolean;
}

export default function Card3D({
  children,
  className = '',
  intensity = 15,
  shine = true,
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for rotation
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring animation for smooth motion
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 300,
    damping: 30,
  });

  // Shine effect position
  const shineX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']);
  const shineY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    // Normalize to -0.5 to 0.5
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;

    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      {/* Card content */}
      <div style={{ transform: 'translateZ(50px)' }}>{children}</div>

      {/* Shine effect */}
      {shine && (
        <motion.div
          style={{
            background: `radial-gradient(circle at ${shineX.get()} ${shineY.get()}, rgba(255,255,255,0.3) 0%, transparent 50%)`,
            left: shineX,
            top: shineY,
          }}
          className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
      )}

      {/* Glow effect on hover */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.5 }}
        transition={{ duration: 0.3 }}
        className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg -z-10 opacity-0"
      />
    </motion.div>
  );
}
