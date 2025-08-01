'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, TrendingUp, Activity, UserCheck, UserX, Loader2 } from 'lucide-react'
import { AdminStats } from '@/types/admin'

interface AdminStatsProps {
  stats: AdminStats | null;
  loading?: boolean;
  error?: string | null;
}

const AdminStatsComponent: React.FC<AdminStatsProps> = ({ stats, loading, error }) => {
  // Show loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="glass-dark rounded-xl p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-600 rounded-lg"></div>
              <div className="text-right">
                <div className="w-16 h-6 bg-gray-600 rounded mb-2"></div>
                <div className="w-20 h-4 bg-gray-600 rounded"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-4 bg-gray-600 rounded"></div>
              <div className="w-16 h-4 bg-gray-600 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="glass-dark rounded-xl p-6 mb-8">
        <div className="flex items-center space-x-2 text-red-400">
          <UserX className="w-5 h-5" />
          <span>Failed to load admin statistics: {error}</span>
        </div>
      </div>
    );
  }

  // Show empty state if no stats
  if (!stats) {
    return (
      <div className="glass-dark rounded-xl p-6 mb-8">
        <div className="text-center text-gray-400">
          <Users className="w-8 h-8 mx-auto mb-2" />
          <span>No statistics available</span>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      changeValue: '+156',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: '+8%',
      changeValue: '+89',
      icon: UserCheck,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Portfolio Value',
      value: `$${(stats.totalPortfolioValue / 1000000).toFixed(1)}M`,
      change: '+15%',
      changeValue: '+$2.1M',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Today\'s Trades',
      value: stats.todayTrades.toLocaleString(),
      change: '+23%',
      changeValue: '+245',
      icon: Activity,
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats.monthlyRevenue / 1000).toFixed(1)}K`,
      change: '+18%',
      changeValue: '+$45K',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Suspended Users',
      value: stats.suspendedUsers.toLocaleString(),
      change: '-5%',
      changeValue: '-12',
      icon: UserX,
      color: 'from-red-500 to-red-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statsCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-dark rounded-xl p-6 hover:bg-white/5 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-sm text-gray-400">{card.title}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className={`text-sm font-medium ${
              card.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
            }`}>
              {card.change}
            </div>
            <div className="text-sm text-gray-400">{card.changeValue}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default AdminStatsComponent