'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Role, Permission, hasPermission } from '@/lib/rbac';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

// Types
export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login?: string;
  avatar_url?: string;
}

export interface AdminTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'transfer';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface AdminKycDocument {
  id: string;
  user_id: string;
  document_type: 'passport' | 'driver_license' | 'national_id' | 'utility_bill';
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'under_review';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  document_url: string;
  user_email?: string;
  user_first_name?: string;
  user_last_name?: string;
}

export interface AdminLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  category: string;
  timestamp: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  transactionVolume: number;
  pendingKyc: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface AdminState {
  // Data
  users: AdminUser[];
  transactions: AdminTransaction[];
  kycDocuments: AdminKycDocument[];
  logs: AdminLog[];
  stats: AdminStats;
  
  // UI State
  loading: {
    users: boolean;
    transactions: boolean;
    kyc: boolean;
    logs: boolean;
    stats: boolean;
  };
  
  errors: {
    users: string | null;
    transactions: string | null;
    kyc: string | null;
    logs: string | null;
    stats: string | null;
  };
  
  // Filters and pagination
  filters: {
    users: Record<string, any>;
    transactions: Record<string, any>;
    kyc: Record<string, any>;
    logs: Record<string, any>;
  };
  
  pagination: {
    users: { page: number; limit: number; total: number };
    transactions: { page: number; limit: number; total: number };
    kyc: { page: number; limit: number; total: number };
    logs: { page: number; limit: number; total: number };
  };
  
  // Selected items for bulk operations
  selectedItems: {
    users: string[];
    transactions: string[];
    kyc: string[];
  };
}

type AdminAction =
  | { type: 'SET_LOADING'; module: keyof AdminState['loading']; loading: boolean }
  | { type: 'SET_ERROR'; module: keyof AdminState['errors']; error: string | null }
  | { type: 'SET_USERS'; users: AdminUser[]; total?: number }
  | { type: 'SET_TRANSACTIONS'; transactions: AdminTransaction[]; total?: number }
  | { type: 'SET_KYC_DOCUMENTS'; documents: AdminKycDocument[]; total?: number }
  | { type: 'SET_LOGS'; logs: AdminLog[]; total?: number }
  | { type: 'SET_STATS'; stats: AdminStats }
  | { type: 'UPDATE_USER'; user: AdminUser }
  | { type: 'DELETE_USER'; userId: string }
  | { type: 'UPDATE_TRANSACTION'; transaction: AdminTransaction }
  | { type: 'UPDATE_KYC_STATUS'; documentId: string; status: AdminKycDocument['status']; reviewerId?: string; reason?: string }
  | { type: 'SET_FILTER'; module: keyof AdminState['filters']; filters: Record<string, any> }
  | { type: 'SET_PAGINATION'; module: keyof AdminState['pagination']; pagination: { page: number; limit: number; total?: number } }
  | { type: 'SET_SELECTED_ITEMS'; module: keyof AdminState['selectedItems']; items: string[] }
  | { type: 'CLEAR_SELECTED_ITEMS'; module: keyof AdminState['selectedItems'] };

