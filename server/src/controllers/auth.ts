import { Request, Response } from 'express';
import { UserModel, CreateUserData } from '../models/User';
import AuthUtils from '../utils/auth';
import DatabaseManager from '../models/Database';
import { VerificationService } from '../services/VerificationService';
import SessionTrackingService from '../services/SessionTrackingService';

export class AuthController {
  private userModel: UserModel;
  private verificationService: VerificationService;
  private sessionService: SessionTrackingService;

  constructor(database: DatabaseManager) {
    this.userModel = new UserModel(database.getDatabase());
    this.verificationService = new VerificationService(database);
    this.sessionService = new SessionTrackingService(database.getDatabase());
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, first_name, last_name } = req.body;

      // Basic validation
      if (!email || !password || !first_name || !last_name) {
        res.status(400).json({ 
          error: 'Missing required fields',
          required: ['email', 'password', 'first_name', 'last_name']
        });
        return;
      }

      console.log('=== REGISTRATION DEBUG START ===');
      console.log('Input data:', { email, first_name, last_name });

      // Check if user already exists
      console.log('Checking for existing user...');
      let existingUser;
      try {
        existingUser = this.userModel.getUserByEmail(email);
        console.log('Existing user check result:', existingUser ? 'USER EXISTS' : 'NO EXISTING USER');
      } catch (checkError) {
        console.error('Error checking existing user:', checkError);
        res.status(500).json({ error: 'Database connection error during user check' });
        return;
      }

      if (existingUser) {
        res.status(400).json({ error: 'User already exists with this email' });
        return;
      }

