"use client";

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, Activity, BarChart3 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatTrigger from '@/components/ChatTrigger';

const TRADING_PAIRS = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 45230.50, change: 2.45, icon: <Bitcoin className="w-5 h-5 text-yellow-400" /> },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 2847.30, change: -1.20, icon: <Activity className="w-5 h-5 text-blue-400" /> },
  { symbol: 'USDT/USD', name: 'Tether', price: 1.00, change: 0.01, icon: <DollarSign className="w-5 h-5 text-green-400" /> },
];

const RECENT_TRADES = [
  { id: 1, symbol: 'BTC/USD', type: 'buy', amount: 0.15, price: 45100.00, time: '14:32:15' },
  { id: 2, symbol: 'ETH/USD', type: 'sell', amount: 2.5, price: 2851.20, time: '14:28:42' },
  { id: 3, symbol: 'BTC/USD', type: 'buy', amount: 0.05, price: 45050.75, time: '14:25:18' },
];

export default function TradingPage() {
  const [selectedPair, setSelectedPair] = useState(TRADING_PAIRS[0]);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOrderStatus('idle');
    
    // Mock API call
    setTimeout(() => {
      if (amount && (orderType === 'market' || price)) {
        setOrderStatus('success');
        setAmount('');
        setPrice('');
      } else {
        setOrderStatus('error');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Trading Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Pairs */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Trading Pairs</h2>
            <div className="space-y-3">
              {TRADING_PAIRS.map((pair) => (
                <button
                  key={pair.symbol}
                  onClick={() => setSelectedPair(pair)}
                  className={`w-full p-4 rounded-xl border transition-all ${
                    selectedPair.symbol === pair.symbol
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {pair.icon}
                      <div className="text-left">
                        <div className="text-white font-medium">{pair.symbol}</div>
                        <div className="text-gray-400 text-sm">{pair.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">${pair.price.toLocaleString()}</div>
                      <div className={`text-sm ${pair.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pair.change >= 0 ? '+' : ''}{pair.change}%
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Trades</h2>
            <div className="space-y-3">
              {RECENT_TRADES.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.type.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white text-sm">{trade.symbol}</div>
                      <div className="text-gray-400 text-xs">{trade.amount} @ ${trade.price.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs">{trade.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trading Panel */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Chart Placeholder */}
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {selectedPair.icon}
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedPair.symbol}</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-white">${selectedPair.price.toLocaleString()}</span>
                      <span className={`flex items-center text-sm ${selectedPair.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedPair.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {selectedPair.change >= 0 ? '+' : ''}{selectedPair.change}%
                      </span>
                    </div>
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <div className="h-64 bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Price Chart Coming Soon</p>
                  <p className="text-sm">Real-time trading charts will be available here</p>
                </div>
              </div>
            </div>

            {/* Buy Orders */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Buy {selectedPair.symbol}</h3>
              <form onSubmit={handleTrade} className="space-y-4">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('market')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      orderType === 'market' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('limit')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      orderType === 'limit' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    Limit
                  </button>
                </div>

                {orderType === 'limit' && (
                  <div>
                    <label className="block text-gray-300 mb-1">Price (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-green-500"
                      placeholder="Enter price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 mb-1">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-green-500"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center"
                  disabled={loading}
                  onClick={() => setTradeType('buy')}
                >
                  {loading && tradeType === 'buy' ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <TrendingUp className="w-5 h-5 mr-2" />
                  )}
                  Buy {selectedPair.symbol}
                </button>
              </form>
            </div>

            {/* Sell Orders */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sell {selectedPair.symbol}</h3>
              <form onSubmit={handleTrade} className="space-y-4">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('market')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      orderType === 'market' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('limit')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      orderType === 'limit' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    Limit
                  </button>
                </div>

                {orderType === 'limit' && (
                  <div>
                    <label className="block text-gray-300 mb-1">Price (USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-red-500"
                      placeholder="Enter price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 mb-1">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-red-500"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors flex items-center justify-center"
                  disabled={loading}
                  onClick={() => setTradeType('sell')}
                >
                  {loading && tradeType === 'sell' ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <TrendingDown className="w-5 h-5 mr-2" />
                  )}
                  Sell {selectedPair.symbol}
                </button>
              </form>
            </div>
          </div>

          {/* Order Status */}
          {orderStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center text-green-400">
                <TrendingUp className="w-5 h-5 mr-2" />
                Order placed successfully!
              </div>
            </div>
          )}
          {orderStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center text-red-400">
                <TrendingDown className="w-5 h-5 mr-2" />
                Please fill in all required fields.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Support for Trading Help */}
      <ChatTrigger 
        variant="help" 
        floating={true}
        text="Need trading help?"
      />
      </div>
    </ProtectedRoute>
  );
}