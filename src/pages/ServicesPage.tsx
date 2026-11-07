import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Clock, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import {
  SERVICE_CATEGORIES,
  SERVICES,
  SERVICE_PROCESS_STEPS,
  formatPriceHint,
  type Service,
} from '../lib/servicesCatalog';

export const ServicesPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICES.filter((s) => {
      if (activeCat && s.categoryId !== activeCat) return false;
      if (!q) return true;
      return (
        s.titleAr.toLowerCase().includes(q) ||
        s.titleEn.toLowerCase().includes(q) ||
        s.taglineAr.toLowerCase().includes(q) ||
        s.descriptionAr.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat]);

  const availableCount = SERVICES.filter((s) => s.status === 'available').length;

  return (
    <div className="band-violet min-h-full pb-16" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* ─── ترويسة القسم ─── */}
        <header className="pt-12 pb-8 text-center reveal" data-reveal>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[var(--c-violet-soft-foreground)] bg-[var(--c-violet-soft)] border border-[var(--c-violet)]/20 px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خدمات تنفذها مورا مباشرة — جودة واحدة ومراجعة بشرية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mb-3 leading-snug">
            خدمات مهنية ورقمية تنجز لك من مكان واحد
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl mx-auto">
            سيرة ذاتية، هوية بصرية، مواقع، ولوحات بيانات — اختر الخدمة والباقة المناسبة، أرسل طلبك،
            ونؤكد معك النطاق والسعر والمدة قبل البدء.
          </p>
        </header>

        {/* ─── البحث ─── */}
        <div className="relative mb-4" data-reveal>
          <Search className="absolute top-1/2 -translate-y-1/2 right-3.5 w-4.5 h-4.5 text-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن خدمة… (مثال: سيرة ذاتية، شعار، موقع)"
            aria-label="البحث في الخدمات"
            className="w-full glass-card rounded-[14px] pl-4 pr-11 py-3.5 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-[var(--c-violet)]/40 border border-[var(--c-border)]"
          />
        </div>

        {/* ─── فلاتر الفئات ─── */}
        <div
          className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-8"
          role="group"
          aria-label="تصفية حسب الفئة"
          data-reveal
        >
          <button
            type="button"
            onClick={() => setActiveCat(null)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition ${
              activeCat === null
                ? 'bg-[var(--c-ink)] text-white border-transparent'
                : 'glass-card text-muted hover:text-ink'
            }`}
          >
            <span>الكل</span>
            <span className="text-[10px] opacity-70">{SERVICES.length}</span>
          </button>
          {SERVICE_CATEGORIES.map((cat) => {
            const count = SERVICES.filter((s) => s.categoryId === cat.id).length;
            const active = activeCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCat(active ? null : cat.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition ${
                  active
                    ? 'text-[var(--c-ink)]' // WP-2.1: كحلي فوق soft للفئة — 12.75–13.60:1 (كان أبيض فوق اللون الصلب — يفشل في 3 فئات)
                    : 'glass-card text-muted hover:text-ink'
                }`}
                style={active ? { backgroundColor: cat.colorSoft, borderColor: cat.color } : undefined}
              >
                <img src={cat.icon} alt="" aria-hidden="true" className="w-4 h-4" />
                <span>{cat.nameAr}</span>
                <span className="text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {/* ─── شبكة الخدمات ─── */}
        {filtered.length === 0 ? (
          <div className="glass-card rounded-[20px] p-10 text-center" data-reveal>
            <p className="text-sm text-muted mb-1">لا توجد خدمة مطابقة لبحثك</p>
            <p className="text-xs text-muted/80">جرّب كلمة أخرى مثل «سيرة» أو «موقع» أو تصفح فئة مختلفة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
            {filtered.map((service, i) => (
              <ServiceCard key={service.slug} service={service} index={i} />
            ))}
          </div>
        )}

        {/* ─── كيف نعمل ─── */}
        <section className="mb-14" data-reveal>
          <h2 className="text-lg font-extrabold text-ink mb-1.5 text-center">كيف نعمل؟</h2>
          <p className="text-xs text-muted text-center mb-6">
            {availableCount} خدمة متاحة للطلب الآن — بعملية واضحة من الطلب حتى التسليم
          </p>
          <ol className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {SERVICE_PROCESS_STEPS.map((step, i) => (
              <li key={step.title} className="glass-card rounded-[16px] p-4 shadow-soft">
                <div className="w-7 h-7 rounded-full bg-[var(--c-violet)]/10 border border-[var(--c-violet)]/25 text-[var(--c-violet-soft-foreground)] text-xs font-extrabold flex items-center justify-center mb-2.5">
                  {i + 1}
                </div>
                <h3 className="text-sm font-bold text-ink mb-1">{step.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ─── شريط الضمانات ─── */}
        <section className="glass-card rounded-[20px] p-6 sm:p-7 mb-4" data-reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="icon-chip w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink mb-0.5">نطاق واضح قبل البدء</h3>
                <p className="text-xs text-muted leading-relaxed">نؤكد معك المطلوب والسعر والمدة قبل التنفيذ — لا مفاجآت.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="icon-chip w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <RefreshCw className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink mb-0.5">تعديلات محددة لكل باقة</h3>
                <p className="text-xs text-muted leading-relaxed">عدد التعديلات معلن في كل باقة — أرسل ملاحظاتك في طلب واحد واضح.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="icon-chip w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink mb-0.5">مدة تسليم معلنة</h3>
                <p className="text-xs text-muted leading-relaxed">كل باقة تحدد مدة التنفيذ — وإذا تأخرنا نخبرك أولًا بأول.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// ─── بطاقة خدمة ───

const ServiceCard: React.FC<{ service: Service; index: number }> = ({ service, index }) => {
  const cat = SERVICE_CATEGORIES.find((c) => c.id === service.categoryId)!;
  const available = service.status === 'available';

  return (
    <div
      data-reveal
      className="glass-card rounded-[20px] p-5 shadow-soft flex flex-col"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: cat.colorSoft }}
        >
          <img src={cat.icon} alt="" aria-hidden="true" className="w-6 h-6" />
        </div>
        {available ? (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full badge-soft"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            متاح الآن
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full text-[var(--c-warn-strong)] bg-[var(--c-warn)]/10 border border-[var(--c-warn)]/25">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            قريبًا
          </span>
        )}
      </div>

      <p className="text-[10px] font-bold mb-1" style={{ color: cat.colorStrong }}>
        {cat.nameAr}
      </p>
      <h3 className="text-base font-extrabold text-ink leading-snug mb-1.5">{service.titleAr}</h3>
      <p className="text-xs text-muted leading-relaxed mb-4 flex-1">{service.taglineAr}</p>

      <div className="flex items-center justify-between gap-2 mt-auto">
        {available ? (
          <>
            <div>
              <p className="text-[10px] text-muted mb-0.5">السعر الاسترشادي</p>
              <p className="text-sm font-extrabold text-ink">
                {formatPriceHint(service)}
                <span className="text-[10px] font-medium text-muted"> — يُعتمد بعد المراجعة</span>
              </p>
            </div>
            <Link
              to={`/services/${service.slug}`}
              className="btn-primary inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-[10px] transition shrink-0"
            >
              <span>التفاصيل</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        ) : (
          <p className="text-xs text-muted/80 italic">تُفتح للطلب عند توفر قدرة التنفيذ الكاملة.</p>
        )}
      </div>
    </div>
  );
};
