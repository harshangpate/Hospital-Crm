'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function GlassCard({ children, className, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'backdrop-blur-md bg-white/70 dark:bg-gray-800/70',
        'border border-white/20 rounded-2xl p-6',
        'shadow-2xl hover:shadow-3xl transition-all duration-300',
        'hover:scale-[1.02]',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
