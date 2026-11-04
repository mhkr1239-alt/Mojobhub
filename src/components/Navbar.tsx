import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserName } from '../lib/accounts';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const firstName = user ? getUserName(user).split(' ')[0] : '';

  return (
    <header className="bg-[var(--c-glass)] backdrop-blur-md border-b border-[var(--c-border)] sticky top-0 z-40" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Mora Wordmark + Symbol (من ملف mora-symbol.svg الأصلي) */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <svg
              viewBox="0 0 208 128"
              className="h-8 w-[52px] shrink-0 group-hover:opacity-90 transition-opacity"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="شعار مورا"
            >
              <defs>
                <linearGradient id="moraGradNav" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#625BE7" />
                  <stop offset="0.52" stopColor="#4C83E8" />
                  <stop offset="1" stopColor="#13263F" />
                </linearGradient>
                <linearGradient id="moraTealNav" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#11A99A" />
                  <stop offset="1" stopColor="#4C83E8" />
                </linearGradient>
              </defs>
              <path
                d="M22 99 L61 35 Q69 21 78 35 L96 65 Q104 79 112 65 L130 35 Q139 21 147 35 L186 99"
                fill="none"
                stroke="url(#moraGradNav)"
                strokeWidth="17"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M82 76 Q103 91 127 59"
                fill="none"
                stroke="url(#moraTealNav)"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M104 7 L108 17 L118 21 L108 25 L104 35 L100 25 L90 21 L100 17 Z"
                fill="#F3B84B"
              />
            </svg>

            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl text-ink tracking-tight leading-none">
                مورا
              </span>
              <span className="text-[11px] text-muted font-medium leading-tight mt-0.5">
                مسارك المهني وحلولك الرقمية
              </span>
            </div>
          </Link>

          {/* Navigation Action + Account */}
          <div className="flex items-center gap-1.5">
            <Link
              to="/services"
              className={`hidden sm:inline-block px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                location.pathname.startsWith('/services')
                  ? 'bg-[var(--c-violet-soft)] text-[var(--c-violet)] border border-[var(--c-violet)]/20'
                  : 'text-muted hover:text-ink hover:bg-[var(--c-violet-soft)]/60'
              }`}
            >
              الخدمات
            </Link>

            <Link
              to="/jobs"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                location.pathname === '/jobs' || location.pathname.startsWith('/offers/')
                  ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent)] border border-[var(--c-accent)]/20'
                  : 'text-muted hover:text-ink hover:bg-[var(--c-accent-soft)]/60'
              }`}
            >
              كل الوظائف
            </Link>

            {/* حسابي / دخول */}
            {!authLoading &&
              (user ? (
                <Link
                  to="/account"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    location.pathname.startsWith('/account')
                      ? 'bg-[var(--c-accent)] text-[var(--c-on-accent)]'
                      : 'bg-[var(--c-accent-soft)] text-[var(--c-accent)] border border-[var(--c-accent)]/20 hover:opacity-85'
                  }`}
                  title="مساحتي الخاصة"
                >
                  <UserRound className="w-3.5 h-3.5" />
                  <span>{firstName || 'حسابي'}</span>
                </Link>
              ) : (
                <Link
                  to="/account/login"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    location.pathname.startsWith('/account')
                      ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent)] border border-[var(--c-accent)]/20'
                      : 'text-muted hover:text-ink hover:bg-[var(--c-accent-soft)]/60'
                  }`}
                >
                  <UserRound className="w-3.5 h-3.5" />
                  <span>دخول</span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
};
