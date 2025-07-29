import Database from 'better-sqlite3';

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'appearance' | 'email' | 'security' | 'trading' | 'maintenance';
  is_public: boolean;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSettingData {
  key: string;
  value: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'json';
  category?: 'general' | 'appearance' | 'email' | 'security' | 'trading' | 'maintenance';
  is_public?: boolean;
}

export interface UpdateSettingData {
  value?: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'json';
  category?: 'general' | 'appearance' | 'email' | 'security' | 'trading' | 'maintenance';
  is_public?: boolean;
}

export class SystemSettingsModel {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  // Get all settings
  getAllSettings(category?: string): SystemSetting[] {
    let query = 'SELECT * FROM system_settings';
    const params: any[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY category, key';
    
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as SystemSetting[];
  }

  // Get public settings only (for frontend)
  getPublicSettings(): SystemSetting[] {
    const stmt = this.db.prepare('SELECT * FROM system_settings WHERE is_public = 1 ORDER BY category, key');
    return stmt.all() as SystemSetting[];
  }

  // Get setting by key
  getSettingByKey(key: string): SystemSetting | null {
    const stmt = this.db.prepare('SELECT * FROM system_settings WHERE key = ?');
    return stmt.get(key) as SystemSetting | null;
  }

  // Get setting value by key with type conversion
  getSettingValue<T = string>(key: string): T | null {
    const setting = this.getSettingByKey(key);
    if (!setting) return null;

    switch (setting.type) {
      case 'boolean':
        return (setting.value === 'true') as unknown as T;
      case 'number':
        return Number(setting.value) as unknown as T;
      case 'json':
        try {
          return JSON.parse(setting.value) as T;
        } catch {
          return null;
        }
      default:
        return setting.value as unknown as T;
    }
  }

  // Create new setting
  createSetting(data: CreateSettingData, adminId?: number): SystemSetting {
    const stmt = this.db.prepare(`
      INSERT INTO system_settings (key, value, description, type, category, is_public, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.key,
      data.value,
      data.description || null,
      data.type || 'string',
      data.category || 'general',
      data.is_public ? 1 : 0,
      adminId || null
    );

    return this.getSettingByKey(data.key)!;
  }

  // Update setting
  updateSetting(key: string, data: UpdateSettingData, adminId?: number): SystemSetting | null {
    const updateFields: string[] = [];
    const values: any[] = [];

    if (data.value !== undefined) {
      updateFields.push('value = ?');
      values.push(data.value);
    }

    if (data.description !== undefined) {
      updateFields.push('description = ?');
      values.push(data.description);
    }

    if (data.type !== undefined) {
      updateFields.push('type = ?');
      values.push(data.type);
    }

    if (data.category !== undefined) {
      updateFields.push('category = ?');
      values.push(data.category);
    }

    if (data.is_public !== undefined) {
      updateFields.push('is_public = ?');
      values.push(data.is_public ? 1 : 0);
    }

    if (adminId) {
      updateFields.push('updated_by = ?');
      values.push(adminId);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(key);

    if (updateFields.length === 1) {
      // Only updated_at was added, nothing to update
      return this.getSettingByKey(key);
    }

    const stmt = this.db.prepare(`
      UPDATE system_settings 
      SET ${updateFields.join(', ')} 
      WHERE key = ?
    `);

    stmt.run(...values);
    return this.getSettingByKey(key);
  }

  // Delete setting
  deleteSetting(key: string): boolean {
    const stmt = this.db.prepare('DELETE FROM system_settings WHERE key = ?');
    const result = stmt.run(key);
    return result.changes > 0;
  }

  // Get settings by category
  getSettingsByCategory(): Record<string, SystemSetting[]> {
    const settings = this.getAllSettings();
    const grouped: Record<string, SystemSetting[]> = {};

    settings.forEach(setting => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    });

    return grouped;
  }

  // Update multiple settings at once
  updateMultipleSettings(updates: Array<{key: string, value: string}>, adminId?: number): void {
    const stmt = this.db.prepare(`
      UPDATE system_settings 
      SET value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE key = ?
    `);

    const transaction = this.db.transaction((updates: Array<{key: string, value: string}>) => {
      updates.forEach(update => {
        stmt.run(update.value, adminId || null, update.key);
      });
    });

    transaction(updates);
  }
}

export default SystemSettingsModel;