'use client'

import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface MobileOptimizedCardProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  hoverScale?: number
  tapScale?: number
}

const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  children,
  onClick,
  className = '',
  hoverScale = 1.02,
  tapScale = 0.98
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: tapScale }}
      transition={{ duration: 0.2 }}
      className={`
        bg-white/5 border border-white/10 rounded-lg p-4 md:p-6 
        hover:bg-white/10 transition-all duration-200 
        ${onClick ? 'cursor-pointer' : ''} 
        ${className}
        touch-manipulation
        select-none
        active:bg-white/15
      `}
      // Prevent text selection on mobile when tapping rapidly
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      {children}
    </motion.div>
  )
}

export default MobileOptimizedCard