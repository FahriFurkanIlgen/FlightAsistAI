import { Router, Request, Response } from 'express';
import { CacheService } from '../services/cacheService';

const router = Router();
const cacheService = CacheService.getInstance();

// GET /api/flights/:siteId
router.get('/:siteId', (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const flights = cacheService.getFlights(siteId);

    if (!flights) {
      return res.status(404).json({
        error: 'Flights not found for this site',
        siteId,
      });
    }

    res.json({
      siteId,
      count: flights.length,
      flights,
    });
  } catch (error: any) {
    console.error('Flights API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// GET /api/flights/:siteId/search
router.get('/:siteId/search', (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { q, from, to, date, passengers, cabinClass } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Missing search query parameter: q',
      });
    }

    let flights = cacheService.searchFlights(siteId, q);
    
    // Apply filters if provided
    if (from) {
      flights = flights.filter(f => f.departure.city.toLowerCase().includes((from as string).toLowerCase()));
    }
    if (to) {
      flights = flights.filter(f => f.arrival.city.toLowerCase().includes((to as string).toLowerCase()));
    }
    if (date) {
      flights = flights.filter(f => f.departure.date === date);
    }
    if (cabinClass) {
      flights = flights.filter(f => f.cabinClass === cabinClass);
    }

    res.json({
      siteId,
      query: q,
      count: flights.length,
      flights,
    });
  } catch (error: any) {
    console.error('Flight Search API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// GET /api/flights/:siteId/route - Filter by route
router.get('/:siteId/route', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { from, to } = req.query;

    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
      return res.status(400).json({
        error: 'Missing from/to query parameters',
      });
    }

    const flights = await cacheService.filterFlightsByRoute(siteId, from, to);

    res.json({
      siteId,
      route: { from, to },
      count: flights.length,
      flights: flights.slice(0, 20), // Return top 20
    });
  } catch (error: any) {
    console.error('Route Filter API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// GET /api/flights/:siteId/debug - Debug endpoint to check specific flights
router.get('/:siteId/debug', (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { flightNumber } = req.query;
    
    const flights = cacheService.getFlights(siteId);
    
    if (!flights || flights.length === 0) {
      return res.status(404).json({
        error: 'No flights found',
        siteId,
      });
    }

    // If keyword provided, filter flights
    let debuggedFlights = flights;
    if (flightNumber && typeof flightNumber === 'string') {
      debuggedFlights = flights.filter(f => 
        f.flightNumber.toLowerCase().includes(flightNumber.toLowerCase())
      );
    }

    res.json({
      siteId,
      totalFlights: flights.length,
      filteredCount: debuggedFlights.length,
      sampleFlights: debuggedFlights.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Debug API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
