'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedListProps {
  items: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
  animationType?: 'fadeIn' | 'slideUp' | 'slideRight' | 'scale';
}

const animationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  }
};

export default function AnimatedList({
  items,
  className = '',
  itemClassName = '',
  staggerDelay = 0.1,
  animationType = 'slideUp'
}: AnimatedListProps) {
  const variants = animationVariants[animationType];

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={index}
            className={itemClassName}
            variants={variants}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            layout
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}