/**
 * المسار الوحيد لتسجيل وإدارة Service Worker الخاص بلوحة الإدارة (WP-2.2).
 *
 * - النطاق الرسمي: /admin/ — حصر PWA في الإدارة فقط؛ الصفحات العامة بلا عامل.
 * - الترحيل: أي تسجيل قديم لنفس السكربت نطاقه أوسع من /admin/ (مثل "/") يُلغى
 *   مرة واحدة عند أول دخول إداري بعد الإصلاح. لا يُمس أي تسجيل آخر.
 * - لا تخزين ولا اعتراض طلبات: السكربت نفسه push + fetch pass-through (لم يُغيّر).
 * - الفشل لا يكسر صفحة الإدارة: console.warn آمن بلا بيانات حساسة ولا رمي استثناءات.
 */

const SW_URL = '/service-worker.js';
const ADMIN_SCOPE = '/admin/';

let pendingSetup: Promise<ServiceWorkerRegistration | null> | null = null;

function scriptUrlOf(reg: ServiceWorkerRegistration): string | null {
  return reg.active?.scriptURL ?? reg.waiting?.scriptURL ?? reg.installing?.scriptURL ?? null;
}

/**
 * إلغاء التسجيلات القديمة المطابقة حصرًا:
 * نفس الأصل + scriptURL ينتهي بـ /service-worker.js + نطاق أوسع من /admin/.
 * ملاحظة موثقة: unregister() لا ينتزع التحكم من التبويبات المفتوحة فورًا —
 * تزول السيطرة القديمة بعد إعادة التحميل أو إغلاق التبويب.
 */
async function migrateLegacyRegistrations(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs.map(async (reg) => {
        const url = scriptUrlOf(reg);
        if (!url) return;

        let sameOrigin = false;
        let isMoraSw = false;
        let broaderThanAdmin = false;
        try {
          sameOrigin = new URL(url, window.location.href).origin === window.location.origin;
          isMoraSw = new URL(url, window.location.href).pathname === SW_URL;
          broaderThanAdmin = !new URL(reg.scope, window.location.href).pathname.startsWith(ADMIN_SCOPE);
        } catch {
          return;
        }

        if (sameOrigin && isMoraSw && broaderThanAdmin) {
          try {
            const removed = await reg.unregister();
            console.warn(
              `[admin-sw] legacy registration migrated (scope=${reg.scope}, removed=${removed})`
            );
          } catch (err) {
            console.warn('[admin-sw] failed to unregister legacy registration:', err);
          }
        }
      })
    );
  } catch (err) {
    console.warn('[admin-sw] legacy migration scan failed:', err);
  }
}

/**
 * التسجيل الموحد بنطاق /admin/ — single-flight على مستوى الوحدة
 * يمنع التسجيل المزدوج من AdminPwaSetup وAdminPushNotificationOptIn معًا.
 * عند الفشل يُصفَّر الوعد ليسمح بمحاولة لاحقة.
 */
export async function setupAdminServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  if (pendingSetup) return pendingSetup;

  pendingSetup = (async () => {
    try {
      await migrateLegacyRegistrations();
      // نطاق أضيق من دليل السكربت — مسموح بلا ترويسة Service-Worker-Allowed.
      return await navigator.serviceWorker.register(SW_URL, { scope: ADMIN_SCOPE });
    } catch (err) {
      console.warn('[admin-sw] admin service worker setup failed:', err);
      pendingSetup = null; // السماح بمحاولة لاحقة
      return null;
    }
  })();

  return pendingSetup;
}

/**
 * استعلام تسجيل الإدارة بالنطاق (لا بمسار الملف) —
 * getRegistration يطابق وسيطه ضد النطاق، ولذا كان الاستعلام القديم
 * بـ '/service-worker.js' سيفقد التسجيل بعد تضييق النطاق.
 */
export async function getAdminRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  try {
    return await navigator.serviceWorker.getRegistration(ADMIN_SCOPE);
  } catch (err) {
    console.warn('[admin-sw] registration lookup failed:', err);
    return undefined;
  }
}
