'use client';

import React, { useEffect, useState } from 'react';
import { Search, Download, Filter, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminProvider, useAdmin, AdminLog } from '@/contexts/AdminContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MobileInput, MobileSelect } from '@/components/ui/MobileForm';
import MobileTable from '@/components/ui/MobileTable';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';

function LogsPageContent() {
  const { 
    state, 
    fetchLogs,
    hasPermission
  } = useAdmin();
  
  const [filters, setFilters] = useState({
    search: '',
    level: '',
    category: '',
    dateRange: ''
  });
  
  const [autoRefresh, setAutoRefresh] = useState(false);

  const canExport = hasPermission('logs:export');

  useEffect(() => {
    fetchLogs(1, filters);
  }, [fetchLogs, filters]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs(1, filters);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs, filters]);

  const logColumns = [
    {
      key: 'level',
      label: 'Level',
      primary: true,
      render: (level: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          level === 'error' ? 'bg-red-900/20 text-red-400' :
          level === 'warning' ? 'bg-yellow-900/20 text-yellow-400' :
          level === 'info' ? 'bg-blue-900/20 text-blue-400' :
          'bg-gray-900/20 text-gray-400'
        }`}>
          {level.toUpperCase()}
        </span>
      )
    },
    {
      key: 'message',
      label: 'Message',
      primary: true,
      render: (message: string) => (
        <div className="max-w-xs">
          <p className="truncate text-white">{message}</p>
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Time',
      primary: true,
      render: (timestamp: string) => (
        <div className="text-sm">
          <p className="text-white">{new Date(timestamp).toLocaleTimeString()}</p>
          <p className="text-gray-400">{new Date(timestamp).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      secondary: true
    },
    {
      key: 'user_id',
      label: 'User ID',
      secondary: true,
      render: (userId?: string) => userId || 'System'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <ResponsiveGrid cols={{ base: 1, sm: 2, lg: 4 }} gap="md">
            <MobileInput
              label="Search"
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={<Search className="w-4 h-4" />}
            />
            
            <MobileSelect
              label="Level"
              options={[
                { value: '', label: 'All Levels' },
                { value: 'error', label: 'Error' },
                { value: 'warning', label: 'Warning' },
                { value: 'info', label: 'Info' },
                { value: 'debug', label: 'Debug' }
              ]}
              value={filters.level}
              onChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
            />
            
            <MobileSelect
              label="Category"
              options={[
                { value: '', label: 'All Categories' },
                { value: 'auth', label: 'Authentication' },
                { value: 'api', label: 'API' },
                { value: 'database', label: 'Database' },
                { value: 'security', label: 'Security' },
                { value: 'payment', label: 'Payment' }
              ]}
              value={filters.category}
              onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            />
            
            <MobileSelect
              label="Time Range"
              options={[
                { value: '', label: 'All Time' },
                { value: 'last_hour', label: 'Last Hour' },
                { value: 'last_day', label: 'Last 24 Hours' },
                { value: 'last_week', label: 'Last Week' }
              ]}
              value={filters.dateRange}
              onChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            />
          </ResponsiveGrid>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-900/20 text-green-400' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              
              <span className="text-sm text-gray-400">
                {autoRefresh ? 'Refreshing every 5s' : 'Manual refresh only'}
              </span>
            </div>
            
            {canExport && (
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export Logs</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Logs ({state.pagination.logs.total})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(1, filters)}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <MobileTable
            data={state.logs}
            columns={logColumns}
            loading={state.loading.logs}
            emptyMessage="No logs found"
            expandable={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LogsPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminProvider>
        <AdminLayout title="System Logs" subtitle="Monitor system activity and troubleshoot issues">
          <LogsPageContent />
        </AdminLayout>
      </AdminProvider>
    </ProtectedRoute>
  );
}