import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'inactive' | 'pending_verification' | 'pending_approval';
  email_verified: boolean;
  phone_verified: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected' | 'under_review';
  account_funded: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  verified_at?: string;
  approved_at?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  role?: 'user' | 'admin';
  terms_accepted?: boolean;
  privacy_accepted?: boolean;
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended' | 'inactive' | 'pending_verification' | 'pending_approval';
  email_verified?: boolean;
  phone_verified?: boolean;
  kyc_status?: 'pending' | 'approved' | 'rejected' | 'under_review';
  account_funded?: boolean;
}

export class UserModel {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const stmt = this.db.prepare(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone_number, 
        date_of_birth, address_line_1, address_line_2, city, state, 
        postal_code, country, role, terms_accepted, privacy_accepted
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userData.email,
      hashedPassword,
      userData.first_name,
      userData.last_name,
      userData.phone_number || null,
      userData.date_of_birth || null,
      userData.address_line_1 || null,
      userData.address_line_2 || null,
      userData.city || null,
      userData.state || null,
      userData.postal_code || null,
      userData.country || null,
      userData.role || 'user',
      userData.terms_accepted || false,
      userData.privacy_accepted || false
    );

    // Create a portfolio for the new user
    const portfolioStmt = this.db.prepare(`
      INSERT INTO portfolios (user_id, total_balance, portfolio_value)
      VALUES (?, ?, ?)
    `);
    
    portfolioStmt.run(result.lastInsertRowid, 0, 0); // Start with $0 balance - admin must fund account

    return this.getUserById(result.lastInsertRowid as number)!;
  }

  getUserById(id: number): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | null;
  }

  getUserByEmail(email: string): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | null;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password_hash);
  }

  updateLastLogin(userId: number): void {
    const stmt = this.db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(userId);
  }

  getAllUsers(limit: number = 50, offset: number = 0): User[] {
    const stmt = this.db.prepare(`
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as User[];
  }

  getUsersCount(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  updateUser(userId: number, userData: UpdateUserData): User | null {
    const updateFields: string[] = [];
    const values: any[] = [];

    // Basic fields
    if (userData.email !== undefined) {
      updateFields.push('email = ?');
      values.push(userData.email);
    }
    if (userData.first_name !== undefined) {
      updateFields.push('first_name = ?');
      values.push(userData.first_name);
    }
    if (userData.last_name !== undefined) {
      updateFields.push('last_name = ?');
      values.push(userData.last_name);
    }
    if (userData.phone_number !== undefined) {
      updateFields.push('phone_number = ?');
      values.push(userData.phone_number);
    }
    if (userData.date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      values.push(userData.date_of_birth);
    }

    // Address fields
    if (userData.address_line_1 !== undefined) {
      updateFields.push('address_line_1 = ?');
      values.push(userData.address_line_1);
    }
    if (userData.address_line_2 !== undefined) {
      updateFields.push('address_line_2 = ?');
      values.push(userData.address_line_2);
    }
    if (userData.city !== undefined) {
      updateFields.push('city = ?');
      values.push(userData.city);
    }
    if (userData.state !== undefined) {
      updateFields.push('state = ?');
      values.push(userData.state);
    }
    if (userData.postal_code !== undefined) {
      updateFields.push('postal_code = ?');
      values.push(userData.postal_code);
    }
    if (userData.country !== undefined) {
      updateFields.push('country = ?');
      values.push(userData.country);
    }

    // System fields
    if (userData.role !== undefined) {
      updateFields.push('role = ?');
      values.push(userData.role);
    }
    if (userData.status !== undefined) {
      updateFields.push('status = ?');
      values.push(userData.status);
    }

    // Verification fields
    if (userData.email_verified !== undefined) {
      updateFields.push('email_verified = ?');
      values.push(userData.email_verified);
      if (userData.email_verified) {
        updateFields.push('verified_at = CURRENT_TIMESTAMP');
      }
    }
    if (userData.phone_verified !== undefined) {
      updateFields.push('phone_verified = ?');
      values.push(userData.phone_verified);
    }
    if (userData.kyc_status !== undefined) {
      updateFields.push('kyc_status = ?');
      values.push(userData.kyc_status);
      if (userData.kyc_status === 'approved') {
        updateFields.push('approved_at = CURRENT_TIMESTAMP');
      }
    }
    if (userData.account_funded !== undefined) {
      updateFields.push('account_funded = ?');
      values.push(userData.account_funded);
    }

    if (updateFields.length === 0) {
      return this.getUserById(userId);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const stmt = this.db.prepare(`
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);

    stmt.run(...values);
    return this.getUserById(userId);
  }

  deleteUser(userId: number): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(userId);
    return result.changes > 0;
  }

  toggleUserStatus(userId: number, status: 'active' | 'suspended'): User | null {
    const stmt = this.db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(status, userId);
    return this.getUserById(userId);
  }

  getUserStats(): { total: number; active: number; suspended: number; inactive: number } {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
      FROM users
    `);
    return stmt.get() as { total: number; active: number; suspended: number; inactive: number };
  }
}

export default UserModel;