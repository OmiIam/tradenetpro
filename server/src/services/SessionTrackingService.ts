import Database from 'better-sqlite3';
import { Request } from 'express';
import DeviceDetector from 'device-detector-js';
import geoip from 'geoip-lite';
// Import types from the main types file
interface UserSessionDetail {
  id: number;
  session_id: number;
  user_id: number;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  device_name?: string;
  browser_name?: string;
  browser_version?: string;
  operating_system?: string;
  ip_address: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  is_mobile: boolean;
  user_agent?: string;
  screen_resolution?: string;
  language?: string;
  is_active: boolean;
  last_activity: string;
  login_method: 'password' | 'oauth' | '2fa' | 'biometric';
  created_at: string;
  ended_at?: string;
}

interface UserLoginHistory {
  id: number;
  user_id: number;
  login_type: 'success' | 'failed' | 'blocked' | 'suspicious';
  ip_address: string;
  device_fingerprint?: string;
  user_agent?: string;
  failure_reason?: string;
  country?: string;
  city?: string;
  is_suspicious: boolean;
  risk_score: number;
  created_at: string;
}

export interface SessionCreationData {
  user_id: number;
  token_hash: string;
  expires_at: string;
  request: Request;
}

export interface LoginAttemptData {
  user_id?: number;
  login_type: 'success' | 'failed' | 'blocked' | 'suspicious';
  failure_reason?: string;
  request: Request;
}

export class SessionTrackingService {
  private db: Database.Database;
  private deviceDetector: DeviceDetector;

  constructor(database: Database.Database) {
    this.db = database;
    this.deviceDetector = new DeviceDetector();
  }

