import Database from 'better-sqlite3';
import { Request } from 'express';

export interface ImpersonationRequest {
  admin_id: number;
  target_user_id: number;
  reason: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ImpersonationAction {
  impersonation_id: number;
  action_type: string;
  action_description: string;
  resource_type?: string;
  resource_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
}

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

export class ImpersonationService {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  /**
   * Request user impersonation (may require approval)
   */
  public async requestImpersonation(data: ImpersonationRequest): Promise<number> {
    const { admin_id, target_user_id, reason, ip_address, user_agent } = data;

    // Check if target user exists
    const targetUser = this.db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(target_user_id);
    if (!targetUser) {
      throw new Error('Target user not found');
    }

    // Prevent impersonating other admins
    if ((targetUser as any).role === 'admin') {
      throw new Error('Cannot impersonate admin users');
    }

    // Check for existing active impersonation
    const existingImpersonation = this.db.prepare(`
      SELECT id FROM admin_impersonations 
      WHERE admin_id = ? AND target_user_id = ? AND is_active = TRUE
    `).get(admin_id, target_user_id);

    if (existingImpersonation) {
      throw new Error('Active impersonation session already exists for this user');
    }

    // Determine if approval is required (for sensitive operations)
    const requiresApproval = this.requiresApprovalCheck(target_user_id);

    const insertImpersonation = this.db.prepare(`
      INSERT INTO admin_impersonations (
        admin_id, target_user_id, reason, ip_address, user_agent, approval_required
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertImpersonation.run(admin_id, target_user_id, reason, ip_address, user_agent, requiresApproval ? 1 : 0);
    const impersonationId = result.lastInsertRowid as number;

    // Log the impersonation request
    this.logDetailedAudit({
      admin_id,
      action_category: 'security',
      action_type: 'impersonation_requested',
      action_description: `Admin requested impersonation of user ID ${target_user_id}. Reason: ${reason}`,
      resource_type: 'user',
      resource_id: target_user_id,
      new_values: { reason, requires_approval: requiresApproval },
      ip_address,
      user_agent
    });

    // Auto-approve if not requiring manual approval
    if (!requiresApproval) {
      await this.approveImpersonation(impersonationId, admin_id);
    }

    return impersonationId;
  }

  /**
   * Approve impersonation request
   */
  public async approveImpersonation(impersonationId: number, approverAdminId: number): Promise<void> {
    const impersonation = this.db.prepare(`
      SELECT * FROM admin_impersonations WHERE id = ?
    `).get(impersonationId) as AdminImpersonation;

    if (!impersonation) {
      throw new Error('Impersonation request not found');
    }

    if (impersonation.approved_at) {
      throw new Error('Impersonation request already processed');
    }

    // Update impersonation with approval
    const updateImpersonation = this.db.prepare(`
      UPDATE admin_impersonations 
      SET approved_by = ?, approved_at = CURRENT_TIMESTAMP, is_active = TRUE
      WHERE id = ?
    `);

    updateImpersonation.run(approverAdminId, impersonationId);

    // Log approval
    this.logDetailedAudit({
      admin_id: approverAdminId,
      action_category: 'security',
      action_type: 'impersonation_approved',
      action_description: `Admin approved impersonation request ID ${impersonationId}`,
      resource_type: 'impersonation',
      resource_id: impersonationId,
      new_values: { approved_by: approverAdminId, target_user: impersonation.target_user_id }
    });
  }

  /**
   * Deny impersonation request
   */
  public async denyImpersonation(impersonationId: number, denierAdminId: number, reason: string): Promise<void> {
    const impersonation = this.db.prepare(`
      SELECT * FROM admin_impersonations WHERE id = ?
    `).get(impersonationId) as AdminImpersonation;

    if (!impersonation) {
      throw new Error('Impersonation request not found');
    }

    if (impersonation.approved_at || impersonation.denial_reason) {
      throw new Error('Impersonation request already processed');
    }

    // Update impersonation with denial
    const updateImpersonation = this.db.prepare(`
      UPDATE admin_impersonations 
      SET denial_reason = ?, is_active = FALSE
      WHERE id = ?
    `);

    updateImpersonation.run(reason, impersonationId);

    // Log denial
    this.logDetailedAudit({
      admin_id: denierAdminId,
      action_category: 'security',
      action_type: 'impersonation_denied',
      action_description: `Admin denied impersonation request ID ${impersonationId}. Reason: ${reason}`,
      resource_type: 'impersonation',
      resource_id: impersonationId,
      new_values: { denied_by: denierAdminId, denial_reason: reason, target_user: impersonation.target_user_id }
    });
  }

  /**
   * End active impersonation session
   */
  public async endImpersonation(impersonationId: number, adminId?: number): Promise<void> {
    const impersonation = this.db.prepare(`
      SELECT * FROM admin_impersonations WHERE id = ?
    `).get(impersonationId) as AdminImpersonation;

    if (!impersonation) {
      throw new Error('Impersonation session not found');
    }

    if (!impersonation.is_active) {
      throw new Error('Impersonation session is not active');
    }

    // Calculate session duration
    const startTime = new Date(impersonation.start_time);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // End the impersonation
    const endImpersonation = this.db.prepare(`
      UPDATE admin_impersonations 
      SET end_time = CURRENT_TIMESTAMP, is_active = FALSE
      WHERE id = ?
    `);

    endImpersonation.run(impersonationId);

    // Log impersonation end
    this.logDetailedAudit({
      admin_id: adminId || impersonation.admin_id,
      action_category: 'security',
      action_type: 'impersonation_ended',
      action_description: `Impersonation session ended for user ID ${impersonation.target_user_id}. Duration: ${durationMinutes} minutes`,
      resource_type: 'impersonation',
      resource_id: impersonationId,
      new_values: { duration_minutes: durationMinutes, target_user: impersonation.target_user_id }
    });
  }

  /**
   * Log action performed during impersonation
   */
  public async logImpersonationAction(data: ImpersonationAction): Promise<void> {
    const { impersonation_id, action_type, action_description, resource_type, resource_id, old_values, new_values, ip_address } = data;

    const insertAction = this.db.prepare(`
      INSERT INTO impersonation_actions (
        impersonation_id, action_type, action_description, resource_type, 
        resource_id, old_values, new_values, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAction.run(
      impersonation_id,
      action_type,
      action_description,
      resource_type || null,
      resource_id || null,
      old_values ? JSON.stringify(old_values) : null,
      new_values ? JSON.stringify(new_values) : null,
      ip_address || null
    );

    // Also log in detailed audit logs
    const impersonation = this.db.prepare(`
      SELECT admin_id, target_user_id FROM admin_impersonations WHERE id = ?
    `).get(impersonation_id) as { admin_id: number; target_user_id: number };

    if (impersonation) {
      this.logDetailedAudit({
        admin_id: impersonation.admin_id,
        impersonation_id,
        action_category: 'user_management',
        action_type: `impersonation_${action_type}`,
        action_description: `[IMPERSONATION] ${action_description}`,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        risk_level: 'high' // All impersonation actions are high risk
      });
    }
  }

  /**
   * Get active impersonation session for admin
   */
  public getActiveImpersonation(adminId: number): AdminImpersonation | null {
    const query = this.db.prepare(`
      SELECT ai.*, u.email as target_email, u.first_name, u.last_name
      FROM admin_impersonations ai
      JOIN users u ON ai.target_user_id = u.id
      WHERE ai.admin_id = ? AND ai.is_active = TRUE
      ORDER BY ai.start_time DESC
      LIMIT 1
    `);

    return query.get(adminId) as AdminImpersonation | null;
  }

  /**
   * Get impersonation history
   */
  public getImpersonationHistory(filters: {
    admin_id?: number;
    target_user_id?: number;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  } = {}): {
    impersonations: AdminImpersonation[];
    total: number;
  } {
    const {
      admin_id,
      target_user_id,
      start_date,
      end_date,
      is_active,
      limit = 50,
      offset = 0
    } = filters;

    let whereConditions = [];
    let queryParams = [];

    if (admin_id) {
      whereConditions.push('ai.admin_id = ?');
      queryParams.push(admin_id);
    }

    if (target_user_id) {
      whereConditions.push('ai.target_user_id = ?');
      queryParams.push(target_user_id);
    }

    if (start_date) {
      whereConditions.push('ai.created_at >= ?');
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push('ai.created_at <= ?');
      queryParams.push(end_date);
    }

    if (typeof is_active === 'boolean') {
      whereConditions.push('ai.is_active = ?');
      queryParams.push(is_active ? 1 : 0);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get impersonations
    const impersonationsQuery = this.db.prepare(`
      SELECT 
        ai.*,
        admin.email as admin_email,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name,
        target.email as target_email,
        target.first_name as target_first_name,
        target.last_name as target_last_name,
        approver.email as approver_email
      FROM admin_impersonations ai
      JOIN users admin ON ai.admin_id = admin.id
      JOIN users target ON ai.target_user_id = target.id
      LEFT JOIN users approver ON ai.approved_by = approver.id
      ${whereClause}
      ORDER BY ai.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const impersonations = impersonationsQuery.all(...queryParams, limit, offset) as AdminImpersonation[];

    // Get total count
    const countQuery = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM admin_impersonations ai
      ${whereClause}
    `);

    const { total } = countQuery.get(...queryParams.slice(0, -2)) as { total: number };

    return { impersonations, total };
  }

  /**
   * Get actions performed during specific impersonation
   */
  public getImpersonationActions(impersonationId: number): Array<ImpersonationAction & { created_at: string }> {
    const query = this.db.prepare(`
      SELECT 
        ia.*,
        ia.old_values as old_values_json,
        ia.new_values as new_values_json
      FROM impersonation_actions ia
      WHERE ia.impersonation_id = ?
      ORDER BY ia.created_at DESC
    `);

    const actions = query.all(impersonationId) as any[];

    return actions.map(action => ({
      ...action,
      old_values: action.old_values_json ? JSON.parse(action.old_values_json) : null,
      new_values: action.new_values_json ? JSON.parse(action.new_values_json) : null
    }));
  }

  /**
   * Get pending impersonation requests (requiring approval)
   */
  public getPendingRequests(): AdminImpersonation[] {
    const query = this.db.prepare(`
      SELECT 
        ai.*,
        admin.email as admin_email,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name,
        target.email as target_email,
        target.first_name as target_first_name,
        target.last_name as target_last_name
      FROM admin_impersonations ai
      JOIN users admin ON ai.admin_id = admin.id
      JOIN users target ON ai.target_user_id = target.id
      WHERE ai.approval_required = TRUE 
        AND ai.approved_at IS NULL 
        AND ai.denial_reason IS NULL
      ORDER BY ai.created_at ASC
    `);

    return query.all() as AdminImpersonation[];
  }

  /**
   * Check if approval is required for impersonating a user
   */
  private requiresApprovalCheck(targetUserId: number): boolean {
    // Get user details to determine if approval is required
    const user = this.db.prepare(`
      SELECT 
        u.*,
        p.total_balance,
        (SELECT COUNT(*) FROM user_flags WHERE target_user_id = u.id AND status = 'open') as open_flags
      FROM users u
      LEFT JOIN portfolios p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(targetUserId) as any;

    if (!user) return true;

    // Require approval for high-value accounts
    if (user.total_balance > 10000) return true;

    // Require approval if user has open flags
    if (user.open_flags > 0) return true;

    // Require approval for suspended/inactive users
    if (user.status !== 'active') return true;

    // Otherwise, auto-approve
    return false;
  }

  /**
   * Get impersonation statistics for dashboard
   */
  public getImpersonationStats(days: number = 30): {
    total_requests: number;
    active_sessions: number;
    pending_approval: number;
    avg_session_duration: number;
    top_admins: Array<{ admin_email: string; count: number }>;
    security_alerts: number;
  } {
    const dateFilter = `datetime('now', '-${days} days')`;

    // Total requests
    const totalRequests = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM admin_impersonations
      WHERE created_at >= ${dateFilter}
    `).get() as { count: number };

    // Active sessions
    const activeSessions = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM admin_impersonations
      WHERE is_active = TRUE
    `).get() as { count: number };

    // Pending approval
    const pendingApproval = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM admin_impersonations
      WHERE approval_required = TRUE 
        AND approved_at IS NULL 
        AND denial_reason IS NULL
    `).get() as { count: number };

    // Average session duration
    const avgDuration = this.db.prepare(`
      SELECT AVG(
        CASE 
          WHEN end_time IS NOT NULL 
          THEN (julianday(end_time) - julianday(start_time)) * 24 * 60
          ELSE (julianday('now') - julianday(start_time)) * 24 * 60
        END
      ) as avg_minutes
      FROM admin_impersonations
      WHERE created_at >= ${dateFilter}
        AND approved_at IS NOT NULL
    `).get() as { avg_minutes: number };

    // Top admins by impersonation count
    const topAdmins = this.db.prepare(`
      SELECT 
        u.email as admin_email,
        COUNT(*) as count
      FROM admin_impersonations ai
      JOIN users u ON ai.admin_id = u.id
      WHERE ai.created_at >= ${dateFilter}
      GROUP BY ai.admin_id, u.email
      ORDER BY count DESC
      LIMIT 5
    `).all() as Array<{ admin_email: string; count: number }>;

    // Security alerts (high-risk impersonation actions)
    const securityAlerts = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM detailed_audit_logs
      WHERE action_type LIKE 'impersonation_%'
        AND risk_level = 'high'
        AND created_at >= ${dateFilter}
    `).get() as { count: number };

    return {
      total_requests: totalRequests.count,
      active_sessions: activeSessions.count,
      pending_approval: pendingApproval.count,
      avg_session_duration: avgDuration.avg_minutes || 0,
      top_admins: topAdmins,
      security_alerts: securityAlerts.count
    };
  }

  /**
   * Helper method to log detailed audit entries
   */
  private logDetailedAudit(data: {
    admin_id: number;
    impersonation_id?: number;
    action_category: string;
    action_type: string;
    action_description: string;
    resource_type?: string;
    resource_id?: number;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
    ip_address?: string;
    user_agent?: string;
  }): void {
    const insertAudit = this.db.prepare(`
      INSERT INTO detailed_audit_logs (
        admin_id, impersonation_id, action_category, action_type, action_description,
        resource_type, resource_id, old_values, new_values, risk_level,
        ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAudit.run(
      data.admin_id,
      data.impersonation_id || null,
      data.action_category,
      data.action_type,
      data.action_description,
      data.resource_type || null,
      data.resource_id || null,
      data.old_values ? JSON.stringify(data.old_values) : null,
      data.new_values ? JSON.stringify(data.new_values) : null,
      data.risk_level || 'medium',
      data.ip_address || null,
      data.user_agent || null
    );
  }
}

export default ImpersonationService;