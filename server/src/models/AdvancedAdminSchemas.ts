import Database from 'better-sqlite3';

/**
 * Extended database schemas for advanced admin features
 * This extends the existing Database.ts with additional tables for:
 * - User session tracking with device/location info
 * - User impersonation system with audit logging
 * - Feature flags/toggles management
 * - Broadcast messaging system
 * - Enhanced audit logging
 * - User flagging/moderation system
 * - Bulk actions system
 */

export class AdvancedAdminSchemas {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  public createAdvancedSchemas() {
    this.createUserSessionTracking();
    this.createUserImpersonation();
    this.createFeatureFlags();
    this.createBroadcastMessaging();
    this.createEnhancedAuditLogging();
    this.createModerationSystem();
    this.createBulkActions();
    this.createAnalyticsSchemas();
    this.createWebhookSystem();
    this.createAdvancedIndexes();
  }

  private createUserSessionTracking() {
    // Enhanced user sessions with device and location tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_session_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        device_type TEXT DEFAULT 'unknown' CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
        device_name TEXT,
        browser_name TEXT,
        browser_version TEXT,
        operating_system TEXT,
        ip_address TEXT NOT NULL,
        country TEXT,
        region TEXT,
        city TEXT,
        latitude REAL,
        longitude REAL,
        timezone TEXT,
        is_mobile BOOLEAN DEFAULT FALSE,
        user_agent TEXT,
        screen_resolution TEXT,
        language TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        login_method TEXT DEFAULT 'password' CHECK (login_method IN ('password', 'oauth', '2fa', 'biometric')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // User login history for security monitoring
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        login_type TEXT NOT NULL CHECK (login_type IN ('success', 'failed', 'blocked', 'suspicious')),
        ip_address TEXT NOT NULL,
        device_fingerprint TEXT,
        user_agent TEXT,
        failure_reason TEXT,
        country TEXT,
        city TEXT,
        is_suspicious BOOLEAN DEFAULT FALSE,
        risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  private createUserImpersonation() {
    // Admin impersonation system with full audit trail
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_impersonations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER NOT NULL,
        target_user_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        is_active BOOLEAN DEFAULT TRUE,
        ip_address TEXT,
        user_agent TEXT,
        approval_required BOOLEAN DEFAULT TRUE,
        approved_by INTEGER,
        approved_at DATETIME,
        denial_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Actions performed during impersonation
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS impersonation_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        impersonation_id INTEGER NOT NULL,
        action_type TEXT NOT NULL,
        action_description TEXT NOT NULL,
        resource_type TEXT,
        resource_id INTEGER,
        old_values TEXT, -- JSON
        new_values TEXT, -- JSON
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (impersonation_id) REFERENCES admin_impersonations(id) ON DELETE CASCADE
      )
    `);
  }

  private createFeatureFlags() {
    // Feature flags system for gradual rollouts and A/B testing
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        key TEXT UNIQUE NOT NULL,
        description TEXT,
        is_enabled BOOLEAN DEFAULT FALSE,
        rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
        environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
        target_user_type TEXT DEFAULT 'all' CHECK (target_user_type IN ('all', 'new', 'existing', 'premium', 'beta')),
        start_date DATETIME,
        end_date DATETIME,
        created_by INTEGER,
        updated_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // User-specific feature flag overrides
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_feature_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        feature_flag_id INTEGER NOT NULL,
        is_enabled BOOLEAN NOT NULL,
        reason TEXT,
        set_by INTEGER,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (feature_flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE,
        FOREIGN KEY (set_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(user_id, feature_flag_id)
      )
    `);
  }

