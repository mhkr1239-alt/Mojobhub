import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, JobApplication } from '../lib/supabase';
import { AdminNav } from '../components/AdminNav';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { AdminFieldValueViewer } from '../components/AdminApplicationDataViewer';
import { STATUS_LIST, STATUS_METAS } from '../lib/applicationUtils';
import { 
  RefreshCw, 
  Search, 
  AlertCircle, 
  User, 
  Phone, 
  Briefcase, 
  FileText,
  Clock,
  FolderOpen
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Fetch applications joined with offers, ordered by submitted_at descending
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('applications')
        .select(`
          id,
          offer_id,
          candidate_name,
          candidate_whatsapp,
          status,
          data,
          admin_notes,
          submitted_at,
          updated_at,
          offers (
            id,
            title,
            company_name
          )
        `)
        .order('submitted_at', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      setApplications((data as unknown as JobApplication[]) || []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Error fetching applications from Supabase:', err);
      setError(err?.message || 'فشل في تحميل طلبات التقديم من قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getOfferInfo = (offers: JobApplication['offers']) => {
    if (!offers) return null;
    if (Array.isArray(offers)) return offers[0] || null;
    return offers;
  };

  // Status counts for filter chips
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: applications.length,
      submitted: 0,
      sent_to_source: 0,
      accepted: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
    };

    applications.forEach((app) => {
      const st = app.status || 'submitted';
      if (st in counts) {
        counts[st] = (counts[st] || 0) + 1;
      } else {
        counts.submitted = (counts.submitted || 0) + 1;
      }
    });

    return counts;
  }, [applications]);

  // Client-side filtering by status and search term
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Status Filter
      if (selectedStatus !== 'all') {
        const appStatus = app.status || 'submitted';
        if (appStatus !== selectedStatus) return false;
      }

      // 2. Search Term Filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const candidateMatch = app.candidate_name?.toLowerCase().includes(term);
      const whatsappMatch = app.candidate_whatsapp?.toLowerCase().includes(term);
      const offerInfo = getOfferInfo(app.offers);
      const offerTitleMatch = offerInfo?.title?.toLowerCase().includes(term);
      const dataMatch = JSON.stringify(app.data || {}).toLowerCase().includes(term);
      return candidateMatch || whatsappMatch || offerTitleMatch || dataMatch;
    });
  }, [applications, selectedStatus, searchTerm]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const filterChips = [
    { key: 'all', label: 'الكل' },
    ...STATUS_LIST.map((key) => ({ key, label: STATUS_METAS[key].label })),
  ];

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF2] py-6 sm:py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Admin Navigation */}
        <AdminNav activeTab="applications" />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#E6EDF2] tracking-tight">
              طلبات التقديم (Applications)
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8B98A5]">
              عرض وإدارة جميع طلبات التقديم المرسلة من المرشحين ومتابعة مسار تعيينهم.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-[#131A21] border border-[#232F3A] px-3 py-1.5 rounded-lg text-xs font-medium text-[#8B98A5]">
              إجمالي الطلبات: <strong className="text-[#E6EDF2] font-mono font-bold">{applications.length}</strong>
            </div>

            <button
              onClick={fetchApplications}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B0F14] bg-[#1FA98A] hover:bg-[#18886F] px-3.5 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8B98A5] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم المرشح، رقم WhatsApp، عنوان الوظيفة، أو إجابات الفورم..."
              className="w-full pr-10 pl-4 py-2 bg-[#131A21] border border-[#232F3A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] outline-none transition"
            />
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {filterChips.map((chip) => {
            const count = statusCounts[chip.key] || 0;
            const isSelected = selectedStatus === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setSelectedStatus(chip.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#1FA98A] text-[#0B0F14] shadow-xs'
                    : 'bg-[#131A21] text-[#8B98A5] hover:text-[#E6EDF2] border border-[#232F3A] hover:border-[#1FA98A]/30'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-[#0B0F14]/20 text-[#0B0F14]'
                      : 'bg-[#1A232C] text-[#8B98A5]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-5 p-3.5 bg-[#E1615E]/10 border border-[#E1615E]/30 rounded-lg flex items-start gap-3 text-[#E1615E] text-xs">
            <AlertCircle className="w-4 h-4 text-[#E1615E] mt-0.5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">خطأ في جلب البيانات:</span>
              <p className="font-mono mt-0.5 opacity-90">{error}</p>
              <button
                onClick={fetchApplications}
                className="mt-2 text-xs font-bold bg-[#E1615E] text-white px-2.5 py-1 rounded hover:bg-[#d04f4c] transition"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 animate-pulse space-y-3">
                <div className="h-4 bg-[#1A232C] rounded w-1/4"></div>
                <div className="h-3 bg-[#1A232C] rounded w-1/3"></div>
                <div className="h-16 bg-[#1A232C]/60 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredApplications.length === 0 && (
          <div className="text-center py-16 bg-[#131A21] border border-dashed border-[#232F3A] rounded-xl p-8">
            <FileText className="w-10 h-10 text-[#8B98A5]/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#E6EDF2]">
              {searchTerm || selectedStatus !== 'all'
                ? 'لا توجد طلبات تقديم مطابقة للفلتر المحدد'
                : 'لا توجد طلبات تقديم مسجلة حتى الآن'}
            </h3>
            <p className="text-xs text-[#8B98A5] max-w-sm mx-auto mt-1 mb-4">
              {searchTerm || selectedStatus !== 'all'
                ? 'جرب اختيار فلتر حالة مختلف أو مسح كلمة البحث.'
                : 'عندما يقوم أي مرشح بالتقديم على وظيفة، سيظهر طلبه هنا فوراً.'}
            </p>
            {(searchTerm || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#1FA98A] bg-[#1FA98A]/10 hover:bg-[#1FA98A]/20 border border-[#1FA98A]/30 rounded-lg transition cursor-pointer"
              >
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
          </div>
        )}

        {/* Applications List */}
        {!loading && !error && filteredApplications.length > 0 && (
          <div className="space-y-3">
            {filteredApplications.map((app) => {
              const offerInfo = getOfferInfo(app.offers);
              const offerTitle = offerInfo?.title || `معرف الوظيفة: ${app.offer_id}`;
              const companyName = offerInfo?.company_name;
              const dataFields = app.data && typeof app.data === 'object' ? app.data : {};

              return (
                <div
                  key={String(app.id)}
                  className="bg-[#131A21] border border-[#232F3A] hover:border-[#1FA98A]/40 rounded-xl p-4 sm:p-5 transition shadow-xs"
                >
                  {/* Candidate header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#232F3A]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-6 h-6 rounded-md bg-[#1A232C] border border-[#232F3A] text-[#1FA98A] flex items-center justify-center font-bold text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <h2 className="text-sm sm:text-base font-bold text-[#E6EDF2]">
                          {app.candidate_name}
                        </h2>
                        {/* Colored status badge */}
                        <AdminStatusBadge status={app.status} size="sm" />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8B98A5]">
                        <div className="flex items-center gap-1 font-mono text-[#E6EDF2] bg-[#1A232C] border border-[#232F3A] px-2 py-0.5 rounded" dir="ltr">
                          <Phone className="w-3 h-3 text-[#1FA98A]" />
                          <span>{app.candidate_whatsapp}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs">
                          <Briefcase className="w-3 h-3 text-[#8B98A5]" />
                          <span>
                            الوظيفة: <strong className="text-[#E6EDF2]">{offerTitle}</strong>
                            {companyName && ` (${companyName})`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      {/* Clear "فتح" button linking to /admin/applications/:id */}
                      <Link
                        to={`/admin/applications/${app.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1FA98A] hover:bg-[#18886F] text-[#0B0F14] font-bold text-xs transition cursor-pointer shadow-xs"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>فتح</span>
                      </Link>

                      <div className="flex items-center gap-1 text-[11px] text-[#8B98A5] font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(app.submitted_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Form response fields */}
                  <div className="mt-3">
                    <div className="text-[11px] font-bold text-[#8B98A5] mb-2 flex items-center justify-between">
                      <span>إجابات فورم التقديم (`data` JSONB):</span>
                      <span className="font-mono text-[10px] text-[#8B98A5]/70">
                        {Object.keys(dataFields).length} حقل
                      </span>
                    </div>

                    {Object.keys(dataFields).length === 0 ? (
                      <div className="text-xs text-[#8B98A5]/60 italic p-2 bg-[#1A232C] rounded-lg">
                        لا توجد إجابات إضافية.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#1A232C]/60 border border-[#232F3A] rounded-lg p-2.5">
                        {Object.entries(dataFields).map(([key, val]) => (
                          <div
                            key={key}
                            className="bg-[#131A21] border border-[#232F3A] rounded-md p-2 text-xs flex flex-col justify-between"
                          >
                            <span className="font-semibold text-[#8B98A5] text-[11px] mb-1">
                              {key.replace(/_/g, ' ')}:
                            </span>

                            <div className="mt-0.5">
                              <AdminFieldValueViewer value={val} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata footer */}
                  <div className="mt-3 pt-2 border-t border-[#232F3A] flex flex-wrap items-center justify-between text-[10px] text-[#8B98A5]/60 font-mono">
                    <div className="flex items-center gap-3">
                      <span>ID: {String(app.id)}</span>
                      <span>Offer ID: {String(app.offer_id)}</span>
                      {app.updated_at && <span>آخر تحديث: {formatDate(app.updated_at)}</span>}
                    </div>

                    <Link
                      to={`/admin/applications/${app.id}`}
                      className="text-[#1FA98A] hover:underline font-bold"
                    >
                      عرض التفاصيل الكاملة ←
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
