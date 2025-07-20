import Database from 'better-sqlite3';
import crypto from 'crypto';

export interface VerificationToken {
  id: number;
  user_id: number;
  token: string;
  type: 'email' | 'phone' | 'password_reset';
  expires_at: string;
  used: boolean;
  created_at: string;
  used_at?: string;
}

export interface CreateTokenData {
  user_id: number;
  type: 'email' | 'phone' | 'password_reset';
  expires_in_hours?: number;
}

export class VerificationTokenModel {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  createToken(data: CreateTokenData): VerificationToken {
    const token = this.generateToken();
    const expiresInHours = data.expires_in_hours || 24; // Default 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const stmt = this.db.prepare(`
      INSERT INTO verification_tokens (user_id, token, type, expires_at)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.user_id,
      token,
      data.type,
      expiresAt.toISOString()
    );

    return this.getTokenById(result.lastInsertRowid as number)!;
  }

  getTokenById(id: number): VerificationToken | null {
    const stmt = this.db.prepare('SELECT * FROM verification_tokens WHERE id = ?');
    return stmt.get(id) as VerificationToken | null;
  }

  getTokenByValue(token: string): VerificationToken | null {
    const stmt = this.db.prepare('SELECT * FROM verification_tokens WHERE token = ? AND used = FALSE');
    return stmt.get(token) as VerificationToken | null;
  }

  validateToken(token: string, type: 'email' | 'phone' | 'password_reset'): VerificationToken | null {
    const stmt = this.db.prepare(`
      SELECT * FROM verification_tokens 
      WHERE token = ? AND type = ? AND used = FALSE AND expires_at > datetime('now')
    `);
    return stmt.get(token, type) as VerificationToken | null;
  }

  useToken(token: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE verification_tokens 
      SET used = TRUE, used_at = datetime('now') 
      WHERE token = ? AND used = FALSE
    `);
    const result = stmt.run(token);
    return result.changes > 0;
  }

  deleteExpiredTokens(): number {
    const stmt = this.db.prepare(`
      DELETE FROM verification_tokens 
      WHERE expires_at < datetime('now')
    `);
    const result = stmt.run();
    return result.changes;
  }

  getUserTokens(userId: number, type?: 'email' | 'phone' | 'password_reset'): VerificationToken[] {
    let query = 'SELECT * FROM verification_tokens WHERE user_id = ?';
    const params: any[] = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as VerificationToken[];
  }

  // Clean up old tokens (can be called periodically)
  cleanupOldTokens(daysOld: number = 30): number {
    const stmt = this.db.prepare(`
      DELETE FROM verification_tokens 
      WHERE created_at < datetime('now', '-${daysOld} days')
    `);
    const result = stmt.run();
    return result.changes;
  }
}

export default VerificationTokenModel;