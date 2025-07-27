'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface UseRealTimeSyncOptions {
  /** Sync interval in milliseconds (default: 30000 = 30s) */
  interval?: number;
  /** Whether to sync immediately on mount */
  immediate?: boolean;
  /** Whether to sync when window regains focus */
  syncOnFocus?: boolean;
  /** Whether to show notifications for sync status */
  notifications?: boolean;
  /** Maximum number of consecutive failures before stopping sync */
  maxFailures?: number;
}

interface SyncState {
  isLoading: boolean;
  lastSync: Date | null;
  errorCount: number;
  isConnected: boolean;
}

/**
 * Hook for real-time data synchronization with the backend
 * Provides automatic polling, error handling, and reconnection logic
 */
export function useRealTimeSync(
  syncFunction: () => Promise<void>,
  options: UseRealTimeSyncOptions = {}
) {
  const {
    interval = 30000, // 30 seconds
    immediate = true,
    syncOnFocus = true,
    notifications = false,
    maxFailures = 3
  } = options;

  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    lastSync: null,
    errorCount: 0,
    isConnected: navigator.onLine
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const syncInProgressRef = useRef(false);

  const executeSync = useCallback(async () => {
    // Prevent multiple simultaneous syncs
    if (syncInProgressRef.current || !isMountedRef.current) {
      return;
    }

    // Stop syncing if too many failures
    if (syncState.errorCount >= maxFailures) {
      console.warn('[RealTimeSync] Max failures reached, stopping sync');
      return;
    }

    syncInProgressRef.current = true;
    setSyncState(prev => ({ ...prev, isLoading: true }));

    try {
      await syncFunction();
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        lastSync: new Date(),
        errorCount: 0
      }));

      if (notifications && syncState.errorCount > 0) {
        toast.success('Data sync restored');
      }
    } catch (error) {
      console.error('[RealTimeSync] Sync failed:', error);
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        errorCount: prev.errorCount + 1
      }));

      if (notifications) {
        const errorMessage = error instanceof Error ? error.message : 'Sync failed';
        toast.error(`Data sync failed: ${errorMessage}`);
      }
    } finally {
      syncInProgressRef.current = false;
    }
  }, [syncFunction, syncState.errorCount, maxFailures, notifications]);

  const startSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(executeSync, interval);
  }, [executeSync, interval]);

  const stopSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const forcSync = useCallback(() => {
    executeSync();
  }, [executeSync]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isConnected: true, errorCount: 0 }));
      if (notifications) {
        toast.success('Connection restored');
      }
      executeSync(); // Immediate sync when coming back online
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isConnected: false }));
      if (notifications) {
        toast.error('Connection lost');
      }
      stopSync();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [executeSync, stopSync, notifications]);

  // Handle window focus sync
  useEffect(() => {
    if (!syncOnFocus) return;

    const handleFocus = () => {
      // Only sync if it's been more than 10 seconds since last sync
      const now = new Date();
      const timeSinceLastSync = syncState.lastSync 
        ? now.getTime() - syncState.lastSync.getTime()
        : Infinity;

      if (timeSinceLastSync > 10000) {
        executeSync();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [syncOnFocus, executeSync, syncState.lastSync]);

  // Main sync lifecycle
  useEffect(() => {
    if (immediate && syncState.isConnected) {
      executeSync();
    }

    if (syncState.isConnected && syncState.errorCount < maxFailures) {
      startSync();
    }

    return () => {
      stopSync();
    };
  }, [immediate, startSync, stopSync, syncState.isConnected, syncState.errorCount, maxFailures]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopSync();
    };
  }, [stopSync]);

  return {
    ...syncState,
    forceSync: forcSync,
    startSync,
    stopSync,
    timeSinceLastSync: syncState.lastSync 
      ? Math.floor((Date.now() - syncState.lastSync.getTime()) / 1000)
      : null
  };
}

/**
 * Higher-order hook for syncing multiple data sources
 */
export function useMultiSync(
  syncFunctions: Record<string, () => Promise<void>>,
  options: UseRealTimeSyncOptions = {}
) {
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});

  const combinedSync = useCallback(async () => {
    const results = await Promise.allSettled(
      Object.entries(syncFunctions).map(async ([key, fn]) => {
        try {
          await fn();
          setSyncStates(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              lastSync: new Date(),
              errorCount: 0
            }
          }));
        } catch (error) {
          setSyncStates(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              errorCount: (prev[key]?.errorCount || 0) + 1
            }
          }));
          throw error;
        }
      })
    );

    // Check if any sync failed
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`${failures.length} sync operations failed`);
    }
  }, [syncFunctions]);

  const syncResult = useRealTimeSync(combinedSync, options);

  return {
    ...syncResult,
    syncStates
  };
}