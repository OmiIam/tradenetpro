import Database from 'better-sqlite3';
import fetch from 'node-fetch';

export interface MarketDataPoint {
  id?: number;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  market_cap_rank: number;
  last_updated: string;
  data_source: string;
  asset_type: 'crypto' | 'stock' | 'forex' | 'commodity';
}

export interface StockDataPoint {
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  last_updated: string;
}

export class MarketDataService {
  private db: Database.Database;
  private coingeckoApiKey: string | null;
  private alphaVantageApiKey: string | null;

  constructor(database: Database.Database) {
    this.db = database;
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || null;
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || null;
  }

  // Fetch crypto data from CoinGecko
  async fetchCryptoData(): Promise<MarketDataPoint[]> {
    try {
      const url = this.coingeckoApiKey 
        ? `https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&x_cg_pro_api_key=${this.coingeckoApiKey}`
        : 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false';

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json() as any[];
      
      return data.map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price: coin.current_price || 0,
        price_change_24h: coin.price_change_24h || 0,
        price_change_percentage_24h: coin.price_change_percentage_24h || 0,
        market_cap: coin.market_cap || 0,
        volume_24h: coin.total_volume || 0,
        circulating_supply: coin.circulating_supply || 0,
        total_supply: coin.total_supply || 0,
        max_supply: coin.max_supply || 0,
        market_cap_rank: coin.market_cap_rank || 0,
        last_updated: new Date().toISOString(),
        data_source: 'coingecko',
        asset_type: 'crypto' as const
      }));
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      return [];
    }
  }

  // Fetch stock data from Alpha Vantage
  async fetchStockData(): Promise<StockDataPoint[]> {
    if (!this.alphaVantageApiKey) {
      console.warn('Alpha Vantage API key not provided, using mock data');
      return this.getMockStockData();
    }

    try {
      // Fetch data for popular stocks
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA'];
      const stockData: StockDataPoint[] = [];

      for (const symbol of symbols) {
        try {
          const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageApiKey}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            continue;
          }

          const data = await response.json() as any;
          const quote = data['Global Quote'];
          
          if (quote) {
            stockData.push({
              symbol: symbol,
              name: this.getStockName(symbol),
              current_price: parseFloat(quote['05. price']) || 0,
              price_change_24h: parseFloat(quote['09. change']) || 0,
              price_change_percentage_24h: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
              market_cap: 0, // Would need additional API call
              volume_24h: parseInt(quote['06. volume']) || 0,
              last_updated: new Date().toISOString()
            });
          }

          // Rate limiting - Alpha Vantage allows 5 calls per minute for free tier
          await new Promise(resolve => setTimeout(resolve, 12000));
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          continue;
        }
      }

      return stockData;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return this.getMockStockData();
    }
  }

  // Get mock stock data as fallback
  private getMockStockData(): StockDataPoint[] {
    return [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        current_price: 190.45,
        price_change_24h: 4.25,
        price_change_percentage_24h: 2.28,
        market_cap: 2850000000000,
        volume_24h: 45600000,
        last_updated: new Date().toISOString()
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        current_price: 145.78,
        price_change_24h: -2.15,
        price_change_percentage_24h: -1.45,
        market_cap: 1820000000000,
        volume_24h: 28900000,
        last_updated: new Date().toISOString()
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        current_price: 382.15,
        price_change_24h: 3.45,
        price_change_percentage_24h: 0.91,
        market_cap: 2840000000000,
        volume_24h: 32100000,
        last_updated: new Date().toISOString()
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        current_price: 156.32,
        price_change_24h: -1.23,
        price_change_percentage_24h: -0.78,
        market_cap: 1620000000000,
        volume_24h: 41200000,
        last_updated: new Date().toISOString()
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        current_price: 248.90,
        price_change_24h: 12.45,
        price_change_percentage_24h: 5.26,
        market_cap: 795000000000,
        volume_24h: 115600000,
        last_updated: new Date().toISOString()
      }
    ];
  }

  private getStockName(symbol: string): string {
    const names: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'NVDA': 'NVIDIA Corporation'
    };
    return names[symbol] || symbol;
  }

  // Save market data to database
  saveMarketData(data: MarketDataPoint[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO market_data (
        symbol, name, current_price, price_change_24h, price_change_percentage_24h,
        market_cap, volume_24h, circulating_supply, total_supply, max_supply,
        market_cap_rank, last_updated, data_source, asset_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of data) {
      stmt.run(
        item.symbol,
        item.name,
        item.current_price,
        item.price_change_24h,
        item.price_change_percentage_24h,
        item.market_cap,
        item.volume_24h,
        item.circulating_supply,
        item.total_supply,
        item.max_supply,
        item.market_cap_rank,
        item.last_updated,
        item.data_source,
        item.asset_type
      );
    }
  }

  // Save stock data to database
  saveStockData(data: StockDataPoint[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO market_data (
        symbol, name, current_price, price_change_24h, price_change_percentage_24h,
        market_cap, volume_24h, last_updated, data_source, asset_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of data) {
      stmt.run(
        item.symbol,
        item.name,
        item.current_price,
        item.price_change_24h,
        item.price_change_percentage_24h,
        item.market_cap,
        item.volume_24h,
        item.last_updated,
        'alphavantage',
        'stock'
      );
    }
  }

  // Get cached market data from database
  getCachedMarketData(assetType?: 'crypto' | 'stock', limit: number = 50): MarketDataPoint[] {
    let query = 'SELECT * FROM market_data';
    const params: any[] = [];

    if (assetType) {
      query += ' WHERE asset_type = ?';
      params.push(assetType);
    }

    query += ' ORDER BY market_cap_rank ASC, market_cap DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as MarketDataPoint[];
  }

  // Get specific symbol data
  getSymbolData(symbol: string): MarketDataPoint | null {
    const stmt = this.db.prepare('SELECT * FROM market_data WHERE symbol = ? ORDER BY last_updated DESC LIMIT 1');
    return stmt.get(symbol) as MarketDataPoint | null;
  }

  // Check if data is stale (older than 5 minutes)
  isDataStale(lastUpdated: string): boolean {
    const lastUpdateTime = new Date(lastUpdated).getTime();
    const now = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - lastUpdateTime) > fiveMinutes;
  }

  // Update market data (fetch fresh data if needed)
  async updateMarketData(): Promise<void> {
    try {
      console.log('Updating market data...');
      
      // Fetch and save crypto data
      const cryptoData = await this.fetchCryptoData();
      if (cryptoData.length > 0) {
        this.saveMarketData(cryptoData);
        console.log(`Updated ${cryptoData.length} crypto assets`);
      }

      // Fetch and save stock data
      const stockData = await this.fetchStockData();
      if (stockData.length > 0) {
        this.saveStockData(stockData);
        console.log(`Updated ${stockData.length} stock assets`);
      }

      console.log('Market data update completed');
    } catch (error) {
      console.error('Error updating market data:', error);
    }
  }

  // Start periodic updates
  startPeriodicUpdates(intervalMinutes: number = 5): NodeJS.Timeout {
    console.log(`Starting periodic market data updates every ${intervalMinutes} minutes`);
    
    // Update immediately
    this.updateMarketData();
    
    // Then update periodically
    return setInterval(() => {
      this.updateMarketData();
    }, intervalMinutes * 60 * 1000);
  }
}

export default MarketDataService;