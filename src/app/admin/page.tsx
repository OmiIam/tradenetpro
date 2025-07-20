'use client'

import React, { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminStatsComponent from '@/components/admin/AdminStats'
import UserManagement from '@/components/admin/UserManagement'
import BalanceManager from '@/components/admin/BalanceManager'
import PortfolioManager from '@/components/admin/PortfolioManager'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AdminUser, AdminStats, BalanceAdjustment, PortfolioPosition } from '@/types/admin'
import { useAdminStats, useAdminUsers } from '@/hooks/useAdminData'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Use real admin data hooks
  const { stats, loading: statsLoading, error: statsError } = useAdminStats()
  const { 
    users, 
    loading: usersLoading, 
    error: usersError,
    updateUser,
    deleteUser,
    toggleUserStatus,
    adjustBalance
  } = useAdminUsers()

  const handleEditUser = async (user: AdminUser) => {
    try {
      await updateUser(user.id, {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      })
    } catch (error) {
      console.error('Failed to edit user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleToggleStatus = async (userId: string, status: 'active' | 'suspended') => {
    try {
      await toggleUserStatus(userId, status)
    } catch (error) {
      console.error('Failed to toggle user status:', error)
    }
  }

  const handleAdjustBalance = async (adjustment: BalanceAdjustment) => {
    try {
      const type = adjustment.adjustmentType === 'add' ? 'credit' : 'debit'
      await adjustBalance(adjustment.userId, adjustment.amount, type, adjustment.reason)
    } catch (error) {
      console.error('Failed to adjust balance:', error)
    }
  }

  const handleUpdatePortfolio = (userId: string, positions: PortfolioPosition[]) => {
    console.log('Update portfolio:', userId, positions)
    // Implementation for updating portfolio
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Overview</h1>
              <p className="text-gray-400">Monitor platform performance and user activity</p>
            </div>
            <AdminStatsComponent stats={stats} loading={statsLoading} error={statsError} />
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setActiveTab('users')}
              >
                <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Manage user accounts, status, and permissions
                </p>
                <div className="text-blue-400 font-medium">Manage Users →</div>
              </div>
              
              <div
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setActiveTab('balances')}
              >
                <h3 className="text-lg font-semibold text-white mb-2">Balance Manager</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Adjust user balances and track transactions
                </p>
                <div className="text-green-400 font-medium">Manage Balances →</div>
              </div>
              
              <div
                className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setActiveTab('portfolios')}
              >
                <h3 className="text-lg font-semibold text-white mb-2">Portfolio Manager</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Manage user portfolios and positions
                </p>
                <div className="text-purple-400 font-medium">Manage Portfolios →</div>
              </div>
            </div>
          </div>
        )
      case 'users':
        return (
          <UserManagement
            users={users}
            loading={usersLoading}
            error={usersError}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
          />
        )
      case 'balances':
        return (
          <BalanceManager
            users={users}
            loading={usersLoading}
            error={usersError}
            onAdjustBalance={handleAdjustBalance}
          />
        )
      case 'portfolios':
        return (
          <PortfolioManager
            users={users}
            onUpdatePortfolio={handleUpdatePortfolio}
          />
        )
      case 'transactions':
        return (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Transaction Management</h2>
            <p className="text-gray-400">Transaction management features coming soon...</p>
          </div>
        )
      case 'analytics':
        return (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Analytics Dashboard</h2>
            <p className="text-gray-400">Advanced analytics features coming soon...</p>
          </div>
        )
      case 'settings':
        return (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Admin Settings</h2>
            <p className="text-gray-400">Platform settings and configuration options coming soon...</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-trade-navy flex">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}