import Database from 'better-sqlite3';

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'user_activity';
  category: 'general' | 'user_signup' | 'kyc_submission' | 'transaction' | 'system';
  read: boolean;
  action_url?: string;
  metadata?: string; // JSON data
  target_user_id?: number;
  created_at: string;
  read_at?: string;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'user_activity';
  category?: 'general' | 'user_signup' | 'kyc_submission' | 'transaction' | 'system';
  action_url?: string;
  metadata?: Record<string, any>;
  target_user_id?: number;
}

export interface UpdateNotificationData {
  read?: boolean;
}

export class AdminNotificationsModel {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  // Get all notifications with optional filtering
  getAllNotifications(
    limit: number = 50,
    offset: number = 0,
    filters: {
      read?: boolean;
      type?: string;
      category?: string;
      target_user_id?: number;
    } = {}
  ): AdminNotification[] {
    let query = `
      SELECT 
        an.*,
        u.email as target_user_email,
        u.first_name as target_user_first_name,
        u.last_name as target_user_last_name
      FROM admin_notifications an
      LEFT JOIN users u ON an.target_user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.read !== undefined) {
      query += ' AND an.read = ?';
      params.push(filters.read ? 1 : 0);
    }

    if (filters.type) {
      query += ' AND an.type = ?';
      params.push(filters.type);
    }

    if (filters.category) {
      query += ' AND an.category = ?';
      params.push(filters.category);
    }

    if (filters.target_user_id) {
      query += ' AND an.target_user_id = ?';
      params.push(filters.target_user_id);
    }

    query += ' ORDER BY an.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as any[];

    return results.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      read: Boolean(row.read)
    }));
  }

  // Get notification by ID
  getNotificationById(id: number): AdminNotification | null {
    const stmt = this.db.prepare(`
      SELECT 
        an.*,
        u.email as target_user_email,
        u.first_name as target_user_first_name,
        u.last_name as target_user_last_name
      FROM admin_notifications an
      LEFT JOIN users u ON an.target_user_id = u.id
      WHERE an.id = ?
    `);
    
    const result = stmt.get(id) as any;
    if (!result) return null;

    return {
      ...result,
      metadata: result.metadata ? JSON.parse(result.metadata) : null,
      read: Boolean(result.read)
    };
  }

  // Get unread notification count
  getUnreadCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM admin_notifications WHERE read = 0');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  // Get notifications by category
  getNotificationsByCategory(): Record<string, AdminNotification[]> {
    const notifications = this.getAllNotifications(100, 0); // Get recent 100
    const grouped: Record<string, AdminNotification[]> = {};

    notifications.forEach(notification => {
      if (!grouped[notification.category]) {
        grouped[notification.category] = [];
      }
      grouped[notification.category].push(notification);
    });

    return grouped;
  }

  // Create new notification
  createNotification(data: CreateNotificationData): AdminNotification {
    const stmt = this.db.prepare(`
      INSERT INTO admin_notifications (
        title, message, type, category, action_url, metadata, target_user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.title,
      data.message,
      data.type || 'info',
      data.category || 'general',
      data.action_url || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.target_user_id || null
    );

    return this.getNotificationById(result.lastInsertRowid as number)!;
  }

  // Mark notification as read
  markAsRead(id: number): AdminNotification | null {
    const stmt = this.db.prepare(`
      UPDATE admin_notifications 
      SET read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return null;
    }

    return this.getNotificationById(id);
  }

  // Mark multiple notifications as read
  markMultipleAsRead(ids: number[]): number {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      UPDATE admin_notifications 
      SET read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE id IN (${placeholders})
    `);

    const result = stmt.run(...ids);
    return result.changes;
  }

  // Mark all notifications as read
  markAllAsRead(): number {
    const stmt = this.db.prepare(`
      UPDATE admin_notifications 
      SET read = 1, read_at = CURRENT_TIMESTAMP 
      WHERE read = 0
    `);

    const result = stmt.run();
    return result.changes;
  }

  // Update notification
  updateNotification(id: number, data: UpdateNotificationData): AdminNotification | null {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.read !== undefined) {
      updateFields.push('read = ?');
      values.push(data.read ? 1 : 0);
      
      if (data.read) {
        updateFields.push('read_at = CURRENT_TIMESTAMP');
      }
    }

