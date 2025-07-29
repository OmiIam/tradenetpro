import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { PortfolioModel } from '../models/Portfolio';
import { TransactionModel } from '../models/Transaction';
import DatabaseManager from '../models/Database';

export class UserController {
  private userModel: UserModel;
  private portfolioModel: PortfolioModel;
  private transactionModel: TransactionModel;

  constructor(database: DatabaseManager) {
    const db = database.getDatabase();
    this.userModel = new UserModel(db);
    this.portfolioModel = new PortfolioModel(db);
    this.transactionModel = new TransactionModel(db);
  }

  // Dashboard data for regular users
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      
      // Get user's portfolio
      const portfolio = this.portfolioModel.getPortfolioByUserId(userId);
      
      if (!portfolio) {
        res.status(404).json({ error: 'Portfolio not found' });
        return;
      }

      // Get portfolio positions
      const positions = this.portfolioModel.getPortfolioPositions(portfolio.id);

      // Get recent transactions
      const recentTransactions = this.transactionModel.getTransactionsByUserId(userId, 10);

      // Calculate P&L and other stats
      const totalPositionValue = positions.reduce((sum, pos) => {
        return sum + (pos.quantity * pos.current_price);
      }, 0);

      const totalCost = positions.reduce((sum, pos) => {
        return sum + (pos.quantity * pos.average_price);
      }, 0);

      const unrealizedPnL = totalPositionValue - totalCost;
      
      // Calculate actual portfolio value (cash + positions)
      const actualPortfolioValue = portfolio.total_balance + totalPositionValue;
      
      // Sync portfolio value in database to match actual calculation
      this.portfolioModel.syncPortfolioValue(userId);
      
      // Calculate today's P&L (simplified - would need historical data for accuracy)
      const todayPnL = unrealizedPnL * 0.1; // Assuming 10% of unrealized P&L happened today

