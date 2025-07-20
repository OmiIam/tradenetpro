'use client'

import React from 'react'
import { Brain, Zap, Shield, BarChart3, Smartphone, Globe, ArrowRight, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const Features = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI-Powered Analytics',
      description: 'Advanced algorithms analyze market patterns and provide predictive insights in real-time.',
      gradient: 'from-purple-500 to-blue-500',
      benefits: ['Pattern Recognition', 'Market Prediction', 'Risk Assessment'],
      highlight: 'Most Popular'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast Execution',
      description: 'Sub-millisecond trade execution with institutional-grade infrastructure and smart routing.',
      gradient: 'from-yellow-400 to-orange-500',
      benefits: ['Sub-ms Latency', 'Smart Routing', '99.9% Uptime'],
      highlight: null
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Bank-Level Security',
      description: 'Multi-layer security with cold storage, insurance protection, and regulatory compliance.',
      gradient: 'from-green-500 to-teal-500',
      benefits: ['Cold Storage', '$500K Insurance', 'SOC 2 Certified'],
      highlight: 'Most Secure'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Advanced Charting',
      description: 'Professional charts with 100+ technical indicators and customizable layouts.',
      gradient: 'from-blue-500 to-cyan-500',
      benefits: ['100+ Indicators', 'Custom Layouts', 'Real-time Data'],
      highlight: null
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Mobile Trading',
      description: 'Full-featured mobile app optimized for trading on the go with touch-friendly interface.',
      gradient: 'from-pink-500 to-rose-500',
      benefits: ['Touch Optimized', 'Offline Mode', 'Push Alerts'],
      highlight: null
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Global Markets',
      description: 'Access to stocks, forex, crypto, and commodities from markets worldwide.',
      gradient: 'from-indigo-500 to-purple-500',
      benefits: ['190+ Countries', '50+ Exchanges', '24/7 Trading'],
      highlight: null
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-trade-navy to-trade-midnight">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-2 mb-6">
            <CheckCircle className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-400 font-medium">
              Professional Trading Tools
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-primary-400 to-trade-success bg-clip-text text-transparent">
              Trade Like a Pro
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Professional trading tools and institutional-grade infrastructure combined in one powerful platform designed for serious traders.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
              className="group relative"
            >
              {/* Highlight Badge */}
              {feature.highlight && (
                <div className="absolute -top-3 left-6 z-10">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    {feature.highlight}
                  </div>
                </div>
              )}

              <div className="h-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:bg-white/10 hover:shadow-2xl hover:shadow-primary-500/10">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center space-x-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-gray-400">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Hover Effect Arrow */}
                <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center text-primary-400 text-sm font-medium">
                    <span>Learn More</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 lg:p-12 max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h3>
            <p className="text-gray-300 mb-8 text-lg">
              Join thousands of professional traders who trust our platform for their daily trading activities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/features">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="border-2 border-white/20 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300"
                >
                  View All Features
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Features