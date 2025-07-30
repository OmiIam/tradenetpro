import Database from 'better-sqlite3';

export interface BroadcastMessage {
  id: number;
  title: string;
  message: string;
  message_type: 'info' | 'warning' | 'success' | 'error' | 'maintenance' | 'promotion' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_audience: 'all' | 'role' | 'specific' | 'criteria';
  target_criteria?: Record<string, any>;
  target_user_ids?: number[];
  target_roles?: string[];
  scheduled_at?: string;
  expires_at?: string;
  is_active: boolean;
  requires_acknowledgment: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  sent_count: number;
  acknowledged_count: number;
}

export interface BroadcastMessageCreate {
  title: string;
  message: string;
  message_type?: 'info' | 'warning' | 'success' | 'error' | 'maintenance' | 'promotion' | 'update';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  target_audience: 'all' | 'role' | 'specific' | 'criteria';
  target_criteria?: Record<string, any>;
  target_user_ids?: number[];
  target_roles?: string[];
  scheduled_at?: string;
  expires_at?: string;
  requires_acknowledgment?: boolean;
  created_by: number;
}

export interface BroadcastMessageUpdate {
  title?: string;
  message?: string;
  message_type?: 'info' | 'warning' | 'success' | 'error' | 'maintenance' | 'promotion' | 'update';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  target_audience?: 'all' | 'role' | 'specific' | 'criteria';
  target_criteria?: Record<string, any>;
  target_user_ids?: number[];
  target_roles?: string[];
  scheduled_at?: string;
  expires_at?: string;
  requires_acknowledgment?: boolean;
}

export interface MessageRecipient {
  id: number;
  broadcast_message_id: number;
  user_id: number;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  acknowledged_at?: string;
  status: 'sent' | 'delivered' | 'read' | 'acknowledged' | 'failed';
}

