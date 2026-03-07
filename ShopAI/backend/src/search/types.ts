// Search Engine Type Definitions

import { Flight } from '../../../shared/types';

export interface SearchableFlight extends Flight {
  searchableText: string; // Combined text for BM25
  normalizedAirline: string;
  normalizedDeparture: string;
  normalizedArrival: string;
  normalizedCabinClass: string;
}

export interface ExtractedAttributes {
  airline?: string;
  departure?: string;
  arrival?: string;
  date?: string;
  cabinClass?: 'economy' | 'business' | 'first';
  stops?: number; // 0 = direct, 1+ = connecting
  priceRange?: { min?: number; max?: number };
  keywords: string[];
  passengers?: number;
  flightNumber?: string;
  preferredTimes?: string[]; // morning, afternoon, evening, night
}

/**
 * Query Type Detection Results
 */
export type QueryType = 
  | 'flight-number'    // Exact flight number: XQ123
  | 'route-direct'     // Direct route: Istanbul to London
  | 'route-flexible'   // Flexible route with dates
  | 'date-specific'    // Specific date search
  | 'price-range'      // Price queries: 500-1000 EUR
  | 'attribute-combo'  // Cabin + stops, airline + route
  | 'destination'      // Destination search
  | 'semantic'         // Natural language
  | 'multi-strategy';  // Combination of multiple types

export interface QueryAnalysisResult {
  primaryType: QueryType;
  secondaryTypes: QueryType[];
  confidence: number;
  detectedPatterns: {
    flightNumber?: string;
    departure?: string;
    arrival?: string;
    date?: string;
    priceRange?: { min?: number; max?: number };
    destination?: string[];
  };
  shouldTryAllStrategies: boolean;
}

/**
 * Search Strategy Result
 */
export interface StrategyResult {
  strategy: string;
  flights: Flight[];
  score: number;
  matchCount: number;
}

export interface ScoredFlight {
  flight: Flight;
  scores: {
    bm25: number;
    airline: number;
    route: number;
    stops: number;
    cabinClass: number;
    date: number;
    merchandising?: number;
    final: number;
  };
}

export interface InvertedIndexEntry {
  term: string;
  documentFrequency: number; // Number of documents containing this term
  postings: Map<string, TermFrequency>; // flightId -> term frequency
}

export interface TermFrequency {
  frequency: number; // How many times term appears in document
  positions?: number[]; // Optional: term positions for phrase queries
}

export interface BM25Parameters {
  k1: number; // Term frequency saturation parameter (1.2 - 2.0)
  b: number; // Length normalization parameter (0.75)
}
