// Widget configuration types

/**
 * Query Parser Versions
 * v1: Regex-only (fast, basic)
 * v2: Hybrid (regex for simple, AI for complex)
 * v3: AI-only (intelligent, slower)
 */
export type QueryParserVersion = 'v1' | 'v2' | 'v3';

export interface WidgetConfig {
  siteId: string;
  siteName: string;
  brandLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeMessage?: string;
  welcomeSubtext?: string;
  categories?: ProductCategory[];
  privacyPolicyUrl?: string;
  brandingText?: string;
  showBranding?: boolean;
  queryParserVersion?: QueryParserVersion; // Default: v1
}

export interface ProductCategory {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  keywords?: string[];
}

export const DEFAULT_CONFIG: Partial<WidgetConfig> = {
  primaryColor: '#FFB900',
  secondaryColor: '#FF6B00',
  welcomeMessage: "Merhaba! {SITE_NAME} ile uçuşunuzu bulalım.",
  welcomeSubtext: 'Popüler destinasyonlar, uçuş önerileri ve rezervasyon desteği.',
  showBranding: true,
  brandingText: 'Powered by FlightAsistAI',
  queryParserVersion: 'v3',
};

// Popular flight destinations
export const DEFAULT_CATEGORIES: ProductCategory[] = [
  { id: 'istanbul', name: 'İstanbul', emoji: '✈️', keywords: ['istanbul', 'ist', 'İstanbul', 'istanbul airport'] },
  { id: 'antalya', name: 'Antalya', emoji: '🏖️', keywords: ['antalya', 'ayt', 'beach', 'resort'] },
  { id: 'izmir', name: 'İzmir', emoji: '🌊', keywords: ['izmir', 'adb', 'aegean', 'ege'] },
  { id: 'ankara', name: 'Ankara', emoji: '🏛️', keywords: ['ankara', 'esb', 'capital', 'başkent'] },
  { id: 'bodrum', name: 'Bodrum', emoji: '⛵', keywords: ['bodrum', 'bjv', 'yacht', 'holiday'] },
];
