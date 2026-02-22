/**
 * Tenant Model
 * Represents a customer/client using the widget
 */

export interface Tenant {
  id: string;
  apiKey: string;
  siteId: string;
  siteName: string;
  domain: string;
  feedUrl: string;
  brandLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeMessage?: string;
  welcomeSubtext?: string;
  privacyPolicyUrl?: string;
  categories?: TenantCategory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';
  monthlyQuota?: number;
  usedQuota?: number;
}

export interface TenantCategory {
  label: string;
  keywords: string[];
}

export interface CreateTenantRequest {
  siteName: string;
  domain: string;
  feedUrl: string;
  contactEmail: string;
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';
}

export interface UpdateTenantRequest {
  siteName?: string;
  feedUrl?: string;
  brandLogo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  welcomeMessage?: string;
  welcomeSubtext?: string;
  privacyPolicyUrl?: string;
  categories?: TenantCategory[];
}
