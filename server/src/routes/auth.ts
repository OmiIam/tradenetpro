import express from 'express';
import AuthController from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';
import { validateRegistration, validateLogin } from '../middleware/validation';
import DatabaseManager from '../models/Database';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs (increased for testing)
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient rate limiting for registration during testing
const registerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 registration attempts per 5 minutes
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 login attempts per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export default function createAuthRoutes(database: DatabaseManager) {
  const authController = new AuthController(database);

  // Public routes
  router.post('/register', registerLimiter, validateRegistration, async (req: express.Request, res: express.Response) => {
    await authController.register(req, res);
  });

  router.post('/login', loginLimiter, validateLogin, async (req: express.Request, res: express.Response) => {
    await authController.login(req, res);
  });

  router.post('/refresh', authLimiter, async (req: express.Request, res: express.Response) => {
    await authController.refreshToken(req, res);
  });

  router.post('/forgot-password', authLimiter, async (req: express.Request, res: express.Response) => {
    await authController.forgotPassword(req, res);
  });

  router.post('/reset-password', authLimiter, async (req: express.Request, res: express.Response) => {
    await authController.resetPassword(req, res);
  });

  // Protected routes
  router.post('/logout', authenticateToken, async (req: express.Request, res: express.Response) => {
    await authController.logout(req, res);
  });

  router.get('/me', authenticateToken, async (req: express.Request, res: express.Response) => {
    await authController.getMe(req, res);
  });

  router.post('/change-password', authenticateToken, async (req: express.Request, res: express.Response) => {
    await authController.changePassword(req, res);
  });

  return router;
}