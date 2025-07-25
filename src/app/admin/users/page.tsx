'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Ban, CheckCircle, MoreVertical } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminProvider, useAdmin, AdminUser } from '@/contexts/AdminContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MobileInput, MobileSelect, MobileForm } from '@/components/ui/MobileForm';
import MobileTable from '@/components/ui/MobileTable';
import { Modal } from '@/components/ui/Modal';
import { ResponsiveGrid } from '@/components/layout/ResponsiveContainer';
import { getRoleDisplayName, getRoleColor, Role } from '@/lib/rbac';
import { useMobile } from '@/components/layout/ResponsiveContainer';

interface UserFilters {
  search: string;
  status: string;
  role: string;
}

function UsersPageContent() {
  const { 
    state, 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    suspendUser, 
    activateUser,
    setFilter,
    setSelectedItems,
    clearSelection,
    bulkUserAction,
    hasPermission
  } = useAdmin();
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: '',
    role: ''
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    user?: AdminUser;
    users?: string[];
  } | null>(null);
  
  const isMobile = useMobile();
  const canWrite = hasPermission('users:write');
  const canDelete = hasPermission('users:delete');

  useEffect(() => {
    fetchUsers(1, filters);
  }, [fetchUsers, filters]);

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setFilter('users', newFilters);
  };

  const handleCreateUser = async (userData: Partial<AdminUser>) => {
    try {
      await createUser(userData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async (userData: Partial<AdminUser>) => {
    if (!editingUser) return;
    
    try {
      await updateUser(editingUser.id, userData);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setConfirmAction(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleStatusToggle = async (userId: string, status: 'active' | 'suspended') => {
    try {
      if (status === 'active') {
        await activateUser(userId);
      } else {
        await suspendUser(userId);
      }
      setConfirmAction(null);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    if (!confirmAction?.users) return;
    
    try {
      await bulkUserAction(confirmAction.users, action);
      setConfirmAction(null);
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const renderUserForm = (user?: AdminUser) => (
    <MobileForm
      title={user ? 'Edit User' : 'Create User'}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const userData = {
          first_name: formData.get('firstName') as string,
          last_name: formData.get('lastName') as string,
          email: formData.get('email') as string,
          role: formData.get('role') as Role,
          status: formData.get('status') as 'active' | 'inactive' | 'suspended'
        };
        
        if (user) {
          handleUpdateUser(userData);
        } else {
          handleCreateUser(userData);
        }
      }}
    >
      <ResponsiveGrid cols={{ base: 1, sm: 2 }} gap="md">
        <MobileInput
          name="firstName"
          label="First Name"
          defaultValue={user?.first_name}
          required
        />
        <MobileInput
          name="lastName"
          label="Last Name"
          defaultValue={user?.last_name}
          required
        />
      </ResponsiveGrid>
      
      <MobileInput
        name="email"
        label="Email"
        type="email"
        defaultValue={user?.email}
        required
      />
      
      <ResponsiveGrid cols={{ base: 1, sm: 2 }} gap="md">
        <MobileSelect
          label="Role"
          options={[
            { value: 'viewer', label: getRoleDisplayName('viewer') },
            { value: 'support', label: getRoleDisplayName('support') },
            { value: 'manager', label: getRoleDisplayName('manager') },
            { value: 'admin', label: getRoleDisplayName('admin') },
            { value: 'super_admin', label: getRoleDisplayName('super_admin') }
          ]}
          value={user?.role}
          onChange={(value) => {
            const select = document.querySelector('select[name="role"]') as HTMLSelectElement;
            if (select) select.value = value;
          }}
        />
        
        <MobileSelect
          label="Status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'suspended', label: 'Suspended' }
          ]}
          value={user?.status}
          onChange={(value) => {
            const select = document.querySelector('select[name="status"]') as HTMLSelectElement;
            if (select) select.value = value;
          }}
        />
      </ResponsiveGrid>
      
      <div className="flex items-center space-x-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          {user ? 'Update User' : 'Create User'}
        </Button>
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </MobileForm>
  );

  const userColumns = [
    {
      key: 'name',
      label: 'User',
      primary: true,
      render: (_, user: AdminUser) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user.first_name[0]}
            </span>
          </div>
          <div>
            <p className="font-semibold">{user.first_name} {user.last_name}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      primary: true,
      render: (role: Role) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(role)}`}>
          {getRoleDisplayName(role)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      primary: true,
      render: (status: string) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          status === 'active' ? 'bg-green-900/20 text-green-400 border border-green-500/30' :
          status === 'inactive' ? 'bg-gray-900/20 text-gray-400 border border-gray-500/30' :
          'bg-red-900/20 text-red-400 border border-red-500/30'
        }`}>
          {status}
        </span>
      )
    },
    {
      key: 'created_at',
      label: 'Created',
      secondary: true,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      key: 'last_login',
      label: 'Last Login',
      secondary: true,
      render: (date?: string) => date ? new Date(date).toLocaleDateString() : 'Never'
    }
  ];

  const headerActions = (
    <div className="flex items-center space-x-2">
      {state.selectedItems.users.length > 0 && (
        <div className="flex items-center space-x-2 bg-slate-800 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-300">
            {state.selectedItems.users.length} selected
          </span>
          {canWrite && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setConfirmAction({ action: 'bulk_activate', users: state.selectedItems.users })}
              >
                Activate
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setConfirmAction({ action: 'bulk_suspend', users: state.selectedItems.users })}
              >
                Suspend
              </Button>
            </>
          )}
          {canDelete && (
            <Button 
              size="sm" 
              variant="danger"
              onClick={() => setConfirmAction({ action: 'bulk_delete', users: state.selectedItems.users })}
            >
              Delete
            </Button>
          )}
        </div>
      )}
      
      {canWrite && (
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <ResponsiveGrid cols={{ base: 1, sm: 3 }} gap="md">
            <MobileInput
              label="Search"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            
            <MobileSelect
              label="Status"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' }
              ]}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            />
            
            <MobileSelect
              label="Role"
              options={[
                { value: '', label: 'All Roles' },
                { value: 'viewer', label: 'Viewer' },
                { value: 'support', label: 'Support' },
                { value: 'manager', label: 'Manager' },
                { value: 'admin', label: 'Admin' },
                { value: 'super_admin', label: 'Super Admin' }
              ]}
              value={filters.role}
              onChange={(value) => handleFilterChange('role', value)}
            />
          </ResponsiveGrid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({state.pagination.users.total})</CardTitle>
            {!isMobile && headerActions}
          </div>
          {isMobile && <div className="mt-4">{headerActions}</div>}
        </CardHeader>
        <CardContent className="p-0">
          <MobileTable
            data={state.users}
            columns={userColumns}
            loading={state.loading.users}
            emptyMessage="No users found"
            onRowClick={(user) => {
              if (canWrite) {
                setEditingUser(user);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showCreateModal || !!editingUser}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
        }}
        title={editingUser ? 'Edit User' : 'Create User'}
      >
        {renderUserForm(editingUser || undefined)}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Confirm Action"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            {confirmAction?.action.startsWith('bulk_') 
              ? `Are you sure you want to ${confirmAction.action.replace('bulk_', '')} ${confirmAction.users?.length} users?`
              : `Are you sure you want to ${confirmAction?.action} this user?`
            }
          </p>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="danger"
              onClick={() => {
                if (confirmAction?.action.startsWith('bulk_')) {
                  const action = confirmAction.action.replace('bulk_', '') as 'activate' | 'suspend' | 'delete';
                  handleBulkAction(action);
                } else if (confirmAction?.user) {
                  if (confirmAction.action === 'delete') {
                    handleDeleteUser(confirmAction.user.id);
                  } else {
                    handleStatusToggle(confirmAction.user.id, confirmAction.action as any);
                  }
                }
              }}
              className="flex-1"
            >
              Confirm
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminProvider>
        <AdminLayout title="User Management" subtitle="Manage user accounts, roles, and permissions">
          <UsersPageContent />
        </AdminLayout>
      </AdminProvider>
    </ProtectedRoute>
  );
}