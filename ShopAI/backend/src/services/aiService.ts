import OpenAI from 'openai';
import { ChatMessage, ChatRequest, ChatResponse, Flight } from '../../../shared/types';
import { CacheService } from './cacheService';
import { SimpleCache } from './simpleCache';

export class AIService {
  private openai: OpenAI;
  private cacheService: CacheService;
  private responseCache: SimpleCache<ChatResponse>;

  constructor(cacheService: CacheService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({ apiKey });
    this.cacheService = cacheService;
    this.responseCache = new SimpleCache<ChatResponse>(500, 300000); // Cache 500 responses for 5 min
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { siteId, message, conversationHistory = [] } = request;

      // Check for irrelevant queries
      const irrelevantResponse = this.checkIrrelevantQuery(message, siteId, conversationHistory);
      if (irrelevantResponse) {
        console.log(`[AIService] Irrelevant query detected: "${message}"`);
        return irrelevantResponse;
      }

      const flights = this.cacheService.getFlights(siteId);
      if (!flights || flights.length === 0) {
        const errorMessage = 'Üzgünüm, şu anda uçuş bilgilerine erişemiyorum. Lütfen daha sonra tekrar deneyin.';
        const updatedHistory: ChatMessage[] = [
          ...conversationHistory,
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: errorMessage, timestamp: new Date() },
        ];
        return {
          message: errorMessage,
          conversationHistory: updatedHistory,
        };
      }

      // Check cache
      const cacheKey = this.buildCacheKey(message, conversationHistory);
      const cachedResponse = this.responseCache.get(cacheKey);
      if (cachedResponse) {
        console.log(`[AIService] Cache HIT for: "${message}"`);
        return cachedResponse;
      }

      // Use hybrid search to find relevant flights
      const relevantFlights = await this.cacheService.hybridSearch(siteId, message, 20);
      
      console.log(`[AIService] Found ${relevantFlights.length} relevant flights`);

      // Build messages for OpenAI
      const messages = this.buildMessages(message, conversationHistory, relevantFlights, siteId);

      // Call OpenAI
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiMessage = completion.choices[0]?.message?.content || 
        'Size yardımcı olabilirim. Hangi destinasyona seyahat etmek istersiniz?';

      const updatedHistory: ChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: aiMessage, timestamp: new Date() },
      ];

      const response: ChatResponse = {
        message: aiMessage,
        recommendedFlights: relevantFlights.slice(0, 6),
        conversationHistory: updatedHistory,
        debug: {
          originalQuery: message,
          enhancedQuery: message,
          isFollowUp: false,
        },
      };

      // Cache the response
      this.responseCache.set(cacheKey, response);

      return response;

    } catch (error: any) {
      console.error('AI Service Error:', error);
      const errorMessage = 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.';
      return {
        message: errorMessage,
        conversationHistory: request.conversationHistory || [],
      };
    }
  }

  /**
   * Check if query is irrelevant to flight search
   */
  private checkIrrelevantQuery(message: string, _siteId: string, history: ChatMessage[]): ChatResponse | null {
    const lowerMessage = message.toLowerCase();
    
    // List of irrelevant query patterns
    const irrelevantPatterns = [
      /hava durumu/i,
      /tarif\s+ver/i,
      /matematik/i,
      /programlama/i,
      /kod\s+yaz/i,
      /şiir/i,
      /hikaye/i,
      /oyun/i,
      /film/i,
    ];

    if (irrelevantPatterns.some(pattern => pattern.test(lowerMessage))) {
      const response = 'Size uçuş rezervasyonu ve uçuş bilgileri konusunda yardımcı olabilirim. Hangi destinasyona seyahat etmek istersiniz?';
      const updatedHistory: ChatMessage[] = [
        ...history,
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date() },
      ];

      return {
        message: response,
        conversationHistory: updatedHistory,
        debug: {
          originalQuery: message,
          enhancedQuery: '',
          isFollowUp: false,
          queryType: 'irrelevant',
        },
      };
    }

    return null;
  }

  /**
   * Build messages for OpenAI chat completion
   */
  private buildMessages(
    userMessage: string,
    history: ChatMessage[],
    flights: Flight[],
    _siteId: string
  ): any[] {
    const systemPrompt = `Sen SunExpress havayolu şirketinin AI uçuş asistanısın. 
Kullanıcıların uçuş bulmasına yardımcı olursun. 

Görevin:
- Kullanıcıya dostça ve profesyonel bir şekilde uçuş önerileri sunmak
- Uçuşlar hakkında detaylı bilgi vermek (kalkış/varış saati, süre, fiyat, aktarma bilgisi)
- Direkt ve aktarmalı uçuş seçeneklerini açıklamak
- Cabin class (ekonomi, business, first) bilgilerini paylaşmak
- Fiyat karşılaştırması yapmak

Önemli kurallar:
- SADECE sana verilen uçuş bilgilerini kullan, uydurma
- Uçuş rezervasyonu YAPMA, sadece bilgi ver
- Türkçe dilinde profesyonel ve samimi bir dille cevap ver
- Kısa ve net cevaplar ver (max 3-4 cümle)
- Eğer uygun uçuş yoksa, alternatif destinasyonlar öner`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (last 5 messages for context)
    const recentHistory = history.slice(-5);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add current query with flight data
    let flightContext = '';
    if (flights && flights.length > 0) {
      flightContext = `\n\nMevcut uçuşlar:\n`;
      flights.slice(0, 10).forEach((flight, i) => {
        flightContext += `${i + 1}. ${flight.airline} ${flight.flightNumber}: `;
        flightContext += `${flight.departure.city} (${flight.departure.airport}) ${flight.departure.time.substring(0,5)} → `;
        flightContext += `${flight.arrival.city} (${flight.arrival.airport}) ${flight.arrival.time.substring(0,5)}, `;
        flightContext += `Süre: ${flight.duration}, `;
        flightContext += `${flight.stops === 0 ? 'Direkt' : flight.stops + ' Aktarma'}`;
        if (flight.stopCities && flight.stopCities.length > 0) {
          flightContext += ` (${flight.stopCities.join(', ')})`;
        }
        flightContext += `, ${flight.price} ${flight.currency}, ${flight.cabinClass}, `;
        flightContext += `Tarih: ${flight.departure.date}\n`;
      });
    } else {
      flightContext = '\n\nMaalesef bu kriterlere uygun uçuş bulunamadı. Alternatif destinasyonlar veya tarihler önerebilirsin.';
    }

    messages.push({
      role: 'user',
      content: userMessage + flightContext,
    });

    return messages;
  }

  /**
   * Build cache key from message and history
   */
  private buildCacheKey(message: string, history: ChatMessage[]): string {
    const historyContext = history.slice(-2).map(m => m.content).join('|');
    return `${message}|${historyContext}`;
  }
}
