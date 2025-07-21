"use client";

import React, { useState } from 'react';
import { Bitcoin, DollarSign, ArrowDownLeft, ArrowUpRight, Copy, CheckCircle, XCircle } from 'lucide-react';

const CRYPTOS = [
  {
    key: 'btc',
    name: 'Bitcoin',
    icon: <Bitcoin className="w-6 h-6 text-yellow-400" />,
    address: 'bc1qexamplebtcaddressplaceholder',
  },
  {
    key: 'usdt',
    name: 'USDT (Tether)',
    icon: <DollarSign className="w-6 h-6 text-green-400" />,
    address: 'TUSDTexampleaddressplaceholder',
  },
  {
    key: 'eth',
    name: 'Ethereum',
    icon: <ArrowUpRight className="w-6 h-6 text-blue-400" />,
    address: '0xExampleEthereumAddress',
  },
];

export default function DepositWithdraw() {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTOS[0].key);
  const [copied, setCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  const currentCrypto = CRYPTOS.find(c => c.key === selectedCrypto)!;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCrypto.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    // Mock API call
    setTimeout(() => {
      if (withdrawAmount && withdrawAddress) {
        setStatus('success');
      } else {
        setStatus('error');
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-xl mx-auto mt-10 shadow-lg">
      <div className="flex justify-center mb-6">
        <button
          className={`px-6 py-2 rounded-l-xl font-semibold transition-colors ${tab === 'deposit' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'}`}
          onClick={() => setTab('deposit')}
        >
          Deposit
        </button>
        <button
          className={`px-6 py-2 rounded-r-xl font-semibold transition-colors ${tab === 'withdraw' ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300'}`}
          onClick={() => setTab('withdraw')}
        >
          Withdraw
        </button>
      </div>

      {/* Crypto selection */}
      <div className="flex justify-center gap-4 mb-8">
        {CRYPTOS.map(crypto => (
          <button
            key={crypto.key}
            className={`flex flex-col items-center px-4 py-3 rounded-xl border transition-all ${selectedCrypto === crypto.key ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5'} hover:border-blue-400`}
            onClick={() => setSelectedCrypto(crypto.key)}
          >
            {crypto.icon}
            <span className="mt-2 text-sm text-white font-medium">{crypto.name}</span>
          </button>
        ))}
      </div>

      {tab === 'deposit' ? (
        <div className="text-center">
          <div className="text-gray-300 mb-2">Send {currentCrypto.name} to this address:</div>
          <div className="bg-gray-900 rounded-lg px-4 py-3 text-white font-mono text-lg flex items-center justify-between">
            <span className="truncate">{currentCrypto.address}</span>
            <button onClick={handleCopy} className="ml-3 p-1 rounded hover:bg-gray-800 transition-colors">
              {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2">Only send {currentCrypto.name} to this address. Sending any other asset may result in permanent loss.</div>
        </div>
      ) : (
        <form onSubmit={handleWithdraw} className="space-y-5">
          <div>
            <label className="block text-gray-300 mb-1">Amount</label>
            <input
              type="number"
              min="0"
              step="any"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
              placeholder={`Enter amount in ${currentCrypto.name}`}
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Destination {currentCrypto.name} Address</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-white/10 text-white focus:outline-none focus:border-blue-500"
              placeholder={`Paste your ${currentCrypto.name} address here`}
              value={withdrawAddress}
              onChange={e => setWithdrawAddress(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <ArrowDownLeft className="animate-spin mr-2 w-5 h-5" />
            ) : (
              <ArrowUpRight className="mr-2 w-5 h-5" />
            )}
            {loading ? 'Processing...' : 'Withdraw'}
          </button>
          {status === 'success' && (
            <div className="flex items-center text-green-400 mt-2"><CheckCircle className="w-5 h-5 mr-1" /> Withdrawal request submitted!</div>
          )}
          {status === 'error' && (
            <div className="flex items-center text-red-400 mt-2"><XCircle className="w-5 h-5 mr-1" /> Please fill in all fields correctly.</div>
          )}
        </form>
      )}
    </div>
  );
} 