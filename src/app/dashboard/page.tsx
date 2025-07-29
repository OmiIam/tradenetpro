'use client'

import React from 'react'
import DashboardHeader from '@/components/DashboardHeader'
import StatsCard from '@/components/StatsCard'
import MarketChart from '@/components/MarketChart'
import AIInsights from '@/components/AIInsights'
import MarketTable from '@/components/MarketTable'
import ChatTrigger from '@/components/ChatTrigger'
import ProtectedRoute from '@/components/ProtectedRoute'
import ResponsiveLayout from '@/components/layout/ResponsiveLayout'
import ResponsiveContainer, { ResponsiveGrid } from '@/components/layout/ResponsiveContainer'
import { MobileStatCard, MobileTabs } from '@/components/ui/MobileCard'
import { MobileMarketTable } from '@/components/ui/MobileTable'
import { SkeletonCard, SkeletonChart } from '@/components/ui/SkeletonLoader'
import { useMobile } from '@/components/layout/ResponsiveContainer'
import { useUserDashboard, useMarketData } from '@/hooks/useUserDashboard'
import { DollarSign, TrendingUp, Activity, PieChart, Loader2, AlertCircle, BarChart3, Wallet, Bell } from 'lucide-react'
import WithdrawalModal, { WithdrawalRequestData } from '@/components/WithdrawalModal'

