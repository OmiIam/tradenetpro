'use client'

import React, { useEffect } from 'react'
import { Menu, X, TrendingUp, Users, Award, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu when clicking outside or on link
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  const navigationItems = [
    { name: 'Features', href: '/features', icon: <TrendingUp className="w-4 h-4" /> },
    { name: 'Pricing', href: '/pricing', icon: <Users className="w-4 h-4" /> },
    { name: 'About', href: '/about', icon: <Award className="w-4 h-4" /> },
    { name: 'Contact', href: '/contact', icon: <ArrowRight className="w-4 h-4" /> }
  ]

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-trade-navy/95 backdrop-blur-md border-b border-white/20 shadow-lg' 
            : 'bg-white/5 backdrop-blur-sm border-b border-white/10'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18">
            {/* Enhanced Logo */}
            <Link href="/" className="flex items-center space-x-3 group" onClick={closeMenu}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <span className="text-white font-bold text-lg sm:text-xl font-mono">t</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white font-primary group-hover:text-primary-400 transition-colors duration-300">
                trade.im
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link key={item.name} href={item.href} className="group relative">
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white transition-all duration-300">
                    <span>{item.name}</span>
                  </div>
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-500 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link href="/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-white/5"
                >
                  Login
                </motion.button>
              </Link>
              <Link href="/signup">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-sm font-medium bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2.5 rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-300"
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={isMenuOpen ? "open" : "closed"}
                className="w-5 h-5 flex items-center justify-center"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-300" />
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-trade-navy/95 backdrop-blur-xl border-l border-white/20 z-50 lg:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg font-mono">t</span>
                    </div>
                    <span className="text-lg font-bold text-white">trade.im</span>
                  </div>
                  <button
                    onClick={closeMenu}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-300" />
                  </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto p-6">
                  <nav className="space-y-2">
                    {navigationItems.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link 
                          href={item.href} 
                          onClick={closeMenu}
                          className="flex items-center space-x-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300 group"
                        >
                          <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 group-hover:bg-primary-500/30 transition-colors">
                            {item.icon}
                          </div>
                          <span className="text-white font-medium group-hover:text-primary-400 transition-colors">
                            {item.name}
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </nav>

                  {/* Mobile Feature Highlights */}
                  <div className="mt-8 p-4 bg-gradient-to-r from-primary-500/10 to-trade-success/10 rounded-xl border border-primary-500/20">
                    <h4 className="text-white font-semibold mb-2">Start Trading Today</h4>
                    <p className="text-gray-300 text-sm mb-4">Join thousands of professional traders worldwide</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span>2M+ Active Traders</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Auth Buttons */}
                <div className="p-6 border-t border-white/10 space-y-3">
                  <Link href="/login" onClick={closeMenu}>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      className="w-full text-center py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-all duration-300"
                    >
                      Login to Account
                    </motion.button>
                  </Link>
                  <Link href="/signup" onClick={closeMenu}>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      className="w-full text-center py-3 px-4 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium transition-all duration-300 shadow-lg"
                    >
                      Get Started Free
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header