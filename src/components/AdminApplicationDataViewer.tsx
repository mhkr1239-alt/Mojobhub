import React, { useState } from 'react';
import { supabase, FormFieldDefinition } from '../lib/supabase';
import { FileText, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FileData {
  storage_path: string;
  file_name?: string;
  size?: number;
}

export function isFileObject(val: unknown): val is FileData {
  return (
    typeof val === 'object' &&
    val !== null &&
    'storage_path' in val &&
    typeof (val as Record<string, unknown>).storage_path === 'string'
  );
}

export function isUrlString(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export const AdminFileField: React.FC<{ fileData: FileData }> = ({ fileData }) => {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    setOpening(true);
    setError(null);
    try {
      const { data, error: signedErr } = await supabase.storage
        .from('application-files')
        .createSignedUrl(fileData.storage_path, 300);

      if (signedErr || !data?.signedUrl) {
        throw new Error(signedErr?.message || 'فشل إنشاء رابط التحميل');
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error generating signed URL:', err);
      setError('تعذر فتح الملف، تأكد من الصلاحيات.');
    } finally {
      setOpening(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes || typeof bytes !== 'number') return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-[#E6EDF2] font-sans truncate">
          <FileText className="w-3.5 h-3.5 text-[#1FA98A] shrink-0" />
          <span className="truncate max-w-[200px]" title={fileData.file_name || fileData.storage_path}>
            {fileData.file_name || 'ملف مرفق'}
          </span>
          {fileData.size ? (
            <span className="text-[10px] text-[#8B98A5] font-mono">({formatSize(fileData.size)})</span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleOpen}
          disabled={opening}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1FA98A]/10 hover:bg-[#1FA98A]/20 border border-[#1FA98A]/30 text-[#1FA98A] font-bold text-xs transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          {opening ? (
            <div className="w-3 h-3 border-2 border-[#1FA98A]/30 border-t-[#1FA98A] rounded-full animate-spin" />
          ) : (
            <ExternalLink className="w-3 h-3" />
          )}
          <span>فتح الملف</span>
        </button>
      </div>

      {error && (
        <div className="text-[11px] text-[#E1615E] font-semibold flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export const AdminFieldValueViewer: React.FC<{ value: unknown }> = ({ value }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-[#8B98A5]/60 italic font-mono">—</span>;
  }

  if (isFileObject(value)) {
    return <AdminFileField fileData={value} />;
  }

  if (isUrlString(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[#1FA98A] hover:underline break-all font-mono text-xs"
      >
        <ExternalLink className="w-3 h-3 shrink-0" />
        <span className="truncate max-w-[280px]">{value}</span>
      </a>
    );
  }

  if (typeof value === 'object') {
    return <span className="font-mono text-xs text-[#E6EDF2] break-all">{JSON.stringify(value)}</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="font-mono text-xs text-[#E6EDF2]">{value ? 'نعم' : 'لا'}</span>;
  }

  return <span className="font-sans text-xs text-[#E6EDF2] break-words">{String(value)}</span>;
};

interface AdminApplicationDataViewerProps {
  data: Record<string, any>;
  formFields?: FormFieldDefinition[];
  layout?: 'grid' | 'stacked';
}

export const AdminApplicationDataViewer: React.FC<AdminApplicationDataViewerProps> = ({
  data,
  formFields = [],
  layout = 'grid',
}) => {
  const fieldsMap = new Map<string, string>();
  formFields.forEach((f) => {
    if (f.key) fieldsMap.set(f.key, f.label || f.key);
  });

  const getLabel = (key: string): string => {
    return fieldsMap.get(key) || key.replace(/_/g, ' ');
  };

  const hasConsent = 'consent' in data || 'consented_at' in data;
  const consentedAt = data.consented_at;

  const formatConsentDate = (dateVal?: any) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return d.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateVal);
    }
  };

  // Filter out consent and consented_at
  const displayEntries = Object.entries(data).filter(
    ([k]) => k !== 'consent' && k !== 'consented_at'
  );

  const containerClass =
    layout === 'grid'
      ? 'grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#1A232C]/60 border border-[#232F3A] rounded-lg p-2.5'
      : 'space-y-2';

  return (
    <div className="space-y-2.5">
      {displayEntries.length === 0 && !hasConsent ? (
        <div className="text-xs text-[#8B98A5]/60 italic p-3 bg-[#1A232C] rounded-lg">
          لا توجد بيانات أو إجابات مسجلة.
        </div>
      ) : (
        <div className={containerClass}>
          {displayEntries.map(([key, val]) => (
            <div
              key={key}
              className="bg-[#131A21] border border-[#232F3A] rounded-lg p-3 text-xs flex flex-col justify-between"
            >
              <span className="font-semibold text-[#8B98A5] text-[11px] mb-1.5 block">
                {getLabel(key)}:
              </span>
              <div className="mt-0.5">
                <AdminFieldValueViewer value={val} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Consent row */}
      {hasConsent && (
        <div className="flex items-center gap-2 p-2.5 bg-[#1FA98A]/5 border border-[#1FA98A]/20 rounded-lg text-xs text-[#1FA98A]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1FA98A]" />
          <span>
            <strong>وافق على استخدام البيانات</strong>
            {consentedAt && (
              <span className="font-mono text-[11px] text-[#8B98A5] mr-2">
                (بتاريخ: {formatConsentDate(consentedAt)})
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
