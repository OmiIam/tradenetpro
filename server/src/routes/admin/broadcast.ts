import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../../middleware/auth';
import BroadcastMessageService from '../../services/BroadcastMessageService';
import DatabaseManager from '../../models/Database';

const router = Router();
const database = DatabaseManager.getInstance().getDatabase();
const broadcastService = new BroadcastMessageService(database);

/**
 * Get all broadcast messages
 */
router.get('/', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      message_type,
      priority,
      is_active,
      created_by,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filters = {
      message_type: message_type as string,
      priority: priority as string,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      created_by: created_by ? parseInt(created_by as string) : undefined,
      limit: parseInt(limit as string),
      offset
    };

    const { messages, total } = broadcastService.getAllBroadcastMessages(filters);

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching broadcast messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch broadcast messages'
    });
  }
});

/**
 * Create new broadcast message
 */
router.post('/', requireAdminAuth, async (req: Request, res: Response) => {
  try {
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
      requires_acknowledgment = false
    } = req.body;

    const admin_id = (req as any).user.id;

    if (!title || !message || !target_audience) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and target audience are required'
      });
    }

    // Validate target audience specific requirements
    if (target_audience === 'specific' && (!target_user_ids || !Array.isArray(target_user_ids) || target_user_ids.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Target user IDs are required for specific audience targeting'
      });
    }

    if (target_audience === 'role' && (!target_roles || !Array.isArray(target_roles) || target_roles.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Target roles are required for role-based targeting'
      });
    }

    if (target_audience === 'criteria' && (!target_criteria || typeof target_criteria !== 'object')) {
      return res.status(400).json({
        success: false,
        message: 'Target criteria are required for criteria-based targeting'
      });
    }

    // Validate scheduled_at if provided
    if (scheduled_at && new Date(scheduled_at) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }

    // Validate expires_at if provided
    if (expires_at && new Date(expires_at) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiration time must be in the future'
      });
    }

    const messageId = await broadcastService.createBroadcastMessage({
      title,
      message,
      message_type,
      priority,
      target_audience,
      target_criteria,
      target_user_ids,
      target_roles,
      scheduled_at,
      expires_at,
      requires_acknowledgment,
      created_by: admin_id
    });

    res.status(201).json({
      success: true,
      message: scheduled_at ? 'Broadcast message scheduled successfully' : 'Broadcast message sent successfully',
      data: { id: messageId }
    });
  } catch (error) {
    console.error('Error creating broadcast message:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create broadcast message'
    });
  }
});

/**
 * Get broadcast message by ID
 */
router.get('/:messageId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    const { messages } = broadcastService.getAllBroadcastMessages({ limit: 1, offset: 0 });
    const message = messages.find(m => m.id === messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Broadcast message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching broadcast message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch broadcast message'
    });
  }
});

/**
 * Update broadcast message
 */
router.put('/:messageId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const admin_id = (req as any).user.id;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    const {
      title,
      message,
      message_type,
      priority,
      target_audience,
      target_criteria,
      target_user_ids,
      target_roles,
      scheduled_at,
      expires_at,
      requires_acknowledgment
    } = req.body;

    // Validate scheduled_at if provided
    if (scheduled_at && new Date(scheduled_at) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }

    // Validate expires_at if provided
    if (expires_at && new Date(expires_at) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Expiration time must be in the future'
      });
    }

    await broadcastService.updateBroadcastMessage(messageId, {
      title,
      message,
      message_type,
      priority,
      target_audience,
      target_criteria,
      target_user_ids,
      target_roles,
      scheduled_at,
      expires_at,
      requires_acknowledgment
    }, admin_id);

    res.json({
      success: true,
      message: 'Broadcast message updated successfully'
    });
  } catch (error) {
    console.error('Error updating broadcast message:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update broadcast message'
    });
  }
});

/**
 * Send broadcast message immediately
 */
