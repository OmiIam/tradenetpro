'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  DollarSign, 
  UserCheck, 
  UserX, 
  FileCheck, 
  FileX,
  Clock,
  Filter,
  Download,
  Search
} from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface AuditLogEntry {
  id: number;
  action_type: 'balance_adjustment' | 'user_suspension' | 'user_activation' | 'kyc_approval' | 'kyc_rejection';
  admin_id: number;
  admin_name: string;
  target_user_id: number;
  target_user_name: string;
  target_user_email: string;
  details: {
    amount?: number;
    adjustment_type?: 'add' | 'subtract';
    reason?: string;
    previous_status?: string;
    new_status?: string;
    document_type?: string;
    comments?: string;
  };
  timestamp: string;
  ip_address: string;
}

interface AuditLogProps {
  entries: AuditLogEntry[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export const AuditLog: React.FC<AuditLogProps> = ({
  entries,
  onLoadMore,
  hasMore = false,
  loading = false
}) => {
  const [filteredEntries, setFilteredEntries] = useState<AuditLogEntry[]>(entries);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    let filtered = entries;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(entry =>
        entry.admin_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.target_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.target_user_email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Action type filter
    if (actionTypeFilter !== 'all') {
      filtered = filtered.filter(entry => entry.action_type === actionTypeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          filterDate.setFullYear(1970);
      }

      filtered = filtered.filter(entry => new Date(entry.timestamp) >= filterDate);
    }

    setFilteredEntries(filtered);
  }, [entries, searchQuery, actionTypeFilter, dateFilter]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'balance_adjustment':
        return <DollarSign className="w-4 h-4" />;
      case 'user_suspension':
        return <UserX className="w-4 h-4" />;
      case 'user_activation':
        return <UserCheck className="w-4 h-4" />;
      case 'kyc_approval':
        return <FileCheck className="w-4 h-4" />;
      case 'kyc_rejection':
        return <FileX className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'balance_adjustment':
        return 'text-blue-400 bg-blue-400/10';
      case 'user_suspension':
        return 'text-red-400 bg-red-400/10';
      case 'user_activation':
        return 'text-green-400 bg-green-400/10';
      case 'kyc_approval':
        return 'text-green-400 bg-green-400/10';
      case 'kyc_rejection':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'balance_adjustment':
        return 'Balance Adjustment';
      case 'user_suspension':
        return 'User Suspended';
      case 'user_activation':
        return 'User Activated';
      case 'kyc_approval':
        return 'KYC Approved';
      case 'kyc_rejection':
        return 'KYC Rejected';
      default:
        return 'Admin Action';
    }
  };

  const formatActionDetails = (entry: AuditLogEntry) => {
    switch (entry.action_type) {
      case 'balance_adjustment':
        const { amount, adjustment_type, reason } = entry.details;
        return `${adjustment_type === 'add' ? 'Added' : 'Subtracted'} $${amount?.toLocaleString()} ${reason ? `• ${reason}` : ''}`;
      
      case 'user_suspension':
      case 'user_activation':
        return `Status changed from ${entry.details.previous_status} to ${entry.details.new_status}`;
      
      case 'kyc_approval':
      case 'kyc_rejection':
        const { document_type, comments } = entry.details;
        return `${document_type} document ${entry.action_type === 'kyc_approval' ? 'approved' : 'rejected'}${comments ? ` • ${comments}` : ''}`;
      
      default:
        return 'Admin action performed';
    }
  };

  const exportAuditLog = () => {
    const csvData = filteredEntries.map(entry => ({
      timestamp: new Date(entry.timestamp).toLocaleString(),
      admin: entry.admin_name,
      action: getActionLabel(entry.action_type),
      target_user: `${entry.target_user_name} (${entry.target_user_email})`,
      details: formatActionDetails(entry),
      ip_address: entry.ip_address
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span>Audit Log ({filteredEntries.length})</span>
          </CardTitle>
          <Button
            size="sm"
            variant="secondary"
            onClick={exportAuditLog}
            disabled={filteredEntries.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by admin or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="balance_adjustment">Balance Adjustments</option>
            <option value="user_suspension">User Suspensions</option>
            <option value="user_activation">User Activations</option>
            <option value="kyc_approval">KYC Approvals</option>
            <option value="kyc_rejection">KYC Rejections</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>

        {/* Audit Entries */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No audit log entries found</p>
            </div>
          ) : (
            filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/30 rounded-lg border border-slate-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActionColor(entry.action_type)}`}>
                      {getActionIcon(entry.action_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-white font-semibold">{getActionLabel(entry.action_type)}</h4>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-blue-400 text-sm">{entry.admin_name}</span>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-2">
                        Target: <span className="text-white">{entry.target_user_name}</span> ({entry.target_user_email})
                      </p>
                      
                      <p className="text-gray-400 text-sm mb-3">
                        {formatActionDetails(entry)}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <span>IP: {entry.ip_address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={onLoadMore}
              loading={loading}
              variant="secondary"
            >
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLog;