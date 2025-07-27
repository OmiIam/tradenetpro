'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Card, { CardContent, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className, children }) => (
  <div
    className={cn(
      'animate-pulse bg-slate-700/50 rounded',
      className
    )}
  >
    {children}
  </div>
);

/**
 * Skeleton for StatCard components
 */
export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn('border-slate-700/50 bg-slate-800/30 backdrop-blur-sm', className)}>
    <CardContent className="p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-32 h-8" />
          <Skeleton className="w-28 h-4" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Skeleton for user list items
 */
export const UserListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700"
      >
        <div className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-48 h-3" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="w-20 h-6 rounded-full" />
          <Skeleton className="w-24 h-8 rounded" />
        </div>
      </motion.div>
    ))}
  </div>
);

/**
 * Skeleton for KYC document items
 */
export const KycDocumentSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700"
      >
        <div className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-52 h-3" />
            <div className="flex items-center space-x-3">
              <Skeleton className="w-24 h-3" />
              <Skeleton className="w-28 h-3" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="w-20 h-6 rounded-full" />
          <Skeleton className="w-20 h-8 rounded" />
        </div>
      </motion.div>
    ))}
  </div>
);

/**
 * Skeleton for audit log entries
 */
export const AuditLogSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="bg-slate-800/30 rounded-lg border border-slate-700 p-4"
      >
        <div className="flex items-start space-x-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-24 h-3" />
            </div>
            <Skeleton className="w-80 h-3" />
            <Skeleton className="w-64 h-3" />
            <div className="flex items-center space-x-4">
              <Skeleton className="w-40 h-3" />
              <Skeleton className="w-28 h-3" />
            </div>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

/**
 * Skeleton for table rows
 */
export const TableRowSkeleton: React.FC<{ 
  columns: number;
  rows?: number;
}> = ({ columns, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <tr key={rowIndex}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <td key={colIndex} className="px-6 py-4">
            <Skeleton className={cn(
              'h-4',
              colIndex === 0 && 'w-32',
              colIndex === 1 && 'w-24',
              colIndex === 2 && 'w-40',
              colIndex >= 3 && 'w-20'
            )} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/**
 * Skeleton for dashboard grid
 */
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8">
    {/* Header */}
    <div className="space-y-3">
      <Skeleton className="w-64 h-8" />
      <Skeleton className="w-96 h-5" />
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Content Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="w-40 h-6" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-48 h-3" />
                </div>
                <Skeleton className="w-16 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="w-36 h-6" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-16 h-5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

/**
 * Generic loading state for any list
 */
export const ListSkeleton: React.FC<{
  itemHeight?: string;
  count?: number;
  showHeader?: boolean;
}> = ({ 
  itemHeight = 'h-16', 
  count = 5, 
  showHeader = false 
}) => (
  <div className="space-y-3">
    {showHeader && (
      <div className="flex items-center justify-between">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-8 rounded" />
      </div>
    )}
    
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className={cn(
          'bg-slate-800/30 rounded-lg border border-slate-700 p-4',
          itemHeight
        )}
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-48 h-3" />
            </div>
          </div>
          <Skeleton className="w-20 h-6 rounded" />
        </div>
      </motion.div>
    ))}
  </div>
);

export default {
  Skeleton,
  StatCardSkeleton,
  UserListSkeleton,
  KycDocumentSkeleton,
  AuditLogSkeleton,
  TableRowSkeleton,
  DashboardSkeleton,
  ListSkeleton
};