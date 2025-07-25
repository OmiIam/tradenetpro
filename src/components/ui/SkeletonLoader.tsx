'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animated?: boolean;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animated = true,
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-slate-700/50';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };

  const pulseAnimation = {
    opacity: [0.5, 0.8, 0.5],
  };

  const shimmerAnimation = {
    backgroundPosition: ['-200px 0', '200px 0'],
  };

  return (
    <motion.div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animated && 'animate-pulse',
        className
      )}
      style={{
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '20px'),
        ...(animated && {
          background: 'linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%)',
          backgroundSize: '200px 100%',
        })
      }}
      animate={animated ? shimmerAnimation : undefined}
      transition={animated ? {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      } : undefined}
      {...props}
    />
  );
}

// Pre-built skeleton components
export function SkeletonCard({ className, ...props }: { className?: string }) {
  return (
    <div className={cn('bg-slate-800/50 rounded-xl p-6 space-y-4', className)} {...props}>
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height="1rem" />
        <Skeleton variant="circular" width="24px" height="24px" />
      </div>
      
      <Skeleton width="60%" height="2rem" />
      
      <div className="flex items-center space-x-2">
        <Skeleton variant="circular" width="16px" height="16px" />
        <Skeleton width="30%" height="0.875rem" />
        <Skeleton width="25%" height="0.875rem" />
      </div>
    </div>
  );
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4, 
  className 
}: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) {
  return (
    <div className={cn('bg-slate-800/50 rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-slate-700/50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width="80%" height="1rem" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-slate-700/50">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  width={colIndex === 0 ? '60%' : '90%'} 
                  height="1rem" 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('bg-slate-800/50 rounded-xl p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton width="30%" height="1.5rem" />
        <Skeleton width="20%" height="1rem" />
      </div>
      
      <div className="relative h-64">
        {/* Chart bars */}
        <div className="flex items-end justify-between h-full space-x-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="100%"
              height={`${Math.random() * 60 + 20}%`}
            />
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton variant="circular" width="12px" height="12px" />
            <Skeleton width="60px" height="0.875rem" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn('bg-slate-800/50 rounded-xl p-6', className)}>
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton variant="circular" width="64px" height="64px" />
        <div className="space-y-2 flex-1">
          <Skeleton width="40%" height="1.25rem" />
          <Skeleton width="60%" height="1rem" />
          <Skeleton width="30%" height="0.875rem" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton width="25%" height="0.875rem" />
          <Skeleton width="100%" height="1rem" />
        </div>
        <div className="space-y-2">
          <Skeleton width="25%" height="0.875rem" />
          <Skeleton width="80%" height="1rem" />
        </div>
        <div className="space-y-2">
          <Skeleton width="25%" height="0.875rem" />
          <Skeleton width="60%" height="1rem" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ 
  items = 5, 
  showAvatar = true, 
  className 
}: { 
  items?: number; 
  showAvatar?: boolean; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-lg">
          {showAvatar && (
            <Skeleton variant="circular" width="40px" height="40px" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="1rem" />
            <Skeleton width="40%" height="0.875rem" />
          </div>
          <Skeleton width="80px" height="2rem" variant="rounded" />
        </div>
      ))}
    </div>
  );
}