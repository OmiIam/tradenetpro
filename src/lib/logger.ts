// Advanced logging system for admin dashboard
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  constructor() {
    // Capture global errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleGlobalError(event: ErrorEvent) {
    this.error('Global Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack
    }, 'system');
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    this.error('Unhandled Promise Rejection', {
      reason: event.reason,
      stack: event.reason?.stack
    }, 'system');
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    data?: any, 
    category: string = 'general',
    userId?: string
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userId,
      sessionId: this.getSessionId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    // Add stack trace for errors
    if (level === 'error' || level === 'critical') {
      entry.stack = new Error().stack;
    }

    return entry;
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('logger-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('logger-session-id', sessionId);
    }
    return sessionId;
  }

  private addLog(entry: LogEntry) {
    this.logs.unshift(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console output in development
    if (this.isDevelopment) {
      const prefix = `[${entry.level.toUpperCase()}] [${entry.category}]`;
      switch (entry.level) {
        case 'debug':
          console.debug(prefix, entry.message, entry.data);
          break;
        case 'info':
          console.info(prefix, entry.message, entry.data);
          break;
        case 'warn':
          console.warn(prefix, entry.message, entry.data);
          break;
        case 'error':
        case 'critical':
          console.error(prefix, entry.message, entry.data, entry.stack);
          break;
      }
    }

    // Send to backend for persistent storage (critical errors only)
    if (entry.level === 'critical' || entry.level === 'error') {
      this.sendToBackend(entry);
    }
  }

  private async sendToBackend(entry: LogEntry) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return; // Can't send logs without authentication

      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      // Don't log errors from the logger itself to avoid infinite loops
      console.error('Failed to send log to backend:', error);
    }
  }

  // Public logging methods
  debug(message: string, data?: any, category: string = 'debug', userId?: string) {
    const entry = this.createLogEntry('debug', message, data, category, userId);
    this.addLog(entry);
  }

  info(message: string, data?: any, category: string = 'info', userId?: string) {
    const entry = this.createLogEntry('info', message, data, category, userId);
    this.addLog(entry);
  }

  warn(message: string, data?: any, category: string = 'warning', userId?: string) {
    const entry = this.createLogEntry('warn', message, data, category, userId);
    this.addLog(entry);
  }

  error(message: string, data?: any, category: string = 'error', userId?: string) {
    const entry = this.createLogEntry('error', message, data, category, userId);
    this.addLog(entry);
  }

  critical(message: string, data?: any, category: string = 'critical', userId?: string) {
    const entry = this.createLogEntry('critical', message, data, category, userId);
    this.addLog(entry);
  }

  // Admin-specific logging methods
  adminAction(action: string, data?: any, userId?: string) {
    this.info(`Admin Action: ${action}`, data, 'admin', userId);
  }

  securityEvent(event: string, data?: any, userId?: string) {
    this.warn(`Security Event: ${event}`, data, 'security', userId);
  }

  apiError(endpoint: string, error: any, userId?: string) {
    this.error(`API Error: ${endpoint}`, {
      error: error.message || error,
      stack: error.stack
    }, 'api', userId);
  }

  userAction(action: string, data?: any, userId?: string) {
    this.info(`User Action: ${action}`, data, 'user', userId);
  }

  // Query methods for admin dashboard
  getLogs(filters?: {
    level?: LogLevel;
    category?: string;
    userId?: string;
    limit?: number;
    after?: Date;
    before?: Date;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      
      if (filters.after) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) > filters.after!
        );
      }
      
      if (filters.before) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) < filters.before!
        );
      }
      
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }
    }

    return filteredLogs;
  }

  getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<string, number>;
    recent: number; // Last hour
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<LogLevel, number>,
      byCategory: {} as Record<string, number>,
      recent: 0
    };

    // Initialize counters
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    levels.forEach(level => {
      stats.byLevel[level] = 0;
    });

    this.logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level]++;
      
      // Count by category
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
      
      // Count recent logs
      if (new Date(log.timestamp) > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  // Clear logs (admin function)
  clearLogs() {
    this.logs = [];
    this.info('Logs cleared by admin', {}, 'admin');
  }

  // Export logs for admin
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'url'];
      const csvRows = [headers.join(',')];
      
      this.logs.forEach(log => {
        const row = [
          log.timestamp,
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.userId || '',
          log.url || ''
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
    
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience functions for common use cases
export const logAdminAction = (action: string, data?: any, userId?: string) => 
  logger.adminAction(action, data, userId);

export const logSecurityEvent = (event: string, data?: any, userId?: string) => 
  logger.securityEvent(event, data, userId);

export const logApiError = (endpoint: string, error: any, userId?: string) => 
  logger.apiError(endpoint, error, userId);

export const logUserAction = (action: string, data?: any, userId?: string) => 
  logger.userAction(action, data, userId);

export default logger;