    if (updateFields.length === 0) {
      return this.getNotificationById(id);
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE admin_notifications 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    
    if (result.changes === 0) {
      return null;
    }

    return this.getNotificationById(id);
  }

  // Delete notification
  deleteNotification(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM admin_notifications WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Delete old notifications (cleanup)
  deleteOldNotifications(daysOld: number = 30): number {
    const stmt = this.db.prepare(`
      DELETE FROM admin_notifications 
      WHERE created_at < datetime('now', '-${daysOld} days')
    `);
    
    const result = stmt.run();
    return result.changes;
  }

  // Get notification statistics
  getNotificationStats(): {
    total: number;
    unread: number;
    by_type: Record<string, number>;
    by_category: Record<string, number>;
    recent_count: number; // last 24 hours
  } {
    // Total count
    const totalResult = this.db.prepare('SELECT COUNT(*) as count FROM admin_notifications').get() as { count: number };
    
    // Unread count
    const unreadResult = this.db.prepare('SELECT COUNT(*) as count FROM admin_notifications WHERE read = 0').get() as { count: number };
    
    // By type
    const byTypeResults = this.db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM admin_notifications 
      GROUP BY type
    `).all() as { type: string; count: number }[];
    
    // By category
    const byCategoryResults = this.db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM admin_notifications 
      GROUP BY category
    `).all() as { category: string; count: number }[];
    
    // Recent count (last 24 hours)
    const recentResult = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM admin_notifications 
      WHERE created_at >= datetime('now', '-1 day')
    `).get() as { count: number };

    const byType = byTypeResults.reduce((acc, item) => {
      acc[item.type] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = byCategoryResults.reduce((acc, item) => {
      acc[item.category] = item.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalResult.count,
      unread: unreadResult.count,
      by_type: byType,
      by_category: byCategory,
      recent_count: recentResult.count
    };
  }

  // Get count with filters
  getNotificationCount(filters: {
    read?: boolean;
    type?: string;
    category?: string;
    target_user_id?: number;
  } = {}): number {
    let query = 'SELECT COUNT(*) as count FROM admin_notifications WHERE 1=1';
    const params: any[] = [];

    if (filters.read !== undefined) {
      query += ' AND read = ?';
      params.push(filters.read ? 1 : 0);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.target_user_id) {
      query += ' AND target_user_id = ?';
      params.push(filters.target_user_id);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  // Helper methods to create common notification types
  createUserSignupNotification(userId: number, userInfo: { name: string; email: string }): AdminNotification {
    return this.createNotification({
      title: 'New User Registration',
      message: `${userInfo.name} (${userInfo.email}) has registered`,
      type: 'user_activity',
      category: 'user_signup',
      action_url: `/admin/users/${userId}`,
      target_user_id: userId,
      metadata: {
        user_id: userId,
        user_name: userInfo.name,
        user_email: userInfo.email
      }
    });
  }

  createKycSubmissionNotification(userId: number, documentType: string): AdminNotification {
    return this.createNotification({
      title: 'KYC Document Submitted',
      message: `New ${documentType} document submitted for review`,
      type: 'user_activity',
      category: 'kyc_submission',
      action_url: `/admin/kyc/documents`,
      target_user_id: userId,
      metadata: {
        user_id: userId,
        document_type: documentType
      }
    });
  }

  createTransactionNotification(transactionId: number, type: string, amount: number): AdminNotification {
    return this.createNotification({
      title: 'New Transaction',
      message: `${type} transaction of $${amount.toLocaleString()} requires attention`,
      type: 'info',
      category: 'transaction',
      action_url: `/admin/transactions/${transactionId}`,
      metadata: {
        transaction_id: transactionId,
        transaction_type: type,
        amount: amount
      }
    });
  }

  createSystemNotification(title: string, message: string, type: 'info' | 'warning' | 'error' = 'info'): AdminNotification {
    return this.createNotification({
      title,
      message,
      type,
      category: 'system',
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  }
}

export default AdminNotificationsModel;