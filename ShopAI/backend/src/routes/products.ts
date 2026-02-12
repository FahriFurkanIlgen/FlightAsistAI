import { Router, Request, Response } from 'express';
import { CacheService } from '../services/cacheService';

const router = Router();
const cacheService = CacheService.getInstance();

// GET /api/products/:siteId
router.get('/:siteId', (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const products = cacheService.getProducts(siteId);

    if (!products) {
      return res.status(404).json({
        error: 'Products not found for this site',
        siteId,
      });
    }

    res.json({
      siteId,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error('Products API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// GET /api/products/:siteId/search
router.get('/:siteId/search', (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Missing search query parameter: q',
      });
    }

    const products = cacheService.searchProducts(siteId, q);

    res.json({
      siteId,
      query: q,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error('Product Search API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// GET /api/products/:siteId/category
router.get('/:siteId/category', (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const { keywords } = req.query;

    if (!keywords || typeof keywords !== 'string') {
      return res.status(400).json({
        error: 'Missing keywords query parameter',
      });
    }

    const keywordArray = keywords.split(',').map((k) => k.trim());
    const products = cacheService.filterProductsByCategory(siteId, keywordArray);

    res.json({
      siteId,
      keywords: keywordArray,
      count: products.length,
      products: products.slice(0, 10), // Return top 10
    });
  } catch (error: any) {
    console.error('Category Filter API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
