import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * بوابة الإدارة — مقيّدة بحساب يحمل علم is_admin في app_metadata
 * (يُضبط عبر سكربت supabase/sql/user_accounts.sql — الخطوة 1).
 * جلسة المتقدمين العادية لا تكفي للدخول.
 */
export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center justify-center text-[#E6EDF2]" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1FA98A]/20 border-t-[#1FA98A] rounded-full animate-spin" />
          <span className="text-xs text-[#8B98A5] font-mono">جاري التحقق من جلسة المسؤول...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // جلسة مسجلة لكن بدون علم المسؤول — وصول مرفوض
  if (user.app_metadata?.is_admin !== true) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center px-4 text-[#E6EDF2]" dir="rtl">
        <div className="w-full max-w-sm bg-[#131A21] border border-[#232F3A] rounded-[20px] p-7 text-center">
          <div className="w-14 h-14 rounded-full bg-[#E1615E]/15 border border-[#E1615E]/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-[#E1615E]" />
          </div>
          <h1 className="text-lg font-extrabold mb-2">هذه المساحة للمسؤولين فقط</h1>
          <p className="text-xs text-[#8B98A5] leading-relaxed mb-1">
            الحساب الحالي ({user.email}) ليس حساب مسؤول.
          </p>
          <p className="text-[11px] text-[#8B98A5]/80 leading-relaxed mb-6">
            لو أنت المسؤول: افتح ملف <span className="font-mono">supabase/sql/user_accounts.sql</span>{' '}
            وشغّله في لوحة Supabase مع وضع بريدك مكان <span className="font-mono">ADMIN_EMAIL_HERE</span>،
            ثم أعد تسجيل الدخول.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={async () => {
                await signOut();
              }}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1FA98A] text-[#0B0F14] font-bold text-sm px-4 py-2.5 rounded-[12px] hover:opacity-90 transition active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج والدخول بحساب المسؤول</span>
            </button>
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 border border-[#232F3A] text-[#8B98A5] hover:text-[#E6EDF2] font-bold text-sm px-4 py-2.5 rounded-[12px] transition active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              <span>العودة إلى الموقع</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
