import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../../middleware/auth';
import SessionTrackingService from '../../services/SessionTrackingService';
import DatabaseManager from '../../models/Database';

const router = Router();
const database = DatabaseManager.getInstance().getDatabase();
const sessionService = new SessionTrackingService(database);

/**
 * Get active sessions overview
 */
router.get('/overview', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const stats = sessionService.getSessionStats();
    const analytics = sessionService.getSessionAnalytics(7); // Last 7 days

    res.json({
      success: true,
      data: {
        stats,
        analytics
      }
    });
  } catch (error) {
    console.error('Error fetching session overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session overview'
    });
  }
});

/**
 * Get all active sessions with details
 */
router.get('/active', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const query = database.prepare(`
      SELECT 
        usd.*,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        us.expires_at as session_expires_at,
        CASE 
          WHEN usd.ended_at IS NOT NULL 
          THEN (julianday(usd.ended_at) - julianday(usd.created_at)) * 24 * 60
          ELSE (julianday('now') - julianday(usd.last_activity)) * 24 * 60
        END as duration_minutes
      FROM user_session_details usd
      JOIN users u ON usd.user_id = u.id
      JOIN user_sessions us ON usd.session_id = us.id
      WHERE usd.is_active = TRUE
      ORDER BY usd.last_activity DESC
      LIMIT ? OFFSET ?
    `);

    const countQuery = database.prepare(`
      SELECT COUNT(*) as total
      FROM user_session_details usd
      WHERE usd.is_active = TRUE
    `);

    const sessions = query.all(limit, offset);
    const { total } = countQuery.get() as { total: number };

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions'
    });
  }
});

/**
 * Get session details for a specific user
 */
router.get('/user/:userId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const activeSessions = sessionService.getActiveSessions(userId);
    const loginHistory = sessionService.getLoginHistory(userId, 20);

    res.json({
      success: true,
      data: {
        active_sessions: activeSessions,
        login_history: loginHistory
      }
    });
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user sessions'
    });
  }
});

/**
 * Get suspicious login attempts
 */
router.get('/suspicious', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const suspiciousLogins = sessionService.getSuspiciousLogins(limit);

    res.json({
      success: true,
      data: suspiciousLogins
    });
  } catch (error) {
    console.error('Error fetching suspicious logins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suspicious logins'
    });
  }
});

/**
 * Get session analytics for dashboard charts
 */
router.get('/analytics', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = sessionService.getSessionAnalytics(days);

    // Get daily session counts for chart
    const dailyStats = database.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as sessions,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(CASE WHEN is_mobile = TRUE THEN 1 ELSE 0 END) as mobile_sessions
      FROM user_session_details
      WHERE created_at >= datetime('now', '-${days} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all();

    // Get hourly distribution
    const hourlyStats = database.prepare(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as sessions
      FROM user_session_details
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY hour
      ORDER BY hour
    `).all();

    res.json({
      success: true,
      data: {
        ...analytics,
        daily_stats: dailyStats,
        hourly_distribution: hourlyStats
      }
    });
  } catch (error) {
    console.error('Error fetching session analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session analytics'
    });
  }
});

/**
 * End a specific session (admin action)
 */
router.post('/end/:sessionId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }

    // Get session details for audit log
    const sessionDetails = database.prepare(`
      SELECT usd.*, u.email
      FROM user_session_details usd
      JOIN users u ON usd.user_id = u.id
      WHERE usd.session_id = ?
    `).get(sessionId);

    if (!sessionDetails) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // End the session
    sessionService.endSession(sessionId);

    // Log admin action
    const auditLog = database.prepare(`
      INSERT INTO detailed_audit_logs (
        admin_id, action_category, action_type, action_description,
        resource_type, resource_id, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    auditLog.run(
      (req as any).user.id,
      'security',
      'session_terminated',
      `Admin terminated session for user ${(sessionDetails as any).email}`,
      'session',
      sessionId,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session'
    });
  }
});

/**
 * Cleanup old session data
 */
router.post('/cleanup', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const daysToKeep = parseInt(req.body.days_to_keep) || 90;
    
    if (daysToKeep < 30) {
      return res.status(400).json({
        success: false,
        message: 'Must keep at least 30 days of session data'
      });
    }

    const deletedCount = sessionService.cleanupOldSessions(daysToKeep);

    // Log cleanup action
    const auditLog = database.prepare(`
      INSERT INTO detailed_audit_logs (
        admin_id, action_category, action_type, action_description,
        resource_type, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    auditLog.run(
      (req as any).user.id,
      'system',
      'data_cleanup',
      `Cleaned up ${deletedCount} old session records (kept ${daysToKeep} days)`,
      'session_data',
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old session records`,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup session data'
    });
  }
});

/**
 * Search sessions with filters
 */
router.post('/search', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      user_email,
      ip_address,
      country,
      device_type,
      date_range,
      is_active,
      is_suspicious,
      page = 1,
      limit = 50
    } = req.body;

    let whereConditions = [];
    let queryParams = [];

    // Build dynamic query based on filters
    if (user_email) {
      whereConditions.push('u.email LIKE ?');
      queryParams.push(`%${user_email}%`);
    }

    if (ip_address) {
      whereConditions.push('usd.ip_address = ?');
      queryParams.push(ip_address);
    }

    if (country) {
      whereConditions.push('usd.country = ?');
      queryParams.push(country);
    }

    if (device_type) {
      whereConditions.push('usd.device_type = ?');
      queryParams.push(device_type);
    }

    if (date_range?.start && date_range?.end) {
      whereConditions.push('usd.created_at BETWEEN ? AND ?');
      queryParams.push(date_range.start, date_range.end);
    }

    if (typeof is_active === 'boolean') {
      whereConditions.push('usd.is_active = ?');
      queryParams.push(is_active ? 1 : 0);
    }

    if (is_suspicious) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM user_login_history ulh 
        WHERE ulh.user_id = usd.user_id 
        AND ulh.ip_address = usd.ip_address 
        AND (ulh.is_suspicious = TRUE OR ulh.risk_score > 70)
      )`);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);

    const query = database.prepare(`
      SELECT 
        usd.*,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        us.expires_at as session_expires_at
      FROM user_session_details usd
      JOIN users u ON usd.user_id = u.id
      JOIN user_sessions us ON usd.session_id = us.id
      ${whereClause}
      ORDER BY usd.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const sessions = query.all(...queryParams);

    // Get total count for pagination
    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const countQuery = database.prepare(`
      SELECT COUNT(*) as total
      FROM user_session_details usd
      JOIN users u ON usd.user_id = u.id
      JOIN user_sessions us ON usd.session_id = us.id
      ${whereClause}
    `);

    const { total } = countQuery.get(...countParams) as { total: number };

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters_applied: {
        user_email,
        ip_address,
        country,
        device_type,
        date_range,
        is_active,
        is_suspicious
      }
    });
  } catch (error) {
    console.error('Error searching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search sessions'
    });
  }
});

export default router;