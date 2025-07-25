// Role-Based Access Control (RBAC) System
// This module handles permissions and role-based access throughout the admin system

export type Role = 'super_admin' | 'admin' | 'manager' | 'support' | 'viewer';

export type Permission = 
  | 'users:read' | 'users:write' | 'users:delete'
  | 'transactions:read' | 'transactions:write' | 'transactions:delete'
  | 'kyc:read' | 'kyc:approve' | 'kyc:reject'
  | 'logs:read' | 'logs:export'
  | 'analytics:read' | 'analytics:export'
  | 'settings:read' | 'settings:write'
  | 'system:maintenance' | 'system:backup';

// Role definitions with their associated permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    'users:read', 'users:write', 'users:delete',
    'transactions:read', 'transactions:write', 'transactions:delete',
    'kyc:read', 'kyc:approve', 'kyc:reject',
    'logs:read', 'logs:export',
    'analytics:read', 'analytics:export',
    'settings:read', 'settings:write',
    'system:maintenance', 'system:backup'
  ],
  admin: [
    'users:read', 'users:write',
    'transactions:read', 'transactions:write',
    'kyc:read', 'kyc:approve', 'kyc:reject',
    'logs:read',
    'analytics:read', 'analytics:export',
    'settings:read', 'settings:write'
  ],
  manager: [
    'users:read', 'users:write',
    'transactions:read', 'transactions:write',
    'kyc:read', 'kyc:approve',
    'logs:read',
    'analytics:read'
  ],
  support: [
    'users:read',
    'transactions:read',
    'kyc:read',
    'logs:read',
    'analytics:read'
  ],
  viewer: [
    'users:read',
    'transactions:read',
    'analytics:read'
  ]
};

// Check if a role has a specific permission
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

// Get all permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// Check if one role is higher than another (for hierarchy checks)
export function isHigherRole(role1: Role, role2: Role): boolean {
  const hierarchy: Record<Role, number> = {
    viewer: 1,
    support: 2,
    manager: 3,
    admin: 4,
    super_admin: 5
  };
  
  return hierarchy[role1] > hierarchy[role2];
}

// Get role display name
export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    super_admin: 'Super Admin',
    admin: 'Administrator',
    manager: 'Manager',
    support: 'Support Agent',
    viewer: 'Viewer'
  };
  
  return displayNames[role];
}

// Get role color for UI
export function getRoleColor(role: Role): string {
  const colors: Record<Role, string> = {
    super_admin: 'text-purple-400 bg-purple-900/20 border-purple-500/30',
    admin: 'text-red-400 bg-red-900/20 border-red-500/30',
    manager: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
    support: 'text-green-400 bg-green-900/20 border-green-500/30',
    viewer: 'text-gray-400 bg-gray-900/20 border-gray-500/30'
  };
  
  return colors[role];
}

// Permission groups for UI organization
export const PERMISSION_GROUPS = {
  'User Management': ['users:read', 'users:write', 'users:delete'] as Permission[],
  'Transactions': ['transactions:read', 'transactions:write', 'transactions:delete'] as Permission[],
  'KYC Verification': ['kyc:read', 'kyc:approve', 'kyc:reject'] as Permission[],
  'System Logs': ['logs:read', 'logs:export'] as Permission[],
  'Analytics': ['analytics:read', 'analytics:export'] as Permission[],
  'Settings': ['settings:read', 'settings:write'] as Permission[],
  'System Administration': ['system:maintenance', 'system:backup'] as Permission[]
};

// Get permission display name
export function getPermissionDisplayName(permission: Permission): string {
  const displayNames: Record<Permission, string> = {
    'users:read': 'View Users',
    'users:write': 'Edit Users',
    'users:delete': 'Delete Users',
    'transactions:read': 'View Transactions',
    'transactions:write': 'Edit Transactions',
    'transactions:delete': 'Delete Transactions',
    'kyc:read': 'View KYC',
    'kyc:approve': 'Approve KYC',
    'kyc:reject': 'Reject KYC',
    'logs:read': 'View Logs',
    'logs:export': 'Export Logs',
    'analytics:read': 'View Analytics',
    'analytics:export': 'Export Analytics',
    'settings:read': 'View Settings',
    'settings:write': 'Edit Settings',
    'system:maintenance': 'System Maintenance',
    'system:backup': 'System Backup'
  };
  
  return displayNames[permission];
}