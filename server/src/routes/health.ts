import { Router, Request, Response } from 'express';
import { performance } from 'perf_hooks';
import DatabaseManager from '../models/Database';

const router = Router();

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'warning' | 'critical';
      usage: {
        used: number;
        total: number;
        percentage: number;
      };
    };
    system: {
      status: 'healthy' | 'degraded';
      loadAverage?: number[];
      freeMemory: number;
      totalMemory: number;
    };
  };
}

// Health check endpoint for admin dashboard
router.get('/health', async (req: Request, res: Response) => {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();
  
  console.log(`[HEALTH] Health check requested at ${timestamp}`);
  
  try {
    const healthCheck: HealthCheckResponse = {
      status: 'healthy',
      timestamp,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: await checkDatabase(),
        memory: checkMemory(),
        system: checkSystem()
      }
    };

    // Determine overall health status
    const checks = Object.values(healthCheck.checks);
    if (checks.some(check => check.status === 'unhealthy' || check.status === 'critical')) {
      healthCheck.status = 'unhealthy';
    } else if (checks.some(check => check.status === 'degraded' || check.status === 'warning')) {
      healthCheck.status = 'degraded';
    }

    const responseTime = Math.round(performance.now() - startTime);
    console.log(`[HEALTH] Health check completed in ${responseTime}ms - Status: ${healthCheck.status}`);

    // Set appropriate HTTP status based on health
    const httpStatus = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json({
      ...healthCheck,
      responseTime
    });

  } catch (error) {
    console.error('[HEALTH] Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Math.round(performance.now() - startTime)
    });
  }
});

// Detailed health check for admin monitoring
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const detailedHealth = {
      timestamp: new Date().toISOString(),
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      },
      memory: {
        ...process.memoryUsage(),
        system: {
          free: require('os').freemem(),
          total: require('os').totalmem()
        }
      },
      database: await getDatabaseInfo(),
      performance: {
        responseTime: 0 // Will be calculated at the end
      }
    };

    res.json(detailedHealth);
  } catch (error) {
    console.error('[HEALTH] Detailed health check failed:', error);
    res.status(500).json({
      error: 'Failed to generate detailed health report',
      timestamp: new Date().toISOString()
    });
  }
});

// Database health check
async function checkDatabase() {
  const startTime = performance.now();
  
  try {
    const database = DatabaseManager.getInstance();
    const db = database.getDatabase();
    
    // Simple query to test database connectivity
    const result = db.prepare('SELECT 1 as test').get();
    const responseTime = Math.round(performance.now() - startTime);
    
    if (result && result.test === 1) {
      return {
        status: 'healthy' as const,
        responseTime
      };
    } else {
      return {
        status: 'unhealthy' as const,
        responseTime,
        error: 'Database query returned unexpected result'
      };
    }
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    return {
      status: 'unhealthy' as const,
      responseTime,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

// Memory health check
function checkMemory() {
  const memUsage = process.memoryUsage();
  const totalMemory = require('os').totalmem();
  const usedMemory = memUsage.heapUsed;
  const percentage = (usedMemory / totalMemory) * 100;
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (percentage > 90) {
    status = 'critical';
  } else if (percentage > 75) {
    status = 'warning';
  }
  
  return {
    status,
    usage: {
      used: usedMemory,
      total: totalMemory,
      percentage: Math.round(percentage * 100) / 100
    }
  };
}

// System health check
function checkSystem() {
  const os = require('os');
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();
  const loadAverage = os.loadavg();
  
  // Consider system degraded if load average is high
  const status = loadAverage[0] > os.cpus().length * 2 ? 'degraded' : 'healthy';
  
  return {
    status: status as 'healthy' | 'degraded',
    loadAverage,
    freeMemory,
    totalMemory
  };
}

// Get detailed database information
async function getDatabaseInfo() {
  try {
    const database = DatabaseManager.getInstance();
    const db = database.getDatabase();
    
    // Get database statistics
    const stats = {
      users: db.prepare('SELECT COUNT(*) as count FROM users').get(),
      transactions: db.prepare('SELECT COUNT(*) as count FROM transactions').get(),
      portfolios: db.prepare('SELECT COUNT(*) as count FROM portfolios').get()
    };
    
    return {
      status: 'connected',
      statistics: stats,
      filename: database.getDatabasePath()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

// Admin system status endpoint
router.get('/admin/system-status', async (req: Request, res: Response) => {
  try {
    const database = DatabaseManager.getInstance();
    const db = database.getDatabase();
    
    // Get system statistics
    const stats = {
      users: {
        total: db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0,
        active: db.prepare('SELECT COUNT(*) as count FROM users WHERE status = ?').get('active')?.count || 0,
        lastHour: db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at > datetime("now", "-1 hour")').get()?.count || 0
      },
      transactions: {
        total: db.prepare('SELECT COUNT(*) as count FROM transactions').get()?.count || 0,
        today: db.prepare('SELECT COUNT(*) as count FROM transactions WHERE date(created_at) = date("now")').get()?.count || 0,
        lastHour: db.prepare('SELECT COUNT(*) as count FROM transactions WHERE created_at > datetime("now", "-1 hour")').get()?.count || 0
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('[HEALTH] System status error:', error);
    res.status(500).json({
      error: 'Failed to retrieve system status',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;