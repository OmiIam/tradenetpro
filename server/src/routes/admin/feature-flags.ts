import { Router, Request, Response } from 'express';
import { requireAdminAuth } from '../../middleware/auth';
import FeatureFlagService from '../../services/FeatureFlagService';
import DatabaseManager from '../../models/Database';

const router = Router();
const database = DatabaseManager.getInstance().getDatabase();
const featureFlagService = new FeatureFlagService(database);

/**
 * Get all feature flags
 */
router.get('/', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { environment } = req.query;
    const flags = featureFlagService.getAllFeatureFlags(environment as string);

    res.json({
      success: true,
      data: flags
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature flags'
    });
  }
});

/**
 * Get feature flag by ID
 */
router.get('/:flagId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const flagId = parseInt(req.params.flagId);
    
    if (!flagId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID'
      });
    }

    const flag = featureFlagService.getFeatureFlagById(flagId);
    
    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Feature flag not found'
      });
    }

    res.json({
      success: true,
      data: flag
    });
  } catch (error) {
    console.error('Error fetching feature flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature flag'
    });
  }
});

/**
 * Create new feature flag
 */
router.post('/', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {
      key,
      name,
      description,
      is_enabled = false,
      rollout_percentage = 100,
      user_criteria,
      environment = 'all'
    } = req.body;

    const admin_id = (req as any).user.id;

    if (!key || !name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Key, name, and description are required'
      });
    }

    // Validate key format (alphanumeric, underscores, hyphens only)
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      return res.status(400).json({
        success: false,
        message: 'Feature flag key can only contain letters, numbers, underscores, and hyphens'
      });
    }

    // Validate rollout percentage
    if (rollout_percentage < 0 || rollout_percentage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Rollout percentage must be between 0 and 100'
      });
    }

    const flagId = await featureFlagService.createFeatureFlag({
      key,
      name,
      description,
      is_enabled,
      rollout_percentage,
      user_criteria,
      environment,
      created_by: admin_id
    });

    res.status(201).json({
      success: true,
      message: 'Feature flag created successfully',
      data: { id: flagId }
    });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create feature flag'
    });
  }
});

/**
 * Update feature flag
 */
router.put('/:flagId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const flagId = parseInt(req.params.flagId);
    const admin_id = (req as any).user.id;

    if (!flagId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID'
      });
    }

    const {
      name,
      description,
      is_enabled,
      rollout_percentage,
      user_criteria,
      environment
    } = req.body;

    // Validate rollout percentage if provided
    if (rollout_percentage !== undefined && (rollout_percentage < 0 || rollout_percentage > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Rollout percentage must be between 0 and 100'
      });
    }

    await featureFlagService.updateFeatureFlag(flagId, {
      name,
      description,
      is_enabled,
      rollout_percentage,
      user_criteria,
      environment
    }, admin_id);

    res.json({
      success: true,
      message: 'Feature flag updated successfully'
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update feature flag'
    });
  }
});

/**
 * Toggle feature flag on/off
 */
router.post('/:flagId/toggle', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const flagId = parseInt(req.params.flagId);
    const admin_id = (req as any).user.id;

    if (!flagId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID'
      });
    }

    const newState = await featureFlagService.toggleFeatureFlag(flagId, admin_id);

    res.json({
      success: true,
      message: `Feature flag ${newState ? 'enabled' : 'disabled'} successfully`,
      data: { is_enabled: newState }
    });
  } catch (error) {
    console.error('Error toggling feature flag:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to toggle feature flag'
    });
  }
});

/**
 * Delete feature flag
 */
router.delete('/:flagId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const flagId = parseInt(req.params.flagId);
    const admin_id = (req as any).user.id;

    if (!flagId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature flag ID'
      });
    }

    await featureFlagService.deleteFeatureFlag(flagId, admin_id);

    res.json({
      success: true,
      message: 'Feature flag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete feature flag'
    });
  }
});

/**
 * Check if feature is enabled for current user
 */
router.get('/check/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { environment = 'production' } = req.query;
    const user = (req as any).user;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Feature flag key is required'
      });
    }

    const userAttributes = user ? {
      role: user.role,
      kyc_status: user.kyc_status,
      account_funded: user.account_funded,
      created_at: user.created_at,
      user_id: user.id
    } : undefined;

    const isEnabled = featureFlagService.isFeatureEnabledForUser(
      key,
      user?.id,
      userAttributes,
      environment as string
    );

    res.json({
      success: true,
      data: {
        key,
        enabled: isEnabled,
        user_id: user?.id || null
      }
    });
  } catch (error) {
    console.error('Error checking feature flag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feature flag'
    });
  }
});

/**
 * Get enabled features for current user
 */
router.get('/user/enabled', async (req: Request, res: Response) => {
  try {
    const { environment = 'production' } = req.query;
    const user = (req as any).user;

    const userAttributes = user ? {
      role: user.role,
      kyc_status: user.kyc_status,
      account_funded: user.account_funded,
      created_at: user.created_at,
      user_id: user.id
    } : undefined;

    const enabledFeatures = featureFlagService.getEnabledFeaturesForUser(
      user?.id,
      userAttributes,
      environment as string
    );

    res.json({
      success: true,
      data: {
        enabled_features: enabledFeatures,
        user_id: user?.id || null,
        environment
      }
    });
  } catch (error) {
    console.error('Error fetching enabled features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enabled features'
    });
  }
});

/**
 * Get feature flag statistics
 */
router.get('/stats/overview', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const stats = featureFlagService.getFeatureFlagStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching feature flag stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature flag statistics'
    });
  }
});

/**
 * Bulk update feature flags
 */
router.post('/bulk/update', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;
    const admin_id = (req as any).user.id;

    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Updates must be an array'
      });
    }

    const results = [];
    for (const update of updates) {
      try {
        await featureFlagService.updateFeatureFlag(update.id, update.data, admin_id);
        results.push({ id: update.id, success: true });
      } catch (error) {
        results.push({ 
          id: update.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Update failed' 
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk update completed',
      data: { results }
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk update'
    });
  }
});

/**
 * Export feature flags configuration
 */
router.get('/export/config', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { environment } = req.query;
    const flags = featureFlagService.getAllFeatureFlags(environment as string);

    const exportData = {
      exported_at: new Date().toISOString(),
      environment: environment || 'all',
      feature_flags: flags.map(flag => ({
        key: flag.key,
        name: flag.name,
        description: flag.description,
        is_enabled: flag.is_enabled,
        rollout_percentage: flag.rollout_percentage,
        user_criteria: flag.user_criteria,
        environment: flag.environment
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="feature-flags-${environment || 'all'}-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting feature flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export feature flags'
    });
  }
});

export default router;