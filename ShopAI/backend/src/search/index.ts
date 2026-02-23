// Search Engine Module Exports

export { SearchService } from './SearchService';
export { InvertedIndex } from './InvertedIndex';
export { BM25Scorer } from './BM25Scorer';
export { QueryParser } from './QueryParser';
export { QueryAnalyzer } from './QueryAnalyzer';
export { SKUMatcher } from './SKUMatcher';
export { AttributeBooster } from './AttributeBooster';
export { ProductIndexer } from './ProductIndexer';
export { MerchandisingEngine } from './MerchandisingEngine';

// Export utility functions
export * from './utils';

export type {
  SearchableProduct,
  ExtractedAttributes,
  ScoredProduct,
  InvertedIndexEntry,
  TermFrequency,
  BM25Parameters,
  QueryType,
  QueryAnalysisResult,
  StrategyResult,
} from './types';

export type {
  MerchandisingConfig,
  ProductSignals,
} from './MerchandisingEngine';
