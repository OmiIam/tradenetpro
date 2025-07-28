'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  CreditCard,
  ArrowDownLeft,
  Info,
  RefreshCw
} from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface WithdrawalRequest {
  id: number;
  amount: number;
  withdrawal_method: 'bank_transfer' | 'crypto' | 'paypal';
  status: 'pending_tax_payment' | 'tax_paid' | 'processing' | 'completed' | 'rejected';
  tax_fee: number;
  tax_paid: boolean;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

interface WithdrawalHistoryProps {
  className?: string;
}

const WithdrawalHistory: React.FC<WithdrawalHistoryProps> = ({ className = '' }) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/user/withdrawal');
      const responseData = response.data || response;
      
      if (responseData.success) {
        setWithdrawals(responseData.data || []);
      } else {
        throw new Error(responseData.error || 'Failed to fetch withdrawal history');
      }
    } catch (err: any) {
      console.error('Error fetching withdrawal history:', err);
      setError(err.message || 'Failed to load withdrawal history');
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

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
        return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
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

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="w-4 h-4" />;
      case 'crypto':
        return <DollarSign className="w-4 h-4" />;
      case 'paypal':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowDownLeft className="w-5 h-5 text-blue-400" />
            <span>Withdrawal History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 bg-slate-700 rounded w-24"></div>
                    <div className="h-4 bg-slate-700 rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-slate-700 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-40"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowDownLeft className="w-5 h-5 text-blue-400" />
            <span>Withdrawal History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={fetchWithdrawals} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <ArrowDownLeft className="w-5 h-5 text-blue-400" />
            <span>Withdrawal History</span>
          </CardTitle>
          <Button onClick={fetchWithdrawals} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <ArrowDownLeft className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No withdrawal requests yet</p>
            <p className="text-slate-500 text-sm">Your withdrawal history will appear here</p>
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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(withdrawal.withdrawal_method)}
                    <span className="text-slate-300 text-sm font-medium">
                      {getMethodLabel(withdrawal.withdrawal_method)}
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                    {getStatusIcon(withdrawal.status)}
                    <span>{getStatusLabel(withdrawal.status)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(withdrawal.amount)}
                    </div>
                    <div className="text-slate-400 text-sm">
                      Tax Fee: {formatCurrency(withdrawal.tax_fee)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-slate-400 text-sm mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(withdrawal.created_at)}</span>
                    </div>
                    <div className="text-slate-500 text-xs">
                      Request #{withdrawal.id}
                    </div>
                  </div>
                </div>

                {/* Status-specific information */}
                {withdrawal.status === 'pending_tax_payment' && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mt-3">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-orange-400 font-medium mb-1">Action Required</p>
                        <p className="text-orange-200/90">
                          Please pay the tax fee of {formatCurrency(withdrawal.tax_fee)} to proceed with your withdrawal.
                          Check your email for payment instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {withdrawal.status === 'tax_paid' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-yellow-400 font-medium mb-1">Under Review</p>
                        <p className="text-yellow-200/90">
                          Your tax payment has been received and is being verified by our admin team.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {withdrawal.status === 'processing' && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-3">
                    <div className="flex items-start space-x-2">
                      <RefreshCw className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-blue-400 font-medium mb-1">Processing</p>
                        <p className="text-blue-200/90">
                          Your withdrawal is being processed and will be transferred to your account soon.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {withdrawal.status === 'completed' && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-3">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-green-400 font-medium mb-1">Completed</p>
                        <p className="text-green-200/90">
                          Your withdrawal has been completed successfully.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {withdrawal.status === 'rejected' && withdrawal.admin_notes && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-3">
                    <div className="flex items-start space-x-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="text-red-400 font-medium mb-1">Rejected</p>
                        <p className="text-red-200/90">{withdrawal.admin_notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WithdrawalHistory;