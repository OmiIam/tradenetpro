import { Request, Response } from 'express';
import { UserModel, UpdateUserData } from '../models/User';
import { PortfolioModel, UpdatePortfolioData } from '../models/Portfolio';
import { TransactionModel } from '../models/Transaction';
import { SystemSettingsModel, CreateSettingData, UpdateSettingData } from '../models/SystemSettings';
import { UserSuspensionModel, CreateSuspensionData, UpdateSuspensionData } from '../models/UserSuspension';
import { AdminNotificationsModel, CreateNotificationData, UpdateNotificationData } from '../models/AdminNotifications';
import { KYCModel } from '../models/KYC';
import DatabaseManager from '../models/Database';

export class AdminController {
  private userModel: UserModel;
  private portfolioModel: PortfolioModel;
  private transactionModel: TransactionModel;
  private systemSettingsModel: SystemSettingsModel;
  private userSuspensionModel: UserSuspensionModel;
  private adminNotificationsModel: AdminNotificationsModel;
  private kycModel: KYCModel;

  constructor(database: DatabaseManager) {
    const db = database.getDatabase();
    this.userModel = new UserModel(db);
    this.portfolioModel = new PortfolioModel(db);
    this.transactionModel = new TransactionModel(db);
    this.systemSettingsModel = new SystemSettingsModel(db);
    this.userSuspensionModel = new UserSuspensionModel(db);
    this.adminNotificationsModel = new AdminNotificationsModel(db);
    this.kycModel = new KYCModel(db);
  }

