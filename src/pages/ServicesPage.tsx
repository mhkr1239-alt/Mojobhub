import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  return (
    <div className="band-violet min-h-full pb-16" dir="rtl">
      <div className="max-w-lg mx-auto px-4 py-14 pb-20 text-center" dir="rtl">
        <div data-reveal className="reveal glass-card rounded-[24px] p-8 sm:p-10">
          {/* Icon — ثيم الخدمات الفرعي البنفسجي */}
          <div className="w-16 h-16 bg-[var(--c-violet)]/10 border border-[var(--c-violet)]/25 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-[var(--c-violet)]" />
          </div>

          <h1 className="text-2xl font-extrabold text-ink mb-2">الخدمات قريبًا</h1>

          <p className="text-sm text-muted leading-relaxed mb-8 max-w-sm mx-auto">
            بنجهّز لك باقة خدمات جديدة على المنصة. تابعنا قريبًا — أول ما تكتمل الخدمات هيظهر الباب
            هنا.
          </p>

          {/* Coming soon badge */}
          <div className="inline-flex items-center gap-2 text-sm font-bold text-[var(--c-violet)] bg-[var(--c-violet)]/10 border border-[var(--c-violet)]/25 px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
            <span>قريبًا</span>
          </div>

          {/* Back to jobs */}
          <div>
            <Link
              to="/jobs"
              className="btn-primary w-full inline-flex items-center justify-center gap-2 font-bold text-base px-6 py-3.5 rounded-[12px] transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للوظائف</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
