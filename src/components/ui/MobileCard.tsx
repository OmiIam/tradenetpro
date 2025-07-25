'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
  clickable?: boolean;
  onClick?: () => void;
  showChevron?: boolean;
  actions?: React.ReactNode;
}

const variants = {
  default: 'p-4 sm:p-6',
  compact: 'p-3 sm:p-4',
  featured: 'p-6 sm:p-8'
};

export default function MobileCard({
  children,
  className,
  variant = 'default',
  clickable = false,
  onClick,
  showChevron = false,
  actions
}: MobileCardProps) {
  return (
    <motion.div
      className={cn(
        'bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm',
        variants[variant],
        clickable && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
      whileTap={clickable ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {children}
        </div>
        
        <div className="flex items-center space-x-2 ml-3">
          {actions && (
            <div className="flex items-center space-x-1">
              {actions}
            </div>
          )}
          
          {showChevron && (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Mobile-optimized stat card
interface MobileStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  className?: string;
}

const colorVariants = {
  blue: 'border-blue-500/30 bg-blue-500/5',
  green: 'border-green-500/30 bg-green-500/5',
  red: 'border-red-500/30 bg-red-500/5',
  yellow: 'border-yellow-500/30 bg-yellow-500/5',
  purple: 'border-purple-500/30 bg-purple-500/5'
};

export function MobileStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  className
}: MobileStatCardProps) {
  return (
    <MobileCard 
      variant="compact" 
      className={cn(colorVariants[color], className)}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <p className="text-white text-xl sm:text-2xl font-bold">{value}</p>
          
          {subtitle && (
            <p className="text-gray-400 text-sm">{subtitle}</p>
          )}
          
          {trend && (
            <div className={cn(
              'inline-flex items-center text-sm font-medium',
              trend.positive ? 'text-green-400' : 'text-red-400'
            )}>
              <span>{trend.positive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
      </div>
    </MobileCard>
  );
}

// Mobile list item
interface MobileListItemProps {
  title: string;
  subtitle?: string;
  value?: string;
  avatar?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const statusColors = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500'
};

export function MobileListItem({
  title,
  subtitle,
  value,
  avatar,
  status,
  onClick,
  actions,
  className
}: MobileListItemProps) {
  return (
    <MobileCard
      clickable={!!onClick}
      onClick={onClick}
      showChevron={!!onClick}
      actions={actions}
      className={className}
    >
      <div className="flex items-center space-x-3">
        {/* Avatar or Status */}
        <div className="flex-shrink-0">
          {avatar || (status && (
            <div className={cn('w-3 h-3 rounded-full', statusColors[status])} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{title}</p>
          {subtitle && (
            <p className="text-gray-400 text-sm truncate">{subtitle}</p>
          )}
        </div>

        {/* Value */}
        {value && (
          <div className="text-right">
            <p className="text-white font-semibold">{value}</p>
          </div>
        )}
      </div>
    </MobileCard>
  );
}

// Mobile action sheet
interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
}

export function MobileActionSheet({
  isOpen,
  onClose,
  title,
  actions
}: MobileActionSheetProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-xl border-t border-slate-700/50 shadow-2xl"
      >
        <div className="p-4">
          {/* Handle */}
          <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
          
          {/* Title */}
          {title && (
            <h3 className="text-white font-semibold text-lg mb-4">{title}</h3>
          )}
          
          {/* Actions */}
          <div className="space-y-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className={cn(
                  'w-full flex items-center space-x-3 p-4 rounded-lg text-left transition-colors',
                  action.variant === 'destructive'
                    ? 'text-red-400 hover:bg-red-900/20'
                    : 'text-white hover:bg-slate-800'
                )}
              >
                {action.icon && action.icon}
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
          
          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full mt-4 p-4 text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Mobile tabs
interface MobileTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function MobileTabs({
  tabs,
  activeTab,
  onTabChange,
  className
}: MobileTabsProps) {
  return (
    <div className={cn('bg-slate-800/50 rounded-lg p-1', className)}>
      <div className="grid grid-cols-2 sm:flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            )}
          >
            {tab.icon && tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}