import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Briefcase,
  Sparkles,
  AlertCircle,
  Search,
  ClipboardList,
  Send,
} from 'lucide-react';

const STEPS = [
  {
    n: '١',
    icon: Search,
    title: 'اختر الفرصة',
    desc: 'تصفّح الوظائف المتاحة واختر ما يناسب خبرتك.',
  },
  {
    n: '٢',
    icon: ClipboardList,
    title: 'املأ النموذج',
    desc: 'بيانات قصيرة وواضحة من هاتفك مباشرة.',
  },
  {
    n: '٣',
    icon: Send,
    title: 'أرسل طلبك',
    desc: 'في أقل من دقيقة، وبرقم مرجعي لمتابعته.',
  },
];

export const HomePage: React.FC = () => {
  // Live count of active offers (read-only, public data)
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [countError, setCountError] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      if (cancelled) return;
      if (error) {
        console.error('Error fetching offers count:', error);
        setCountError(true);
        setActiveCount(null);
      } else {
        setActiveCount(count ?? 0);
      }
    };
    fetchCount();
    return () => {
      cancelled = true;
    };
  }, []);

  const doors = [
    {
      to: '/jobs',
      icon: <Briefcase className="w-6 h-6 text-[var(--c-accent)]" />,
      title: 'الوظائف المتاحة',
      desc: 'استعرض الوظائف المفتوحة حاليًا واطّلع على التفاصيل وقدّم طلبك مباشرة في خطوات بسيطة.',
      badge: null as React.ReactNode,
      cta: 'دخول باب الوظائف',
      ctaSecondary: false,
      enabled: true,
      chipStyle: undefined as React.CSSProperties | undefined,
    },
    {
      to: '/services',
      icon: <Sparkles className="w-6 h-6" />,
      title: 'خدمات مهنية ورقمية',
      desc: 'سيرة ذاتية ATS، تحسين LinkedIn، شعارات وهوية، عروض تقديمية، صفحات هبوط ومواقع، ولوحات Excel — اختر الباقة وأرسل طلبك.',
      badge: (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full text-[#0E8A7E] bg-[var(--c-accent-soft)] border border-[var(--c-accent)]/25">
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          10 خدمات متاحة الآن
        </span>
      ),
      stat: null,
      cta: 'استعرض الخدمات',
      ctaSecondary: true,
      enabled: true,
      chipStyle: {
        background: 'var(--c-violet-soft)',
        color: 'var(--c-violet)',
        borderColor: 'color-mix(in srgb, var(--c-violet) 18%, transparent)',
      } as React.CSSProperties,
    },
  ];

  return (
    <div className="min-h-full pb-16" dir="rtl">
      {/* ═══ البطلة الداكنة — الانطباع الأول القوي ═══ */}
      <section className="sec-dark relative w-full overflow-hidden border-b border-white/10">
        {/* توهجات حية بطيئة */}
        <span
          aria-hidden="true"
          className="glow-orb"
          style={{ width: 340, height: 340, top: -130, right: -90, background: 'rgba(76,131,232,0.32)' }}
        ></span>
        <span
          aria-hidden="true"
          className="glow-orb glow-orb-2"
          style={{ width: 300, height: 300, bottom: -150, left: -70, background: 'rgba(17,169,154,0.22)' }}
        ></span>

        <div className="relative max-w-4xl mx-auto py-14 sm:py-20 px-4 sm:px-6 text-center">
          <div
            className="animate-fade-up inline-flex items-center gap-2 text-xs font-bold text-[var(--c-accent-soft-foreground)] tracking-wide bg-[var(--c-accent-soft)] border border-[var(--c-border)] rounded-full px-4 py-1.5 mb-5"
            style={{ animationDelay: '0ms' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
            منصة مورا — فرص وظيفية وخدمات رقمية
          </div>

          <h1
            className="animate-fade-up text-[30px] sm:text-[40px] font-extrabold text-ink tracking-tight leading-[1.3]"
            style={{ animationDelay: '80ms' }}
          >
            مسارك المهني وحلولك الرقمية{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[var(--c-sky)] to-[var(--c-accent)]">
              في مكان واحد
            </span>
          </h1>

          <p
            className="animate-fade-up mt-4 text-sm sm:text-base text-muted leading-relaxed max-w-xl mx-auto"
            style={{ animationDelay: '160ms' }}
          >
            اكتشف فرصًا مناسبة، واطلب خدمات تساعدك على التقدم مهنيًا ورقميًا — التقديم متاح من هاتفك في أقل من دقيقة.
          </p>

          <div
            className="animate-fade-up mt-7 flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ animationDelay: '240ms' }}
          >
            <Link
              to="/jobs"
              className="btn-primary inline-flex items-center justify-center gap-2 font-bold text-sm px-7 py-3 rounded-[14px] transition-all active:scale-95 w-full sm:w-auto"
            >
              <span>تصفّح الوظائف</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              to="/services"
              className="btn-secondary inline-flex items-center justify-center gap-2 font-bold text-sm px-7 py-3 rounded-[14px] transition-all active:scale-95 hover:text-ink w-full sm:w-auto"
            >
              <span>اكتشف خدماتنا</span>
              <Sparkles className="w-4 h-4" />
            </Link>
          </div>

          {/* عدّاد حي */}
          {!countError && (
            <div
              className="animate-fade-up mt-6 inline-flex items-center gap-2 text-xs font-semibold text-muted"
              style={{ animationDelay: '320ms' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-accent)] animate-pulse"></span>
              <span>
                {activeCount === null
                  ? 'جاري تحميل الفرص...'
                  : `${activeCount} ${activeCount === 1 ? 'فرصة متاحة الآن' : 'فرص متاحة الآن'}`}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ═══ المحتوى الفاتح — الأبواب ═══ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        <div data-reveal className="reveal text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
            إلى أين تحب أن تبدأ؟
          </h2>
          <p className="mt-1.5 text-sm text-muted">بابان واضحان — اختر ما يناسبك.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {doors.map((door, index) => {
            const inner = (
              <>
                {/* Door header: icon + badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 icon-chip"
                    style={door.chipStyle}
                  >
                    {door.icon}
                  </div>
                  {door.badge}
                </div>

                {/* Title + description */}
                <h3 className="text-xl font-bold text-ink leading-snug mb-1.5">
                  {door.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-4">{door.desc}</p>

                {/* CTA pinned to bottom */}
                <div className="mt-auto pt-3 border-t border-[var(--c-border)]">
                  {door.ctaSecondary ? (
                    <span className="inline-flex items-center justify-center gap-2 btn-secondary font-bold text-sm px-5 py-2.5 rounded-[12px] transition-all active:scale-95 w-full sm:w-auto">
                      <span>{door.cta}</span>
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2 btn-primary font-bold text-sm px-5 py-2.5 rounded-[12px] transition-all active:scale-95 w-full sm:w-auto">
                      <span>{door.cta}</span>
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                  )}
                </div>
              </>
            );

            return (
              <Link
                key={door.to}
                to={door.to}
                data-reveal
                className="reveal glass-card hover:-translate-y-1 hover:shadow-xl rounded-[16px] p-5 sm:p-6 flex flex-col group transition-all duration-200"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {inner}
              </Link>
            );
          })}
        </div>

        {/* ═══ شريط الإرشاد — ثلاث خطوات ═══ */}
        <div data-reveal className="reveal mt-10">
          <h3 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight text-center">
            تقديمك في ثلاث خطوات
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.n}
                  className="glass-card rounded-[16px] p-4 flex items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--c-accent-soft)] border border-[var(--c-accent)]/20 flex items-center justify-center">
                      <StepIcon className="w-[18px] h-[18px] text-[var(--c-accent-soft-foreground)]" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--c-accent)] text-[var(--c-on-accent)] text-[11px] font-extrabold flex items-center justify-center leading-none">
                      {step.n}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{step.title}</p>
                    <p className="text-xs text-muted leading-relaxed mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reassurance note */}
        <div data-reveal className="reveal mt-8 p-4 glass-card rounded-[16px] flex items-start gap-3">
          <div className="rounded-full bg-[var(--c-accent-soft)]/60 border border-[var(--c-border)] p-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-muted opacity-70" />
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            التقديم متاح على مدار الساعة من موبايلك، وبياناتك تُستخدم لأغراض التوظيف فقط وفقًا
            لـ
            <Link
              to="/privacy"
              className="text-[var(--c-accent-soft-foreground)] font-bold underline underline-offset-2 hover:text-[var(--c-accent-hover)] transition-colors"
            >
              سياسة الخصوصية
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};