const initialState: AdminState = {
  users: [],
  transactions: [],
  kycDocuments: [],
  logs: [],
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    transactionVolume: 0,
    pendingKyc: 0,
    systemHealth: 'healthy'
  },
  loading: {
    users: false,
    transactions: false,
    kyc: false,
    logs: false,
    stats: false
  },
  errors: {
    users: null,
    transactions: null,
    kyc: null,
    logs: null,
    stats: null
  },
  filters: {
    users: {},
    transactions: {},
    kyc: {},
    logs: {}
  },
  pagination: {
    users: { page: 1, limit: 20, total: 0 },
    transactions: { page: 1, limit: 20, total: 0 },
    kyc: { page: 1, limit: 20, total: 0 },
    logs: { page: 1, limit: 50, total: 0 }
  },
  selectedItems: {
    users: [],
    transactions: [],
    kyc: []
  }
};

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.module]: action.loading }
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.module]: action.error }
      };
      
    case 'SET_USERS':
      return {
        ...state,
        users: action.users,
        pagination: {
          ...state.pagination,
          users: { ...state.pagination.users, total: action.total ?? state.pagination.users.total }
        }
      };
      
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.transactions,
        pagination: {
          ...state.pagination,
          transactions: { ...state.pagination.transactions, total: action.total ?? state.pagination.transactions.total }
        }
      };
      
    case 'SET_KYC_DOCUMENTS':
      return {
        ...state,
        kycDocuments: action.documents,
        pagination: {
          ...state.pagination,
          kyc: { ...state.pagination.kyc, total: action.total ?? state.pagination.kyc.total }
        }
      };
      
    case 'SET_LOGS':
      return {
        ...state,
        logs: action.logs,
        pagination: {
          ...state.pagination,
          logs: { ...state.pagination.logs, total: action.total ?? state.pagination.logs.total }
        }
      };
      
    case 'SET_STATS':
      return { ...state, stats: action.stats };
      
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user => 
          user.id === action.user.id ? action.user : user
        )
      };
      
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.userId)
      };
      
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(transaction =>
          transaction.id === action.transaction.id ? action.transaction : transaction
        )
      };
      
    case 'UPDATE_KYC_STATUS':
      return {
        ...state,
        kycDocuments: state.kycDocuments.map(doc =>
          doc.id === action.documentId 
            ? { 
                ...doc, 
                status: action.status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: action.reviewerId,
                rejection_reason: action.reason
              }
            : doc
        )
      };
      
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.module]: action.filters }
      };
      
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: {
          ...state.pagination,
          [action.module]: { ...state.pagination[action.module], ...action.pagination }
        }
      };
      
    case 'SET_SELECTED_ITEMS':
      return {
        ...state,
        selectedItems: { ...state.selectedItems, [action.module]: action.items }
      };
      
    case 'CLEAR_SELECTED_ITEMS':
      return {
        ...state,
        selectedItems: { ...state.selectedItems, [action.module]: [] }
      };
      
    default:
      return state;
  }
}

interface AdminContextType {
  // State
  state: AdminState;
  
  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  
  // Data fetching
  fetchUsers: (page?: number, filters?: Record<string, any>) => Promise<void>;
  fetchTransactions: (page?: number, filters?: Record<string, any>) => Promise<void>;
  fetchKycDocuments: (page?: number, filters?: Record<string, any>) => Promise<void>;
  fetchLogs: (page?: number, filters?: Record<string, any>) => Promise<void>;
  fetchStats: () => Promise<void>;
  
  // User management
  createUser: (userData: Partial<AdminUser>) => Promise<AdminUser>;
  updateUser: (userId: string, userData: Partial<AdminUser>) => Promise<AdminUser>;
  deleteUser: (userId: string) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  
  // Transaction management
  updateTransaction: (transactionId: string, data: Partial<AdminTransaction>) => Promise<AdminTransaction>;
  cancelTransaction: (transactionId: string) => Promise<void>;
  
  // KYC management
  approveKyc: (documentId: string) => Promise<void>;
  rejectKyc: (documentId: string, reason: string) => Promise<void>;
  
  // Filters and pagination
  setFilter: (module: keyof AdminState['filters'], filters: Record<string, any>) => void;
  setPagination: (module: keyof AdminState['pagination'], pagination: { page: number; limit: number }) => void;
  
  // Selection
  setSelectedItems: (module: keyof AdminState['selectedItems'], items: string[]) => void;
  clearSelection: (module: keyof AdminState['selectedItems']) => void;
  
  // Bulk operations
  bulkUserAction: (userIds: string[], action: 'activate' | 'suspend' | 'delete') => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const { user } = useAuth();
  
  // API base URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tradenet.im/api';
  
