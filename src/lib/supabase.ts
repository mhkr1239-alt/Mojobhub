import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  'https://ritbknmhzpdbsmmkocmm.supabase.co';

const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  'sb_publishable_UE_of2qzg4K7m6n6aFK8VQ_N6SJThWH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'file' | 'url';
  required?: boolean;
  options?: string[];
}

export interface JobOffer {
  id: string | number;
  source_id?: string | null;
  title: string;
  offer_type?: 'factory' | 'call_center' | 'other' | string;
  company_name: string;
  is_active: boolean;
  details?: Record<string, any>;
  whatsapp_number?: string | null;
  form_fields?: FormFieldDefinition[];
  commission_config?: any;
  created_at?: string;
}

export type ApplicationStatus =
  | 'submitted'
  | 'sent_to_source'
  | 'accepted'
  | 'interview'
  | 'hired'
  | 'rejected';

export interface JobApplication {
  id?: string | number;
  offer_id: string | number;
  candidate_name: string;
  candidate_whatsapp: string;
  status: ApplicationStatus | string;
  data: Record<string, any>;
  admin_notes?: string | null;
  submitted_at?: string;
  updated_at?: string;
  offers?: {
    id?: string | number;
    title?: string;
    company_name?: string;
    whatsapp_number?: string | null;
    form_fields?: FormFieldDefinition[];
  } | Array<{
    id?: string | number;
    title?: string;
    company_name?: string;
    whatsapp_number?: string | null;
    form_fields?: FormFieldDefinition[];
  }> | null;
}

