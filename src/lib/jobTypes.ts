import React from 'react';
import { Factory, Headphones, TrendingUp, Briefcase, LucideIcon } from 'lucide-react';

export type JobTypeKey = 'factory' | 'call_center' | 'sales' | 'other';

export interface JobTypeConfigItem {
  label: string;
  icon: LucideIcon;
  /** لون الأيقونة فوق soft — ≥3:1 (WCAG عناصر رسومية) */
  accent: string;
  softBg: string;
  /** لون نص الشارة فوق soft — WP-2.1: ≥4.74:1 (كان accent 3.02–4.28) */
  accentStrong: string;
}

export const jobTypeConfig: Record<JobTypeKey, JobTypeConfigItem> = {
  factory: {
    label: 'مصانع وعمالة',
    icon: Factory,
    accent: 'var(--jt-factory)',
    softBg: 'var(--jt-factory-soft)',
    accentStrong: 'var(--jt-factory-strong)',
  },
  call_center: {
    label: 'كول سنتر وخدمة عملاء',
    icon: Headphones,
    accent: 'var(--jt-call)',
    softBg: 'var(--jt-call-soft)',
    accentStrong: 'var(--jt-call-strong)',
  },
  sales: {
    label: 'مبيعات وتلي سيلز',
    icon: TrendingUp,
    accent: 'var(--jt-sales)',
    softBg: 'var(--jt-sales-soft)',
    accentStrong: 'var(--jt-sales-strong)',
  },
  other: {
    label: 'وظائف عامة',
    icon: Briefcase,
    accent: 'var(--jt-other)',
    softBg: 'var(--jt-other-soft)',
    accentStrong: 'var(--jt-other-strong)',
  },
};

/**
 * Resolves jobTypeConfig item safely from offer_type or fallback.
 */
export function getJobTypeConfig(offerType?: string): JobTypeConfigItem {
  if (!offerType) return jobTypeConfig.other;
  const normalized = offerType.toLowerCase().trim();

  if (normalized in jobTypeConfig) {
    return jobTypeConfig[normalized as JobTypeKey];
  }

  // Heuristic fallbacks for custom strings
  if (normalized.includes('factory') || normalized.includes('مصنع') || normalized.includes('عمال')) {
    return jobTypeConfig.factory;
  }
  if (normalized.includes('call') || normalized.includes('dial') || normalized.includes('كول') || normalized.includes('خدمة عملاء')) {
    return jobTypeConfig.call_center;
  }
  if (normalized.includes('sale') || normalized.includes('مبيع') || normalized.includes('تسويق')) {
    return jobTypeConfig.sales;
  }

  return jobTypeConfig.other;
}
