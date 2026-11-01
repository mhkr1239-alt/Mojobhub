import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export const ServicesPage: React.FC = () => {
  return (
    <div className="max-w-lg mx-auto px-4 py-14 pb-20 text-center" dir="rtl">
      <div className="bg-white border border-[#EBE7DF] rounded-[24px] p-8 sm:p-10 shadow-xs">
        {/* Icon */}
        <div className="w-16 h-16 bg-[#C9822A]/10 border border-[#C9822A]/25 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-[#C9822A]" />
        </div>

        <h1 className="text-2xl font-extrabold text-[#0B2B26] mb-2">الخدمات قريبًا</h1>

        <p className="text-sm text-[#5B6B67] leading-relaxed mb-8 max-w-sm mx-auto">
          بنجهّز لك باقة خدمات جديدة على المنصة. تابعنا قريبًا — أول ما تكتمل الخدمات هيظهر الباب
          هنا.
        </p>

        {/* Coming soon badge */}
        <div className="inline-flex items-center gap-2 text-sm font-bold text-[#C9822A] bg-[#C9822A]/10 border border-[#C9822A]/25 px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-[#C9822A] animate-pulse"></span>
          <span>قريبًا</span>
        </div>

        {/* Back to jobs */}
        <div>
          <Link
            to="/jobs"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#0F6657] hover:bg-[#0c5246] text-white font-bold text-base px-6 py-3.5 rounded-[12px] transition shadow-xs"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للوظائف</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
