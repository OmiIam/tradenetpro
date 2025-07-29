'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Statistics from '@/components/landing/Statistics'
import Footer from '@/components/Footer'
import ChatTrigger from '@/components/ChatTrigger'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-trade-navy">
      <Header />
      <Hero />
      <Features />
      <Statistics />
      <Footer />
      
      {/* Live Chat Support for Visitors */}
      <ChatTrigger 
        variant="support" 
        floating={true}
        text="Questions? Chat with us!"
      />
    </div>
  )
}