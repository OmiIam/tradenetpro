import { Request, Response, NextFunction } from 'express';
import { featureFlags, getFeatureFlagsForClient } from '../utils/featureFlags';

// Extend Express Request interface to include feature flags
declare global {
  namespace Express {
    interface Request {
      featureFlags?: {
        [key: string]: boolean;
      };
      checkFeature?: (flagKey: string) => boolean;
    }
  }
}

/**
 * Middleware to attach feature flags to user requests
 * This should be used after authentication middleware
 */
export const attachFeatureFlags = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = (req as any).user;
    const environment = process.env.NODE_ENV || 'production';

    const userAttributes = user ? {
      role: user.role,
      kyc_status: user.kyc_status,
      account_funded: user.account_funded,
      created_at: user.created_at,
      user_id: user.id
    } : undefined;

    // Get feature flags for the user
    req.featureFlags = getFeatureFlagsForClient(user?.id, userAttributes, environment);

    // Add convenience method to check individual features
    req.checkFeature = (flagKey: string): boolean => {
      return req.featureFlags?.[flagKey] || false;
    };

    next();
  } catch (error) {
    console.error('Error attaching feature flags:', error);
    // Don't fail the request if feature flags can't be loaded
    req.featureFlags = {};
    req.checkFeature = () => false;
    next();
  }
};

/**
 * Middleware to require a specific feature flag
 */
export const requireFeature = (flagKey: string, errorMessage?: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.checkFeature || !req.checkFeature(flagKey)) {
      res.status(403).json({
        success: false,
        message: errorMessage || `Feature '${flagKey}' is not available`,
        feature_flag: flagKey,
        enabled: false
      });
      return;
    }
    next();
  };
};

/**
 * Middleware to add feature flags to API responses
 */
export const includeFeatureFlagsInResponse = (req: Request, res: Response, next: NextFunction): void => {
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to include feature flags
  res.json = function(body: any) {
    // Only add feature flags to successful responses with data
    if (res.statusCode < 400 && body && typeof body === 'object' && body.success !== false) {
      // Add feature flags to response metadata
      body._feature_flags = req.featureFlags || {};
    }
    
    // Call original json method
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Route handler to get current user's feature flags
 */
export const getFeatureFlagsEndpoint = (req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: {
        feature_flags: req.featureFlags || {},
        user_id: (req as any).user?.id || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature flags'
    });
  }
};

/**
 * Utility function to conditionally execute code based on feature flags
 */
export const withFeatureFlag = <T>(
  flagKey: string,
  req: Request,
  enabledCallback: () => T,
  disabledCallback?: () => T
): T => {
  if (req.checkFeature && req.checkFeature(flagKey)) {
    return enabledCallback();
  } else if (disabledCallback) {
    return disabledCallback();
  } else {
    throw new Error(`Feature '${flagKey}' is not enabled`);
  }
};

export default {
  attachFeatureFlags,
  requireFeature,
  includeFeatureFlagsInResponse,
  getFeatureFlagsEndpoint,
  withFeatureFlag
};