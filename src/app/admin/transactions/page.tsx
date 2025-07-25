'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, Download, Ban, CheckCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminProvider, useAdmin, AdminTransaction } from '@/contexts/AdminContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MobileInput, MobileSelect } from '@/components/ui/MobileForm';
import MobileTable from '@/components/ui/MobileTable';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { useConfirmation, confirmationActions } from '@/components/ui/ConfirmationModal';

interface TransactionFilters {
  search: string;
  status: string;
  type: string;
  dateRange: string;
}

function TransactionsPageContent() {
  const { 
    state, 
    fetchTransactions, 
    updateTransaction,
    cancelTransaction,
    hasPermission
  } = useAdmin();
  
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    status: '',
    type: '',
    dateRange: ''
  });

  const { confirm, ConfirmationModal } = useConfirmation();
  const canWrite = hasPermission('transactions:write');

  useEffect(() => {
    fetchTransactions(1, filters);
  }, [fetchTransactions, filters]);

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCancelTransaction = (transaction: AdminTransaction) => {
    confirm(confirmationActions.cancelTransaction(
      {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type
      },
      () => cancelTransaction(transaction.id)
    ));
  };

  const transactionColumns = [
    {
      key: 'details',
      label: 'Transaction',
      primary: true,
      render: (_, transaction: AdminTransaction) => (
        <div>
          <p className="font-semibold">{transaction.id}</p>
          <p className="text-sm text-gray-400 capitalize">{transaction.type}</p>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      primary: true,
      render: (amount: number, transaction: AdminTransaction) => (
        <div className="text-right">
          <p className="font-semibold">${amount.toFixed(2)}</p>
          <p className="text-sm text-gray-400">{transaction.currency}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      primary: true,
      render: (status: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          status === 'completed' ? 'bg-green-900/20 text-green-400' :
          status === 'pending' ? 'bg-yellow-900/20 text-yellow-400' :
          status === 'failed' ? 'bg-red-900/20 text-red-400' :
          'bg-gray-900/20 text-gray-400'
        }`}>
          {status}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Date',
      secondary: true,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      key: 'user_id',
      label: 'User ID',
      secondary: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <ResponsiveGrid cols={{ base: 1, sm: 2, lg: 4 }} gap="md">
            <MobileInput
              label="Search"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            
            <MobileSelect
              label="Status"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            />
            
            <MobileSelect
              label="Type"
              options={[
                { value: '', label: 'All Types' },
                { value: 'deposit', label: 'Deposit' },
                { value: 'withdrawal', label: 'Withdrawal' },
                { value: 'trade', label: 'Trade' },
                { value: 'transfer', label: 'Transfer' }
              ]}
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
            />
            
            <MobileSelect
              label="Date Range"
              options={[
                { value: '', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' }
              ]}
              value={filters.dateRange}
              onChange={(value) => handleFilterChange('dateRange', value)}
            />
          </ResponsiveGrid>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions ({state.pagination.transactions.total})</CardTitle>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <MobileTable
            data={state.transactions}
            columns={transactionColumns}
            loading={state.loading.transactions}
            emptyMessage="No transactions found"
            onRowClick={(transaction) => {
              if (canWrite && transaction.status === 'pending') {
                handleCancelTransaction(transaction);
              }
            }}
          />
        </CardContent>
      </Card>

      <ConfirmationModal />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminProvider>
        <AdminLayout title="Transaction Management" subtitle="Monitor and manage platform transactions">
          <TransactionsPageContent />
        </AdminLayout>
      </AdminProvider>
    </ProtectedRoute>
  );
}