import type { LucideIcon } from 'lucide-react';

export type FeatureAccent = 'primary' | 'secondary' | 'accent' | 'success' | 'info' | 'warning';

export interface LandingNavItem {
  id: string;
  label: string;
  href: `#${string}`;
}

export interface HeroMetric {
  id: string;
  value: string;
  label: string;
}

export interface FeatureCardData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: FeatureAccent;
}

export interface TimelineStep {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  anchorLabel: string;
}

export interface StatCounterData {
  id: string;
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface TestimonialData {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  avatarFallback: string;
  progressLabel: string;
}

export interface ComparisonPoint {
  id: string;
  feature: string;
  description: string;
  typely: string;
  traditional: string;
}

export interface FAQItemData {
  id: string;
  question: string;
  answer: string;
}

export interface KeyboardKeyData {
  id: string;
  value: string;
  widthClass?: string;
}
