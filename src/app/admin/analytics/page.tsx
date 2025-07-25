'use client';

import React, { useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Activity, Download } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/admin/StatCard';
import AnalyticsCharts from '@/components/admin/AnalyticsCharts';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';

function AnalyticsPageContent() {
  const { 
    state, 
    fetchStats,
    fetchUsers,
    fetchTransactions,
    hasPermission
  } = useAdmin();

  const canExport = hasPermission('analytics:export');

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchTransactions();
  }, [fetchStats, fetchUsers, fetchTransactions]);

  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Mock previous period data for growth calculations
  const previousPeriod = {
    totalUsers: Math.max(0, state.stats.totalUsers - 50),
    activeUsers: Math.max(0, state.stats.activeUsers - 25),
    transactionVolume: Math.max(0, state.stats.transactionVolume - 10000),
    totalTransactions: Math.max(0, state.stats.totalTransactions - 100)
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Comprehensive platform performance insights</p>
        </div>
        
        {canExport && (
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </Button>
        )}
      </div>

      {/* Key Performance Indicators */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Key Performance Indicators</h2>
        <ResponsiveGrid cols={{ base: 1, sm: 2, lg: 4 }} gap="lg">
          <StatCard
            title="Total Users"
            value={state.stats.totalUsers}
            delta={{
              value: calculateGrowthRate(state.stats.totalUsers, previousPeriod.totalUsers),
              isPositive: state.stats.totalUsers >= previousPeriod.totalUsers
            }}
            icon={Users}
            color="blue"
            animated={true}
          />
          
          <StatCard
            title="Active Users"
            value={state.stats.activeUsers}
            delta={{
              value: calculateGrowthRate(state.stats.activeUsers, previousPeriod.activeUsers),
              isPositive: state.stats.activeUsers >= previousPeriod.activeUsers
            }}
            icon={Activity}
            color="green"
            animated={true}
          />
          
          <StatCard
            title="Transaction Volume"
            value={`$${state.stats.transactionVolume.toLocaleString()}`}
            delta={{
              value: calculateGrowthRate(state.stats.transactionVolume, previousPeriod.transactionVolume),
              isPositive: state.stats.transactionVolume >= previousPeriod.transactionVolume
            }}
            icon={DollarSign}
            color="amber"
            animated={true}
          />
          
          <StatCard
            title="Total Transactions"
            value={state.stats.totalTransactions}
            delta={{
              value: calculateGrowthRate(state.stats.totalTransactions, previousPeriod.totalTransactions),
              isPositive: state.stats.totalTransactions >= previousPeriod.totalTransactions
            }}
            icon={TrendingUp}
            color="purple"
            animated={true}
          />
        </ResponsiveGrid>
      </div>

      {/* Visual Analytics Charts */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Performance Analytics</h2>
        <AnalyticsCharts />
      </div>

      {/* Analytics Cards */}
      <ResponsiveGrid cols={{ base: 1, lg: 2 }} gap="lg">
        {/* User Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>User Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">User Growth Rate</span>
              <span className="text-white font-medium">
                {calculateGrowthRate(state.stats.totalUsers, previousPeriod.totalUsers).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Active User Ratio</span>
              <span className="text-white font-medium">
                {state.stats.totalUsers > 0 
                  ? ((state.stats.activeUsers / state.stats.totalUsers) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">New Users (Last 30 Days)</span>
              <span className="text-white font-medium">
                {Math.max(0, state.stats.totalUsers - previousPeriod.totalUsers)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Pending KYC</span>
              <span className="text-white font-medium">{state.stats.pendingKyc}</span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Average Transaction Size</span>
              <span className="text-white font-medium">
                ${state.stats.totalTransactions > 0 
                  ? (state.stats.transactionVolume / state.stats.totalTransactions).toFixed(2)
                  : '0.00'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Volume Growth Rate</span>
              <span className="text-white font-medium">
                {calculateGrowthRate(state.stats.transactionVolume, previousPeriod.transactionVolume).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Transaction Success Rate</span>
              <span className="text-white font-medium">98.5%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Daily Avg Transactions</span>
              <span className="text-white font-medium">
                {Math.round(state.stats.totalTransactions / 30)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">System Status</span>
              <span className={`font-medium capitalize ${
                state.stats.systemHealth === 'healthy' ? 'text-green-400' :
                state.stats.systemHealth === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {state.stats.systemHealth}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">API Response Time</span>
              <span className="text-white font-medium">145ms</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Database Connections</span>
              <span className="text-white font-medium">12/100</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Server Load</span>
              <span className="text-white font-medium">23%</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-400">New Users Today</span>
                </div>
                <span className="text-white font-medium">
                  {Math.round((state.stats.totalUsers - previousPeriod.totalUsers) / 30)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400">Transactions Today</span>
                </div>
                <span className="text-white font-medium">
                  {Math.round(state.stats.totalTransactions / 30)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-400">Pending Reviews</span>
                </div>
                <span className="text-white font-medium">{state.stats.pendingKyc}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-400">Support Tickets</span>
                </div>
                <span className="text-white font-medium">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </ResponsiveGrid>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminProvider>
        <AdminLayout title="Analytics" subtitle="Platform performance metrics and insights">
          <AnalyticsPageContent />
        </AdminLayout>
      </AdminProvider>
    </ProtectedRoute>
  );
}