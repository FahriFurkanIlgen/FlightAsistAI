// SKU Matcher - Handle SKU and product code searches

import { Product } from '../../../shared/types';

export interface SKUMatchResult {
  exactMatches: Product[];
  variantMatches: Product[];
  fuzzyMatches: Product[];
  allMatches: Product[];
}

export class SKUMatcher {
  private products: Product[];
  
  constructor(products: Product[]) {
    this.products = products;
  }
  
  /**
   * Update product list
   */
  updateProducts(products: Product[]): void {
    this.products = products;
  }
  
  /**
   * Find products by exact SKU/product code
   */
  findByExactSKU(sku: string): Product[] {
    const normalizedQuery = this.normalizeSKU(sku);
    
    return this.products.filter(product => {
      const productId = this.normalizeSKU(product.id);
      const productMPN = product.mpn ? this.normalizeSKU(product.mpn) : '';
      
      return productId === normalizedQuery || productMPN === normalizedQuery;
    });
  }
  
  /**
   * Find all variants of a product by partial SKU
   * Example: SK2520052 finds SK2520052-1602, SK2520052-1040, SK2520052-2195
   */
  findVariantsBySKU(partialSKU: string): Product[] {
    const normalizedQuery = this.normalizeSKU(partialSKU);
    
    return this.products.filter(product => {
      const productId = this.normalizeSKU(product.id);
      const productMPN = product.mpn ? this.normalizeSKU(product.mpn) : '';
      
      // Check if product ID starts with partial SKU
      return productId.startsWith(normalizedQuery) || 
             productMPN.startsWith(normalizedQuery);
    });
  }
  
  /**
   * Find products by product code (handles spaces: "253010 BBK")
   */
  findByProductCode(code: string): Product[] {
    const normalizedQuery = this.normalizeSKU(code);
    const queryParts = normalizedQuery.split(/[\s-]+/);
    
    return this.products.filter(product => {
      const productId = this.normalizeSKU(product.id);
      const productMPN = product.mpn ? this.normalizeSKU(product.mpn) : '';
      
      // Exact match
      if (productId === normalizedQuery || productMPN === normalizedQuery) {
        return true;
      }
      
      // Match with parts (handles "253010 BBK" vs "253010BBK")
      const idParts = productId.split(/[\s-]+/);
      const mpnParts = productMPN.split(/[\s-]+/);
      
      return this.matchParts(queryParts, idParts) || this.matchParts(queryParts, mpnParts);
    });
  }
  
  /**
   * Fuzzy matching for typos (Levenshtein distance)
   */
  findByFuzzySKU(sku: string, maxDistance: number = 2): Product[] {
    const normalizedQuery = this.normalizeSKU(sku);
    
    return this.products.filter(product => {
      const productId = this.normalizeSKU(product.id);
      const productMPN = product.mpn ? this.normalizeSKU(product.mpn) : '';
      
      const distanceToId = this.levenshteinDistance(normalizedQuery, productId);
      const distanceToMPN = productMPN ? this.levenshteinDistance(normalizedQuery, productMPN) : Infinity;
      
      return Math.min(distanceToId, distanceToMPN) <= maxDistance;
    });
  }
  
  /**
   * Comprehensive SKU search - tries all strategies
   */
  search(query: string): SKUMatchResult {
    const exactMatches = this.findByExactSKU(query);
    
    // If exact match found, also find its variants
    let variantMatches: Product[] = [];
    if (exactMatches.length > 0) {
      const baseSKU = this.extractBaseSKU(exactMatches[0].id);
      if (baseSKU) {
        variantMatches = this.findVariantsBySKU(baseSKU).filter(
          p => !exactMatches.some(em => em.id === p.id)
        );
      }
    } else {
      // Try partial SKU search
      variantMatches = this.findVariantsBySKU(query);
      
      // If still no results, try product code search
      if (variantMatches.length === 0) {
        variantMatches = this.findByProductCode(query);
      }
    }
    
    // Try fuzzy matching as last resort
    const fuzzyMatches = this.findByFuzzySKU(query, 2).filter(
      p => !exactMatches.some(em => em.id === p.id) &&
           !variantMatches.some(vm => vm.id === p.id)
    );
    
    const allMatches = [...exactMatches, ...variantMatches, ...fuzzyMatches];
    
    return {
      exactMatches,
      variantMatches,
      fuzzyMatches,
      allMatches,
    };
  }
  
  /**
   * Normalize SKU for comparison (remove spaces, lowercase)
   */
  private normalizeSKU(sku: string): string {
    return sku.toUpperCase().replace(/\s+/g, '');
  }
  
  /**
   * Extract base SKU from full SKU
   * SK2520052-1602 -> SK2520052
   * 253010 BBK -> 253010
   */
  private extractBaseSKU(sku: string): string | null {
    // Pattern 1: SK2520052-1602 -> SK2520052
    const match1 = sku.match(/^(SK\d{7})/i);
    if (match1) return match1[1];
    
    // Pattern 2: 253010 BBK -> 253010
    const match2 = sku.match(/^(\d{6})/);
    if (match2) return match2[1];
    
    // Pattern 3: 302036L -> 302036
    const match3 = sku.match(/^(\d{6})[A-Z]/);
    if (match3) return match3[1];
    
    return null;
  }
  
  /**
   * Check if query parts match product ID parts
   */
  private matchParts(queryParts: string[], productParts: string[]): boolean {
    if (queryParts.length !== productParts.length) return false;
    
    for (let i = 0; i < queryParts.length; i++) {
      if (queryParts[i] !== productParts[i]) return false;
    }
    
    return true;
  }
  
  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    return matrix[len1][len2];
  }
}