      res.json({
        portfolio: {
          totalBalance: portfolio.total_balance,
          portfolioValue: actualPortfolioValue,
          totalTrades: portfolio.total_trades,
          winRate: portfolio.win_rate,
          todayPnL: todayPnL,
          totalReturn: actualPortfolioValue - portfolio.total_balance
        },
        positions,
        recentTransactions: recentTransactions.slice(0, 5)
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = this.userModel.getUserById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remove password hash from response
      const { password_hash, ...safeUser } = user;

      res.json({
        user: safeUser
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { 
        first_name, 
        last_name, 
        email, 
        phone_number, 
        country, 
        timezone, 
        bio,
        address_line_1, 
        address_line_2, 
        city, 
        state, 
        postal_code,
        notification_email,
        notification_push,
        notification_sms,
        two_factor_enabled,
        bitcoin_address,
        ethereum_address,
        usdt_address
      } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = this.userModel.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          res.status(400).json({ error: 'Email already taken' });
          return;
        }
      }

      // Prepare update data - only include fields that are provided
      const updateData: any = {};
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (email !== undefined) updateData.email = email;
      if (phone_number !== undefined) updateData.phone_number = phone_number;
      if (country !== undefined) updateData.country = country;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (bio !== undefined) updateData.bio = bio;
      if (address_line_1 !== undefined) updateData.address_line_1 = address_line_1;
      if (address_line_2 !== undefined) updateData.address_line_2 = address_line_2;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (postal_code !== undefined) updateData.postal_code = postal_code;
      if (notification_email !== undefined) updateData.notification_email = notification_email;
      if (notification_push !== undefined) updateData.notification_push = notification_push;
      if (notification_sms !== undefined) updateData.notification_sms = notification_sms;
      if (two_factor_enabled !== undefined) updateData.two_factor_enabled = two_factor_enabled;
      if (bitcoin_address !== undefined) updateData.bitcoin_address = bitcoin_address;
      if (ethereum_address !== undefined) updateData.ethereum_address = ethereum_address;
      if (usdt_address !== undefined) updateData.usdt_address = usdt_address;

      const updatedUser = this.userModel.updateUser(userId, updateData);

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remove password hash from response
      const { password_hash, ...safeUser } = updatedUser;

      res.json({
        message: 'Profile updated successfully',
        user: safeUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const portfolio = this.portfolioModel.getPortfolioByUserId(userId);

      if (!portfolio) {
        res.status(404).json({ error: 'Portfolio not found' });
        return;
      }

      const positions = this.portfolioModel.getPortfolioPositions(portfolio.id);

      res.json({
        portfolio,
        positions
      });
    } catch (error) {
      console.error('Get portfolio error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = this.transactionModel.getTransactionsByUserId(userId, limit, offset);
      const totalCount = this.transactionModel.getTransactionCountByUserId(userId);

      res.json({
        transactions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createDeposit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { amount, description } = req.body;

      if (amount <= 0) {
        res.status(400).json({ error: 'Amount must be positive' });
        return;
      }

      // Create deposit transaction
      const transaction = this.transactionModel.createTransaction({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        description: description || 'User deposit'
      });

      if (!transaction) {
        res.status(400).json({ error: 'Failed to create deposit' });
        return;
      }

      // Update portfolio balance (automatically syncs portfolio_value)
      const updatedPortfolio = this.portfolioModel.adjustBalance(userId, amount, 'add');

      res.status(201).json({
        message: 'Deposit created successfully',
        transaction,
        portfolio: updatedPortfolio
      });
    } catch (error) {
      console.error('Create deposit error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createWithdrawal(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { amount, description } = req.body;

      if (amount <= 0) {
        res.status(400).json({ error: 'Amount must be positive' });
        return;
      }

      // Check if user has sufficient balance
      const portfolio = this.portfolioModel.getPortfolioByUserId(userId);
      if (!portfolio || portfolio.total_balance < amount) {
        res.status(400).json({ error: 'Insufficient balance' });
        return;
      }

      // Create withdrawal transaction
      const transaction = this.transactionModel.createTransaction({
        user_id: userId,
        type: 'withdrawal',
        amount: -amount, // Negative for withdrawal
        description: description || 'User withdrawal'
      });

      if (!transaction) {
        res.status(400).json({ error: 'Failed to create withdrawal' });
        return;
      }

      // Update portfolio balance (automatically syncs portfolio_value)
      const updatedPortfolio = this.portfolioModel.adjustBalance(userId, amount, 'subtract');

      res.status(201).json({
        message: 'Withdrawal created successfully',
        transaction,
        portfolio: updatedPortfolio
      });
    } catch (error) {
      console.error('Create withdrawal error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMarketData(req: Request, res: Response): Promise<void> {
    try {
      // Mock market data - in a real app, this would come from an external API
      const marketData = {
        stocks: [
          { symbol: 'AAPL', name: 'Apple Inc.', price: 185.20, change: 2.45, changePercent: 1.34 },
          { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.90, change: -1.25, changePercent: -0.33 },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: 3.21, changePercent: 2.30 },
          { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.89, change: 0.78, changePercent: 0.50 },
          { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.80, change: -5.34, changePercent: -2.13 }
        ],
        crypto: [
          { symbol: 'BTC', name: 'Bitcoin', price: 45234.56, change: 1234.78, changePercent: 2.81 },
          { symbol: 'ETH', name: 'Ethereum', price: 2456.89, change: -45.23, changePercent: -1.81 },
          { symbol: 'BNB', name: 'Binance Coin', price: 312.45, change: 8.90, changePercent: 2.93 },
          { symbol: 'ADA', name: 'Cardano', price: 0.52, change: 0.023, changePercent: 4.64 }
        ]
      };

      res.json(marketData);
    } catch (error) {
      console.error('Get market data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAccountStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      
      const portfolio = this.portfolioModel.getPortfolioByUserId(userId);
      if (!portfolio) {
        res.status(404).json({ error: 'Portfolio not found' });
        return;
      }

      const transactionCount = this.transactionModel.getTransactionCountByUserId(userId);
      const user = this.userModel.getUserById(userId);

      res.json({
        accountAge: user ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        totalTrades: portfolio.total_trades,
        winRate: portfolio.win_rate,
        totalTransactions: transactionCount,
        portfolioValue: portfolio.portfolio_value,
        totalBalance: portfolio.total_balance
      });
    } catch (error) {
      console.error('Get account stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UserController;