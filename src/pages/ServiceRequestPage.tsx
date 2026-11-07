import React, { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, Navigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Send, Loader2, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { friendlyDbError } from '../lib/friendlyError';
import {
  getServiceBySlug,
  getCategoryById,
  PACKAGE_KEY_LABELS,
  type ServicePackage,
} from '../lib/servicesCatalog';

const COUNTRIES = ['مصر', 'السعودية', 'الإمارات', 'الكويت', 'قطر', 'الأردن', 'عمان', 'دولة أخرى'];
const CONTACT_METHODS = [
  { value: 'email', label: 'البريد الإلكتروني' },
  { value: 'phone', label: 'الهاتف' },
] as const;

type Status = 'idle' | 'sending' | 'done';

export const ServiceRequestPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const service = useMemo(() => (slug ? getServiceBySlug(slug) : undefined), [slug]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('مصر');
  const [packageKey, setPackageKey] = useState<string>(() => {
    const fromUrl = searchParams.get('package');
    return fromUrl && ['basic', 'pro', 'premium'].includes(fromUrl) ? fromUrl : '';
  });
  const [extraAnswer, setExtraAnswer] = useState('');
  const [details, setDetails] = useState('');
  const [refLink, setRefLink] = useState('');
  const [contactMethod, setContactMethod] = useState<string>('email');
  const [agree, setAgree] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const cat = getCategoryById(service.categoryId)!;
  const selectedPkg: ServicePackage | undefined = service.packages.find((p) => p.key === packageKey);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'أدخل اسمك الكامل (حرفان على الأقل).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = 'أدخل بريدًا إلكترونيًا صحيحًا.';
    if (phone.trim() && !/^[+\d][\d\s\-()]{6,19}$/.test(phone.trim())) e.phone = 'أدخل رقم هاتف صحيحًا مع رمز الدولة أو اتركه فارغًا.';
    if (!packageKey) e.package = 'اختر الباقة المناسبة لك.';
    if (service.extraField && !extraAnswer.trim()) e.extra = 'هذا الحقل مهم لتنفيذ طلبك — أكمله رجاءً.';
    if (!details.trim() || details.trim().length < 20) e.details = 'اوصف مطلبك بوضوح (20 حرفًا على الأقل).';
    if (refLink.trim() && !/^https?:\/\/.+/i.test(refLink.trim())) e.refLink = 'أدخل رابطًا يبدأ بـ http أو https أو اتركه فارغًا.';
    if (!agree) e.agree = 'يجب الموافقة على سياسة الخصوصية وشروط الطلب.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setStatus('sending');
    setServerError('');

    const pkg = service.packages.find((p) => p.key === packageKey);
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      country,
      preferred_contact: contactMethod,
      service_slug: service.slug,
      service_title: service.titleAr,
      package_key: packageKey,
      package_name: pkg?.nameAr ?? null,
      extra_field_question: service.extraField?.question ?? null,
      extra_field_answer: service.extraField ? extraAnswer.trim() : null,
      details: details.trim(),
      reference_link: refLink.trim() || null,
    };

    const { data, error } = await supabase
      .from('service_requests')
      .insert(payload)
      .select('reference_code')
      .single();

    if (error) {
      console.warn('[service-request]', error.code, error.message);
      setServerError(friendlyDbError(error, 'لم نتمكن من استلام طلبك الآن. حاول مرة أخرى بعد قليل.'));
      setStatus('idle');
      return;
    }

    setReferenceCode(data?.reference_code ?? '');
    setStatus('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* الحفظ اليدوي متاح للمستخدم */
    }
  };

  // ══════════ شاشة التأكيد بعد الإرسال ══════════
  if (status === 'done') {
    return (
      <div className="band-violet min-h-full pb-16" dir="rtl">
        <div className="max-w-lg mx-auto px-4 py-14">
          <div className="glass-card rounded-[22px] p-8 text-center shadow-soft animate-pop" data-reveal>
            <CheckCircle2 className="w-14 h-14 text-[var(--c-accent)] mx-auto mb-4" strokeWidth={1.6} />
            <h1 className="text-xl font-extrabold text-ink mb-2">استلمنا طلبك بنجاح</h1>
            <p className="text-sm text-muted leading-relaxed mb-5">
              سيراجع فريق مورا طلبك ويتواصل معك عبر{' '}
              <span className="font-bold text-ink">
                {CONTACT_METHODS.find((m) => m.value === contactMethod)?.label}
              </span>{' '}
              لتأكيد النطاق النهائي والسعر والمدة قبل بدء التنفيذ.
            </p>

            {referenceCode && (
              <div className="bg-[var(--c-violet-soft)] border border-[var(--c-violet)]/25 rounded-[14px] p-4 mb-5">
                <p className="text-[11px] text-muted mb-1">احتفظ برقم مرجع طلبك:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-extrabold text-[var(--c-violet)] tracking-wider" dir="ltr">
                    {referenceCode}
                  </span>
                  <button
                    type="button"
                    onClick={copyRef}
                    aria-label="نسخ الرقم المرجعي"
                    className="p-1.5 rounded-lg text-[var(--c-violet)] hover:bg-[var(--c-violet)]/10 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <Link
                to="/services"
                className="btn-primary w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-5 py-3 rounded-[12px] transition"
              >
                <span>تصفح خدمات أخرى</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-5 py-3 rounded-[12px] transition hover:bg-white/60"
              >
                <span>الصفحة الرئيسية</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════ نموذج الطلب ══════════
  return (
    <div className="band-violet min-h-full pb-16" dir="rtl">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <nav aria-label="مسار التنقل" className="pt-6 pb-4 flex items-center gap-1.5 text-xs text-muted" data-reveal>
          <Link to="/services" className="hover:text-ink transition-colors">الخدمات</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/services/${service.slug}`} className="hover:text-ink transition-colors">{service.titleAr}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink font-bold">طلب الخدمة</span>
        </nav>

        <header className="glass-card rounded-[20px] p-5 mb-5 shadow-soft" data-reveal>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0" style={{ backgroundColor: cat.colorSoft }}>
              <img src={cat.icon} alt="" aria-hidden="true" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-ink leading-snug">{service.titleAr}</h1>
              {selectedPkg && (
                <p className="text-xs text-muted mt-0.5">
                  الباقة المختارة: <span className="font-bold text-ink">{selectedPkg.nameAr}</span>
                  {selectedPkg.amountUsd && !selectedPkg.pricingType.startsWith('quote') && (
                    <> — <span className="font-bold">{selectedPkg.amountUsd}$</span></>
                  )}
                </p>
              )}
            </div>
          </div>
        </header>

        {serverError && (
          <div role="alert" className="bg-[var(--c-danger)]/8 border border-[var(--c-danger)]/30 text-[var(--c-danger)] rounded-[12px] p-3.5 text-xs font-bold mb-4" data-reveal>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4" data-reveal>
          {/* الاسم */}
          <Field label="الاسم الكامل" error={errors.name} required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك كما تحب أن نناديك"
              className={inputCls(errors.name)}
              autoComplete="name"
            />
          </Field>

          {/* البريد + الهاتف */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="البريد الإلكتروني" error={errors.email} required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className={inputCls(errors.email) + ' text-left'}
                autoComplete="email"
              />
            </Field>
            <Field label="رقم الهاتف (اختياري)" error={errors.phone}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 1XX XXX XXXX"
                dir="ltr"
                className={inputCls(errors.phone) + ' text-left'}
                autoComplete="tel"
              />
            </Field>
          </div>

          {/* البلد + التواصل المفضل */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="البلد">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls()}>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="طريقة التواصل المفضلة">
              <select value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} className={inputCls()}>
                {CONTACT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* الباقة */}
          <Field label="الباقة المطلوبة" error={errors.package} required>
            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="اختيار الباقة">
              {service.packages.map((pkg) => (
                <label
                  key={pkg.key}
                  className={`flex items-center justify-between gap-3 glass-card rounded-[12px] px-4 py-3 cursor-pointer border transition ${
                    packageKey === pkg.key
                      ? 'border-[var(--c-violet)] ring-1 ring-[var(--c-violet)]/40'
                      : 'border-[var(--c-border)] hover:border-[var(--c-violet)]/40'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="radio"
                      name="package"
                      value={pkg.key}
                      checked={packageKey === pkg.key}
                      onChange={() => setPackageKey(pkg.key)}
                      className="accent-[var(--c-violet)] w-4 h-4 shrink-0"
                    />
                    <span className="text-sm font-bold text-ink truncate">{pkg.nameAr}</span>
                    <span className="text-[10px] text-muted shrink-0 hidden sm:inline">({PACKAGE_KEY_LABELS[pkg.key]})</span>
                  </span>
                  <span className="text-xs font-extrabold text-ink shrink-0">
                    {pkg.pricingType === 'quote_required'
                      ? 'عرض سعر'
                      : pkg.pricingType === 'starting_at'
                      ? `من ${pkg.amountUsd}$`
                      : `${pkg.amountUsd}$`}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          {/* الحقل الديناميكي الخاص بالخدمة */}
          {service.extraField && (
            <Field label={service.extraField.question} error={errors.extra} required>
              <input
                type="text"
                value={extraAnswer}
                onChange={(e) => setExtraAnswer(e.target.value)}
                placeholder={service.extraField.placeholder}
                className={inputCls(errors.extra)}
              />
            </Field>
          )}

          {/* وصف المطلوب */}
          <Field label="وصف المطلوب" error={errors.details} required hint="اكتب ما تريده بالتفصيل: النطاق، أي مواعيد نهائية، وأي ملاحظات مهمة.">
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="مثال: أريد سيرة ذاتية إنجليزية لوظيفة محاسب في شركة استيراد، خبرة 3 سنوات…"
              className={inputCls(errors.details) + ' resize-y min-h-[100px]'}
            />
          </Field>

          {/* رابط مرجعي */}
          <Field label="رابط مرجعي أو ملفات (اختياري)" error={errors.refLink} hint="رابط سيرتك أو ملفاتك على Google Drive / Dropbox — الرفع المباشر قادم في مرحلة قادمة.">
            <input
              type="url"
              value={refLink}
              onChange={(e) => setRefLink(e.target.value)}
              placeholder="https://…"
              dir="ltr"
              className={inputCls(errors.refLink) + ' text-left'}
            />
          </Field>

          {/* الموافقة */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="accent-[var(--c-accent)] w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="text-xs text-muted leading-relaxed">
                أوافق على{' '}
                <Link to="/privacy" className="text-[var(--c-accent-soft-foreground)] font-bold underline underline-offset-2">
                  سياسة الخصوصية
                </Link>{' '}
                وشروط طلب الخدمة: السعر النهائي يُعتمد بعد المراجعة، وعدد التعديلات وفق الباقة المختارة.
              </span>
            </label>
            {errors.agree && <p className="text-[11px] text-[var(--c-danger)] font-bold mt-1.5">{errors.agree}</p>}
          </div>

          {/* زر الإرسال */}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-6 py-3.5 rounded-[12px] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {status === 'sending' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ إرسال طلبك…</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>إرسال الطلب</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-muted/80 text-center leading-relaxed">
            لن يصلك أي إعلان أو رسائل غير متعلقة بطلبك — بياناتك تُستخدم لتنفيذ هذا الطلب فقط.
          </p>
        </form>
      </div>
    </div>
  );
};

// ─── مكونات مساعدة ───

const inputCls = (hasError?: string) =>
  `w-full glass-card rounded-[12px] px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-[var(--c-violet)]/40 border ${
    hasError ? 'border-[var(--c-danger)]' : 'border-[var(--c-border)]'
  }`;

const Field: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, error, required, hint, children }) => (
  <div>
    <label className="block text-xs font-bold text-ink mb-1.5">
      {label}
      {required && <span className="text-[var(--c-danger)]"> *</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-muted/75 mt-1.5 leading-relaxed">{hint}</p>}
    {error && <p className="text-[11px] text-[var(--c-danger)] font-bold mt-1.5">{error}</p>}
  </div>
);
