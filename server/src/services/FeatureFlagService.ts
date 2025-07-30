import Database from 'better-sqlite3';

export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
  user_criteria?: Record<string, any>;
  environment: 'development' | 'staging' | 'production' | 'all';
  created_by: number;
  created_at: string;
  updated_at: string;
  last_updated_by?: number;
}

export interface FeatureFlagUpdate {
  name?: string;
  description?: string;
  is_enabled?: boolean;
  rollout_percentage?: number;
  user_criteria?: Record<string, any>;
  environment?: 'development' | 'staging' | 'production' | 'all';
}

export interface FeatureFlagCreate {
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage?: number;
  user_criteria?: Record<string, any>;
  environment?: 'development' | 'staging' | 'production' | 'all';
  created_by: number;
}

export class FeatureFlagService {
  private db: Database.Database;

  constructor(database: Database.Database) {
    this.db = database;
  }

  /**
   * Create a new feature flag
   */
  public async createFeatureFlag(data: FeatureFlagCreate): Promise<number> {
    const {
      key,
      name,
      description,
      is_enabled,
      rollout_percentage = 100,
      user_criteria,
      environment = 'all',
      created_by
    } = data;

    // Check if flag key already exists
    const existingFlag = this.db.prepare('SELECT id FROM feature_flags WHERE key = ?').get(key);
    if (existingFlag) {
      throw new Error(`Feature flag with key '${key}' already exists`);
    }

    const insertFlag = this.db.prepare(`
      INSERT INTO feature_flags (
        key, name, description, is_enabled, rollout_percentage, 
        user_criteria, environment, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertFlag.run(
      key,
      name,
      description,
      is_enabled ? 1 : 0,
      rollout_percentage,
      user_criteria ? JSON.stringify(user_criteria) : null,
      environment,
      created_by
    );

    const flagId = result.lastInsertRowid as number;

    // Log the creation
    this.logFeatureFlagAudit({
      admin_id: created_by,
      flag_id: flagId,
      action_type: 'feature_flag_created',
      action_description: `Created feature flag '${key}': ${name}`,
      new_values: { key, name, description, is_enabled, rollout_percentage, environment }
    });

    return flagId;
  }

  /**
   * Update an existing feature flag
   */
  public async updateFeatureFlag(flagId: number, data: FeatureFlagUpdate, updatedBy: number): Promise<void> {
    const existingFlag = this.db.prepare('SELECT * FROM feature_flags WHERE id = ?').get(flagId) as FeatureFlag;
    if (!existingFlag) {
      throw new Error('Feature flag not found');
    }

    const updateFields = [];
    const updateValues = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }

    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(data.description);
    }

    if (data.is_enabled !== undefined) {
      updateFields.push('is_enabled = ?');
      updateValues.push(data.is_enabled ? 1 : 0);
    }

    if (data.rollout_percentage !== undefined) {
      updateFields.push('rollout_percentage = ?');
      updateValues.push(data.rollout_percentage);
    }

    if (data.user_criteria !== undefined) {
      updateFields.push('user_criteria = ?');
      updateValues.push(data.user_criteria ? JSON.stringify(data.user_criteria) : null);
    }

    if (data.environment !== undefined) {
      updateFields.push('environment = ?');
      updateValues.push(data.environment);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('last_updated_by = ?', 'updated_at = CURRENT_TIMESTAMP');
    updateValues.push(updatedBy, flagId);

    const updateQuery = `
      UPDATE feature_flags 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    this.db.prepare(updateQuery).run(...updateValues);

    // Log the update
    this.logFeatureFlagAudit({
      admin_id: updatedBy,
      flag_id: flagId,
      action_type: 'feature_flag_updated',
      action_description: `Updated feature flag '${existingFlag.key}'`,
      old_values: {
        name: existingFlag.name,
        description: existingFlag.description,
        is_enabled: existingFlag.is_enabled,
        rollout_percentage: existingFlag.rollout_percentage,
        environment: existingFlag.environment
      },
      new_values: data
    });
  }

  /**
   * Delete a feature flag
   */
  public async deleteFeatureFlag(flagId: number, deletedBy: number): Promise<void> {
    const existingFlag = this.db.prepare('SELECT * FROM feature_flags WHERE id = ?').get(flagId) as FeatureFlag;
    if (!existingFlag) {
      throw new Error('Feature flag not found');
    }

    this.db.prepare('DELETE FROM feature_flags WHERE id = ?').run(flagId);

    // Log the deletion
    this.logFeatureFlagAudit({
      admin_id: deletedBy,
      flag_id: flagId,
      action_type: 'feature_flag_deleted',
      action_description: `Deleted feature flag '${existingFlag.key}': ${existingFlag.name}`,
      old_values: {
        key: existingFlag.key,
        name: existingFlag.name,
        description: existingFlag.description,
        is_enabled: existingFlag.is_enabled
      }
    });
  }

  /**
   * Get all feature flags
   */
  public getAllFeatureFlags(environment?: string): FeatureFlag[] {
    let query = `
      SELECT 
        ff.*,
        creator.email as created_by_email,
        updater.email as last_updated_by_email
      FROM feature_flags ff
      LEFT JOIN users creator ON ff.created_by = creator.id
      LEFT JOIN users updater ON ff.last_updated_by = updater.id
    `;

    const params = [];
    if (environment) {
      query += ' WHERE ff.environment = ? OR ff.environment = ?';
      params.push(environment, 'all');
    }

    query += ' ORDER BY ff.created_at DESC';

    const flags = this.db.prepare(query).all(...params) as any[];

    return flags.map(flag => ({
      ...flag,
      is_enabled: Boolean(flag.is_enabled),
      user_criteria: flag.user_criteria ? JSON.parse(flag.user_criteria) : null
    }));
  }

  /**
   * Get a single feature flag by ID
   */
  public getFeatureFlagById(flagId: number): FeatureFlag | null {
    const flag = this.db.prepare(`
      SELECT 
        ff.*,
        creator.email as created_by_email,
        updater.email as last_updated_by_email
      FROM feature_flags ff
      LEFT JOIN users creator ON ff.created_by = creator.id
      LEFT JOIN users updater ON ff.last_updated_by = updater.id
      WHERE ff.id = ?
    `).get(flagId) as any;

    if (!flag) return null;

    return {
      ...flag,
      is_enabled: Boolean(flag.is_enabled),
      user_criteria: flag.user_criteria ? JSON.parse(flag.user_criteria) : null
    };
  }

  /**
   * Get a single feature flag by key
   */
  public getFeatureFlagByKey(key: string, environment: string = 'production'): FeatureFlag | null {
    const flag = this.db.prepare(`
      SELECT * FROM feature_flags 
      WHERE key = ? AND (environment = ? OR environment = 'all')
      ORDER BY 
        CASE 
          WHEN environment = ? THEN 1 
          ELSE 2 
        END
      LIMIT 1
    `).get(key, environment, environment) as any;

    if (!flag) return null;

    return {
      ...flag,
      is_enabled: Boolean(flag.is_enabled),
      user_criteria: flag.user_criteria ? JSON.parse(flag.user_criteria) : null
    };
  }

  /**
   * Check if a feature is enabled for a specific user
   */
  public isFeatureEnabledForUser(
    key: string, 
    userId?: number, 
    userAttributes?: Record<string, any>, 
    environment: string = 'production'
  ): boolean {
    const flag = this.getFeatureFlagByKey(key, environment);
    
    if (!flag) {
      // Feature flag doesn't exist - default to disabled
      return false;
    }

    if (!flag.is_enabled) {
      // Feature is globally disabled
      return false;
    }

    // Check rollout percentage
    if (flag.rollout_percentage < 100) {
      if (!userId) {
        // Can't determine rollout without user ID
        return false;
      }

      // Use consistent hash-based rollout
      const hash = this.getUserHash(userId, key);
      const userPercentile = hash % 100;
      
      if (userPercentile >= flag.rollout_percentage) {
        return false;
      }
    }

    // Check user criteria if specified
    if (flag.user_criteria && Object.keys(flag.user_criteria).length > 0) {
      if (!userAttributes) {
        return false;
      }

      return this.evaluateUserCriteria(flag.user_criteria, userAttributes);
    }

    return true;
  }

  /**
   * Get feature flags enabled for a specific user
   */
  public getEnabledFeaturesForUser(
    userId?: number, 
    userAttributes?: Record<string, any>, 
    environment: string = 'production'
  ): string[] {
    const allFlags = this.getAllFeatureFlags(environment);
    const enabledFlags = [];

    for (const flag of allFlags) {
      if (this.isFeatureEnabledForUser(flag.key, userId, userAttributes, environment)) {
        enabledFlags.push(flag.key);
      }
    }

    return enabledFlags;
  }

  /**
   * Toggle a feature flag on/off
   */
  public async toggleFeatureFlag(flagId: number, toggledBy: number): Promise<boolean> {
    const flag = this.getFeatureFlagById(flagId);
    if (!flag) {
      throw new Error('Feature flag not found');
    }

    const newState = !flag.is_enabled;
    await this.updateFeatureFlag(flagId, { is_enabled: newState }, toggledBy);

    return newState;
  }

  /**
   * Get feature flag usage statistics
   */
  public getFeatureFlagStats(): {
    total_flags: number;
    enabled_flags: number;
    disabled_flags: number;
    gradual_rollout_flags: number;
    by_environment: Record<string, number>;
  } {
    const totalFlags = this.db.prepare('SELECT COUNT(*) as count FROM feature_flags').get() as { count: number };
    
    const enabledFlags = this.db.prepare('SELECT COUNT(*) as count FROM feature_flags WHERE is_enabled = 1').get() as { count: number };
    
    const disabledFlags = this.db.prepare('SELECT COUNT(*) as count FROM feature_flags WHERE is_enabled = 0').get() as { count: number };
    
    const gradualRolloutFlags = this.db.prepare('SELECT COUNT(*) as count FROM feature_flags WHERE rollout_percentage < 100 AND rollout_percentage > 0').get() as { count: number };

    const byEnvironment = this.db.prepare(`
      SELECT environment, COUNT(*) as count
      FROM feature_flags
      GROUP BY environment
    `).all() as Array<{ environment: string; count: number }>;

    const environmentStats = byEnvironment.reduce((acc, item) => {
      acc[item.environment] = item.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_flags: totalFlags.count,
      enabled_flags: enabledFlags.count,
      disabled_flags: disabledFlags.count,
      gradual_rollout_flags: gradualRolloutFlags.count,
      by_environment: environmentStats
    };
  }

  /**
   * Generate consistent hash for user-based rollouts
   */
  private getUserHash(userId: number, flagKey: string): number {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(`${userId}-${flagKey}`).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  /**
   * Evaluate user criteria against user attributes
   */
  private evaluateUserCriteria(criteria: Record<string, any>, userAttributes: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(criteria)) {
      const userValue = userAttributes[key];

      if (Array.isArray(expectedValue)) {
        // Array means "user value must be in this list"
        if (!expectedValue.includes(userValue)) {
          return false;
        }
      } else if (typeof expectedValue === 'object' && expectedValue !== null) {
        // Object can contain operators like { ">": 1000, "<": 5000 }
        for (const [operator, operandValue] of Object.entries(expectedValue)) {
          if (!this.evaluateOperator(userValue, operator, operandValue)) {
            return false;
          }
        }
      } else {
        // Direct equality check
        if (userValue !== expectedValue) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate operator-based criteria
   */
  private evaluateOperator(userValue: any, operator: string, operandValue: any): boolean {
    switch (operator) {
      case '>':
        return userValue > operandValue;
      case '>=':
        return userValue >= operandValue;
      case '<':
        return userValue < operandValue;
      case '<=':
        return userValue <= operandValue;
      case '!=':
      case 'not':
        return userValue !== operandValue;
      case 'in':
        return Array.isArray(operandValue) && operandValue.includes(userValue);
      case 'not_in':
        return Array.isArray(operandValue) && !operandValue.includes(userValue);
      case 'contains':
        return typeof userValue === 'string' && userValue.includes(operandValue);
      case 'starts_with':
        return typeof userValue === 'string' && userValue.startsWith(operandValue);
      case 'ends_with':
        return typeof userValue === 'string' && userValue.endsWith(operandValue);
      default:
        return false;
    }
  }

  /**
   * Log feature flag audit entry
   */
  private logFeatureFlagAudit(data: {
    admin_id: number;
    flag_id: number;
    action_type: string;
    action_description: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
  }): void {
    const insertAudit = this.db.prepare(`
      INSERT INTO detailed_audit_logs (
        admin_id, action_category, action_type, action_description,
        resource_type, resource_id, old_values, new_values, risk_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAudit.run(
      data.admin_id,
      'feature_management',
      data.action_type,
      data.action_description,
      'feature_flag',
      data.flag_id,
      data.old_values ? JSON.stringify(data.old_values) : null,
      data.new_values ? JSON.stringify(data.new_values) : null,
      'medium'
    );
  }
}

export default FeatureFlagService;