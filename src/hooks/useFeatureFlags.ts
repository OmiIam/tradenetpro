'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { FeatureFlagKeys, FeatureFlagMap, FeatureFlagContextType } from '@/types/feature-flags';

// Create context for feature flags
const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

// Default feature flags (all disabled)
const defaultFeatures: FeatureFlagMap = Object.values(FeatureFlagKeys).reduce(
  (acc, key) => ({ ...acc, [key]: false }),
  {} as FeatureFlagMap
);

/**
 * Custom hook for using feature flags
 */
export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};

/**
 * Hook for checking individual feature flags
 */
export const useFeatureFlag = (key: FeatureFlagKeys): boolean => {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(key);
};

/**
 * Hook for conditional rendering based on feature flags
 */
export const useFeatureGate = (key: FeatureFlagKeys) => {
  const isEnabled = useFeatureFlag(key);
  
  return {
    isEnabled,
    FeatureGate: ({ children, fallback = null }: { 
      children: React.ReactNode; 
      fallback?: React.ReactNode; 
    }) => {
      return isEnabled ? <>{children}</> : <>{fallback}</>;
    }
  };
};

/**
 * Provider component for feature flags
 */
export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlagMap>(defaultFeatures);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/feature-flags/user/enabled', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Convert enabled features array to feature map
        const featureMap = { ...defaultFeatures };
        data.data.enabled_features.forEach((feature: string) => {
          if (feature in featureMap) {
            (featureMap as any)[feature] = true;
          }
        });
        
        setFeatures(featureMap);
      } else {
        throw new Error(data.message || 'Failed to fetch feature flags');
      }
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fall back to default features if fetch fails
      setFeatures(defaultFeatures);
    } finally {
      setLoading(false);
    }
  }, []);

  const isFeatureEnabled = useCallback((key: FeatureFlagKeys): boolean => {
    return features[key] || false;
  }, [features]);

  const refreshFeatures = useCallback(async () => {
    await fetchFeatures();
  }, [fetchFeatures]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const contextValue: FeatureFlagContextType = {
    features,
    isFeatureEnabled,
    refreshFeatures,
    loading,
    error
  };

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

/**
 * HOC for wrapping components with feature flag checks
 */
export const withFeatureFlag = <P extends object>(
  Component: React.ComponentType<P>,
  flagKey: FeatureFlagKeys,
  fallback?: React.ComponentType<P> | null
) => {
  return (props: P) => {
    const isEnabled = useFeatureFlag(flagKey);
    
    if (!isEnabled) {
      return fallback ? <fallback {...props} /> : null;
    }
    
    return <Component {...props} />;
  };
};

/**
 * Component for conditional rendering based on feature flags
 */
export const FeatureGate: React.FC<{
  feature: FeatureFlagKeys;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ feature, children, fallback = null }) => {
  const isEnabled = useFeatureFlag(feature);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

/**
 * Component for loading feature flags
 */
export const FeatureFlagLoader: React.FC<{
  loading?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
}> = ({ 
  loading = <div>Loading features...</div>, 
  error: errorComponent = <div>Error loading features</div>,
  children 
}) => {
  const { loading: isLoading, error } = useFeatureFlags();
  
  if (isLoading) {
    return <>{loading}</>;
  }
  
  if (error) {
    return <>{errorComponent}</>;
  }
  
  return <>{children}</>;
};

/**
 * Hook for multiple feature flags
 */
export const useMultipleFeatureFlags = (keys: FeatureFlagKeys[]): Record<FeatureFlagKeys, boolean> => {
  const { features } = useFeatureFlags();
  
  return keys.reduce((acc, key) => {
    acc[key] = features[key] || false;
    return acc;
  }, {} as Record<FeatureFlagKeys, boolean>);
};

/**
 * Hook for feature flag with callback
 */
export const useFeatureFlagCallback = (
  key: FeatureFlagKeys,
  enabledCallback: () => void,
  disabledCallback?: () => void
) => {
  const isEnabled = useFeatureFlag(key);
  
  useEffect(() => {
    if (isEnabled) {
      enabledCallback();
    } else if (disabledCallback) {
      disabledCallback();
    }
  }, [isEnabled, enabledCallback, disabledCallback]);
  
  return isEnabled;
};

export default useFeatureFlags;