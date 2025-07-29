/**
 * TypeScript interfaces for advanced admin features
 */

// User Session Tracking
export interface UserSessionDetail {
  id: number;
  session_id: number;
  user_id: number;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  device_name?: string;
  browser_name?: string;
  browser_version?: string;
  operating_system?: string;
  ip_address: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  is_mobile: boolean;
  user_agent?: string;
  screen_resolution?: string;
  language?: string;
  is_active: boolean;
  last_activity: string;
  login_method: 'password' | 'oauth' | '2fa' | 'biometric';
  created_at: string;
  ended_at?: string;
}

export interface UserLoginHistory {
  id: number;
  user_id: number;
  login_type: 'success' | 'failed' | 'blocked' | 'suspicious';
  ip_address: string;
  device_fingerprint?: string;
  user_agent?: string;
  failure_reason?: string;
  country?: string;
  city?: string;
  is_suspicious: boolean;
  risk_score: number;
  created_at: string;
}

// User Impersonation
export interface AdminImpersonation {
  id: number;
  admin_id: number;
  target_user_id: number;
  reason: string;
  start_time: string;
  end_time?: string;
  is_active: boolean;
  ip_address?: string;
  user_agent?: string;
  approval_required: boolean;
  approved_by?: number;
  approved_at?: string;
  denial_reason?: string;
  created_at: string;
}

