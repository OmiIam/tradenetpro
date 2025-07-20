'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi, BackendAdminStats, BackendUser, transformBackendUser } from '@/lib/admin-api';
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
      setError(err instanceof Error ? err.message : 'Failed to fetch admin stats');
      console.error('Failed to fetch admin stats:', err);
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
      
      const response = await adminApi.getUsers(page, limit);
      
      // Get portfolio data for each user (this could be optimized with a bulk endpoint)
      const usersWithPortfolios = await Promise.all(
        response.users.map(async (user) => {
          try {
            const portfolio = await adminApi.getUserPortfolio(user.id);
            return transformBackendUser(user, portfolio);
          } catch {
            // If portfolio fetch fails, return user without portfolio data
            return transformBackendUser(user);
          }
        })
      );
      
      setUsers(usersWithPortfolios);
      setPagination({
        page,
        limit,
        total: response.total
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: Partial<BackendUser>) => {
    try {
      await adminApi.updateUser(parseInt(userId), userData);
      // Refetch users to get updated data
      await fetchUsers(pagination.page, pagination.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      throw err;
    }
  }, [fetchUsers, pagination.page, pagination.limit]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await adminApi.deleteUser(parseInt(userId));
      // Refetch users to get updated list
      await fetchUsers(pagination.page, pagination.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      throw err;
    }
  }, [fetchUsers, pagination.page, pagination.limit]);

  const toggleUserStatus = useCallback(async (userId: string, status: 'active' | 'suspended') => {
    try {
      await adminApi.toggleUserStatus(parseInt(userId), status);
      // Refetch users to get updated data
      await fetchUsers(pagination.page, pagination.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
      throw err;
    }
  }, [fetchUsers, pagination.page, pagination.limit]);

  const adjustBalance = useCallback(async (userId: string, amount: number, type: 'credit' | 'debit', description: string) => {
    try {
      await adminApi.adjustBalance(parseInt(userId), amount, type, description);
      // Refetch users to get updated balance data
      await fetchUsers(pagination.page, pagination.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust balance');
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