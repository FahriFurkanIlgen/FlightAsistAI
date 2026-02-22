/**
 * Tenant Management Routes
 * API endpoints for managing tenants (customers)
 */

import { Router, Request, Response } from 'express';
import { TenantService } from '../services/tenantService';
import { CreateTenantRequest, UpdateTenantRequest } from '../models/Tenant';

const router = Router();
const tenantService = TenantService.getInstance();

/**
 * Create a new tenant
 * POST /api/tenants
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const request: CreateTenantRequest = req.body;

    // Validate required fields
    if (!request.siteName || !request.domain || !request.feedUrl) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['siteName', 'domain', 'feedUrl', 'contactEmail']
      });
      return;
    }

    const tenant = await tenantService.createTenant(request);

    res.status(201).json({
      success: true,
      tenant: {
        id: tenant.id,
        apiKey: tenant.apiKey,
        siteId: tenant.siteId,
        siteName: tenant.siteName,
        domain: tenant.domain,
        plan: tenant.plan,
        createdAt: tenant.createdAt
      },
      message: 'Tenant created successfully. Keep your API key safe!'
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({
      error: 'Failed to create tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get all tenants
 * GET /api/tenants
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const tenants = await tenantService.getAllTenants();
    
    // Don't expose API keys in list
    const sanitized = tenants.map(t => ({
      id: t.id,
      siteId: t.siteId,
      siteName: t.siteName,
      domain: t.domain,
      plan: t.plan,
      isActive: t.isActive,
      usedQuota: t.usedQuota,
      monthlyQuota: t.monthlyQuota,
      createdAt: t.createdAt
    }));

    res.json({
      success: true,
      count: sanitized.length,
      tenants: sanitized
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      error: 'Failed to fetch tenants',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get tenant by ID
 * GET /api/tenants/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);

    if (!tenant) {
      res.status(404).json({
        error: 'Tenant not found'
      });
      return;
    }

    // Don't expose API key completely
    res.json({
      success: true,
      tenant: {
        ...tenant,
        apiKey: `${tenant.apiKey.substring(0, 12)}...${tenant.apiKey.substring(tenant.apiKey.length - 4)}`
      }
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      error: 'Failed to fetch tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update tenant
 * PUT /api/tenants/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updates: UpdateTenantRequest = req.body;
    const tenant = await tenantService.updateTenant(req.params.id, updates);

    if (!tenant) {
      res.status(404).json({
        error: 'Tenant not found'
      });
      return;
    }

    res.json({
      success: true,
      tenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({
      error: 'Failed to update tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete tenant
 * DELETE /api/tenants/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const success = await tenantService.deleteTenant(req.params.id);

    if (!success) {
      res.status(404).json({
        error: 'Tenant not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({
      error: 'Failed to delete tenant',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Regenerate API key
 * POST /api/tenants/:id/regenerate-key
 */
router.post('/:id/regenerate-key', async (req: Request, res: Response) => {
  try {
    const newApiKey = await tenantService.regenerateApiKey(req.params.id);

    if (!newApiKey) {
      res.status(404).json({
        error: 'Tenant not found'
      });
      return;
    }

    res.json({
      success: true,
      apiKey: newApiKey,
      message: 'API key regenerated. Update your integration with the new key!'
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({
      error: 'Failed to regenerate API key',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
