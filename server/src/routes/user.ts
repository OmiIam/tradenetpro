import express from 'express';
import UserController from '../controllers/user';
import { authenticateToken, requireUser } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { body } from 'express-validator';
import DatabaseManager from '../models/Database';
import rateLimit from 'express-rate-limit';
import createKYCRoutes from './kyc';

const router = express.Router();

// Rate limiting for user routes
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Transaction rate limiting
const transactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 transactions per hour
  message: 'Too many transactions, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export default function createUserRoutes(database: DatabaseManager) {
  const userController = new UserController(database);

  // Apply authentication to all routes
  router.use(authenticateToken);
  router.use(requireUser);
  router.use(userLimiter);

  // Dashboard and Profile
  router.get('/dashboard', async (req: express.Request, res: express.Response) => {
    await userController.getDashboardStats(req, res);
  });

  router.get('/profile', async (req: express.Request, res: express.Response) => {
    await userController.getProfile(req, res);
  });

  router.put('/profile', [
    body('first_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('last_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('phone_number')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Phone number must be less than 20 characters'),
    body('country')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Country must be less than 100 characters'),
    body('timezone')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Timezone must be less than 50 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    body('address_line_1')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Address line 1 must be less than 255 characters'),
    body('address_line_2')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Address line 2 must be less than 255 characters'),
    body('city')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    body('state')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('State must be less than 100 characters'),
    body('postal_code')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Postal code must be less than 20 characters'),
    body('notification_email')
      .optional()
      .isBoolean()
      .withMessage('Email notification preference must be a boolean'),
    body('notification_push')
      .optional()
      .isBoolean()
      .withMessage('Push notification preference must be a boolean'),
    body('notification_sms')
      .optional()
      .isBoolean()
      .withMessage('SMS notification preference must be a boolean'),
    body('two_factor_enabled')
      .optional()
      .isBoolean()
      .withMessage('Two factor authentication setting must be a boolean'),
  ], async (req: express.Request, res: express.Response) => {
    await userController.updateProfile(req, res);
  });

  // Portfolio
  router.get('/portfolio', async (req: express.Request, res: express.Response) => {
    await userController.getPortfolio(req, res);
  });

  // Transactions
  router.get('/transactions', validatePagination, async (req: express.Request, res: express.Response) => {
    await userController.getTransactions(req, res);
  });

  router.post('/transactions/deposit', transactionLimiter, [
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be greater than 0'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Description must be less than 255 characters'),
  ], async (req: express.Request, res: express.Response) => {
    await userController.createDeposit(req, res);
  });

  router.post('/transactions/withdraw', transactionLimiter, [
    body('amount')
      .isFloat({ gt: 0 })
      .withMessage('Amount must be greater than 0'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Description must be less than 255 characters'),
  ], async (req: express.Request, res: express.Response) => {
    await userController.createWithdrawal(req, res);
  });

  // Market Data
  router.get('/market-data', async (req: express.Request, res: express.Response) => {
    await userController.getMarketData(req, res);
  });

  // Account Statistics
  router.get('/stats', async (req: express.Request, res: express.Response) => {
    await userController.getAccountStats(req, res);
  });

  // KYC Routes
  router.use('/kyc', createKYCRoutes(database.getDatabase()));

  return router;
}