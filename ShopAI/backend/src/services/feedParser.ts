import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { GoogleFeed, Product } from '../../../shared/types';
import { CacheService } from './cacheService';

export class FeedParserService {
  constructor(private cacheService: CacheService) {}

  async parseFeed(siteId: string, siteName: string, feedUrl: string): Promise<GoogleFeed> {
    try {
      console.log(`📡 Fetching feed for ${siteName} from ${feedUrl}`);
      
      // Fetch XML feed
      const response = await axios.get(feedUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'ShopAsistAI/1.0',
        },
      });

      // Parse XML
      const parsed = await parseStringPromise(response.data, {
        explicitArray: false,
        mergeAttrs: true,
      });

      // Extract products
      const products = this.extractProducts(parsed);
      
      const feed: GoogleFeed = {
        siteId,
        siteName,
        feedUrl,
        lastUpdated: new Date(),
        products,
      };

      // Cache the feed
      this.cacheService.setFeed(feed);
      
      console.log(`✅ Parsed ${products.length} products for ${siteName}`);
      return feed;
    } catch (error) {
      console.error(`❌ Error parsing feed for ${siteName}:`, error);
      throw error;
    }
  }

  private extractProducts(parsed: any): Product[] {
    try {
      // Google Shopping Feed uses RSS 2.0 or Atom format
      let items: any[] = [];

      // Try RSS 2.0 format
      if (parsed.rss?.channel?.item) {
        items = Array.isArray(parsed.rss.channel.item)
          ? parsed.rss.channel.item
          : [parsed.rss.channel.item];
      }
      // Try Atom format
      else if (parsed.feed?.entry) {
        items = Array.isArray(parsed.feed.entry)
          ? parsed.feed.entry
          : [parsed.feed.entry];
      }

      return items
        .map((item) => this.parseProduct(item))
        .filter((p) => {
          if (!p) return false;
          // Only include products that are in stock
          const availability = p.availability?.toLowerCase() || '';
          return availability.includes('in stock') || availability.includes('stokta');
        }) as Product[];
    } catch (error) {
      console.error('Error extracting products:', error);
      return [];
    }
  }

  private parseProduct(item: any): Product | null {
    try {
      // Handle both RSS and Atom formats with Google Shopping namespace (g:)
      const getValue = (key: string, gKey?: string): string => {
        const gValue = gKey ? item[`g:${gKey}`] : item[`g:${key}`];
        return gValue || item[key] || '';
      };

      const id = getValue('id') || getValue('guid') || '';
      if (!id) return null;

      const product: Product = {
        id,
        title: getValue('title'),
        description: getValue('description'),
        link: getValue('link'),
        imageLink: getValue('image_link', 'image_link') || getValue('image'),
        price: getValue('price'),
        salePrice: getValue('sale_price'),
        availability: getValue('availability') || 'in stock',
        brand: getValue('brand'),
        gtin: getValue('gtin'),
        mpn: getValue('mpn'),
        condition: getValue('condition') || 'new',
        googleProductCategory: getValue('google_product_category'),
        productType: getValue('product_type'),
        color: getValue('color'),
        size: getValue('size'),
      };

      // Handle additional images
      const additionalImages = getValue('additional_image_link');
      if (additionalImages) {
        product.additionalImageLinks = Array.isArray(additionalImages)
          ? additionalImages
          : [additionalImages];
      }

      return product;
    } catch (error) {
      console.error('Error parsing product:', error);
      return null;
    }
  }
}
