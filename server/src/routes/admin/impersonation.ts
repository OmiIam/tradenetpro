import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../../middleware/auth';
import ImpersonationService from '../../services/ImpersonationService';
import DatabaseManager from '../../models/Database';

const router = Router();
const database = DatabaseManager.getInstance().getDatabase();
const impersonationService = new ImpersonationService(database);

/**
 * Request user impersonation
 */
router.post('/request', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { target_user_id, reason } = req.body;
    const admin_id = (req as any).user.id;

    if (!target_user_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID and reason are required'
      });
    }

    if (target_user_id === admin_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot impersonate yourself'
      });
    }

    const impersonationId = await impersonationService.requestImpersonation({
      admin_id,
      target_user_id: parseInt(target_user_id),
      reason,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Impersonation request created successfully',
      impersonation_id: impersonationId
    });
  } catch (error) {
    console.error('Error requesting impersonation:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to request impersonation'
    });
  }
});

/**
 * Get active impersonation session
 */
router.get('/active', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const admin_id = (req as any).user.id;
    const activeImpersonation = impersonationService.getActiveImpersonation(admin_id);

    if (!activeImpersonation) {
      return res.json({
        success: true,
        data: null,
        message: 'No active impersonation session'
      });
    }

    res.json({
      success: true,
      data: activeImpersonation
    });
  } catch (error) {
    console.error('Error fetching active impersonation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active impersonation'
    });
  }
});

/**
 * End active impersonation session
 */
router.post('/end/:impersonationId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const impersonationId = parseInt(req.params.impersonationId);
    const admin_id = (req as any).user.id;

    if (!impersonationId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid impersonation ID'
      });
    }

    await impersonationService.endImpersonation(impersonationId, admin_id);

    res.json({
      success: true,
      message: 'Impersonation session ended successfully'
    });
  } catch (error) {
    console.error('Error ending impersonation:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to end impersonation'
    });
  }
});

/**
 * Get pending impersonation requests (for approval)
 */
router.get('/pending', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const pendingRequests = impersonationService.getPendingRequests();

    res.json({
      success: true,
      data: pendingRequests
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending impersonation requests'
    });
  }
});

/**
 * Approve impersonation request
 */
router.post('/approve/:impersonationId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const impersonationId = parseInt(req.params.impersonationId);
    const approver_admin_id = (req as any).user.id;

    if (!impersonationId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid impersonation ID'
      });
    }

    await impersonationService.approveImpersonation(impersonationId, approver_admin_id);

    res.json({
      success: true,
      message: 'Impersonation request approved successfully'
    });
  } catch (error) {
    console.error('Error approving impersonation:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to approve impersonation'
    });
  }
});

/**
 * Deny impersonation request
 */
router.post('/deny/:impersonationId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const impersonationId = parseInt(req.params.impersonationId);
    const denier_admin_id = (req as any).user.id;
    const { reason } = req.body;

    if (!impersonationId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid impersonation ID'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Denial reason is required'
      });
    }

    await impersonationService.denyImpersonation(impersonationId, denier_admin_id, reason);

    res.json({
      success: true,
      message: 'Impersonation request denied successfully'
    });
  } catch (error) {
    console.error('Error denying impersonation:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deny impersonation'
    });
  }
});

/**
 * Get impersonation history with filters
 */
router.get('/history', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      admin_id,
      target_user_id,
      start_date,
      end_date,
      is_active,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filters = {
      admin_id: admin_id ? parseInt(admin_id as string) : undefined,
      target_user_id: target_user_id ? parseInt(target_user_id as string) : undefined,
      start_date: start_date as string,
      end_date: end_date as string,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      limit: parseInt(limit as string),
      offset
    };

    const { impersonations, total } = impersonationService.getImpersonationHistory(filters);

    res.json({
      success: true,
      data: impersonations,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching impersonation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch impersonation history'
    });
  }
});

/**
 * Get actions performed during specific impersonation
 */
router.get('/:impersonationId/actions', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const impersonationId = parseInt(req.params.impersonationId);

    if (!impersonationId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid impersonation ID'
      });
    }

    const actions = impersonationService.getImpersonationActions(impersonationId);

    res.json({
      success: true,
      data: actions
    });
  } catch (error) {
    console.error('Error fetching impersonation actions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch impersonation actions'
    });
  }
});

/**
 * Log action performed during impersonation
 */
router.post('/:impersonationId/log-action', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const impersonationId = parseInt(req.params.impersonationId);
    const { action_type, action_description, resource_type, resource_id, old_values, new_values } = req.body;

    if (!impersonationId || !action_type || !action_description) {
      return res.status(400).json({
        success: false,
        message: 'Impersonation ID, action type, and description are required'
      });
    }

    await impersonationService.logImpersonationAction({
      impersonation_id: impersonationId,
      action_type,
      action_description,
      resource_type,
      resource_id,
      old_values,
      new_values,
      ip_address: req.ip
    });

    res.json({
      success: true,
      message: 'Action logged successfully'
    });
  } catch (error) {
    console.error('Error logging impersonation action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log action'
    });
  }
});

/**
 * Get impersonation statistics for dashboard
 */
router.get('/stats', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = impersonationService.getImpersonationStats(days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching impersonation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch impersonation statistics'
    });
  }
});

/**
 * Search users for impersonation (with safety checks)
 */
router.get('/search-users', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query || (query as string).length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchUsers = database.prepare(`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.status,
        u.kyc_status,
        p.total_balance,
        (SELECT COUNT(*) FROM user_flags WHERE target_user_id = u.id AND status = 'open') as open_flags,
        (SELECT COUNT(*) FROM admin_impersonations WHERE target_user_id = u.id AND is_active = TRUE) as active_impersonations
      FROM users u
      LEFT JOIN portfolios p ON u.id = p.user_id
      WHERE u.role != 'admin' 
        AND (
          u.email LIKE ? OR 
          u.first_name LIKE ? OR 
          u.last_name LIKE ? OR
          (u.first_name || ' ' || u.last_name) LIKE ?
        )
      ORDER BY u.created_at DESC
      LIMIT ?
    `);

    const searchTerm = `%${query}%`;
    const users = searchUsers.all(searchTerm, searchTerm, searchTerm, searchTerm, parseInt(limit as string));

    // Add impersonation safety indicators
    const usersWithSafety = (users as any[]).map(user => ({
      ...user,
      can_impersonate: user.active_impersonations === 0,
      requires_approval: user.total_balance > 10000 || user.open_flags > 0 || user.status !== 'active',
      risk_indicators: {
        high_balance: user.total_balance > 10000,
        has_flags: user.open_flags > 0,
        inactive_account: user.status !== 'active',
        pending_kyc: user.kyc_status === 'pending'
      }
    }));

    res.json({
      success: true,
      data: usersWithSafety
    });
  } catch (error) {
    console.error('Error searching users for impersonation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

export default router;