export interface ImpersonationAction {
  id: number;
  impersonation_id: number;
  action_type: string;
  action_description: string;
  resource_type?: string;
  resource_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// Feature Flags
export interface FeatureFlag {
  id: number;
  name: string;
  key: string;
  description?: string;
  is_enabled: boolean;
  rollout_percentage: number;
  environment: 'development' | 'staging' | 'production';
  target_user_type: 'all' | 'new' | 'existing' | 'premium' | 'beta';
  start_date?: string;
  end_date?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface UserFeatureFlag {
  id: number;
  user_id: number;
  feature_flag_id: number;
  is_enabled: boolean;
  reason?: string;
  set_by?: number;
  expires_at?: string;
  created_at: string;
}

// Broadcast Messaging
export interface BroadcastMessage {
  id: number;
  title: string;
  content: string;
  message_type: 'info' | 'warning' | 'error' | 'maintenance' | 'promotion';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'users' | 'premium' | 'new_users' | 'inactive' | 'specific';
  is_active: boolean;
  is_dismissible: boolean;
  show_on_login: boolean;
  show_in_dashboard: boolean;
  show_as_popup: boolean;
  start_time: string;
  end_time?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface UserBroadcastStatus {
  id: number;
  user_id: number;
  broadcast_id: number;
  is_read: boolean;
  is_dismissed: boolean;
  read_at?: string;
  dismissed_at?: string;
  created_at: string;
}

export interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  target_audience: 'all' | 'users' | 'premium' | 'new_users' | 'inactive' | 'specific';
  send_method: 'immediate' | 'scheduled' | 'drip';
  scheduled_at?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled' | 'failed';
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  created_by: number;
  created_at: string;
  sent_at?: string;
}

// Enhanced Audit Logging
export interface DetailedAuditLog {
  id: number;
  user_id?: number;
  admin_id?: number;
  impersonation_id?: number;
  session_id?: number;
  action_category: 'auth' | 'user_management' | 'trading' | 'financial' | 'kyc' | 'system' | 'security';
  action_type: string;
  action_description: string;
  resource_type?: string;
  resource_id?: number;
  resource_name?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  change_summary?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  ip_address?: string;
  user_agent?: string;
  country?: string;
  city?: string;
  device_type?: string;
  browser_name?: string;
  success: boolean;
  error_message?: string;
  execution_time_ms?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SystemLog {
  id: number;
  log_level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  category: 'api' | 'database' | 'auth' | 'trading' | 'email' | 'cron' | 'external';
  message: string;
  error_code?: string;
  stack_trace?: string;
  request_id?: string;
  user_id?: number;
  ip_address?: string;
  execution_time_ms?: number;
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

// Moderation System
export interface UserFlag {
  id: number;
  target_user_id: number;
  reporter_user_id?: number;
  reporter_admin_id?: number;
  flag_type: 'spam' | 'abuse' | 'suspicious_activity' | 'policy_violation' | 'security_concern' | 'other';
  reason: string;
  description?: string;
  evidence_urls?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'under_review' | 'resolved' | 'dismissed' | 'escalated';
  assigned_to?: number;
  resolution?: string;
  resolved_by?: number;
  resolved_at?: string;
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRiskScore {
  id: number;
  user_id: number;
  overall_score: number;
  login_risk: number;
  trading_risk: number;
  kyc_risk: number;
  financial_risk: number;
  behavior_risk: number;
  risk_factors?: string[];
  last_calculated: string;
  calculation_version: string;
  requires_review: boolean;
  reviewed_by?: number;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Bulk Operations
export interface BulkOperation {
  id: number;
  operation_type: 'user_update' | 'user_suspend' | 'user_delete' | 'email_send' | 'balance_adjust' | 'kyc_update';
  operation_name: string;
  description?: string;
  target_criteria: Record<string, any>;
  total_targets: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  started_by: number;
  approved_by?: number;
  started_at?: string;
  completed_at?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  error_summary?: string;
  rollback_available: boolean;
  rollback_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BulkOperationResult {
  id: number;
  bulk_operation_id: number;
  target_user_id?: number;
  target_resource_type?: string;
  target_resource_id?: number;
  action_taken: string;
  status: 'success' | 'failed' | 'skipped';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  error_message?: string;
  processed_at: string;
}

// Analytics
export interface UserAnalytics {
  id: number;
  user_id: number;
  metric_date: string;
  login_count: number;
  session_duration_minutes: number;
  page_views: number;
  actions_performed: number;
  trades_count: number;
  trades_volume: number;
  deposits_count: number;
  deposits_amount: number;
  withdrawals_count: number;
  withdrawals_amount: number;
  support_tickets: number;
  last_updated: string;
}

export interface SystemAnalytics {
  id: number;
  metric_date: string;
  total_users: number;
  active_users: number;
  new_registrations: number;
  verified_users: number;
  suspended_users: number;
  total_trades: number;
  total_volume: number;
  total_deposits: number;
  total_withdrawals: number;
  total_revenue: number;
  support_tickets: number;
  system_uptime_percent: number;
  avg_response_time_ms: number;
  error_count: number;
  created_at: string;
}

// Webhook System
export interface WebhookEndpoint {
  id: number;
  name: string;
  url: string;
  secret_key: string;
  is_active: boolean;
  events: string[];
  headers?: Record<string, string>;
  timeout_seconds: number;
  retry_attempts: number;
  retry_delay_seconds: number;
  last_success?: string;
  last_failure?: string;
  total_calls: number;
  success_calls: number;
  failed_calls: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: number;
  webhook_id: number;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  http_status?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  attempt_count: number;
  max_attempts: number;
  next_retry?: string;
  delivered_at?: string;
  error_message?: string;
  execution_time_ms?: number;
  created_at: string;
}

// Combined interfaces for API responses
export interface AdminDashboardData {
  users: {
    total: number;
    active: number;
    new_today: number;
    suspended: number;
    pending_kyc: number;
  };
  sessions: {
    active_sessions: number;
    unique_devices: number;
    suspicious_logins: number;
  };
  flags: {
    open_flags: number;
    high_priority: number;
    requiring_review: number;
  };
  operations: {
    running_operations: number;
    pending_approval: number;
    completed_today: number;
  };
  system: {
    uptime_percent: number;
    avg_response_time: number;
    error_rate: number;
  };
}

export interface AdminActivityFeed {
  recent_logins: UserLoginHistory[];
  recent_flags: UserFlag[];
  recent_operations: BulkOperation[];
  recent_audit_logs: DetailedAuditLog[];
  system_alerts: SystemLog[];
}

// Filter and search interfaces
export interface AdminFilters {
  date_range?: {
    start: string;
    end: string;
  };
  user_ids?: number[];
  action_categories?: string[];
  risk_levels?: string[];
  statuses?: string[];
  search_query?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface AdminSearchResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: AdminFilters;
}