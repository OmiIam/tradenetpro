'use client';

import React from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';

interface KYCStatsCardProps {
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    under_review: number;
    total_documents: number;
    recent_submissions: number;
    processing_time_avg: number;
  };
  loading?: boolean;
}

const KYCStatsCard: React.FC<KYCStatsCardProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>KYC Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            <div className="h-4 bg-slate-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      label: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20'
    },
    {
      label: 'Under Review',
      value: stats.under_review,
      icon: AlertCircle,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20'
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20'
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-900/20'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>KYC Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Breakdown */}
        <ResponsiveGrid cols={{ base: 2, md: 4 }} gap="sm">
          {statItems.map((item) => (
            <div key={item.label} className={`${item.bgColor} rounded-lg p-3`}>
              <div className="flex items-center space-x-2 mb-1">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
              <p className={`text-lg font-semibold ${item.color}`}>
                {item.value.toLocaleString()}
              </p>
            </div>
          ))}
        </ResponsiveGrid>

        {/* Additional Stats */}
        <div className="border-t border-slate-700 pt-4">
          <ResponsiveGrid cols={{ base: 1, sm: 3 }} gap="md">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total_documents}</p>
              <p className="text-sm text-gray-400">Total Documents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{stats.recent_submissions}</p>
              <p className="text-sm text-gray-400">Last 24 Hours</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.processing_time_avg}</p>
              <p className="text-sm text-gray-400">Avg. Processing Days</p>
            </div>
          </ResponsiveGrid>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-slate-700 pt-4">
          <div className="flex space-x-2">
            <button 
              className="flex-1 bg-yellow-900/20 text-yellow-400 py-2 px-3 rounded-md text-sm font-medium hover:bg-yellow-900/30 transition-colors"
              onClick={() => window.location.href = '/admin/kyc?status=pending'}
            >
              Review Pending ({stats.pending})
            </button>
            <button 
              className="flex-1 bg-blue-900/20 text-blue-400 py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-900/30 transition-colors"
              onClick={() => window.location.href = '/admin/kyc'}
            >
              View All Documents
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KYCStatsCard;