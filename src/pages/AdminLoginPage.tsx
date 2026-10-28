import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { user, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already logged in, redirect to intended page or /admin
  const from = (location.state as any)?.from?.pathname || '/admin';
  if (!authLoading && user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('برجاء إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('بيانات الدخول غير صحيحة. تأكد من صحة البريد الإلكتروني وكلمة المرور.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMsg('البريد الإلكتروني لم يتم تأكيده بعد في Supabase.');
        } else {
          setErrorMsg(error.message || 'فشل تسجيل الدخول، برجاء المحاولة مرة أخرى.');
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col justify-center items-center p-4 sm:p-6" dir="rtl">
      {/* Return to public site link */}
      <div className="w-full max-w-sm mb-4 flex justify-between items-center text-xs">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[#8B98A5] hover:text-[#E6EDF2] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>العودة للرئيسية</span>
        </Link>
        <span className="text-[#8B98A5] font-mono text-[11px]">بوابة الإدارة</span>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-[#131A21] border border-[#232F3A] rounded-xl p-6 sm:p-8 shadow-2xl">
        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#1A232C] border border-[#232F3A] flex items-center justify-center text-[#1FA98A]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#E6EDF2] leading-tight">
              تسجيل الدخول للمسؤول
            </h1>
            <p className="text-xs text-[#8B98A5] mt-0.5">
              لوحة التحكم وإدارة الوظائف
            </p>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-[#E1615E]/10 border border-[#E1615E]/30 text-[#E1615E] text-xs flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold">{errorMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#E6EDF2]">
              البريد الإلكتروني <span className="text-[#E1615E]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#8B98A5]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pr-9 pl-3 py-2 bg-[#1A232C] border border-[#232F3A] focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] font-mono outline-none transition text-left"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#E6EDF2]">
              كلمة المرور <span className="text-[#E1615E]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#8B98A5]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-9 pl-3 py-2 bg-[#1A232C] border border-[#232F3A] focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] font-mono outline-none transition text-left"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#1FA98A] hover:bg-[#18886F] text-[#0B0F14] font-bold text-xs py-2.5 px-4 rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#0B0F14]/30 border-t-[#0B0F14] rounded-full animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <span>تسجيل الدخول</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-[#232F3A] text-center">
          <p className="text-[11px] text-[#8B98A5] leading-normal">
            يتم التحقق من الجلسة والصلاحيات عبر حسابات Supabase Auth الرسمية.
          </p>
        </div>
      </div>
    </div>
  );
};
