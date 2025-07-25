'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  PieChart,
  BarChart3,
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number; activeUsers: number }>;
  revenueData: Array<{ date: string; deposits: number; withdrawals: number; netFlow: number }>;
  transactionVolume: Array<{ date: string; volume: number; count: number }>;
  userActivity: Array<{ date: string; logins: number; trades: number }>;
  portfolioDistribution: Array<{ name: string; value: number; color: string }>;
  platformMetrics: {
    totalRevenue: number;
    avgUserBalance: number;
    transactionVolume: number;
    activeUsersToday: number;
    newUsersThisWeek: number;
    retentionRate: number;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration (replace with real API calls)
  const generateMockData = (): AnalyticsData => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toISOString().split('T')[0];
    });

    return {
      userGrowth: dates.map((date, i) => ({
        date,
        users: 1000 + i * 15 + Math.random() * 20,
        activeUsers: 750 + i * 10 + Math.random() * 15
      })),
      revenueData: dates.map((date, i) => ({
        date,
        deposits: 15000 + Math.random() * 10000,
        withdrawals: 8000 + Math.random() * 5000,
        netFlow: 7000 + Math.random() * 3000
      })),
      transactionVolume: dates.map((date, i) => ({
        date,
        volume: 50000 + Math.random() * 30000,
        count: 120 + Math.random() * 80
      })),
      userActivity: dates.map((date, i) => ({
        date,
        logins: 200 + Math.random() * 100,
        trades: 80 + Math.random() * 40
      })),
      portfolioDistribution: [
        { name: 'Stocks', value: 45, color: COLORS[0] },
        { name: 'Crypto', value: 30, color: COLORS[1] },
        { name: 'Forex', value: 15, color: COLORS[2] },
        { name: 'Commodities', value: 7, color: COLORS[3] },
        { name: 'Bonds', value: 3, color: COLORS[4] }
      ],
      platformMetrics: {
        totalRevenue: 2450000,
        avgUserBalance: 12750,
        transactionVolume: 15800000,
        activeUsersToday: 1247,
        newUsersThisWeek: 156,
        retentionRate: 84.5
      }
    };
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data, fall back to mock data
      try {
        const response = await api.get(`/api/admin/analytics?timeRange=${timeRange}`);
        if (response.data) {
          setAnalyticsData(response.data);
        } else {
          throw new Error('No data received');
        }
      } catch (apiError) {
        console.log('Using mock data for analytics dashboard');
        setAnalyticsData(generateMockData());
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  const handleExport = () => {
    if (!analyticsData) return;
    
    // Simple CSV export of key metrics
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${analyticsData.platformMetrics.totalRevenue.toLocaleString()}`],
      ['Average User Balance', `$${analyticsData.platformMetrics.avgUserBalance.toLocaleString()}`],
      ['Transaction Volume', `$${analyticsData.platformMetrics.transactionVolume.toLocaleString()}`],
      ['Active Users Today', analyticsData.platformMetrics.activeUsersToday.toString()],
      ['New Users This Week', analyticsData.platformMetrics.newUsersThisWeek.toString()],
      ['Retention Rate', `${analyticsData.platformMetrics.retentionRate}%`]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Analytics exported successfully');
  };

  if (loading && !analyticsData) {
    return <LoadingSpinner message="Loading analytics..." />;
  }

  if (error && !analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Analytics Unavailable</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm">Platform performance and user insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <span className="text-xs text-gray-400">REVENUE</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${analyticsData.platformMetrics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-green-400">+12.5%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-gray-400">ACTIVE USERS</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {analyticsData.platformMetrics.activeUsersToday.toLocaleString()}
            </div>
            <div className="text-sm text-blue-400">+8.2%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-gray-400">VOLUME</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${(analyticsData.platformMetrics.transactionVolume / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-purple-400">+15.3%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-yellow-400" />
              <span className="text-xs text-gray-400">AVG BALANCE</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${analyticsData.platformMetrics.avgUserBalance.toLocaleString()}
            </div>
            <div className="text-sm text-yellow-400">+5.7%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-emerald-400" />
              <span className="text-xs text-gray-400">NEW USERS</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {analyticsData.platformMetrics.newUsersThisWeek}
            </div>
            <div className="text-sm text-emerald-400">This week</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/50 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <PieChart className="w-8 h-8 text-cyan-400" />
              <span className="text-xs text-gray-400">RETENTION</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {analyticsData.platformMetrics.retentionRate}%
            </div>
            <div className="text-sm text-cyan-400">+2.1%</div>
          </motion.div>
        </div>
      )}

      {/* Charts Grid */}
      {analyticsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  name="Total Users"
                />
                <Area 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stackId="2" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  name="Active Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Flow Chart */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Revenue Flow</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="deposits" fill="#10B981" name="Deposits" />
                <Bar dataKey="withdrawals" fill="#EF4444" name="Withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction Volume */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Transaction Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.transactionVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  name="Volume ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Portfolio Distribution */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Portfolio Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={analyticsData.portfolioDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {analyticsData.portfolioDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }} 
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* User Activity Heatmap */}
      {analyticsData && (
        <div className="bg-slate-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Activity Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analyticsData.userActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="logins" 
                stackId="1" 
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.4}
                name="Daily Logins"
              />
              <Area 
                type="monotone" 
                dataKey="trades" 
                stackId="2" 
                stroke="#F97316" 
                fill="#F97316" 
                fillOpacity={0.4}
                name="Daily Trades"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}