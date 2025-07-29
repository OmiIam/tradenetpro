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

    // Check if user is authenticated before making API call
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setError('Authentication required. Please login to access your dashboard.')
        setLoading(false)
        return
      }
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('Making API call to:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/dashboard`)
      console.log('Access token:', localStorage.getItem('accessToken') ? 'Present' : 'Missing')
      
      const response = await api.get('/api/user/dashboard')
      
      console.log('Raw API Response:', response)
      
      if (!response) {
        throw new Error('API returned no response')
      }
      
      // Handle both flat and nested response structures
      // The API client wraps responses, so the actual data might be in response.data or response directly
      const responseData = (response.data || response) as any
      
      console.log('Response data:', responseData)
      
      if (!responseData) {
        throw new Error('No data received from API')
      }
      
      let dashboardData: DashboardData
      if (responseData.portfolio) {
        // Expected nested structure: { portfolio: {...}, positions: [...], recentTransactions: [...] }
        dashboardData = responseData as DashboardData
      } else {
        // Flat structure: { totalBalance: 5000, portfolioValue: 0, ... }
        dashboardData = {
          portfolio: {
            totalBalance: responseData.totalBalance || 0,
            portfolioValue: responseData.portfolioValue || 0,
            totalTrades: responseData.totalTrades || 0,
            winRate: responseData.winRate || 0,
            todayPnL: responseData.todayPnL || 0,
            totalReturn: responseData.totalReturn || 0
          },
          positions: responseData.positions || [],
          recentTransactions: responseData.recentTransactions || []
        }
      }
      
      console.log('Processed Dashboard Data:', dashboardData)
      setDashboardData(dashboardData)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err)
      
      let errorMessage = 'Failed to fetch dashboard data'
      
      if (err.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      
      // Check for specific error types
      if (errorMessage.includes('Authentication') || errorMessage.includes('401') || errorMessage.includes('403')) {
        errorMessage = 'Authentication required. Please login to access your dashboard.'
        // Clear potentially invalid tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      } else if (errorMessage.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.'
      }
      
      console.error('Final error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Refresh dashboard data every 10 seconds to catch balance updates
    const interval = setInterval(fetchDashboardData, 10000)
    
    return () => clearInterval(interval)
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
      console.log('Fetching market data from /api/market/all')
      const response = await api.get('/api/market/all')
      
      console.log('Market data response:', response)
      
      // Transform the response to match our expected format
      const responseData = response.data || response
      
      if (responseData && (responseData as any).data) {
        const transformedData: MarketData = {
          stocks: (responseData as any).data.stocks?.map((stock: any) => ({
            symbol: stock.symbol,
            name: stock.name,
            price: stock.current_price,
            change: stock.price_change_24h,
            changePercent: stock.price_change_percentage_24h
          })) || [],
          crypto: (responseData as any).data.crypto?.map((crypto: any) => ({
            symbol: crypto.symbol,
            name: crypto.name,
            price: crypto.current_price,
            change: crypto.price_change_24h,
            changePercent: crypto.price_change_percentage_24h
          })) || []
        }
        
        console.log('Transformed market data:', transformedData)
        setMarketData(transformedData)
      } else {
        // Fallback to mock data if API doesn't work
        setMarketData({
          stocks: [
            { symbol: 'AAPL', name: 'Apple Inc.', price: 190.45, change: 4.25, changePercent: 2.28 },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 145.78, change: -2.15, changePercent: -1.45 },
            { symbol: 'MSFT', name: 'Microsoft Corporation', price: 382.15, change: 3.45, changePercent: 0.91 },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 156.32, change: -1.23, changePercent: -0.78 },
            { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.90, change: 12.45, changePercent: 5.26 }
          ],
          crypto: [
            { symbol: 'BTC', name: 'Bitcoin', price: 45230.5, change: 1100.23, changePercent: 2.45 },
            { symbol: 'ETH', name: 'Ethereum', price: 2847.3, change: -34.12, changePercent: -1.2 },
            { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.001, changePercent: 0.01 },
            { symbol: 'BNB', name: 'Binance Coin', price: 315.67, change: 8.45, changePercent: 2.75 },
            { symbol: 'ADA', name: 'Cardano', price: 0.48, change: 0.02, changePercent: 4.17 }
          ]
        })
      }
      
      setError(null)
    } catch (err: any) {
      console.error('Error fetching market data:', err)
      // Use fallback data on error
      setMarketData({
        stocks: [
          { symbol: 'AAPL', name: 'Apple Inc.', price: 190.45, change: 4.25, changePercent: 2.28 },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 145.78, change: -2.15, changePercent: -1.45 },
          { symbol: 'MSFT', name: 'Microsoft Corporation', price: 382.15, change: 3.45, changePercent: 0.91 },
          { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 156.32, change: -1.23, changePercent: -0.78 },
          { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.90, change: 12.45, changePercent: 5.26 }
        ],
        crypto: [
          { symbol: 'BTC', name: 'Bitcoin', price: 45230.5, change: 1100.23, changePercent: 2.45 },
          { symbol: 'ETH', name: 'Ethereum', price: 2847.3, change: -34.12, changePercent: -1.2 },
          { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.001, changePercent: 0.01 },
          { symbol: 'BNB', name: 'Binance Coin', price: 315.67, change: 8.45, changePercent: 2.75 },
          { symbol: 'ADA', name: 'Cardano', price: 0.48, change: 0.02, changePercent: 4.17 }
        ]
      })
      setError(null) // Don't show error for market data, just use fallback
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
      console.log('Profile fetch response:', response)
      
      // Handle response structure - API client might wrap responses
      const responseData = response.data || response
      const user = (responseData as any)?.user || responseData
      
      if (user) {
        setProfile(user)
        setError(null)
      } else {
        throw new Error('No user data received from API')
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err.response?.data?.error || err.message || 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (profileData: any) => {
    try {
      const response = await api.put('/api/user/profile', profileData)
      console.log('Profile update response:', response)
      
      // Handle response structure - API client might wrap responses
      const responseData = response.data || response
      const user = (responseData as any)?.user || responseData
      
      if (user) {
        setProfile(user)
        return responseData
      } else {
        throw new Error('No user data received from update API')
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      throw new Error(err.response?.data?.error || err.message || 'Failed to update profile')
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