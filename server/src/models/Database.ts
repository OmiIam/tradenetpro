import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.DB_PATH || './database/trading_platform.db';
    const dbDir = path.dirname(dbPath);
    
    // Create database directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Create tables
    this.createTables();
    
    // Create indexes
    this.createIndexes();
    
    // Insert default admin user
    this.createDefaultAdmin();
  }

  private createTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone_number TEXT,
        date_of_birth DATE,
        address_line_1 TEXT,
        address_line_2 TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('active', 'suspended', 'inactive', 'pending_verification', 'pending_approval')),
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        terms_accepted BOOLEAN DEFAULT FALSE,
        privacy_accepted BOOLEAN DEFAULT FALSE,
        kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'under_review')),
        account_funded BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        verified_at DATETIME,
        approved_at DATETIME
      )
    `);

    // Portfolios table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_balance REAL NOT NULL DEFAULT 0,
        portfolio_value REAL NOT NULL DEFAULT 0,
        total_trades INTEGER NOT NULL DEFAULT 0,
        win_rate REAL NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Transactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'adjustment')),
        amount REAL NOT NULL,
        description TEXT,
        admin_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Portfolio positions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        portfolio_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        quantity REAL NOT NULL,
        average_price REAL NOT NULL,
        current_price REAL NOT NULL,
        position_type TEXT NOT NULL CHECK (position_type IN ('long', 'short')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
      )
    `);

    // Sessions table for JWT token management
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Verification tokens table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'password_reset')),
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // User documents table for KYC
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        document_type TEXT NOT NULL CHECK (document_type IN ('id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement')),
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified_at DATETIME,
        verified_by INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // User notes table for admin comments
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        note_type TEXT NOT NULL CHECK (note_type IN ('verification', 'funding', 'kyc', 'general')),
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  private createIndexes() {
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
      CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio_id ON portfolio_positions(portfolio_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
    `);
  }

  private createDefaultAdmin() {
    
    // Check if admin user already exists
    const adminExists = this.db.prepare('SELECT id FROM users WHERE role = ? AND email = ?').get('admin', 'admin@trade.im');
    
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      // Insert default admin user with all required fields
      const insertAdmin = this.db.prepare(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, status, 
          email_verified, phone_verified, terms_accepted, privacy_accepted, 
          kyc_status, account_funded, verified_at, approved_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      
      const adminResult = insertAdmin.run(
        'admin@trade.im', hashedPassword, 'Admin', 'User', 'admin', 'active',
        1, 1, 1, 1, 'approved', 1
      );
      
      // Create portfolio for admin
      const insertPortfolio = this.db.prepare(`
        INSERT INTO portfolios (user_id, total_balance, portfolio_value)
        VALUES (?, ?, ?)
      `);
      
      insertPortfolio.run(adminResult.lastInsertRowid, 1000000, 1000000);
      
      console.log('Default admin user created: admin@trade.im / admin123');
    }

    // Check if test user already exists
    const testUserExists = this.db.prepare('SELECT id FROM users WHERE email = ?').get('testuser@trade.im');
    
    if (!testUserExists) {
      const testPassword = bcrypt.hashSync('testpass123', 10);
      
      // Insert test user - partially verified to show typical user flow
      const insertTestUser = this.db.prepare(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, status,
          email_verified, phone_verified, terms_accepted, privacy_accepted,
          kyc_status, account_funded
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const testUserResult = insertTestUser.run(
        'testuser@trade.im', testPassword, 'Test', 'User', 'user', 'active',
        1, 0, 1, 1, 'pending', 1
      );
      
      // Create portfolio for test user
      const insertTestPortfolio = this.db.prepare(`
        INSERT INTO portfolios (user_id, total_balance, portfolio_value)
        VALUES (?, ?, ?)
      `);
      
      insertTestPortfolio.run(testUserResult.lastInsertRowid, 5000, 4800);
      
      console.log('Default test user created: testuser@trade.im / testpass123');
    }
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  public close() {
    this.db.close();
  }
}

export default DatabaseManager;