import Database from 'better-sqlite3';

export interface UserSuspension {
  id: number;
  user_id: number;
  type: 'suspension' | 'ban';
  reason: string;
  admin_id: number;
  starts_at: string;
  expires_at?: string;
  is_permanent: boolean;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSuspensionData {
  user_id: number;
  type: 'suspension' | 'ban';
  reason: string;
  expires_at?: string;
  is_permanent?: boolean;
  notes?: string;
}

export interface UpdateSuspensionData {
  reason?: string;
  expires_at?: string;
  is_permanent?: boolean;
  is_active?: boolean;
  notes?: string;
}

export class UserSuspensionModel {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  // Get all suspensions with optional filtering
  getAllSuspensions(
    limit: number = 50, 
    offset: number = 0,
    filters: {
      user_id?: number;
      type?: 'suspension' | 'ban';
      is_active?: boolean;
      admin_id?: number;
    } = {}
  ): UserSuspension[] {
    let query = `
      SELECT 
        us.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name
      FROM user_suspensions us
      JOIN users u ON us.user_id = u.id
      JOIN users admin ON us.admin_id = admin.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (filters.user_id) {
      query += ' AND us.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.type) {
      query += ' AND us.type = ?';
      params.push(filters.type);
    }

    if (filters.is_active !== undefined) {
      query += ' AND us.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.admin_id) {
      query += ' AND us.admin_id = ?';
      params.push(filters.admin_id);
    }

    query += ' ORDER BY us.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as UserSuspension[];
  }

  // Get suspension by ID
  getSuspensionById(id: number): UserSuspension | null {
    const stmt = this.db.prepare(`
      SELECT 
        us.*,
        u.email as user_email,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        admin.first_name as admin_first_name,
        admin.last_name as admin_last_name
      FROM user_suspensions us
      JOIN users u ON us.user_id = u.id
      JOIN users admin ON us.admin_id = admin.id
      WHERE us.id = ?
    `);
    return stmt.get(id) as UserSuspension | null;
  }

  // Get active suspension for a user
  getActiveSuspension(userId: number): UserSuspension | null {
    const stmt = this.db.prepare(`
      SELECT * FROM user_suspensions 
      WHERE user_id = ? AND is_active = 1 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    return stmt.get(userId) as UserSuspension | null;
  }

