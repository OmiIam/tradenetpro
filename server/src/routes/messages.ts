import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import BroadcastMessageService from '../services/BroadcastMessageService';
import DatabaseManager from '../models/Database';

const router = Router();
const database = DatabaseManager.getInstance().getDatabase();
const broadcastService = new BroadcastMessageService(database);

// Apply authentication to all message routes
router.use(authenticateToken);

/**
 * Get messages for current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { include_expired = 'false' } = req.query;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const messages = broadcastService.getUserMessages(
      user.userId, 
      include_expired === 'true'
    );

    // Separate messages by status for better UX
    const categorizedMessages = {
      unread: messages.filter(m => !m.read_at),
      read: messages.filter(m => m.read_at && !m.acknowledged_at),
      acknowledged: messages.filter(m => m.acknowledged_at),
      all: messages
    };

    res.json({
      success: true,
      data: {
        messages: categorizedMessages.all,
        counts: {
          total: messages.length,
          unread: categorizedMessages.unread.length,
          pending_acknowledgment: messages.filter(m => m.requires_acknowledgment && !m.acknowledged_at).length
        },
        categorized: {
          unread: categorizedMessages.unread,
          read: categorizedMessages.read,
          acknowledged: categorizedMessages.acknowledged
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

/**
 * Get unread message count for current user
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const messages = broadcastService.getUserMessages(user.userId, false);
    const unreadCount = messages.filter(m => !m.read_at).length;
    const pendingAcknowledgment = messages.filter(m => m.requires_acknowledgment && !m.acknowledged_at).length;

    res.json({
      success: true,
      data: {
        unread_count: unreadCount,
        pending_acknowledgment: pendingAcknowledgment,
        total_active: messages.length
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
});

/**
 * Mark message as read
 */
router.post('/:messageId/read', async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const user = (req as any).user;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    await broadcastService.markMessageAsRead(messageId, user.userId);

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to mark message as read'
    });
  }
});

/**
 * Acknowledge message
 */
router.post('/:messageId/acknowledge', async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const user = (req as any).user;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    await broadcastService.acknowledgeMessage(messageId, user.userId);

    res.json({
      success: true,
      message: 'Message acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging message:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to acknowledge message'
    });
  }
});

/**
 * Mark multiple messages as read
 */
router.post('/mark-multiple-read', async (req: Request, res: Response) => {
  try {
    const { message_ids } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    const results = [];
    for (const messageId of message_ids) {
      try {
        await broadcastService.markMessageAsRead(parseInt(messageId), user.userId);
        results.push({ id: messageId, success: true });
      } catch (error) {
        results.push({ 
          id: messageId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to mark as read' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `${successCount} messages marked as read`,
      data: { results }
    });
  } catch (error) {
    console.error('Error marking multiple messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

/**
 * Mark all messages as read for current user
 */
router.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Get all unread messages for the user
    const messages = broadcastService.getUserMessages(user.userId, false);
    const unreadMessages = messages.filter(m => !m.read_at);

    let markedCount = 0;
    for (const message of unreadMessages) {
      try {
        await broadcastService.markMessageAsRead(message.id, user.userId);
        markedCount++;
      } catch (error) {
        console.error(`Failed to mark message ${message.id} as read:`, error);
      }
    }

    res.json({
      success: true,
      message: `${markedCount} messages marked as read`,
      data: { marked_count: markedCount, total_unread: unreadMessages.length }
    });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all messages as read'
    });
  }
});

/**
 * Get messages by type/priority for current user
 */
router.get('/filter', async (req: Request, res: Response) => {
  try {
    const {
      message_type,
      priority,
      requires_acknowledgment,
      status // 'read', 'unread', 'acknowledged'
    } = req.query;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    let messages = broadcastService.getUserMessages(user.userId, false);

    // Apply filters
    if (message_type) {
      messages = messages.filter(m => m.message_type === message_type);
    }

    if (priority) {
      messages = messages.filter(m => m.priority === priority);
    }

    if (requires_acknowledgment === 'true') {
      messages = messages.filter(m => m.requires_acknowledgment);
    } else if (requires_acknowledgment === 'false') {
      messages = messages.filter(m => !m.requires_acknowledgment);
    }

    if (status) {
      switch (status) {
        case 'unread':
          messages = messages.filter(m => !m.read_at);
          break;
        case 'read':
          messages = messages.filter(m => m.read_at && !m.acknowledged_at);
          break;
        case 'acknowledged':
          messages = messages.filter(m => m.acknowledged_at);
          break;
      }
    }

    res.json({
      success: true,
      data: {
        messages,
        count: messages.length,
        filters_applied: {
          message_type,
          priority,
          requires_acknowledgment,
          status
        }
      }
    });
  } catch (error) {
    console.error('Error filtering messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter messages'
    });
  }
});

/**
 * Get message statistics for current user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const messages = broadcastService.getUserMessages(user.userId, true); // Include expired

    const stats = {
      total_received: messages.length,
      unread: messages.filter(m => !m.read_at).length,
      read: messages.filter(m => m.read_at && !m.acknowledged_at).length,
      acknowledged: messages.filter(m => m.acknowledged_at).length,
      pending_acknowledgment: messages.filter(m => m.requires_acknowledgment && !m.acknowledged_at).length,
      by_type: messages.reduce((acc, m) => {
        acc[m.message_type] = (acc[m.message_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_priority: messages.reduce((acc, m) => {
        acc[m.priority] = (acc[m.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message statistics'
    });
  }
});

export default router;