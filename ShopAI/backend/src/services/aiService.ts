import OpenAI from 'openai';
import { ChatMessage, ChatRequest, ChatResponse, Product } from '../../../shared/types';
import { CacheService } from './cacheService';

export class AIService {
  private openai: OpenAI;
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({ apiKey });
    this.cacheService = cacheService;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { siteId, message, conversationHistory = [] } = request;

      const products = this.cacheService.getProducts(siteId);
      if (!products || products.length === 0) {
        return {
          message: 'Üzgünüm, şu anda ürün bilgilerine erişemiyorum. Lütfen daha sonra tekrar deneyin.',
        };
      }

      const relevantProducts = this.findRelevantProducts(products, message);
      const messages = this.buildMessages(message, conversationHistory, relevantProducts, siteId);

      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages,
        temperature: 0.8,
        max_tokens: 400,
        presence_penalty: 0.6,
        frequency_penalty: 0.3,
      });

      const aiMessage = completion.choices[0]?.message?.content || 'Üzgünüm, bir yanıt oluşturamadım.';

      return {
        message: aiMessage,
        recommendedProducts: relevantProducts.slice(0, 3),
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        message: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
      };
    }
  }

  private findRelevantProducts(products: Product[], query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    
    const normalizeText = (text: string) => 
      text.toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    
    const normalizedQuery = normalizeText(lowerQuery);
    const keywords = normalizedQuery.split(/\s+/).filter((w) => w.length > 2);

    const intents = {
      sports: /koşu|spor|running|athletic|sport|training|gym|fitness/i.test(query),
      casual: /günlük|casual|rahat|lifestyle|comfort/i.test(query),
      kids: /çocuk|kids|child|bebek|baby/i.test(query),
      men: /erkek|men|adam|bay/i.test(query),
      women: /kadın|women|bayan/i.test(query),
      price: /ucuz|uygun|pahalı|fiyat|price|cheap|expensive/i.test(query),
    };

    // Filter: only in stock products with product_type
    const eligibleProducts = products.filter((p) => {
      const availability = p.availability?.toLowerCase() || '';
      const isInStock = availability.includes('in stock') || availability.includes('stokta');
      const hasProductType = p.productType && p.productType.trim().length > 0;
      return isInStock && hasProductType;
    });

    const scored = eligibleProducts.map((product) => {
      let score = 0;
      const productText = normalizeText(`${product.title} ${product.description} ${product.productType || ''} ${product.googleProductCategory || ''}`);
      const productTitle = normalizeText(product.title);
      
      keywords.forEach((keyword) => {
        if (productTitle.includes(keyword)) score += 10;
        if (productText.includes(keyword)) score += 5;
        if (product.brand && normalizeText(product.brand).includes(keyword)) score += 3;
      });

      if (intents.sports && /spor|sport|running|athletic|koşu/i.test(productText)) score += 15;
      if (intents.casual && /günlük|casual|rahat|lifestyle/i.test(productText)) score += 15;
      if (intents.kids && /çocuk|kids|child/i.test(productText)) score += 20;
      if (intents.men && /erkek|men|adam/i.test(productText)) score += 10;
      if (intents.women && /kadın|women|bayan/i.test(productText)) score += 10;

      if (product.brand?.toLowerCase() === 'skechers') score += 2;

      return { product, score };
    });

    // Sort by score and diversify
    const sorted = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    // Select diverse products (different categories/brands)
    const diverse: Product[] = [];
    const usedCategories = new Set<string>();
    const usedBrands = new Set<string>();

    for (const item of sorted) {
      if (diverse.length >= 10) break;
      
      const category = item.product.productType || '';
      const brand = item.product.brand || '';
      
      // For first 3 products, ensure diversity
      if (diverse.length < 3) {
        if (!usedCategories.has(category) || !usedBrands.has(brand)) {
          diverse.push(item.product);
          usedCategories.add(category);
          usedBrands.add(brand);
          continue;
        }
      }
      
      // After first 3, allow duplicates
      if (diverse.length >= 3) {
        diverse.push(item.product);
      }
    }

    return diverse;
  }

  private buildMessages(
    userMessage: string,
    history: ChatMessage[],
    products: Product[],
    siteId: string
  ): any[] {
    const topProducts = products.slice(0, 5);
    
    const systemPrompt = `Sen ${siteId} sitesinin profesyonel alışveriş danışmanısın. Müşterilere en uygun ürünleri öneriyorsun.

ÖNEMLİ KURALLAR:
1. Sadece aşağıdaki ürünlerden öner
2. Her öneride ürün adını belirt
3. Fiyatı mutlaka söyle
4. Müşteriye neden bu ürünü önerdiğini kısaca açıkla
5. Samimi ve profesyonel ol
6. 2-3 cümlede özetle

MEVCUT ÜRÜNLER:
${topProducts.map((p, i) => {
      let priceText = '';
      if (p.salePrice) {
        const discount = this.calculateDiscount(p.price, p.salePrice);
        if (discount.hasDiscount) {
          priceText = `İndirimli Fiyat: ${discount.newPrice} (Eski Fiyat: ${discount.oldPrice}, %${discount.discountPercent} İNDİRİM!)`;
        } else {
          priceText = `Fiyat: ${this.parsePrice(p.salePrice)}`;
        }
      } else {
        priceText = `Fiyat: ${this.parsePrice(p.price)}`;
      }
      
      const specs = [];
      if (p.color) specs.push(`Renk: ${p.color}`);
      if (p.size) specs.push(`Beden: ${p.size}`);
      const specsText = specs.length > 0 ? `\n   Özellikler: ${specs.join(', ')}` : '';
      return `${i + 1}. "${p.title}"
   Kategori: ${p.productType}
   ${priceText}
   Marka: ${p.brand || 'Belirtilmemiş'}${specsText}`;
    }).join('\n\n')}

ÖRNEK YANIT ŞABLONU:
"Size [ürün adı] önerebilirim, [fiyat] [indirim varsa: şu an %X indirimde!]. [Renk/beden bilgisi varsa belirt]. Bu ürün [özellik/neden]. Ayrıca [alternatif ürün] de harika bir seçenek."

KESİNLİKLE YAPMA:
- Listede olmayan ürün önerme
- Genel açıklamalar yapma
- Uzun uzun anlatma
- Fiyatı atlama
- İndirimi atlama (varsa mutlaka belirt)
- Renk ve beden bilgisini atla`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    const recentHistory = history.slice(-5);
    recentHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    messages.push({
      role: 'user',
      content: userMessage,
    });

    return messages;
  }

  private parsePrice(priceStr: string): string {
    const match = priceStr.match(/[\d.,]+/);
    if (match) {
      const price = parseFloat(match[0].replace(',', '.'));
      return `${price.toFixed(2)} TL`;
    }
    return priceStr;
  }

  private calculateDiscount(price: string, salePrice: string): { hasDiscount: boolean; discountPercent: number; oldPrice: string; newPrice: string } {
    const priceMatch = price.match(/[\d.,]+/);
    const salePriceMatch = salePrice.match(/[\d.,]+/);
    
    if (!priceMatch || !salePriceMatch) {
      return { hasDiscount: false, discountPercent: 0, oldPrice: price, newPrice: price };
    }
    
    const oldPrice = parseFloat(priceMatch[0].replace(',', '.'));
    const newPrice = parseFloat(salePriceMatch[0].replace(',', '.'));
    
    if (newPrice < oldPrice) {
      const discountPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
      return {
        hasDiscount: true,
        discountPercent,
        oldPrice: `${oldPrice.toFixed(2)} TL`,
        newPrice: `${newPrice.toFixed(2)} TL`,
      };
    }
    
    return { hasDiscount: false, discountPercent: 0, oldPrice: this.parsePrice(price), newPrice: this.parsePrice(price) };
  }
}
