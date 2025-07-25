'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService, User } from '@/lib/auth';
import toast from 'react-hot-toast';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
  refreshAuth: () => Promise<void>;
  hasRole: (role: 'user' | 'admin') => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Initialize auth service
      authService.initialize();
      
      // Check current auth status
      const currentUser = await authService.checkAuthStatus();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh authentication state
  const refreshAuth = useCallback(async () => {
    try {
      const currentUser = await authService.checkAuthStatus();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setUser(null);
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state on logout failure
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authService.register(userData);
      
      if (result.success) {
        // Don't set user state as registration doesn't log user in
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Role checking function
  const hasRole = useCallback((role: 'user' | 'admin'): boolean => {
    return authService.hasRole(role);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'refreshToken') {
        // Token changed in another tab, refresh auth state
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshAuth]);

  // Auto-refresh auth state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !authService.isAuthenticated()) {
        // User became unauthenticated, refresh state
        refreshAuth();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, refreshAuth]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Page became visible, check if we need to refresh auth
        refreshAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, refreshAuth]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user && authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),
    login,
    logout,
    register,
    refreshAuth,
    hasRole,
  };
}

export default useAuth;