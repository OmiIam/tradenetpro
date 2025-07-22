'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'

export interface UserPortfolio {
  totalBalance: number
  portfolioValue: number
  totalTrades: number
  winRate: number
  todayPnL: number
  totalReturn: number
}

export interface Position {
  id: number
  symbol: string
  quantity: number
  average_price: number
  current_price: number
  position_type: 'long' | 'short'
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  user_id: number
  type: 'deposit' | 'withdrawal' | 'trade' | 'adjustment'
  amount: number
  description: string
  created_at: string
  admin_id?: number
}

export interface DashboardData {
  portfolio: UserPortfolio
  positions: Position[]
  recentTransactions: Transaction[]
}

export interface MarketData {
  stocks: Array<{
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
  }>
  crypto: Array<{
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
  }>
}

export function useUserDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    // Don't fetch user dashboard data if we're on an admin page
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await api.get('/api/user/dashboard')
      setDashboardData(response.data as DashboardData)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      setError(err.response?.data?.error || 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData
  }
}

export function useMarketData() {
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMarketData = async () => {
    // Don't fetch market data if we're on an admin page
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await api.get('/api/user/market-data')
      setMarketData(response.data as MarketData)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching market data:', err)
      setError(err.response?.data?.error || 'Failed to fetch market data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()
    
    // Refresh market data every 30 seconds
    const interval = setInterval(fetchMarketData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    marketData,
    loading,
    error,
    refetch: fetchMarketData
  }
}

export function useUserProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/user/profile')
      setProfile((response.data as any).user)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err.response?.data?.error || 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (profileData: any) => {
    try {
      const response = await api.put('/api/user/profile', profileData)
      setProfile((response.data as any).user)
      return response.data
    } catch (err: any) {
      console.error('Error updating profile:', err)
      throw new Error(err.response?.data?.error || 'Failed to update profile')
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile
  }
}