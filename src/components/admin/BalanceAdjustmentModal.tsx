'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, DollarSign, Plus, Minus, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { adminApi } from '@/lib/admin-api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  current_balance?: number;
  total_balance?: number; // Support both field names from backend
}

interface BalanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdjustBalance: (userId: number, amount: number, type: 'add' | 'subtract', reason: string) => Promise<void>;
}

export const BalanceAdjustmentModal: React.FC<BalanceAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onAdjustBalance
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [reason, setReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      // Use real API to search users
      const users = await adminApi.searchUsers(query, 10);
      
      // Transform backend user format to component format
      const transformedUsers: User[] = users.map(user => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        current_balance: user.current_balance || user.total_balance || 0
      }));

      setSearchResults(transformedUsers);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchUsers(query);
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = () => {
    if (!selectedUser || !amount || !reason.trim()) return;
    setShowConfirmation(true);
  };

  const confirmAdjustment = async () => {
    if (!selectedUser || !amount) return;

    setLoading(true);
    try {
      await onAdjustBalance(selectedUser.id, parseFloat(amount), adjustmentType, reason);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Balance adjustment failed:', error);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setAmount('');
    setReason('');
    setSearchQuery('');
    setSearchResults([]);
    setShowConfirmation(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Adjust User Balance">
      <div className="space-y-6">
        {!showConfirmation ? (
          <>
            {/* User Search */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-800 rounded-lg border border-slate-700 max-h-60 overflow-y-auto"
                  >
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => selectUser(user)}
                        className="w-full p-4 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          </div>
                          <p className="text-green-400 font-medium">${(user.current_balance || 0).toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected User */}
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700"
              >
                <h4 className="text-white font-semibold mb-2">Selected User</h4>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white">{selectedUser.first_name} {selectedUser.last_name}</p>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Current Balance</p>
                    <p className="text-green-400 font-semibold">${(selectedUser.current_balance || 0).toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Adjustment Type */}
            <div className="space-y-3">
              <label className="text-white font-medium">Adjustment Type</label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setAdjustmentType('add')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    adjustmentType === 'add'
                      ? 'bg-green-600 border-green-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-gray-300 hover:border-green-500'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Balance</span>
                </button>
                <button
                  onClick={() => setAdjustmentType('subtract')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    adjustmentType === 'subtract'
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-gray-300 hover:border-red-500'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                  <span>Subtract Balance</span>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-3">
              <label className="text-white font-medium">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-3">
              <label className="text-white font-medium">Reason</label>
              <textarea
                placeholder="Enter reason for balance adjustment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedUser || !amount || !reason.trim()}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          /* Confirmation */
          <div className="space-y-6">
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Confirm Balance Adjustment</h3>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">User:</span>
                <span className="text-white">{selectedUser?.first_name} {selectedUser?.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current Balance:</span>
                <span className="text-green-400">${(selectedUser?.current_balance || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Adjustment:</span>
                <span className={adjustmentType === 'add' ? 'text-green-400' : 'text-red-400'}>
                  {adjustmentType === 'add' ? '+' : '-'}${parseFloat(amount || '0').toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-400">New Balance:</span>
                <span className="text-white">
                  ${(
                    (selectedUser?.current_balance || 0) + 
                    (adjustmentType === 'add' ? parseFloat(amount || '0') : -parseFloat(amount || '0'))
                  ).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <span className="text-gray-400">Reason:</span>
                <p className="text-white mt-1">{reason}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={confirmAdjustment}
                loading={loading}
                className="flex-1"
              >
                Confirm Adjustment
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BalanceAdjustmentModal;