'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, ReactNode } from 'react';
import { Plus, X } from 'lucide-react';

interface FABAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  mainIcon?: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
};

export default function FloatingActionButton({
  actions,
  mainIcon,
  position = 'bottom-right',
  size = 'md',
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { delay: index * 0.05 },
                }}
                exit={{
                  opacity: 0,
                  y: 20,
                  scale: 0.8,
                  transition: { delay: (actions.length - index) * 0.05 },
                }}
                className="flex items-center gap-3"
              >
                {/* Label */}
                <motion.div
                  whileHover={{ x: -5 }}
                  className="bg-gray-900 dark:bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap text-sm font-medium"
                >
                  {action.label}
                </motion.div>

                {/* Action Button */}
                <motion.button
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`
                    ${sizeClasses.sm}
                    rounded-full shadow-lg flex items-center justify-center
                    ${action.color || 'bg-blue-600 hover:bg-blue-700'}
                    text-white transition-colors
                  `}
                >
                  {action.icon}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        className={`
          ${sizeClasses[size]}
          rounded-full bg-gradient-to-r from-blue-600 to-purple-600
          hover:from-blue-700 hover:to-purple-700
          shadow-2xl flex items-center justify-center text-white
          transition-all duration-300
        `}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {mainIcon || <Plus className="w-6 h-6" />}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Ripple Effect */}
      <motion.div
        animate={{
          scale: isOpen ? [1, 1.5, 1.5] : 1,
          opacity: isOpen ? [0.5, 0, 0] : 0,
        }}
        transition={{ duration: 0.6 }}
        className={`
          absolute inset-0 ${sizeClasses[size]}
          rounded-full bg-gradient-to-r from-blue-600 to-purple-600
          pointer-events-none
        `}
      />
    </div>
  );
}
