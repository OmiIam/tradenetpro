'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  AlertTriangle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  CreditCard
} from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { MobileInput, MobileSelect, MobileTextarea } from '@/components/ui/MobileForm';
import Modal from '@/components/ui/Modal';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import toast from 'react-hot-toast';

interface WithdrawalRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  amount: number;
  withdrawal_method: 'bank_transfer' | 'crypto' | 'paypal';
  bank_details?: {
    account_number: string;
    routing_number: string;
    account_holder_name: string;
    bank_name: string;
  };
  crypto_details?: {
    wallet_address: string;
    network: 'bitcoin' | 'ethereum' | 'tron';
  };
  paypal_details?: {
    email: string;
  };
  notes?: string;
  status: 'pending_tax_payment' | 'tax_paid' | 'processing' | 'completed' | 'rejected';
  tax_fee: number;
  tax_paid: boolean;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

interface WithdrawalManagementProps {
  className?: string;
}

const WithdrawalManagement: React.FC<WithdrawalManagementProps> = ({ className = '' }) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'mark_tax_paid' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    search: ''
  });

  // Mock data for demo - replace with real API calls
  useEffect(() => {
    fetchWithdrawals();
  }, [filters]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with real API call
      const mockWithdrawals: WithdrawalRequest[] = [
        {
          id: 1,
          user_id: 1,
          user_name: 'John Doe',
          user_email: 'john@example.com',
          amount: 5000,
          withdrawal_method: 'bank_transfer',
          bank_details: {
            account_number: '1234567890',
            routing_number: '123456789',
            account_holder_name: 'John Doe',
            bank_name: 'Bank of America'
          },
          status: 'pending_tax_payment',
          tax_fee: 600,
          tax_paid: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          user_id: 2,
          user_name: 'Jane Smith',
          user_email: 'jane@example.com',
          amount: 2500,
          withdrawal_method: 'crypto',
          crypto_details: {
            wallet_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            network: 'bitcoin'
          },
          status: 'tax_paid',
          tax_fee: 300,
          tax_paid: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      // Apply filters
      let filteredWithdrawals = mockWithdrawals;
      
      if (filters.status) {
        filteredWithdrawals = filteredWithdrawals.filter(w => w.status === filters.status);
      }
      
      if (filters.method) {
        filteredWithdrawals = filteredWithdrawals.filter(w => w.withdrawal_method === filters.method);
      }
      
      if (filters.search) {
        filteredWithdrawals = filteredWithdrawals.filter(w => 
          w.user_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          w.user_email.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setWithdrawals(filteredWithdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (withdrawalId: number, newStatus: string, notes: string = '') => {
    try {
      // Mock API call - replace with real endpoint
      console.log('Updating withdrawal:', { withdrawalId, newStatus, notes });
      
      // Update local state
      setWithdrawals(prev => prev.map(w => 
        w.id === withdrawalId 
          ? { ...w, status: newStatus as any, admin_notes: notes, updated_at: new Date().toISOString() }
          : w
      ));

      toast.success(`Withdrawal ${newStatus.replace('_', ' ')} successfully`);
      setShowDetailsModal(false);
      setSelectedWithdrawal(null);
      setActionType(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast.error('Failed to update withdrawal status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-400" />;
      case 'tax_paid':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'pending_tax_payment':
      default:
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'processing':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'tax_paid':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'pending_tax_payment':
      default:
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_tax_payment':
        return 'Tax Payment Required';
      case 'tax_paid':
        return 'Tax Paid - Pending Review';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'crypto':
        return 'Cryptocurrency';
      case 'paypal':
        return 'PayPal';
      default:
        return method;
    }
  };

  const renderActionButtons = (withdrawal: WithdrawalRequest) => {
    switch (withdrawal.status) {
      case 'pending_tax_payment':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedWithdrawal(withdrawal);
              setActionType('mark_tax_paid');
              setShowDetailsModal(true);
            }}
          >
            Mark Tax Paid
          </Button>
        );
      case 'tax_paid':
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setSelectedWithdrawal(withdrawal);
                setActionType('approve');
                setShowDetailsModal(true);
              }}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setSelectedWithdrawal(withdrawal);
                setActionType('reject');
                setShowDetailsModal(true);
              }}
            >
              Reject
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderDetailsModal = () => {
    if (!selectedWithdrawal) return null;

    return (
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedWithdrawal(null);
          setActionType(null);
          setAdminNotes('');
        }}
        title={`Withdrawal Request #${selectedWithdrawal.id}`}
      >
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
            <h4 className="text-white font-semibold mb-3">User Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400 block">Name</span>
                <span className="text-white">{selectedWithdrawal.user_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email</span>
                <span className="text-white">{selectedWithdrawal.user_email}</span>
              </div>
            </div>
          </div>

          {/* Withdrawal Details */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
            <h4 className="text-white font-semibold mb-3">Withdrawal Details</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="text-white font-semibold">{formatCurrency(selectedWithdrawal.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tax Fee (6%)</span>
                <span className="text-amber-400 font-semibold">{formatCurrency(selectedWithdrawal.tax_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method</span>
                <span className="text-white">{getMethodLabel(selectedWithdrawal.withdrawal_method)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs border ${getStatusColor(selectedWithdrawal.status)}`}>
                  {getStatusIcon(selectedWithdrawal.status)}
                  <span>{getStatusLabel(selectedWithdrawal.status)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Details */}
          {selectedWithdrawal.bank_details && (
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
              <h4 className="text-white font-semibold mb-3">Bank Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-slate-400">Account Holder:</span> <span className="text-white">{selectedWithdrawal.bank_details.account_holder_name}</span></div>
                <div><span className="text-slate-400">Bank:</span> <span className="text-white">{selectedWithdrawal.bank_details.bank_name}</span></div>
                <div><span className="text-slate-400">Account:</span> <span className="text-white">****{selectedWithdrawal.bank_details.account_number.slice(-4)}</span></div>
                <div><span className="text-slate-400">Routing:</span> <span className="text-white">{selectedWithdrawal.bank_details.routing_number}</span></div>
              </div>
            </div>
          )}

          {selectedWithdrawal.crypto_details && (
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
              <h4 className="text-white font-semibold mb-3">Crypto Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="text-slate-400">Network:</span> <span className="text-white capitalize">{selectedWithdrawal.crypto_details.network}</span></div>
                <div><span className="text-slate-400">Wallet:</span> <span className="text-white font-mono">{selectedWithdrawal.crypto_details.wallet_address}</span></div>
              </div>
            </div>
          )}

          {selectedWithdrawal.paypal_details && (
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
              <h4 className="text-white font-semibold mb-3">PayPal Details</h4>
              <div className="text-sm">
                <span className="text-slate-400">Email:</span> <span className="text-white">{selectedWithdrawal.paypal_details.email}</span>
              </div>
            </div>
          )}

          {/* User Notes */}
          {selectedWithdrawal.notes && (
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
              <h4 className="text-white font-semibold mb-2">User Notes</h4>
              <p className="text-slate-300 text-sm">{selectedWithdrawal.notes}</p>
            </div>
          )}

          {/* Admin Action */}
          {actionType && (
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
              <h4 className="text-white font-semibold mb-3">
                {actionType === 'approve' ? 'Approve Withdrawal' :
                 actionType === 'reject' ? 'Reject Withdrawal' :
                 'Mark Tax as Paid'}
              </h4>
              
              {actionType === 'mark_tax_paid' ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                  <p className="text-green-400 text-sm">
                    Confirm that the user has paid the tax fee of {formatCurrency(selectedWithdrawal.tax_fee)}.
                    This will move the withdrawal to "Tax Paid" status for processing.
                  </p>
                </div>
              ) : actionType === 'approve' ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                  <p className="text-blue-400 text-sm">
                    This will approve the withdrawal and initiate the transfer of {formatCurrency(selectedWithdrawal.amount)} 
                    to the user's {getMethodLabel(selectedWithdrawal.withdrawal_method).toLowerCase()} account.
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">
                    This will reject the withdrawal request. Please provide a reason for the rejection.
                  </p>
                </div>
              )}

              <MobileTextarea
                label="Admin Notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionType === 'reject' ? 'Reason for rejection (required)' :
                  actionType === 'approve' ? 'Optional processing notes' :
                  'Tax payment verification notes'
                }
                rows={3}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedWithdrawal(null);
                setActionType(null);
                setAdminNotes('');
              }}
            >
              Cancel
            </Button>
            
            {actionType && (
              <Button
                variant={actionType === 'reject' ? 'danger' : 'primary'}
                onClick={() => {
                  const newStatus = 
                    actionType === 'approve' ? 'completed' :
                    actionType === 'reject' ? 'rejected' :
                    'processing';
                  
                  handleStatusUpdate(selectedWithdrawal.id, newStatus, adminNotes);
                }}
                disabled={actionType === 'reject' && !adminNotes.trim()}
              >
                {actionType === 'approve' ? 'Approve Withdrawal' :
                 actionType === 'reject' ? 'Reject Request' :
                 'Mark Tax Paid'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowDownLeft className="w-5 h-5 text-blue-400" />
            <span>Withdrawal Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveGrid cols={{ base: 1, sm: 3 }} gap="md">
            <MobileInput
              label="Search"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={<Search className="w-4 h-4" />}
            />
            
            <MobileSelect
              label="Status"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending_tax_payment', label: 'Tax Payment Required' },
                { value: 'tax_paid', label: 'Tax Paid' },
                { value: 'processing', label: 'Processing' },
                { value: 'completed', label: 'Completed' },
                { value: 'rejected', label: 'Rejected' }
              ]}
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            />
            
            <MobileSelect
              label="Method"
              options={[
                { value: '', label: 'All Methods' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'crypto', label: 'Cryptocurrency' },
                { value: 'paypal', label: 'PayPal' }
              ]}
              value={filters.method}
              onChange={(value) => setFilters(prev => ({ ...prev, method: value }))}
            />
          </ResponsiveGrid>
        </CardContent>
      </Card>

      {/* Withdrawals List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Withdrawal Requests ({withdrawals.length})</CardTitle>
            <Button onClick={fetchWithdrawals} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 bg-slate-700 rounded w-32"></div>
                    <div className="h-6 bg-slate-700 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-slate-700 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-48"></div>
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <ArrowDownLeft className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No withdrawal requests found</p>
              <p className="text-slate-500 text-sm">Withdrawal requests will appear here when users submit them</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <motion.div
                  key={withdrawal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{withdrawal.user_name}</h4>
                        <p className="text-slate-400 text-sm">{withdrawal.user_email}</p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm border ${getStatusColor(withdrawal.status)}`}>
                      {getStatusIcon(withdrawal.status)}
                      <span>{getStatusLabel(withdrawal.status)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-slate-400 block">Amount</span>
                      <span className="text-white font-semibold">{formatCurrency(withdrawal.amount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tax Fee</span>
                      <span className="text-amber-400 font-semibold">{formatCurrency(withdrawal.tax_fee)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Method</span>
                      <span className="text-white">{getMethodLabel(withdrawal.withdrawal_method)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Created</span>
                      <span className="text-white">{formatDate(withdrawal.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-slate-500 text-sm">
                      Request #{withdrawal.id}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {renderActionButtons(withdrawal)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {renderDetailsModal()}
    </div>
  );
};

export default WithdrawalManagement;