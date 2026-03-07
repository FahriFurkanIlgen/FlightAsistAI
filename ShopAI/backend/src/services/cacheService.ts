import NodeCache from 'node-cache';
import { FlightFeed, Flight } from '../../../shared/types';
import { SearchService } from '../search';
import { WidgetConfig, QueryParserVersion } from '../../../shared/types/config';

export class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;
  private readonly TTL: number;
  private searchServices: Map<string, SearchService> = new Map();
  private siteConfigs: Map<string, WidgetConfig> = new Map(); // Store site configs

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
    const searchCacheStats: Record<string, any> = {};
    
    // Collect stats from all SearchService instances
    for (const [siteId, searchService] of this.searchServices.entries()) {
      searchCacheStats[siteId] = searchService.getStats();
    }
    
    return {
      keys: this.cache.keys().length,
      stats: this.cache.getStats(),
      searchServices: searchCacheStats,
    };
  }

  // Specific methods for our use case
  public getFeed(siteId: string): FlightFeed | undefined {
    return this.get<FlightFeed>(`feed:${siteId}`);
  }

  public setFeed(feed: FlightFeed): boolean {
    const success = this.set(`feed:${feed.siteId}`, feed);
    
    if (success && feed.flights && feed.flights.length > 0) {
      // Build search index when feed is updated
      this.buildSearchIndex(feed.siteId, feed.flights);
    }
    
    return success;
  }

  /**
   * Build or rebuild search index for a site
   */
  private buildSearchIndex(siteId: string, flights: Flight[]): void {
    try {
      console.log(`[CacheService] buildSearchIndex called with ${flights.length} flights`);
      
      // Debug: Count direct flights
      const directCount = flights.filter(f => f.stops === 0).length;
      console.log(`[CacheService] Direct flights: ${directCount}`);
      
      let searchService = this.searchServices.get(siteId);
      
      // Get parser version from site config (default: v1)
      const config = this.siteConfigs.get(siteId);
      const parserVersion = (config?.queryParserVersion || 'v1') as QueryParserVersion;
      
      if (!searchService) {
        searchService = new SearchService(parserVersion);
        this.searchServices.set(siteId, searchService);
        console.log(`🔍 Search service created for ${siteId} with parser version: ${parserVersion}`);
      } else {
        // Update parser version if config changed
        searchService.setParserVersion(parserVersion);
      }
      
      searchService.buildIndex(flights);
      console.log(`🔍 Search index built for ${siteId}`);
    } catch (error) {
      console.error(`Error building search index for ${siteId}:`, error);
    }
  }

  /**
   * Get search service for a site (production-grade BM25 search)
   */
  public getSearchService(siteId: string): SearchService | undefined {
    return this.searchServices.get(siteId);
  }

  /**
   * Use hybrid search engine (BM25 + attribute boosting)
   */
  public async hybridSearch(siteId: string, query: string, topK: number = 10): Promise<Flight[]> {
    const searchService = this.getSearchService(siteId);
    
    if (searchService && searchService.isReady()) {
      // Use production-grade search engine
      return await searchService.search(query, topK);
    }
    
    // Fallback to simple search
    console.warn(`[CacheService] Hybrid search not available for ${siteId}, using fallback`);
    return this.searchFlights(siteId, query).slice(0, topK);
  }

  public getFlights(siteId: string): Flight[] | undefined {
    const feed = this.getFeed(siteId);
    return feed?.flights;
  }

  /**
   * Get all flights from all sites (for GraphDB sync)
   */
  public getAllFlights(): Flight[] {
    const allFlights: Flight[] = [];
    const keys = this.cache.keys();
    
    // Get all feed keys
    const feedKeys = keys.filter(key => key.startsWith('feed:'));
    
    for (const key of feedKeys) {
      const feed = this.get<FlightFeed>(key);
      if (feed && feed.flights) {
        allFlights.push(...feed.flights);
      }
    }
    
    console.log(`[CacheService] getAllFlights: Found ${allFlights.length} flights from ${feedKeys.length} sites`);
    return allFlights;
  }

  public searchFlights(siteId: string, query: string, filters?: any): Flight[] {
    const flights = this.getFlights(siteId);
    if (!flights || !query) return [];

    const lowerQuery = query.toLowerCase();
    return flights.filter(
      (f) =>
        f.airline.toLowerCase().includes(lowerQuery) ||
        f.departure.city.toLowerCase().includes(lowerQuery) ||
        f.arrival.city.toLowerCase().includes(lowerQuery) ||
        f.flightNumber.toLowerCase().includes(lowerQuery)
    );
  }

  public async filterFlightsByRoute(siteId: string, from: string, to: string): Promise<Flight[]> {
    const flights = this.getFlights(siteId);
    if (!flights || !from || !to) return [];

    // Filter flights by route
    const routeFiltered = flights.filter((f) => {
      const departureCity = f.departure.city.toLowerCase();
      const arrivalCity = f.arrival.city.toLowerCase();
      const lowerFrom = from.toLowerCase();
      const lowerTo = to.toLowerCase();
      
      return departureCity.includes(lowerFrom) && arrivalCity.includes(lowerTo);
    });

    console.log(`[CacheService] Route filter: ${from} -> ${to}: ${routeFiltered.length} flights found`);

    // Sort by price (lowest first) and stops (direct flights first)
    routeFiltered.sort((a, b) => {
      // Prefer direct flights
      if (a.stops !== b.stops) {
        return a.stops - b.stops;
      }
      
      // Then by price
      const aPrice = this.extractPrice(a.price);
      const bPrice = this.extractPrice(b.price);
      if (aPrice !== null && bPrice !== null) {
        return aPrice - bPrice;
      }
      
      return 0;
    });

    return routeFiltered;
  }

  /**
   * Deduplicate flights by flight number (removed - not needed for flights)
   */

  /**
   * Extract numeric price from price string
   */
  private extractPrice(priceStr: string): number | null {
    const match = priceStr.match(/[\d.,]+/);
    if (match) {
      return parseFloat(match[0].replace(',', '.'));
    }
    return null;
  }

  /**
   * Set site configuration (including parser version)
   */
  public setSiteConfig(config: WidgetConfig): void {
    this.siteConfigs.set(config.siteId, config);
    console.log(`⚙️  Config set for ${config.siteId}, queryParserVersion: ${config.queryParserVersion || 'v1'}`);
    
    // Rebuild search index if feed exists (to apply new parser version)
    const feed = this.getFeed(config.siteId);
    if (feed?.flights && feed.flights.length > 0) {
      this.buildSearchIndex(config.siteId, feed.flights);
    }
  }

  /**
   * Get site configuration
   */
  public getSiteConfig(siteId: string): WidgetConfig | undefined {
    return this.siteConfigs.get(siteId);
  }

  /**
   * Set query parser version for a site
   */
  public setParserVersion(siteId: string, version: QueryParserVersion): void {
    const config = this.siteConfigs.get(siteId) || { siteId, siteName: siteId };
    config.queryParserVersion = version;
    this.setSiteConfig(config);
  }

  /**
   * Get current parser version for a site
   */
  public getParserVersion(siteId: string): QueryParserVersion {
    return (this.siteConfigs.get(siteId)?.queryParserVersion || 'v1') as QueryParserVersion;
  }
}
