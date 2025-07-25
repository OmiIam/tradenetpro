'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  DollarSign, 
  PieChart, 
  Activity, 
  Settings, 
  BarChart3,
  UserCheck,
  Wallet,
  TrendingUp,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Terminal
} from 'lucide-react'

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen)
    } else {
      setIsCollapsed(!isCollapsed)
    }
  }

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'balances', label: 'Balance Manager', icon: Wallet },
    { id: 'portfolios', label: 'Portfolio Manager', icon: PieChart },
    { id: 'transactions', label: 'Transactions', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'logs', label: 'System Logs', icon: Terminal },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <motion.button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg md:hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </motion.button>
      )}

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: isMobile 
            ? (isMobileMenuOpen ? '280px' : '0px')
            : (isCollapsed ? '80px' : '280px'),
          x: isMobile && !isMobileMenuOpen ? '-100%' : '0%'
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          ${isMobile ? 'fixed' : 'relative'} 
          top-0 left-0 h-screen bg-gray-900 border-r border-gray-800 overflow-hidden z-50
          ${isMobile ? 'shadow-2xl' : ''}
        `}
      >
        {/* Desktop Collapse Button */}
        {!isMobile && (
          <motion.button
            onClick={toggleSidebar}
            className="absolute top-6 -right-3 bg-gray-800 text-white p-1 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </motion.button>
        )}

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6">
            <motion.div 
              className="flex items-center space-x-3 mb-8"
              animate={{ 
                justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start' 
              }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="text-xl font-bold text-white whitespace-nowrap">Admin Panel</h2>
                    <p className="text-gray-400 text-sm whitespace-nowrap">TradePro Management</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Navigation */}
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full flex items-center rounded-lg transition-all duration-200 relative group
                    ${isCollapsed && !isMobile ? 'justify-center px-3 py-3' : 'space-x-3 px-4 py-3'}
                    ${activeTab === item.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                  title={isCollapsed && !isMobile ? item.label : undefined}
                >
                  <item.icon className={`${isCollapsed && !isMobile ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  <AnimatePresence>
                    {(!isCollapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && !isMobile && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </motion.button>
              ))}
            </nav>
          </div>

          {/* User Section */}
          <div className="mt-auto p-6 border-t border-gray-800">
            <motion.div 
              className="flex items-center space-x-3 mb-4"
              animate={{ 
                justifyContent: isCollapsed && !isMobile ? 'center' : 'flex-start' 
              }}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-white font-medium whitespace-nowrap">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-gray-400 text-sm whitespace-nowrap truncate max-w-[180px]">
                      {user?.email}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className={`
                w-full flex items-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors group relative
                ${isCollapsed && !isMobile ? 'justify-center px-3 py-2' : 'space-x-2 px-4 py-2'}
              `}
              title={isCollapsed && !isMobile ? 'Logout' : undefined}
            >
              <LogOut className={`${isCollapsed && !isMobile ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && !isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Logout
                </div>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default AdminSidebar