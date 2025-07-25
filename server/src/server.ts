import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import DatabaseManager from './models/Database';
import createAuthRoutes from './routes/auth';
import createAdminRoutes from './routes/admin';
import createUserRoutes from './routes/user';
import verificationRoutes from './routes/verification';
import createDebugRoutes from './routes/debug';
import proxyRoutes from './routes/proxy';
import healthRoutes from './routes/health';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Initialize database only if not using remote API
const useRemoteApi = process.env.USE_REMOTE_API === 'true';
const database = useRemoteApi ? null : new DatabaseManager();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - allow multiple origins for development flexibility
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://172.20.10.9:3000',
  'http://172.20.10.9:3002',
  'https://www.tradenet.im',
  'https://tradenet.im',
  'https://internet-banking-production-1364.up.railway.app'
];

// Add custom CORS_ORIGIN if provided
if (process.env.CORS_ORIGIN) {
  const customOrigins = process.env.CORS_ORIGIN.split(',');
  allowedOrigins.push(...customOrigins);
}

app.use(cors({
  origin: (origin, callback) => {
    console.log(`[CORS] Request from origin: ${origin || 'no-origin'}`);
    
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`[CORS] Origin ${origin} allowed`);
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CORS] Development mode - allowing all origins`);
      return callback(null, true);
    }
    
    // Block the request
    console.log(`[CORS] Origin ${origin} blocked. Allowed origins:`, allowedOrigins);
    const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Emergency registration endpoint - bypass all middleware
app.post('/emergency-register', express.json(), async (req, res) => {
  if (useRemoteApi) {
    return res.status(503).json({ 
      error: 'Service not available in proxy mode',
      message: 'Please use the main Railway API for registration'
    });
  }

  try {
    console.log('EMERGENCY REGISTER CALLED');
    const { email, password, first_name, last_name } = req.body;
    
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const db = database!.getDatabase();
    const bcrypt = (await import('bcryptjs')).default;
    
    // Check existing user
    const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const existing = existingStmt.get(email);
    if (existing) {
      return res.status(400).json({ error: 'User exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user
    const userStmt = db.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, status) 
      VALUES (?, ?, ?, ?, 'user', 'active')
    `);
    const userResult = userStmt.run(email, hashedPassword, first_name, last_name);
    
    // Create portfolio
    const portfolioStmt = db.prepare(`
      INSERT INTO portfolios (user_id, total_balance, portfolio_value, total_trades, win_rate) 
      VALUES (?, 0, 0, 0, 0)
    `);
    portfolioStmt.run(userResult.lastInsertRowid);
    
    console.log('EMERGENCY REGISTRATION SUCCESS:', email);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: userResult.lastInsertRowid
    });
    
  } catch (error) {
    console.error('EMERGENCY REGISTER ERROR:', error);
    res.status(500).json({ 
      error: 'Failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// API routes
console.log('[SERVER] Registering API routes...');

if (useRemoteApi) {
  console.log('[SERVER] Using remote Railway API proxy...');
  app.use('/api', proxyRoutes);
  console.log('[SERVER] Proxy routes registered for Railway API');
} else {
  console.log('[SERVER] Using local database routes...');
  app.use('/api/auth', createAuthRoutes(database!));
  console.log('[SERVER] Admin routes being registered...');
  app.use('/api/admin', createAdminRoutes(database!));
  console.log('[SERVER] Admin routes registered at /api/admin');
  app.use('/api/user', createUserRoutes(database!));
  app.use('/api/verification', verificationRoutes);
  app.use('/api/debug', createDebugRoutes(database!));
}

// Health routes are available regardless of proxy mode
app.use('/api', healthRoutes);
console.log('[SERVER] Health check routes registered at /api/health');

// API documentation endpoint
app.get('/api', (req, res) => {
  if (useRemoteApi) {
    return res.json({
      name: 'Trade.im API Proxy',
      version: '1.0.0',
      description: 'Proxy server for Railway-hosted trading platform API',
      mode: 'proxy',
      remote_api: process.env.RAILWAY_API_URL,
      message: 'All requests are proxied to the remote Railway API'
    });
  }

  res.json({
    name: 'Trade.im API',
    version: '1.0.0',
    description: 'Trading platform API with admin functionality',
    mode: 'local',
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          'POST /register - Register new user',
          'POST /login - User login',
          'POST /logout - User logout',
          'GET /me - Get current user',
          'POST /refresh - Refresh token',
          'POST /change-password - Change password'
        ]
      },
      user: {
        base: '/api/user',
        routes: [
          'GET /dashboard - Get dashboard data',
          'GET /profile - Get user profile',
          'PUT /profile - Update user profile',
          'GET /portfolio - Get user portfolio',
          'GET /transactions - Get user transactions',
          'POST /transactions/deposit - Create deposit',
          'POST /transactions/withdraw - Create withdrawal',
          'GET /market-data - Get market data',
          'GET /stats - Get account statistics'
        ]
      },
      admin: {
        base: '/api/admin',
        routes: [
          'GET /stats - Get admin dashboard stats',
          'GET /users - Get all users',
          'GET /users/:userId - Get user by ID',
          'PUT /users/:userId - Update user',
          'DELETE /users/:userId - Delete user',
          'PUT /users/:userId/status - Toggle user status',
          'POST /users/:userId/balance - Adjust user balance',
          'GET /users/:userId/transactions - Get user transactions',
          'POST /users/:userId/transactions - Create transaction',
          'GET /users/:userId/portfolio - Get user portfolio',
          'PUT /users/:userId/portfolio - Update user portfolio',
          'POST /users/:userId/portfolio/positions - Add portfolio position',
          'GET /transactions - Get all transactions',
          'GET /portfolios - Get all portfolios'
        ]
      },
      verification: {
        base: '/api/verification',
        routes: [
          'POST /send-email-verification - Send email verification',
          'GET /verify-email?token=... - Verify email with token',
          'POST /forgot-password - Send password reset email',
          'POST /reset-password - Reset password with token',
          'GET /status/:userId - Get user verification status',
          'POST /admin/verify-user-email - Admin verify user email',
          'POST /admin/cleanup-tokens - Cleanup expired tokens'
        ]
      }
    }
  });
});

// 404 handler for unmatched routes
app.use('*', (req: express.Request, res: express.Response) => {
  console.error(`[404] Route not found: ${req.method} ${req.originalUrl}`, {
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    query: req.query,
    body: req.body
  });
  
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    availableRoutes: {
      admin: '/api/admin/routes',
      api: '/api'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Handle different error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
  
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(400).json({
      error: 'Duplicate entry',
      message: 'A record with this data already exists'
    });
  }
  
  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (database) database.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (database) database.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (useRemoteApi) {
    console.log(`🔗 Mode: PROXY to Railway API`);
    console.log(`🛰️  Remote API: ${process.env.RAILWAY_API_URL}`);
  } else {
    console.log(`🗄️  Database: ${process.env.DB_PATH || './database/trading_platform.db'}`);
  }
  
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

export default app;