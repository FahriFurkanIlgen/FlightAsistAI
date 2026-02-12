import { Router, Request, Response } from 'express';
import { WidgetConfig, DEFAULT_CONFIG, DEFAULT_CATEGORIES } from '../../../shared/types/config';

const router = Router();

// In-memory config storage (in production, this would be in a database)
const siteConfigs: Map<string, WidgetConfig> = new Map();

// Initialize default config for skechers
siteConfigs.set('skechers-tr', {
  siteId: 'skechers-tr',
  siteName: process.env.SITE_NAME || 'Skechers Turkey',
  primaryColor: '#000000',
  secondaryColor: '#e31e24',
  welcomeMessage: "Hello, let's quickly find what you are looking for in the Skechers collection.",
  welcomeSubtext: 'New season, combination suggestions and order support.',
  categories: [
    { id: 'shoes', name: 'Shoes', emoji: '👟', keywords: ['shoes', 'ayakkabı', 'sneakers', 'running'] },
    { id: 'sports', name: 'Sports', emoji: '⚽', keywords: ['sport', 'spor', 'athletic', 'running'] },
    { id: 'casual', name: 'Casual', emoji: '👞', keywords: ['casual', 'günlük', 'lifestyle'] },
    { id: 'kids', name: 'Kids', emoji: '👶', keywords: ['kids', 'çocuk', 'children'] },
    { id: 'accessories', name: 'Accessories', emoji: '🎒', keywords: ['accessories', 'aksesuar', 'bag', 'socks'] },
  ],
  privacyPolicyUrl: 'https://www.skechers.com.tr/privacy-policy',
  brandingText: 'Powered by ShopAsistAI',
  showBranding: true,
});

// GET /api/config/:siteId
router.get('/:siteId', (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const config = siteConfigs.get(siteId);

    if (!config) {
      // Return default config if site not found
      return res.json({
        siteId,
        siteName: siteId,
        ...DEFAULT_CONFIG,
        categories: DEFAULT_CATEGORIES,
      });
    }

    res.json(config);
  } catch (error: any) {
    console.error('Config API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// POST /api/config/:siteId (for updating config)
router.post('/:siteId', (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;
    const config: WidgetConfig = req.body;

    if (!config.siteId || config.siteId !== siteId) {
      return res.status(400).json({
        error: 'Invalid config: siteId mismatch',
      });
    }

    siteConfigs.set(siteId, config);

    res.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error('Config Update Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
