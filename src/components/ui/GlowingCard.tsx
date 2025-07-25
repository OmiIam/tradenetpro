'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink';
  intensity?: 'low' | 'medium' | 'high';
  animated?: boolean;
  children: React.ReactNode;
}

const glowColors = {
  blue: 'shadow-blue-500/50',
  green: 'shadow-green-500/50',
  red: 'shadow-red-500/50',
  yellow: 'shadow-yellow-500/50',
  purple: 'shadow-purple-500/50',
  pink: 'shadow-pink-500/50'
};

const glowIntensity = {
  low: 'shadow-lg',
  medium: 'shadow-xl',
  high: 'shadow-2xl'
};

export default function GlowingCard({
  glowColor = 'blue',
  intensity = 'medium',
  animated = true,
  className,
  children,
  ...props
}: GlowingCardProps) {
  return (
    <motion.div
      className={cn(
        'relative bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm',
        glowColors[glowColor],
        glowIntensity[intensity],
        className
      )}
      initial={animated ? { opacity: 0, scale: 0.95 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      whileHover={animated ? {
        scale: 1.02,
        boxShadow: `0 25px 50px -12px ${
          glowColor === 'blue' ? 'rgba(59, 130, 246, 0.4)' :
          glowColor === 'green' ? 'rgba(34, 197, 94, 0.4)' :
          glowColor === 'red' ? 'rgba(239, 68, 68, 0.4)' :
          glowColor === 'yellow' ? 'rgba(234, 179, 8, 0.4)' :
          glowColor === 'purple' ? 'rgba(147, 51, 234, 0.4)' :
          'rgba(236, 72, 153, 0.4)'
        }`
      } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      {...props}
    >
      {/* Animated background gradient */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0"
          style={{
            background: `linear-gradient(45deg, ${
              glowColor === 'blue' ? '#3b82f6' :
              glowColor === 'green' ? '#22c55e' :
              glowColor === 'red' ? '#ef4444' :
              glowColor === 'yellow' ? '#eab308' :
              glowColor === 'purple' ? '#9333ea' :
              '#ec4899'
            }15, transparent 50%, ${
              glowColor === 'blue' ? '#3b82f6' :
              glowColor === 'green' ? '#22c55e' :
              glowColor === 'red' ? '#ef4444' :
              glowColor === 'yellow' ? '#eab308' :
              glowColor === 'purple' ? '#9333ea' :
              '#ec4899'
            }15)`
          }}
          animate={{
            opacity: [0, 0.1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}