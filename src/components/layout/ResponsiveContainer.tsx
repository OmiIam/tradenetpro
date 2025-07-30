'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
}

const maxWidths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
};

const paddings = {
  none: '',
  sm: 'px-3 py-2',
  md: 'px-4 py-3 sm:px-6 sm:py-4',
  lg: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12',
  xl: 'px-6 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16'
};

export default function ResponsiveContainer({
  children,
  className,
  maxWidth = '7xl',
  padding = 'lg',
  center = true
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        maxWidths[maxWidth],
        paddings[padding],
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
}

// Grid system for responsive layouts
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const gaps = {
  none: 'gap-0',
  sm: 'gap-2 sm:gap-3',
  md: 'gap-3 sm:gap-4 lg:gap-6',
  lg: 'gap-4 sm:gap-6 lg:gap-8',
  xl: 'gap-6 sm:gap-8 lg:gap-12'
};

export function ResponsiveGrid({
  children,
  className,
  cols = { base: 1, sm: 2, lg: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gridCols = [
    cols.base && `grid-cols-${cols.base}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('grid', gridCols, gaps[gap], className)}>
      {children}
    </div>
  );
}

// Responsive stack for vertical layouts
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  space?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  direction?: {
    base?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
  };
}

const spaces = {
  none: 'space-y-0',
  sm: 'space-y-2 sm:space-y-3',
  md: 'space-y-3 sm:space-y-4 lg:space-y-6',
  lg: 'space-y-4 sm:space-y-6 lg:space-y-8',
  xl: 'space-y-6 sm:space-y-8 lg:space-y-12'
};

const alignments = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch'
};

export function ResponsiveStack({
  children,
  className,
  space = 'md',
  align = 'stretch',
  direction = { base: 'col' }
}: ResponsiveStackProps) {
  const flexDirection = [
    direction.base && `flex-${direction.base}`,
    direction.sm && `sm:flex-${direction.sm}`,
    direction.md && `md:flex-${direction.md}`,
    direction.lg && `lg:flex-${direction.lg}`
  ].filter(Boolean).join(' ');

  return (
    <div className={cn('flex', flexDirection, spaces[space], alignments[align], className)}>
      {children}
    </div>
  );
}

// Responsive breakpoint hook
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else if (width < 1280) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}

// Mobile-first media query hook
export function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}