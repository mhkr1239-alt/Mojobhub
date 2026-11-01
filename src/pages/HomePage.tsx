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
      icon: <Briefcase className="w-6 h-6 text-[#0F6657]" />,
      iconBg: 'bg-[#E7F3F0] border-[#0F6657]/15',
      title: 'الوظائف المتاحة',
      desc: 'استعرض الوظائف المفتوحة حاليًا واطّلع على التفاصيل وقدّم طلبك مباشرة في خطوات بسيطة.',
      badge: null as React.ReactNode,
      stat: countError
        ? null
        : activeCount === null
        ? 'جاري التحميل...'
        : `${activeCount} ${activeCount === 1 ? 'فرصة متاحة الآن' : 'فرص متاحة الآن'}`,
      cta: 'دخول باب الوظائف',
      enabled: true,
    },
    {
      to: '/services',
      icon: <Sparkles className="w-6 h-6 text-[#C9822A]" />,
      iconBg: 'bg-[#C9822A]/10 border-[#C9822A]/25',
      title: 'خدماتنا',
      desc: 'باقة خدمات إضافية تقدملك بيها الدعم اللي محتاجه — بنجهّزها حاليًا عشان توصلك بأفضل شكل.',
      badge: (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C9822A] bg-[#C9822A]/10 border border-[#C9822A]/25 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9822A]"></span>
          قريبًا
        </span>
      ),
      stat: null,
      cta: 'دخول باب الخدمات',
      enabled: true,
    },
  ];

  return (
    <div className="min-h-full pb-16" dir="rtl">
      {/* Hero Band */}
      <section className="w-full bg-gradient-to-b from-[#E7F3F0] to-[#FBF9F5] border-b border-[#E7F3F0] py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B2B26] tracking-tight leading-tight">
            أهلاً بك في فرص التوظيف
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#5B6B67] leading-relaxed max-w-xl mx-auto">
            بوابتك المباشرة للتقديم على الوظائف المتاحة، وخدمات إضافية قريبًا. اختار الباب اللي
            يناسبك وابدأ.
          </p>
        </div>
      </section>

      {/* Two Doors */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {doors.map((door) => {
            const inner = (
              <>
                {/* Door header: icon + badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-[14px] border flex items-center justify-center shrink-0 ${door.iconBg}`}
                  >
                    {door.icon}
                  </div>
                  {door.badge}
                </div>

                {/* Title + description */}
                <h2 className="text-lg sm:text-xl font-bold text-[#0B2B26] leading-snug mb-1.5">
                  {door.title}
                </h2>
                <p className="text-sm text-[#5B6B67] leading-relaxed mb-4">{door.desc}</p>

                {/* Stat (jobs door only) */}
                {door.stat && (
                  <div className="inline-flex self-start items-center gap-1.5 text-xs font-semibold text-[#0F6657] bg-[#E7F3F0]/60 border border-[#0F6657]/10 px-2.5 py-1 rounded-full mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F6657]"></span>
                    <span>{door.stat}</span>
                  </div>
                )}

                {/* CTA pinned to bottom */}
                <div className="mt-auto pt-3 border-t border-[#F1EFEA]">
                  <span className="inline-flex items-center justify-center gap-2 bg-[#0F6657] group-hover:bg-[#0c5246] text-white font-bold text-sm px-5 py-2.5 rounded-[12px] transition-colors shadow-xs w-full sm:w-auto">
                    <span>{door.cta}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                </div>
              </>
            );

            return (
              <Link
                key={door.to}
                to={door.to}
                className="home-card-entry bg-white border border-[#EBE7DF] hover:shadow-md rounded-[16px] p-5 sm:p-6 transition-shadow flex flex-col group"
              >
                {inner}
              </Link>
            );
          })}
        </div>

        {/* Reassurance note */}
        <div className="mt-6 p-4 bg-white/70 border border-[#EBE7DF] rounded-[16px] flex items-start gap-3">
          <AlertCircle className="w-4.5 h-4.5 text-[#5B6B67]/70 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[#5B6B67] leading-relaxed">
            التقديم متاح على مدار الساعة من موبايلك، وبياناتك تُستخدم لأغراض التوظيف فقط وفقًا
            لـ
            <Link
              to="/privacy"
              className="text-[#0F6657] font-bold underline underline-offset-2 hover:text-[#0c5246] transition-colors"
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
