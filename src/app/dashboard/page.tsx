'use client'

import React from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import StatsCard from '@/components/StatsCard'
import MarketChart from '@/components/MarketChart'
import AIInsights from '@/components/AIInsights'
import MarketTable from '@/components/MarketTable'
import ProtectedRoute from '@/components/ProtectedRoute'
import ResponsiveLayout from '@/components/layout/ResponsiveLayout'
import ResponsiveContainer, { ResponsiveGrid } from '@/components/layout/ResponsiveContainer'
import { MobileStatCard, MobileTabs } from '@/components/ui/MobileCard'
import { MobileMarketTable } from '@/components/ui/MobileTable'
import { SkeletonCard, SkeletonChart } from '@/components/ui/SkeletonLoader'
import { useMobile } from '@/components/layout/ResponsiveContainer'
import { useUserDashboard, useMarketData } from '@/hooks/useUserDashboard'
import { DollarSign, TrendingUp, Activity, PieChart, Loader2, AlertCircle, BarChart3, Wallet } from 'lucide-react'

export default function Dashboard() {
  const [activeTab, setActiveTab] = React.useState('overview')
  const isMobile = useMobile()
  
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

  // Mobile tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <Wallet className="w-4 h-4" /> },
    { id: 'markets', label: 'Markets', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'insights', label: 'AI Insights', icon: <Activity className="w-4 h-4" /> }
  ]

  // Loading state
  if (dashboardLoading || marketLoading) {
    return (
      <ProtectedRoute>
        <ResponsiveLayout showMobileNav={true} header={!isMobile ? <DashboardHeader /> : undefined}>
          <ResponsiveContainer>
            {isMobile ? (
              <div className="space-y-4">
                <SkeletonCard />
                <div className="grid grid-cols-2 gap-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
                <SkeletonChart />
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Loading your dashboard...</p>
                </div>
              </div>
            )}
          </ResponsiveContainer>
        </ResponsiveLayout>
      </ProtectedRoute>
    )
  }

  // Error state
  if (dashboardError || marketError) {
    return (
      <ProtectedRoute>
        <ResponsiveLayout showMobileNav={true} header={!isMobile ? <DashboardHeader /> : undefined}>
          <ResponsiveContainer>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
                <p className="text-gray-400 mb-4">{dashboardError || marketError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </ResponsiveContainer>
        </ResponsiveLayout>
      </ProtectedRoute>
    )
  }

  // Content render functions
  const renderMobileOverview = () => (
    <div className="space-y-4">
      {/* Quick Stats Grid */}
      <ResponsiveGrid cols={{ base: 2 }} gap="sm">
        <MobileStatCard
          title="Account Value"
          value={dashboardData?.portfolio.totalBalance || 0}
          icon={<DollarSign className="w-4 h-4" />}
          trend={dashboardData?.portfolio.totalReturn ? {
            value: ((dashboardData.portfolio.totalReturn / dashboardData.portfolio.totalBalance) * 100),
            positive: dashboardData.portfolio.totalReturn >= 0
          } : undefined}
          color="blue"
        />
        <MobileStatCard
          title="Today's P&L"
          value={`$${dashboardData?.portfolio.todayPnL?.toFixed(2) || '0.00'}`}
          icon={<TrendingUp className="w-4 h-4" />}
          trend={dashboardData?.portfolio.todayPnL ? {
            value: Math.abs(dashboardData.portfolio.todayPnL),
            positive: dashboardData.portfolio.todayPnL >= 0
          } : undefined}
          color={dashboardData?.portfolio.todayPnL >= 0 ? "green" : "red"}
        />
      </ResponsiveGrid>

      {/* Chart - Compact for mobile */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3">Market Overview</h3>
        <MarketChart
          data={chartData}
          symbol="AAPL"
          height={200}
          color="#10b981"
        />
      </div>

      {/* Quick Actions */}
      <ResponsiveGrid cols={{ base: 3 }} gap="sm">
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-sm font-medium transition-colors">
          Buy
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg text-sm font-medium transition-colors">
          Sell
        </button>
        <button className="bg-slate-600 hover:bg-slate-700 text-white p-3 rounded-lg text-sm font-medium transition-colors">
          Transfer
        </button>
      </ResponsiveGrid>
    </div>
  )

  const renderDesktopContent = () => (
    <ResponsiveContainer>
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome to TradePro
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Advanced trading platform with AI-powered analytics and real-time market insights
        </p>
      </div>

      {/* Stats Cards */}
      <ResponsiveGrid cols={{ base: 1, sm: 2, lg: 3, xl: 5 }} gap="lg" className="mb-8">
        <StatsCard
          title="Account Value"
          value={dashboardData?.portfolio.totalBalance || 0}
          change={dashboardData?.portfolio.totalReturn || 0}
          changePercent={dashboardData?.portfolio.totalBalance 
            ? ((dashboardData.portfolio.totalReturn / dashboardData.portfolio.totalBalance) * 100) 
            : 0}
          icon={<DollarSign className="w-5 h-5" />}
          animated={true}
          glowColor="blue"
        />
        <StatsCard
          title="Portfolio Value"
          value={dashboardData?.portfolio.totalBalance || 0}
          change={0}
          changePercent={0}
          icon={<PieChart className="w-5 h-5" />}
          animated={true}
        />
        <StatsCard
          title="Today's P&L"
          value={`$${dashboardData?.portfolio.todayPnL?.toFixed(2) || '0.00'}`}
          change={dashboardData?.portfolio.todayPnL || 0}
          changePercent={dashboardData?.portfolio.portfolioValue 
            ? ((dashboardData.portfolio.todayPnL / dashboardData.portfolio.portfolioValue) * 100) 
            : 0}
          icon={<TrendingUp className="w-5 h-5" />}
          animated={true}
          glowColor={dashboardData?.portfolio.todayPnL >= 0 ? "green" : "red"}
        />
        <StatsCard
          title="Active Positions"
          value={dashboardData?.positions?.length?.toString() || '0'}
          change={0}
          changePercent={0}
          icon={<Activity className="w-5 h-5" />}
          animated={true}
        />
        <StatsCard
          title="Win Rate"
          value={`${dashboardData?.portfolio.winRate?.toFixed(1) || '0.0'}%`}
          change={0}
          changePercent={0}
          icon={<PieChart className="w-5 h-5" />}
          animated={true}
        />
      </ResponsiveGrid>

      {/* Main Content Grid */}
      <ResponsiveGrid cols={{ base: 1, lg: 3 }} gap="lg" className="mb-8">
        <div className="lg:col-span-2">
          <MarketChart
            data={chartData}
            symbol="AAPL"
            height={400}
            color="#10b981"
          />
        </div>
        <div>
          <AIInsights />
        </div>
      </ResponsiveGrid>

      {/* Market Tables */}
      <ResponsiveGrid cols={{ base: 1, xl: 2 }} gap="lg">
        <MarketTable
          data={marketData?.stocks?.map(stock => ({
            ...stock,
            volume: 45600000,
            marketCap: 2850000000000,
            isWatchlisted: true
          })) || []}
          title="Top Stocks"
          type="stocks"
        />
        <MarketTable
          data={marketData?.crypto?.map(crypto => ({
            ...crypto,
            volume: 28900000000,
            marketCap: 885000000000,
            isWatchlisted: true
          })) || []}
          title="Top Cryptocurrencies"
          type="crypto"
        />
      </ResponsiveGrid>
    </ResponsiveContainer>
  )

  return (
    <ProtectedRoute>
      <ResponsiveLayout 
        showMobileNav={true} 
        header={!isMobile ? <DashboardHeader /> : undefined}
      >
        {isMobile ? (
          <ResponsiveContainer>
            {/* Mobile Header */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
              <p className="text-gray-400 text-sm">Welcome back to TradePro</p>
            </div>

            {/* Mobile Tabs */}
            <MobileTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className="mb-4"
            />

            {/* Mobile Content */}
            {activeTab === 'overview' && renderMobileOverview()}
            {activeTab === 'portfolio' && (
              <div className="text-center py-8">
                <p className="text-gray-400">Portfolio view coming soon</p>
              </div>
            )}
            {activeTab === 'markets' && (
              <div className="space-y-4">
                <MobileMarketTable
                  data={marketData?.stocks?.slice(0, 8) || []}
                  title="Top Stocks"
                  type="stocks"
                />
                <MobileMarketTable
                  data={marketData?.crypto?.slice(0, 5) || []}
                  title="Top Crypto"
                  type="crypto"
                />
              </div>
            )}
            {activeTab === 'insights' && <AIInsights />}
          </ResponsiveContainer>
        ) : (
          renderDesktopContent()
        )}

        {/* Authentication Notice */}
        {dashboardError && (dashboardError.includes('Authentication') || dashboardError.includes('token')) && (
          <ResponsiveContainer>
            <div className="mt-8">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">⚠️ Authentication Required</h3>
                <p className="text-yellow-100 mb-4">
                  You need to be logged in to view your dashboard. Please sign in to access your account.
                </p>
                <button 
                  onClick={() => window.location.href = '/login'} 
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          </ResponsiveContainer>
        )}
      </ResponsiveLayout>
    </ProtectedRoute>
  )
}