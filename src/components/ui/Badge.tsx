'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  dot?: boolean;  
  className?: string;
  children: React.ReactNode;
}

const badgeVariants = {
  default: 'bg-slate-600 text-white',
  secondary: 'bg-slate-700 text-gray-300',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-600 text-white',
  danger: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white'
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};

export default function Badge({
  variant = 'default',
  size = 'md',
  pill = false,
  dot = false,
  className,
  children
}: BadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        // Base styles
        'inline-flex items-center gap-1 font-medium',
        // Variant styles
        badgeVariants[variant],
        // Size styles
        badgeSizes[size],
        // Shape
        pill ? 'rounded-full' : 'rounded-md',
        // Custom className
        className
      )}
    >
      {dot && (
        <div 
          className={cn(
            'w-2 h-2 rounded-full',
            variant === 'success' && 'bg-green-300',
            variant === 'warning' && 'bg-yellow-300',
            variant === 'danger' && 'bg-red-300',
            variant === 'info' && 'bg-blue-300',
            variant === 'default' && 'bg-gray-300',
            variant === 'secondary' && 'bg-slate-300'
          )} 
        />
      )}
      {children}
    </motion.span>
  );
}

// Status-specific badge components
export function StatusBadge({ 
  status, 
  ...props 
}: Omit<BadgeProps, 'variant'> & { status: 'active' | 'inactive' | 'pending' | 'suspended' }) {
  const variantMap = {
    active: 'success' as const,
    inactive: 'secondary' as const,
    pending: 'warning' as const,
    suspended: 'danger' as const
  };

  return (
    <Badge variant={variantMap[status]} dot {...props}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function RoleBadge({ 
  role, 
  ...props 
}: Omit<BadgeProps, 'variant'> & { role: 'admin' | 'user' | 'moderator' }) {
  const variantMap = {
    admin: 'danger' as const,
    moderator: 'warning' as const,
    user: 'info' as const
  };

  return (
    <Badge variant={variantMap[role]} {...props}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
}