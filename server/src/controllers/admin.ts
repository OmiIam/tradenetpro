import { Request, Response } from 'express';
import { UserModel, UpdateUserData } from '../models/User';
import { PortfolioModel, UpdatePortfolioData } from '../models/Portfolio';
import { TransactionModel } from '../models/Transaction';
import DatabaseManager from '../models/Database';

export class AdminController {
  private userModel: UserModel;
  private portfolioModel: PortfolioModel;
  private transactionModel: TransactionModel;

  constructor(database: DatabaseManager) {
    const db = database.getDatabase();
    this.userModel = new UserModel(db);
    this.portfolioModel = new PortfolioModel(db);
    this.transactionModel = new TransactionModel(db);
  }

  // Dashboard Statistics
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const userStats = this.userModel.getUserStats();
      const portfolioStats = this.portfolioModel.getPortfolioStats();
      const transactionStats = this.transactionModel.getTransactionStats();

      res.json({
        users: {
          total: userStats.total,
          active: userStats.active,
          suspended: userStats.suspended,
          inactive: userStats.inactive
        },
        portfolio: {
          totalValue: portfolioStats.totalValue || 0,
          totalTrades: portfolioStats.totalTrades || 0,
          averageWinRate: portfolioStats.avgWinRate || 0
        },
        transactions: {
          total: transactionStats.totalTransactions || 0,
          totalVolume: transactionStats.totalVolume || 0,
          todayCount: transactionStats.todayTransactions || 0,
          todayVolume: transactionStats.todayVolume || 0
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // User Management
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const users = this.userModel.getAllUsers(limit, offset);
      const totalCount = this.userModel.getUsersCount();

      // Remove password hashes from response
      const safeUsers = users.map(({ password_hash, ...user }) => user);

      res.json({
        users: safeUsers,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Optimized endpoint to get users with portfolio data in a single call
  async getAllUsersWithPortfolios(req: Request, res: Response): Promise<void> {
    console.log(`[ADMIN] GET /api/admin/users-with-portfolios - Request received`, {
      query: req.query,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin')
    });

    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      console.log(`[ADMIN] Fetching users with portfolios - limit: ${limit}, offset: ${offset}`);

      const usersWithPortfolios = this.userModel.getAllUsersWithPortfolios(limit, offset);
      const totalCount = this.userModel.getUsersCount();

      console.log(`[ADMIN] Found ${usersWithPortfolios.length} users, total count: ${totalCount}`);

      // Remove password hashes from response
      const safeUsers = usersWithPortfolios.map(({ password_hash, ...user }) => user);

      const response = {
        users: safeUsers,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      };

      console.log(`[ADMIN] Sending response with ${safeUsers.length} users`);
      res.json(response);
    } catch (error) {
      console.error('[ADMIN] Get all users with portfolios error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        query: req.query
      });
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const user = this.userModel.getUserById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Get user's portfolio
      const portfolio = this.portfolioModel.getPortfolioByUserId(userId);
      
      // Get user's recent transactions
      const transactions = this.transactionModel.getTransactionsByUserId(userId, 10);

      // Remove password hash from response
      const { password_hash, ...safeUser } = user;

      res.json({
        user: safeUser,
        portfolio,
        recentTransactions: transactions
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const updateData: UpdateUserData = req.body;

      const updatedUser = this.userModel.updateUser(userId, updateData);

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remove password hash from response
      const { password_hash, ...safeUser } = updatedUser;

      res.json({
        message: 'User updated successfully',
        user: safeUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      const success = this.userModel.deleteUser(userId);

      if (!success) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const { status } = req.body;

      const updatedUser = this.userModel.toggleUserStatus(userId, status);

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remove password hash from response
      const { password_hash, ...safeUser } = updatedUser;

      res.json({
        message: `User ${status === 'active' ? 'activated' : 'suspended'} successfully`,
        user: safeUser
      });
    } catch (error) {
      console.error('Toggle user status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Balance Management
  async adjustUserBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const { amount, type, description } = req.body;
      const adminId = req.user!.userId;

      // Adjust the balance (now automatically syncs portfolio value)
      const updatedPortfolio = this.portfolioModel.adjustBalance(userId, amount, type);

      if (!updatedPortfolio) {
        res.status(404).json({ error: 'User portfolio not found' });
        return;
      }

      // Create transaction record
      const transactionAmount = type === 'add' ? amount : type === 'subtract' ? -amount : amount;
      const transaction = this.transactionModel.createTransaction({
        user_id: userId,
        type: 'adjustment',
        amount: transactionAmount,
        description: description || `Balance ${type} by admin`,
        admin_id: adminId
      });

      res.json({
        message: 'Balance adjusted successfully',
        portfolio: updatedPortfolio,
        transaction
      });
    } catch (error) {
      console.error('Adjust balance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
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
      console.error('Get user transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const { type, amount, description } = req.body;
      const adminId = req.user!.userId;

      const transaction = this.transactionModel.createTransaction({
        user_id: userId,
        type,
        amount,
        description,
        admin_id: adminId
      });

      if (!transaction) {
        res.status(400).json({ error: 'Failed to create transaction' });
        return;
      }

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Portfolio Management
  async getUserPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
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
      console.error('Get user portfolio error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUserPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const updateData: UpdatePortfolioData = req.body;

      const updatedPortfolio = this.portfolioModel.updatePortfolio(userId, updateData);

      if (!updatedPortfolio) {
        res.status(404).json({ error: 'Portfolio not found' });
        return;
      }

      res.json({
        message: 'Portfolio updated successfully',
        portfolio: updatedPortfolio
      });
    } catch (error) {
      console.error('Update portfolio error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addPortfolioPosition(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const positionData = req.body;

      const portfolio = this.portfolioModel.getPortfolioByUserId(userId);
      if (!portfolio) {
        res.status(404).json({ error: 'Portfolio not found' });
        return;
      }

      const position = this.portfolioModel.addPosition(portfolio.id, positionData);

      if (!position) {
        res.status(400).json({ error: 'Failed to add position' });
        return;
      }

      res.status(201).json({
        message: 'Position added successfully',
        position
      });
    } catch (error) {
      console.error('Add position error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // General Admin Operations
  async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = this.transactionModel.getAllTransactions(limit, offset);
      const totalCount = this.transactionModel.getTotalTransactionCount();

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
      console.error('Get all transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllPortfolios(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const portfolios = this.portfolioModel.getAllPortfolios(limit, offset);

      res.json({
        portfolios
      });
    } catch (error) {
      console.error('Get all portfolios error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // KYC Management
  async getAllKYCDocuments(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;

      const db = this.userModel.getDatabase();
      let query = `
        SELECT 
          ud.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.kyc_status
        FROM user_documents ud
        JOIN users u ON ud.user_id = u.id
      `;

      const params: any[] = [];
      if (status && ['pending', 'approved', 'rejected', 'under_review'].includes(status)) {
        query += ' WHERE ud.verification_status = ?';
        params.push(status);
      }

      query += ' ORDER BY ud.uploaded_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const documents = db.prepare(query).all(...params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM user_documents ud';
      const countParams: any[] = [];
      if (status && ['pending', 'approved', 'rejected', 'under_review'].includes(status)) {
        countQuery += ' WHERE verification_status = ?';
        countParams.push(status);
      }

      const totalResult = db.prepare(countQuery).get(...countParams) as { total: number };

      res.json({
        documents,
        pagination: {
          total: totalResult.total,
          limit,
          offset,
          hasMore: offset + limit < totalResult.total
        }
      });
    } catch (error) {
      console.error('Get all KYC documents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getKYCDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const documentId = parseInt(req.params.documentId);
      const db = this.userModel.getDatabase();

      const document = db.prepare(`
        SELECT 
          ud.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.kyc_status,
          admin.first_name as verified_by_name,
          admin.last_name as verified_by_last_name
        FROM user_documents ud
        JOIN users u ON ud.user_id = u.id
        LEFT JOIN users admin ON ud.verified_by = admin.id
        WHERE ud.id = ?
      `).get(documentId);

      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      res.json({ document });
    } catch (error) {
      console.error('Get KYC document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async verifyKYCDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = parseInt(req.params.documentId);
      const { status, comments } = req.body;
      const adminId = req.user!.userId;
      const db = this.userModel.getDatabase();

      if (!['approved', 'rejected'].includes(status)) {
        res.status(400).json({ error: 'Invalid status. Must be "approved" or "rejected"' });
        return;
      }

      // Update document status
      const updateDoc = db.prepare(`
        UPDATE user_documents 
        SET verification_status = ?, rejection_reason = ?, verified_at = CURRENT_TIMESTAMP, verified_by = ?
        WHERE id = ?
      `);

      const result = updateDoc.run(
        status,
        status === 'rejected' ? comments : null,
        adminId,
        documentId
      );

      if (result.changes === 0) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      // Get document info to update user KYC status
      const document = db.prepare(`
        SELECT user_id, document_type FROM user_documents WHERE id = ?
      `).get(documentId) as { user_id: number; document_type: string };

      if (document) {
        // Check if user has all required documents approved
        const requiredDocs = ['passport', 'utility_bill'];
        const approvedDocs = db.prepare(`
          SELECT document_type FROM user_documents 
          WHERE user_id = ? AND verification_status = 'approved'
        `).all(document.user_id) as { document_type: string }[];

        const approvedTypes = approvedDocs.map(doc => doc.document_type);
        const hasAllRequired = requiredDocs.every(type => approvedTypes.includes(type));

        // Update user KYC status
        let newKycStatus = 'under_review';
        if (hasAllRequired) {
          newKycStatus = 'approved';
        } else {
          // Check if any required documents are rejected
          const rejectedDocs = db.prepare(`
            SELECT document_type FROM user_documents 
            WHERE user_id = ? AND verification_status = 'rejected' AND document_type IN (${requiredDocs.map(() => '?').join(',')})
          `).all(document.user_id, ...requiredDocs) as { document_type: string }[];

          if (rejectedDocs.length > 0) {
            newKycStatus = 'rejected';
          }
        }

        db.prepare(`
          UPDATE users SET kyc_status = ? WHERE id = ?
        `).run(newKycStatus, document.user_id);

        // Create audit log
        db.prepare(`
          INSERT INTO audit_logs (user_id, action, details, admin_id) 
          VALUES (?, ?, ?, ?)
        `).run(
          document.user_id,
          `kyc_document_${status}`,
          JSON.stringify({
            document_id: documentId,
            document_type: document.document_type,
            new_kyc_status: newKycStatus,
            comments: comments || null
          }),
          adminId
        );
      }

      res.json({
        message: `Document ${status} successfully`,
        document_id: documentId,
        status
      });
    } catch (error) {
      console.error('Verify KYC document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getKYCStats(req: Request, res: Response): Promise<void> {
    try {
      const db = this.userModel.getDatabase();

      // Get KYC document statistics
      const docStats = db.prepare(`
        SELECT 
          verification_status,
          COUNT(*) as count
        FROM user_documents
        GROUP BY verification_status
      `).all() as { verification_status: string; count: number }[];

      // Get user KYC status statistics
      const userStats = db.prepare(`
        SELECT 
          kyc_status,
          COUNT(*) as count
        FROM users
        GROUP BY kyc_status
      `).all() as { kyc_status: string; count: number }[];

      // Get recent documents needing review
      const pendingCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM user_documents 
        WHERE verification_status = 'pending'
      `).get() as { count: number };

      // Get documents processed today
      const todayProcessed = db.prepare(`
        SELECT COUNT(*) as count 
        FROM user_documents 
        WHERE DATE(verified_at) = DATE('now') AND verification_status IN ('approved', 'rejected')
      `).get() as { count: number };

      res.json({
        documents: {
          by_status: docStats.reduce((acc, stat) => {
            acc[stat.verification_status] = stat.count;
            return acc;
          }, {} as Record<string, number>),
          pending_review: pendingCount.count,
          processed_today: todayProcessed.count
        },
        users: {
          by_kyc_status: userStats.reduce((acc, stat) => {
            acc[stat.kyc_status] = stat.count;
            return acc;
          }, {} as Record<string, number>)
        }
      });
    } catch (error) {
      console.error('Get KYC stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async downloadKYCDocument(req: Request, res: Response): Promise<void> {
    try {
      const documentId = parseInt(req.params.documentId);
      const db = this.userModel.getDatabase();

      const document = db.prepare(`
        SELECT file_path, file_name FROM user_documents WHERE id = ?
      `).get(documentId) as { file_path: string; file_name: string };

      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      const fs = require('fs');
      if (!fs.existsSync(document.file_path)) {
        res.status(404).json({ error: 'File not found on server' });
        return;
      }

      res.download(document.file_path, document.file_name);
    } catch (error) {
      console.error('Download KYC document error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AdminController;