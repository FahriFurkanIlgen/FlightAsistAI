// Shared type definitions for ShopAsistAI

export interface Product {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  price: string;
  salePrice?: string;
  availability: string;
  brand?: string;
  gtin?: string;
  mpn?: string;
  condition?: string;
  googleProductCategory?: string;
  productType?: string;
  additionalImageLinks?: string[];
  color?: string;
  size?: string;
}

export interface GoogleFeed {
  siteId: string;
  siteName: string;
  feedUrl: string;
  lastUpdated: Date;
  products: Product[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  siteId: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  recommendedProducts?: Product[];
  confidence?: number;
}

export interface SiteConfig {
  id: string;
  name: string;
  feedUrl: string;
  domain: string;
  active: boolean;
}

// Re-export config types
export * from './config';
