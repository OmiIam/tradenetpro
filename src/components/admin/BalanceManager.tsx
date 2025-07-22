'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Search, 
  Plus, 
  Minus, 
  Edit3, 
  History, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { AdminUser, BalanceAdjustment } from '@/types/admin'

interface BalanceManagerProps {
  users: AdminUser[]
  loading?: boolean
  error?: string | null
  onAdjustBalance: (adjustment: BalanceAdjustment) => Promise<void>
}

const BalanceManager: React.FC<BalanceManagerProps> = ({ users, loading, error, onAdjustBalance }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustmentLoading, setAdjustmentLoading] = useState(false)
  const [adjustmentStatus, setAdjustmentStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [adjustmentError, setAdjustmentError] = useState<string>('')
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustmentType: 'add' as 'add' | 'subtract' | 'set',
    amount: '',
    reason: '',
    notes: ''
  })

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const recentAdjustments = [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      type: 'add',
      amount: 1000,
      reason: 'Promotion bonus',
      timestamp: new Date(),
      status: 'completed'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith',
      type: 'subtract',
      amount: 500,
      reason: 'Penalty for violation',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'completed'
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Bob Johnson',
      type: 'set',
      amount: 5000,
      reason: 'Account correction',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'pending'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleAdjustBalance = async () => {
    if (!selectedUser || !adjustmentForm.amount || !adjustmentForm.reason) return

    const adjustment: BalanceAdjustment = {
      userId: selectedUser.id,
      adjustmentType: adjustmentForm.adjustmentType,
      amount: parseFloat(adjustmentForm.amount),
      reason: adjustmentForm.reason,
      notes: adjustmentForm.notes
    }

    try {
      setAdjustmentLoading(true)
      setAdjustmentStatus('idle')
      setAdjustmentError('')
      
      await onAdjustBalance(adjustment)
      
      setAdjustmentStatus('success')
      
      // Auto-close modal after success
      setTimeout(() => {
        setShowAdjustModal(false)
        setAdjustmentForm({ adjustmentType: 'add', amount: '', reason: '', notes: '' })
        setSelectedUser(null)
        setAdjustmentStatus('idle')
      }, 2000)
      
    } catch (error) {
      console.error('Balance adjustment failed:', error)
      setAdjustmentStatus('error')
      setAdjustmentError(error instanceof Error ? error.message : 'Failed to adjust balance')
    } finally {
      setAdjustmentLoading(false)
    }
  }

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'subtract':
        return <Minus className="w-4 h-4 text-red-500" />
      case 'set':
        return <Edit3 className="w-4 h-4 text-blue-500" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Balance Manager</h2>
          <p className="text-gray-400">Manage user account balances and adjustments</p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="glass-dark rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users to adjust balances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(users.reduce((sum, u) => sum + u.totalBalance, 0))}
              </div>
              <div className="text-sm text-gray-400">Total Cash</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(users.reduce((sum, u) => sum + u.portfolioValue, 0))}
              </div>
              <div className="text-sm text-gray-400">Total Portfolio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(users.reduce((sum, u) => sum + u.totalBalance + u.portfolioValue, 0))}
              </div>
              <div className="text-sm text-gray-400">Total Value</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Users List */}
        <div className="glass-dark rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Balances</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">
                      {formatCurrency(user.totalBalance)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Portfolio: {formatCurrency(user.portfolioValue)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedUser(user)
                      setShowAdjustModal(true)
                    }}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Adjust Balance
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Adjustments */}
        <div className="glass-dark rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Recent Adjustments</h3>
          </div>
          <div className="space-y-3">
            {recentAdjustments.map((adjustment) => (
              <motion.div
                key={adjustment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getAdjustmentIcon(adjustment.type)}
                    <span className="text-white font-medium">{adjustment.userName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(adjustment.status)}
                    <span className="text-sm text-gray-400">{adjustment.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-bold ${
                      adjustment.type === 'add' ? 'text-green-400' : 
                      adjustment.type === 'subtract' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {adjustment.type === 'add' ? '+' : adjustment.type === 'subtract' ? '-' : ''}
                      {formatCurrency(adjustment.amount)}
                    </div>
                    <div className="text-sm text-gray-400">{adjustment.reason}</div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {adjustment.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      {showAdjustModal && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Adjust Balance - {selectedUser.firstName} {selectedUser.lastName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Balance
                </label>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(selectedUser.totalBalance)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adjustment Type
                </label>
                <select
                  value={adjustmentForm.adjustmentType}
                  onChange={(e) => setAdjustmentForm({
                    ...adjustmentForm,
                    adjustmentType: e.target.value as 'add' | 'subtract' | 'set'
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="add">Add to Balance</option>
                  <option value="subtract">Subtract from Balance</option>
                  <option value="set">Set Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm({
                    ...adjustmentForm,
                    amount: e.target.value
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reason *
                </label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({
                    ...adjustmentForm,
                    reason: e.target.value
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select reason</option>
                  <option value="Promotion bonus">Promotion bonus</option>
                  <option value="Account correction">Account correction</option>
                  <option value="Refund">Refund</option>
                  <option value="Penalty">Penalty</option>
                  <option value="Manual adjustment">Manual adjustment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({
                    ...adjustmentForm,
                    notes: e.target.value
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Status Messages */}
            {adjustmentStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mt-4"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Balance adjusted successfully!</span>
                </div>
              </motion.div>
            )}

            {adjustmentStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mt-4"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">
                    {adjustmentError || 'Failed to adjust balance'}
                  </span>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-end space-x-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowAdjustModal(false)
                  setSelectedUser(null)
                  setAdjustmentForm({ adjustmentType: 'add', amount: '', reason: '', notes: '' })
                  setAdjustmentStatus('idle')
                  setAdjustmentError('')
                }}
                disabled={adjustmentLoading}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdjustBalance}
                disabled={!adjustmentForm.amount || !adjustmentForm.reason || adjustmentLoading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {adjustmentLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>
                  {adjustmentLoading ? 'Processing...' : 'Apply Adjustment'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default BalanceManager