  private createBroadcastMessaging() {
    // System-wide broadcast messages
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS broadcast_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'info' CHECK (message_type IN ('info', 'warning', 'error', 'maintenance', 'promotion')),
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'users', 'premium', 'new_users', 'inactive', 'specific')),
        is_active BOOLEAN DEFAULT TRUE,
        is_dismissible BOOLEAN DEFAULT TRUE,
        show_on_login BOOLEAN DEFAULT FALSE,
        show_in_dashboard BOOLEAN DEFAULT TRUE,
        show_as_popup BOOLEAN DEFAULT FALSE,
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // User-specific broadcast message status
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_broadcast_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        broadcast_id INTEGER NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_dismissed BOOLEAN DEFAULT FALSE,
        read_at DATETIME,
        dismissed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (broadcast_id) REFERENCES broadcast_messages(id) ON DELETE CASCADE,
        UNIQUE(user_id, broadcast_id)
      )
    `);

    // Email campaigns and newsletters
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        template_id TEXT,
        target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'users', 'premium', 'new_users', 'inactive', 'specific')),
        send_method TEXT DEFAULT 'immediate' CHECK (send_method IN ('immediate', 'scheduled', 'drip')),
        scheduled_at DATETIME,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')),
        total_recipients INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        opened_count INTEGER DEFAULT 0,
        clicked_count INTEGER DEFAULT 0,
        bounced_count INTEGER DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  private createEnhancedAuditLogging() {
    // Enhanced audit logs with more detailed tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS detailed_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        admin_id INTEGER,
        impersonation_id INTEGER,
        session_id INTEGER,
        action_category TEXT NOT NULL CHECK (action_category IN ('auth', 'user_management', 'trading', 'financial', 'kyc', 'system', 'security')),
        action_type TEXT NOT NULL,
        action_description TEXT NOT NULL,
        resource_type TEXT,
        resource_id INTEGER,
        resource_name TEXT,
        old_values TEXT, -- JSON
        new_values TEXT, -- JSON
        change_summary TEXT,
        risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        ip_address TEXT,
        user_agent TEXT,
        country TEXT,
        city TEXT,
        device_type TEXT,
        browser_name TEXT,
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT,
        execution_time_ms INTEGER,
        metadata TEXT, -- JSON for additional context
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (impersonation_id) REFERENCES admin_impersonations(id) ON DELETE SET NULL,
        FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL
      )
    `);

    // System performance and error logs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_level TEXT NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error', 'fatal')),
        category TEXT NOT NULL CHECK (category IN ('api', 'database', 'auth', 'trading', 'email', 'cron', 'external')),
        message TEXT NOT NULL,
        error_code TEXT,
        stack_trace TEXT,
        request_id TEXT,
        user_id INTEGER,
        ip_address TEXT,
        execution_time_ms INTEGER,
        memory_usage_mb REAL,
        cpu_usage_percent REAL,
        metadata TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
  }

  private createModerationSystem() {
    // User flags and reports
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_user_id INTEGER NOT NULL,
        reporter_user_id INTEGER,
        reporter_admin_id INTEGER,
        flag_type TEXT NOT NULL CHECK (flag_type IN ('spam', 'abuse', 'suspicious_activity', 'policy_violation', 'security_concern', 'other')),
        reason TEXT NOT NULL,
        description TEXT,
        evidence_urls TEXT, -- JSON array of evidence links
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed', 'escalated')),
        assigned_to INTEGER,
        resolution TEXT,
        resolved_by INTEGER,
        resolved_at DATETIME,
        auto_generated BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (reporter_admin_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Automated risk scoring and monitoring
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_risk_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
        login_risk INTEGER DEFAULT 0 CHECK (login_risk BETWEEN 0 AND 100),
        trading_risk INTEGER DEFAULT 0 CHECK (trading_risk BETWEEN 0 AND 100),
        kyc_risk INTEGER DEFAULT 0 CHECK (kyc_risk BETWEEN 0 AND 100),
        financial_risk INTEGER DEFAULT 0 CHECK (financial_risk BETWEEN 0 AND 100),
        behavior_risk INTEGER DEFAULT 0 CHECK (behavior_risk BETWEEN 0 AND 100),
        risk_factors TEXT, -- JSON array of risk factors
        last_calculated DATETIME DEFAULT CURRENT_TIMESTAMP,
        calculation_version TEXT DEFAULT '1.0',
        requires_review BOOLEAN DEFAULT FALSE,
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
  }

  private createBulkActions() {
    // Bulk operations tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bulk_operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_type TEXT NOT NULL CHECK (operation_type IN ('user_update', 'user_suspend', 'user_delete', 'email_send', 'balance_adjust', 'kyc_update')),
        operation_name TEXT NOT NULL,
        description TEXT,
        target_criteria TEXT NOT NULL, -- JSON criteria used to select targets
        total_targets INTEGER NOT NULL DEFAULT 0,
        processed_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
        started_by INTEGER NOT NULL,
        approved_by INTEGER,
        started_at DATETIME,
        completed_at DATETIME,
        estimated_duration_minutes INTEGER,
        actual_duration_minutes INTEGER,
        error_summary TEXT,
        rollback_available BOOLEAN DEFAULT FALSE,
        rollback_data TEXT, -- JSON data for rollback
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Individual results of bulk operations
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bulk_operation_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bulk_operation_id INTEGER NOT NULL,
        target_user_id INTEGER,
        target_resource_type TEXT,
        target_resource_id INTEGER,
        action_taken TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
        old_values TEXT, -- JSON
        new_values TEXT, -- JSON
        error_message TEXT,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bulk_operation_id) REFERENCES bulk_operations(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
  }

  private createAnalyticsSchemas() {
    // User analytics and metrics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        metric_date DATE NOT NULL,
        login_count INTEGER DEFAULT 0,
        session_duration_minutes INTEGER DEFAULT 0,
        page_views INTEGER DEFAULT 0,
        actions_performed INTEGER DEFAULT 0,
        trades_count INTEGER DEFAULT 0,
        trades_volume REAL DEFAULT 0,
        deposits_count INTEGER DEFAULT 0,
        deposits_amount REAL DEFAULT 0,
        withdrawals_count INTEGER DEFAULT 0,
        withdrawals_amount REAL DEFAULT 0,
        support_tickets INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, metric_date)
      )
    `);

    // System-wide analytics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_date DATE NOT NULL UNIQUE,
        total_users INTEGER DEFAULT 0,
        active_users INTEGER DEFAULT 0,
        new_registrations INTEGER DEFAULT 0,
        verified_users INTEGER DEFAULT 0,
        suspended_users INTEGER DEFAULT 0,
        total_trades INTEGER DEFAULT 0,
        total_volume REAL DEFAULT 0,
        total_deposits REAL DEFAULT 0,
        total_withdrawals REAL DEFAULT 0,
        total_revenue REAL DEFAULT 0,
        support_tickets INTEGER DEFAULT 0,
        system_uptime_percent REAL DEFAULT 100,
        avg_response_time_ms REAL DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private createWebhookSystem() {
    // Webhook configurations
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        secret_key TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        events TEXT NOT NULL, -- JSON array of event types
        headers TEXT, -- JSON object of custom headers
        timeout_seconds INTEGER DEFAULT 30,
        retry_attempts INTEGER DEFAULT 3,
        retry_delay_seconds INTEGER DEFAULT 5,
        last_success DATETIME,
        last_failure DATETIME,
        total_calls INTEGER DEFAULT 0,
        success_calls INTEGER DEFAULT 0,
        failed_calls INTEGER DEFAULT 0,
        created_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Webhook delivery logs
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        webhook_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL, -- JSON
        status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'retrying')),
        http_status INTEGER,
        response_body TEXT,
        response_headers TEXT, -- JSON
        attempt_count INTEGER DEFAULT 1,
        max_attempts INTEGER DEFAULT 3,
        next_retry DATETIME,
        delivered_at DATETIME,
        error_message TEXT,
        execution_time_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (webhook_id) REFERENCES webhook_endpoints(id) ON DELETE CASCADE
      )
    `);
  }

  private createAdvancedIndexes() {
    // Create indexes for performance optimization
    this.db.exec(`
      -- User session tracking indexes
      CREATE INDEX IF NOT EXISTS idx_user_session_details_user_id ON user_session_details(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_session_details_active ON user_session_details(is_active);
      CREATE INDEX IF NOT EXISTS idx_user_session_details_last_activity ON user_session_details(last_activity);
      CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON user_login_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_login_history_login_type ON user_login_history(login_type);
      CREATE INDEX IF NOT EXISTS idx_user_login_history_ip ON user_login_history(ip_address);
      
      -- Impersonation indexes
      CREATE INDEX IF NOT EXISTS idx_admin_impersonations_admin_id ON admin_impersonations(admin_id);
      CREATE INDEX IF NOT EXISTS idx_admin_impersonations_target_user ON admin_impersonations(target_user_id);
      CREATE INDEX IF NOT EXISTS idx_admin_impersonations_active ON admin_impersonations(is_active);
      CREATE INDEX IF NOT EXISTS idx_impersonation_actions_impersonation_id ON impersonation_actions(impersonation_id);
      
      -- Feature flags indexes
      CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);
      CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
      CREATE INDEX IF NOT EXISTS idx_user_feature_flags_user_id ON user_feature_flags(user_id);
      
      -- Broadcast messaging indexes
      CREATE INDEX IF NOT EXISTS idx_broadcast_messages_active ON broadcast_messages(is_active);
      CREATE INDEX IF NOT EXISTS idx_broadcast_messages_start_time ON broadcast_messages(start_time);
      CREATE INDEX IF NOT EXISTS idx_broadcast_messages_target_audience ON broadcast_messages(target_audience);
      CREATE INDEX IF NOT EXISTS idx_user_broadcast_status_user_id ON user_broadcast_status(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_broadcast_status_read ON user_broadcast_status(is_read);
      
      -- Enhanced audit logs indexes
      CREATE INDEX IF NOT EXISTS idx_detailed_audit_logs_user_id ON detailed_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_detailed_audit_logs_admin_id ON detailed_audit_logs(admin_id);
      CREATE INDEX IF NOT EXISTS idx_detailed_audit_logs_category ON detailed_audit_logs(action_category);
      CREATE INDEX IF NOT EXISTS idx_detailed_audit_logs_risk_level ON detailed_audit_logs(risk_level);
      CREATE INDEX IF NOT EXISTS idx_detailed_audit_logs_created_at ON detailed_audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);
      CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
      CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
      
      -- Moderation system indexes
      CREATE INDEX IF NOT EXISTS idx_user_flags_target_user ON user_flags(target_user_id);
      CREATE INDEX IF NOT EXISTS idx_user_flags_status ON user_flags(status);
      CREATE INDEX IF NOT EXISTS idx_user_flags_priority ON user_flags(priority);
      CREATE INDEX IF NOT EXISTS idx_user_flags_assigned_to ON user_flags(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_user_risk_scores_user_id ON user_risk_scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_risk_scores_overall ON user_risk_scores(overall_score);
      CREATE INDEX IF NOT EXISTS idx_user_risk_scores_requires_review ON user_risk_scores(requires_review);
      
      -- Bulk operations indexes
      CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON bulk_operations(status);
      CREATE INDEX IF NOT EXISTS idx_bulk_operations_started_by ON bulk_operations(started_by);
      CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_at ON bulk_operations(created_at);
      CREATE INDEX IF NOT EXISTS idx_bulk_operation_results_bulk_id ON bulk_operation_results(bulk_operation_id);
      CREATE INDEX IF NOT EXISTS idx_bulk_operation_results_status ON bulk_operation_results(status);
      
      -- Analytics indexes
      CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_date ON user_analytics(metric_date);
      CREATE INDEX IF NOT EXISTS idx_system_analytics_date ON system_analytics(metric_date);
      
      -- Webhook indexes
      CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON webhook_endpoints(is_active);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry);
    `);
  }
}

export default AdvancedAdminSchemas;