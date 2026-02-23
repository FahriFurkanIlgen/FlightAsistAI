/**
 * Search Utility Functions
 * 
 * Common utilities for search functionality
 */

/**
 * Normalize Turkish characters to ASCII equivalents
 * This allows queries like "kosu" to match "koşu"
 * 
 * @example
 * normalizeTurkish("koşu ayakkabısı") → "kosu ayakkabisi"
 * normalizeTurkish("ışıklı çocuk") → "isikli cocuk"
 */
export function normalizeTurkish(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c');
}

/**
 * Tokenize text into searchable terms
 * - Converts to lowercase
 * - Normalizes Turkish characters
 * - Removes punctuation
 * - Splits on whitespace
 * - Filters out short words (<2 chars)
 * 
 * @example
 * tokenize("Nike Koşu Ayakkabısı") → ["nike", "kosu", "ayakkabisi"]
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  
  const normalized = normalizeTurkish(text);
  
  return normalized
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/) // Split on whitespace
    .filter(token => token.length >= 2) // Filter short words
    .filter(token => !STOP_WORDS.has(token)); // Remove stop words
}

/**
 * Turkish stop words to ignore during search
 * These are common words that don't add search value
 */
const STOP_WORDS = new Set([
  've', 'veya', 'ile', 'için', 'gibi', 'kadar', 'mi', 'mu', 'mü',
  'da', 'de', 'ta', 'te', 'bir', 'bu', 'şu', 'o',
  'ben', 'sen', 'biz', 'siz', 'onlar',
  'var', 'yok', 'daha', 'en', 'çok', 'az',
]);

/**
 * Check if two strings match (case-insensitive, Turkish-normalized)
 */
export function fuzzyMatch(str1: string, str2: string): boolean {
  if (!str1 || !str2) return false;
  return normalizeTurkish(str1) === normalizeTurkish(str2);
}

/**
 * Calculate similarity score between two strings (0-1)
 * Uses normalized Levenshtein distance
 */
export function similarity(str1: string, str2: string): number {
  const s1 = normalizeTurkish(str1);
  const s2 = normalizeTurkish(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  // Simple containment check
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.7; // High similarity if one contains the other
  }
  
  // Levenshtein distance (simplified)
  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  
  return 1 - (distance / maxLen);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Extract size/number from query
 * Handles various formats: "42", "42 numara", "size 42", etc.
 */
export function extractSize(query: string): string | null {
  const sizePatterns = [
    /\b(\d{1,2}(?:\.\d)?)\s*(?:numara|beden|size)\b/i,
    /(?:numara|beden|size)\s*(\d{1,2}(?:\.\d)?)\b/i,
    /\b(\d{2})\b/, // Standalone 2-digit number
  ];
  
  for (const pattern of sizePatterns) {
    const match = query.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Extract brand from query
 * Checks against common brand names
 */
export function extractBrand(query: string): string | null {
  const normalized = normalizeTurkish(query);
  
  const commonBrands = [
    'nike', 'adidas', 'puma', 'reebok', 'new balance',
    'skechers', 'converse', 'vans', 'fila', 'under armour',
    'asics', 'mizuno', 'salomon', 'columbia', 'timberland',
  ];
  
  for (const brand of commonBrands) {
    if (normalized.includes(brand)) {
      // Return original case from query
      const regex = new RegExp(brand.replace(/ /g, '\\s+'), 'i');
      const match = query.match(regex);
      return match ? match[0] : brand;
    }
  }
  
  return null;
}

/**
 * Extract color from query
 */
export function extractColor(query: string): string | null {
  const normalized = normalizeTurkish(query);
  
  const colors = [
    { tr: ['siyah', 'kara'], en: 'black' },
    { tr: ['beyaz', 'ak'], en: 'white' },
    { tr: ['kirmizi'], en: 'red' },
    { tr: ['mavi'], en: 'blue' },
    { tr: ['yesil'], en: 'green' },
    { tr: ['sari'], en: 'yellow' },
    { tr: ['turuncu'], en: 'orange' },
    { tr: ['mor', 'menekse'], en: 'purple' },
    { tr: ['pembe'], en: 'pink' },
    { tr: ['gri'], en: 'gray' },
    { tr: ['kahverengi'], en: 'brown' },
  ];
  
  for (const colorSet of colors) {
    for (const colorName of colorSet.tr) {
      if (normalized.includes(colorName)) {
        return colorSet.en;
      }
    }
  }
  
  return null;
}

/**
 * Extract gender from query
 */
export function extractGender(query: string): 'Male' | 'Female' | 'Unisex' | null {
  const normalized = normalizeTurkish(query);
  
  const maleKeywords = ['erkek', 'bay', 'adam', 'male', 'men', 'boys'];
  const femaleKeywords = ['kadin', 'bayan', 'kiz', 'female', 'women', 'girls'];
  
  for (const keyword of maleKeywords) {
    if (normalized.includes(keyword)) {
      return 'Male';
    }
  }
  
  for (const keyword of femaleKeywords) {
    if (normalized.includes(keyword)) {
      return 'Female';
    }
  }
  
  return null;
}
