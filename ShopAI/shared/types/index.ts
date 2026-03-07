// Shared type definitions for FlightAsistAI

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  departure: {
    airport: string;
    city: string;
    country: string;
    date: string;
    time: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    city: string;
    country: string;
    date: string;
    time: string;
    terminal?: string;
  };
  duration: string; // "2h 30m"
  price: string;
  currency: string;
  availability: string; // "available", "limited", "soldout"
  aircraftType?: string;
  stops: number; // 0 for direct, 1+ for connecting
  stopCities?: string[];
  cabinClass: 'economy' | 'business' | 'first';
  bookingLink: string;
  fareType?: string; // "standard", "flex", "promo"
  baggageAllowance?: string;
  amenities?: string[];
}

export interface FlightFeed {
  siteId: string;
  siteName: string;
  feedUrl: string;
  lastUpdated: Date;
  flights: Flight[];
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
  recommendedFlights?: Flight[];
  conversationHistory?: ChatMessage[];
  confidence?: number;
  debug?: {
    originalQuery: string;
    enhancedQuery: string;
    isFollowUp: boolean;
    queryType?: string;
  };
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
