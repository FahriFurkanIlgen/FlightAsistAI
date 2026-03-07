// Simple Flight Search Service

import { Flight } from '../../../shared/types';
import { InvertedIndex } from './InvertedIndex';
import { BM25Scorer } from './BM25Scorer';
import { SearchableFlight } from './types';
import type { QueryParserVersion } from '../../../shared/types/config';
import { SimpleCache } from '../services/simpleCache';

export class SearchService {
  private index: InvertedIndex;
  private scorer: BM25Scorer;
  private searchableFlights: Map<string, SearchableFlight> = new Map();
  private allFlights: Flight[] = [];
  private isIndexed: boolean = false;
  private searchCache: SimpleCache<Flight[]>;
  private parserVersion: QueryParserVersion;

  constructor(parserVersion: QueryParserVersion = 'v1') {
    this.index = new InvertedIndex();
    this.scorer = new BM25Scorer(this.index);
    this.searchCache = new SimpleCache<Flight[]>(1000, 600000); // Cache 1000 queries for 10 min
    this.parserVersion = parserVersion;
    
    console.log(`[SearchService] Initialized with Query Parser version: ${parserVersion}`);
  }

  /**
   * Build index from flights
   */
  buildIndex(flights: Flight[]): void {
    console.log(`[SearchService] Building index for ${flights.length} flights...`);
    
    const startTime = Date.now();

    // Store all flights
    this.allFlights = flights;

    // Convert to searchable flights
    const searchableFlights = this.indexFlights(flights);
    console.log(`[SearchService] Indexed ${searchableFlights.length} searchable flights`);
    
    this.searchableFlights.clear();
    searchableFlights.forEach(f => {
      this.searchableFlights.set(f.id, f);
    });

    // Prepare documents for inverted index
    const documents: Array<{ id: string; text: string }> = [];
    searchableFlights.forEach(flight => {
      documents.push({ id: flight.id, text: flight.searchableText });
    });

    // Build inverted index
    this.index.buildIndex(documents);

    this.isIndexed = true;

    const duration = Date.now() - startTime;
    const stats = this.index.getStats();
    console.log(`[SearchService] Index built in ${duration}ms - ${stats.terms} terms, ${stats.documents} docs`);
  }

  /**
   * Search for flights
   */
  async search(query: string, topK: number = 10): Promise<Flight[]> {
    if (!this.isIndexed) {
      console.warn('[SearchService] Index not built. Call buildIndex() first.');
      return [];
    }

    // Check cache
    const cacheKey = `${query}-${topK}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      console.log(`[SearchService] Cache HIT for: "${query}"`);
      return cached;
    }

    console.log(`[SearchService] Searching for: "${query}"`);

    // Normalize query
    const normalizedQuery = this.normalizeText(query);
    const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);

    // Use BM25 for text matching
    const scoredFlights = Array.from(this.searchableFlights.values()).map(flight => {
      const bm25Score = this.scorer.score(queryTerms, flight.id);
      
      // Bonus scoring for direct matches
      let bonus = 0;
      
      // Direct flights get slight boost
      if (flight.stops === 0) bonus += 0.1;
      
      // Exact city name matches
      if (flight.normalizedDeparture.includes(normalizedQuery)) bonus += 0.5;
      if (flight.normalizedArrival.includes(normalizedQuery)) bonus += 0.5;
      
      // Airline name match
      if (flight.normalizedAirline.includes(normalizedQuery)) bonus += 0.3;

      return {
        flight: this.allFlights.find(f => f.id === flight.id)!,
        score: bm25Score + bonus,
      };
    });

    // Sort by score and take top K
    scoredFlights.sort((a, b) => b.score - a.score);
    const results = scoredFlights
      .filter(sf => sf.score > 0)
      .slice(0, topK)
      .map(sf => sf.flight);

    console.log(`[SearchService] Found ${results.length} flights for query: "${query}"`);

    // Cache results
    this.searchCache.set(cacheKey, results);

    return results;
  }

  /**
   * Convert flights to searchable format
   */
  private indexFlights(flights: Flight[]): SearchableFlight[] {
    return flights.map(flight => {
      const searchableText = [
        flight.flightNumber,
        flight.airline,
        flight.departure.city,
        flight.departure.airport,
        flight.departure.country,
        flight.arrival.city,
        flight.arrival.airport,
        flight.arrival.country,
        flight.cabinClass,
        flight.stops === 0 ? 'direkt direct nonstop' : 'aktarma connecting',
        flight.stopCities?.join(' ') || '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return {
        ...flight,
        searchableText,
        normalizedAirline: this.normalizeText(flight.airline),
        normalizedDeparture: this.normalizeText(flight.departure.city),
        normalizedArrival: this.normalizeText(flight.arrival.city),
        normalizedCabinClass: this.normalizeText(flight.cabinClass),
      };
    });
  }

  /**
   * Normalize Turkish text
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .trim();
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isIndexed && this.allFlights.length > 0;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      indexed: this.isIndexed,
      flights: this.allFlights.length,
      cacheSize: this.searchCache.size(),
      indexStats: this.index.getStats(),
    };
  }

  /**
   * Set parser version
   */
  setParserVersion(version: QueryParserVersion): void {
    this.parserVersion = version;
    console.log(`[SearchService] Parser version updated to: ${version}`);
  }
}

