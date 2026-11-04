import { ApplicationStatus } from './supabase';

export function normalizeEgyptPhone(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  // Remove non-digits
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;

  // If starts with 00 (e.g. 00249... or 0020...) -> strip leading 00
  let normalized = digits;
  if (normalized.startsWith('00')) {
    normalized = normalized.substring(2);
  }

  // Egyptian 01xxxxxxxxx (11 digits starting with 01) -> becomes 20xxxxxxxxxx
  if (/^01\d{9}$/.test(normalized)) {
    return '20' + normalized.substring(1);
  }

  // A number starting with 0 that is not Egyptian returns null
  if (normalized.startsWith('0')) {
    return null;
  }

  // Numbers of 8-15 digits that don't start with 0 are kept as they are
  if (normalized.length >= 8 && normalized.length <= 15) {
    return normalized;
  }

  return null;
}

export interface StatusMeta {
  key: ApplicationStatus;
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const STATUS_LIST: ApplicationStatus[] = [
  'submitted',
  'sent_to_source',
  'accepted',
  'interview',
  'hired',
  'rejected',
];

export const PIPELINE_STEPS: ApplicationStatus[] = [
  'submitted',
  'sent_to_source',
  'accepted',
  'interview',
  'hired',
];

export const STATUS_METAS: Record<ApplicationStatus, StatusMeta> = {
  submitted: {
    key: 'submitted',
    label: 'جديد',
    textColor: 'text-[var(--mora-blue)]',
    bgColor: 'bg-[var(--mora-blue)]/15',
    borderColor: 'border-[var(--mora-blue)]/30',
  },
  sent_to_source: {
    key: 'sent_to_source',
    label: 'أُرسل للجهة',
    textColor: 'text-[var(--mora-slate)]',
    bgColor: 'bg-[var(--mora-slate)]/15',
    borderColor: 'border-[var(--mora-slate)]/30',
  },
  accepted: {
    key: 'accepted',
    label: 'مقبول',
    textColor: 'text-[var(--mora-teal)]',
    bgColor: 'bg-[var(--mora-teal)]/15',
    borderColor: 'border-[var(--mora-teal)]/30',
  },
  interview: {
    key: 'interview',
    label: 'مقابلة',
    textColor: 'text-[var(--mora-violet)]',
    bgColor: 'bg-[var(--mora-violet)]/15',
    borderColor: 'border-[var(--mora-violet)]/30',
  },
  hired: {
    key: 'hired',
    label: 'تم التعيين',
    textColor: 'text-[#16A34A]',
    bgColor: 'bg-[#16A34A]/15',
    borderColor: 'border-[#16A34A]/30',
  },
  rejected: {
    key: 'rejected',
    label: 'مرفوض',
    textColor: 'text-[var(--c-danger)]',
    bgColor: 'bg-[var(--c-danger)]/15',
    borderColor: 'border-[var(--c-danger)]/30',
  },
};

export function getStatusMeta(status?: string | null): StatusMeta {
  if (status && status in STATUS_METAS) {
    return STATUS_METAS[status as ApplicationStatus];
  }
  return {
    key: 'submitted',
    label: status || 'غير محدد',
    textColor: 'text-[#8B98A5]',
    bgColor: 'bg-[#8B98A5]/15',
    borderColor: 'border-[#8B98A5]/30',
  };
}
