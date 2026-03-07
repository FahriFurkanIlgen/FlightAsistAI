import { Router, Request, Response } from 'express';
import { graphService } from '../services/graphService';

const router = Router();

/**
 * Get flight recommendations based on a flight
 * GET /api/graph/recommendations/:flightId?limit=5
 */
router.get('/recommendations/:flightId', async (req: Request, res: Response) => {
  try {
    const { flightId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!graphService.isServiceConnected()) {
      return res.status(503).json({
        error: 'GraphDB not available',
        message: 'Graph database service is not connected',
      });
    }

    const recommendations = await graphService.getFlightRecommendations(flightId, limit);

    res.json({
      flightId,
      recommendations,
      count: recommendations.length,
    });
  } catch (error: any) {
    console.error('Graph Recommendations Error:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: error.message,
    });
  }
});

/**
 * Find connecting flights between two cities
 * GET /api/graph/connecting?from=Istanbul&to=Dubai&maxStops=1
 */
router.get('/connecting', async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    const maxStops = parseInt(req.query.maxStops as string) || 1;

    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Both "from" and "to" parameters are required',
      });
    }

    if (!graphService.isServiceConnected()) {
      return res.status(503).json({
        error: 'GraphDB not available',
        message: 'Graph database service is not connected',
      });
    }

    const routes = await graphService.getConnectingFlights(
      from as string,
      to as string,
      maxStops
    );

    res.json({
      from,
      to,
      maxStops,
      routes,
      count: routes.length,
    });
  } catch (error: any) {
    console.error('Connecting Flights Error:', error);
    res.status(500).json({
      error: 'Failed to find connecting flights',
      message: error.message,
    });
  }
});

/**
 * Get GraphDB statistics
 * GET /api/graph/stats
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    if (!graphService.isServiceConnected()) {
      return res.json({
        connected: false,
        totalFlights: 0,
        totalRelationships: 0,
      });
    }

    const stats = await graphService.getStatistics();

    res.json({
      connected: true,
      ...stats,
    });
  } catch (error: any) {
    console.error('Graph Stats Error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message,
    });
  }
});

/**
 * Trigger manual sync of flights to GraphDB
 * POST /api/graph/sync
 */
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    if (!graphService.isServiceConnected()) {
      return res.status(503).json({
        error: 'GraphDB not available',
        message: 'Graph database service is not connected',
      });
    }

    // Bu fonksiyonu server.ts'den import edip kullanabiliriz
    // Şimdilik basit bir implementation
    const { cacheService } = require('../services/cacheService');
    const flights = cacheService.getAllFlights();

    if (flights.length === 0) {
      return res.status(400).json({
        error: 'No flights to sync',
        message: 'Flight cache is empty',
      });
    }

    await graphService.importFlights(flights);

    res.json({
      success: true,
      message: `Successfully synced ${flights.length} flights to GraphDB`,
      flightCount: flights.length,
    });
  } catch (error: any) {
    console.error('Graph Sync Error:', error);
    res.status(500).json({
      error: 'Failed to sync flights',
      message: error.message,
    });
  }
});

export default router;
