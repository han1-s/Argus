export type PlanType = 'Free' | 'Pro' | 'Business';
export type BillingCycle = 'monthly' | 'annual';
export type PaymentMethod = 'pix' | 'card' | 'boleto';
export type SettingsTab = 'privacy' | 'notifications' | 'appearance' | 'system' | 'billing';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: PlanType;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  popular?: boolean;
  features: PlanFeature[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface UserSettings {
  notifSystem: boolean;
  notifAi: boolean;
  notifUpdates: boolean;
  theme: 'dark' | 'gray' | 'light';
  language: string;
  timezone: string;
}

export interface ComputerDevice {
  id: string;
  name: string;
  user: string;
  os: string;
  status: 'online' | 'offline' | 'alert';
  cpuUsage: number;
  ramUsage: number;
  lastActive: string;
  ipAddress: string;
  location: string;
  processor: string;
  memory: string;
  storage: string;
  serialNumber: string;
}

export interface ActivityLog {
  id: string;
  type: 'app' | 'website';
  name: string;
  category: string;
  durationMinutes: number;
  impact: 'productive' | 'neutral' | 'unproductive';
}
