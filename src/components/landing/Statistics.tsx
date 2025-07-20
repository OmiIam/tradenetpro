'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, Shield, Globe, TrendingUp, Award, Clock, Star } from 'lucide-react'

const Statistics = () => {
  const stats = [
    { 
      value: '2M+', 
      label: 'Active Traders',
      icon: <Users className="w-6 h-6" />,
      description: 'Professional traders worldwide',
      color: 'text-primary-400'
    },
    { 
      value: '$50B+', 
      label: 'Daily Volume',
      icon: <DollarSign className="w-6 h-6" />,
      description: 'Traded every single day',
      color: 'text-trade-success'
    },
    { 
      value: '99.9%', 
      label: 'Uptime',
      icon: <Shield className="w-6 h-6" />,
      description: 'Guaranteed system reliability',
      color: 'text-blue-400'
    },
    { 
      value: '190+', 
      label: 'Countries',
      icon: <Globe className="w-6 h-6" />,
      description: 'Global market access',
      color: 'text-purple-400'
    }
  ]

  const achievements = [
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Best Trading Platform 2024',
      organization: 'FinTech Awards',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Fastest Growing Platform',
      organization: 'Industry Report',
      gradient: 'from-green-400 to-emerald-500'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: '4.9/5 User Rating',
      organization: 'App Store & Google Play',
      gradient: 'from-blue-400 to-cyan-500'
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

  const itemVariants = {
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-trade-midnight to-trade-navy">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-trade-success/10 border border-trade-success/20 rounded-full px-4 py-2 mb-6">
            <TrendingUp className="w-4 h-4 text-trade-success" />
            <span className="text-sm text-trade-success font-medium">
              Trusted Worldwide
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-trade-success to-blue-400 bg-clip-text text-transparent">
              Millions of Traders
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Join the fastest-growing community of professional traders who trust our platform for their daily trading activities and portfolio management.
          </p>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                y: -5,
                transition: { duration: 0.3 }
              }}
              className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 rounded-2xl p-6 lg:p-8 text-center transition-all duration-300 hover:bg-white/10 hover:shadow-2xl"
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
              <motion.div 
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-lg font-semibold text-gray-300 mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-gray-500">
                {stat.description}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 lg:p-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Industry Recognition
            </h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Our platform has been recognized by leading industry organizations for innovation, security, and user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -5 }}
                className="text-center group"
              >
                <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${achievement.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                  <div className="text-white">
                    {achievement.icon}
                  </div>
                </div>
                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">
                  {achievement.title}
                </h4>
                <p className="text-sm text-gray-400">
                  {achievement.organization}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-12 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>SEC Registered</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>FINRA Member</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>SIPC Insured</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span>24/7 Support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Statistics