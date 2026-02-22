/**
 * API Key Authentication Middleware
 * Validates tenant API keys for widget requests
 */

import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenantService';

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: import('../models/Tenant').Tenant;
    }
  }
}

const tenantService = TenantService.getInstance();

/**
 * Middleware to validate API key and attach tenant to request
 */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get API key from header or query param
    const apiKey = req.headers['x-api-key'] as string || 
                   req.query.apiKey as string;

    if (!apiKey) {
      res.status(401).json({
        error: 'API key missing',
        message: 'Please provide an API key via X-API-Key header or apiKey query parameter'
      });
      return;
    }

    // Validate API key and get tenant
    const tenant = await tenantService.getTenantByApiKey(apiKey);

    if (!tenant) {
      res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
      return;
    }

    if (!tenant.isActive) {
      res.status(403).json({
        error: 'Tenant inactive',
        message: 'This account has been deactivated. Please contact support.'
      });
      return;
    }

    // Check quota (if applicable)
    if (tenant.plan !== 'enterprise' && tenant.monthlyQuota && tenant.usedQuota) {
      if (tenant.usedQuota >= tenant.monthlyQuota) {
        res.status(429).json({
          error: 'Quota exceeded',
          message: 'Monthly quota limit reached. Please upgrade your plan.',
          quota: {
            used: tenant.usedQuota,
            limit: tenant.monthlyQuota
          }
        });
        return;
      }
    }

    // Attach tenant to request
    req.tenant = tenant;
    
    // Increment usage counter (async, don't wait)
    tenantService.incrementUsage(tenant.id).catch(err => {
      console.error('Failed to increment usage:', err);
    });

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred while validating the API key'
    });
  }
};

/**
 * Optional authentication - attach tenant if API key provided, but don't require it
 */
export const optionalApiKey = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string || 
                   req.query.apiKey as string;

    if (apiKey) {
      const tenant = await tenantService.getTenantByApiKey(apiKey);
      if (tenant && tenant.isActive) {
        req.tenant = tenant;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
