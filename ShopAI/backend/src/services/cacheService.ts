import NodeCache from 'node-cache';
import { GoogleFeed, Product } from '../../../shared/types';

export class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;
  private readonly TTL: number;

  private constructor() {
    this.TTL = parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10);
    this.cache = new NodeCache({ 
      stdTTL: this.TTL,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Better performance
    });

    console.log(`💾 Cache initialized with TTL: ${this.TTL}s (${this.TTL / 60} minutes)`);
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public set(key: string, value: any): boolean {
    try {
      return this.cache.set(key, value);
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  public get<T>(key: string): T | undefined {
    try {
      return this.cache.get<T>(key);
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return undefined;
    }
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public delete(key: string): number {
    return this.cache.del(key);
  }

  public flush(): void {
    this.cache.flushAll();
    console.log('🗑️  Cache flushed');
  }

  public getStats() {
    return {
      keys: this.cache.keys().length,
      stats: this.cache.getStats(),
    };
  }

  // Specific methods for our use case
  public getFeed(siteId: string): GoogleFeed | undefined {
    return this.get<GoogleFeed>(`feed:${siteId}`);
  }

  public setFeed(feed: GoogleFeed): boolean {
    return this.set(`feed:${feed.siteId}`, feed);
  }

  public getProducts(siteId: string): Product[] | undefined {
    const feed = this.getFeed(siteId);
    return feed?.products;
  }

  public searchProducts(siteId: string, query: string): Product[] {
    const products = this.getProducts(siteId);
    if (!products || !query) return [];

    const lowerQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.brand?.toLowerCase().includes(lowerQuery)
    );
  }

  public filterProductsByCategory(siteId: string, keywords: string[]): Product[] {
    const products = this.getProducts(siteId);
    if (!products || !keywords || keywords.length === 0) return [];

    return products.filter((p) => {
      const searchText = `${p.title} ${p.description} ${p.productType || ''} ${p.googleProductCategory || ''}`.toLowerCase();
      return keywords.some((keyword) => searchText.includes(keyword.toLowerCase()));
    });
  }
}
