'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Repeat,
  Edit3,
  Trash2,
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

interface Transaction {
  id: number;
  user_id: number;
  type: 'deposit' | 'withdrawal' | 'trade' | 'adjustment';
  amount: number;
  description: string;
  created_at: string;
  admin_id?: number;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  admin?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Filters {
  search: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  userId: string;
}

interface CreateTransactionData {
  user_id: number;
  type: 'deposit' | 'withdrawal' | 'trade' | 'adjustment';
  amount: number;
  description: string;
}

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [sortField, setSortField] = useState<keyof Transaction>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    userId: ''
  });

  const [createFormData, setCreateFormData] = useState<CreateTransactionData>({
    user_id: 0,
    type: 'deposit',
    amount: 0,
    description: ''
  });

  const itemsPerPage = 20;

  // Fetch transactions
  const fetchTransactions = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/transactions?page=${page}&limit=${itemsPerPage}`);
      
      if (response.data) {
        setTransactions(response.data.transactions || []);
        setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage));
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = useMemo(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.user?.email.toLowerCase().includes(searchLower) ||
        transaction.user?.first_name.toLowerCase().includes(searchLower) ||
        transaction.user?.last_name.toLowerCase().includes(searchLower) ||
        transaction.id.toString().includes(searchLower)
      );
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(transaction => transaction.type === filters.type);
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.created_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.created_at) <= new Date(filters.dateTo)
      );
    }

    // Apply amount filters
    if (filters.amountMin) {
      filtered = filtered.filter(transaction => 
        Math.abs(transaction.amount) >= parseFloat(filters.amountMin)
      );
    }
    if (filters.amountMax) {
      filtered = filtered.filter(transaction => 
        Math.abs(transaction.amount) <= parseFloat(filters.amountMax)
      );
    }

    // Apply user ID filter
    if (filters.userId) {
      filtered = filtered.filter(transaction => 
        transaction.user_id.toString().includes(filters.userId)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, filters, sortField, sortDirection]);

  useEffect(() => {
    setFilteredTransactions(applyFiltersAndSort);
  }, [applyFiltersAndSort]);

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]);

  // Handle sorting
  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle create transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createFormData.user_id || !createFormData.amount || !createFormData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await api.post(`/api/admin/users/${createFormData.user_id}/transactions`, createFormData);
      
      if (response.data) {
        toast.success('Transaction created successfully');
        setShowCreateModal(false);
        setCreateFormData({ user_id: 0, type: 'deposit', amount: 0, description: '' });
        fetchTransactions(currentPage);
      }
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      toast.error(err.message || 'Failed to create transaction');
    }
  };

  // Export transactions
  const handleExport = () => {
    const csvContent = [
      ['ID', 'User ID', 'User Email', 'Type', 'Amount', 'Description', 'Date', 'Admin'],
      ...filteredTransactions.map(t => [
        t.id,
        t.user_id,
        t.user?.email || '',
        t.type,
        t.amount,
        t.description,
        new Date(t.created_at).toLocaleDateString(),
        t.admin ? `${t.admin.first_name} ${t.admin.last_name}` : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Transactions exported successfully');
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'withdrawal': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'trade': return <Repeat className="w-4 h-4 text-blue-400" />;
      case 'adjustment': return <Edit3 className="w-4 h-4 text-yellow-400" />;
      default: return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get transaction color
  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-400' : 'text-red-400';
  };

  if (loading && transactions.length === 0) {
    return <LoadingSpinner message="Loading transactions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction Management</h1>
          <p className="text-gray-400 text-sm">Manage and monitor all platform transactions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 rounded-xl p-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="trade">Trade</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Min Amount</label>
                  <input
                    type="number"
                    value={filters.amountMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Amount</label>
                  <input
                    type="number"
                    value={filters.amountMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                    placeholder="No limit"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setFilters({
                  search: '', type: '', dateFrom: '', dateTo: '', 
                  amountMin: '', amountMax: '', userId: ''
                })}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
              <span className="text-sm text-gray-400">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions Table */}
      <div className="bg-slate-800/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600/50"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-2">
                    ID
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600/50"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-2">
                    Amount
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-slate-600/50"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-2">
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredTransactions.map((transaction) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    #{transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-white font-medium">
                        {transaction.user ? `${transaction.user.first_name} ${transaction.user.last_name}` : 'Unknown User'}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {transaction.user?.email || `User ID: ${transaction.user_id}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.type)}
                      <span className="text-sm text-white capitalize">{transaction.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${getTransactionColor(transaction.amount)}`}>
                      {transaction.amount >= 0 ? '+' : ''}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && !loading && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No transactions found</h3>
            <p className="text-gray-400">Try adjusting your filters or create a new transaction.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Transaction Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Create Transaction</h2>
              
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
                  <input
                    type="number"
                    value={createFormData.user_id || ''}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, user_id: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={createFormData.type}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="deposit">Deposit</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="trade">Trade</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={createFormData.amount || ''}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Transaction
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTransaction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Transaction Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Transaction ID</label>
                    <p className="text-white">#{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">User ID</label>
                    <p className="text-white">{selectedTransaction.user_id}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400">User</label>
                  <p className="text-white">
                    {selectedTransaction.user ? 
                      `${selectedTransaction.user.first_name} ${selectedTransaction.user.last_name}` : 
                      'Unknown User'
                    }
                  </p>
                  {selectedTransaction.user && (
                    <p className="text-gray-400 text-sm">{selectedTransaction.user.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Type</label>
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(selectedTransaction.type)}
                      <span className="text-white capitalize">{selectedTransaction.type}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Amount</label>
                    <p className={`font-semibold ${getTransactionColor(selectedTransaction.amount)}`}>
                      {selectedTransaction.amount >= 0 ? '+' : ''}${selectedTransaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400">Description</label>
                  <p className="text-white">{selectedTransaction.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400">Date</label>
                  <p className="text-white">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                </div>

                {selectedTransaction.admin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Created by Admin</label>
                    <p className="text-white">
                      {`${selectedTransaction.admin.first_name} ${selectedTransaction.admin.last_name}`}
                    </p>
                    <p className="text-gray-400 text-sm">{selectedTransaction.admin.email}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-6">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}