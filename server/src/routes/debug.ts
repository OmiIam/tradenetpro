import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { UserModel } from '../models/User';
import { PortfolioModel } from '../models/Portfolio';
import bcrypt from 'bcryptjs';
import DatabaseManager from '../models/Database';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

export default function createDebugRoutes(database: DatabaseManager) {
  const db = database.getDatabase();
  const userModel = new UserModel(db);

  // Simple registration endpoint for debugging
  router.post('/simple-register',
    [
      body('email').isEmail().withMessage('Valid email is required'),
      body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
      body('first_name').notEmpty().withMessage('First name is required'),
      body('last_name').notEmpty().withMessage('Last name is required')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const { email, password, first_name, last_name } = req.body;
        
        console.log('DEBUG: Simple register attempt:', { email, first_name, last_name });
        
        // Check if user exists
        const existingUser = userModel.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('DEBUG: Password hashed');
        
        // Direct database insertion with minimal fields
        const insertStmt = db.prepare(`
          INSERT INTO users (email, password_hash, first_name, last_name, role, status)
          VALUES (?, ?, ?, ?, 'user', 'active')
        `);
        
        const userResult = insertStmt.run(email, hashedPassword, first_name, last_name);
        console.log('DEBUG: User inserted with ID:', userResult.lastInsertRowid);
        
        // Create portfolio
        const portfolioStmt = db.prepare(`
          INSERT INTO portfolios (user_id, total_balance, portfolio_value, total_trades, win_rate)
          VALUES (?, 0, 0, 0, 0)
        `);
        
        const portfolioResult = portfolioStmt.run(userResult.lastInsertRowid);
        console.log('DEBUG: Portfolio created');
        
        // Get the created user
        const newUser = userModel.getUserById(userResult.lastInsertRowid as number);
        console.log('DEBUG: Retrieved user:', newUser?.email);
        
        if (!newUser) {
          throw new Error('Failed to retrieve created user');
        }
        
        // Remove password hash
        const { password_hash, ...userResponse } = newUser;
        
        res.status(201).json({
          success: true,
          message: 'User created successfully',
          user: userResponse
        });
        
      } catch (error) {
        console.error('DEBUG REGISTRATION ERROR:', error);
        res.status(500).json({ 
          error: 'Registration failed', 
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
  
  // Database info endpoint
  router.get('/db-info', async (req: Request, res: Response) => {
    try {
      // Get table info
      const userTableInfo = db.prepare("PRAGMA table_info(users)").all();
      const portfolioTableInfo = db.prepare("PRAGMA table_info(portfolios)").all();
      const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
      
      res.json({
        users_table: userTableInfo,
        portfolios_table: portfolioTableInfo,
        user_count: userCount
      });
    } catch (error) {
      console.error('DB Info error:', error);
      res.status(500).json({ error: 'Database query failed' });
    }
  });

  return router;
}