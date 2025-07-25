// Enhanced admin action system with logging and audit trail
import { toast } from 'react-hot-toast';
import { logger, logAdminAction, logSecurityEvent } from './logger';

export interface AdminActionContext {
  userId: string;
  userRole: string;
  sessionId: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export interface AdminActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  actionId: string;
  timestamp: string;
}

export interface AdminAction {
  type: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// Predefined admin actions
export const ADMIN_ACTIONS: Record<string, AdminAction> = {
  // User Management Actions
  USER_CREATE: {
    type: 'user_create',
    description: 'Create new user account',
    riskLevel: 'medium',
    requiresConfirmation: false
  },
  USER_UPDATE: {
    type: 'user_update',
    description: 'Update user information',
    riskLevel: 'low',
    requiresConfirmation: false
  },
  USER_DELETE: {
    type: 'user_delete',
    description: 'Permanently delete user account',
    riskLevel: 'critical',
    requiresConfirmation: true,
    confirmationMessage: 'This action cannot be undone. All user data will be permanently deleted.'
  },
  USER_SUSPEND: {
    type: 'user_suspend',
    description: 'Suspend user account',
    riskLevel: 'high',
    requiresConfirmation: true,
    confirmationMessage: 'The user will be unable to access their account.'
  },
  USER_ACTIVATE: {
    type: 'user_activate',
    description: 'Activate suspended user account',
    riskLevel: 'medium',
    requiresConfirmation: false
  },
  USER_PASSWORD_RESET: {
    type: 'user_password_reset',
    description: 'Reset user password',
    riskLevel: 'high',
    requiresConfirmation: true,
    confirmationMessage: 'The user will be logged out and need to set a new password.'
  },

  // Balance Management Actions
  BALANCE_ADJUST: {
    type: 'balance_adjust',
    description: 'Adjust user account balance',
    riskLevel: 'critical',
    requiresConfirmation: true,
    confirmationMessage: 'This will modify the user\'s account balance. Please verify the amount.'
  },
  BALANCE_FREEZE: {
    type: 'balance_freeze',
    description: 'Freeze user account balance',
    riskLevel: 'high',
    requiresConfirmation: true,
    confirmationMessage: 'The user will be unable to make transactions.'
  },
  BALANCE_UNFREEZE: {
    type: 'balance_unfreeze',
    description: 'Unfreeze user account balance',
    riskLevel: 'medium',
    requiresConfirmation: false
  },

  // Transaction Management Actions
  TRANSACTION_CANCEL: {
    type: 'transaction_cancel',
    description: 'Cancel pending transaction',
    riskLevel: 'high',
    requiresConfirmation: true,
    confirmationMessage: 'This transaction will be permanently cancelled.'
  },
  TRANSACTION_APPROVE: {
    type: 'transaction_approve',
    description: 'Approve pending transaction',
    riskLevel: 'medium',
    requiresConfirmation: false
  },
  TRANSACTION_REVERSE: {
    type: 'transaction_reverse',
    description: 'Reverse completed transaction',
    riskLevel: 'critical',
    requiresConfirmation: true,
    confirmationMessage: 'This will reverse a completed transaction and adjust account balances.'
  },

  // System Actions
  SYSTEM_MAINTENANCE: {
    type: 'system_maintenance',
    description: 'Enable maintenance mode',
    riskLevel: 'critical',
    requiresConfirmation: true,
    confirmationMessage: 'This will prevent all users from accessing the platform.'
  },
  SYSTEM_BACKUP: {
    type: 'system_backup',
    description: 'Create system backup',
    riskLevel: 'low',
    requiresConfirmation: false
  },
  DATA_EXPORT: {
    type: 'data_export',
    description: 'Export user or system data',
    riskLevel: 'medium',
    requiresConfirmation: false
  },

  // Bulk Operations
  BULK_USER_UPDATE: {
    type: 'bulk_user_update',
    description: 'Update multiple users',
    riskLevel: 'high',
    requiresConfirmation: true,
    confirmationMessage: 'This will affect multiple user accounts simultaneously.'
  },
  BULK_USER_DELETE: {
    type: 'bulk_user_delete',
    description: 'Delete multiple users',
    riskLevel: 'critical',
    requiresConfirmation: true,
    confirmationMessage: 'This will permanently delete multiple user accounts. This cannot be undone.'
  }
};

class AdminActionManager {
  private context: AdminActionContext | null = null;

  setContext(context: AdminActionContext) {
    this.context = context;
  }

  getContext(): AdminActionContext | null {
    return this.context;
  }

