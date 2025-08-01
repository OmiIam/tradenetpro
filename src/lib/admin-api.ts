import { apiClient } from './api';

// Types matching the backend API responses
export interface BackendUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface BackendPortfolio {
  id: number;
  user_id: number;
  total_balance: number;
  portfolio_value: number;
  total_trades: number;
  win_rate: number;
}

export interface BackendTransaction {
  id: number;
  user_id: number;
  type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'adjustment';
  amount: number;
  symbol?: string;
  quantity?: number;
  price?: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
  completed_at?: string;
}

export interface BackendAdminStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
  };
  portfolio: {
    totalValue: number;
    totalTrades: number;
    averageWinRate: number;
  };
  transactions: {
    total: number;
    totalVolume: number;
    todayCount: number;
    todayVolume: number;
  };
}

// Admin metadata interface
export interface AdminMetadata {
  id: number;
  name: string;
  email: string;
  role: string;
  ip_address?: string;
}

// Admin API functions
export const adminApi = {
  // Get current admin metadata
  async getAdminMetadata(): Promise<AdminMetadata> {
    const response = await apiClient.get<AdminMetadata>('/api/admin/me');
    return response.data || response as AdminMetadata;
  },

  // Dashboard stats
  async getStats(): Promise<BackendAdminStats> {
    const response = await apiClient.get<BackendAdminStats>('/api/admin/stats');
    const data = response.data || response as BackendAdminStats;
    
    // Handle nested data structure if it exists
    if ((data as any).data) {
      return (data as any).data;
    }
    return data;
  },

  // User management
  async getUsers(page: number = 1, limit: number = 10): Promise<{ users: BackendUser[], total: number }> {
    // Convert page to offset for backend compatibility
    const offset = (page - 1) * limit;
    const response = await apiClient.get<{ users: BackendUser[], pagination: { total: number } }>(`/api/admin/users?offset=${offset}&limit=${limit}`);
    
    // Handle both possible response formats
    if (response.data) {
      return {
        users: response.data.users,
        total: response.data.pagination?.total || 0
      };
    } else {
      // Handle direct response format
      const directResponse = response as any;
      return {
        users: directResponse.users || [],
        total: directResponse.pagination?.total || 0
      };
    }
  },

  // Optimized endpoint that fetches users with portfolio data in a single call
  async getUsersWithPortfolios(page: number = 1, limit: number = 10): Promise<{ users: (BackendUser & BackendPortfolio)[], total: number }> {
    // Convert page to offset for backend compatibility
    const offset = (page - 1) * limit;
    const response = await apiClient.get<{ users: (BackendUser & BackendPortfolio)[], pagination: { total: number } }>(`/api/admin/users-with-portfolios?offset=${offset}&limit=${limit}`);
    
    // Handle both possible response formats
    if (response.data) {
      return {
        users: response.data.users,
        total: response.data.pagination?.total || 0
      };
    } else {
      // Handle direct response format
      const directResponse = response as any;
      return {
        users: directResponse.users || [],
        total: directResponse.pagination?.total || 0
      };
    }
  },

  async getUserById(userId: number): Promise<BackendUser> {
    const response = await apiClient.get<BackendUser>(`/api/admin/users/${userId}`);
    return response.data || response as BackendUser;
  },

  // Search users for balance adjustment
  async searchUsers(query: string, limit: number = 10): Promise<(BackendUser & { total_balance?: number })[]> {
    const response = await apiClient.get<{ users: (BackendUser & { total_balance?: number })[] }>(`/api/admin/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    
    // Normalize balance field to total_balance
    const users = (response.data?.users || response as any)?.users || [];
    return users.map((user: any) => ({
      ...user,
      total_balance: user.total_balance || user.current_balance || 0
    }));
  },

  // Get real users (replace mock data)
  async getRealUsers(page: number = 1, limit: number = 10, filters: Record<string, any> = {}): Promise<{ users: BackendUser[], total: number }> {
    const offset = (page - 1) * limit;
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    const response = await apiClient.get<{ users: BackendUser[], pagination: { total: number } }>(`/api/admin/users?${params}`);
    
    if (response.data) {
      return {
        users: response.data.users,
        total: response.data.pagination?.total || 0
      };
    } else {
      const directResponse = response as any;
      return {
        users: directResponse.users || [],
        total: directResponse.pagination?.total || 0
      };
    }
  },

  // Get KYC documents (replace mock data)
  async getKycDocuments(page: number = 1, limit: number = 10, filters: Record<string, any> = {}): Promise<{ documents: any[], total: number }> {
    const offset = (page - 1) * limit;
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    const response = await apiClient.get<{ documents: any[], pagination: { total: number } }>(`/api/kyc/documents?${params}`);
    
    if (response.data) {
      return {
        documents: response.data.documents,
        total: response.data.pagination?.total || 0
      };
    } else {
      const directResponse = response as any;
      return {
        documents: directResponse.documents || [],
        total: directResponse.pagination?.total || 0
      };
    }
  },

  // Get audit logs (replace mock data)
  async getAuditLogs(page: number = 1, limit: number = 20, filters: Record<string, any> = {}): Promise<{ logs: any[], total: number }> {
    const offset = (page - 1) * limit;
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    const response = await apiClient.get<{ logs: any[], pagination: { total: number } }>(`/api/admin/audit-logs?${params}`);
    
    if (response.data) {
      return {
        logs: response.data.logs,
        total: response.data.pagination?.total || 0
      };
    } else {
      const directResponse = response as any;
      return {
        logs: directResponse.logs || [],
        total: directResponse.pagination?.total || 0
      };
    }
  },

  // Create audit log entry
  async createAuditLog(entry: {
    action_type: string;
    target_user_id: number;
    target_user_name: string;
    target_user_email: string;
    details: Record<string, any>;
  }): Promise<void> {
    await apiClient.post('/api/admin/audit-logs', entry);
  },

  async updateUser(userId: number, userData: Partial<BackendUser>): Promise<BackendUser> {
    const response = await apiClient.put<BackendUser>(`/api/admin/users/${userId}`, userData);
    return response.data || response as BackendUser;
  },

  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/api/admin/users/${userId}`);
    return response.data || response as { message: string };
  },

  async toggleUserStatus(userId: number, status: 'active' | 'suspended'): Promise<BackendUser> {
    const response = await apiClient.put<BackendUser>(`/api/admin/users/${userId}/status`, { status });
    return response.data || response as BackendUser;
  },

  // Balance management
  async adjustBalance(userId: number, amount: number, type: 'credit' | 'debit', description: string): Promise<{ message: string }> {
    // Map 'credit' to 'add' and 'debit' to 'subtract' for backend compatibility
    const backendType = type === 'credit' ? 'add' : type === 'debit' ? 'subtract' : type;
    const response = await apiClient.post<{ message: string }>(`/api/admin/users/${userId}/balance`, {
      amount,
      type: backendType,
      description
    });
    return response.data || response as { message: string };
  },

  async getUserTransactions(userId: number, page: number = 1, limit: number = 20): Promise<{ transactions: BackendTransaction[], total: number }> {
    const offset = (page - 1) * limit;
    const response = await apiClient.get<{ transactions: BackendTransaction[], pagination: { total: number } }>(`/api/admin/users/${userId}/transactions?offset=${offset}&limit=${limit}`);
    
    if (response.data) {
      return {
        transactions: response.data.transactions,
        total: response.data.pagination?.total || 0
      };
    } else {
      const directResponse = response as any;
      return {
        transactions: directResponse.transactions || [],
        total: directResponse.pagination?.total || 0
      };
    }
  },

  async createTransaction(userId: number, transactionData: {
    type: 'deposit' | 'withdrawal';
    amount: number;
    description: string;
  }): Promise<BackendTransaction> {
    const response = await apiClient.post<BackendTransaction>(`/api/admin/users/${userId}/transactions`, transactionData);
    return response.data || response as BackendTransaction;
  },

  // Portfolio management
  async getUserPortfolio(userId: number): Promise<BackendPortfolio> {
    const response = await apiClient.get<BackendPortfolio>(`/api/admin/users/${userId}/portfolio`);
    return response.data || response as BackendPortfolio;
  },

  async updateUserPortfolio(userId: number, portfolioData: Partial<BackendPortfolio>): Promise<BackendPortfolio> {
    const response = await apiClient.put<BackendPortfolio>(`/api/admin/users/${userId}/portfolio`, portfolioData);
    return response.data || response as BackendPortfolio;
  },

  async addPortfolioPosition(userId: number, positionData: {
    symbol: string;
    quantity: number;
    price: number;
  }): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/api/admin/users/${userId}/portfolio/positions`, positionData);
    return response.data || response as { message: string };
  },

  // Global data
  async getAllTransactions(page: number = 1, limit: number = 50): Promise<{ transactions: BackendTransaction[], total: number }> {
    const offset = (page - 1) * limit;
    const response = await apiClient.get<{ transactions: BackendTransaction[], pagination: { total: number } }>(`/api/admin/transactions?offset=${offset}&limit=${limit}`);
    
    if (response.data) {
      return {
        transactions: response.data.transactions,
        total: response.data.pagination?.total || 0
      };
    } else {
      const directResponse = response as any;
      return {
        transactions: directResponse.transactions || [],
        total: directResponse.pagination?.total || 0
      };
    }
  },

  async getAllPortfolios(page: number = 1, limit: number = 50): Promise<{ portfolios: BackendPortfolio[], total: number }> {
    const offset = (page - 1) * limit;
    const response = await apiClient.get<{ portfolios: BackendPortfolio[], pagination: { total: number } }>(`/api/admin/portfolios?offset=${offset}&limit=${limit}`);
    
    if (response.data) {
      return {
        portfolios: response.data.portfolios,
        total: response.data.pagination?.total || 0
      };
    } else {
      const directResponse = response as any;
      return {
        portfolios: directResponse.portfolios || [],
        total: directResponse.pagination?.total || 0
      };
    }
  }
};

// Helper function to transform backend user to frontend AdminUser format
export function transformBackendUser(backendUser: BackendUser, portfolio?: BackendPortfolio) {
  return {
    id: backendUser.id.toString(),
    email: backendUser.email,
    firstName: backendUser.first_name,
    lastName: backendUser.last_name,
    role: backendUser.role,
    status: backendUser.status,
    createdAt: new Date(backendUser.created_at),
    lastLogin: backendUser.last_login ? new Date(backendUser.last_login) : undefined,
    totalBalance: portfolio?.total_balance || 0,
    portfolioValue: portfolio?.portfolio_value || 0,
    totalTrades: portfolio?.total_trades || 0,
    winRate: portfolio?.win_rate || 0
  };
}