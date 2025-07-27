import React from 'react';
import DepositWithdraw from '@/components/DepositWithdraw';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function PortfolioPage() {
  // Placeholder data for demonstration
  const portfolio = {
    totalBalance: 12500.75,
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', amount: 0.25, value: 7500 },
      { symbol: 'ETH', name: 'Ethereum', amount: 2.5, value: 4000 },
      { symbol: 'USDT', name: 'Tether', amount: 1000, value: 1000 },
    ],
    recentTransactions: [
      { id: 1, type: 'deposit', asset: 'BTC', amount: 0.1, date: '2024-07-20', status: 'completed' },
      { id: 2, type: 'withdrawal', asset: 'ETH', amount: 1, date: '2024-07-18', status: 'pending' },
      { id: 3, type: 'deposit', asset: 'USDT', amount: 500, date: '2024-07-15', status: 'completed' },
    ],
  };

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
          <span className="text-white text-lg font-medium">{portfolio.recentTransactions.length} Transactions</span>
        </div>
      </div>

      {/* Deposit & Withdraw Section */}
      <DepositWithdraw />

      {/* Recent Transactions */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
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
              {portfolio.recentTransactions.map(tx => (
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
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}