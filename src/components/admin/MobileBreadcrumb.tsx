'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Home } from 'lucide-react'

interface MobileBreadcrumbProps {
  currentTab: string
  onBack?: () => void
  showBackButton?: boolean
}

const MobileBreadcrumb: React.FC<MobileBreadcrumbProps> = ({
  currentTab,
  onBack,
  showBackButton = false
}) => {
  const getTabTitle = (tab: string): string => {
    const titles: Record<string, string> = {
      overview: 'Dashboard Overview',
      users: 'User Management',
      balances: 'Balance Manager',
      portfolios: 'Portfolio Manager',
      transactions: 'Transactions',
      analytics: 'Analytics',
      settings: 'Settings'
    }
    return titles[tab] || 'Admin Panel'
  }

  const getTabDescription = (tab: string): string => {
    const descriptions: Record<string, string> = {
      overview: 'Monitor platform performance and user activity',
      users: 'Manage user accounts, status, and permissions',
      balances: 'Adjust user balances and track transactions',
      portfolios: 'Manage user portfolios and positions',
      transactions: 'View and manage all platform transactions',
      analytics: 'Advanced analytics and reporting',
      settings: 'Platform settings and configuration'
    }
    return descriptions[tab] || 'Admin management panel'
  }

  return (
    <div className="md:hidden mb-6">
      <div className="flex items-center space-x-3 mb-2">
        {showBackButton && onBack && (
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
        )}
        
        <div className="flex items-center space-x-2 text-gray-400">
          <Home className="w-4 h-4" />
          <span className="text-sm">Admin</span>
          {currentTab !== 'overview' && (
            <>
              <span className="text-xs">/</span>
              <span className="text-sm text-white font-medium">
                {getTabTitle(currentTab)}
              </span>
            </>
          )}
        </div>
      </div>
      
      <div>
        <h1 className="text-xl font-bold text-white mb-1">
          {getTabTitle(currentTab)}
        </h1>
        <p className="text-sm text-gray-400">
          {getTabDescription(currentTab)}
        </p>
      </div>
    </div>
  )
}

export default MobileBreadcrumb