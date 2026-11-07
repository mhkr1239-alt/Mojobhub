import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Mail, MessageCircle, RefreshCcw, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendLoginOtp, verifyLoginOtp } from '../lib/accounts';

/**
 * الدخول / إنشاء حساب — خطوتان:
 * 1) الاسم + البريد (+ واتساب اختياري للتعبئة التلقائية) → إرسال رمز للبريد
 * 2) الرمز المكوّن من 6 أرقام → جلسة مسجلة
 * بلا كلمة مرور — الرمز يثبت ملكية البريد.
 */
export const AccountLoginPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<'identity' | 'code'>('identity');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [code, setCode] = useState('');

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string>('');
  const [cooldown, setCooldown] = useState(0);

  // عدّاد إعادة الإرسال
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!authLoading && user) {
    return <Navigate to="/account" replace />;
  }

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('اكتب اسمك كاملًا عشان نبعتلك رمز التحقق.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('اكتب بريدًا إلكترونيًا صحيحًا (مثال: name@gmail.com).');
      return;
    }

    setSending(true);
    const { error: sendError } = await sendLoginOtp({
      name,
      email,
      whatsapp: whatsapp.trim() || undefined,
    });
    setSending(false);

    if (sendError) {
      setError(sendError);
      return;
    }
    setSentTo(email.trim());
    setStep('code');
    setCooldown(60);
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const clean = code.replace(/\D/g, '');
    if (clean.length < 4) {
      setError('اكتب رمز التحقق المكوّن من 6 أرقام الوارد في بريدك.');
      return;
    }

    setVerifying(true);
    const { error: verifyError } = await verifyLoginOtp(sentTo, clean);
    setVerifying(false);

    if (verifyError) {
      setError(verifyError);
      return;
    }
    // بعد النجاح: العودة للمسار المطلوب (أو مساحتي)
    navigate('/account', { replace: true });
  };

  const locationState = (location.state || {}) as { ref?: string; whatsapp?: string };

  return (
    <div className="max-w-md mx-auto px-4 py-10 pb-20" dir="rtl">
      {/* رأس الصفحة */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-[16px] bg-[var(--c-accent-soft)] border border-[var(--c-accent)]/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-[var(--c-accent-soft-foreground)]" />
        </div>
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">
          {step === 'identity' ? 'حسابك في مورا' : 'أدخل رمز التحقق'}
        </h1>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">
          {step === 'identity'
            ? 'حساب واحد لمتابعة طلباتك وبياناتك — بلا كلمة مرور.'
            : `أرسلنا رمزًا مكوّنًا من 6 أرقام إلى ${sentTo} — افحص بريدك وصندوق الرسائل غير المرغوبة.`}
        </p>
      </div>

      {/* مؤشر الخطوات */}
      <div className="flex items-center justify-center gap-2 mb-6" aria-hidden="true">
        {['identity', 'code'].map((s, i) => (
          <React.Fragment key={s}>
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                step === s ? 'bg-[var(--c-accent)] scale-110' : 'bg-[var(--c-border)]'
              }`}
            ></span>
            {i === 0 && <span className="w-8 h-0.5 rounded-full bg-[var(--c-border)]"></span>}
          </React.Fragment>
        ))}
      </div>

      <div className="glass-card rounded-[20px] p-6 sm:p-7">
        {/* ربط طلب سابق من شاشة النجاح؟ */}
        {step === 'identity' && (locationState.ref || locationState.whatsapp) && (
          <div className="mb-5 p-3 rounded-[12px] bg-[var(--c-accent-soft)]/50 border border-[var(--c-accent)]/20 text-xs text-muted leading-relaxed">
            <span className="font-bold text-ink">خلينا نربط طلبك بحسابك.</span> أنشئ حسابك أولًا،
            وبعد الدخول اكتب الرقم المرجعي{' '}
            <span className="font-mono font-bold text-[var(--c-accent-soft-foreground)]" dir="ltr">
              {locationState.ref}
            </span>{' '}
            في صفحة «مساحتي» وهنكمله.
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 rounded-[12px] bg-[var(--c-danger)]/10 border border-[var(--c-danger)]/25 text-xs sm:text-sm text-[var(--c-danger)] font-medium leading-relaxed">
            {error}
          </div>
        )}

        {step === 'identity' ? (
          <form onSubmit={handleSendCode} className="space-y-4" noValidate>
            {/* الاسم */}
            <div>
              <label htmlFor="acc-name" className="block text-xs font-bold text-ink mb-1.5">
                الاسم <span className="text-[var(--c-danger)]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
                  <UserIcon className="w-[18px] h-[18px]" />
                </div>
                <input
                  id="acc-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اكتب اسمك"
                  autoComplete="name"
                  className="w-full pr-10 pl-3.5 py-3 bg-white/70 border border-[var(--c-border)] rounded-[12px] text-sm text-ink placeholder-[var(--c-muted)] focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition-all"
                />
              </div>
            </div>

            {/* البريد */}
            <div>
              <label htmlFor="acc-email" className="block text-xs font-bold text-ink mb-1.5">
                البريد الإلكتروني <span className="text-[var(--c-danger)]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input
                  id="acc-email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  autoComplete="email"
                  dir="ltr"
                  className="w-full pr-10 pl-3.5 py-3 bg-white/70 border border-[var(--c-border)] rounded-[12px] text-sm text-ink placeholder-[var(--c-muted)] text-left focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition-all"
                />
              </div>
            </div>

            {/* واتساب (اختياري) */}
            <div>
              <label htmlFor="acc-wa" className="block text-xs font-bold text-ink mb-1.5">
                رقم واتساب <span className="text-muted font-medium">(اختياري)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-muted">
                  <MessageCircle className="w-[18px] h-[18px]" />
                </div>
                <input
                  id="acc-wa"
                  type="tel"
                  inputMode="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  autoComplete="tel"
                  dir="ltr"
                  className="w-full pr-10 pl-3.5 py-3 bg-white/70 border border-[var(--c-border)] rounded-[12px] text-sm text-ink placeholder-[var(--c-muted)] text-left focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition-all"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted leading-relaxed">
                لو كتبته هنستخدمه لتعبئة طلباتك تلقائيًا وربط طلباتك القديمة بحسابك.
              </p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-3.5 rounded-[14px] transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {sending ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>جاري إرسال الرمز...</span>
                </>
              ) : (
                <>
                  <span>إرسال رمز التحقق</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4" noValidate>
            <div>
              <label htmlFor="acc-code" className="block text-xs font-bold text-ink mb-1.5">
                رمز التحقق
              </label>
              <input
                id="acc-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                placeholder="••••••"
                dir="ltr"
                className="w-full px-4 py-4 bg-white/70 border border-[var(--c-border)] rounded-[14px] text-lg font-bold tracking-[0.5em] text-center text-ink placeholder-[var(--c-muted)] focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-6 py-3.5 rounded-[14px] transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {verifying ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <span>تأكيد الدخول</span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('identity');
                  setError(null);
                  setCode('');
                }}
                className="text-muted hover:text-ink font-semibold transition-colors"
              >
                تعديل البريد أو الاسم
              </button>
              <button
                type="button"
                disabled={cooldown > 0 || sending}
                onClick={() => handleSendCode()}
                className="text-[var(--c-accent-soft-foreground)] hover:underline font-bold disabled:opacity-50 disabled:no-underline transition-all active:scale-95"
              >
                {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="mt-5 text-center text-[11px] text-muted leading-relaxed px-4">
        بإنشاء حسابك أنت توافق على استخدام بياناتك لأغراض التوظيف فقط وفقًا لـ
        <Link
          to="/privacy"
          className="text-[var(--c-accent-soft-foreground)] font-bold underline underline-offset-2"
        >
          {' '}سياسة الخصوصية
        </Link>
        .
      </p>
    </div>
  );
};
