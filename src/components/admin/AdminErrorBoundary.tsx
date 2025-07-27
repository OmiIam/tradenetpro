'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Global error boundary for the admin dashboard
 * Provides user-friendly error UI with retry functionality and automatic error logging
 */
class AdminErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    this.logError(error, errorInfo);
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private logError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Log to backend monitoring service
      await fetch('/api/admin/error-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    // Also log to console for development
    console.group('🚨 Admin Dashboard Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      // Max retries reached, redirect to safe state
      window.location.href = '/admin';
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1
    });

    // Auto-retry with exponential backoff if error persists
    const timeout = setTimeout(() => {
      if (this.state.hasError) {
        this.handleRetry();
      }
    }, Math.pow(2, retryCount) * 1000);
    
    this.retryTimeouts.push(timeout);
  };

  private handleGoHome = () => {
    window.location.href = '/admin';
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const bugReport = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    // Open email client with pre-filled bug report
    const subject = encodeURIComponent('Admin Dashboard Error Report');
    const body = encodeURIComponent(`
Bug Report:
-----------
Error: ${bugReport.error}
URL: ${bugReport.url}
Time: ${bugReport.timestamp}

Technical Details:
${bugReport.stack}

Component Stack:
${bugReport.componentStack}
    `);
    
    window.open(`mailto:admin@tradepro.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount } = this.state;
      const maxRetries = 3;

      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"
                >
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </motion.div>
                
                <CardTitle className="text-2xl text-red-400 mb-2">
                  Admin Dashboard Error
                </CardTitle>
                
                <p className="text-slate-300 text-lg">
                  Something went wrong with the admin interface
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Error Details */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-white font-medium mb-2">Error Details</h4>
                  <p className="text-red-400 text-sm font-mono break-words">
                    {error?.message || 'Unknown error occurred'}
                  </p>
                  {retryCount > 0 && (
                    <p className="text-amber-400 text-sm mt-2">
                      Retry attempt: {retryCount} / {maxRetries}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={this.handleRetry}
                    disabled={retryCount >= maxRetries}
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${retryCount >= maxRetries ? '' : 'animate-spin'}`} />
                    <span>
                      {retryCount >= maxRetries ? 'Max Retries Reached' : 'Try Again'}
                    </span>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={this.handleReportBug}
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    <Bug className="w-4 h-4" />
                    <span>Report Bug</span>
                  </Button>
                </div>

                {/* Development Info */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                    <summary className="text-white font-medium cursor-pointer">
                      Development Details
                    </summary>
                    <div className="mt-4 space-y-2">
                      <div>
                        <h5 className="text-slate-400 text-sm font-medium">Stack Trace:</h5>
                        <pre className="text-xs text-slate-300 bg-slate-900 p-2 rounded mt-1 overflow-auto">
                          {error?.stack}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <h5 className="text-slate-400 text-sm font-medium">Component Stack:</h5>
                          <pre className="text-xs text-slate-300 bg-slate-900 p-2 rounded mt-1 overflow-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Help Text */}
                <div className="text-center text-slate-400 text-sm">
                  <p>If the problem persists, please contact the development team.</p>
                  <p className="mt-1">Error ID: {Date.now().toString(36)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;