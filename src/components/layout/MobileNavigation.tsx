'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  BarChart3, 
  Wallet, 
  Settings, 
  Menu, 
  X,
  ChevronRight,
  Bell,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'trading', label: 'Trading', icon: BarChart3, href: '/trading' },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet, href: '/portfolio' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' }
];

export default function MobileNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-white font-semibold text-lg">TradePro</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </button>

            {/* Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-80 bg-slate-900 border-l border-slate-700/50 shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Menu</h2>
                    <button
                      onClick={toggleMenu}
                      className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* User Info */}
                  {user && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.first_name?.[0] || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-gray-400 text-sm truncate">{user.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex-1 py-4">
                  <nav className="space-y-1 px-4">
                    {navigationItems.map((item, index) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleNavigation(item.href)}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                            isActive
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-gray-300 hover:text-white hover:bg-slate-800'
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {item.badge && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </nav>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-700/50 space-y-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation (Alternative mobile navigation) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'flex flex-col items-center space-y-1 p-2 rounded-lg transition-all',
                  isActive
                    ? 'text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Spacer for fixed navigation */}
      <div className="lg:hidden h-16" /> {/* Top spacer */}
      <div className="lg:hidden h-20" /> {/* Bottom spacer */}
    </>
  );
}