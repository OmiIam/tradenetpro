'use client';

import React, { useState, useEffect } from 'react';
import DepositWithdraw from '@/components/DepositWithdraw';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useUserDashboard } from '@/hooks/useUserDashboard';
import { Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/lib/api';

interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'trade' | 'adjustment';
  amount: number;
  asset_type: string;
  asset_symbol?: string;
  asset_quantity?: number;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  description?: string;
  created_at: string;
  processed_at?: string;
}

export default function PortfolioPage() {
  const { dashboardData, loading: dashboardLoading } = useUserDashboard();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setTransactionsLoading(true);
        const response = await api.get('/api/user/transactions');
        const responseData = response.data || response;
        setTransactions(responseData.transactions || []);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions');
        // Use fallback data
        setTransactions([
          {
            id: 1,
            type: 'deposit',
            amount: 5000,
            asset_type: 'USD',
            status: 'confirmed',
            description: 'Initial funding',
            created_at: '2024-07-20T10:30:00Z'
          },
          {
            id: 2,
            type: 'trade',
            amount: -1852,
            asset_type: 'USD',
            asset_symbol: 'AAPL',
            asset_quantity: 10,
            status: 'confirmed',
            description: 'Purchased 10 shares of AAPL',
            created_at: '2024-07-19T15:45:00Z'
          },
          {
            id: 3,
            type: 'trade',
            amount: -1894.50,
            asset_type: 'USD',
            asset_symbol: 'MSFT',
            asset_quantity: 5,
            status: 'confirmed',
            description: 'Purchased 5 shares of MSFT',
            created_at: '2024-07-18T09:15:00Z'
          }
        ]);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const portfolio = {
    totalBalance: dashboardData?.portfolio?.totalBalance || 5000,
    assets: [
      { symbol: 'AAPL', name: 'Apple Inc.', amount: 10, value: 1900 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', amount: 5, value: 1910 },
      { symbol: 'Cash', name: 'US Dollar', amount: 1190, value: 1190 },
    ],
    recentTransactions: transactions.slice(0, 5),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string, amount: number) => {
    if (type === 'deposit' || amount > 0) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    }
    return <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  if (dashboardLoading) {
    return (
      <ProtectedRoute>
        <div className="max-w-5xl mx-auto py-10 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Loading your portfolio...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-white mb-6">My Portfolio</h1>
        
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-700/40 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">Portfolio Assets</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              {portfolio.assets.map(asset => (
                <div key={asset.symbol} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                      <span className="text-blue-400 font-bold text-xs">{asset.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <span className="text-white font-semibold text-sm">{asset.symbol}</span>
                      <p className="text-slate-400 text-xs">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{asset.amount.toLocaleString()}</p>
                    <p className="text-slate-400 text-xs">${asset.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-700/40 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm font-medium">Recent Activity</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold text-white">{transactions.length}</span>
              <p className="text-slate-400 text-sm mt-1">Total Transactions</p>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400 text-xs">Last transaction</p>
                <p className="text-white text-sm font-medium">
                  {transactions[0] ? formatDate(transactions[0].created_at) : 'No transactions'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit & Withdraw Section */}
        <DepositWithdraw />

        {/* Recent Transactions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
          
          {transactionsLoading ? (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-700/40 rounded-2xl p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mr-3" />
                <span className="text-slate-400">Loading transactions...</span>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-700/40 rounded-2xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Transactions Yet</h3>
              <p className="text-slate-400">Start trading to see your transaction history here.</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-700/40 rounded-2xl p-6 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-sm border-b border-slate-700/50">
                      <th className="py-3 px-4 font-medium">Type</th>
                      <th className="py-3 px-4 font-medium">Asset</th>
                      <th className="py-3 px-4 font-medium">Amount</th>
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="text-white border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(tx.type, tx.amount)}
                            <span className="capitalize font-medium">{tx.type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <span className="font-medium">{tx.asset_symbol || tx.asset_type}</span>
                            {tx.asset_quantity && (
                              <p className="text-slate-400 text-xs">{tx.asset_quantity} units</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`font-semibold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-slate-300">{formatDate(tx.created_at)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                            tx.status === 'confirmed' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : tx.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 