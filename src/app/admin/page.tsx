'use client';

import React, { useEffect } from 'react';
import { Users, CreditCard, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Activity, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatCard from '@/components/admin/StatCard';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';

function AdminOverviewContent() {
  const { state, fetchStats, fetchUsers, fetchTransactions, fetchKycDocuments } = useAdmin();
  const { stats, loading, errors } = state;

  useEffect(() => {
    // Fetch initial data
    fetchStats();
    fetchUsers(1);
    fetchTransactions(1);
    fetchKycDocuments(1);
  }, [fetchStats, fetchUsers, fetchTransactions, fetchKycDocuments]);

  if (loading.stats) {
    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-4xl font-bold text-white tracking-tight">Admin Overview</h1>
          <p className="text-lg text-slate-400">Monitor platform performance and user activity</p>
        </motion.div>
        
        <ResponsiveGrid cols={{ base: 1, sm: 2, xl: 4 }} gap="lg">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <StatCard
                title="Loading..."
                value="---"
                icon={Activity}
                loading={true}
              />
            </motion.div>
          ))}
        </ResponsiveGrid>
      </div>
    );
  }

  if (errors.stats) {
    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-4xl font-bold text-white tracking-tight">Admin Overview</h1>
          <p className="text-lg text-slate-400">Monitor platform performance and user activity</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="flex items-center space-x-4 p-8">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Dashboard</h3>
                <p className="text-slate-300 leading-relaxed">{errors.stats}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Calculate growth metrics for enhanced display
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const growth = ((current - previous) / previous) * 100;
    return { value: Math.abs(growth), isPositive: growth >= 0 };
  };

  const userGrowth = calculateGrowth(stats.activeUsers, Math.max(1, stats.totalUsers - stats.activeUsers));
  const transactionGrowth = calculateGrowth(stats.totalTransactions, Math.max(1, stats.totalTransactions - 100));

  return (
    <div className="space-y-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <h1 className="text-4xl font-bold text-white tracking-tight">Admin Overview</h1>
        <p className="text-lg text-slate-400">Monitor platform performance and user activity</p>
      </motion.div>

      {/* Enhanced Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ResponsiveGrid cols={{ base: 1, sm: 2, xl: 4 }} gap="lg">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            delta={{
              value: userGrowth.value,
              isPositive: userGrowth.isPositive,
              label: `Active: ${stats.activeUsers.toLocaleString()}`
            }}
            icon={Users}
            color="blue"
            subtitle="Registered users"
          />

          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            delta={{
              value: stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0,
              isPositive: true,
              label: "Engagement rate"
            }}
            icon={Activity}
            color="green"
            subtitle="Currently active"
          />

          <StatCard
            title="Transactions"
            value={stats.totalTransactions}
            delta={{
              value: transactionGrowth.value,
              isPositive: transactionGrowth.isPositive,
              label: "Total processed"
            }}
            icon={CreditCard}
            color="purple"
            subtitle="All transactions"
          />

          <StatCard
            title="Volume"
            value={typeof stats.transactionVolume === 'number' 
              ? `$${stats.transactionVolume.toLocaleString()}` 
              : stats.transactionVolume}
            delta={{
              value: 12.5,
              isPositive: true,
              label: "Transaction volume"
            }}
            icon={DollarSign}
            color="amber"
            subtitle="Total value"
          />
        </ResponsiveGrid>
      </motion.div>

      {/* System Status & Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ResponsiveGrid cols={{ base: 1, lg: 2 }} gap="xl">
          {/* Enhanced System Health */}
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className={`w-4 h-4 rounded-full ${
                    stats.systemHealth === 'healthy' ? 'bg-green-500 shadow-lg shadow-green-500/30' :
                    stats.systemHealth === 'warning' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' : 'bg-red-500 shadow-lg shadow-red-500/30'
                  } animate-pulse`} />
                  <span className="text-white">System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm text-slate-400 font-medium">Status</span>
                    <p className={`text-lg font-semibold capitalize ${
                      stats.systemHealth === 'healthy' ? 'text-green-400' :
                      stats.systemHealth === 'warning' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {stats.systemHealth}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm text-slate-400 font-medium">Pending KYC</span>
                    <p className="text-lg font-semibold text-white">{stats.pendingKyc}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm text-slate-400 font-medium">Server Load</span>
                    <p className="text-lg font-semibold text-green-400">Normal</p>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-sm text-slate-400 font-medium">Uptime</span>
                    <p className="text-lg font-semibold text-white">99.9%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Quick Actions */}
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/admin/users'}
                    className="group relative p-5 bg-gradient-to-br from-blue-600/80 to-blue-700/80 hover:from-blue-500/90 hover:to-blue-600/90 rounded-xl transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                    <Users className="w-7 h-7 text-white mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <div className="relative z-10">
                      <div className="text-white font-semibold mb-1">Manage Users</div>
                      <div className="text-blue-100 text-sm opacity-90">{stats.totalUsers.toLocaleString()} total</div>
                    </div>
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/admin/transactions'}
                    className="group relative p-5 bg-gradient-to-br from-green-600/80 to-green-700/80 hover:from-green-500/90 hover:to-green-600/90 rounded-xl transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                    <CreditCard className="w-7 h-7 text-white mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <div className="relative z-10">
                      <div className="text-white font-semibold mb-1">Transactions</div>
                      <div className="text-green-100 text-sm opacity-90">{stats.totalTransactions.toLocaleString()} total</div>
                    </div>
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/admin/kyc'}
                    className="group relative p-5 bg-gradient-to-br from-amber-600/80 to-amber-700/80 hover:from-amber-500/90 hover:to-amber-600/90 rounded-xl transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                    <ShieldCheck className="w-7 h-7 text-white mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <div className="relative z-10">
                      <div className="text-white font-semibold mb-1">KYC Review</div>
                      <div className="text-amber-100 text-sm opacity-90">{stats.pendingKyc} pending</div>
                    </div>
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/admin/analytics'}
                    className="group relative p-5 bg-gradient-to-br from-purple-600/80 to-purple-700/80 hover:from-purple-500/90 hover:to-purple-600/90 rounded-xl transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                    <TrendingUp className="w-7 h-7 text-white mb-3 group-hover:scale-110 transition-transform duration-200" />
                    <div className="relative z-10">
                      <div className="text-white font-semibold mb-1">Analytics</div>
                      <div className="text-purple-100 text-sm opacity-90">View reports</div>
                    </div>
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </ResponsiveGrid>
      </motion.div>

      {/* Recent Activity */}
      <ResponsiveGrid cols={{ base: 1, lg: 2 }} gap="lg">
        <Card>
          <CardHeader>
            <CardTitle>Recent User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.first_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-900/20 text-green-400' :
                    user.status === 'inactive' ? 'bg-gray-900/20 text-gray-400' :
                    'bg-red-900/20 text-red-400'
                  }`}>
                    {user.status}
                  </span>
                </div>
              ))}
              
              {state.users.length === 0 && (
                <p className="text-gray-400 text-center py-4">No users to display</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-500' :
                      transaction.status === 'pending' ? 'bg-yellow-500' :
                      transaction.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <p className="text-white font-medium capitalize">{transaction.type}</p>
                      <p className="text-gray-400 text-sm">{transaction.currency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">${transaction.amount.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm capitalize">{transaction.status}</p>
                  </div>
                </div>
              ))}
              
              {state.transactions.length === 0 && (
                <p className="text-gray-400 text-center py-4">No transactions to display</p>
              )}
            </div>
          </CardContent>
        </Card>
      </ResponsiveGrid>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminProvider>
        <AdminLayout>
          <AdminOverviewContent />
        </AdminLayout>
      </AdminProvider>
    </ProtectedRoute>
  );
}