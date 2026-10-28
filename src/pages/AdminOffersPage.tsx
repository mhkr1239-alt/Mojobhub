import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, JobOffer } from '../lib/supabase';
import { AdminNav } from '../components/AdminNav';
import { 
  Briefcase, 
  Plus, 
  Edit3, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Building2, 
  Headphones, 
  Factory, 
  HelpCircle,
  Clock
} from 'lucide-react';

export const AdminOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [togglingId, setTogglingId] = useState<string | number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      setOffers((data as JobOffer[]) || []);
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      setError(err?.message || 'تعذر تحميل قائمة الوظائف من قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleToggleActive = async (offer: JobOffer) => {
    const updatedStatus = !offer.is_active;
    setTogglingId(offer.id);
    setActionMessage(null);

    // Optimistic UI update
    setOffers((prev) =>
      prev.map((item) => (item.id === offer.id ? { ...item, is_active: updatedStatus } : item))
    );

    try {
      const { error: updateError } = await supabase
        .from('offers')
        .update({ is_active: updatedStatus })
        .eq('id', offer.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setActionMessage({
        type: 'success',
        text: `تم ${updatedStatus ? 'تفعيل' : 'إلغاء تفعيل'} وظيفة "${offer.title}" بنجاح في Supabase.`,
      });
    } catch (err: any) {
      console.error('Toggle is_active error:', err);
      // Revert optimistic update
      setOffers((prev) =>
        prev.map((item) => (item.id === offer.id ? { ...item, is_active: offer.is_active } : item))
      );
      setActionMessage({
        type: 'error',
        text: `فشل تعديل حالة الوظيفة: ${err?.message || 'حدث خطأ غير متوقع'}`,
      });
    } finally {
      setTogglingId(null);
    }
  };

  const getOfferTypeBadge = (type?: string) => {
    if (type === 'call_center') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/20 px-2 py-0.5 rounded">
          <Headphones className="w-3 h-3" />
          <span>كول سنتر</span>
        </span>
      );
    }
    if (type === 'factory') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E0A23C] bg-[#E0A23C]/10 border border-[#E0A23C]/20 px-2 py-0.5 rounded">
          <Factory className="w-3 h-3" />
          <span>مصانع وعمالة</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8B98A5] bg-[#1A232C] border border-[#232F3A] px-2 py-0.5 rounded">
        <HelpCircle className="w-3 h-3" />
        <span>أخرى ({type || 'other'})</span>
      </span>
    );
  };

  const filteredOffers = offers.filter((o) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = (o.title || '').toLowerCase().includes(term);
    const companyMatch = (o.company_name || '').toLowerCase().includes(term);
    const typeMatch = (o.offer_type || '').toLowerCase().includes(term);
    return titleMatch || companyMatch || typeMatch;
  });

  const activeCount = offers.filter((o) => o.is_active).length;
  const inactiveCount = offers.length - activeCount;

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF2] py-6 sm:py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Admin Navigation */}
        <AdminNav activeTab="offers" />

        {/* Header section with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#E6EDF2] tracking-tight">
              إدارة الوظائف (Offers)
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8B98A5]">
              عرض وتعديل وتفعيل جميع عروض العمل المتاحة في قاعدة البيانات.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchOffers}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B98A5] hover:text-[#E6EDF2] bg-[#131A21] border border-[#232F3A] hover:bg-[#1A232C] px-3 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>

            <Link
              to="/admin/offers/new"
              className="inline-flex items-center gap-1.5 bg-[#1FA98A] hover:bg-[#18886F] text-[#0B0F14] font-bold text-xs px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ وظيفة جديدة</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-semibold text-[#8B98A5] mb-1">إجمالي الوظائف</div>
            <div className="text-xl font-bold font-mono text-[#E6EDF2]">{offers.length}</div>
          </div>

          <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-semibold text-[#1FA98A] mb-1">الوظائف النشطة (متاحة للتقديم)</div>
            <div className="text-xl font-bold font-mono text-[#1FA98A]">{activeCount}</div>
          </div>

          <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-3.5 shadow-xs">
            <div className="text-[11px] font-semibold text-[#8B98A5] mb-1">الوظائف المعطلة (مغلقة)</div>
            <div className="text-xl font-bold font-mono text-[#8B98A5]">{inactiveCount}</div>
          </div>
        </div>

        {/* Feedback message */}
        {actionMessage && (
          <div
            className={`mb-5 p-3 rounded-lg border text-xs font-semibold flex items-start gap-2 ${
              actionMessage.type === 'success'
                ? 'bg-[#1FA98A]/10 border-[#1FA98A]/30 text-[#1FA98A]'
                : 'bg-[#E1615E]/10 border-[#E1615E]/30 text-[#E1615E]'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{actionMessage.text}</div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-[#8B98A5] hover:text-[#E6EDF2] cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8B98A5] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث بعنوان الوظيفة أو الشركة أو النوع..."
              className="w-full pr-10 pl-4 py-2 bg-[#131A21] border border-[#232F3A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] outline-none transition"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-5 p-3.5 bg-[#E1615E]/10 border border-[#E1615E]/30 rounded-lg text-[#E1615E] text-xs">
            <p className="font-mono">{error}</p>
            <button
              onClick={fetchOffers}
              className="mt-2 text-xs font-bold bg-[#E1615E] text-white px-2.5 py-1 rounded hover:bg-[#d04f4c] transition"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 animate-pulse space-y-3">
                <div className="h-4 bg-[#1A232C] rounded w-1/3"></div>
                <div className="h-3 bg-[#1A232C] rounded w-1/4"></div>
                <div className="h-12 bg-[#1A232C]/60 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredOffers.length === 0 && (
          <div className="text-center py-16 bg-[#131A21] border border-dashed border-[#232F3A] rounded-xl p-8">
            <Briefcase className="w-10 h-10 text-[#8B98A5]/40 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#E6EDF2]">
              {searchTerm ? 'لا توجد وظائف مطابقة للبحث' : 'لا توجد أي وظائف مسجلة حالياً'}
            </h3>
            <p className="text-xs text-[#8B98A5] max-w-sm mx-auto mt-1 mb-4">
              {searchTerm
                ? `لا توجد نتائج لـ "${searchTerm}". جرب كلمة بحث أخرى.`
                : 'ابدأ بإنشاء أول عرض عمل بالضغط على الزر أدناه.'}
            </p>
            <Link
              to="/admin/offers/new"
              className="inline-flex items-center gap-1.5 bg-[#1FA98A] text-[#0B0F14] font-bold text-xs px-3.5 py-2 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة وظيفة جديدة</span>
            </Link>
          </div>
        )}

        {/* Offers List */}
        {!loading && !error && filteredOffers.length > 0 && (
          <div className="space-y-3">
            {filteredOffers.map((offer) => {
              const details = offer.details || {};
              const salary = details.salary;
              const location = details.location;
              const shift = details.shift;
              const formFieldsCount = offer.form_fields?.length || 0;
              const isToggling = togglingId === offer.id;

              return (
                <div
                  key={String(offer.id)}
                  className={`bg-[#131A21] border rounded-xl p-4 sm:p-5 transition shadow-xs ${
                    offer.is_active ? 'border-[#232F3A]' : 'border-[#232F3A]/70 bg-[#131A21]/70 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#232F3A]">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-[#E6EDF2] leading-snug">
                          {offer.title}
                        </h2>
                        {getOfferTypeBadge(offer.offer_type)}
                        {offer.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/20 px-2 py-0.2 rounded">
                            <span>🟢 نشطة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B98A5] bg-[#1A232C] border border-[#232F3A] px-2 py-0.2 rounded">
                            <span>⚪ معطلة</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8B98A5]">
                        <div className="flex items-center gap-1 text-[#E6EDF2]">
                          <Building2 className="w-3.5 h-3.5 text-[#8B98A5]" />
                          <span>{offer.company_name}</span>
                        </div>

                        {offer.whatsapp_number && (
                          <div className="font-mono text-[#8B98A5] text-[11px]">
                            <span>WhatsApp: <strong className="text-[#E6EDF2]">{offer.whatsapp_number}</strong></span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 font-mono text-[11px] text-[#8B98A5]">
                          <Clock className="w-3 h-3" />
                          <span>{offer.created_at ? new Date(offer.created_at).toLocaleDateString('ar-EG') : '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2 self-end sm:self-start bg-[#1A232C] border border-[#232F3A] px-2.5 py-1.5 rounded-lg">
                      <span className="text-xs font-semibold text-[#8B98A5]">
                        {offer.is_active ? 'نشطة' : 'معطلة'}
                      </span>
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleActive(offer)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          offer.is_active ? 'bg-[#1FA98A]' : 'bg-[#232F3A]'
                        } ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            offer.is_active ? '-translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
                    <div className="bg-[#1A232C] border border-[#232F3A] px-2.5 py-1.5 rounded-lg">
                      <span className="text-[#8B98A5] block text-[10px]">المرتب:</span>
                      <span className="font-semibold text-[#E6EDF2] truncate block">{salary || 'غير محدد'}</span>
                    </div>
                    <div className="bg-[#1A232C] border border-[#232F3A] px-2.5 py-1.5 rounded-lg">
                      <span className="text-[#8B98A5] block text-[10px]">المكان:</span>
                      <span className="font-semibold text-[#E6EDF2] truncate block">{location || 'غير محدد'}</span>
                    </div>
                    <div className="bg-[#1A232C] border border-[#232F3A] px-2.5 py-1.5 rounded-lg">
                      <span className="text-[#8B98A5] block text-[10px]">الشفت:</span>
                      <span className="font-semibold text-[#E6EDF2] truncate block">{shift || 'غير محدد'}</span>
                    </div>
                    <div className="bg-[#1A232C] border border-[#232F3A] px-2.5 py-1.5 rounded-lg">
                      <span className="text-[#8B98A5] block text-[10px]">حقول الفورم:</span>
                      <span className="font-semibold text-[#1FA98A]">{formFieldsCount} حقل مخصص</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#232F3A] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-[#8B98A5]/60">
                      ID: {String(offer.id).slice(0, 13)}...
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/offers/${offer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8B98A5] hover:text-[#E6EDF2] bg-[#1A232C] border border-[#232F3A] px-2.5 py-1 rounded-md transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>معاينة صفحة التقديم</span>
                      </Link>

                      <Link
                        to={`/admin/offers/${offer.id}/edit`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0B0F14] bg-[#1FA98A] hover:bg-[#18886F] px-3 py-1 rounded-md transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>تعديل</span>
                      </Link>
                    </div>
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