  async executeAction<T = any>(
    actionType: keyof typeof ADMIN_ACTIONS,
    actionFunction: () => Promise<T>,
    additionalData?: any
  ): Promise<AdminActionResult<T>> {
    const actionId = `${actionType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const action = ADMIN_ACTIONS[actionType];

    if (!this.context) {
      throw new Error('Admin context not set. Please authenticate first.');
    }

    // Log the action attempt
    logAdminAction(`Attempting ${action.description}`, {
      actionType,
      actionId,
      riskLevel: action.riskLevel,
      additionalData
    }, this.context.userId);

    try {
      // Show loading toast for long operations
      const loadingToast = toast.loading(`${action.description}...`);

      // Execute the action
      const result = await actionFunction();

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Log successful action
      logAdminAction(`Successfully completed ${action.description}`, {
        actionType,
        actionId,
        result: typeof result === 'object' ? 'object' : result
      }, this.context.userId);

      // Show success notification
      toast.success(`${action.description} completed successfully`);

      // Log security event for high-risk actions
      if (action.riskLevel === 'high' || action.riskLevel === 'critical') {
        logSecurityEvent(`High-risk admin action: ${action.description}`, {
          actionType,
          actionId,
          riskLevel: action.riskLevel
        }, this.context.userId);
      }

      return {
        success: true,
        data: result,
        actionId,
        timestamp
      };

    } catch (error) {
      // Log failed action
      logger.error(`Failed to execute ${action.description}`, {
        actionType,
        actionId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 'admin-action', this.context.userId);

      // Show error notification
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to ${action.description.toLowerCase()}: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        actionId,
        timestamp
      };
    }
  }

  async confirmAction(actionType: keyof typeof ADMIN_ACTIONS): Promise<boolean> {
    const action = ADMIN_ACTIONS[actionType];
    
    if (!action.requiresConfirmation) {
      return true;
    }

    return new Promise((resolve) => {
      const confirmationMessage = action.confirmationMessage || `Are you sure you want to ${action.description.toLowerCase()}?`;
      
      // Create custom confirmation modal with enhanced styling
      const confirmed = window.confirm(`⚠️ Confirmation Required\n\n${confirmationMessage}\n\nThis action cannot be undone. Are you sure you want to proceed?`);
      
      if (confirmed && this.context) {
        logSecurityEvent(`Admin confirmed high-risk action: ${action.description}`, {
          actionType,
          riskLevel: action.riskLevel
        }, this.context.userId);
      }
      
      resolve(confirmed);
    });
  }

  // Get action history for audit purposes
  getActionHistory(filters?: {
    userId?: string;
    actionType?: string;
    riskLevel?: string;
    limit?: number;
  }) {
    return logger.getLogs({
      category: 'admin',
      userId: filters?.userId,
      limit: filters?.limit
    });
  }

  // Get security events
  getSecurityEvents(filters?: {
    userId?: string;
    limit?: number;
    after?: Date;
  }) {
    return logger.getLogs({
      category: 'security',
      userId: filters?.userId,
      limit: filters?.limit,
      after: filters?.after
    });
  }

  // Risk assessment for actions
  assessRisk(actionType: keyof typeof ADMIN_ACTIONS, targetData?: any): {
    riskScore: number;
    riskFactors: string[];
    recommendation: 'allow' | 'warn' | 'block';
  } {
    const action = ADMIN_ACTIONS[actionType];
    let riskScore = 0;
    const riskFactors: string[] = [];

    // Base risk from action type
    switch (action.riskLevel) {
      case 'low':
        riskScore += 1;
        break;
      case 'medium':
        riskScore += 3;
        break;
      case 'high':
        riskScore += 7;
        break;
      case 'critical':
        riskScore += 10;
        riskFactors.push('Critical system action');
        break;
    }

    // Additional risk factors
    if (targetData?.isAdminUser) {
      riskScore += 5;
      riskFactors.push('Target is admin user');
    }

    if (targetData?.hasHighBalance) {
      riskScore += 3;
      riskFactors.push('Target has high account balance');
    }

    if (targetData?.bulkOperation && targetData.count > 10) {
      riskScore += 4;
      riskFactors.push(`Bulk operation affecting ${targetData.count} users`);
    }

    // Determine recommendation
    let recommendation: 'allow' | 'warn' | 'block' = 'allow';
    if (riskScore >= 8) {
      recommendation = 'block';
    } else if (riskScore >= 5) {
      recommendation = 'warn';
    }

    return {
      riskScore,
      riskFactors,
      recommendation
    };
  }
}

// Global admin action manager instance
export const adminActionManager = new AdminActionManager();

// Convenience functions for common admin actions
export const executeAdminAction = adminActionManager.executeAction.bind(adminActionManager);
export const confirmAdminAction = adminActionManager.confirmAction.bind(adminActionManager);
export const setAdminContext = adminActionManager.setContext.bind(adminActionManager);

export default adminActionManager;