  // Permission check
  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role as Role, permission);
  }, [user?.role]);
  
  // Generic API call with error handling
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }, [apiBaseUrl]);
  
  // Data fetching functions
  const fetchUsers = useCallback(async (page = 1, filters = {}) => {
    if (!checkPermission('users:read')) {
      toast.error('You don\'t have permission to view users');
      return;
    }
    
    dispatch({ type: 'SET_LOADING', module: 'users', loading: true });
    dispatch({ type: 'SET_ERROR', module: 'users', error: null });
    
    try {
      const limit = state.pagination.users.limit;
      const offset = (page - 1) * limit;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...filters
      });
      
      console.log('[AdminContext] Fetching users with params:', params.toString());
      const response = await apiCall(`/api/admin/users-with-portfolios?${params}`);
      
      // Transform backend users to frontend format
      const transformedUsers: AdminUser[] = response.users?.map((user: any) => ({
        id: user.id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role || 'user',
        status: user.status || 'active',
        created_at: user.created_at,
        last_login: user.last_login,
        avatar_url: user.avatar_url
      })) || [];
      
      const total = response.pagination?.total || 0;
      console.log('[AdminContext] Users fetched successfully:', transformedUsers.length, 'total:', total);
      
      dispatch({ type: 'SET_USERS', users: transformedUsers, total });
      dispatch({ type: 'SET_PAGINATION', module: 'users', pagination: { page, limit, total } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      console.error('[AdminContext] Failed to fetch users:', error);
      dispatch({ type: 'SET_ERROR', module: 'users', error: errorMessage });
      toast.error(`User Management Error: ${errorMessage}`);
    } finally {
      dispatch({ type: 'SET_LOADING', module: 'users', loading: false });
    }
  }, [checkPermission, apiCall, state.pagination.users.limit]);
  
  const fetchTransactions = useCallback(async (page = 1, filters = {}) => {
    if (!checkPermission('transactions:read')) {
      toast.error('You don\'t have permission to view transactions');
      return;
    }
    
    dispatch({ type: 'SET_LOADING', module: 'transactions', loading: true });
    dispatch({ type: 'SET_ERROR', module: 'transactions', error: null });
    
    try {
      const limit = state.pagination.transactions.limit;
      const offset = (page - 1) * limit;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...filters
      });
      
      console.log('[AdminContext] Fetching transactions with params:', params.toString());
      const response = await apiCall(`/api/admin/transactions?${params}`);
      
      // Transform backend transactions to frontend format
      const transformedTransactions: AdminTransaction[] = response.transactions?.map((tx: any) => ({
        id: tx.id.toString(),
        user_id: tx.user_id.toString(),
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency || 'USD',
        status: tx.status,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
        description: tx.description,
        metadata: tx.metadata
      })) || [];
      
      const total = response.pagination?.total || 0;
      console.log('[AdminContext] Transactions fetched successfully:', transformedTransactions.length, 'total:', total);
      
      dispatch({ type: 'SET_TRANSACTIONS', transactions: transformedTransactions, total });
      dispatch({ type: 'SET_PAGINATION', module: 'transactions', pagination: { page, limit, total } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transactions';
      console.error('[AdminContext] Failed to fetch transactions:', error);
      dispatch({ type: 'SET_ERROR', module: 'transactions', error: errorMessage });
      toast.error(`Transaction Management Error: ${errorMessage}`);
    } finally {
      dispatch({ type: 'SET_LOADING', module: 'transactions', loading: false });
    }
  }, [checkPermission, apiCall, state.pagination.transactions.limit]);
  
  const fetchKycDocuments = useCallback(async (page = 1, filters = {}) => {
    if (!checkPermission('kyc:read')) {
      toast.error('You don\'t have permission to view KYC documents');
      return;
    }
    
    dispatch({ type: 'SET_LOADING', module: 'kyc', loading: true });
    dispatch({ type: 'SET_ERROR', module: 'kyc', error: null });
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: state.pagination.kyc.limit.toString(),
        ...filters
      });
      
      const response = await apiCall(`/admin/kyc?${params}`);
      
      dispatch({ type: 'SET_KYC_DOCUMENTS', documents: response.documents, total: response.total });
      dispatch({ type: 'SET_PAGINATION', module: 'kyc', pagination: { page, limit: state.pagination.kyc.limit, total: response.total } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch KYC documents';
      dispatch({ type: 'SET_ERROR', module: 'kyc', error: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', module: 'kyc', loading: false });
    }
  }, [checkPermission, apiCall, state.pagination.kyc.limit]);
  
  const fetchLogs = useCallback(async (page = 1, filters = {}) => {
    if (!checkPermission('logs:read')) {
      toast.error('You don\'t have permission to view logs');
      return;
    }
    
    dispatch({ type: 'SET_LOADING', module: 'logs', loading: true });
    dispatch({ type: 'SET_ERROR', module: 'logs', error: null });
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: state.pagination.logs.limit.toString(),
        ...filters
      });
      
      const response = await apiCall(`/admin/logs?${params}`);
      
      dispatch({ type: 'SET_LOGS', logs: response.logs, total: response.total });
      dispatch({ type: 'SET_PAGINATION', module: 'logs', pagination: { page, limit: state.pagination.logs.limit, total: response.total } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch logs';
      dispatch({ type: 'SET_ERROR', module: 'logs', error: errorMessage });
      toast.error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', module: 'logs', loading: false });
    }
  }, [checkPermission, apiCall, state.pagination.logs.limit]);
  
  const fetchStats = useCallback(async () => {
    if (!checkPermission('analytics:read')) {
      toast.error('You don\'t have permission to view analytics');
      return;
    }
    
    dispatch({ type: 'SET_LOADING', module: 'stats', loading: true });
    dispatch({ type: 'SET_ERROR', module: 'stats', error: null });
    
    try {
      console.log('[AdminContext] Fetching admin stats...');
      const response = await apiCall('/api/admin/stats');
      
      // Transform backend response to match frontend expectations
      const transformedStats: AdminStats = {
        totalUsers: response.users?.total || 0,
        activeUsers: response.users?.active || 0,
        totalTransactions: response.transactions?.total || 0,
        transactionVolume: response.transactions?.totalVolume || 0,
        pendingKyc: response.kyc?.pending || 0,
        systemHealth: 'healthy' as const
      };
      
      console.log('[AdminContext] Stats fetched successfully:', transformedStats);
      dispatch({ type: 'SET_STATS', stats: transformedStats });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
      console.error('[AdminContext] Failed to fetch stats:', error);
      dispatch({ type: 'SET_ERROR', module: 'stats', error: errorMessage });
      toast.error(`Admin Dashboard Error: ${errorMessage}`);
    } finally {
      dispatch({ type: 'SET_LOADING', module: 'stats', loading: false });
    }
  }, [checkPermission, apiCall]);
  
  // User management functions
  const createUser = useCallback(async (userData: Partial<AdminUser>): Promise<AdminUser> => {
    if (!checkPermission('users:write')) {
      throw new Error('You don\'t have permission to create users');
    }
    
    const response = await apiCall('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    // Refresh users list
    await fetchUsers(state.pagination.users.page, state.filters.users);
    toast.success('User created successfully');
    
    return response.user;
  }, [checkPermission, apiCall, fetchUsers, state.pagination.users.page, state.filters.users]);
  
  const updateUser = useCallback(async (userId: string, userData: Partial<AdminUser>): Promise<AdminUser> => {
    if (!checkPermission('users:write')) {
      throw new Error('You don\'t have permission to update users');
    }
    
    const response = await apiCall(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    
    dispatch({ type: 'UPDATE_USER', user: response.user });
    toast.success('User updated successfully');
    
    return response.user;
  }, [checkPermission, apiCall]);
  
  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    if (!checkPermission('users:delete')) {
      throw new Error('You don\'t have permission to delete users');
    }
    
    await apiCall(`/admin/users/${userId}`, { method: 'DELETE' });
    
    dispatch({ type: 'DELETE_USER', userId });
    toast.success('User deleted successfully');
  }, [checkPermission, apiCall]);
  
  const suspendUser = useCallback(async (userId: string): Promise<void> => {
    if (!checkPermission('users:write')) {
      throw new Error('You don\'t have permission to suspend users');
    }
    
    const response = await apiCall(`/admin/users/${userId}/suspend`, { method: 'POST' });
    
    dispatch({ type: 'UPDATE_USER', user: response.user });
    toast.success('User suspended successfully');
  }, [checkPermission, apiCall]);
  
  const activateUser = useCallback(async (userId: string): Promise<void> => {
    if (!checkPermission('users:write')) {
      throw new Error('You don\'t have permission to activate users');
    }
    
    const response = await apiCall(`/admin/users/${userId}/activate`, { method: 'POST' });
    
    dispatch({ type: 'UPDATE_USER', user: response.user });
    toast.success('User activated successfully');
  }, [checkPermission, apiCall]);
  
  // Transaction management
  const updateTransaction = useCallback(async (transactionId: string, data: Partial<AdminTransaction>): Promise<AdminTransaction> => {
    if (!checkPermission('transactions:write')) {
      throw new Error('You don\'t have permission to update transactions');
    }
    
    const response = await apiCall(`/admin/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    
    dispatch({ type: 'UPDATE_TRANSACTION', transaction: response.transaction });
    toast.success('Transaction updated successfully');
    
    return response.transaction;
  }, [checkPermission, apiCall]);
  
  const cancelTransaction = useCallback(async (transactionId: string): Promise<void> => {
    if (!checkPermission('transactions:write')) {
      throw new Error('You don\'t have permission to cancel transactions');
    }
    
    const response = await apiCall(`/admin/transactions/${transactionId}/cancel`, { method: 'POST' });
    
    dispatch({ type: 'UPDATE_TRANSACTION', transaction: response.transaction });
    toast.success('Transaction cancelled successfully');
  }, [checkPermission, apiCall]);
  
  // KYC management
  const approveKyc = useCallback(async (documentId: string): Promise<void> => {
    if (!checkPermission('kyc:approve')) {
      throw new Error('You don\'t have permission to approve KYC documents');
    }
    
    await apiCall(`/admin/kyc/${documentId}/approve`, { method: 'POST' });
    
    dispatch({ 
      type: 'UPDATE_KYC_STATUS', 
      documentId, 
      status: 'approved',
      reviewerId: user?.id?.toString()
    });
    toast.success('KYC document approved successfully');
  }, [checkPermission, apiCall, user?.id]);
  
  const rejectKyc = useCallback(async (documentId: string, reason: string): Promise<void> => {
    if (!checkPermission('kyc:reject')) {
      throw new Error('You don\'t have permission to reject KYC documents');
    }
    
    await apiCall(`/admin/kyc/${documentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    
    dispatch({ 
      type: 'UPDATE_KYC_STATUS', 
      documentId, 
      status: 'rejected',
      reviewerId: user?.id?.toString(),
      reason
    });
    toast.success('KYC document rejected');
  }, [checkPermission, apiCall, user?.id]);
  
  // Filter and pagination
  const setFilter = useCallback((module: keyof AdminState['filters'], filters: Record<string, any>) => {
    dispatch({ type: 'SET_FILTER', module, filters });
  }, []);
  
  const setPagination = useCallback((module: keyof AdminState['pagination'], pagination: { page: number; limit: number }) => {
    dispatch({ type: 'SET_PAGINATION', module, pagination });
  }, []);
  
  // Selection management
  const setSelectedItems = useCallback((module: keyof AdminState['selectedItems'], items: string[]) => {
    dispatch({ type: 'SET_SELECTED_ITEMS', module, items });
  }, []);
  
  const clearSelection = useCallback((module: keyof AdminState['selectedItems']) => {
    dispatch({ type: 'CLEAR_SELECTED_ITEMS', module });
  }, []);
  
  // Bulk operations
  const bulkUserAction = useCallback(async (userIds: string[], action: 'activate' | 'suspend' | 'delete'): Promise<void> => {
    const permission = action === 'delete' ? 'users:delete' : 'users:write';
    if (!checkPermission(permission)) {
      throw new Error(`You don't have permission to ${action} users`);
    }
    
    await apiCall('/admin/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ userIds, action })
    });
    
    // Refresh users list
    await fetchUsers(state.pagination.users.page, state.filters.users);
    clearSelection('users');
    toast.success(`${userIds.length} users ${action}d successfully`);
  }, [checkPermission, apiCall, fetchUsers, state.pagination.users.page, state.filters.users, clearSelection]);
  
  const contextValue: AdminContextType = {
    state,
    hasPermission: checkPermission,
    fetchUsers,
    fetchTransactions,
    fetchKycDocuments,
    fetchLogs,
    fetchStats,
    createUser,
    updateUser,
    deleteUser,
    suspendUser,
    activateUser,
    updateTransaction,
    cancelTransaction,
    approveKyc,
    rejectKyc,
    setFilter,
    setPagination,
    setSelectedItems,
    clearSelection,
    bulkUserAction
  };
  
  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}