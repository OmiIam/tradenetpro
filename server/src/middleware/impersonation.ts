import { Request, Response, NextFunction } from 'express';
import ImpersonationService from '../services/ImpersonationService';
import DatabaseManager from '../models/Database';

// Extend Express Request interface to include impersonation data
declare global {
  namespace Express {
    interface Request {
      impersonation?: {
        isImpersonating: boolean;
        impersonationId: number;
        adminId: number;
        targetUserId: number;
        startTime: string;
      };
    }
  }
}

const database = DatabaseManager.getInstance().getDatabase();
const impersonationService = new ImpersonationService(database);

/**
 * Middleware to detect and handle admin impersonation
 * This should be used after authentication middleware
 */
export const detectImpersonation = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Only check for impersonation if user is authenticated
    if (!req.user) {
      return next();
    }

    // Only admins can impersonate
    if (req.user.role !== 'admin') {
      return next();
    }

    // Check for active impersonation session
    const activeImpersonation = impersonationService.getActiveImpersonation(req.user.userId);

    if (activeImpersonation) {
      // Set impersonation context
      req.impersonation = {
        isImpersonating: true,
        impersonationId: activeImpersonation.id,
        adminId: activeImpersonation.admin_id,
        targetUserId: activeImpersonation.target_user_id,
        startTime: activeImpersonation.start_time
      };

      // Log the impersonated request
      impersonationService.logImpersonationAction({
        impersonation_id: activeImpersonation.id,
        action_type: 'api_request',
        action_description: `API request: ${req.method} ${req.path}`,
        resource_type: 'api_endpoint',
        ip_address: req.ip
      });

      // Override user context to the impersonated user (but keep admin privileges)
      // This allows the admin to see data as the user would see it
      const targetUser = database.prepare(`
        SELECT id, email, first_name, last_name, role, status, created_at
        FROM users WHERE id = ?
      `).get(activeImpersonation.target_user_id);

      if (targetUser) {
        // Store original admin user
        (req as any).originalUser = req.user;
        
        // Set context to target user but maintain admin role for permissions
        req.user = {
          ...req.user,
          userId: (targetUser as any).id,
          email: (targetUser as any).email,
          // Keep admin role for permission checks
          role: 'admin',
          // Add metadata about impersonation
          _impersonated: true,
          _originalAdminId: activeImpersonation.admin_id
        };
      }
    }

    next();
  } catch (error) {
    console.error('Error in impersonation middleware:', error);
    // Don't fail the request if impersonation detection fails
    next();
  }
};

/**
 * Middleware to require that the request is NOT during impersonation
 * Use this for sensitive operations that should not be allowed during impersonation
 */
export const requireNoImpersonation = (req: Request, res: Response, next: NextFunction): void => {
  if (req.impersonation?.isImpersonating) {
    res.status(403).json({
      success: false,
      message: 'This action is not allowed during user impersonation',
      impersonation_active: true
    });
    return;
  }
  next();
};

/**
 * Middleware to log impersonation actions automatically
 * Use this for endpoints that perform significant actions during impersonation
 */
export const logImpersonationAction = (actionType: string, getDescription?: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original response.json to intercept successful responses
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Only log if this is during impersonation and the response was successful
      if (req.impersonation?.isImpersonating && res.statusCode < 400) {
        const description = getDescription ? 
          getDescription(req) : 
          `${actionType}: ${req.method} ${req.path}`;

        try {
          impersonationService.logImpersonationAction({
            impersonation_id: req.impersonation.impersonationId,
            action_type: actionType,
            action_description: description,
            resource_type: 'user_action',
            new_values: body,
            ip_address: req.ip
          });
        } catch (error) {
          console.error('Error logging impersonation action:', error);
        }
      }

      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Middleware to add impersonation headers to responses
 * This helps the frontend know when responses are from impersonation
 */
export const addImpersonationHeaders = (req: Request, res: Response, next: NextFunction): void => {
  if (req.impersonation?.isImpersonating) {
    res.setHeader('X-Impersonation-Active', 'true');
    res.setHeader('X-Impersonation-Admin-Id', req.impersonation.adminId.toString());
    res.setHeader('X-Impersonation-Target-User-Id', req.impersonation.targetUserId.toString());
    res.setHeader('X-Impersonation-Session-Id', req.impersonation.impersonationId.toString());
  }
  next();
};

/**
 * Utility function to check if current request is during impersonation
 */
export const isImpersonating = (req: Request): boolean => {
  return req.impersonation?.isImpersonating || false;
};

/**
 * Utility function to get impersonation context
 */
export const getImpersonationContext = (req: Request) => {
  return req.impersonation || null;
};

export default {
  detectImpersonation,
  requireNoImpersonation,
  logImpersonationAction,
  addImpersonationHeaders,
  isImpersonating,
  getImpersonationContext
};