router.post('/:messageId/send', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    const sentCount = await broadcastService.sendBroadcastMessage(messageId);

    res.json({
      success: true,
      message: `Broadcast message sent to ${sentCount} users`,
      data: { sent_count: sentCount }
    });
  } catch (error) {
    console.error('Error sending broadcast message:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send broadcast message'
    });
  }
});

/**
 * Cancel/delete broadcast message
 */
router.delete('/:messageId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const admin_id = (req as any).user.id;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    await broadcastService.cancelBroadcastMessage(messageId, admin_id);

    res.json({
      success: true,
      message: 'Broadcast message cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling broadcast message:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel broadcast message'
    });
  }
});

/**
 * Get broadcast statistics
 */
router.get('/stats/overview', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const stats = broadcastService.getBroadcastStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching broadcast stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch broadcast statistics'
    });
  }
});

/**
 * Process scheduled messages (can be called manually or by cron)
 */
router.post('/process-scheduled', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const processedCount = await broadcastService.processScheduledMessages();

    res.json({
      success: true,
      message: `Processed ${processedCount} scheduled messages`,
      data: { processed_count: processedCount }
    });
  } catch (error) {
    console.error('Error processing scheduled messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process scheduled messages'
    });
  }
});

/**
 * Preview target users for a message (without sending)
 */
router.post('/preview-targets', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      target_audience,
      target_criteria,
      target_user_ids,
      target_roles
    } = req.body;

    if (!target_audience) {
      return res.status(400).json({
        success: false,
        message: 'Target audience is required'
      });
    }

    // Create a temporary message object for target calculation
    const tempMessage = {
      target_audience,
      target_criteria,
      target_user_ids,
      target_roles
    } as any;

    // Use private method through service instance (we'll need to make it public or create a wrapper)
    // For now, let's create a simple preview that estimates the target count
    let targetCount = 0;
    let previewUsers = [];

    switch (target_audience) {
      case 'all':
        const allUsers = database.prepare('SELECT id, email, first_name, last_name FROM users WHERE status = "active" LIMIT 10').all();
        const allUsersCount = database.prepare('SELECT COUNT(*) as count FROM users WHERE status = "active"').get() as { count: number };
        targetCount = allUsersCount.count;
        previewUsers = allUsers;
        break;

      case 'role':
        if (!target_roles || target_roles.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Target roles are required for role-based targeting'
          });
        }
        const placeholders = target_roles.map(() => '?').join(',');
        const roleUsers = database.prepare(`
          SELECT id, email, first_name, last_name, role 
          FROM users 
          WHERE role IN (${placeholders}) AND status = 'active' 
          LIMIT 10
        `).all(...target_roles);
        const roleCount = database.prepare(`
          SELECT COUNT(*) as count 
          FROM users 
          WHERE role IN (${placeholders}) AND status = 'active'
        `).get(...target_roles) as { count: number };
        targetCount = roleCount.count;
        previewUsers = roleUsers;
        break;

      case 'specific':
        if (!target_user_ids || target_user_ids.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Target user IDs are required for specific targeting'
          });
        }
        const specificPlaceholders = target_user_ids.map(() => '?').join(',');
        const specificUsers = database.prepare(`
          SELECT id, email, first_name, last_name 
          FROM users 
          WHERE id IN (${specificPlaceholders}) AND status = 'active'
        `).all(...target_user_ids);
        targetCount = specificUsers.length;
        previewUsers = specificUsers;
        break;

      case 'criteria':
        // For criteria, we'll provide a simple estimate
        const criteriaCount = database.prepare('SELECT COUNT(*) as count FROM users WHERE status = "active"').get() as { count: number };
        targetCount = criteriaCount.count;
        previewUsers = database.prepare('SELECT id, email, first_name, last_name FROM users WHERE status = "active" LIMIT 10').all();
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid target audience'
        });
    }

    res.json({
      success: true,
      data: {
        target_audience,
        estimated_recipients: targetCount,
        preview_users: previewUsers,
        total_preview_shown: previewUsers.length
      }
    });
  } catch (error) {
    console.error('Error previewing targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview target users'
    });
  }
});

export default router;