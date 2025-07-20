import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    // Initialize with environment variables
    const config: EmailConfig = {
      host: process.env.EMAIL_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    };

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@tradenet.im';
    this.transporter = nodemailer.createTransport(config);
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendVerificationEmail(email: string, firstName: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://www.tradenet.im'}/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - TradeNet.im</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TradeNet.im!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for registering with TradeNet.im! To complete your account setup, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify My Email</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            
            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
            
            <h3>What's Next?</h3>
            <ol>
              <li>Verify your email address</li>
              <li>Complete your profile information</li>
              <li>Upload required documents for account verification</li>
              <li>Wait for admin approval</li>
              <li>Get your account funded to start trading</li>
            </ol>
            
            <p>If you didn't create an account with TradeNet.im, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 TradeNet.im - Professional Trading Platform</p>
            <p>This email was sent to ${email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - TradeNet.im',
      html
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to TradeNet.im!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Account Verified!</h1>
          </div>
          <div class="content">
            <h2>Congratulations ${firstName}!</h2>
            <p>Your email has been successfully verified and your TradeNet.im account is now active.</p>
            
            <h3>Account Status:</h3>
            <ul>
              <li>✅ Email verified</li>
              <li>⭐ Account balance: $0.00</li>
              <li>⏳ Awaiting funding from admin</li>
            </ul>
            
            <p><strong>Next Steps:</strong></p>
            <p>Your account starts with a $0 balance for security reasons. An admin will review your account and add initial funding. You'll receive another email once your account has been funded and you can start trading.</p>
            
            <p>Login to your dashboard to complete your profile and upload any required documents.</p>
            
            <p>Welcome to the TradeNet.im community!</p>
          </div>
          <div class="footer">
            <p>© 2024 TradeNet.im - Professional Trading Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Welcome to TradeNet.im - Account Verified!',
      html
    });
  }

  async sendFundingNotification(email: string, firstName: string, amount: number): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Account Funded - TradeNet.im</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount { font-size: 2em; color: #10b981; font-weight: bold; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Account Funded!</h1>
          </div>
          <div class="content">
            <h2>Great news, ${firstName}!</h2>
            <p>Your TradeNet.im account has been funded by our admin team.</p>
            
            <div class="amount">$${amount.toLocaleString()}</div>
            
            <p>You can now start trading with your funded account. Login to your dashboard to explore the platform and begin your trading journey.</p>
            
            <p><strong>Ready to Start Trading:</strong></p>
            <ul>
              <li>✅ Account verified</li>
              <li>✅ Account funded</li>
              <li>🚀 Ready to trade</li>
            </ul>
            
            <p>Happy trading!</p>
          </div>
          <div class="footer">
            <p>© 2024 TradeNet.im - Professional Trading Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '💰 Your Account Has Been Funded - Start Trading Now!',
      html
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export default EmailService;