import { Router, Request, Response } from 'express';
import { AIService } from '../services/aiService';
import { CacheService } from '../services/cacheService';
import { ChatRequest } from '../../../shared/types';

const router = Router();
const cacheService = CacheService.getInstance();
let aiService: AIService | null = null;

// Initialize AI service (lazy loading to handle missing API key gracefully)
const getAIService = (): AIService => {
  if (!aiService) {
    aiService = new AIService(cacheService);
  }
  return aiService;
};

// POST /api/chat
router.post('/', async (req: Request, res: Response) => {
  try {
    const chatRequest: ChatRequest = req.body;

    // Validate request
    if (!chatRequest.siteId || !chatRequest.message) {
      return res.status(400).json({
        error: 'Missing required fields: siteId and message',
      });
    }

    // Get AI response
    const aiServiceInstance = getAIService();
    const response = await aiServiceInstance.chat(chatRequest);

    res.json(response);
  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    if (error.message?.includes('OPENAI_API_KEY')) {
      return res.status(503).json({
        error: 'AI service is not configured. Please set OPENAI_API_KEY in environment variables.',
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
