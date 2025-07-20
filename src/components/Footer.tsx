'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Mail, 
  Phone, 
  MapPin,
  Shield,
  Award,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Instagram,
  Youtube,
  Star,
  Clock,
  CheckCircle
} from 'lucide-react'

const Footer = () => {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({})

  const footerSections = [
    {
      title: 'Platform',
      icon: <TrendingUp className="w-4 h-4" />,
      links: [
        { name: 'Features', href: '/features', description: 'Advanced trading tools' },
        { name: 'Pricing', href: '/pricing', description: 'Transparent pricing plans' },
        { name: 'Security', href: '/security', description: 'Bank-level security' },
        { name: 'API Documentation', href: '/api', description: 'Developer resources' },
        { name: 'System Status', href: '/status', description: 'Real-time status' }
      ]
    },
    {
      title: 'Markets',
      icon: <TrendingUp className="w-4 h-4" />,
      links: [
        { name: 'Stocks', href: '/markets/stocks', description: 'Global stock markets' },
        { name: 'Cryptocurrency', href: '/markets/crypto', description: 'Digital assets' },
        { name: 'Forex', href: '/markets/forex', description: 'Currency trading' },
        { name: 'Commodities', href: '/markets/commodities', description: 'Precious metals & oil' },
        { name: 'Options', href: '/markets/options', description: 'Options trading' }
      ]
    },
    {
      title: 'Resources',
      icon: <Award className="w-4 h-4" />,
      links: [
        { name: 'Trading Academy', href: '/academy', description: 'Learn to trade' },
        { name: 'Market Analysis', href: '/analysis', description: 'Expert insights' },
        { name: 'Help Center', href: '/help', description: '24/7 support' },
        { name: 'Community', href: '/community', description: 'Join traders' },
        { name: 'Blog', href: '/blog', description: 'Latest news' }
      ]
    },
    {
      title: 'Company',
      icon: <Shield className="w-4 h-4" />,
      links: [
        { name: 'About Us', href: '/about', description: 'Our story' },
        { name: 'Careers', href: '/careers', description: 'Join our team' },
        { name: 'Press', href: '/press', description: 'Media resources' },
        { name: 'Contact', href: '/contact', description: 'Get in touch' },
        { name: 'Investors', href: '/investors', description: 'Investor relations' }
      ]
    }
  ]

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter, followers: '125K' },
    { name: 'LinkedIn', href: '#', icon: Linkedin, followers: '85K' },
    { name: 'Instagram', href: '#', icon: Instagram, followers: '95K' },
    { name: 'YouTube', href: '#', icon: Youtube, followers: '65K' },
    { name: 'GitHub', href: '#', icon: Github, followers: '45K' }
  ]

  const trustBadges = [
    { icon: Shield, text: 'SEC Registered', subtext: 'Regulatory compliance' },
    { icon: Award, text: 'FINRA Member', subtext: 'Financial authority' },
    { icon: Shield, text: 'SIPC Insured', subtext: 'Up to $500K protected' },
    { icon: CheckCircle, text: 'SOC 2 Certified', subtext: 'Security standards' }
  ]

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  return (
    <footer className="bg-gradient-to-b from-trade-midnight to-trade-navy border-t border-white/10">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Enhanced Brand Section */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Logo & Tagline */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl font-mono">t</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white font-primary">trade.im</span>
                    <div className="text-sm text-gray-400">Professional Trading Platform</div>
                  </div>
                </div>

                <p className="text-gray-300 leading-relaxed max-w-md">
                  Advanced AI-powered trading platform trusted by over 2 million professional traders worldwide. 
                  Trade with confidence using institutional-grade technology.
                </p>
              </div>

              {/* Enhanced Newsletter */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-lg font-semibold text-white">Get Market Insights</h4>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Weekly analysis, trading tips, and market updates delivered to your inbox.
                </p>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                  />
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all duration-300 shadow-lg flex items-center space-x-2"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Trust Badges Grid */}
              <div className="grid grid-cols-2 gap-4">
                {trustBadges.map((badge, index) => (
                  <motion.div 
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-start space-x-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300"
                  >
                    <badge.icon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">{badge.text}</div>
                      <div className="text-xs text-gray-400">{badge.subtext}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Enhanced Social Links */}
              <div>
                <h5 className="text-sm font-semibold text-white mb-4">Follow Us</h5>
                <div className="flex space-x-3">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      className="group relative"
                    >
                      <div className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300">
                        <social.icon className="w-5 h-5" />
                      </div>
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {social.followers} followers
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile-Optimized Links Sections */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {footerSections.map((section, sectionIndex) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: sectionIndex * 0.1 }}
                  className="space-y-4"
                >
                  {/* Mobile Collapsible Header */}
                  <button
                    onClick={() => toggleSection(sectionIndex)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg md:bg-transparent md:border-none md:p-0 md:cursor-default hover:bg-white/10 md:hover:bg-transparent transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-primary-400">{section.icon}</div>
                      <h4 className="text-lg font-semibold text-white">{section.title}</h4>
                    </div>
                    <div className="md:hidden">
                      {expandedSections[sectionIndex] ? 
                        <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </button>

                  {/* Links List */}
                  <AnimatePresence>
                    <motion.div
                      className={`space-y-3 ${expandedSections[sectionIndex] ? 'block' : 'hidden'} md:block`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {section.links.map((link, linkIndex) => (
                        <motion.div
                          key={link.name}
                          whileHover={{ x: 4 }}
                          className="group"
                        >
                          <Link
                            href={link.href}
                            className="block p-2 -m-2 hover:bg-white/5 rounded-lg transition-all duration-300"
                          >
                            <div className="text-gray-300 group-hover:text-white transition-colors font-medium">
                              {link.name}
                            </div>
                            <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                              {link.description}
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 pt-8 border-t border-white/10"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Mail, title: 'Email Support', detail: 'support@trade.im', subtext: '24/7 Response' },
              { icon: Phone, title: 'Phone Support', detail: '+1 (555) 123-4567', subtext: 'Business Hours' },
              { icon: MapPin, title: 'Headquarters', detail: 'New York, NY 10001', subtext: 'United States' },
              { icon: Clock, title: 'Trading Hours', detail: '24/7 Market Access', subtext: 'Global Markets' }
            ].map((contact, index) => (
              <motion.div
                key={contact.title}
                whileHover={{ scale: 1.02, y: -2 }}
                className="flex items-start space-x-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <contact.icon className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{contact.title}</div>
                  <div className="text-sm text-gray-300">{contact.detail}</div>
                  <div className="text-xs text-gray-500">{contact.subtext}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Enhanced Bottom Footer */}
      <div className="bg-trade-navy/50 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-sm text-gray-400">
              <span>© 2024 trade.im. All rights reserved.</span>
              {[
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Cookie Policy', href: '/cookies' },
                { name: 'Risk Disclosure', href: '/risk' }
              ].map((link) => (
                <Link key={link.name} href={link.href} className="hover:text-white transition-colors">
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span>Markets Open</span>
              </div>
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer