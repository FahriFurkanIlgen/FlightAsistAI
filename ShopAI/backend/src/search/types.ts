// Search Engine Type Definitions

import { Product } from '../../../shared/types';

export interface SearchableProduct extends Product {
  searchableText: string; // Combined text for BM25
  normalizedBrand: string;
  normalizedColor: string;
  normalizedCategory: string;
  normalizedSize: string;
}

export interface ExtractedAttributes {
  brand?: string;
  color?: string;
  category?: string[];
  size?: string;
  priceRange?: { min?: number; max?: number };
  keywords: string[];
  isChildQuery?: boolean; // Sorgu çocuk ürünü için mi?
  gender?: 'erkek' | 'kadin' | 'kiz' | 'unisex'; // Cinsiyet/hedef kitle
  specialFeatures?: string[]; // İşıklı, su geçirmez, vs
  sku?: string; // SKU/Product Code
}

/**
 * Query Type Detection Results
 */
export type QueryType = 
  | 'sku-exact'        // Exact SKU match: SK2520052-1602
  | 'sku-partial'      // Partial SKU: SK2520052 (find all variants)
  | 'sku-fuzzy'        // Fuzzy SKU with typos
  | 'product-code'     // Product codes: 253010 BBK, 100439
  | 'size-only'        // Just size: 42, 28, 5-6
  | 'price-range'      // Price queries: 2000-3000 TL
  | 'attribute-combo'  // Color + size, brand + model
  | 'category'         // Category search
  | 'semantic'         // Natural language
  | 'multi-strategy';  // Combination of multiple types

export interface QueryAnalysisResult {
  primaryType: QueryType;
  secondaryTypes: QueryType[];
  confidence: number;
  detectedPatterns: {
    sku?: string;
    partialSku?: string;
    productCode?: string;
    size?: string;
    priceRange?: { min?: number; max?: number };
    category?: string[];
  };
  shouldTryAllStrategies: boolean;
}

/**
 * Search Strategy Result
 */
export interface StrategyResult {
  strategy: string;
  products: Product[];
  score: number;
  matchCount: number;
}

export interface ScoredProduct {
  product: Product;
  scores: {
    bm25: number;
    brand: number;
    color: number;
    category: number;
    size: number;
    gender: number;
    specialFeatures: number;
    merchandising?: number;
    final: number;
  };
}

export interface InvertedIndexEntry {
  term: string;
  documentFrequency: number; // Number of documents containing this term
  postings: Map<string, TermFrequency>; // productId -> term frequency
}

export interface TermFrequency {
  frequency: number; // How many times term appears in document
  positions?: number[]; // Optional: term positions for phrase queries
}

export interface BM25Parameters {
  k1: number; // Term frequency saturation parameter (1.2 - 2.0)
  b: number; // Length normalization parameter (0.75)
}