export default function Dashboard() {
  const [activeTab, setActiveTab] = React.useState('overview')
  const [showWithdrawalModal, setShowWithdrawalModal] = React.useState(false)
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

  // Handle withdrawal request
  const handleWithdrawalRequest = async (data: WithdrawalRequestData) => {
    try {
      // TODO: Implement actual API call to submit withdrawal request
      console.log('Withdrawal request submitted:', data)
      // This would typically make an API call to your backend
      // await api.submitWithdrawalRequest(data)
    } catch (error) {
      console.error('Failed to submit withdrawal request:', error)
      throw error
    }
  }

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
  const renderMobileOverview = () => {
    const accountValue = dashboardData?.portfolio.totalBalance || 5899;
    const todayPnL = dashboardData?.portfolio.todayPnL || 0;
    const totalReturn = dashboardData?.portfolio.totalReturn || -5899;
    const returnPercentage = accountValue > 0 ? (totalReturn / accountValue) * 100 : -100;
    
    return (
      <div className="space-y-6 pb-8">
        {/* Enhanced Hero Account Value Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/90 via-slate-900/95 to-slate-950 rounded-3xl p-8 border border-slate-700/30 shadow-2xl backdrop-blur-sm">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 opacity-50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">Total Portfolio Value</p>
                </div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                  ${accountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${
                    returnPercentage >= 0 
                      ? 'bg-green-500/15 text-green-400 border-green-500/30' 
                      : 'bg-red-500/15 text-red-400 border-red-500/30'
                  }`}>
                    {returnPercentage >= 0 ? '↗' : '↘'} {Math.abs(returnPercentage).toFixed(1)}%
                  </span>
                  <span className="text-slate-300 text-sm font-medium">
                    {returnPercentage >= 0 ? '+' : '-'}${Math.abs(totalReturn).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
                  <DollarSign className="w-8 h-8 text-blue-400" />
                </div>
                <span className="text-xs text-slate-400 mt-2 font-medium">USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 rounded-2xl p-5 border border-slate-700/40 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <p className="text-slate-400 text-sm font-medium">Today's P&L</p>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p className={`text-2xl font-bold mb-1 ${
              todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              ${Math.abs(todayPnL).toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {todayPnL >= 0 ? 'Profit' : 'Loss'} • 24h
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 rounded-2xl p-5 border border-slate-700/40 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <p className="text-slate-400 text-sm font-medium">Win Rate</p>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {dashboardData?.portfolio.winRate?.toFixed(1) || '0.0'}%
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Success Rate • All Time
            </p>
          </div>
        </div>

        {/* Performance Metrics Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium mb-1">Total Trades</p>
              <p className="text-lg font-bold text-white">{dashboardData?.positions?.length || '0'}</p>
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium mb-1">Avg. Return</p>
              <p className="text-lg font-bold text-blue-400">+2.4%</p>
            </div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <div className="text-center">
              <p className="text-xs text-slate-400 font-medium mb-1">Risk Score</p>
              <p className="text-lg font-bold text-amber-400">Medium</p>
            </div>
          </div>
        </div>

        {/* Enhanced Chart Section */}
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 rounded-2xl p-6 border border-slate-700/40 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <span className="text-blue-400 font-bold text-sm">📈</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">AAPL Price Chart</h3>
                  <p className="text-slate-400 text-sm">Apple Inc. • NASDAQ</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-white">$190.20</span>
                <span className="text-green-400 text-sm font-semibold">+2.45%</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 bg-slate-900/50 rounded-xl p-1 border border-slate-700/50">
              <button className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold border border-blue-500/30 transition-all">
                1D
              </button>
              <button className="px-3 py-2 text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-700/50 transition-all">
                1W
              </button>
              <button className="px-3 py-2 text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-700/50 transition-all">
                1M
              </button>
            </div>
          </div>
          <MarketChart
            data={chartData}
            symbol="AAPL"
            height={200}
            color="#10b981"
          />
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-5 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-lg">Buy</span>
            </div>
          </button>
          <button className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-5 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="w-5 h-5 rotate-180" />
              </div>
              <span className="text-lg">Sell</span>
            </div>
          </button>
        </div>
        
        {/* Enhanced Secondary Actions */}
        <div className="grid grid-cols-4 gap-3">
          <button className="bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white p-4 rounded-xl text-sm font-semibold transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50 flex flex-col items-center space-y-2">
            <Wallet className="w-5 h-5" />
            <span>Wallet</span>
          </button>
          <button className="bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white p-4 rounded-xl text-sm font-semibold transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50 flex flex-col items-center space-y-2">
            <PieChart className="w-5 h-5" />
            <span>Portfolio</span>
          </button>
          <button className="bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white p-4 rounded-xl text-sm font-semibold transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50 flex flex-col items-center space-y-2">
            <Activity className="w-5 h-5" />
            <span>History</span>
          </button>
          <button className="bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white p-4 rounded-xl text-sm font-semibold transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50 flex flex-col items-center space-y-2">
            <BarChart3 className="w-5 h-5" />
            <span>Reports</span>
          </button>
        </div>
      </div>
    );
  };

  const renderDesktopContent = () => (
    <ResponsiveContainer>
      {/* Enhanced Hero Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Welcome to TradePro
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Advanced trading platform with AI-powered analytics and real-time market insights
            </p>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            <div className="bg-slate-800/50 rounded-xl px-4 py-2 border border-slate-700/30">
              <span className="text-slate-400 text-sm">Last updated: </span>
              <span className="text-white text-sm font-medium">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="mt-6 h-px bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-transparent"></div>
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
          glowColor={dashboardData?.portfolio.todayPnL && dashboardData.portfolio.todayPnL >= 0 ? "green" : "red"}
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
            {/* Enhanced Mobile Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Dashboard</h1>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-slate-400 text-sm font-medium">Welcome back to TradePro</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <button className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/40 hover:border-slate-600/50 transition-all">
                    <Bell className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-transparent"></div>
            </div>

            {/* Enhanced Mobile Tabs */}
            <div className="bg-gradient-to-r from-slate-800/40 to-slate-900/60 rounded-2xl p-2 mb-8 border border-slate-700/40 backdrop-blur-sm shadow-lg">
              <MobileTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                className=""
              />
            </div>

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
        
        {/* Withdrawal Modal */}
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          accountBalance={dashboardData?.portfolio.totalBalance || 5899}
          onWithdrawalRequest={handleWithdrawalRequest}
        />

        {/* Floating Chat Trigger for Trading Help */}
        {!isMobile && (
          <ChatTrigger 
            variant="default" 
            floating={true}
            text="Need trading help?"
          />
        )}
      </ResponsiveLayout>
    </ProtectedRoute>
  )
}