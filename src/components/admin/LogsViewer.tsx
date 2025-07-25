'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Activity,
  Database,
  Shield,
  Eye,
  EyeOff,
  Terminal,
  Calendar
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'auth' | 'user' | 'transaction' | 'system' | 'api' | 'security';
  message: string;
  details?: Record<string, any>;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
}

interface LogFilters {
  search: string;
  level: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  userId: string;
}

export default function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filters, setFilters] = useState<LogFilters>({
    search: '',
    level: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    userId: ''
  });

  const logsEndRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const itemsPerPage = 50;

  // Generate mock log data (replace with real API)
  const generateMockLogs = (): LogEntry[] => {
    const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];
    const categories: LogEntry['category'][] = ['auth', 'user', 'transaction', 'system', 'api', 'security'];
    const messages = [
      'User logged in successfully',
      'Failed login attempt detected',
      'Balance adjustment processed',
      'Database connection established',
      'API rate limit exceeded',
      'Password reset requested',
      'Transaction completed successfully',
      'Security alert: Multiple failed login attempts',
      'System backup completed',
      'User account created',
      'Portfolio update processed',
      'Authentication token refreshed',
      'API endpoint accessed',
      'Database query executed',
      'User session expired'
    ];

    return Array.from({ length: 200 }, (_, i) => ({
      id: `log-${i + 1}`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      details: Math.random() > 0.7 ? {
        requestId: `req-${Math.random().toString(36).substr(2, 9)}`,
        duration: Math.round(Math.random() * 1000),
        endpoint: `/api/users/${Math.floor(Math.random() * 100)}`
      } : undefined,
      userId: Math.random() > 0.5 ? Math.floor(Math.random() * 100) + 1 : undefined,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (compatible; TradePro/1.0)'
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Fetch logs
  const fetchLogs = async (page: number = 1) => {
    try {
      setLoading(page === 1);
      setRefreshing(page !== 1);
      
      // Try to fetch real logs, fall back to mock data
      try {
        const response = await api.get(`/api/admin/logs?page=${page}&limit=${itemsPerPage}`);
        if (response.data) {
          setLogs((response.data as any).logs || []);
          setTotalPages(Math.ceil(((response.data as any).total || 0) / itemsPerPage));
        } else {
          throw new Error('No data received');
        }
      } catch (apiError) {
        console.log('Using mock data for logs viewer');
        const mockLogs = generateMockLogs();
        setLogs(mockLogs);
        setTotalPages(Math.ceil(mockLogs.length / itemsPerPage));
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError('Failed to load logs');
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...logs];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.category.toLowerCase().includes(searchLower) ||
        log.level.toLowerCase().includes(searchLower) ||
        log.id.toLowerCase().includes(searchLower)
      );
    }

    // Level filter
    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category);
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= new Date(filters.dateTo)
      );
    }

    // User ID filter
    if (filters.userId) {
      filtered = filtered.filter(log => 
        log.userId?.toString().includes(filters.userId)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshIntervalRef.current = setInterval(() => {
        fetchLogs(currentPage);
      }, 10000); // Refresh every 10 seconds
    } else if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [autoRefresh, currentPage]);

    useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  // Scroll to bottom when new logs arrive (if auto-refresh is on)
  useEffect(() => {
    if (autoRefresh && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoRefresh]);

  // Get log level icon and color
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warn': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      case 'debug': return <Terminal className="w-4 h-4 text-gray-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-900/20';
      case 'warn': return 'text-yellow-400 bg-yellow-900/20';
      case 'info': return 'text-blue-400 bg-blue-900/20';
      case 'debug': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <Shield className="w-3 h-3" />;
      case 'user': return <User className="w-3 h-3" />;
      case 'transaction': return <Activity className="w-3 h-3" />;
      case 'system': return <Database className="w-3 h-3" />;
      case 'api': return <Terminal className="w-3 h-3" />;
      case 'security': return <Shield className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  // Export logs
  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Category', 'Message', 'User ID', 'IP Address'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.category,
        log.message,
        log.userId || '',
        log.ipAddress || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Logs exported successfully');
  };

  if (loading && logs.length === 0) {
    return <LoadingSpinner message="Loading logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Logs</h1>
          <p className="text-gray-400 text-sm">Monitor system events and activities</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={() => fetchLogs(currentPage)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 rounded-xl p-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search logs..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                <select
                  value={filters.level}
                  onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="auth">Authentication</option>
                  <option value="user">User</option>
                  <option value="transaction">Transaction</option>
                  <option value="system">System</option>
                  <option value="api">API</option>
                  <option value="security">Security</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setFilters({
                  search: '', level: '', category: '', dateFrom: '', dateTo: '', userId: ''
                })}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
              <span className="text-sm text-gray-400">
                Showing {filteredLogs.length} of {logs.length} logs
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs Display */}
      <div className="bg-slate-800/50 rounded-xl overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <div className="font-mono text-sm">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.01 }}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className="p-4 flex items-start gap-4">
                  {/* Timestamp */}
                  <div className="text-gray-400 text-xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  
                  {/* Level Badge */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                    {getLogLevelIcon(log.level)}
                    <span className="uppercase">{log.level}</span>
                  </div>
                  
                  {/* Category */}
                  <div className="flex items-center gap-1 text-gray-300 text-xs">
                    {getCategoryIcon(log.category)}
                    <span className="capitalize">{log.category}</span>
                  </div>
                  
                  {/* Message */}
                  <div className="flex-1 text-white">
                    {log.message}
                  </div>
                  
                  {/* User ID */}
                  {log.userId && (
                    <div className="text-gray-400 text-xs">
                      User: {log.userId}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          <div ref={logsEndRef} />
        </div>

        {filteredLogs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Terminal className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No logs found</h3>
            <p className="text-gray-400">Try adjusting your filters or refresh the logs.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Log Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">ID</label>
                    <p className="text-white font-mono">{selectedLog.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Timestamp</label>
                    <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Level</label>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${getLogLevelColor(selectedLog.level)}`}>
                      {getLogLevelIcon(selectedLog.level)}
                      <span className="uppercase">{selectedLog.level}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Category</label>
                    <div className="flex items-center gap-1 text-white">
                      {getCategoryIcon(selectedLog.category)}
                      <span className="capitalize">{selectedLog.category}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400">Message</label>
                  <p className="text-white bg-slate-700/50 p-3 rounded-lg">{selectedLog.message}</p>
                </div>

                {selectedLog.userId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400">User ID</label>
                    <p className="text-white">{selectedLog.userId}</p>
                  </div>
                )}

                {selectedLog.ipAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400">IP Address</label>
                    <p className="text-white font-mono">{selectedLog.ipAddress}</p>
                  </div>
                )}

                {selectedLog.userAgent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400">User Agent</label>
                    <p className="text-white text-sm font-mono bg-slate-700/50 p-3 rounded-lg break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}

                {selectedLog.details && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Additional Details</label>
                    <pre className="text-white text-sm bg-slate-700/50 p-3 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}