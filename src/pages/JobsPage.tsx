import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, JobOffer } from '../lib/supabase';
import { getJobTypeConfig, jobTypeConfig, JobTypeKey } from '../lib/jobTypes';
import { 
  Building2, 
  MapPin, 
  Banknote, 
  Clock, 
  ArrowLeft,
  Briefcase,
  AlertCircle,
  Search,
  X
} from 'lucide-react';

const EGYPT_GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الدقهلية',
  'الشرقية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'شمال سيناء',
  'جنوب سيناء',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'أسيوط',
  'سوهاج',
  'المنيا',
  'بني سويف',
  'الفيوم',
  'قنا',
  'الأقصر',
  'أسوان',
];

const FILTER_TABS: { key: 'all' | JobTypeKey; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'factory', label: jobTypeConfig.factory.label },
  { key: 'call_center', label: jobTypeConfig.call_center.label },
  { key: 'sales', label: jobTypeConfig.sales.label },
  { key: 'other', label: jobTypeConfig.other.label },
];

export const JobsPage: React.FC = () => {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Type & Governorate Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | JobTypeKey>('all');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');

  // Animated counter for live active offers stat
  const [displayCount, setDisplayCount] = useState<number>(0);
  const animatedRef = useRef<boolean>(false);

  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('offers')
        .select('id, title, offer_type, company_name, details, form_fields, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw new Error(queryError.message);
      }

      setOffers(data || []);
    } catch (err: any) {
      console.error('Error fetching offers from Supabase:', err);
      setError('حصلت مشكلة في تحميل الوظائف، حاول مرة تانية.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Filtered offers by search query (title or company_name), job type, and governorate
  const filteredOffers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return offers.filter((offer) => {
      const matchesQuery =
        !q ||
        (offer.title && offer.title.toLowerCase().includes(q)) ||
        (offer.company_name && offer.company_name.toLowerCase().includes(q));

      const matchesType =
        selectedType === 'all' ||
        getJobTypeConfig(offer.offer_type) === jobTypeConfig[selectedType];

      const matchesGovernorate =
        !selectedGovernorate ||
        offer.details?.governorate === selectedGovernorate;

      return matchesQuery && matchesType && matchesGovernorate;
    });
  }, [offers, searchQuery, selectedType, selectedGovernorate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedGovernorate('');
  };

  // Run single count-up animation over ~600ms once offers are loaded
  useEffect(() => {
    if (loading || animatedRef.current) return;
    animatedRef.current = true;
    const target = offers.length;
    if (target === 0) {
      setDisplayCount(0);
      return;
    }

    const duration = 600; // ms
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out curve
      const easeOut = 1 - Math.pow(1 - progress, 2);
      setDisplayCount(Math.round(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayCount(target);
      }
    };

    requestAnimationFrame(step);
  }, [offers.length, loading]);

  return (
    <div className="min-h-full pb-16" dir="rtl">
      {/* 1. Hero Band: subtle two-stop gradient from --primary-soft to --bg */}
      <section className="w-full border-b border-[var(--c-border)] py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
          {/* Headline & Subtext */}
          <div className="text-right max-w-xl">
            <h1 className="text-[28px] font-extrabold text-ink tracking-tight leading-tight">
              الوظائف المتاحة
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted leading-relaxed">
              اختر الوظيفة المناسبة ليك واطّلع على التفاصيل وقدّم طلبك مباشرة في خطوات بسيطة بدون تعقيد.
            </p>
          </div>

          {/* Slim counter line */}
          <div className="flex items-center gap-2 py-1">
            <span className="text-lg font-extrabold text-[var(--c-accent)] leading-none">
              {loading ? '...' : displayCount}
            </span>
            <span className="text-sm font-medium text-muted">
              فرصة عمل متاحة الآن
            </span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--c-danger)]/10 border border-[var(--c-danger)]/25 rounded-[16px] flex items-start gap-3 text-[var(--c-danger)]">
            <AlertCircle className="w-5 h-5 text-[var(--c-danger)] shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">
              <p>{error}</p>
              <button
                onClick={fetchOffers}
                className="mt-2 text-xs font-bold bg-[var(--c-danger)] text-white px-3 py-1.5 rounded-[12px] hover:opacity-90 transition"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="glass-card rounded-[16px] p-6 animate-pulse space-y-4"
              >
                <div className="h-6 bg-[var(--c-border)] rounded-md w-2/3"></div>
                <div className="h-4 bg-[var(--c-border)] rounded-md w-1/3"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="h-10 bg-[var(--c-border)] rounded-[12px]"></div>
                  <div className="h-10 bg-[var(--c-border)] rounded-[12px]"></div>
                  <div className="h-10 bg-[var(--c-border)] rounded-[12px]"></div>
                </div>
                <div className="h-10 bg-[var(--c-border)] rounded-[12px] w-32"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State when no jobs exist in DB */}
        {!loading && !error && offers.length === 0 && (
          <div className="text-center py-16 glass-card rounded-[16px] p-8">
            <Briefcase className="w-12 h-12 text-muted opacity-40 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-ink">لا توجد وظائف شاغرة حالياً</h3>
            <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
              تابعنا باستمرار، يتم إضافة فرص عمل جديدة أولاً بأول.
            </p>
          </div>
        )}

        {/* Search & Filter Controls (shown when offers are loaded) */}
        {!loading && !error && offers.length > 0 && (
          <div className="mb-6 space-y-3">
            {/* 1. Search & Governorate Controls */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search Input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بوظيفة أو شركة…"
                  className="w-full pr-10 pl-10 py-3 bg-[var(--c-glass)] border border-[var(--c-glass-border)] rounded-[14px] text-sm text-ink placeholder-[var(--c-muted)] focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted hover:text-ink transition-colors"
                    title="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Governorate Dropdown */}
              <div className="sm:w-48 shrink-0">
                <select
                  value={selectedGovernorate}
                  onChange={(e) => setSelectedGovernorate(e.target.value)}
                  aria-label="اختر المحافظة"
                  className="w-full py-3 px-3.5 bg-[var(--c-glass)] border border-[var(--c-glass-border)] rounded-[14px] text-sm text-ink focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition-all shadow-xs cursor-pointer"
                >
                  <option value="">كل المحافظات</option>
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Horizontal Filter Chips (scrollable on mobile) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
              {FILTER_TABS.map((tab) => {
                const isActive = selectedType === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSelectedType(tab.key)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 border ${
                      isActive
                        ? 'bg-[var(--c-accent)] text-[var(--c-on-accent)] border-[var(--c-accent)]'
                        : 'bg-transparent text-muted hover:text-ink hover:bg-[var(--c-accent-soft)]/50 border-[var(--c-border)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 3. Result Count */}
            <div className="pt-1 flex items-center justify-between text-xs sm:text-sm text-muted">
              <span className="font-bold text-ink">
                {filteredOffers.length} وظيفة متاحة
              </span>
              {(searchQuery || selectedType !== 'all' || selectedGovernorate !== '') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-[var(--c-accent)] hover:underline font-semibold transition-transform active:scale-95"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. Empty State when search/filter yields zero results */}
        {!loading && !error && offers.length > 0 && filteredOffers.length === 0 && (
          <div className="text-center py-12 sm:py-16 glass-card rounded-[16px] p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--c-accent-soft)] text-[var(--c-accent)] flex items-center justify-center mx-auto mb-1">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-ink">مفيش وظائف مطابقة لبحثك</h3>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-[12px] transition-all active:scale-95"
              >
                <span>مسح البحث والفلاتر</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. Offers list: Differentiated by jobTypeConfig with stagger animation & radius hierarchy */}
        {!loading && !error && filteredOffers.length > 0 && (
          <div className="space-y-4">
            {filteredOffers.map((offer, index) => {
              const details = offer.details || {};
              const salary = details.salary || details.مرتب;
              const location = details.location || details.مكان;
              const shift = details.shift || details.مواعيد;
              const typeConfig = getJobTypeConfig(offer.offer_type);
              const TypeIcon = typeConfig.icon;
              const staggerDelay = `${Math.min(index * 60, 480)}ms`;

              return (
                <div
                  key={offer.id}
                  data-reveal
                  className="reveal glass-card rounded-[16px] p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  style={{ animationDelay: staggerDelay }}
                >
                  {/* Card Header: Icon Badge + Title & Company + Status dot */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3.5">
                      {/* Differentiated Icon Badge from jobTypeConfig */}
                      <div
                        className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: typeConfig.softBg,
                          borderColor: `${typeConfig.accent}33`,
                        }}
                        title={typeConfig.label}
                      >
                        <TypeIcon className="w-5 h-5" style={{ color: typeConfig.accent }} />
                      </div>

                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-ink leading-snug">
                          {offer.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted font-medium mt-1">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-muted opacity-70 shrink-0" />
                            <span>{offer.company_name}</span>
                          </div>
                          {details.governorate && (
                            <span className="badge-soft inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-[8px]">
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              <span>{details.governorate}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Small plain status dot + "متاح للتقديم" */}
                    <span className="self-start sm:self-center badge-soft inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-[var(--c-accent)]/20 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>متاح للتقديم</span>
                    </span>
                  </div>

                  {/* Highlights with Data-type colored icon chips on neutral cards */}
                  {(salary || location || shift) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-3 border-t border-[var(--c-border)] text-xs sm:text-sm">
                      {salary && (
                        <div className="flex items-center gap-2.5 bg-[var(--c-accent-soft)]/40 border border-[var(--c-border)] border-r-[3px] border-r-[var(--c-warn)] rounded-[12px] px-3 py-2 text-muted">
                          <div className="w-8 h-8 rounded-full bg-[var(--c-warn)]/10 border border-[var(--c-warn)]/25 text-[var(--c-warn)] flex items-center justify-center shrink-0">
                            <Banknote className="w-4 h-4 text-[var(--c-warn)]" />
                          </div>
                          <span className="font-semibold text-ink truncate">{salary}</span>
                        </div>
                      )}
                      {location && (
                        <div className="flex items-center gap-2.5 bg-[var(--c-accent-soft)]/40 border border-[var(--c-border)] border-r-[3px] border-r-[var(--c-accent)] rounded-[12px] px-3 py-2 text-muted">
                          <div className="w-8 h-8 rounded-full bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/25 text-[var(--c-accent)] flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-[var(--c-accent)]" />
                          </div>
                          <span className="truncate">{location}</span>
                        </div>
                      )}
                      {shift && (
                        <div className="flex items-center gap-2.5 bg-[var(--c-accent-soft)]/40 border border-[var(--c-border)] border-r-[3px] border-r-[var(--c-accent)] rounded-[12px] px-3 py-2 text-muted">
                          <div className="w-8 h-8 rounded-full bg-[var(--c-accent)]/10 border border-[var(--c-accent)]/25 text-[var(--c-accent)] flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-[var(--c-accent)]" />
                          </div>
                          <span className="truncate">{shift}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer action: --primary button with 12px radius */}
                  <div className="pt-3 border-t border-[var(--c-border)] flex items-center justify-end">
                    <Link
                      to={`/offers/${offer.id}`}
                      className="btn-primary inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-2.5 rounded-[12px] transition-all active:scale-95 w-full sm:w-auto"
                    >
                      <span>عرض التفاصيل والتقديم</span>
                      <ArrowLeft className="w-4 h-4" />
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


