import React from 'react';
import { Factory, Headphones, TrendingUp, Briefcase, LucideIcon } from 'lucide-react';

export type JobTypeKey = 'factory' | 'call_center' | 'sales' | 'other';

export interface JobTypeConfigItem {
  label: string;
  icon: LucideIcon;
  accent: string;
  softBg: string;
}

export const jobTypeConfig: Record<JobTypeKey, JobTypeConfigItem> = {
  factory: {
    label: 'مصانع وعمالة',
    icon: Factory,
    accent: '#C9822A',
    softBg: '#FDF6ED', // warm sand
  },
  call_center: {
    label: 'كول سنتر وخدمة عملاء',
    icon: Headphones,
    accent: '#3978B8',
    softBg: '#EEF4FB',
  },
  sales: {
    label: 'مبيعات وتلي سيلز',
    icon: TrendingUp,
    accent: '#D96C5F',
    softBg: '#FDF1F0',
  },
  other: {
    label: 'وظائف عامة',
    icon: Briefcase,
    accent: '#8170B8',
    softBg: '#F4F2FA',
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
