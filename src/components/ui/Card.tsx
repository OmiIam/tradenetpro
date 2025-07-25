'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  clickable?: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const cardVariants = {
  default: 'bg-slate-800/50 border border-slate-700/50',
  glass: 'bg-slate-800/30 border border-slate-700/30 backdrop-blur-xl',
  elevated: 'bg-slate-800 shadow-2xl border border-slate-700/50',
  bordered: 'bg-transparent border-2 border-slate-600'
};

const cardPadding = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8'
};

export default function Card({
  variant = 'default',
  padding = 'lg',
  hover = false,
  clickable = false,
  className,
  onClick,
  children
}: CardProps) {
  const MotionComponent = clickable ? motion.div : motion.div;

  return (
    <MotionComponent
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2, scale: 1.02 } : undefined}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        // Base styles
        'rounded-xl transition-all duration-200',
        // Variant styles
        cardVariants[variant],
        // Padding
        cardPadding[padding],
        // Hover effects
        hover && 'hover:shadow-lg hover:border-slate-600/50',
        // Clickable cursor
        clickable && 'cursor-pointer',
        // Custom className
        className
      )}
      onClick={onClick}
    >
      {children}
    </MotionComponent>
  );
}

// Card components for specific sections
export function CardHeader({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn('mb-4', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 
      className={cn('text-xl font-semibold text-white', className)} 
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p 
      className={cn('text-gray-400 text-sm', className)} 
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn('', className)} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ 
  className, 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn('mt-4 pt-4 border-t border-slate-700/50', className)} 
      {...props}
    >
      {children}
    </div>
  );
}