export class BroadcastMessageService {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  /**
   * Create a new broadcast message
   */
  public async createBroadcastMessage(data: BroadcastMessageCreate): Promise<number> {
    const {
      title,
      message,
      message_type = 'info',
      priority = 'medium',
      target_audience,
      target_criteria,
      target_user_ids,
      target_roles,
      scheduled_at,
      expires_at,
      requires_acknowledgment = false,
      created_by
    } = data;

    // Validate target audience data
    if (target_audience === 'specific' && (!target_user_ids || target_user_ids.length === 0)) {
      throw new Error('Target user IDs are required for specific audience targeting');
    }

    if (target_audience === 'role' && (!target_roles || target_roles.length === 0)) {
      throw new Error('Target roles are required for role-based targeting');
    }

    if (target_audience === 'criteria' && (!target_criteria || Object.keys(target_criteria).length === 0)) {
      throw new Error('Target criteria are required for criteria-based targeting');
    }

    const insertMessage = this.db.prepare(`
      INSERT INTO broadcast_messages (
        title, message, message_type, priority, target_audience,
        target_criteria, target_user_ids, target_roles, scheduled_at,
        expires_at, requires_acknowledgment, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertMessage.run(
      title,
      message,
      message_type,
      priority,
      target_audience,
      target_criteria ? JSON.stringify(target_criteria) : null,
      target_user_ids ? JSON.stringify(target_user_ids) : null,
      target_roles ? JSON.stringify(target_roles) : null,
      scheduled_at || null,
      expires_at || null,
      requires_acknowledgment ? 1 : 0,
      created_by
    );

    const messageId = result.lastInsertRowid as number;

    // Log the creation
    this.logBroadcastAudit({
      admin_id: created_by,
      message_id: messageId,
      action_type: 'broadcast_message_created',
      action_description: `Created broadcast message: ${title}`,
      new_values: { title, message_type, priority, target_audience }
    });

    // If not scheduled, send immediately
    if (!scheduled_at) {
      await this.sendBroadcastMessage(messageId);
    }

    return messageId;
  }

  /**
   * Update an existing broadcast message
   */
  public async updateBroadcastMessage(messageId: number, data: BroadcastMessageUpdate, updatedBy: number): Promise<void> {
    const existingMessage = this.db.prepare('SELECT * FROM broadcast_messages WHERE id = ?').get(messageId) as BroadcastMessage;
    if (!existingMessage) {
      throw new Error('Broadcast message not found');
    }

    if (existingMessage.sent_at) {
      throw new Error('Cannot update a message that has already been sent');
    }

    const updateFields = [];
    const updateValues = [];

    if (data.title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(data.title);
    }

    if (data.message !== undefined) {
      updateFields.push('message = ?');
      updateValues.push(data.message);
    }

    if (data.message_type !== undefined) {
      updateFields.push('message_type = ?');
      updateValues.push(data.message_type);
    }

    if (data.priority !== undefined) {
      updateFields.push('priority = ?');
      updateValues.push(data.priority);
    }

    if (data.target_audience !== undefined) {
      updateFields.push('target_audience = ?');
      updateValues.push(data.target_audience);
    }

    if (data.target_criteria !== undefined) {
      updateFields.push('target_criteria = ?');
      updateValues.push(data.target_criteria ? JSON.stringify(data.target_criteria) : null);
    }

    if (data.target_user_ids !== undefined) {
      updateFields.push('target_user_ids = ?');
      updateValues.push(data.target_user_ids ? JSON.stringify(data.target_user_ids) : null);
    }

    if (data.target_roles !== undefined) {
      updateFields.push('target_roles = ?');
      updateValues.push(data.target_roles ? JSON.stringify(data.target_roles) : null);
    }

    if (data.scheduled_at !== undefined) {
      updateFields.push('scheduled_at = ?');
      updateValues.push(data.scheduled_at || null);
    }

    if (data.expires_at !== undefined) {
      updateFields.push('expires_at = ?');
      updateValues.push(data.expires_at || null);
    }

    if (data.requires_acknowledgment !== undefined) {
      updateFields.push('requires_acknowledgment = ?');
      updateValues.push(data.requires_acknowledgment ? 1 : 0);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(messageId);

    const updateQuery = `
      UPDATE broadcast_messages 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    this.db.prepare(updateQuery).run(...updateValues);

    // Log the update
    this.logBroadcastAudit({
      admin_id: updatedBy,
      message_id: messageId,
      action_type: 'broadcast_message_updated',
      action_description: `Updated broadcast message: ${existingMessage.title}`,
      old_values: {
        title: existingMessage.title,
        message_type: existingMessage.message_type,
        priority: existingMessage.priority
      },
      new_values: data
    });
  }

  /**
   * Send a broadcast message
   */
  public async sendBroadcastMessage(messageId: number): Promise<number> {
    const message = this.db.prepare('SELECT * FROM broadcast_messages WHERE id = ?').get(messageId) as BroadcastMessage;
    if (!message) {
      throw new Error('Broadcast message not found');
    }

    if (message.sent_at) {
      throw new Error('Message has already been sent');
    }

    if (!message.is_active) {
      throw new Error('Cannot send inactive message');
    }

    // Check if message is scheduled for future
    if (message.scheduled_at && new Date(message.scheduled_at) > new Date()) {
      throw new Error('Message is scheduled for future delivery');
    }

    // Get target users based on targeting criteria
    const targetUsers = await this.getTargetUsers(message);

    if (targetUsers.length === 0) {
      throw new Error('No users match the targeting criteria');
    }

    // Insert message recipients
    const insertRecipient = this.db.prepare(`
      INSERT INTO message_recipients (broadcast_message_id, user_id, status)
      VALUES (?, ?, 'sent')
    `);

    let sentCount = 0;
    for (const userId of targetUsers) {
      try {
        insertRecipient.run(messageId, userId);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
      }
    }

    // Update message with sent timestamp and count
    this.db.prepare(`
      UPDATE broadcast_messages 
      SET sent_at = CURRENT_TIMESTAMP, sent_count = ?
      WHERE id = ?
    `).run(sentCount, messageId);

    // Log the sending
    this.logBroadcastAudit({
      admin_id: message.created_by,
      message_id: messageId,
      action_type: 'broadcast_message_sent',
      action_description: `Sent broadcast message to ${sentCount} users: ${message.title}`,
      new_values: { sent_count: sentCount, target_users_count: targetUsers.length }
    });

    return sentCount;
  }

  /**
   * Cancel/delete a broadcast message
   */
  public async cancelBroadcastMessage(messageId: number, cancelledBy: number): Promise<void> {
    const message = this.db.prepare('SELECT * FROM broadcast_messages WHERE id = ?').get(messageId) as BroadcastMessage;
    if (!message) {
      throw new Error('Broadcast message not found');
    }

    if (message.sent_at) {
      throw new Error('Cannot cancel a message that has already been sent');
    }

    // Delete the message and any unsent recipients
    this.db.prepare('DELETE FROM message_recipients WHERE broadcast_message_id = ?').run(messageId);
    this.db.prepare('DELETE FROM broadcast_messages WHERE id = ?').run(messageId);

    // Log the cancellation
    this.logBroadcastAudit({
      admin_id: cancelledBy,
      message_id: messageId,
      action_type: 'broadcast_message_cancelled',
      action_description: `Cancelled broadcast message: ${message.title}`,
      old_values: { title: message.title, target_audience: message.target_audience }
    });
  }

  /**
   * Mark message as read by user
   */
  public async markMessageAsRead(messageId: number, userId: number): Promise<void> {
    const recipient = this.db.prepare(`
      SELECT * FROM message_recipients 
      WHERE broadcast_message_id = ? AND user_id = ?
    `).get(messageId, userId);

    if (!recipient) {
      throw new Error('Message recipient not found');
    }

    this.db.prepare(`
      UPDATE message_recipients 
      SET read_at = CURRENT_TIMESTAMP, status = 'read'
      WHERE broadcast_message_id = ? AND user_id = ?
    `).run(messageId, userId);
  }

  /**
   * Acknowledge message by user
   */
  public async acknowledgeMessage(messageId: number, userId: number): Promise<void> {
    const message = this.db.prepare('SELECT * FROM broadcast_messages WHERE id = ?').get(messageId) as BroadcastMessage;
    if (!message) {
      throw new Error('Broadcast message not found');
    }

    if (!message.requires_acknowledgment) {
      throw new Error('This message does not require acknowledgment');
    }

    const recipient = this.db.prepare(`
      SELECT * FROM message_recipients 
      WHERE broadcast_message_id = ? AND user_id = ?
    `).get(messageId, userId);

    if (!recipient) {
      throw new Error('Message recipient not found');
    }

    // Update recipient acknowledgment
    this.db.prepare(`
      UPDATE message_recipients 
      SET acknowledged_at = CURRENT_TIMESTAMP, status = 'acknowledged'
      WHERE broadcast_message_id = ? AND user_id = ?
    `).run(messageId, userId);

    // Update message acknowledged count
    const acknowledgedCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM message_recipients 
      WHERE broadcast_message_id = ? AND acknowledged_at IS NOT NULL
    `).get(messageId) as { count: number };

    this.db.prepare(`
      UPDATE broadcast_messages 
      SET acknowledged_count = ?
      WHERE id = ?
    `).run(acknowledgedCount.count, messageId);
  }

  /**
   * Get all broadcast messages
   */
  public getAllBroadcastMessages(filters: {
    message_type?: string;
    priority?: string;
    is_active?: boolean;
    created_by?: number;
    limit?: number;
    offset?: number;
  } = {}): {
    messages: BroadcastMessage[];
    total: number;
  } {
    const {
      message_type,
      priority,
      is_active,
      created_by,
      limit = 50,
      offset = 0
    } = filters;

    let whereConditions = [];
    let queryParams = [];

    if (message_type) {
      whereConditions.push('bm.message_type = ?');
      queryParams.push(message_type);
    }

    if (priority) {
      whereConditions.push('bm.priority = ?');
      queryParams.push(priority);
    }

    if (typeof is_active === 'boolean') {
      whereConditions.push('bm.is_active = ?');
      queryParams.push(is_active ? 1 : 0);
    }

    if (created_by) {
      whereConditions.push('bm.created_by = ?');
      queryParams.push(created_by);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get messages
    const messagesQuery = this.db.prepare(`
      SELECT 
        bm.*,
        creator.email as created_by_email,
        creator.first_name as created_by_first_name,
        creator.last_name as created_by_last_name
      FROM broadcast_messages bm
      LEFT JOIN users creator ON bm.created_by = creator.id
      ${whereClause}
      ORDER BY bm.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const messages = messagesQuery.all(...queryParams, limit, offset) as any[];

    // Get total count
    const countQuery = this.db.prepare(`
      SELECT COUNT(*) as total
      FROM broadcast_messages bm
      ${whereClause}
    `);

    const { total } = countQuery.get(...queryParams.slice(0, -2)) as { total: number };

    // Parse JSON fields
    const parsedMessages = messages.map(message => ({
      ...message,
      is_active: Boolean(message.is_active),
      requires_acknowledgment: Boolean(message.requires_acknowledgment),
      target_criteria: message.target_criteria ? JSON.parse(message.target_criteria) : null,
      target_user_ids: message.target_user_ids ? JSON.parse(message.target_user_ids) : null,
      target_roles: message.target_roles ? JSON.parse(message.target_roles) : null
    }));

    return { messages: parsedMessages, total };
  }

  /**
   * Get messages for a specific user
   */
  public getUserMessages(userId: number, includeExpired = false): Array<BroadcastMessage & MessageRecipient> {
    let query = `
      SELECT 
        bm.*,
        mr.sent_at as recipient_sent_at,
        mr.delivered_at,
        mr.read_at,
        mr.acknowledged_at,
        mr.status as recipient_status
      FROM broadcast_messages bm
      INNER JOIN message_recipients mr ON bm.id = mr.broadcast_message_id
      WHERE mr.user_id = ? AND bm.is_active = 1
    `;

    const params = [userId];

    if (!includeExpired) {
      query += ' AND (bm.expires_at IS NULL OR bm.expires_at > CURRENT_TIMESTAMP)';
    }

    query += ' ORDER BY bm.priority DESC, bm.created_at DESC';

    const messages = this.db.prepare(query).all(...params) as any[];

    return messages.map(message => ({
      ...message,
      is_active: Boolean(message.is_active),
      requires_acknowledgment: Boolean(message.requires_acknowledgment),
      target_criteria: message.target_criteria ? JSON.parse(message.target_criteria) : null,
      target_user_ids: message.target_user_ids ? JSON.parse(message.target_user_ids) : null,
      target_roles: message.target_roles ? JSON.parse(message.target_roles) : null
    }));
  }

  /**
   * Get broadcast message statistics
   */
  public getBroadcastStats(): {
    total_messages: number;
    active_messages: number;
    scheduled_messages: number;
    sent_messages: number;
    by_type: Record<string, number>;
    by_priority: Record<string, number>;
    total_recipients: number;
    acknowledged_messages: number;
  } {
    const totalMessages = this.db.prepare('SELECT COUNT(*) as count FROM broadcast_messages').get() as { count: number };
    
    const activeMessages = this.db.prepare('SELECT COUNT(*) as count FROM broadcast_messages WHERE is_active = 1').get() as { count: number };
    
    const scheduledMessages = this.db.prepare('SELECT COUNT(*) as count FROM broadcast_messages WHERE scheduled_at > CURRENT_TIMESTAMP').get() as { count: number };
    
    const sentMessages = this.db.prepare('SELECT COUNT(*) as count FROM broadcast_messages WHERE sent_at IS NOT NULL').get() as { count: number };

    const byType = this.db.prepare(`
      SELECT message_type, COUNT(*) as count
      FROM broadcast_messages
      GROUP BY message_type
    `).all() as Array<{ message_type: string; count: number }>;

    const byPriority = this.db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM broadcast_messages
      GROUP BY priority
    `).all() as Array<{ priority: string; count: number }>;

    const totalRecipients = this.db.prepare('SELECT COUNT(*) as count FROM message_recipients').get() as { count: number };
    
    const acknowledgedMessages = this.db.prepare('SELECT COUNT(*) as count FROM broadcast_messages WHERE acknowledged_count > 0').get() as { count: number };

    const typeStats = byType.reduce((acc, item) => {
      acc[item.message_type] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const priorityStats = byPriority.reduce((acc, item) => {
      acc[item.priority] = item.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_messages: totalMessages.count,
      active_messages: activeMessages.count,
      scheduled_messages: scheduledMessages.count,
      sent_messages: sentMessages.count,
      by_type: typeStats,
      by_priority: priorityStats,
      total_recipients: totalRecipients.count,
      acknowledged_messages: acknowledgedMessages.count
    };
  }

  /**
   * Process scheduled messages (to be called by cron job)
   */
  public async processScheduledMessages(): Promise<number> {
    const scheduledMessages = this.db.prepare(`
      SELECT id FROM broadcast_messages 
      WHERE scheduled_at <= CURRENT_TIMESTAMP 
        AND sent_at IS NULL 
        AND is_active = 1
    `).all() as Array<{ id: number }>;

    let processedCount = 0;
    for (const message of scheduledMessages) {
      try {
        await this.sendBroadcastMessage(message.id);
        processedCount++;
      } catch (error) {
        console.error(`Failed to send scheduled message ${message.id}:`, error);
      }
    }

    return processedCount;
  }

  /**
   * Get target users based on message targeting criteria
   */
  private async getTargetUsers(message: BroadcastMessage): Promise<number[]> {
    switch (message.target_audience) {
      case 'all':
        return this.getAllActiveUsers();
      
      case 'role':
        return this.getUsersByRoles(message.target_roles || []);
      
      case 'specific':
        return message.target_user_ids || [];
      
      case 'criteria':
        return this.getUsersByCriteria(message.target_criteria || {});
      
      default:
        throw new Error('Invalid target audience');
    }
  }

  /**
   * Get all active users
   */
  private getAllActiveUsers(): number[] {
    const users = this.db.prepare(`
      SELECT id FROM users WHERE status = 'active'
    `).all() as Array<{ id: number }>;
    
    return users.map(user => user.id);
  }

  /**
   * Get users by roles
   */
  private getUsersByRoles(roles: string[]): number[] {
    if (roles.length === 0) return [];
    
    const placeholders = roles.map(() => '?').join(',');
    const users = this.db.prepare(`
      SELECT id FROM users 
      WHERE role IN (${placeholders}) AND status = 'active'
    `).all(...roles) as Array<{ id: number }>;
    
    return users.map(user => user.id);
  }

  /**
   * Get users by criteria
   */
  private getUsersByCriteria(criteria: Record<string, any>): number[] {
    let query = `
      SELECT DISTINCT u.id
      FROM users u
      LEFT JOIN portfolios p ON u.id = p.user_id
      WHERE u.status = 'active'
    `;
    
    const conditions = [];
    const params = [];

    for (const [key, value] of Object.entries(criteria)) {
      switch (key) {
        case 'kyc_status':
          conditions.push('u.kyc_status = ?');
          params.push(value);
          break;
        case 'account_funded':
          conditions.push('p.total_balance > 0');
          break;
        case 'balance_min':
          conditions.push('p.total_balance >= ?');
          params.push(value);
          break;
        case 'balance_max':
          conditions.push('p.total_balance <= ?');
          params.push(value);
          break;
        case 'created_after':
          conditions.push('u.created_at >= ?');
          params.push(value);
          break;
        case 'created_before':
          conditions.push('u.created_at <= ?');
          params.push(value);
          break;
        case 'last_login_after':
          conditions.push('u.last_login >= ?');
          params.push(value);
          break;
        case 'last_login_before':
          conditions.push('u.last_login <= ?');
          params.push(value);
          break;
      }
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    const users = this.db.prepare(query).all(...params) as Array<{ id: number }>;
    return users.map(user => user.id);
  }

  /**
   * Log broadcast audit entry
   */
  private logBroadcastAudit(data: {
    admin_id: number;
    message_id: number;
    action_type: string;
    action_description: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
  }): void {
    const insertAudit = this.db.prepare(`
      INSERT INTO detailed_audit_logs (
        admin_id, action_category, action_type, action_description,
        resource_type, resource_id, old_values, new_values, risk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAudit.run(
      data.admin_id,
      'communication',
      data.action_type,
      data.action_description,
      'broadcast_message',
      data.message_id,
      data.old_values ? JSON.stringify(data.old_values) : null,
      data.new_values ? JSON.stringify(data.new_values) : null,
      'medium'
    );
  }
}

export default BroadcastMessageService;