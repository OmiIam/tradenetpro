'use client'

import React from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import StatsCard from '@/components/StatsCard'
import MarketChart from '@/components/MarketChart'
import AIInsights from '@/components/AIInsights'
import MarketTable from '@/components/MarketTable'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useUserDashboard, useMarketData } from '@/hooks/useUserDashboard'
import { DollarSign, TrendingUp, Activity, PieChart, Loader2, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  // Fetch real data from backend
  const { dashboardData, loading: dashboardLoading, error: dashboardError } = useUserDashboard()
  const { marketData, loading: marketLoading, error: marketError } = useMarketData()

  // Debug logging for troubleshooting
  React.useEffect(() => {
    console.log('Dashboard Debug Info:', {
      dashboardData,
      loading: dashboardLoading,
      error: dashboardError,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      timestamp: new Date().toISOString()
    })
  }, [dashboardData, dashboardLoading, dashboardError])

  // Mock chart data for AAPL (would be replaced with real chart data in production)
  const chartData = [
    { time: '09:00', price: 185.20 },
    { time: '10:00', price: 186.50 },
    { time: '11:00', price: 184.80 },
    { time: '12:00', price: 187.30 },
    { time: '13:00', price: 188.90 },
    { time: '14:00', price: 187.60 },
    { time: '15:00', price: 189.45 },
    { time: '16:00', price: 190.20 },
  ]

  // Loading state
  if (dashboardLoading || marketLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-trade-navy">
          <DashboardHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Loading your dashboard...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  // Error state
  if (dashboardError || marketError) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-trade-navy">
          <DashboardHeader />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
                <p className="text-gray-400">{dashboardError || marketError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-trade-navy">
        <DashboardHeader />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Hero Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Welcome to tradenet.im
            </h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl">
              Advanced trading platform with AI-powered analytics and real-time market insights
            </p>
          </div>

          {/* Stats Cards - Mobile-First Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatsCard
              title="Account Value"
              value={dashboardData?.portfolio.totalBalance 
                ? `$${dashboardData.portfolio.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : dashboardLoading ? 'Loading...' : dashboardError ? 'Error' : '$0.00'}
              change={dashboardData?.portfolio.totalReturn || 0}
              changePercent={dashboardData?.portfolio.totalBalance 
                ? ((dashboardData.portfolio.totalReturn / dashboardData.portfolio.totalBalance) * 100) 
                : 0}
              icon={<DollarSign className="w-5 h-5" />}
            />
            <StatsCard
              title="Portfolio Value"
              value={dashboardData?.portfolio.totalBalance 
                ? `$${dashboardData.portfolio.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : dashboardLoading ? 'Loading...' : dashboardError ? 'Error' : '$0.00'}
              change={0}
              changePercent={0}
              icon={<PieChart className="w-5 h-5" />}
            />
            <StatsCard
              title="Today's P&L"
              value={`$${dashboardData?.portfolio.todayPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`}
              change={dashboardData?.portfolio.todayPnL || 0}
              changePercent={dashboardData?.portfolio.portfolioValue 
                ? ((dashboardData.portfolio.todayPnL / dashboardData.portfolio.portfolioValue) * 100) 
                : 0}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatsCard
              title="Active Positions"
              value={dashboardData?.positions.length.toString() || '0'}
              change={0} // Could calculate change from previous day
              changePercent={0}
              icon={<Activity className="w-5 h-5" />}
            />
            <StatsCard
              title="Win Rate"
              value={`${dashboardData?.portfolio.winRate.toFixed(1) || '0.0'}%`}
              change={0} // Could calculate change from previous period
              changePercent={0}
              icon={<PieChart className="w-5 h-5" />}
            />
          </div>

          {/* Main Content Grid - Mobile-First */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-6 lg:mb-8">
            {/* Chart Section */}
            <div className="lg:col-span-2">
              <MarketChart
                data={chartData}
                symbol="AAPL"
                height={400}
                color="#10b981"
              />
            </div>

            {/* AI Insights */}
            <div className="lg:col-span-1">
              <AIInsights />
            </div>
          </div>

          {/* Market Tables - Mobile-First Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            <MarketTable
              data={marketData?.stocks.map(stock => ({
                ...stock,
                volume: 45600000, // Mock volume data
                marketCap: 2850000000000, // Mock market cap
                isWatchlisted: true // Mock watchlist status
              })) || []}
              title="Top Stocks"
              type="stocks"
            />
            <MarketTable
              data={marketData?.crypto.map(crypto => ({
                ...crypto,
                volume: 28900000000, // Mock volume data
                marketCap: 885000000000, // Mock market cap
                isWatchlisted: true // Mock watchlist status
              })) || []}
              title="Top Cryptocurrencies"
              type="crypto"
            />
          </div>

          {/* Recent Transactions Section */}
          {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 && (
            <div className="mt-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {dashboardData.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium capitalize">{transaction.type}</p>
                        <p className="text-gray-400 text-sm">{transaction.description}</p>
                        <p className="text-gray-500 text-xs">{new Date(transaction.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className={`text-lg font-semibold ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {transaction.amount >= 0 ? '+' : ''}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Debug Information - Only show if there's an error or in development */}
          {(dashboardError || process.env.NODE_ENV === 'development') && (
            <div className="mt-8">
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-red-400 mb-4">Debug Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">API Base URL:</span> <span className="text-white">{process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}</span></p>
                  <p><span className="text-gray-400">Loading State:</span> <span className="text-white">{dashboardLoading ? 'Loading' : 'Loaded'}</span></p>
                  <p><span className="text-gray-400">Error:</span> <span className="text-red-400">{dashboardError || 'None'}</span></p>
                  <p><span className="text-gray-400">Data Received:</span> <span className="text-white">{dashboardData ? 'Yes' : 'No'}</span></p>
                  {dashboardData && (
                    <p><span className="text-gray-400">Total Balance:</span> <span className="text-green-400">${dashboardData.portfolio.totalBalance}</span></p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}