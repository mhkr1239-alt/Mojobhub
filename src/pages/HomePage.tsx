import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Briefcase, Sparkles, AlertCircle } from 'lucide-react';

export const HomePage: React.FC = () => {
  // Live count of active offers for Door 1 (read-only, public data)
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
      stat: countError
        ? null
        : activeCount === null
        ? 'جاري التحميل...'
        : `${activeCount} ${activeCount === 1 ? 'فرصة متاحة الآن' : 'فرص متاحة الآن'}`,
      cta: 'دخول باب الوظائف',
      ctaSecondary: false,
      enabled: true,
    },
    {
      to: '/services',
      icon: <Sparkles className="w-6 h-6 text-[var(--c-warn)]" />,
      title: 'خدماتنا',
      desc: 'باقة خدمات إضافية تقدملك بيها الدعم اللي محتاجه — بنجهّزها حاليًا عشان توصلك بأفضل شكل.',
      badge: (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold badge-warn px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          قريبًا
        </span>
      ),
      stat: null,
      cta: 'دخول باب الخدمات',
      ctaSecondary: true,
      enabled: true,
    },
  ];

  return (
    <div className="min-h-full pb-16" dir="rtl">
      {/* Hero Band */}
      <section className="relative w-full border-b border-[var(--c-border)] py-10 sm:py-14 px-4 sm:px-6 overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <div
            className="animate-fade-up text-xs font-bold text-[var(--c-accent)] tracking-widest mb-3"
            style={{ animationDelay: '0ms' }}
          >
            منصة توظيف مصرية
          </div>
          <h1
            className="animate-fade-up text-[28px] font-extrabold text-ink tracking-tight leading-tight"
            style={{ animationDelay: '80ms' }}
          >
            أهلاً بك في فرص التوظيف
          </h1>
          <p
            className="animate-fade-up mt-3 text-sm sm:text-base text-muted leading-relaxed max-w-xl mx-auto"
            style={{ animationDelay: '160ms' }}
          >
            بوابتك المباشرة للتقديم على الوظائف المتاحة، وخدمات إضافية قريبًا. اختار الباب اللي
            يناسبك وابدأ.
          </p>
          <div className="w-[48px] h-[2px] bg-[var(--c-warn)] mx-auto mt-4 rounded-full" />
        </div>
      </section>

      {/* Two Doors */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {doors.map((door, index) => {
            const inner = (
              <>
                {/* Door header: icon + badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 icon-chip"
                  >
                    {door.icon}
                  </div>
                  {door.badge}
                </div>

                {/* Title + description */}
                <h2 className="text-xl font-bold text-ink leading-snug mb-1.5">
                  {door.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed mb-4">{door.desc}</p>

                {/* Stat (jobs door only) */}
                {door.stat && (
                  <div className="inline-flex self-start items-center gap-1.5 text-xs font-semibold badge-soft px-2.5 py-1 rounded-full mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                    <span>{door.stat}</span>
                  </div>
                )}

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

        {/* Reassurance note */}
        <div data-reveal className="reveal mt-6 p-4 glass-card rounded-[16px] flex items-start gap-3">
          <div className="rounded-full bg-[var(--c-accent-soft)]/60 border border-[var(--c-border)] p-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-muted opacity-70" />
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            التقديم متاح على مدار الساعة من موبايلك، وبياناتك تُستخدم لأغراض التوظيف فقط وفقًا
            لـ
            <Link
              to="/privacy"
              className="text-[var(--c-accent)] font-bold underline underline-offset-2 hover:text-[var(--c-accent-hover)] transition-colors"
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
