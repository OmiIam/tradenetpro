import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import AdvancedAdminSchemas from './AdvancedAdminSchemas';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    this.dbPath = process.env.DB_PATH || './database/trading_platform.db';
    const dbDir = path.dirname(this.dbPath);
    
    // Create database directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Create tables
    this.createTables();
    
    // Create advanced admin schemas
    this.createAdvancedSchemas();
    
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
        timezone TEXT DEFAULT 'UTC',
        profile_picture TEXT,
        bio TEXT,
        role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('active', 'suspended', 'inactive', 'pending_verification', 'pending_approval')),
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        terms_accepted BOOLEAN DEFAULT FALSE,
        privacy_accepted BOOLEAN DEFAULT FALSE,
        kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'under_review')),
        account_funded BOOLEAN DEFAULT FALSE,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        notification_email BOOLEAN DEFAULT TRUE,
        notification_push BOOLEAN DEFAULT TRUE,
        notification_sms BOOLEAN DEFAULT FALSE,
        bitcoin_address TEXT,
        ethereum_address TEXT,
        usdt_address TEXT,
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
        asset_type TEXT DEFAULT 'USD' CHECK (asset_type IN ('USD', 'BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'DOT', 'LINK')),
        asset_symbol TEXT,
        asset_quantity REAL,
        exchange_rate REAL,
        fee REAL DEFAULT 0,
        blockchain_hash TEXT,
        from_address TEXT,
        to_address TEXT,
        confirmation_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
        description TEXT,
        admin_id INTEGER,
        processed_at DATETIME,
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

    // Market data cache table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS market_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        current_price REAL NOT NULL,
        price_change_24h REAL DEFAULT 0,
        price_change_percentage_24h REAL DEFAULT 0,
        market_cap REAL DEFAULT 0,
        volume_24h REAL DEFAULT 0,
        circulating_supply REAL DEFAULT 0,
        total_supply REAL DEFAULT 0,
        max_supply REAL DEFAULT 0,
        market_cap_rank INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_source TEXT DEFAULT 'coingecko',
        asset_type TEXT DEFAULT 'crypto' CHECK (asset_type IN ('crypto', 'stock', 'forex', 'commodity'))
      )
    `);

    // User audit logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        admin_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // User notifications table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
        category TEXT DEFAULT 'general' CHECK (category IN ('general', 'trading', 'security', 'kyc', 'deposit', 'withdrawal')),
        read BOOLEAN DEFAULT FALSE,
        action_url TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // System settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
        category TEXT DEFAULT 'general' CHECK (category IN ('general', 'appearance', 'email', 'security', 'trading', 'maintenance')),
        is_public BOOLEAN DEFAULT FALSE,
        updated_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Admin notifications table (for admin panel activity feed)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'user_activity')),
        category TEXT DEFAULT 'general' CHECK (category IN ('general', 'user_signup', 'kyc_submission', 'transaction', 'system')),
        read BOOLEAN DEFAULT FALSE,
        action_url TEXT,
        metadata TEXT, -- JSON data
        target_user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME,
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // User bans/suspensions table with expiration support
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_suspensions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('suspension', 'ban')),
        reason TEXT NOT NULL,
        admin_id INTEGER NOT NULL,
        starts_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_permanent BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE RESTRICT
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
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_asset_type ON transactions(asset_type);
      CREATE INDEX IF NOT EXISTS idx_transactions_blockchain_hash ON transactions(blockchain_hash);
      CREATE INDEX IF NOT EXISTS idx_portfolio_positions_portfolio_id ON portfolio_positions(portfolio_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
      CREATE INDEX IF NOT EXISTS idx_market_data_asset_type ON market_data(asset_type);
      CREATE INDEX IF NOT EXISTS idx_market_data_last_updated ON market_data(last_updated);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(read);
      CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
      CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
      CREATE INDEX IF NOT EXISTS idx_admin_notifications_category ON admin_notifications(category);
      CREATE INDEX IF NOT EXISTS idx_user_suspensions_user_id ON user_suspensions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_suspensions_active ON user_suspensions(is_active);
      CREATE INDEX IF NOT EXISTS idx_user_suspensions_expires ON user_suspensions(expires_at);
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
      
      // Create portfolio for test user with realistic data
      const insertTestPortfolio = this.db.prepare(`
        INSERT INTO portfolios (user_id, total_balance, portfolio_value, total_trades, win_rate)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const testPortfolioResult = insertTestPortfolio.run(testUserResult.lastInsertRowid, 5000, 5234.56, 12, 78.5);
      
      // Add sample portfolio positions for test user
      const insertPosition = this.db.prepare(`
        INSERT INTO portfolio_positions (portfolio_id, symbol, quantity, average_price, current_price, position_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // Sample stock positions
      insertPosition.run(testPortfolioResult.lastInsertRowid, 'AAPL', 10, 185.20, 190.45, 'long');
      insertPosition.run(testPortfolioResult.lastInsertRowid, 'MSFT', 5, 378.90, 382.15, 'long');
      insertPosition.run(testPortfolioResult.lastInsertRowid, 'GOOGL', 8, 142.56, 145.78, 'long');
      insertPosition.run(testPortfolioResult.lastInsertRowid, 'TSLA', 3, 245.80, 248.90, 'long');
      
      // Add sample transactions for test user
      const insertTransaction = this.db.prepare(`
        INSERT INTO transactions (user_id, type, amount, description)
        VALUES (?, ?, ?, ?)
      `);
      
      // Sample transaction history
      insertTransaction.run(testUserResult.lastInsertRowid, 'deposit', 5000, 'Initial funding');
      insertTransaction.run(testUserResult.lastInsertRowid, 'trade', -1852, 'Purchased 10 shares of AAPL');
      insertTransaction.run(testUserResult.lastInsertRowid, 'trade', -1894.50, 'Purchased 5 shares of MSFT');
      insertTransaction.run(testUserResult.lastInsertRowid, 'trade', -1140.48, 'Purchased 8 shares of GOOGL');
      insertTransaction.run(testUserResult.lastInsertRowid, 'trade', -737.40, 'Purchased 3 shares of TSLA');
      
      console.log('Default test user created: testuser@trade.im / testpass123');
    }

    // Create default system settings
    this.createDefaultSettings();
  }

  private createAdvancedSchemas() {
    const advancedSchemas = new AdvancedAdminSchemas(this.db);
    advancedSchemas.createAdvancedSchemas();
  }

  private createDefaultSettings() {
    const defaultSettings = [
      { key: 'site_title', value: 'TradeIM', description: 'Site title displayed in header', category: 'general', is_public: true },
      { key: 'site_description', value: 'Advanced Trading Platform', description: 'Site description for meta tags', category: 'general', is_public: true },
      { key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode', type: 'boolean', category: 'maintenance', is_public: true },
      { key: 'maintenance_message', value: 'We are currently performing scheduled maintenance. Please check back soon.', description: 'Message shown during maintenance', category: 'maintenance', is_public: true },
      { key: 'email_sender_name', value: 'TradeIM Support', description: 'Name used in outgoing emails', category: 'email', is_public: false },
      { key: 'email_sender_address', value: 'noreply@trade.im', description: 'Email address used for outgoing emails', category: 'email', is_public: false },
      { key: 'new_user_notifications', value: 'true', description: 'Send notifications for new user registrations', type: 'boolean', category: 'general', is_public: false },
      { key: 'kyc_auto_approve', value: 'false', description: 'Automatically approve KYC documents', type: 'boolean', category: 'security', is_public: false },
      { key: 'max_login_attempts', value: '5', description: 'Maximum login attempts before lockout', type: 'number', category: 'security', is_public: false },
      { key: 'session_timeout', value: '24', description: 'Session timeout in hours', type: 'number', category: 'security', is_public: false }
    ];

    defaultSettings.forEach(setting => {
      const exists = this.db.prepare('SELECT id FROM system_settings WHERE key = ?').get(setting.key);
      if (!exists) {
        this.db.prepare(`
          INSERT INTO system_settings (key, value, description, type, category, is_public)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          setting.key,
          setting.value,
          setting.description,
          setting.type || 'string',
          setting.category,
          setting.is_public ? 1 : 0
        );
      }
    });
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  public getDatabasePath(): string {
    return this.dbPath;
  }

  public close() {
    this.db.close();
  }
}

export default DatabaseManager;