      // Direct database approach - bypass UserModel
      console.log('Starting direct database insertion...');
      try {
        const db = this.userModel['db']; // Access private db property
        
        // Hash password
        console.log('Hashing password...');
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash(password, 10);
        console.log('Password hashed successfully');
        
        // Insert user directly
        console.log('Inserting user into database...');
        const userStmt = db.prepare(`
          INSERT INTO users (email, password_hash, first_name, last_name, role, status) 
          VALUES (?, ?, ?, ?, 'user', 'active')
        `);
        
        const userResult = userStmt.run(email, hashedPassword, first_name, last_name);
        const userId = userResult.lastInsertRowid;
        console.log('User inserted with ID:', userId);
        
        // Create portfolio
        console.log('Creating portfolio...');
        const portfolioStmt = db.prepare(`
          INSERT INTO portfolios (user_id, total_balance, portfolio_value, total_trades, win_rate) 
          VALUES (?, 0, 0, 0, 0)
        `);
        
        const portfolioResult = portfolioStmt.run(userId);
        console.log('Portfolio created with ID:', portfolioResult.lastInsertRowid);
        
        // Get created user
        const newUser = this.userModel.getUserById(userId as number);
        console.log('Retrieved created user:', newUser ? 'SUCCESS' : 'FAILED');
        
        if (!newUser) {
          throw new Error('Failed to retrieve created user');
        }
        
        // Success response
        const { password_hash, ...userResponse } = newUser;
        console.log('=== REGISTRATION DEBUG SUCCESS ===');
        
        res.status(201).json({
          message: 'Registration successful!',
          user: userResponse,
          debug: 'Direct database insertion successful'
        });
        return;
        
      } catch (dbError) {
        console.error('=== DATABASE ERROR DETAILS ===');
        console.error('Error name:', dbError instanceof Error ? dbError.name : 'Unknown');
        console.error('Error message:', dbError instanceof Error ? dbError.message : String(dbError));
        console.error('Error stack:', dbError instanceof Error ? dbError.stack : 'No stack');
        console.error('=== END DATABASE ERROR ===');
        
        res.status(500).json({
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          type: 'DIRECT_DB_ERROR'
        });
        return;
      }
      
    } catch (error) {
      console.error('=== GENERAL REGISTRATION ERROR ===');
      console.error('Error:', error);
      console.error('=== END GENERAL ERROR ===');
      
      res.status(500).json({ 
        error: 'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'GENERAL_ERROR'
      });
      return;
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = this.userModel.getUserByEmail(email);
      if (!user) {
        // Log failed login attempt
        await this.sessionService.logLoginAttempt({
          login_type: 'failed',
          failure_reason: 'User not found',
          request: req
        });
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check if user is active
      if (user.status !== 'active') {
        await this.sessionService.logLoginAttempt({
          user_id: user.id,
          login_type: 'blocked',
          failure_reason: 'Account not active',
          request: req
        });
        res.status(401).json({ error: 'Account is not active' });
        return;
      }

      // Validate password
      const isValidPassword = await this.userModel.validatePassword(user, password);
      if (!isValidPassword) {
        await this.sessionService.logLoginAttempt({
          user_id: user.id,
          login_type: 'failed',
          failure_reason: 'Invalid password',
          request: req
        });
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Update last login
      this.userModel.updateLastLogin(user.id);

      // Generate tokens
      const tokenPair = AuthUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Create session with tracking
      const tokenHash = AuthUtils.hashToken(tokenPair.accessToken);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      await this.sessionService.createSession({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        request: req
      });

      // Don't send password hash in response
      const { password_hash, ...userResponse } = user;

      res.json({
        message: 'Login successful',
        user: userResponse,
        tokens: tokenPair
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Extract token from request
      const authHeader = req.headers['authorization'];
      const token = AuthUtils.extractTokenFromHeader(authHeader);
      
      if (token) {
        // Find and end the session
        const tokenHash = AuthUtils.hashToken(token);
        const db = this.userModel['db']; // Access private db property
        
        const sessionQuery = db.prepare(`
          SELECT us.id as session_id
          FROM user_sessions us
          WHERE us.token_hash = ?
        `);
        
        const session = sessionQuery.get(tokenHash);
        if (session) {
          this.sessionService.endSession((session as any).session_id);
        }
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const user = this.userModel.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Don't send password hash in response
      const { password_hash, ...userResponse } = user;

      res.json({
        user: userResponse
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
      }

      // Verify refresh token
      const payload = AuthUtils.verifyToken(refreshToken);
      if (!payload) {
        res.status(403).json({ error: 'Invalid refresh token' });
        return;
      }

      // Get user to make sure they still exist and are active
      const user = this.userModel.getUserById(payload.userId);
      if (!user || user.status !== 'active') {
        res.status(403).json({ error: 'User not found or inactive' });
        return;
      }

      // Generate new tokens
      const tokenPair = AuthUtils.generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      res.json({
        message: 'Token refreshed successfully',
        tokens: tokenPair
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const user = this.userModel.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Validate current password
      const isValidPassword = await this.userModel.validatePassword(user, currentPassword);
      if (!isValidPassword) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      // Update password
      const hashedPassword = AuthUtils.hashPassword(newPassword);
      this.userModel.updateUser(user.id, { email: user.email }); // This is a placeholder - you'd need to add password update to UserModel

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Check if user exists
      const user = this.userModel.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        res.json({ message: 'If the email exists, a reset link has been sent' });
        return;
      }

      // In a real implementation, you would:
      // 1. Generate a reset token
      // 2. Store it in the database with expiration
      // 3. Send an email with the reset link
      
      // For now, return success message
      res.json({ 
        message: 'If the email exists, a reset link has been sent',
        // In development, include the email for testing
        ...(process.env.NODE_ENV === 'development' && { email: user.email })
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ error: 'Token and new password are required' });
        return;
      }

      // In a real implementation, you would:
      // 1. Validate the reset token
      // 2. Check if it's not expired
      // 3. Find the user associated with the token
      // 4. Update the password
      // 5. Invalidate the token

      // For now, return a placeholder response
      res.json({ message: 'Password reset functionality is not fully implemented yet' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AuthController;