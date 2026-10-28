import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-[#FBF9F5] border-b border-[#E7F3F0] sticky top-0 z-40" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Custom Wordmark + Geometric Two-Bar Mark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Simple two-bar geometric mark in --primary */}
            <div className="w-8 h-8 rounded-lg bg-[#E7F3F0] flex items-center justify-center group-hover:bg-[#E7F3F0]/80 transition-colors">
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect x="3" y="6" width="5" height="11" rx="2.5" fill="#0F6657" />
                <rect x="12" y="3" width="5" height="14" rx="2.5" fill="#0F6657" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl text-[#0B2B26] tracking-tight leading-none">
                فرص التوظيف
              </span>
              <span className="text-[11px] text-[#5B6B67] font-medium leading-tight mt-0.5">
                بوابة التقديم المباشر
              </span>
            </div>
          </Link>

          {/* Navigation Action */}
          <Link
            to="/"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              location.pathname === '/'
                ? 'bg-[#E7F3F0] text-[#0F6657] border border-[#0F6657]/15'
                : 'text-[#5B6B67] hover:text-[#0B2B26] hover:bg-[#E7F3F0]/60'
            }`}
          >
            كل الوظائف
          </Link>
        </div>
      </div>
    </header>
  );
};