  // Create new suspension/ban
  createSuspension(data: CreateSuspensionData, adminId: number): UserSuspension {
    const stmt = this.db.prepare(`
      INSERT INTO user_suspensions (
        user_id, type, reason, admin_id, expires_at, 
        is_permanent, notes, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      data.user_id,
      data.type,
      data.reason,
      adminId,
      data.expires_at || null,
      data.is_permanent ? 1 : 0,
      data.notes || null
    );

    // Update user status
    this.updateUserStatus(data.user_id, 'suspended');

    return this.getSuspensionById(result.lastInsertRowid as number)!;
  }

  // Update suspension
  updateSuspension(id: number, data: UpdateSuspensionData): UserSuspension | null {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.reason !== undefined) {
      updateFields.push('reason = ?');
      values.push(data.reason);
    }

    if (data.expires_at !== undefined) {
      updateFields.push('expires_at = ?');
      values.push(data.expires_at);
    }

    if (data.is_permanent !== undefined) {
      updateFields.push('is_permanent = ?');
      values.push(data.is_permanent ? 1 : 0);
      
      // If making permanent, clear expires_at
      if (data.is_permanent) {
        updateFields.push('expires_at = NULL');
      }
    }

    if (data.is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }

    if (data.notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(data.notes);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    if (updateFields.length === 1) {
      // Only updated_at was added, nothing to update
      return this.getSuspensionById(id);
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE user_suspensions 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    
    if (result.changes === 0) {
      return null;
    }

    // If deactivating suspension, potentially update user status
    if (data.is_active === false) {
      const suspension = this.getSuspensionById(id);
      if (suspension) {
        this.checkAndUpdateUserStatus(suspension.user_id);
      }
    }

    return this.getSuspensionById(id);
  }

  // Lift/remove suspension
  liftSuspension(id: number): boolean {
    const suspension = this.getSuspensionById(id);
    if (!suspension) return false;

    const stmt = this.db.prepare(`
      UPDATE user_suspensions 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const result = stmt.run(id);
    
    if (result.changes > 0) {
      this.checkAndUpdateUserStatus(suspension.user_id);
      return true;
    }
    
    return false;
  }

  // Check for expired suspensions and update them
  processExpiredSuspensions(): number {
    const stmt = this.db.prepare(`
      UPDATE user_suspensions 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE is_active = 1 
      AND expires_at IS NOT NULL 
      AND expires_at <= datetime('now')
    `);

    const result = stmt.run();
    
    // Get affected user IDs to update their status
    if (result.changes > 0) {
      const affectedUsers = this.db.prepare(`
        SELECT DISTINCT user_id FROM user_suspensions 
        WHERE is_active = 0 
        AND expires_at IS NOT NULL 
        AND expires_at <= datetime('now')
        AND updated_at >= datetime('now', '-1 minute')
      `).all() as { user_id: number }[];

      // Update user statuses
      affectedUsers.forEach(({ user_id }) => {
        this.checkAndUpdateUserStatus(user_id);
      });
    }

    return result.changes;
  }

  // Get suspension statistics
  getSuspensionStats(): {
    total: number;
    active: number;
    expired: number;
    bans: number;
    suspensions: number;
    permanent: number;
  } {
    const totalResult = this.db.prepare('SELECT COUNT(*) as count FROM user_suspensions').get() as { count: number };
    const activeResult = this.db.prepare('SELECT COUNT(*) as count FROM user_suspensions WHERE is_active = 1').get() as { count: number };
    const expiredResult = this.db.prepare(`
      SELECT COUNT(*) as count FROM user_suspensions 
      WHERE is_active = 0 AND expires_at IS NOT NULL AND expires_at <= datetime('now')
    `).get() as { count: number };
    const bansResult = this.db.prepare('SELECT COUNT(*) as count FROM user_suspensions WHERE type = "ban"').get() as { count: number };
    const suspensionsResult = this.db.prepare('SELECT COUNT(*) as count FROM user_suspensions WHERE type = "suspension"').get() as { count: number };
    const permanentResult = this.db.prepare('SELECT COUNT(*) as count FROM user_suspensions WHERE is_permanent = 1').get() as { count: number };

    return {
      total: totalResult.count,
      active: activeResult.count,
      expired: expiredResult.count,
      bans: bansResult.count,
      suspensions: suspensionsResult.count,
      permanent: permanentResult.count
    };
  }

  // Get count of suspensions with filters
  getSuspensionCount(filters: {
    user_id?: number;
    type?: 'suspension' | 'ban';
    is_active?: boolean;
    admin_id?: number;
  } = {}): number {
    let query = 'SELECT COUNT(*) as count FROM user_suspensions WHERE 1=1';
    const params: any[] = [];

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    if (filters.admin_id) {
      query += ' AND admin_id = ?';
      params.push(filters.admin_id);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  // Helper method to update user status
  private updateUserStatus(userId: number, status: string): void {
    const stmt = this.db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(status, userId);
  }

  // Helper method to check and update user status based on active suspensions
  private checkAndUpdateUserStatus(userId: number): void {
    const activeSuspension = this.getActiveSuspension(userId);
    
    if (!activeSuspension) {
      // No active suspension, set user to active
      this.updateUserStatus(userId, 'active');
    } else {
      // Has active suspension, keep suspended
      this.updateUserStatus(userId, 'suspended');
    }
  }

  // Delete suspension (hard delete - use with caution)
  deleteSuspension(id: number): boolean {
    const suspension = this.getSuspensionById(id);
    if (!suspension) return false;

    const stmt = this.db.prepare('DELETE FROM user_suspensions WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes > 0) {
      this.checkAndUpdateUserStatus(suspension.user_id);
      return true;
    }
    
    return false;
  }
}

export default UserSuspensionModel;