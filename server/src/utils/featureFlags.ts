import FeatureFlagService from '../services/FeatureFlagService';
import DatabaseManager from '../models/Database';

class FeatureFlagUtils {
  private static instance: FeatureFlagUtils;
  private featureFlagService: FeatureFlagService;

  private constructor() {
    const database = DatabaseManager.getInstance().getDatabase();
    this.featureFlagService = new FeatureFlagService(database);
  }

  static getInstance(): FeatureFlagUtils {
    if (!FeatureFlagUtils.instance) {
      FeatureFlagUtils.instance = new FeatureFlagUtils();
    }
    return FeatureFlagUtils.instance;
  }

  /**
   * Check if a feature is enabled for a specific user
   */
  isFeatureEnabled(
    key: string,
    userId?: number,
    userAttributes?: Record<string, any>,
    environment: string = process.env.NODE_ENV || 'production'
  ): boolean {
    return this.featureFlagService.isFeatureEnabledForUser(key, userId, userAttributes, environment);
  }

  /**
   * Get all enabled features for a user
   */
  getEnabledFeatures(
    userId?: number,
    userAttributes?: Record<string, any>,
    environment: string = process.env.NODE_ENV || 'production'
  ): string[] {
    return this.featureFlagService.getEnabledFeaturesForUser(userId, userAttributes, environment);
  }

  /**
   * Get feature flag details by key
   */
  getFeatureFlag(key: string, environment: string = process.env.NODE_ENV || 'production') {
    return this.featureFlagService.getFeatureFlagByKey(key, environment);
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagUtils.getInstance();

// Export commonly used feature flag keys as constants
export const FEATURE_FLAGS = {
  // Trading features
  ADVANCED_TRADING: 'advanced_trading',
  OPTIONS_TRADING: 'options_trading',
  CRYPTO_TRADING: 'crypto_trading',
  MARGIN_TRADING: 'margin_trading',
  
  // UI/UX features
  NEW_DASHBOARD: 'new_dashboard',
  DARK_MODE: 'dark_mode',
  MOBILE_TRADING: 'mobile_trading',
  REAL_TIME_CHARTS: 'real_time_charts',
  
  // Social features
  SOCIAL_TRADING: 'social_trading',
  LEADERBOARDS: 'leaderboards',
  CHAT_SUPPORT: 'chat_support',
  COMMUNITY_FEATURES: 'community_features',
  
  // Account features
  INSTANT_DEPOSITS: 'instant_deposits',
  FRACTIONAL_SHARES: 'fractional_shares',
  AUTO_INVESTING: 'auto_investing',
  TAX_OPTIMIZATION: 'tax_optimization',
  
  // Premium features
  PREMIUM_ANALYTICS: 'premium_analytics',
  ADVANCED_RESEARCH: 'advanced_research',
  PRIORITY_SUPPORT: 'priority_support',
  CUSTOM_ALERTS: 'custom_alerts',
  
  // Experimental features
  BETA_FEATURES: 'beta_features',
  AI_RECOMMENDATIONS: 'ai_recommendations',
  VOICE_TRADING: 'voice_trading',
  VR_TRADING: 'vr_trading'
} as const;

// Helper function for Express middleware
export const requireFeatureFlag = (flagKey: string) => {
  return (req: any, res: any, next: any) => {
    const user = req.user;
    const userAttributes = user ? {
      role: user.role,
      kyc_status: user.kyc_status,
      account_funded: user.account_funded,
      created_at: user.created_at,
      user_id: user.id
    } : undefined;

    const isEnabled = featureFlags.isFeatureEnabled(flagKey, user?.id, userAttributes);
    
    if (!isEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Feature not available',
        feature_flag: flagKey
      });
    }
    
    next();
  };
};

// Helper function for React components (returns serializable data)
export const getFeatureFlagsForClient = (
  userId?: number,
  userAttributes?: Record<string, any>,
  environment: string = process.env.NODE_ENV || 'production'
): { [key: string]: boolean } => {
  const enabledFeatures = featureFlags.getEnabledFeatures(userId, userAttributes, environment);
  
  // Convert to boolean map for easier client-side usage
  const featureMap: { [key: string]: boolean } = {};
  
  // Initialize all known features as disabled
  Object.values(FEATURE_FLAGS).forEach(flag => {
    featureMap[flag] = false;
  });
  
  // Enable the features that are actually enabled
  enabledFeatures.forEach(feature => {
    featureMap[feature] = true;
  });
  
  return featureMap;
};

export default featureFlags;