'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import AnimatedNumber from './ui/AnimatedNumber'
import GlowingCard from './ui/GlowingCard'

interface StatsCardProps {
  title: string
  value: string | number
  change: number
  changePercent: number
  icon?: React.ReactNode
  className?: string
  animated?: boolean
  glowColor?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink'
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changePercent,
  icon,
  className = '',
  animated = true,
  glowColor
}) => {
  const isPositive = change > 0
  const isNegative = change < 0
  const isNeutral = change === 0

  const getTrendIcon = () => {
    if (isPositive) return <TrendingUp className="w-4 h-4" />
    if (isNegative) return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (isPositive) return 'text-green-400'
    if (isNegative) return 'text-red-400'
    return 'text-gray-400'
  }

  const getGlowColor = () => {
    if (glowColor) return glowColor
    if (isPositive) return 'green'
    if (isNegative) return 'red'
    return 'blue'
  }

  const CardComponent = animated && glowColor ? GlowingCard : motion.div

  const cardProps = animated && glowColor 
    ? {
        glowColor: getGlowColor(),
        intensity: 'medium' as const,
        animated: true,
        className: `p-6 ${className}`
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        whileHover: { scale: 1.02, y: -2 },
        transition: { duration: 0.2, ease: 'easeOut' },
        className: `glass-dark rounded-xl p-6 hover:bg-white/5 transition-all duration-300 ${className}`
      }

  return (
    <CardComponent {...cardProps}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-4"
      >
        <motion.h3 
          initial={{ x: -10 }}
          animate={{ x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-sm font-medium"
        >
          {title}
        </motion.h3>
        {icon && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-gray-400"
          >
            {icon}
          </motion.div>
        )}
      </motion.div>
      
      <div className="space-y-2">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
          className="text-2xl font-bold text-white"
        >
          {animated && typeof value === 'number' ? (
            <AnimatedNumber 
              value={value} 
              format="currency" 
              animateColor={true}
              duration={1.5}
            />
          ) : (
            value
          )}
        </motion.div>
        
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`flex items-center space-x-1 ${getTrendColor()}`}
        >
          <motion.div
            animate={{ 
              rotate: isPositive ? 0 : isNegative ? 180 : 0,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 0.3 },
              scale: { duration: 0.6, delay: 0.6 }
            }}
          >
            {getTrendIcon()}
          </motion.div>
          <span className="text-sm font-medium">
            {animated ? (
              <AnimatedNumber 
                value={change} 
                format="number" 
                prefix={isPositive ? '+$' : '$'}
                decimals={2}
                duration={1}
              />
            ) : (
              `${isPositive ? '+' : ''}${change.toFixed(2)}`
            )}
          </span>
          <span className="text-sm">
            ({animated ? (
              <AnimatedNumber 
                value={changePercent} 
                format="percentage" 
                prefix={isPositive ? '+' : ''}
                decimals={2}
                duration={1}
              />
            ) : (
              `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`
            )})
          </span>
        </motion.div>
      </div>
    </CardComponent>
  )
}

export default StatsCard