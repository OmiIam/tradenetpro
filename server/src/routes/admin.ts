import express from 'express';
import AdminController from '../controllers/admin';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  validateUserId,
  validateUserUpdate,
  validateUserStatus,
  validateBalanceAdjustment,
  validatePortfolioUpdate,
  validatePositionCreate,
  validateTransactionCreate,
  validatePagination
} from '../middleware/validation';
import DatabaseManager from '../models/Database';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: 'Too many admin requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export default function createAdminRoutes(database: DatabaseManager) {
  const adminController = new AdminController(database);

  // Debug logging middleware
  router.use((req, res, next) => {
    console.log(`[ADMIN ROUTER] ${req.method} ${req.path}`, {
      query: req.query,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent')
    });
    next();
  });

  // Apply authentication and admin role check to all routes
  router.use(authenticateToken);
  router.use(requireAdmin);
  router.use(adminLimiter);

  // Dashboard and Statistics
  router.get('/stats', async (req: express.Request, res: express.Response) => {
    await adminController.getDashboardStats(req, res);
  });

  // Admin metadata endpoint
  router.get('/me', async (req: express.Request, res: express.Response) => {
    await adminController.getAdminMetadata(req, res);
  });

  // Debug endpoint to list all available admin routes
  router.get('/routes', (req: express.Request, res: express.Response) => {
    const routes = [
      'GET /api/admin/stats',
      'GET /api/admin/routes',
      'GET /api/admin/users',
      'GET /api/admin/users-with-portfolios',
      'GET /api/admin/users/:userId',
      'PUT /api/admin/users/:userId',
      'DELETE /api/admin/users/:userId',
      'PUT /api/admin/users/:userId/status',
      'POST /api/admin/users/:userId/balance',
      'GET /api/admin/users/:userId/portfolio',
      'PUT /api/admin/users/:userId/portfolio',
      'POST /api/admin/users/:userId/portfolio/positions',
      'GET /api/admin/users/:userId/transactions',
      'POST /api/admin/users/:userId/transactions',
      'GET /api/admin/transactions',
      'GET /api/admin/portfolios',
      'GET /api/admin/kyc/stats',
      'GET /api/admin/kyc/documents',
      'GET /api/admin/kyc/documents/:documentId',
      'POST /api/admin/kyc/documents/:documentId/verify',
      'GET /api/admin/kyc/documents/:documentId/download',
      'GET /api/admin/audit-logs',
      'POST /api/admin/audit-logs',
      'GET /api/admin/suspensions',
      'GET /api/admin/suspensions/stats',
      'POST /api/admin/suspensions/process-expired',
      'GET /api/admin/suspensions/:suspensionId',
      'POST /api/admin/suspensions',
      'PUT /api/admin/suspensions/:suspensionId',
      'POST /api/admin/suspensions/:suspensionId/lift',
      'DELETE /api/admin/suspensions/:suspensionId',
      'GET /api/admin/users/:userId/suspension',
      'GET /api/admin/notifications',
      'GET /api/admin/notifications/stats',
      'GET /api/admin/notifications/unread-count',
      'GET /api/admin/notifications/categories',
      'POST /api/admin/notifications/cleanup',
      'GET /api/admin/notifications/:notificationId',
      'POST /api/admin/notifications',
      'PUT /api/admin/notifications/:notificationId',
      'POST /api/admin/notifications/:notificationId/mark-read',
      'POST /api/admin/notifications/mark-multiple-read',
      'POST /api/admin/notifications/mark-all-read',
      'DELETE /api/admin/notifications/:notificationId',
      'GET /api/admin/settings',
      'GET /api/admin/settings/public',
      'GET /api/admin/settings/categories',
      'GET /api/admin/settings/:key',
      'POST /api/admin/settings',
      'PUT /api/admin/settings/:key',
      'POST /api/admin/settings/bulk',
      'DELETE /api/admin/settings/:key'
    ];
    
    res.json({
      message: 'Available admin routes',
      routes,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // User Management
  router.get('/users', validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getAllUsers(req, res);
  });

  // User search endpoint
  router.get('/users/search', async (req: express.Request, res: express.Response) => {
    await adminController.searchUsers(req, res);
  });

  // Optimized endpoint that includes portfolio data to avoid N+1 queries
  router.get('/users-with-portfolios', validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getAllUsersWithPortfolios(req, res);
  });

  router.get('/users/:userId', validateUserId, async (req: express.Request, res: express.Response) => {
    await adminController.getUserById(req, res);
  });

  router.put('/users/:userId', validateUserUpdate, async (req: express.Request, res: express.Response) => {
    await adminController.updateUser(req, res);
  });

  router.delete('/users/:userId', validateUserId, async (req: express.Request, res: express.Response) => {
    await adminController.deleteUser(req, res);
  });

  router.put('/users/:userId/status', validateUserStatus, async (req: express.Request, res: express.Response) => {
    await adminController.toggleUserStatus(req, res);
  });

  // Balance Management
  router.post('/users/:userId/balance', validateBalanceAdjustment, async (req: express.Request, res: express.Response) => {
    await adminController.adjustUserBalance(req, res);
  });

  router.get('/users/:userId/transactions', validateUserId, validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getUserTransactions(req, res);
  });

  router.post('/users/:userId/transactions', validateTransactionCreate, async (req: express.Request, res: express.Response) => {
    await adminController.createTransaction(req, res);
  });

  // Portfolio Management
  router.get('/users/:userId/portfolio', validateUserId, async (req: express.Request, res: express.Response) => {
    await adminController.getUserPortfolio(req, res);
  });

  router.put('/users/:userId/portfolio', validatePortfolioUpdate, async (req: express.Request, res: express.Response) => {
    await adminController.updateUserPortfolio(req, res);
  });

  router.post('/users/:userId/portfolio/positions', validatePositionCreate, async (req: express.Request, res: express.Response) => {
    await adminController.addPortfolioPosition(req, res);
  });

  // Global Data Access
  router.get('/transactions', validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getAllTransactions(req, res);
  });

  router.get('/portfolios', validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getAllPortfolios(req, res);
  });

  // KYC Management Routes
  router.get('/kyc/stats', async (req: express.Request, res: express.Response) => {
    await adminController.getKYCStats(req, res);
  });

  // KYC alias endpoint for frontend compatibility
  router.get('/kyc', validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getAllKYCDocuments(req, res);
  });

  router.get('/kyc/documents', validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getAllKYCDocuments(req, res);
  });

  router.get('/kyc/documents/:documentId', async (req: express.Request, res: express.Response) => {
    await adminController.getKYCDocumentById(req, res);
  });

  router.post('/kyc/documents/:documentId/verify', async (req: express.Request, res: express.Response) => {
    await adminController.verifyKYCDocument(req, res);
  });

  router.get('/kyc/documents/:documentId/download', async (req: express.Request, res: express.Response) => {
    await adminController.downloadKYCDocument(req, res);
  });

  // Audit Logs Management
  router.get('/audit-logs', validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getAuditLogs(req, res);
  });

  router.post('/audit-logs', async (req: express.Request, res: express.Response) => {
    await adminController.createAuditLog(req, res);
  });

  // User Suspension/Ban Management Routes
  router.get('/suspensions', validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getSuspensions(req, res);
  });

  router.get('/suspensions/stats', async (req: express.Request, res: express.Response) => {
    await adminController.getSuspensionStats(req, res);
  });

  router.post('/suspensions/process-expired', async (req: express.Request, res: express.Response) => {
    await adminController.processExpiredSuspensions(req, res);
  });

  router.get('/suspensions/:suspensionId', async (req: express.Request, res: express.Response) => {
    await adminController.getSuspension(req, res);
  });

  router.post('/suspensions', async (req: express.Request, res: express.Response) => {
    await adminController.createSuspension(req, res);
  });

  router.put('/suspensions/:suspensionId', async (req: express.Request, res: express.Response) => {
    await adminController.updateSuspension(req, res);
  });

  router.post('/suspensions/:suspensionId/lift', async (req: express.Request, res: express.Response) => {
    await adminController.liftSuspension(req, res);
  });

  router.delete('/suspensions/:suspensionId', async (req: express.Request, res: express.Response) => {
    await adminController.deleteSuspension(req, res);
  });

  router.get('/users/:userId/suspension', async (req: express.Request, res: express.Response) => {
    await adminController.getUserActiveSuspension(req, res);
  });

  // Admin Notifications Management Routes
  router.get('/notifications', validatePagination, async (req: express.Request, res: express.Response) => {
    await adminController.getNotifications(req, res);
  });

  router.get('/notifications/stats', async (req: express.Request, res: express.Response) => {
    await adminController.getNotificationStats(req, res);
  });

  router.get('/notifications/unread-count', async (req: express.Request, res: express.Response) => {
    await adminController.getUnreadNotificationCount(req, res);
  });

  router.get('/notifications/categories', async (req: express.Request, res: express.Response) => {
    await adminController.getNotificationsByCategory(req, res);
  });

  router.post('/notifications/cleanup', async (req: express.Request, res: express.Response) => {
    await adminController.cleanupOldNotifications(req, res);
  });

  router.get('/notifications/:notificationId', async (req: express.Request, res: express.Response) => {
    await adminController.getNotification(req, res);
  });

  router.post('/notifications', async (req: express.Request, res: express.Response) => {
    await adminController.createNotification(req, res);
  });

  router.put('/notifications/:notificationId', async (req: express.Request, res: express.Response) => {
    await adminController.updateNotification(req, res);
  });

  router.post('/notifications/:notificationId/mark-read', async (req: express.Request, res: express.Response) => {
    await adminController.markNotificationAsRead(req, res);
  });

  router.post('/notifications/mark-multiple-read', async (req: express.Request, res: express.Response) => {
    await adminController.markMultipleNotificationsAsRead(req, res);
  });

  router.post('/notifications/mark-all-read', async (req: express.Request, res: express.Response) => {
    await adminController.markAllNotificationsAsRead(req, res);
  });

  router.delete('/notifications/:notificationId', async (req: express.Request, res: express.Response) => {
    await adminController.deleteNotification(req, res);
  });

  // System Settings Management Routes
  router.get('/settings', async (req: express.Request, res: express.Response) => {
    await adminController.getSettings(req, res);
  });

  router.get('/settings/public', async (req: express.Request, res: express.Response) => {
    await adminController.getPublicSettings(req, res);
  });

  router.get('/settings/categories', async (req: express.Request, res: express.Response) => {
    await adminController.getSettingsByCategory(req, res);
  });

  router.get('/settings/:key', async (req: express.Request, res: express.Response) => {
    await adminController.getSetting(req, res);
  });

  router.post('/settings', async (req: express.Request, res: express.Response) => {
    await adminController.createSetting(req, res);
  });

  router.put('/settings/:key', async (req: express.Request, res: express.Response) => {
    await adminController.updateSetting(req, res);
  });

  router.post('/settings/bulk', async (req: express.Request, res: express.Response) => {
    await adminController.updateMultipleSettings(req, res);
  });

  router.delete('/settings/:key', async (req: express.Request, res: express.Response) => {
    await adminController.deleteSetting(req, res);
  });

  console.log(`[ADMIN] Admin routes registered successfully, including KYC management, /users-with-portfolios, system settings, user suspensions, and admin notifications`);
  return router;
}