  /**
   * Create a new session with detailed tracking information
   */
  public async createSession(data: SessionCreationData): Promise<number> {
    const { user_id, token_hash, expires_at, request } = data;

    // First create the basic session
    const sessionInsert = this.db.prepare(`
      INSERT INTO user_sessions (user_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `);
    
    const sessionResult = sessionInsert.run(user_id, token_hash, expires_at);
    const sessionId = sessionResult.lastInsertRowid as number;

    // Extract device and location information
    const sessionDetails = await this.extractSessionDetails(request, sessionId, user_id);

    // Insert detailed session information
    const detailsInsert = this.db.prepare(`
      INSERT INTO user_session_details (
        session_id, user_id, device_type, device_name, browser_name, browser_version,
        operating_system, ip_address, country, region, city, latitude, longitude,
        timezone, is_mobile, user_agent, screen_resolution, language, login_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    detailsInsert.run(
      sessionId,
      user_id,
      sessionDetails.device_type,
      sessionDetails.device_name,
      sessionDetails.browser_name,
      sessionDetails.browser_version,
      sessionDetails.operating_system,
      sessionDetails.ip_address,
      sessionDetails.country,
      sessionDetails.region,
      sessionDetails.city,
      sessionDetails.latitude,
      sessionDetails.longitude,
      sessionDetails.timezone,
      sessionDetails.is_mobile ? 1 : 0,
      sessionDetails.user_agent,
      sessionDetails.screen_resolution,
      sessionDetails.language,
      sessionDetails.login_method
    );

    // Log successful login
    await this.logLoginAttempt({
      user_id,
      login_type: 'success',
      request
    });

    return sessionId;
  }

  /**
   * Update session activity
   */
  public updateSessionActivity(sessionId: number): void {
    const updateActivity = this.db.prepare(`
      UPDATE user_session_details 
      SET last_activity = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `);
    
    updateActivity.run(sessionId);
  }

  /**
   * End a session
   */
  public endSession(sessionId: number): void {
    const endSession = this.db.prepare(`
      UPDATE user_session_details 
      SET is_active = FALSE, ended_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `);
    
    endSession.run(sessionId);
  }

  /**
   * Log login attempts (success, failed, blocked, suspicious)
   */
  public async logLoginAttempt(data: LoginAttemptData): Promise<void> {
    const { user_id, login_type, failure_reason, request } = data;

    // Extract device and location info
    const deviceInfo = this.extractDeviceInfo(request);
    const locationInfo = this.extractLocationInfo(request);
    const riskScore = this.calculateRiskScore(request, login_type);

    const loginInsert = this.db.prepare(`
      INSERT INTO user_login_history (
        user_id, login_type, ip_address, device_fingerprint, user_agent,
        failure_reason, country, city, is_suspicious, risk_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    loginInsert.run(
      user_id || null,
      login_type,
      this.getClientIP(request),
      this.generateDeviceFingerprint(request),
      request.get('User-Agent') || '',
      failure_reason || null,
      locationInfo.country,
      locationInfo.city,
      riskScore > 70 ? 1 : 0,
      riskScore
    );
  }

  /**
   * Get active sessions for a user
   */
  public getActiveSessions(userId: number): UserSessionDetail[] {
    const query = this.db.prepare(`
      SELECT usd.*, us.expires_at as session_expires_at
      FROM user_session_details usd
      JOIN user_sessions us ON usd.session_id = us.id
      WHERE usd.user_id = ? AND usd.is_active = TRUE
      ORDER BY usd.last_activity DESC
    `);

    return query.all(userId) as UserSessionDetail[];
  }

  /**
   * Get login history for a user
   */
  public getLoginHistory(userId: number, limit: number = 50): UserLoginHistory[] {
    const query = this.db.prepare(`
      SELECT * FROM user_login_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    return query.all(userId, limit) as UserLoginHistory[];
  }

  /**
   * Get suspicious login attempts
   */
  public getSuspiciousLogins(limit: number = 100): UserLoginHistory[] {
    const query = this.db.prepare(`
      SELECT ulh.*, u.email, u.first_name, u.last_name
      FROM user_login_history ulh
      LEFT JOIN users u ON ulh.user_id = u.id
      WHERE ulh.is_suspicious = TRUE OR ulh.risk_score > 70
      ORDER BY ulh.created_at DESC
      LIMIT ?
    `);

    return query.all(limit) as UserLoginHistory[];
  }

  /**
   * Get session analytics
   */
  public getSessionAnalytics(days: number = 30): {
    total_sessions: number;
    unique_users: number;
    avg_session_duration: number;
    mobile_percentage: number;
    top_countries: Array<{ country: string; count: number }>;
    top_devices: Array<{ device_type: string; count: number }>;
  } {
    const dateFilter = `datetime('now', '-${days} days')`;

    // Total sessions
    const totalSessions = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM user_session_details
      WHERE created_at >= ${dateFilter}
    `).get() as { count: number };

    // Unique users
    const uniqueUsers = this.db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_session_details
      WHERE created_at >= ${dateFilter}
    `).get() as { count: number };

    // Average session duration
    const avgDuration = this.db.prepare(`
      SELECT AVG(
        CASE 
          WHEN ended_at IS NOT NULL 
          THEN (julianday(ended_at) - julianday(created_at)) * 24 * 60
          ELSE (julianday('now') - julianday(last_activity)) * 24 * 60
        END
      ) as avg_minutes
      FROM user_session_details
      WHERE created_at >= ${dateFilter}
    `).get() as { avg_minutes: number };

    // Mobile percentage
    const mobileStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_mobile = TRUE THEN 1 ELSE 0 END) as mobile_count
      FROM user_session_details
      WHERE created_at >= ${dateFilter}
    `).get() as { total: number; mobile_count: number };

    // Top countries
    const topCountries = this.db.prepare(`
      SELECT country, COUNT(*) as count
      FROM user_session_details
      WHERE created_at >= ${dateFilter} AND country IS NOT NULL
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `).all() as Array<{ country: string; count: number }>;

    // Top devices
    const topDevices = this.db.prepare(`
      SELECT device_type, COUNT(*) as count
      FROM user_session_details
      WHERE created_at >= ${dateFilter}
      GROUP BY device_type
      ORDER BY count DESC
    `).all() as Array<{ device_type: string; count: number }>;

    return {
      total_sessions: totalSessions.count,
      unique_users: uniqueUsers.count,
      avg_session_duration: avgDuration.avg_minutes || 0,
      mobile_percentage: mobileStats.total > 0 ? (mobileStats.mobile_count / mobileStats.total) * 100 : 0,
      top_countries: topCountries,
      top_devices: topDevices
    };
  }

  /**
   * Extract detailed session information from request
   */
  private async extractSessionDetails(request: Request, sessionId: number, userId: number): Promise<Partial<UserSessionDetail>> {
    const deviceInfo = this.extractDeviceInfo(request);
    const locationInfo = this.extractLocationInfo(request);

    return {
      session_id: sessionId,
      user_id: userId,
      device_type: deviceInfo.device_type,
      device_name: deviceInfo.device_name,
      browser_name: deviceInfo.browser_name,
      browser_version: deviceInfo.browser_version,
      operating_system: deviceInfo.operating_system,
      ip_address: this.getClientIP(request),
      country: locationInfo.country,
      region: locationInfo.region,
      city: locationInfo.city,
      latitude: locationInfo.latitude,
      longitude: locationInfo.longitude,
      timezone: locationInfo.timezone,
      is_mobile: deviceInfo.is_mobile,
      user_agent: request.get('User-Agent') || '',
      screen_resolution: request.get('X-Screen-Resolution'),
      language: request.get('Accept-Language')?.split(',')[0] || 'en',
      login_method: 'password' // Default, can be enhanced
    };
  }

  /**
   * Extract device information from request
   */
  private extractDeviceInfo(request: Request): {
    device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    device_name?: string;
    browser_name?: string;
    browser_version?: string;
    operating_system?: string;
    is_mobile: boolean;
  } {
    const userAgent = request.get('User-Agent') || '';
    const device = this.deviceDetector.parse(userAgent);

    let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
    
    if (device.device?.type) {
      switch (device.device.type) {
        case 'desktop':
          deviceType = 'desktop';
          break;
        case 'smartphone':
          deviceType = 'mobile';
          break;
        case 'tablet':
          deviceType = 'tablet';
          break;
        default:
          deviceType = 'unknown';
      }
    } else if (device.client?.type === 'browser') {
      deviceType = 'desktop'; // Assume desktop if browser and no device type
    }

    return {
      device_type: deviceType,
      device_name: device.device?.brand && device.device?.model 
        ? `${device.device.brand} ${device.device.model}` 
        : undefined,
      browser_name: device.client?.name,
      browser_version: device.client?.version,
      operating_system: device.os?.name && device.os?.version 
        ? `${device.os.name} ${device.os.version}` 
        : device.os?.name,
      is_mobile: deviceType === 'mobile' || deviceType === 'tablet'
    };
  }

  /**
   * Extract location information from IP address
   */
  private extractLocationInfo(request: Request): {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  } {
    const ip = this.getClientIP(request);
    const geo = geoip.lookup(ip);

    if (!geo) {
      return {};
    }

    return {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      latitude: geo.ll[0],
      longitude: geo.ll[1],
      timezone: geo.timezone
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request: Request): string {
    const forwarded = request.get('X-Forwarded-For');
    const realIP = request.get('X-Real-IP');
    const clientIP = request.get('X-Client-IP');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return realIP || clientIP || request.connection.remoteAddress || request.ip || '127.0.0.1';
  }

  /**
   * Generate device fingerprint for tracking
   */
  private generateDeviceFingerprint(request: Request): string {
    const userAgent = request.get('User-Agent') || '';
    const acceptLanguage = request.get('Accept-Language') || '';
    const acceptEncoding = request.get('Accept-Encoding') || '';
    
    // Create a simple fingerprint based on headers
    const fingerprint = Buffer.from(
      `${userAgent}${acceptLanguage}${acceptEncoding}`
    ).toString('base64');

    return fingerprint.substring(0, 32); // Limit length
  }

  /**
   * Calculate risk score for login attempt
   */
  private calculateRiskScore(request: Request, loginType: string): number {
    let score = 0;

    // Base score for failed logins
    if (loginType === 'failed') {
      score += 30;
    } else if (loginType === 'blocked') {
      score += 50;
    }

    // Check for suspicious patterns
    const ip = this.getClientIP(request);
    const userAgent = request.get('User-Agent') || '';

    // Check for recent failed attempts from same IP
    const recentFailures = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM user_login_history
      WHERE ip_address = ? 
      AND login_type = 'failed'
      AND created_at > datetime('now', '-1 hour')
    `).get(ip) as { count: number };

    score += Math.min(recentFailures.count * 10, 40);

    // Check for suspicious user agent patterns
    if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.length < 20) {
      score += 25;
    }

    // Check for VPN/Proxy indicators (simplified)
    const geo = geoip.lookup(ip);
    if (!geo) {
      score += 15; // Unknown location
    }

    // Check for unusual login times (simplified - could be enhanced with user patterns)
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 6) {
      score += 10; // Late night/early morning
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Clean up old session data
   */
  public cleanupOldSessions(daysToKeep: number = 90): number {
    const deleteOldSessions = this.db.prepare(`
      DELETE FROM user_session_details
      WHERE created_at < datetime('now', '-${daysToKeep} days')
    `);

    const result = deleteOldSessions.run();
    return result.changes;
  }

  /**
   * Get session statistics for admin dashboard
   */
  public getSessionStats(): {
    active_sessions: number;
    unique_devices: number;
    suspicious_logins_today: number;
    top_locations: Array<{ location: string; count: number }>;
  } {
    // Active sessions
    const activeSessions = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM user_session_details
      WHERE is_active = TRUE
    `).get() as { count: number };

    // Unique devices today
    const uniqueDevices = this.db.prepare(`
      SELECT COUNT(DISTINCT device_fingerprint) as count
      FROM user_login_history
      WHERE DATE(created_at) = DATE('now')
    `).get() as { count: number };

    // Suspicious logins today
    const suspiciousLogins = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM user_login_history
      WHERE DATE(created_at) = DATE('now')
      AND (is_suspicious = TRUE OR risk_score > 70)
    `).get() as { count: number };

    // Top locations
    const topLocations = this.db.prepare(`
      SELECT 
        CASE 
          WHEN city IS NOT NULL AND country IS NOT NULL 
          THEN city || ', ' || country
          WHEN country IS NOT NULL 
          THEN country
          ELSE 'Unknown'
        END as location,
        COUNT(*) as count
      FROM user_session_details
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY location
      ORDER BY count DESC
      LIMIT 5
    `).all() as Array<{ location: string; count: number }>;

    return {
      active_sessions: activeSessions.count,
      unique_devices: uniqueDevices.count,
      suspicious_logins_today: suspiciousLogins.count,
      top_locations: topLocations
    };
  }
}

export default SessionTrackingService;