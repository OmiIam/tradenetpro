import express from 'express';
import { MarketDataService } from '../services/MarketDataService.js';
import DatabaseManager from '../models/Database.js';

const router = express.Router();

// Initialize market data service
const dbManager = new DatabaseManager();
const marketService = new MarketDataService(dbManager.getDatabase());

// Start periodic updates (every 5 minutes)
marketService.startPeriodicUpdates(5);

// GET /api/market/crypto - Get cryptocurrency data
router.get('/crypto', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const data = marketService.getCachedMarketData('crypto', limit);
    
    res.json({
      success: true,
      data: data,
      count: data.length,
      lastUpdated: data[0]?.last_updated || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cryptocurrency data'
    });
  }
});

// GET /api/market/stocks - Get stock data
router.get('/stocks', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const data = marketService.getCachedMarketData('stock', limit);
    
    res.json({
      success: true,
      data: data,
      count: data.length,
      lastUpdated: data[0]?.last_updated || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock data'
    });
  }
});

// GET /api/market/all - Get all market data
router.get('/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const data = marketService.getCachedMarketData(undefined, limit);
    
    // Group by asset type
    const crypto = data.filter(item => item.asset_type === 'crypto');
    const stocks = data.filter(item => item.asset_type === 'stock');
    
    res.json({
      success: true,
      data: {
        crypto: crypto.slice(0, 20),
        stocks: stocks.slice(0, 20)
      },
      count: {
        crypto: crypto.length,
        stocks: stocks.length,
        total: data.length
      },
      lastUpdated: data[0]?.last_updated || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data'
    });
  }
});

// GET /api/market/symbol/:symbol - Get specific symbol data
router.get('/symbol/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = marketService.getSymbolData(symbol);
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: `Symbol ${symbol} not found`
      });
    }
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching symbol data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch symbol data'
    });
  }
});

// POST /api/market/update - Force update market data
router.post('/update', async (req, res) => {
  try {
    await marketService.updateMarketData();
    
    res.json({
      success: true,
      message: 'Market data updated successfully'
    });
  } catch (error) {
    console.error('Error updating market data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update market data'
    });
  }
});

// GET /api/market/trending - Get trending assets
router.get('/trending', async (req, res) => {
  try {
    const cryptoData = marketService.getCachedMarketData('crypto', 10);
    const stockData = marketService.getCachedMarketData('stock', 10);
    
    // Sort by price change percentage
    const trendingCrypto = cryptoData
      .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
      .slice(0, 5);
      
    const trendingStocks = stockData
      .sort((a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h))
      .slice(0, 5);
    
    res.json({
      success: true,
      data: {
        crypto: trendingCrypto,
        stocks: trendingStocks
      }
    });
  } catch (error) {
    console.error('Error fetching trending data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending data'
    });
  }
});

export default router;