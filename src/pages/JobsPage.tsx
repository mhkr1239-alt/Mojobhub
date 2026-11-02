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

  // Search & Type Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | JobTypeKey>('all');

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

  // Filtered offers by search query (title or company_name) and job type
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

      return matchesQuery && matchesType;
    });
  }, [offers, searchQuery, selectedType]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
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
      <section className="w-full bg-gradient-to-b from-[#E7F3F0] to-[#FBF9F5] border-b border-[#E7F3F0] py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
          {/* Headline & Subtext */}
          <div className="text-right max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B2B26] tracking-tight leading-tight">
              الوظائف المتاحة
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#5B6B67] leading-relaxed">
              اختر الوظيفة المناسبة ليك واطّلع على التفاصيل وقدّم طلبك مباشرة في خطوات بسيطة بدون تعقيد.
            </p>
          </div>

          {/* Live animated stat card: color --accent #C9822A */}
          <div className="self-start sm:self-auto bg-white/90 backdrop-blur-xs border border-[#E7F3F0] rounded-[16px] px-6 py-4 shadow-xs flex sm:flex-col items-center sm:items-center gap-3 sm:gap-1 min-w-[170px]">
            <span className="text-5xl sm:text-6xl font-extrabold text-[#C9822A] tracking-tight font-cairo leading-none">
              {loading ? '...' : displayCount}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#5B6B67] text-center leading-tight">
              فرصة عمل متاحة الآن
            </span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[16px] flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">
              <p>{error}</p>
              <button
                onClick={fetchOffers}
                className="mt-2 text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-[12px] hover:bg-red-700 transition"
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
                className="bg-white border border-[#EBE7DF] rounded-[16px] p-6 shadow-xs animate-pulse space-y-4"
              >
                <div className="h-6 bg-slate-100 rounded-md w-2/3"></div>
                <div className="h-4 bg-slate-50 rounded-md w-1/3"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="h-10 bg-slate-50 rounded-[12px]"></div>
                  <div className="h-10 bg-slate-50 rounded-[12px]"></div>
                  <div className="h-10 bg-slate-50 rounded-[12px]"></div>
                </div>
                <div className="h-10 bg-slate-100 rounded-[12px] w-32"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State when no jobs exist in DB */}
        {!loading && !error && offers.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#EBE7DF] rounded-[16px] p-8 shadow-xs">
            <Briefcase className="w-12 h-12 text-[#5B6B67]/40 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#0B2B26]">لا توجد وظائف شاغرة حالياً</h3>
            <p className="text-sm text-[#5B6B67] mt-1 max-w-sm mx-auto">
              تابعنا باستمرار، يتم إضافة فرص عمل جديدة أولاً بأول.
            </p>
          </div>
        )}

        {/* Search & Filter Controls (shown when offers are loaded) */}
        {!loading && !error && offers.length > 0 && (
          <div className="mb-6 space-y-3">
            {/* 1. Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#5B6B67]">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بوظيفة أو شركة…"
                className="w-full pr-10 pl-10 py-3 bg-white border border-[#EBE7DF] rounded-[14px] text-sm text-[#0B2B26] placeholder-[#5B6B67]/60 focus:outline-none focus:border-[#0F6657] focus:ring-2 focus:ring-[#0F6657]/15 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5B6B67] hover:text-[#0B2B26] transition-colors"
                  title="مسح البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
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
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
                      isActive
                        ? 'bg-[#0F6657] text-white border-[#0F6657] shadow-xs'
                        : 'bg-white text-[#5B6B67] hover:text-[#0B2B26] hover:bg-[#FBF9F5] border-[#EBE7DF]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 3. Result Count */}
            <div className="pt-1 flex items-center justify-between text-xs sm:text-sm text-[#5B6B67]">
              <span className="font-bold text-[#0B2B26]">
                {filteredOffers.length} وظيفة متاحة
              </span>
              {(searchQuery || selectedType !== 'all') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-[#0F6657] hover:underline font-semibold"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. Empty State when search/filter yields zero results */}
        {!loading && !error && offers.length > 0 && filteredOffers.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-white border border-[#EBE7DF] rounded-[16px] p-8 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E7F3F0] text-[#0F6657] flex items-center justify-center mx-auto mb-1">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0B2B26]">مفيش وظائف مطابقة لبحثك</h3>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F6657] hover:bg-[#0c5246] text-white text-xs sm:text-sm font-bold rounded-[12px] transition-colors shadow-xs"
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
              const staggerDelay = `${Math.min(index, 3) * 50}ms`;

              return (
                <div
                  key={offer.id}
                  className="home-card-entry bg-white border border-[#EBE7DF] hover:shadow-md rounded-[16px] p-5 sm:p-6 transition-shadow"
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
                        <h2 className="text-lg sm:text-xl font-bold text-[#0B2B26] leading-snug">
                          {offer.title}
                        </h2>
                        <div className="flex items-center gap-1.5 text-sm text-[#5B6B67] font-medium mt-1">
                          <Building2 className="w-4 h-4 text-[#5B6B67]/70 shrink-0" />
                          <span>{offer.company_name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Small plain status dot + "متاح للتقديم" */}
                    <span className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6657] bg-[#E7F3F0]/60 px-2.5 py-1 rounded-full border border-[#0F6657]/10 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F6657]"></span>
                      <span>متاح للتقديم</span>
                    </span>
                  </div>

                  {/* Highlights with Data-type colored icon chips on neutral cards */}
                  {(salary || location || shift) && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-3 border-t border-[#F1EFEA] text-xs sm:text-sm">
                      {salary && (
                        <div className="flex items-center gap-2.5 bg-[#FBF9F5] border border-[#F1EFEA] border-r-[3px] border-r-[#C9822A] rounded-[12px] px-3 py-2 text-[#5B6B67]">
                          <div className="w-8 h-8 rounded-full bg-[#C9822A]/15 border border-[#C9822A]/25 text-[#C9822A] flex items-center justify-center shrink-0">
                            <Banknote className="w-4 h-4 text-[#C9822A]" />
                          </div>
                          <span className="font-semibold text-[#0B2B26] truncate">{salary}</span>
                        </div>
                      )}
                      {location && (
                        <div className="flex items-center gap-2.5 bg-[#FBF9F5] border border-[#F1EFEA] border-r-[3px] border-r-[#3978B8] rounded-[12px] px-3 py-2 text-[#5B6B67]">
                          <div className="w-8 h-8 rounded-full bg-[#3978B8]/15 border border-[#3978B8]/25 text-[#3978B8] flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-[#3978B8]" />
                          </div>
                          <span className="truncate">{location}</span>
                        </div>
                      )}
                      {shift && (
                        <div className="flex items-center gap-2.5 bg-[#FBF9F5] border border-[#F1EFEA] border-r-[3px] border-r-[#8170B8] rounded-[12px] px-3 py-2 text-[#5B6B67]">
                          <div className="w-8 h-8 rounded-full bg-[#8170B8]/15 border border-[#8170B8]/25 text-[#8170B8] flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-[#8170B8]" />
                          </div>
                          <span className="truncate">{shift}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer action: --primary button with 12px radius */}
                  <div className="pt-3 border-t border-[#F1EFEA] flex items-center justify-end">
                    <Link
                      to={`/offers/${offer.id}`}
                      className="inline-flex items-center justify-center gap-2 bg-[#0F6657] hover:bg-[#0c5246] text-white font-bold text-sm px-5 py-2.5 rounded-[12px] transition-colors shadow-xs w-full sm:w-auto"
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


