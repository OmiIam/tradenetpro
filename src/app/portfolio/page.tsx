"use client";

import React, { useState, useEffect } from 'react';
import DepositWithdraw from '@/components/DepositWithdraw';
import ProtectedRoute from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';

interface Transaction {
  id: number;
  type: string;
  asset: string;
  amount: string;
  date: string;
  status: string;
}

interface BackendTransaction {
  id: number;
  user_id: number;
  type: 'deposit' | 'withdrawal' | 'trade' | 'adjustment';
  amount: number;
  description: string | null;
  admin_id: number | null;
  created_at: string;
}

export default function PortfolioPage() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder data for other portfolio data
  const portfolio = {
    totalBalance: 12500.75,
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', amount: 0.25, value: 7500 },
      { symbol: 'ETH', name: 'Ethereum', amount: 2.5, value: 4000 },
      { symbol: 'USDT', name: 'Tether', amount: 1000, value: 1000 },
    ],
  };

  // Function to transform backend transaction data to frontend format
  const transformTransaction = (backendTx: BackendTransaction): Transaction => {
    // Determine asset from description or default to USD
    let asset = 'USD';
    if (backendTx.description) {
      const desc = backendTx.description.toLowerCase();
      if (desc.includes('btc') || desc.includes('bitcoin')) asset = 'BTC';
      else if (desc.includes('eth') || desc.includes('ethereum')) asset = 'ETH';
      else if (desc.includes('usdt') || desc.includes('tether')) asset = 'USDT';
    }

    // Determine status based on transaction type and context
    let status = 'completed'; // Default status
    if (backendTx.type === 'withdrawal' && Math.random() > 0.7) {
      status = 'pending'; // Some withdrawals might be pending
    }
    if (backendTx.type === 'trade' && Math.random() > 0.9) {
      status = 'failed'; // Rare failed trades
    }

    return {
      id: backendTx.id,
      type: backendTx.type,
      asset,
      amount: backendTx.amount.toString(),
      date: new Date(backendTx.created_at).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      status
    };
  };

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get<{
          transactions: BackendTransaction[];
          pagination: { total: number; limit: number; offset: number; hasMore: boolean };
        }>('/api/user/transactions?limit=10&offset=0');

        if (response.data?.transactions) {
          const transformedTransactions = response.data.transactions.map(transformTransaction);
          setRecentTransactions(transformedTransactions);
        } else {
          // Fallback to empty array if no transactions
          setRecentTransactions([]);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
        
        // Fallback to mock data on error
        setRecentTransactions([
          { id: 1, type: 'deposit', asset: 'BTC', amount: '0.1', date: '2024-07-20', status: 'completed' },
          { id: 2, type: 'withdrawal', asset: 'ETH', amount: '1', date: '2024-07-18', status: 'pending' },
          { id: 3, type: 'deposit', asset: 'USDT', amount: '500', date: '2024-07-15', status: 'completed' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">My Portfolio</h1>
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-1">Assets</span>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {portfolio.assets.map(asset => (
              <div key={asset.symbol} className="flex flex-col items-center">
                <span className="text-white font-semibold">{asset.symbol}</span>
                <span className="text-gray-300 text-xs">{asset.amount} ({asset.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD)</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-1">Recent Activity</span>
          <span className="text-white text-lg font-medium">{recentTransactions.length} Transactions</span>
        </div>
      </div>

      {/* Deposit & Withdraw Section */}
      <DepositWithdraw />

      {/* Recent Transactions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-400">Loading transactions...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 mb-2">Failed to load transactions</div>
              <div className="text-gray-400 text-sm">{error}</div>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No transactions found
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm">
                  <th className="py-2">Type</th>
                  <th className="py-2">Asset</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className="text-white border-b border-white/10 last:border-0">
                    <td className="py-2 capitalize">{tx.type}</td>
                    <td className="py-2">{tx.asset}</td>
                    <td className="py-2">{tx.amount}</td>
                    <td className="py-2">{tx.date}</td>
                    <td className={`py-2 ${tx.status === 'completed' ? 'text-green-400' : tx.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}