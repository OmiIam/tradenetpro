'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, Ban, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ConfirmationAction {
  id: string;
  title: string;
  message: string;
  variant: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  data?: any;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: ConfirmationAction | null;
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
    confirmVariant: 'danger' as const,
    defaultConfirmText: 'Delete'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30',
    confirmVariant: 'warning' as const,
    defaultConfirmText: 'Proceed'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
    confirmVariant: 'primary' as const,
    defaultConfirmText: 'Confirm'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500/30',
    confirmVariant: 'primary' as const,
    defaultConfirmText: 'Confirm'
  }
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  action,
  loading = false
}: ConfirmationModalProps) {
  if (!action) return null;

  const config = variantConfig[action.variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      await action.onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done in the action itself
      console.error('Confirmation action failed:', error);
    }
  };

  const handleCancel = () => {
    action.onCancel?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="">
      <div className="space-y-6">
        {/* Icon and Header */}
        <div className="flex items-center space-x-4">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center border',
            config.bgColor,
            config.borderColor
          )}>
            <Icon className={cn('w-6 h-6', config.iconColor)} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white">
              {action.title}
            </h3>
          </div>
        </div>

        {/* Message */}
        <div className="text-gray-300 leading-relaxed">
          {action.message}
        </div>

        {/* Additional data display */}
        {action.data && (
          <div className={cn(
            'p-4 rounded-lg border',
            config.bgColor,
            config.borderColor
          )}>
            <div className="space-y-2 text-sm">
              {Object.entries(action.data).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="text-white font-medium">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-4">
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            loading={loading}
            className="flex-1"
          >
            {action.confirmText || config.defaultConfirmText}
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            {action.cancelText || 'Cancel'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Hook for managing confirmation actions
export function useConfirmation() {
  const [currentAction, setCurrentAction] = React.useState<ConfirmationAction | null>(null);
  const [loading, setLoading] = React.useState(false);

  const confirm = React.useCallback((action: Omit<ConfirmationAction, 'id'>) => {
    const actionWithId: ConfirmationAction = {
      ...action,
      id: Date.now().toString(),
      onConfirm: async () => {
        setLoading(true);
        try {
          await action.onConfirm();
        } finally {
          setLoading(false);
        }
      }
    };
    setCurrentAction(actionWithId);
  }, []);

  const close = React.useCallback(() => {
    setCurrentAction(null);
    setLoading(false);
  }, []);

  const ConfirmationComponent = React.useMemo(() => (
    <ConfirmationModal
      isOpen={!!currentAction}
      onClose={close}
      action={currentAction}
      loading={loading}
    />
  ), [currentAction, close, loading]);

  return {
    confirm,
    close,
    ConfirmationModal: ConfirmationComponent,
    isOpen: !!currentAction,
    loading
  };
}

// Pre-built confirmation types
export const confirmationActions = {
  deleteUser: (user: { name: string; email: string }, onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: 'Delete User',
    message: `Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data.`,
    variant: 'danger',
    confirmText: 'Delete User',
    onConfirm,
    data: {
      name: user.name,
      email: user.email
    }
  }),

  suspendUser: (user: { name: string; email: string }, onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: 'Suspend User',
    message: `Are you sure you want to suspend this user? They will be unable to access their account until reactivated.`,
    variant: 'warning',
    confirmText: 'Suspend User',
    onConfirm,
    data: {
      name: user.name,
      email: user.email
    }
  }),

  activateUser: (user: { name: string; email: string }, onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: 'Activate User',
    message: `Are you sure you want to activate this user? They will regain access to their account.`,
    variant: 'success',
    confirmText: 'Activate User',
    onConfirm,
    data: {
      name: user.name,
      email: user.email
    }
  }),

  deleteTransaction: (transaction: { id: string; amount: number; type: string }, onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: 'Delete Transaction',
    message: `Are you sure you want to delete this transaction? This action cannot be undone.`,
    variant: 'danger',
    confirmText: 'Delete Transaction',
    onConfirm,
    data: {
      id: transaction.id,
      amount: `$${transaction.amount.toFixed(2)}`,
      type: transaction.type
    }
  }),

  cancelTransaction: (transaction: { id: string; amount: number; type: string }, onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: 'Cancel Transaction',
    message: `Are you sure you want to cancel this transaction? This action may affect user balances.`,
    variant: 'warning',
    confirmText: 'Cancel Transaction',
    onConfirm,
    data: {
      id: transaction.id,
      amount: `$${transaction.amount.toFixed(2)}`,
      type: transaction.type
    }
  }),

  approveKyc: (document: { id: string; type: string; user: string }, onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: 'Approve KYC Document',
    message: `Are you sure you want to approve this KYC document? This will grant the user full account access.`,
    variant: 'success',
    confirmText: 'Approve Document',
    onConfirm,
    data: {
      documentId: document.id,
      type: document.type,
      user: document.user
    }
  }),

  rejectKyc: (document: { id: string; type: string; user: string }, reason: string, onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: 'Reject KYC Document',
    message: `Are you sure you want to reject this KYC document? The user will need to resubmit their documents.`,
    variant: 'danger',
    confirmText: 'Reject Document',
    onConfirm,
    data: {
      documentId: document.id,
      type: document.type,
      user: document.user,
      reason
    }
  }),

  bulkAction: (action: string, count: number, onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: `Bulk ${action}`,
    message: `Are you sure you want to ${action.toLowerCase()} ${count} items? This action will affect multiple records.`,
    variant: action.includes('delete') ? 'danger' : 'warning',
    confirmText: `${action} ${count} Items`,
    onConfirm,
    data: {
      action,
      count
    }
  }),

  systemMaintenance: (onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: 'Enable Maintenance Mode',
    message: `Are you sure you want to enable maintenance mode? This will temporarily disable user access to the platform.`,
    variant: 'warning',
    confirmText: 'Enable Maintenance',
    onConfirm
  }),

  clearLogs: (count: number, onConfirm: () => void | Promise<void>): Omit<ConfirmationAction, 'id'> => ({
    title: 'Clear System Logs',
    message: `Are you sure you want to clear ${count} log entries? This action cannot be undone.`,
    variant: 'danger',
    confirmText: 'Clear Logs',
    onConfirm,
    data: {
      count
    }
  })
};