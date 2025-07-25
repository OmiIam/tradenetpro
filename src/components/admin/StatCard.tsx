'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';
import Card, { CardContent } from '@/components/ui/Card';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

export interface StatCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'gray';
  subtitle?: string;
  animated?: boolean;
  loading?: boolean;
  className?: string;
}

const colorVariants = {
  blue: {
    gradient: 'from-blue-500/5 to-blue-600/5',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/10',
    iconBorder: 'border-blue-500/20',
    iconColor: 'text-blue-400'
  },
  green: {
    gradient: 'from-green-500/5 to-green-600/5',
    border: 'border-green-500/30',
    iconBg: 'bg-green-500/10',
    iconBorder: 'border-green-500/20',
    iconColor: 'text-green-400'
  },
  purple: {
    gradient: 'from-purple-500/5 to-purple-600/5',
    border: 'border-purple-500/30',
    iconBg: 'bg-purple-500/10',
    iconBorder: 'border-purple-500/20',
    iconColor: 'text-purple-400'
  },
  amber: {
    gradient: 'from-amber-500/5 to-amber-600/5',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/10',
    iconBorder: 'border-amber-500/20',
    iconColor: 'text-amber-400'
  },
  red: {
    gradient: 'from-red-500/5 to-red-600/5',
    border: 'border-red-500/30',
    iconBg: 'bg-red-500/10',
    iconBorder: 'border-red-500/20',
    iconColor: 'text-red-400'
  },
  gray: {
    gradient: 'from-gray-500/5 to-gray-600/5',
    border: 'border-gray-500/30',
    iconBg: 'bg-gray-500/10',
    iconBorder: 'border-gray-500/20',
    iconColor: 'text-gray-400'
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  delta,
  icon: Icon,
  color = 'blue',
  subtitle,
  animated = true,
  loading = false,
  className = ''
}) => {
  const colorScheme = colorVariants[color];
  
  const getTrendIcon = () => {
    if (!delta) return null;
    const isPositive = delta.isPositive ?? delta.value > 0;
    const isNegative = delta.value < 0;
    
    if (isPositive) return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    if (isNegative) return <ArrowDownRight className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (!delta) return 'text-gray-400';
    const isPositive = delta.isPositive ?? delta.value > 0;
    const isNegative = delta.value < 0;
    
    if (isPositive) return 'text-green-400';
    if (isNegative) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatDeltaValue = (value: number) => {
    const isPositive = delta?.isPositive ?? value > 0;
    const prefix = isPositive ? '+' : '';
    return `${prefix}${Math.abs(value).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card className={`border-slate-700/50 bg-slate-800/30 backdrop-blur-sm ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
              <div className="w-16 h-4 bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-slate-700 rounded"></div>
              <div className="w-32 h-8 bg-slate-700 rounded"></div>
              <div className="w-28 h-4 bg-slate-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={animated ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className={`relative overflow-hidden border-slate-700/50 bg-gradient-to-br ${colorScheme.gradient} hover:${colorScheme.border} transition-all duration-300`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <motion.div 
              initial={animated ? { scale: 0 } : undefined}
              animate={animated ? { scale: 1 } : undefined}
              transition={animated ? { delay: 0.1, type: 'spring', stiffness: 200 } : undefined}
              className={`w-12 h-12 ${colorScheme.iconBg} rounded-xl flex items-center justify-center border ${colorScheme.iconBorder}`}
            >
              <Icon className={`w-6 h-6 ${colorScheme.iconColor}`} />
            </motion.div>
            
            {delta && (
              <motion.div 
                initial={animated ? { opacity: 0, x: 10 } : undefined}
                animate={animated ? { opacity: 1, x: 0 } : undefined}
                transition={animated ? { delay: 0.2 } : undefined}
                className="flex items-center space-x-1"
              >
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {formatDeltaValue(delta.value)}
                </span>
              </motion.div>
            )}
          </div>
          
          <div className="space-y-2">
            <motion.h3 
              initial={animated ? { opacity: 0, y: 10 } : undefined}
              animate={animated ? { opacity: 1, y: 0 } : undefined}
              transition={animated ? { delay: 0.3 } : undefined}
              className="text-sm font-medium text-slate-400 uppercase tracking-wide"
            >
              {title}
            </motion.h3>
            
            <motion.div
              initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
              animate={animated ? { opacity: 1, scale: 1 } : undefined}
              transition={animated ? { delay: 0.4, type: 'spring', stiffness: 150 } : undefined}
              className="text-3xl font-bold text-white"
            >
              {animated && typeof value === 'number' ? (
                <AnimatedNumber 
                  value={value} 
                  format={typeof value === 'number' && value > 1000 ? 'number' : 'currency'}
                  duration={1.5}
                />
              ) : (
                typeof value === 'number' ? value.toLocaleString() : value
              )}
            </motion.div>
            
            {subtitle && (
              <motion.p 
                initial={animated ? { opacity: 0 } : undefined}
                animate={animated ? { opacity: 1 } : undefined}
                transition={animated ? { delay: 0.5 } : undefined}
                className="text-sm text-slate-400"
              >
                {subtitle}
              </motion.p>
            )}
            
            {delta?.label && (
              <motion.p 
                initial={animated ? { opacity: 0 } : undefined}
                animate={animated ? { opacity: 1 } : undefined}
                transition={animated ? { delay: 0.6 } : undefined}
                className="text-xs text-slate-500"
              >
                {delta.label}
              </motion.p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;