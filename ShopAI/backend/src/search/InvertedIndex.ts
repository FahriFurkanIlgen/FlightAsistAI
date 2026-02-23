// Inverted Index for BM25 Scoring

import { InvertedIndexEntry, TermFrequency } from './types';
import { tokenize, normalizeTurkish } from './utils';

export class InvertedIndex {
  private index: Map<string, InvertedIndexEntry> = new Map();
  private documentCount: number = 0;
  private avgDocumentLength: number = 0;
  private documentLengths: Map<string, number> = new Map();

  constructor() {}

  /**
   * Build inverted index from documents
   */
  buildIndex(documents: Array<{ id: string; text: string }>): void {
    this.clear();
    this.documentCount = documents.length;

    let totalLength = 0;

    // First pass: build index and calculate document lengths
    for (const doc of documents) {
      const terms = this.tokenize(doc.text);
      const termFrequencies = this.calculateTermFrequencies(terms);
      
      this.documentLengths.set(doc.id, terms.length);
      totalLength += terms.length;

      // Add to inverted index
      for (const [term, freq] of termFrequencies.entries()) {
        let entry = this.index.get(term);
        
        if (!entry) {
          entry = {
            term,
            documentFrequency: 0,
            postings: new Map(),
          };
          this.index.set(term, entry);
        }

        entry.postings.set(doc.id, { frequency: freq });
        entry.documentFrequency = entry.postings.size;
      }
    }

    this.avgDocumentLength = this.documentCount > 0 ? totalLength / this.documentCount : 0;
  }

  /**
   * Get posting list for a term
   */
  getPostings(term: string): Map<string, TermFrequency> | undefined {
    const normalized = this.normalizeTerm(term);
    return this.index.get(normalized)?.postings;
  }

  /**
   * Get document frequency for a term
   */
  getDocumentFrequency(term: string): number {
    const normalized = this.normalizeTerm(term);
    return this.index.get(normalized)?.documentFrequency || 0;
  }

  /**
   * Get document length
   */
  getDocumentLength(docId: string): number {
    return this.documentLengths.get(docId) || 0;
  }

  /**
   * Get average document length
   */
  getAvgDocumentLength(): number {
    return this.avgDocumentLength;
  }

  /**
   * Get total document count
   */
  getDocumentCount(): number {
    return this.documentCount;
  }

  /**
   * Tokenize text into terms
   * Now uses centralized tokenization from utils.ts
   */
  private tokenize(text: string): string[] {
    return tokenize(text);
  }

  /**
   * Normalize a single term
   */
  private normalizeTerm(term: string): string {
    return normalizeTurkish(term);
  }

  /**
   * Calculate term frequencies in a document
   */
  private calculateTermFrequencies(terms: string[]): Map<string, number> {
    const frequencies = new Map<string, number>();
    
    for (const term of terms) {
      frequencies.set(term, (frequencies.get(term) || 0) + 1);
    }
    
    return frequencies;
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.index.clear();
    this.documentLengths.clear();
    this.documentCount = 0;
    this.avgDocumentLength = 0;
  }

  /**
   * Get index statistics
   */
  getStats(): { terms: number; documents: number; avgLength: number } {
    return {
      terms: this.index.size,
      documents: this.documentCount,
      avgLength: this.avgDocumentLength,
    };
  }
}
