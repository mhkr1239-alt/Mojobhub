import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="bg-[#F7F9FC] border-b border-[#E3EEF7] sticky top-0 z-40" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Custom Wordmark + Geometric Two-Bar Mark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Simple two-bar geometric mark in --primary */}
            <div className="w-8 h-8 rounded-lg bg-[#E3EEF7] flex items-center justify-center group-hover:bg-[#E3EEF7]/80 transition-colors">
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect x="3" y="6" width="5" height="11" rx="2.5" fill="#0F4C81" />
                <rect x="12" y="3" width="5" height="14" rx="2.5" fill="#0F4C81" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl text-[#0A2540] tracking-tight leading-none">
                فرص التوظيف
              </span>
              <span className="text-[11px] text-[#5A6B7E] font-medium leading-tight mt-0.5">
                بوابة التقديم المباشر
              </span>
            </div>
          </Link>

          {/* Navigation Action */}
          <Link
            to="/jobs"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              location.pathname === '/jobs' || location.pathname.startsWith('/offers/')
                ? 'bg-[#E3EEF7] text-[#0F4C81] border border-[#0F4C81]/15'
                : 'text-[#5A6B7E] hover:text-[#0A2540] hover:bg-[#E3EEF7]/60'
            }`}
          >
            كل الوظائف
          </Link>
        </div>
      </div>
    </header>
  );
};
