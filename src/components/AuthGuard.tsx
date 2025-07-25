'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function AuthGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  fallback,
  redirectTo
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // If authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      const loginUrl = redirectTo || '/login';
      const returnUrl = pathname !== '/' ? `?returnUrl=${encodeURIComponent(pathname)}` : '';
      router.push(`${loginUrl}${returnUrl}`);
      return;
    }

    // If admin role is required but user is not admin
    if (requireAdmin && isAuthenticated && !isAdmin) {
      router.push('/dashboard'); // Redirect non-admin users to dashboard
      return;
    }

    // If user is authenticated but trying to access auth pages, redirect to dashboard
    if (!requireAuth && isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.push('/dashboard');
      return;
    }
  }, [isLoading, isAuthenticated, isAdmin, requireAuth, requireAdmin, router, pathname, redirectTo]);

  // Show loading state
  if (isLoading) {
    return fallback || <LoadingSpinner message="Authenticating..." />;
  }

  // Show content based on auth requirements
  if (requireAuth && !isAuthenticated) {
    return fallback || <LoadingSpinner message="Redirecting to login..." />;
  }

  if (requireAdmin && !isAdmin) {
    return fallback || <LoadingSpinner message="Access denied. Redirecting..." />;
  }

  return <>{children}</>;
}

// Specialized components for common use cases
export function ProtectedRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <AuthGuard requireAuth={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function AdminRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function GuestRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <AuthGuard requireAuth={false} fallback={fallback}>
      {children}
    </AuthGuard>
  );
}