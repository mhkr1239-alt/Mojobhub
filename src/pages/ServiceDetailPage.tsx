import React, { useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  RefreshCw,
  CheckCircle2,
  FileText,
  HelpCircle,
  ClipboardList,
  Package,
  ChevronDown,
  ArrowLeft,
} from 'lucide-react';
import {
  getServiceBySlug,
  getCategoryById,
  SERVICE_PROCESS_STEPS,
  formatPriceHint,
  PACKAGE_KEY_LABELS,
  type ServicePackage,
} from '../lib/servicesCatalog';

export const ServiceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const service = useMemo(() => (slug ? getServiceBySlug(slug) : undefined), [slug]);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const cat = getCategoryById(service.categoryId)!;
  const available = service.status === 'available';

  return (
    <div className="band-violet min-h-full pb-16" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* ─── مسار التنقل ─── */}
        <nav aria-label="مسار التنقل" className="pt-6 pb-4 flex items-center gap-1.5 text-xs text-muted" data-reveal>
          <Link to="/services" className="hover:text-ink transition-colors">الخدمات</Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: cat.color }} className="font-bold">{cat.nameAr}</span>
        </nav>

        {/* ─── ترويسة الخدمة ─── */}
        <header className="glass-card rounded-[22px] p-6 sm:p-7 mb-5 shadow-soft" data-reveal>
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: cat.colorSoft }}
            >
              <img src={cat.icon} alt="" aria-hidden="true" className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cat.colorStrong, backgroundColor: cat.colorSoft }}>
                  {cat.nameAr}
                </span>
                {available ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full badge-soft">
                    متاح للطلب
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-[var(--c-warn-strong)] bg-[var(--c-warn)]/10">
                    قريبًا
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink leading-snug mb-1">{service.titleAr}</h1>
              <p className="text-xs text-muted">{service.titleEn}</p>
            </div>
          </div>
          <p className="text-sm text-muted leading-relaxed">{service.descriptionAr}</p>
        </header>

        {available ? (
          <>
            {/* ─── الباقات ─── */}
            <section className="mb-10" data-reveal>
              <h2 className="text-lg font-extrabold text-ink mb-1.5 flex items-center gap-2">
                <Package className="w-5 h-5 text-[var(--c-violet)]" />
                الباقات والأسعار
              </h2>
              <p className="text-xs text-muted mb-5 leading-relaxed">
                الأسعار استرشادية بالدولار — يُعتمد السعر النهائي بعد مراجعة طلبك وتأكيد النطاق معك.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
                {service.packages.map((pkg) => (
                  <PackageCard key={pkg.key} pkg={pkg} slug={service.slug} />
                ))}
              </div>
            </section>

            {/* ─── المطلوب من العميل ─── */}
            <section className="glass-card rounded-[20px] p-6 mb-5 shadow-soft" data-reveal>
              <h2 className="text-base font-extrabold text-ink mb-3 flex items-center gap-2">
                <ClipboardList className="w-4.5 h-4.5 text-[var(--c-violet)]" />
                المطلوب منك عند الطلب
              </h2>
              <ul className="space-y-2">
                {service.requirementsAr.map((req) => (
                  <li key={req} className="flex items-start gap-2 text-sm text-muted leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-[var(--c-accent)] mt-0.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ─── خطوات العمل ─── */}
            <section className="mb-10" data-reveal>
              <h2 className="text-lg font-extrabold text-ink mb-4">خطوات العمل بعد إرسال الطلب</h2>
              <ol className="space-y-2.5">
                {SERVICE_PROCESS_STEPS.map((step, i) => (
                  <li key={step.title} className="glass-card rounded-[14px] p-3.5 flex items-start gap-3 shadow-soft">
                    <div className="w-7 h-7 rounded-full bg-[var(--c-violet)]/10 border border-[var(--c-violet)]/25 text-[var(--c-violet-soft-foreground)] text-xs font-extrabold flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">{step.title}</h3>
                      <p className="text-xs text-muted leading-relaxed mt-0.5">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* ─── الأسئلة الشائعة ─── */}
            {service.faq.length > 0 && (
              <section className="mb-10" data-reveal>
                <h2 className="text-lg font-extrabold text-ink mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[var(--c-violet)]" />
                  أسئلة شائعة عن هذه الخدمة
                </h2>
                <div className="space-y-2.5">
                  {service.faq.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </section>
            )}

            {/* ─── CTA ثابت ─── */}
            <div className="sticky bottom-4 z-30" data-reveal>
              <div className="glass-card rounded-[16px] p-3.5 flex items-center justify-between gap-3 shadow-soft border border-[var(--c-border)]">
                <div className="min-w-0">
                  <p className="text-[10px] text-muted">السعر الاسترشادي</p>
                  <p className="text-sm font-extrabold text-ink truncate">{formatPriceHint(service)}</p>
                </div>
                <Link
                  to={`/services/${service.slug}/request`}
                  className="btn-primary inline-flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-[12px] transition shrink-0"
                >
                  <span>اطلب الخدمة</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </>
        ) : (
          /* ─── حالة قريبًا ─── */
          <div className="glass-card rounded-[20px] p-8 text-center" data-reveal>
            <div className="inline-flex items-center gap-2 text-sm font-bold text-[var(--c-warn-strong)] bg-[var(--c-warn)]/10 border border-[var(--c-warn)]/25 px-4 py-2 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span>قريبًا</span>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-6 max-w-sm mx-auto">
              هذه الخدمة تُفتح للطلب عند اكتمال تجهيز نطاقها وباقاتها بجودة نرضاها. تابعنا — أو ابدأ بخدمة متاحة الآن.
            </p>
            <Link
              to="/services"
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold px-6 py-3 rounded-[12px] transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>تصفح الخدمات المتاحة</span>
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>كل الخدمات</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── بطاقة باقة ───

const PackageCard: React.FC<{ pkg: ServicePackage; slug: string }> = ({ pkg, slug }) => {
  const isQuote = pkg.pricingType === 'quote_required';
  const isPro = pkg.key === 'pro';

  return (
    <div
      className={`glass-card rounded-[18px] p-5 flex flex-col shadow-soft relative ${
        isPro ? 'ring-2 ring-[var(--c-violet)]/45' : ''
      }`}
    >
      {isPro && (
        <span className="absolute -top-2.5 right-4 text-[9px] font-extrabold text-white bg-[var(--c-violet)] px-2.5 py-0.5 rounded-full">
          الأكثر طلبًا
        </span>
      )}
      <h3 className="text-sm font-extrabold text-ink mb-3">{pkg.nameAr}</h3>

      <div className="mb-4">
        {isQuote ? (
          <>
            <p className="text-xl font-extrabold text-ink">عرض سعر</p>
            <p className="text-[11px] text-muted mt-0.5">يُعتمد حسب النطاق بعد مراجعة طلبك</p>
          </>
        ) : (
          <>
            <p className="text-xl font-extrabold text-ink">
              {pkg.amountUsd}$
              {pkg.pricingType === 'starting_at' && (
                <span className="text-[11px] font-medium text-muted"> يبدأ من</span>
              )}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              <Clock className="w-3 h-3 inline ml-0.5 -mt-0.5" /> نحو {pkg.deliveryDays} أيام ·{' '}
              <RefreshCw className="w-3 h-3 inline ml-0.5 -mt-0.5" /> {pkg.revisions}{' '}
              {pkg.revisions === 1 ? 'تعديل' : 'تعديلات'}
            </p>
          </>
        )}
      </div>

      <p className="text-xs text-muted leading-relaxed mb-4">{pkg.scopeNotes}</p>

      <ul className="space-y-1.5 mb-5 flex-1">
        {pkg.deliverables.map((d) => (
          <li key={d} className="flex items-start gap-1.5 text-xs text-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--c-accent)] mt-0.5 shrink-0" />
            <span>{d}</span>
          </li>
        ))}
      </ul>

      <Link
        to={`/services/${slug}/request?package=${pkg.key}`}
        className={
          isPro
            ? 'btn-primary w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-[10px] transition'
            : 'btn-secondary w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-[10px] transition hover:bg-[var(--c-accent-soft)]/50 hover:text-ink'
        }
      >
        <FileText className="w-3.5 h-3.5" />
        <span>اطلب هذه الباقة</span>
      </Link>
    </div>
  );
};

// ─── عنصر FAQ قابل للفتح ───

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-[14px] shadow-soft overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 text-right cursor-pointer"
      >
        <span className="text-sm font-bold text-ink">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <p className="px-4 pb-4 text-xs text-muted leading-relaxed">{a}</p>}
    </div>
  );
};
