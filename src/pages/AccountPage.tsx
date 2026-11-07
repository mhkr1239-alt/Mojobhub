import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  Check,
  Copy,
  FileText,
  Link2,
  LogOut,
  Mail,
  MessageCircle,
  RefreshCcw,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyApplications,
  getUserName,
  getUserEmail,
  getUserWhatsapp,
  linkMyApplication,
  MyApplication,
} from '../lib/accounts';
import { getStatusMeta } from '../lib/applicationUtils';

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * «مساحتي» — صفحة خاصة لصاحب الحساب فقط:
 * طلباته المرتبطة + ربط طلب سابق بالرقم المرجعي + خروج.
 */
export const AccountPage: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const location = useLocation();

  const [apps, setApps] = useState<MyApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsNotSetUp, setAppsNotSetUp] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  // ربط طلب سابق
  const handoff = (location.state || {}) as { ref?: string; whatsapp?: string };
  const [linkOpen, setLinkOpen] = useState(Boolean(handoff.ref));
  const [refInput, setRefInput] = useState(handoff.ref || '');
  const [waInput, setWaInput] = useState(handoff.whatsapp || '');
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkNotSetUp, setLinkNotSetUp] = useState(false);
  const [linkJustOk, setLinkJustOk] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadApps = useCallback(async () => {
    setAppsLoading(true);
    setAppsError(null);
    const res = await fetchMyApplications();
    setAppsNotSetUp(Boolean(res.notSetUp));
    setApps(res.data || []);
    if (res.error) setAppsError(res.error);
    setAppsLoading(false);
  }, []);

  useEffect(() => {
    if (user) loadApps();
  }, [user, loadApps]);

  if (!authLoading && !user) {
    return <Navigate to="/account/login" replace />;
  }
  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center" dir="rtl">
        <div className="w-8 h-8 border-2 border-[var(--c-accent)]/20 border-t-[var(--c-accent)] rounded-full animate-spin mx-auto" />
        <p className="mt-3 text-xs text-muted font-semibold">جاري تحميل مساحتك...</p>
      </div>
    );
  }

  const displayName = getUserName(user) || 'صاحب الحساب';
  const displayEmail = getUserEmail(user);
  const displayWa = getUserWhatsapp(user);
  const firstLetter = displayName.trim().charAt(0) || 'م';

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    setLinkJustOk(false);
    setLinkBusy(true);
    const res = await linkMyApplication(refInput, waInput);
    setLinkBusy(false);
    if (res.error) {
      setLinkError(res.error);
      setLinkNotSetUp(Boolean(res.notSetUp));
      return;
    }
    setLinkJustOk(true);
    setRefInput('');
    setWaInput('');
    loadApps();
  };

  const copyRef = async (id: string, code?: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="min-h-full pb-16" dir="rtl">
      {/* رأس المساحة — شريط أزرق هادئ */}
      <section className="band-soft w-full border-b border-[var(--c-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 rounded-[18px] bg-gradient-to-bl from-[var(--c-accent)] to-[var(--c-sky)] text-[var(--c-on-accent)] flex items-center justify-center text-2xl font-black shrink-0 shadow-soft">
              {firstLetter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-[var(--c-accent-soft-foreground)] tracking-wide mb-0.5">
                مساحتك الخاصة
              </div>
              <h1 className="text-2xl font-extrabold text-ink tracking-tight truncate">
                أهلاً، {displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span dir="ltr">{displayEmail}</span>
                </span>
                {displayWa && (
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span dir="ltr">{displayWa}</span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await signOut();
              }}
              className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] border border-[var(--c-border)] bg-white/60 text-xs font-bold text-muted hover:text-[var(--c-danger)] hover:border-[var(--c-danger)]/30 transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* ── طلباتي ── */}
        <div data-reveal className="reveal">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--c-accent)]" />
              طلباتي
            </h2>
            <span className="text-xs font-bold text-muted bg-[var(--c-accent-soft)] px-2.5 py-1 rounded-full">
              {appsLoading ? '…' : apps.length}
            </span>
          </div>

          {/* الخدمة لم تُفعّل بعد (قبل تشغيل SQL) */}
          {appsNotSetUp && (
            <div className="p-4 rounded-[16px] bg-[var(--c-warn)]/10 border border-[var(--c-warn)]/25 text-xs sm:text-sm text-[var(--c-warn-strong)] font-medium leading-relaxed">
              خدمة متابعة الطلبات لم تُفعّل على قاعدة البيانات بعد. الحساب يعمل، وهذه الخصية
              ستظهر تلقائيًا بعد تشغيل سكربت SQL الخاص بالحسابات.
            </div>
          )}

          {appsError && !appsNotSetUp && (
            <div className="p-4 rounded-[16px] bg-[var(--c-danger)]/10 border border-[var(--c-danger)]/25 text-xs sm:text-sm text-[var(--c-danger)] font-medium">
              {appsError}
            </div>
          )}

          {appsLoading && !appsNotSetUp && (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="glass-card rounded-[16px] p-5 animate-pulse space-y-3">
                  <div className="h-5 bg-[var(--c-border)] rounded w-2/3"></div>
                  <div className="h-4 bg-[var(--c-border)] rounded w-1/3"></div>
                </div>
              ))}
            </div>
          )}

          {/* فارغ */}
          {!appsLoading && !appsNotSetUp && !appsError && apps.length === 0 && (
            <div className="glass-card rounded-[16px] p-8 text-center">
              <Briefcase className="w-10 h-10 text-muted opacity-40 mx-auto mb-3" />
              <h3 className="text-base font-bold text-ink">لا توجد طلبات في مساحتك بعد</h3>
              <p className="text-sm text-muted mt-1 mb-5 leading-relaxed">
                قدّم على وظيفة وسيظهر طلبك هنا تلقائيًا، أو اربط طلبًا قديمًا برقمه المرجعي.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Link
                  to="/jobs"
                  className="btn-primary inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-2.5 rounded-[12px] transition-all active:scale-95"
                >
                  <span>تصفّح الوظائف</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setLinkOpen(true)}
                  className="btn-secondary inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-2.5 rounded-[12px] transition-all active:scale-95 hover:text-ink"
                >
                  <Link2 className="w-4 h-4" />
                  <span>ربط طلب سابق</span>
                </button>
              </div>
            </div>
          )}

          {/* الطلبات */}
          {!appsLoading && apps.length > 0 && (
            <div className="space-y-3">
              {apps.map((app, index) => {
                const meta = getStatusMeta(app.status);
                const refCode = app.app_data?.reference_code || '';
                const date = formatDate(app.app_data?.consented_at);
                return (
                  <div
                    key={app.id}
                    data-reveal
                    className="reveal glass-card rounded-[16px] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-ink leading-snug truncate">
                          {app.offer_title || 'وظيفة'}
                        </h3>
                        <p className="text-xs text-muted font-medium mt-0.5 truncate">
                          {app.company_name || '—'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${meta.bgColor} ${meta.textColor} ${meta.borderColor}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-[var(--c-border)] text-[11px] sm:text-xs">
                      {refCode && (
                        <span className="inline-flex items-center gap-1.5 text-muted font-medium">
                          <span className="text-[var(--c-muted)]">الرقم المرجعي:</span>
                          <span className="font-mono font-bold text-[var(--c-accent-soft-foreground)]" dir="ltr">
                            {refCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyRef(app.id, refCode)}
                            title="نسخ الرقم المرجعي"
                            className="text-muted hover:text-[var(--c-accent)] transition-colors active:scale-90"
                          >
                            {copiedId === app.id ? (
                              <Check className="w-3.5 h-3.5 text-[var(--c-success)]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </span>
                      )}
                      {date && (
                        <span className="text-muted">
                          أُرسل: <span className="font-semibold text-ink">{date}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── ربط طلب سابق ── */}
        <div data-reveal className="reveal mt-8">
          <div className="glass-card rounded-[16px] overflow-hidden">
            <button
              type="button"
              onClick={() => setLinkOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-3 p-5 text-right transition-colors hover:bg-[var(--c-accent-soft)]/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--c-accent-soft)] border border-[var(--c-accent)]/20 flex items-center justify-center shrink-0">
                  <Link2 className="w-[18px] h-[18px] text-[var(--c-accent)]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-ink">ربط طلب سابق بحسابك</h3>
                  <p className="text-xs text-muted mt-0.5">
                    قدّمت كزائر؟ اربط طلبك بمطابقة الرقم المرجعي ورقم الواتساب معًا.
                  </p>
                </div>
              </div>
              <span
                className={`text-muted transition-transform duration-300 ${linkOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>

            {linkOpen && (
              <form onSubmit={handleLink} className="px-5 pb-5 space-y-3.5" noValidate>
                {linkJustOk && (
                  <div className="p-3 rounded-[12px] bg-[var(--c-success)]/10 border border-[var(--c-success)]/25 text-xs font-bold text-[var(--c-success)]">
                    تم ربط الطلب بحسابك — ظهر في قائمة «طلباتي» أعلاه.
                  </div>
                )}
                {linkError && (
                  <div className="p-3 rounded-[12px] bg-[var(--c-danger)]/10 border border-[var(--c-danger)]/25 text-xs font-medium text-[var(--c-danger)] leading-relaxed">
                    {linkError}
                  </div>
                )}
                {linkNotSetUp && (
                  <p className="text-[11px] text-[var(--c-warn-strong)] font-medium leading-relaxed">
                    ملاحظة: هذه الخصية تحتاج تشغيل سكربت SQL الخاص بالحسابات على قاعدة البيانات.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="link-ref" className="block text-xs font-bold text-ink mb-1.5">
                      الرقم المرجعي
                    </label>
                    <input
                      id="link-ref"
                      type="text"
                      value={refInput}
                      onChange={(e) => setRefInput(e.target.value)}
                      placeholder="JHM-XXXXXX"
                      dir="ltr"
                      className="w-full px-3.5 py-3 bg-white/70 border border-[var(--c-border)] rounded-[12px] text-sm text-ink placeholder-[var(--c-muted)] text-left font-mono focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="link-wa" className="block text-xs font-bold text-ink mb-1.5">
                      رقم واتساب نفس الطلب
                    </label>
                    <input
                      id="link-wa"
                      type="tel"
                      inputMode="tel"
                      value={waInput}
                      onChange={(e) => setWaInput(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                      className="w-full px-3.5 py-3 bg-white/70 border border-[var(--c-border)] rounded-[12px] text-sm text-ink placeholder-[var(--c-muted)] text-left focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/15 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={linkBusy}
                  className="btn-primary inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-2.5 rounded-[12px] transition-all active:scale-95 disabled:opacity-60"
                >
                  {linkBusy ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      <span>جاري الربط...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>ربط الطلب</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ملاحظة خصوصية */}
        <div data-reveal className="reveal mt-6 p-4 rounded-[16px] bg-[var(--c-accent-soft)]/40 border border-[var(--c-border)] flex items-start gap-3">
          <div className="rounded-full bg-white/70 border border-[var(--c-border)] p-2 shrink-0">
            <UserIcon className="w-4 h-4 text-muted opacity-70" />
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            مساحتك خاصة بك — طلباتك وبياناتك لا يراها أحد غيرك وإدارة التوظيف المُخوّلة فقط،
            وفقًا لـ
            <Link
              to="/privacy"
              className="text-[var(--c-accent-soft-foreground)] font-bold underline underline-offset-2 hover:text-[var(--c-accent-hover)] transition-colors"
            >
              سياسة الخصوصية
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

