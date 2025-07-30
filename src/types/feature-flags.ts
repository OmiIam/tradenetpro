export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
  user_criteria?: Record<string, any>;
  environment: 'development' | 'staging' | 'production' | 'all';
  created_by: number;
  created_at: string;
  updated_at: string;
  last_updated_by?: number;
  created_by_email?: string;
  last_updated_by_email?: string;
}

export interface FeatureFlagCreate {
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage?: number;
  user_criteria?: Record<string, any>;
  environment?: 'development' | 'staging' | 'production' | 'all';
}

export interface FeatureFlagUpdate {
  name?: string;
  description?: string;
  is_enabled?: boolean;
  rollout_percentage?: number;
  user_criteria?: Record<string, any>;
  environment?: 'development' | 'staging' | 'production' | 'all';
}

export interface FeatureFlagStats {
  total_flags: number;
  enabled_flags: number;
  disabled_flags: number;
  gradual_rollout_flags: number;
  by_environment: Record<string, number>;
}

export interface FeatureFlagCheckResult {
  key: string;
  enabled: boolean;
  user_id: number | null;
}

export interface UserFeatureFlags {
  enabled_features: string[];
  user_id: number | null;
  environment: string;
}

// Feature flag keys enum for type safety
export enum FeatureFlagKeys {
  // Trading features
  ADVANCED_TRADING = 'advanced_trading',
  OPTIONS_TRADING = 'options_trading',
  CRYPTO_TRADING = 'crypto_trading',
  MARGIN_TRADING = 'margin_trading',
  
  // UI/UX features
  NEW_DASHBOARD = 'new_dashboard',
  DARK_MODE = 'dark_mode',
  MOBILE_TRADING = 'mobile_trading',
  REAL_TIME_CHARTS = 'real_time_charts',
  
  // Social features
  SOCIAL_TRADING = 'social_trading',
  LEADERBOARDS = 'leaderboards',
  CHAT_SUPPORT = 'chat_support',
  COMMUNITY_FEATURES = 'community_features',
  
  // Account features
  INSTANT_DEPOSITS = 'instant_deposits',
  FRACTIONAL_SHARES = 'fractional_shares',
  AUTO_INVESTING = 'auto_investing',
  TAX_OPTIMIZATION = 'tax_optimization',
  
  // Premium features
  PREMIUM_ANALYTICS = 'premium_analytics',
  ADVANCED_RESEARCH = 'advanced_research',
  PRIORITY_SUPPORT = 'priority_support',
  CUSTOM_ALERTS = 'custom_alerts',
  
  // Experimental features
  BETA_FEATURES = 'beta_features',
  AI_RECOMMENDATIONS = 'ai_recommendations',
  VOICE_TRADING = 'voice_trading',
  VR_TRADING = 'vr_trading'
}

// Client-side feature flag map type
export type FeatureFlagMap = {
  [K in FeatureFlagKeys]: boolean;
};

// Partial feature flag map for updates
export type PartialFeatureFlagMap = Partial<FeatureFlagMap>;

// Feature flag context for React
export interface FeatureFlagContextType {
  features: FeatureFlagMap;
  isFeatureEnabled: (key: FeatureFlagKeys) => boolean;
  refreshFeatures: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Operator types for user criteria
export type FeatureFlagOperator = 
  | '>' 
  | '>=' 
  | '<' 
  | '<=' 
  | '!=' 
  | 'not' 
  | 'in' 
  | 'not_in' 
  | 'contains' 
  | 'starts_with' 
  | 'ends_with';

// User criteria type for complex feature flag rules
export interface FeatureFlagUserCriteria {
  [key: string]: 
    | string 
    | number 
    | boolean 
    | string[] 
    | number[] 
    | { [operator in FeatureFlagOperator]?: any };
}

// Bulk update interface
export interface FeatureFlagBulkUpdate {
  id: number;
  data: FeatureFlagUpdate;
}

export interface FeatureFlagBulkUpdateResult {
  id: number;
  success: boolean;
  error?: string;
}

// Export configuration interface
export interface FeatureFlagExportConfig {
  exported_at: string;
  environment: string;
  feature_flags: Array<{
    key: string;
    name: string;
    description: string;
    is_enabled: boolean;
    rollout_percentage: number;
    user_criteria?: FeatureFlagUserCriteria;
    environment: string;
  }>;
}