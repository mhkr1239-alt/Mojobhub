// تحويل أخطاء Supabase/Postgres الإنجليزية إلى رسائل عربية مفهومة.
// أي رسالة غير معروفة تعيد النص العربي الاحتياطي الممرَّر —
// لا يتسرب نص إنجليزي إلى الواجهة أبدًا (الأصل يُطبع في console للتشخيص).

const KNOWN: Array<{ test: RegExp; ar: string }> = [
  { test: /invalid login credentials/i, ar: 'بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.' },
  { test: /email not confirmed/i, ar: 'البريد الإلكتروني لم يتم تأكيده بعد.' },
  { test: /user not found|user from sub claim/i, ar: 'الحساب غير موجود.' },
  { test: /too many requests|rate limit/i, ar: 'محاولات كثيرة جدًا، برجاء الانتظار قليلًا ثم إعادة المحاولة.' },
  { test: /jwt expired|invalid jwt|token expired/i, ar: 'انتهت صلاحية الجلسة، سجّل الدخول من جديد.' },
  { test: /failed to fetch|networkerror|network error|load failed|fetch failed/i, ar: 'مشكلة في الاتصال بالإنترنت، تحقق من الشبكة وحاول مجددًا.' },
  { test: /row-level security|permission denied/i, ar: 'لا تمتلك صلاحية تنفيذ هذا الإجراء.' },
  { test: /duplicate key|unique constraint/i, ar: 'هذه البيانات مسجلة بالفعل (تعارض تكرار).' },
  { test: /foreign key/i, ar: 'لا يمكن تنفيذ العملية لارتباط البيانات بسجلات أخرى.' },
  { test: /invalid input syntax/i, ar: 'صيغة إحدى البيانات المدخلة غير صحيحة.' },
  { test: /password should be/i, ar: 'كلمة المرور أقصر من الحد المسموح به.' },
  { test: /signups not allowed/i, ar: 'إنشاء الحسابات معطّل حاليًا.' },
  { test: /schema cache|could not find the table|relation .* does not exist/i, ar: 'خدمة قاعدة البيانات غير مهيأة لهذه العملية حاليًا.' },
];

export function friendlyDbError(
  err?: { message?: string; code?: string } | null,
  fallback = 'حدث خطأ غير متوقع، حاول مرة أخرى.'
): string {
  const raw = String(err?.message || '').trim();
  const code = String(err?.code || '');
  if (raw) console.warn('[db-error]', code, raw);
  if (code === '23505') return 'هذه البيانات مسجلة بالفعل (تعارض تكرار).';
  if (code === '42501') return 'لا تمتلك صلاحية تنفيذ هذا الإجراء.';
  if (code === '23503') return 'لا يمكن تنفيذ العملية لارتباط البيانات بسجلات أخرى.';
  if (!raw) return fallback;
  for (const k of KNOWN) if (k.test.test(raw)) return k.ar;
  return fallback;
}