  // Admin metadata
  async getAdminMetadata(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const admin = this.userModel.getUserById(adminId);

      if (!admin || admin.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const { password_hash, ...safeAdmin } = admin;
      
      res.json({
        id: admin.id,
        name: `${admin.first_name} ${admin.last_name}`,
        email: admin.email,
        role: admin.role,
        ip_address: req.ip || req.connection.remoteAddress || '127.0.0.1'
      });
    } catch (error) {
      console.error('Get admin metadata error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Dashboard Statistics
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const userStats = this.userModel.getUserStats();
      const portfolioStats = this.portfolioModel.getPortfolioStats();
      const transactionStats = this.transactionModel.getTransactionStats();
      const kycStats = this.kycModel.getKYCStats();

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
        },
        kyc: {
          pending: kycStats.pending,
          approved: kycStats.approved,
          rejected: kycStats.rejected,
          under_review: kycStats.under_review,
          total_documents: kycStats.total_documents,
          recent_submissions: kycStats.recent_submissions,
          processing_time_avg: kycStats.processing_time_avg
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
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const usersWithPortfolios = this.userModel.getAllUsersWithPortfolios(limit, offset);
      const totalCount = this.userModel.getUsersCount();

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

      res.json(response);
    } catch (error) {
      console.error('Get all users with portfolios error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // User search
  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!query || query.trim().length < 2) {
        res.json({ users: [] });
        return;
      }

      const db = this.userModel.getDatabase();
      const searchTerm = `%${query.toLowerCase()}%`;

      // Search users with their portfolio data
      const users = db.prepare(`
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.role, u.status, 
          u.created_at, u.updated_at, u.last_login,
          p.total_balance
        FROM users u
        LEFT JOIN portfolios p ON u.id = p.user_id
        WHERE (
          LOWER(u.first_name) LIKE ? OR 
          LOWER(u.last_name) LIKE ? OR 
          LOWER(u.email) LIKE ? OR
          LOWER(u.first_name || ' ' || u.last_name) LIKE ?
        )
        ORDER BY u.created_at DESC
        LIMIT ?
      `).all(searchTerm, searchTerm, searchTerm, searchTerm, limit);

      res.json({
        users: users.map((user: any) => ({
          ...user,
          total_balance: user.total_balance || 0
        }))
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Internal server error' });
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

  // Audit Logs Management
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const db = this.userModel.getDatabase();

      // Get audit logs with admin and user details
      const logs = db.prepare(`
        SELECT 
          al.*,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name,
          admin.email as admin_email,
          user.first_name as user_first_name,
          user.last_name as user_last_name,
          user.email as user_email
        FROM audit_logs al
        LEFT JOIN users admin ON al.admin_id = admin.id
        LEFT JOIN users user ON al.user_id = user.id
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);

      // Get total count
      const totalResult = db.prepare('SELECT COUNT(*) as total FROM audit_logs').get() as { total: number };

      // Transform logs to match frontend expectations
      const transformedLogs = logs.map((log: any) => ({
        id: log.id,
        action_type: log.action,
        admin_id: log.admin_id,
        admin_name: log.admin_first_name && log.admin_last_name 
          ? `${log.admin_first_name} ${log.admin_last_name}` 
          : 'System',
        target_user_id: log.user_id,
        target_user_name: log.user_first_name && log.user_last_name 
          ? `${log.user_first_name} ${log.user_last_name}` 
          : 'Unknown User',
        target_user_email: log.user_email || '',
        details: log.details ? JSON.parse(log.details) : {},
        timestamp: log.created_at,
        ip_address: log.ip_address || '127.0.0.1'
      }));

      res.json({
        logs: transformedLogs,
        pagination: {
          total: totalResult.total,
          limit,
          offset,
          hasMore: offset + limit < totalResult.total
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const { action_type, target_user_id, target_user_name, target_user_email, details } = req.body;
      const adminId = req.user!.userId;
      const db = this.userModel.getDatabase();

      // Insert audit log entry
      const stmt = db.prepare(`
        INSERT INTO audit_logs (user_id, admin_id, action, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const result = stmt.run(
        target_user_id || null,
        adminId,
        action_type,
        JSON.stringify(details || {}),
        req.ip || req.connection.remoteAddress || '127.0.0.1'
      );

      res.status(201).json({
        message: 'Audit log created successfully',
        id: result.lastInsertRowid
      });
    } catch (error) {
      console.error('Create audit log error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // User Suspension/Ban Management
  async getSuspensions(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const filters = {
        user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
        type: req.query.type as 'suspension' | 'ban' | undefined,
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
        admin_id: req.query.admin_id ? parseInt(req.query.admin_id as string) : undefined
      };

      const suspensions = this.userSuspensionModel.getAllSuspensions(limit, offset, filters);
      const total = this.userSuspensionModel.getSuspensionCount(filters);

      res.json({
        suspensions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    } catch (error) {
      console.error('Get suspensions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSuspension(req: Request, res: Response): Promise<void> {
    try {
      const suspensionId = parseInt(req.params.suspensionId);
      const suspension = this.userSuspensionModel.getSuspensionById(suspensionId);

      if (!suspension) {
        res.status(404).json({ error: 'Suspension not found' });
        return;
      }

      res.json({ suspension });
    } catch (error) {
      console.error('Get suspension error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserActiveSuspension(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      const suspension = this.userSuspensionModel.getActiveSuspension(userId);

      res.json({ suspension });
    } catch (error) {
      console.error('Get user active suspension error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createSuspension(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const suspensionData: CreateSuspensionData = req.body;

      // Validate required fields
      if (!suspensionData.user_id || !suspensionData.type || !suspensionData.reason) {
        res.status(400).json({ error: 'user_id, type, and reason are required' });
        return;
      }

      // Check if user exists
      const user = this.userModel.getUserById(suspensionData.user_id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if user already has an active suspension
      const existingActiveSuspension = this.userSuspensionModel.getActiveSuspension(suspensionData.user_id);
      if (existingActiveSuspension) {
        res.status(409).json({ error: 'User already has an active suspension' });
        return;
      }

      const suspension = this.userSuspensionModel.createSuspension(suspensionData, adminId);

      res.status(201).json({
        message: `User ${suspensionData.type === 'ban' ? 'banned' : 'suspended'} successfully`,
        suspension
      });
    } catch (error) {
      console.error('Create suspension error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateSuspension(req: Request, res: Response): Promise<void> {
    try {
      const suspensionId = parseInt(req.params.suspensionId);
      const updateData: UpdateSuspensionData = req.body;

      const updatedSuspension = this.userSuspensionModel.updateSuspension(suspensionId, updateData);

      if (!updatedSuspension) {
        res.status(404).json({ error: 'Suspension not found' });
        return;
      }

      res.json({
        message: 'Suspension updated successfully',
        suspension: updatedSuspension
      });
    } catch (error) {
      console.error('Update suspension error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async liftSuspension(req: Request, res: Response): Promise<void> {
    try {
      const suspensionId = parseInt(req.params.suspensionId);
      const success = this.userSuspensionModel.liftSuspension(suspensionId);

      if (!success) {
        res.status(404).json({ error: 'Suspension not found' });
        return;
      }

      res.json({
        message: 'Suspension lifted successfully'
      });
    } catch (error) {
      console.error('Lift suspension error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSuspensionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.userSuspensionModel.getSuspensionStats();
      res.json({ stats });
    } catch (error) {
      console.error('Get suspension stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async processExpiredSuspensions(req: Request, res: Response): Promise<void> {
    try {
      const processedCount = this.userSuspensionModel.processExpiredSuspensions();
      res.json({
        message: `Processed ${processedCount} expired suspensions`,
        processed_count: processedCount
      });
    } catch (error) {
      console.error('Process expired suspensions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteSuspension(req: Request, res: Response): Promise<void> {
    try {
      const suspensionId = parseInt(req.params.suspensionId);
      const success = this.userSuspensionModel.deleteSuspension(suspensionId);

      if (!success) {
        res.status(404).json({ error: 'Suspension not found' });
        return;
      }

      res.json({
        message: 'Suspension deleted successfully'
      });
    } catch (error) {
      console.error('Delete suspension error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Admin Notifications Management
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const filters = {
        read: req.query.read ? req.query.read === 'true' : undefined,
        type: req.query.type as string | undefined,
        category: req.query.category as string | undefined,
        target_user_id: req.query.target_user_id ? parseInt(req.query.target_user_id as string) : undefined
      };

      const notifications = this.adminNotificationsModel.getAllNotifications(limit, offset, filters);
      const total = this.adminNotificationsModel.getNotificationCount(filters);
      const unreadCount = this.adminNotificationsModel.getUnreadCount();

      res.json({
        notifications,
        unread_count: unreadCount,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = parseInt(req.params.notificationId);
      const notification = this.adminNotificationsModel.getNotificationById(notificationId);

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({ notification });
    } catch (error) {
      console.error('Get notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getNotificationsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const categories = this.adminNotificationsModel.getNotificationsByCategory();
      res.json({ categories });
    } catch (error) {
      console.error('Get notifications by category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getNotificationStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.adminNotificationsModel.getNotificationStats();
      res.json({ stats });
    } catch (error) {
      console.error('Get notification stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUnreadNotificationCount(req: Request, res: Response): Promise<void> {
    try {
      const count = this.adminNotificationsModel.getUnreadCount();
      res.json({ unread_count: count });
    } catch (error) {
      console.error('Get unread notification count error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationData: CreateNotificationData = req.body;

      // Validate required fields
      if (!notificationData.title || !notificationData.message) {
        res.status(400).json({ error: 'Title and message are required' });
        return;
      }

      const notification = this.adminNotificationsModel.createNotification(notificationData);

      res.status(201).json({
        message: 'Notification created successfully',
        notification
      });
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = parseInt(req.params.notificationId);
      const notification = this.adminNotificationsModel.markAsRead(notificationId);

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markMultipleNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notification_ids } = req.body;

      if (!Array.isArray(notification_ids)) {
        res.status(400).json({ error: 'notification_ids must be an array of numbers' });
        return;
      }

      const updatedCount = this.adminNotificationsModel.markMultipleAsRead(notification_ids);

      res.json({
        message: `${updatedCount} notifications marked as read`,
        updated_count: updatedCount
      });
    } catch (error) {
      console.error('Mark multiple notifications as read error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const updatedCount = this.adminNotificationsModel.markAllAsRead();

      res.json({
        message: `All ${updatedCount} notifications marked as read`,
        updated_count: updatedCount
      });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = parseInt(req.params.notificationId);
      const updateData: UpdateNotificationData = req.body;

      const updatedNotification = this.adminNotificationsModel.updateNotification(notificationId, updateData);

      if (!updatedNotification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({
        message: 'Notification updated successfully',
        notification: updatedNotification
      });
    } catch (error) {
      console.error('Update notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = parseInt(req.params.notificationId);
      const success = this.adminNotificationsModel.deleteNotification(notificationId);

      if (!success) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.json({
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async cleanupOldNotifications(req: Request, res: Response): Promise<void> {
    try {
      const daysOld = parseInt(req.query.days_old as string) || 30;
      const deletedCount = this.adminNotificationsModel.deleteOldNotifications(daysOld);

      res.json({
        message: `Cleaned up ${deletedCount} old notifications`,
        deleted_count: deletedCount,
        days_old: daysOld
      });
    } catch (error) {
      console.error('Cleanup old notifications error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // System Settings Management
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string;
      const settings = this.systemSettingsModel.getAllSettings(category);
      
      res.json({
        settings,
        total: settings.length
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPublicSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = this.systemSettingsModel.getPublicSettings();
      
      // Transform to key-value pairs for easier frontend consumption
      const settingsObject = settings.reduce((acc, setting) => {
        acc[setting.key] = this.systemSettingsModel.getSettingValue(setting.key);
        return acc;
      }, {} as Record<string, any>);
      
      res.json({
        settings: settingsObject
      });
    } catch (error) {
      console.error('Get public settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSettingsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const settingsByCategory = this.systemSettingsModel.getSettingsByCategory();
      
      res.json({
        categories: settingsByCategory
      });
    } catch (error) {
      console.error('Get settings by category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const setting = this.systemSettingsModel.getSettingByKey(key);
      
      if (!setting) {
        res.status(404).json({ error: 'Setting not found' });
        return;
      }
      
      res.json({
        setting: {
          ...setting,
          parsed_value: this.systemSettingsModel.getSettingValue(key)
        }
      });
    } catch (error) {
      console.error('Get setting error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createSetting(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const settingData: CreateSettingData = req.body;
      
      // Validate required fields
      if (!settingData.key || !settingData.value) {
        res.status(400).json({ error: 'Key and value are required' });
        return;
      }
      
      const setting = this.systemSettingsModel.createSetting(settingData, adminId);
      
      res.status(201).json({
        message: 'Setting created successfully',
        setting: {
          ...setting,
          parsed_value: this.systemSettingsModel.getSettingValue(setting.key)
        }
      });
    } catch (error) {
      console.error('Create setting error:', error);
      if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'Setting with this key already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const adminId = req.user!.userId;
      const updateData: UpdateSettingData = req.body;
      
      const updatedSetting = this.systemSettingsModel.updateSetting(key, updateData, adminId);
      
      if (!updatedSetting) {
        res.status(404).json({ error: 'Setting not found' });
        return;
      }
      
      res.json({
        message: 'Setting updated successfully',
        setting: {
          ...updatedSetting,
          parsed_value: this.systemSettingsModel.getSettingValue(key)
        }
      });
    } catch (error) {
      console.error('Update setting error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateMultipleSettings(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const { settings } = req.body;
      
      if (!Array.isArray(settings)) {
        res.status(400).json({ error: 'Settings must be an array of {key, value} objects' });
        return;
      }
      
      // Validate settings format
      for (const setting of settings) {
        if (!setting.key || setting.value === undefined) {
          res.status(400).json({ error: 'Each setting must have key and value' });
          return;
        }
      }
      
      this.systemSettingsModel.updateMultipleSettings(settings, adminId);
      
      res.json({
        message: `${settings.length} settings updated successfully`,
        updated_count: settings.length
      });
    } catch (error) {
      console.error('Update multiple settings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const success = this.systemSettingsModel.deleteSetting(key);
      
      if (!success) {
        res.status(404).json({ error: 'Setting not found' });
        return;
      }
      
      res.json({
        message: 'Setting deleted successfully'
      });
    } catch (error) {
      console.error('Delete setting error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AdminController;