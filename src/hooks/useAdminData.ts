'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi, BackendAdminStats, BackendUser, BackendPortfolio, transformBackendUser } from '@/lib/admin-api';
import { AdminUser, AdminStats } from '@/types/admin';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const backendStats = await adminApi.getStats();
      
      // Transform backend stats to frontend format
      const frontendStats: AdminStats = {
        totalUsers: backendStats.users.total,
        activeUsers: backendStats.users.active,
        suspendedUsers: backendStats.users.suspended,
        totalPortfolioValue: backendStats.portfolio.totalValue,
        totalTrades: backendStats.portfolio.totalTrades,
        todayTrades: backendStats.transactions.todayCount,
        totalRevenue: backendStats.transactions.totalVolume,
        monthlyRevenue: backendStats.transactions.totalVolume // This would need a separate endpoint for monthly data
      };
      
      setStats(frontendStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch admin stats';
      setError(errorMessage);
      console.error('Failed to fetch admin stats:', {
        error: err,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const fetchUsers = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use optimized endpoint that fetches users with portfolio data in a single call
      const response = await adminApi.getUsersWithPortfolios(page, limit);
      
      // Transform the combined user+portfolio data
      const transformedUsers = response.users.map((userWithPortfolio) => {
        // Extract portfolio fields from the combined data
        const portfolio = {
          total_balance: userWithPortfolio.total_balance,
          portfolio_value: userWithPortfolio.portfolio_value,
          total_trades: userWithPortfolio.total_trades,
          win_rate: userWithPortfolio.win_rate
        };
        
        // Create user object without portfolio fields
        const { total_balance, portfolio_value, total_trades, win_rate, ...user } = userWithPortfolio;
        
        return transformBackendUser(user as BackendUser, portfolio as BackendPortfolio);
      });
      
      setUsers(transformedUsers);
      setPagination({
        page,
        limit,
        total: response.total
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Failed to fetch users:', {
        error: err,
        message: errorMessage,
        page,
        limit,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: Partial<BackendUser>) => {
    try {
      console.log('Updating user:', { userId, userData });
      await adminApi.updateUser(parseInt(userId), userData);
      // Refetch users to get updated data
      await fetchUsers(pagination.page, pagination.limit);
      console.log('User updated successfully:', userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      console.error('Failed to update user:', {
        error: err,
        userId,
        userData,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }, [fetchUsers, pagination.page, pagination.limit]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      console.log('Deleting user:', userId);
      await adminApi.deleteUser(parseInt(userId));
      // Refetch users to get updated list
      await fetchUsers(pagination.page, pagination.limit);
      console.log('User deleted successfully:', userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      console.error('Failed to delete user:', {
        error: err,
        userId,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }, [fetchUsers, pagination.page, pagination.limit]);

  const toggleUserStatus = useCallback(async (userId: string, status: 'active' | 'suspended') => {
    try {
      console.log('Toggling user status:', { userId, status });
      await adminApi.toggleUserStatus(parseInt(userId), status);
      // Refetch users to get updated data
      await fetchUsers(pagination.page, pagination.limit);
      console.log('User status updated successfully:', { userId, status });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      setError(errorMessage);
      console.error('Failed to update user status:', {
        error: err,
        userId,
        status,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }, [fetchUsers, pagination.page, pagination.limit]);

  const adjustBalance = useCallback(async (userId: string, amount: number, type: 'credit' | 'debit', description: string) => {
    try {
      console.log('Adjusting balance:', { userId, amount, type, description });
      
      await adminApi.adjustBalance(parseInt(userId), amount, type, description);
      console.log('API call completed, now refetching users...');
      
      // Refetch users to get updated balance data
      await fetchUsers(pagination.page, pagination.limit);
      
      console.log('Balance adjusted and users refetched successfully:', { userId, amount, type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust balance';
      setError(errorMessage);
      console.error('Failed to adjust balance:', {
        error: err,
        userId,
        amount,
        type,
        description,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }, [fetchUsers, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    updateUser,
    deleteUser,
    toggleUserStatus,
    adjustBalance
  };
}