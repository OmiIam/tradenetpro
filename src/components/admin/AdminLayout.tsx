'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Home,
  Bell,
  Search,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/contexts/AdminContext';
import { getRoleDisplayName, getRoleColor } from '@/lib/rbac';
import ResponsiveContainer, { useMobile } from '@/components/layout/ResponsiveContainer';

interface AdminMenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  permission?: string;
  badge?: number;
}

const menuItems: AdminMenuItem[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3, href: '/admin' },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users', permission: 'users:read' },
  { id: 'transactions', label: 'Transactions', icon: CreditCard, href: '/admin/transactions', permission: 'transactions:read' },
  { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck, href: '/admin/kyc', permission: 'kyc:read' },
  { id: 'logs', label: 'System Logs', icon: FileText, href: '/admin/logs', permission: 'logs:read' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/admin/analytics', permission: 'analytics:read' }
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export default function AdminLayout({ 
  children, 
  title, 
  subtitle, 
  headerActions 
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { hasPermission, state: adminState } = useAdmin();
  const isMobile = useMobile();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission as any)
  );

  const getPageTitle = () => {
    if (title) return title;
    
    const currentItem = menuItems.find(item => item.href === pathname);
    return currentItem?.label || 'Admin Panel';
  };

  const renderSidebar = () => (
    <div className={cn(
      'bg-slate-900 border-r border-slate-700 flex flex-col',
      isMobile 
        ? 'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300'
        : 'w-64 relative',
      isMobile && !sidebarOpen && '-translate-x-full'
    )}>
      {/* Logo & Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">TradePro</h1>
            <p className="text-sm text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <div className="space-y-1 px-3">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-slate-800'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      {user && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.first_name?.[0] || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {user.first_name} {user.last_name}
              </p>
              <div className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                getRoleColor(user.role as any)
              )}>
                {getRoleDisplayName(user.role as any)}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-trade-navy">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className={cn(
        'flex flex-col min-h-screen',
        !isMobile && 'ml-64'
      )}>
        {/* Top Header */}
        <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: Mobile menu + breadcrumb */}
              <div className="flex items-center space-x-4">
                {isMobile && (
                  <button
                    onClick={toggleSidebar}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                )}
                
                <div>
                  <h1 className="text-xl font-semibold text-white">{getPageTitle()}</h1>
                  {subtitle && (
                    <p className="text-sm text-gray-400">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Right: Search + actions + notifications */}
              <div className="flex items-center space-x-4">
                {/* Search (desktop only) */}
                {!isMobile && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                  </div>
                )}

                {/* Header Actions */}
                {headerActions}

                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </button>

                {/* Quick actions dropdown */}
                <div className="relative">
                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white transition-colors">
                    <Settings className="w-4 h-4" />
                    {!isMobile && <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <ResponsiveContainer className="py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </ResponsiveContainer>
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-700 py-4">
          <ResponsiveContainer>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div>
                © 2024 TradePro. All rights reserved.
              </div>
              <div className="flex items-center space-x-4">
                <span>System Status: </span>
                <div className="flex items-center space-x-1">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    adminState.stats.systemHealth === 'healthy' ? 'bg-green-500' :
                    adminState.stats.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  )} />
                  <span className="capitalize">{adminState.stats.systemHealth}</span>
                </div>
              </div>
            </div>
          </ResponsiveContainer>
        </footer>
      </div>
    </div>
  );
}