import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { VerificationService } from '../services/VerificationService';
import DatabaseManager from '../models/Database';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();
const dbManager = new DatabaseManager();
const verificationService = new VerificationService(dbManager);

// Send email verification
router.post('/send-email-verification',
  [
    body('userId').isInt().withMessage('Valid user ID is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      const success = await verificationService.sendEmailVerification(userId);
      
      if (success) {
        res.json({
          success: true,
          message: 'Verification email sent successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to send verification email'
        });
      }
    } catch (error) {
      console.error('Error in send-email-verification:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while sending verification email'
      });
    }
  }
);

// Verify email with token
router.get('/verify-email',
  [
    query('token').notEmpty().withMessage('Verification token is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.query as { token: string };
      
      const result = await verificationService.verifyEmail(token);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          user: result.user
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error in verify-email:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during email verification'
      });
    }
  }
);

// Send password reset email
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      // Always return success for security (don't reveal if email exists)
      await verificationService.sendPasswordReset(email);
      
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      console.error('Error in forgot-password:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while processing your request'
      });
    }
  }
);

// Reset password with token
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      
      const result = await verificationService.verifyPasswordReset(token, password);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error in reset-password:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred during password reset'
      });
    }
  }
);

// Get user verification status
router.get('/status/:userId',
  async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required'
        });
      }
      
      const status = await verificationService.getUserVerificationStatus(userId);
      
      if (status) {
        res.json({
          success: true,
          status
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    } catch (error) {
      console.error('Error in verification status:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while fetching verification status'
      });
    }
  }
);

// Admin endpoint to manually verify user email
router.post('/admin/verify-user-email',
  [
    body('userId').isInt().withMessage('Valid user ID is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      // Note: This should be protected by admin authentication middleware
      // For now, we'll implement basic verification logic
      
      const dbManager = new DatabaseManager();
      const db = dbManager.getDatabase();
      const userModel = new (await import('../models/User')).UserModel(db);
      
      const updatedUser = userModel.updateUser(userId, {
        email_verified: true,
        status: 'pending_approval'
      });
      
      if (updatedUser) {
        res.json({
          success: true,
          message: 'User email verified by admin',
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            status: updatedUser.status,
            email_verified: updatedUser.email_verified
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    } catch (error) {
      console.error('Error in admin verify user email:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while verifying user email'
      });
    }
  }
);

// Cleanup expired tokens (admin endpoint)
router.post('/admin/cleanup-tokens',
  async (req: Request, res: Response) => {
    try {
      const deletedCount = await verificationService.cleanupExpiredTokens();
      
      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} expired tokens`
      });
    } catch (error) {
      console.error('Error in cleanup tokens:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while cleaning up tokens'
      });
    }
  }
);

export default router;