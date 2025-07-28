'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldOff, CheckCircle, XCircle, AlertTriangle, DollarSign, Plus, Minus } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useConfirmation, confirmationActions } from '@/components/ui/ConfirmationModal';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: 'active' | 'suspended' | 'inactive';
  created_at: string;
  last_login?: string;
  total_balance?: number;
}

interface UserStatusToggleProps {
  user: User;
  onStatusChange: (userId: number, newStatus: 'active' | 'suspended') => Promise<void>;
  onBalanceAdjustment?: (userId: number) => void;
}

export const UserStatusToggle: React.FC<UserStatusToggleProps> = ({
  user,
  onStatusChange,
  onBalanceAdjustment
}) => {
  const [loading, setLoading] = useState(false);
  const { confirm, ConfirmationModal } = useConfirmation();

  const handleStatusToggle = (action: 'activate' | 'suspend') => {
    const userData = {
      name: `${user.first_name} ${user.last_name}`,
      email: user.email
    };

    const confirmAction = action === 'activate' 
      ? confirmationActions.activateUser(userData, async () => {
          setLoading(true);
          try {
            await onStatusChange(user.id, 'active');
          } catch (error) {
            console.error('Status change failed:', error);
          } finally {
            setLoading(false);
          }
        })
      : confirmationActions.suspendUser(userData, async () => {
          setLoading(true);
          try {
            await onStatusChange(user.id, 'suspended');
          } catch (error) {
            console.error('Status change failed:', error);
          } finally {
            setLoading(false);
          }
        });

    confirm(confirmAction);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'suspended':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'inactive':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'suspended':
        return <XCircle className="w-4 h-4" />;
      case 'inactive':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user.first_name[0]}{user.last_name[0]}
            </span>
          </div>
          
          <div>
            <h3 className="text-white font-semibold">{user.first_name} {user.last_name}</h3>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <div className="flex items-center space-x-3 mt-1">
              <p className="text-gray-500 text-xs">
                Joined {new Date(user.created_at).toLocaleDateString()}
                {user.last_login && ` • Last login ${new Date(user.last_login).toLocaleDateString()}`}
              </p>
              {user.total_balance !== undefined && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3 text-green-400" />
                  <span className="text-green-400 text-xs font-medium">
                    ${user.total_balance.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
            {getStatusIcon(user.status)}
            <span className="capitalize">{user.status}</span>
          </span>

          {/* Balance Adjustment Button */}
          {onBalanceAdjustment && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onBalanceAdjustment(user.id)}
              disabled={loading}
              className="bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30 hover:border-green-500/50"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Adjust Balance
            </Button>
          )}

          {user.status === 'active' ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleStatusToggle('suspend')}
              disabled={loading}
            >
              <ShieldOff className="w-4 h-4 mr-1" />
              Suspend
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusToggle('activate')}
              disabled={loading}
            >
              <Shield className="w-4 h-4 mr-1" />
              Activate
            </Button>
          )}
        </div>
      </div>

      {ConfirmationModal}
    </>
  );
};

export default UserStatusToggle;