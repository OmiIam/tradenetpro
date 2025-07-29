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
  timezone?: string;
  bio?: string;
  profile_picture?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended' | 'inactive' | 'pending_verification' | 'pending_approval';
  email_verified?: boolean;
  phone_verified?: boolean;
  kyc_status?: 'pending' | 'approved' | 'rejected' | 'under_review';
  account_funded?: boolean;
  two_factor_enabled?: boolean;
  notification_email?: boolean;
  notification_push?: boolean;
  notification_sms?: boolean;
}

export class UserModel {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    console.log('UserModel.createUser called with:', userData);
    
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      console.log('Password hashed successfully');
      
      // Use minimal required fields only, matching database schema
      const stmt = this.db.prepare(`
        INSERT INTO users (
          email, 
          password_hash, 
          first_name, 
          last_name, 
          role, 
          status,
          email_verified,
          phone_verified,
          terms_accepted,
          privacy_accepted,
          account_funded
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      console.log('SQL statement prepared');

      // Ensure all values are proper SQLite types (strings, numbers, null)
      const result = stmt.run(
        String(userData.email),
        String(hashedPassword),
        String(userData.first_name),
        String(userData.last_name),
        String(userData.role || 'user'),
        'active',  // status as string
        0,         // email_verified as 0/1 integer
        0,         // phone_verified as 0/1 integer  
        1,         // terms_accepted as 1 (assuming they accepted)
        1,         // privacy_accepted as 1 (assuming they accepted)
        0          // account_funded as 0/1 integer
      );
      console.log('User inserted with ID:', result.lastInsertRowid);

      // Create a portfolio for the new user with all required fields
      const portfolioStmt = this.db.prepare(`
        INSERT INTO portfolios (user_id, total_balance, portfolio_value, total_trades, win_rate)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const portfolioResult = portfolioStmt.run(
        Number(result.lastInsertRowid), 
        0,  // total_balance
        0,  // portfolio_value
        0,  // total_trades
        0   // win_rate
      );
      console.log('Portfolio created for user:', result.lastInsertRowid);

      const newUser = this.getUserById(result.lastInsertRowid as number);
      console.log('Retrieved created user:', newUser?.email);
      
      if (!newUser) {
        throw new Error('Failed to retrieve newly created user');
      }
      
      return newUser;
    } catch (error) {
      console.error('Error in UserModel.createUser:', {
        error,
        userData: { ...userData, password: '[REDACTED]' },
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
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

  getAllUsersWithPortfolios(limit: number = 50, offset: number = 0): (User & {
    total_balance?: number;
    portfolio_value?: number;
    total_trades?: number;
    win_rate?: number;
  })[] {
    const stmt = this.db.prepare(`
      SELECT 
        u.*,
        p.total_balance,
        p.portfolio_value,
        p.total_trades,
        p.win_rate
      FROM users u
      LEFT JOIN portfolios p ON u.id = p.user_id
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as (User & {
      total_balance?: number;
      portfolio_value?: number;
      total_trades?: number;
      win_rate?: number;
    })[];
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

    // Profile fields
    if (userData.timezone !== undefined) {
      updateFields.push('timezone = ?');
      values.push(userData.timezone);
    }
    if (userData.bio !== undefined) {
      updateFields.push('bio = ?');
      values.push(userData.bio);
    }
    if (userData.profile_picture !== undefined) {
      updateFields.push('profile_picture = ?');
      values.push(userData.profile_picture);
    }

    // Notification preferences
    if (userData.notification_email !== undefined) {
      updateFields.push('notification_email = ?');
      values.push(userData.notification_email);
    }
    if (userData.notification_push !== undefined) {
      updateFields.push('notification_push = ?');
      values.push(userData.notification_push);
    }
    if (userData.notification_sms !== undefined) {
      updateFields.push('notification_sms = ?');
      values.push(userData.notification_sms);
    }

    // Security settings
    if (userData.two_factor_enabled !== undefined) {
      updateFields.push('two_factor_enabled = ?');
      values.push(userData.two_factor_enabled);
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