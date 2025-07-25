'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

export function FloatingElement({
  children,
  delay = 0,
  duration = 3,
  distance = 10,
  className = ''
}: FloatingElementProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [-distance, distance, -distance],
        rotate: [-1, 1, -1]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay
      }}
    >
      {children}
    </motion.div>
  );
}

interface ParticleProps {
  count?: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

const particleSizes = {
  sm: 'w-1 h-1',
  md: 'w-2 h-2',
  lg: 'w-3 h-3'
};

const particleSpeeds = {
  slow: 15,
  normal: 10,
  fast: 5
};

export function FloatingParticles({
  count = 20,
  color = '#3b82f6',
  size = 'sm',
  speed = 'normal',
  className = ''
}: ParticleProps) {
  const particles = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className={`absolute rounded-full opacity-20 ${particleSizes[size]}`}
          style={{
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: particleSpeeds[speed] + Math.random() * 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );
}

interface PulseRingProps {
  color?: string;
  size?: number;
  duration?: number;
  className?: string;
}

export function PulseRing({
  color = '#3b82f6',
  size = 100,
  duration = 2,
  className = ''
}: PulseRingProps) {
  return (
    <div className={`relative ${className}`}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: color,
            width: size,
            height: size,
          }}
          animate={{
            scale: [1, 2, 3],
            opacity: [1, 0.5, 0],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'easeOut',
            delay: i * 0.5
          }}
        />
      ))}
    </div>
  );
}

interface MorphingShapeProps {
  className?: string;
  color?: string;
}

export function MorphingShape({
  className = '',
  color = '#3b82f6'
}: MorphingShapeProps) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{
        background: `linear-gradient(45deg, ${color}20, transparent)`
      }}
      animate={{
        borderRadius: [
          '30% 70% 70% 30% / 30% 30% 70% 70%',
          '70% 30% 30% 70% / 70% 70% 30% 30%',
          '50% 50% 50% 50% / 50% 50% 50% 50%',
          '30% 70% 70% 30% / 30% 30% 70% 70%'
        ],
        rotate: [0, 90, 180, 270, 360]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
}