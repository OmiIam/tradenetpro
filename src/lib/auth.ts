import { jwtDecode } from 'jwt-decode';
import { apiClient } from './api';
import toast from 'react-hot-toast';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DecodedToken {
  id: number;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

class AuthService {
  private refreshPromise: Promise<boolean> | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  // Token storage methods
  setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    
    // Set up auto-refresh timer
    this.scheduleTokenRefresh(tokens.accessToken);
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  // Token validation and decoding
  isTokenValid(token: string | null): boolean {
    if (!token) return false;
    
    try {
      const decoded: DecodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token expires in next 5 minutes
      return decoded.exp > currentTime + 300;
    } catch {
      return false;
    }
  }

  decodeToken(token: string): DecodedToken | null {
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  }

  getCurrentUser(): User | null {
    const token = this.getAccessToken();
    if (!token || !this.isTokenValid(token)) return null;
    
    const decoded = this.decodeToken(token);
    if (!decoded) return null;
    
    return {
      id: decoded.id,
      email: decoded.email,
      first_name: '',
      last_name: '',
      role: decoded.role as 'user' | 'admin',
      status: 'active',
      created_at: ''
    };
  }

  // Auto-refresh scheduling
  private scheduleTokenRefresh(accessToken: string): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    const decoded = this.decodeToken(accessToken);
    if (!decoded) return;

    // Schedule refresh 5 minutes before expiry
    const refreshTime = (decoded.exp - Date.now() / 1000 - 300) * 1000;
    
    if (refreshTime > 0) {
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshTokens();
      }, refreshTime);
    }
  }

  // Token refresh logic
  async refreshTokens(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    return result;
  }

  private async performTokenRefresh(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.handleAuthFailure('No refresh token available');
      return false;
    }

    try {
      const response = await apiClient.post('/api/auth/refresh', {
        refreshToken
      });

      if (response.tokens) {
        this.setTokens(response.tokens);
        return true;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      this.handleAuthFailure('Session expired. Please log in again.');
      return false;
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password
      });

      if (response.tokens && response.user) {
        this.setTokens(response.tokens);
        toast.success('Welcome back!');
        
        return { 
          success: true, 
          user: response.user 
        };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (refreshToken) {
        // Notify server to blacklist the refresh token
        await apiClient.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearTokens();
      toast.success('Logged out successfully');
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiClient.post('/api/auth/register', userData);

      if (response.user) {
        toast.success('Registration successful! Please log in.');
        return { 
          success: true, 
          user: response.user 
        };
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  // Check authentication status
  async checkAuthStatus(): Promise<User | null> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) return null;
    
    if (!this.isTokenValid(accessToken)) {
      // Try to refresh token
      const refreshSuccess = await this.refreshTokens();
      if (!refreshSuccess) return null;
    }
    
    return this.getCurrentUser();
  }

  // Handle authentication failures
  private handleAuthFailure(message: string): void {
    this.clearTokens();
    toast.error(message);
    
    // Redirect to login page unless already there
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token !== null && this.isTokenValid(token);
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  hasRole(role: 'user' | 'admin'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Initialize auth service (call on app start)
  initialize(): void {
    const accessToken = this.getAccessToken();
    if (accessToken && this.isTokenValid(accessToken)) {
      this.scheduleTokenRefresh(accessToken);
    } else if (accessToken) {
      // Token exists but is invalid/expired, try to refresh
      this.refreshTokens();
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;