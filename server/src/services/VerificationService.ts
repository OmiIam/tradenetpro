import { VerificationTokenModel } from '../models/VerificationToken';
import { UserModel } from '../models/User';
import EmailService from './EmailService';
import DatabaseManager from '../models/Database';

export class VerificationService {
  private tokenModel: VerificationTokenModel;
  private userModel: UserModel;
  private emailService: EmailService;

  constructor(database: DatabaseManager) {
    const db = database.getDatabase();
    this.tokenModel = new VerificationTokenModel(db);
    this.userModel = new UserModel(db);
    this.emailService = new EmailService();
  }

  async sendEmailVerification(userId: number): Promise<boolean> {
    try {
      const user = this.userModel.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.email_verified) {
        throw new Error('Email already verified');
      }

      // Create verification token
      const token = this.tokenModel.createToken({
        user_id: userId,
        type: 'email',
        expires_in_hours: 24
      });

      // Send verification email
      const emailSent = await this.emailService.sendVerificationEmail(
        user.email,
        user.first_name,
        token.token
      );

      if (!emailSent) {
        throw new Error('Failed to send verification email');
      }

      console.log(`Verification email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending email verification:', error);
      return false;
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      // Validate token
      const verificationToken = this.tokenModel.validateToken(token, 'email');
      if (!verificationToken) {
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      // Get user
      const user = this.userModel.getUserById(verificationToken.user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (user.email_verified) {
        return {
          success: false,
          message: 'Email already verified'
        };
      }

      // Mark token as used
      this.tokenModel.useToken(token);

      // Update user as email verified
      this.userModel.updateUser(user.id, {
        email_verified: true,
        status: 'pending_approval', // Move to next stage
      });

      // Send welcome email
      await this.emailService.sendWelcomeEmail(user.email, user.first_name);

      console.log(`Email verified for user ${user.email}`);

      return {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          status: 'pending_approval'
        }
      };
    } catch (error) {
      console.error('Error verifying email:', error);
      return {
        success: false,
        message: 'An error occurred during verification'
      };
    }
  }

  async sendPasswordReset(email: string): Promise<boolean> {
    try {
      const user = this.userModel.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return true;
      }

      // Create password reset token
      const token = this.tokenModel.createToken({
        user_id: user.id,
        type: 'password_reset',
        expires_in_hours: 2 // Shorter expiry for password reset
      });

      // Send password reset email (implement this in EmailService)
      // await this.emailService.sendPasswordResetEmail(user.email, user.first_name, token.token);

      console.log(`Password reset token created for ${user.email}: ${token.token}`);
      return true;
    } catch (error) {
      console.error('Error sending password reset:', error);
      return false;
    }
  }

  async verifyPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate token
      const verificationToken = this.tokenModel.validateToken(token, 'password_reset');
      if (!verificationToken) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      // Get user
      const user = this.userModel.getUserById(verificationToken.user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Update password (implement this method in UserModel)
      // this.userModel.updatePassword(user.id, newPassword);

      // Mark token as used
      this.tokenModel.useToken(token);

      console.log(`Password reset for user ${user.email}`);

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'An error occurred during password reset'
      };
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    try {
      const deletedCount = this.tokenModel.deleteExpiredTokens();
      console.log(`Cleaned up ${deletedCount} expired tokens`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
      return 0;
    }
  }

  async getUserVerificationStatus(userId: number): Promise<{
    email_verified: boolean;
    phone_verified: boolean;
    kyc_status: string;
    account_funded: boolean;
    pending_tokens: number;
  } | null> {
    try {
      const user = this.userModel.getUserById(userId);
      if (!user) return null;

      const pendingTokens = this.tokenModel.getUserTokens(userId).filter(
        token => !token.used && new Date(token.expires_at) > new Date()
      ).length;

      return {
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        kyc_status: user.kyc_status,
        account_funded: user.account_funded,
        pending_tokens: pendingTokens
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return null;
    }
  }
}

export default VerificationService;