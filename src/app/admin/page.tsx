'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Users, 
  CreditCard, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  DollarSign,
  Plus,
  UserCheck,
  FileCheck,
  Shield,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminProvider, useAdmin } from '@/contexts/AdminContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatCard from '@/components/admin/StatCard';
import BalanceAdjustmentModal from '@/components/admin/BalanceAdjustmentModal';
import UserStatusToggle from '@/components/admin/UserStatusToggle';
import KycVerificationPanel from '@/components/admin/KycVerificationPanel';
import AuditLog, { AuditLogEntry } from '@/components/admin/AuditLog';
import { adminApi, AdminMetadata, BackendUser } from '@/lib/admin-api';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';
import { 
  DashboardSkeleton, 
  UserListSkeleton, 
  KycDocumentSkeleton, 
  AuditLogSkeleton 
} from '@/components/ui/LoadingSkeletons';

// Real data interfaces - transform BackendUser to match component expectations
interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'suspended' | 'inactive';
  created_at: string;
  last_login?: string; // Transform null to undefined for component compatibility
  role: 'user' | 'admin';
  updated_at: string;
  total_balance?: number;
}

interface KycDocument {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  document_type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill';
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_id?: number;
  reviewer_name?: string;
  comments?: string;
}



function AdminOverviewContent() {
  const { state, fetchStats, fetchUsers, fetchTransactions, fetchKycDocuments } = useAdmin();
  const { stats, loading, errors } = state;
  
  // Local state for admin features
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'kyc' | 'audit'>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [adminMetadata, setAdminMetadata] = useState<AdminMetadata | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataErrors, setDataErrors] = useState<Record<string, string>>({});

  // Real-time data sync function
  const syncAllData = useCallback(async () => {
    try {
      setDataErrors({});
      
      // Fetch admin metadata first
      const metadata = await adminApi.getAdminMetadata();
      setAdminMetadata(metadata);
      
      // Fetch all data in parallel
      const [usersResponse, kycResponse, auditResponse] = await Promise.allSettled([
        adminApi.getRealUsers(1, 20),
        adminApi.getKycDocuments(1, 20),
        adminApi.getAuditLogs(1, 50)
      ]);
      
      // Handle users data - transform BackendUser to AdminUser
      if (usersResponse.status === 'fulfilled') {
        const transformedUsers: AdminUser[] = usersResponse.value.users.map(user => ({
          ...user,
          last_login: user.last_login || undefined, // Transform null to undefined
          total_balance: (user as any).total_balance || 0 // Handle optional balance field
        }));
        setUsers(transformedUsers);
      } else {
        console.error('Failed to fetch users:', usersResponse.reason);
        setDataErrors(prev => ({ ...prev, users: 'Failed to load users' }));
      }
      
      // Handle KYC documents
      if (kycResponse.status === 'fulfilled') {
        setKycDocuments(kycResponse.value.documents);
      } else {
        console.error('Failed to fetch KYC documents:', kycResponse.reason);
        setDataErrors(prev => ({ ...prev, kyc: 'Failed to load KYC documents' }));
      }
      
      // Handle audit logs
      if (auditResponse.status === 'fulfilled') {
        setAuditEntries(auditResponse.value.logs);
      } else {
        console.error('Failed to fetch audit logs:', auditResponse.reason);
        setDataErrors(prev => ({ ...prev, audit: 'Failed to load audit logs' }));
      }
      
    } catch (error) {
      console.error('Failed to sync admin data:', error);
      setDataErrors(prev => ({ ...prev, general: 'Failed to sync data' }));
    } finally {
      setIsLoadingData(false);
    }
  }, []);
  
  // Set up real-time sync
  const { isLoading: isSyncing, lastSync, forceSync } = useRealTimeSync(
    syncAllData,
    {
      interval: 30000, // 30 seconds
      immediate: true,
      syncOnFocus: true,
      notifications: true,
      maxFailures: 3
    }
  );
  
  useEffect(() => {
    // Fetch initial data from AdminContext
    fetchStats();
    fetchUsers(1);
    fetchTransactions(1);
    fetchKycDocuments(1);
  }, [fetchStats, fetchUsers, fetchTransactions, fetchKycDocuments]);

  // Admin action handlers with dynamic metadata
  const handleBalanceAdjustment = async (userId: number, amount: number, type: 'add' | 'subtract', reason: string) => {
    try {
      // Use real API to adjust balance
      const adjustmentType = type === 'add' ? 'credit' : 'debit';
      await adminApi.adjustBalance(userId, amount, adjustmentType, reason);
      
      // Create audit log entry with dynamic admin metadata
      const targetUser = users.find(u => u.id === userId);
      if (targetUser && adminMetadata) {
        await adminApi.createAuditLog({
          action_type: 'balance_adjustment',
          target_user_id: userId,
          target_user_name: `${targetUser.first_name} ${targetUser.last_name}`,
          target_user_email: targetUser.email,
          details: { 
            amount, 
            adjustment_type: type, 
            reason,
            admin_id: adminMetadata.id,
            admin_name: adminMetadata.name,
            admin_email: adminMetadata.email,
            ip_address: adminMetadata.ip_address
          }
        });
      }
      
      // Force a data sync to get updated information
      forceSync();
      
    } catch (error) {
      console.error('Balance adjustment failed:', error);
      throw error;
    }
  };

  const handleUserStatusChange = async (userId: number, newStatus: 'active' | 'suspended') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user || !adminMetadata) return;

      // Update user status via API
      await adminApi.toggleUserStatus(userId, newStatus);
      
      // Create audit log entry with dynamic admin metadata
      await adminApi.createAuditLog({
        action_type: newStatus === 'active' ? 'user_activation' : 'user_suspension',
        target_user_id: userId,
        target_user_name: `${user.first_name} ${user.last_name}`,
        target_user_email: user.email,
        details: { 
          previous_status: user.status, 
          new_status: newStatus,
          admin_id: adminMetadata.id,
          admin_name: adminMetadata.name,
          admin_email: adminMetadata.email,
          ip_address: adminMetadata.ip_address
        }
      });
      
      // Force a data sync to get updated information
      forceSync();
      
    } catch (error) {
      console.error('Status change failed:', error);
      throw error;
    }
  };

  const handleKycVerification = async (documentId: number, status: 'approved' | 'rejected', comments: string) => {
    try {
      const document = kycDocuments.find(d => d.id === documentId);
      if (!document || !adminMetadata) return;

      // Note: Real KYC verification API endpoint would go here
      // await adminApi.verifyKycDocument(documentId, status, comments);
      
      // Create audit log entry with dynamic admin metadata
      await adminApi.createAuditLog({
        action_type: status === 'approved' ? 'kyc_approval' : 'kyc_rejection',
        target_user_id: document.user_id,
        target_user_name: document.user_name,
        target_user_email: document.user_email,
        details: { 
          document_type: document.document_type, 
          document_id: documentId,
          comments,
          admin_id: adminMetadata.id,
          admin_name: adminMetadata.name,
          admin_email: adminMetadata.email,
          ip_address: adminMetadata.ip_address
        }
      });
      
      // Force a data sync to get updated information
      forceSync();
      
    } catch (error) {
      console.error('KYC verification failed:', error);
      throw error;
    }
  };

  if (loading.stats || isLoadingData) {
    return <DashboardSkeleton />;
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'users':
        return renderUsersTab();
      case 'kyc':
        return renderKycTab();
      case 'audit':
        return renderAuditTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <>
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
            format="number"
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
            format="number"
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
            format="number"
          />

          <StatCard
            title="Volume"
            value={typeof stats.transactionVolume === 'number' 
              ? stats.transactionVolume
              : stats.transactionVolume}
            delta={{
              value: 12.5,
              isPositive: true,
              label: "Transaction volume"
            }}
            icon={DollarSign}
            color="amber"
            subtitle="Total value"
            format="currency"
          />
        </ResponsiveGrid>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => setShowBalanceModal(true)}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Plus className="w-6 h-6" />
                <span>Adjust Balance</span>
              </Button>
              
              <Button
                onClick={() => setActiveTab('users')}
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <UserCheck className="w-6 h-6" />
                <span>Manage Users</span>
              </Button>
              
              <Button
                onClick={() => setActiveTab('kyc')}
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <FileCheck className="w-6 h-6" />
                <span>Review KYC</span>
              </Button>
              
              <Button
                onClick={() => setActiveTab('audit')}
                variant="secondary"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Shield className="w-6 h-6" />
                <span>Audit Log</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Status & Recent Activity - keeping existing code */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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

          {/* Recent Activity - using real user data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent User Activity</span>
                {isSyncing && <Activity className="w-4 h-4 animate-spin text-blue-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
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
                
                {users.length === 0 && !isSyncing && (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-gray-400">No users to display</p>
                  </div>
                )}
                
                {isSyncing && users.length === 0 && (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 py-2 animate-pulse">
                        <div className="w-8 h-8 bg-slate-700 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <div className="h-4 bg-slate-700 rounded w-32" />
                          <div className="h-3 bg-slate-700 rounded w-48" />
                        </div>
                        <div className="h-6 bg-slate-700 rounded w-16" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </ResponsiveGrid>
      </motion.div>
    </>
  );

  const renderUsersTab = () => {
    if (dataErrors.users) {
      return (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center space-x-4 p-8">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-red-400 font-semibold">Failed to Load Users</h3>
              <p className="text-slate-300">{dataErrors.users}</p>
              <Button onClick={forceSync} className="mt-2">Retry</Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (isSyncing && users.length === 0) {
      return <UserListSkeleton count={5} />;
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>User Management</span>
              {lastSync && (
                <span className="text-sm text-slate-400">
                  Last updated: {new Date(lastSync).toLocaleTimeString()}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <UserStatusToggle
                    key={user.id}
                    user={user}
                    onStatusChange={handleUserStatusChange}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderKycTab = () => {
    if (dataErrors.kyc) {
      return (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center space-x-4 p-8">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-red-400 font-semibold">Failed to Load KYC Documents</h3>
              <p className="text-slate-300">{dataErrors.kyc}</p>
              <Button onClick={forceSync} className="mt-2">Retry</Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (isSyncing && kycDocuments.length === 0) {
      return <KycDocumentSkeleton count={3} />;
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <KycVerificationPanel
          documents={kycDocuments}
          onVerifyDocument={handleKycVerification}
        />
      </motion.div>
    );
  };

  const renderAuditTab = () => {
    if (dataErrors.audit) {
      return (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center space-x-4 p-8">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="text-red-400 font-semibold">Failed to Load Audit Logs</h3>
              <p className="text-slate-300">{dataErrors.audit}</p>
              <Button onClick={forceSync} className="mt-2">Retry</Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (isSyncing && auditEntries.length === 0) {
      return <AuditLogSkeleton count={5} />;
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AuditLog entries={auditEntries} />
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header with Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-lg text-slate-400">Monitor platform performance and manage users</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-700">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'kyc', label: 'KYC', icon: FileCheck },
              { id: 'audit', label: 'Audit Log', icon: Shield }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Balance Adjustment Modal */}
      <BalanceAdjustmentModal
        isOpen={showBalanceModal}
        onClose={() => setShowBalanceModal(false)}
        onAdjustBalance={handleBalanceAdjustment}
      />
    </div>
  );

}

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminErrorBoundary>
        <AdminProvider>
          <AdminLayout>
            <AdminOverviewContent />
          </AdminLayout>
        </AdminProvider>
      </AdminErrorBoundary>
    </ProtectedRoute>
  );
}