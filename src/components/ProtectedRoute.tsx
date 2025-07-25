'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Role, Permission, hasPermission } from '@/lib/rbac';
import { AlertTriangle, ShieldX, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPermissions?: Permission[];
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requiredPermissions = [],
  fallbackPath = '/dashboard'
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);
  const [denialReason, setDenialReason] = useState<string>('');

  useEffect(() => {
    if (!isLoading) {
      // Check authentication
      if (!isAuthenticated) {
        console.log('[ProtectedRoute] User not authenticated, redirecting to login');
        toast.error('Please login to access this page');
        router.push('/login');
        return;
      }

      // Check admin requirement
      if (requireAdmin && user?.role !== 'admin') {
        console.log('[ProtectedRoute] Admin access required but user role is:', user?.role);
        setDenialReason('This page requires administrator privileges');
        setAccessDenied(true);
        
        // Show toast and redirect after delay
        toast.error('Access denied: Administrator privileges required');
        setTimeout(() => {
          router.push(fallbackPath);
        }, 3000);
        return;
      }

      // Check specific permissions if provided
      if (requiredPermissions.length > 0 && user?.role) {
        const userRole = user.role as Role;
        const missingPermissions = requiredPermissions.filter(
          permission => !hasPermission(userRole, permission)
        );

        if (missingPermissions.length > 0) {
          console.log('[ProtectedRoute] Missing permissions:', missingPermissions);
          setDenialReason(`Missing required permissions: ${missingPermissions.join(', ')}`);
          setAccessDenied(true);
          
          toast.error('Access denied: Insufficient permissions');
          setTimeout(() => {
            router.push(fallbackPath);
          }, 3000);
          return;
        }
      }

      // All checks passed
      if (accessDenied) {
        setAccessDenied(false);
        setDenialReason('');
      }
    }
  }, [isAuthenticated, user, isLoading, requireAdmin, requiredPermissions, fallbackPath, router, accessDenied]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400/60 rounded-full animate-spin mx-auto animation-delay-300"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Verifying Access</h3>
          <p className="text-gray-400">Checking your credentials...</p>
        </motion.div>
      </div>
    );
  }

  // Show access denied screen
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20"
          >
            <ShieldX className="w-10 h-10 text-red-400" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-4"
          >
            Access Denied
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mb-6 leading-relaxed"
          >
            {denialReason || 'You do not have permission to access this page.'}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center space-x-4 text-sm text-gray-500"
          >
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Role: {user?.role || 'Unknown'}</span>
            </div>
            
            {requireAdmin && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-400">Admin Required</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-xs text-gray-600"
          >
            Redirecting in 3 seconds...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Don't render children if not authenticated or doesn't have required permissions
  if (!isAuthenticated || (requireAdmin && user?.role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
}