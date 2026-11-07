import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRound, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserName } from '../lib/accounts';
import { BrandSymbol } from './BrandLogo';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const firstName = user ? getUserName(user).split(' ')[0] : '';
  const [menuOpen, setMenuOpen] = useState(false);

  // إغلاق القائمة عند الانتقال إلى مسار جديد (WP-2.3)
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // إغلاق القائمة بزر Escape (WP-2.3)
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const navLinkClass = (active: boolean) =>
    `block px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
      active
        ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent-soft-foreground)]'
        : 'text-ink hover:bg-[var(--c-accent-soft)]/50'
    }`;

  return (
    <header className="bg-[var(--c-glass)] backdrop-blur-md border-b border-[var(--c-border)] sticky top-0 z-40" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Mora Wordmark + Symbol (من ملف mora-symbol.svg الأصلي) */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* WP-2.5: المصدر الوحيد للشعار public/brand/mora-symbol.svg — بلا paths يدوية */}
            <BrandSymbol
              size={32}
              alt=""
              className="shrink-0 group-hover:opacity-90 transition-opacity"
            />

            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl text-ink tracking-tight leading-none">
                مورا
              </span>
              <span className="text-[11px] text-muted font-medium leading-tight mt-0.5">
                مسارك المهني وحلولك الرقمية
              </span>
            </div>
          </Link>

          {/* Navigation Action + Account (desktop) */}
          <div className="flex items-center gap-1.5">
            <Link
              to="/services"
              className={`hidden sm:inline-block px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                location.pathname.startsWith('/services')
                  ? 'bg-[var(--c-violet-soft)] text-[var(--c-violet-soft-foreground)] border border-[var(--c-violet)]/20'
                  : 'text-muted hover:text-ink hover:bg-[var(--c-violet-soft)]/60'
              }`}
            >
              الخدمات
            </Link>

            <Link
              to="/jobs"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                location.pathname === '/jobs' || location.pathname.startsWith('/offers/')
                  ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent-soft-foreground)] border border-[var(--c-accent)]/20'
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
                      : 'bg-[var(--c-accent-soft)] text-[var(--c-accent-soft-foreground)] border border-[var(--c-accent)]/20 hover:opacity-85'
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
                      ? 'bg-[var(--c-accent-soft)] text-[var(--c-accent-soft-foreground)] border border-[var(--c-accent)]/20'
                      : 'text-muted hover:text-ink hover:bg-[var(--c-accent-soft)]/60'
                  }`}
                >
                  <UserRound className="w-3.5 h-3.5" />
                  <span>دخول</span>
                </Link>
              ))}

            {/* زر قائمة الجوال (WP-2.3) — <640px، هدف لمس ≥44px */}
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-ink hover:bg-[var(--c-accent-soft)]/60 transition-colors"
              aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الجوال (WP-2.3) — قائمة منسدلة بسيطة: بلا احتجاز تركيز ولا modal */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="قائمة التصفح للجوال"
          className="sm:hidden border-t border-[var(--c-border)] bg-[var(--c-bg)] shadow-soft"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
            <Link to="/" className={navLinkClass(location.pathname === '/')}>
              الرئيسية
            </Link>
            <Link to="/services" className={navLinkClass(location.pathname.startsWith('/services'))}>
              الخدمات
            </Link>
            <Link
              to="/jobs"
              className={navLinkClass(location.pathname === '/jobs' || location.pathname.startsWith('/offers/'))}
            >
              كل الوظائف
            </Link>
            {!authLoading &&
              (user ? (
                <Link to="/account" className={navLinkClass(location.pathname.startsWith('/account'))}>
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="w-4 h-4" />
                    حسابي{firstName ? ` — ${firstName}` : ''}
                  </span>
                </Link>
              ) : (
                <Link to="/account/login" className={navLinkClass(location.pathname.startsWith('/account'))}>
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="w-4 h-4" />
                    دخول / إنشاء حساب
                  </span>
                </Link>
              ))}
            <Link
              to="/services"
              className="btn-primary mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold"
            >
              اطلب خدمة
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};
