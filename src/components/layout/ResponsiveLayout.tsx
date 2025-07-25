'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMobile } from './ResponsiveContainer';
import MobileNavigation from './MobileNavigation';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  showMobileNav?: boolean;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export default function ResponsiveLayout({
  children,
  className,
  showMobileNav = true,
  sidebar,
  header
}: ResponsiveLayoutProps) {
  const isMobile = useMobile();

  return (
    <div className={cn('min-h-screen bg-trade-navy', className)}>
      {/* Mobile Navigation */}
      {showMobileNav && isMobile && <MobileNavigation />}

      {/* Desktop Header */}
      {header && !isMobile && (
        <div className="hidden lg:block">
          {header}
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        {sidebar && !isMobile && (
          <div className="hidden lg:block">
            {sidebar}
          </div>
        )}

        {/* Main Content */}
        <main className={cn(
          'flex-1 min-w-0',
          isMobile ? 'pt-16 pb-20' : '',
          sidebar && !isMobile ? 'lg:ml-64' : ''
        )}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}