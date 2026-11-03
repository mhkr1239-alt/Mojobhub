import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { normalizeEgyptPhone } from './applicationUtils';

// ═══════════════════════════════════════════════════════════════════
//  مساعدات الحسابات: دخول بالاسم + بريد عبر رمز تحقق OTP (بدون كلمة مرور)
//  + ربط الطلبات السابقة بالحساب + قراءة طلبات المستخدم فقط.
// ═══════════════════════════════════════════════════════════════════

export interface MyApplication {
  id: string;
  offer_id: string | null;
  status: string;
  candidate_whatsapp: string;
  app_data: Record<string, any> | null;
  offer_title: string | null;
  company_name: string | null;
}

export function getUserName(user: User | null | undefined): string {
  const meta = (user?.user_metadata || {}) as Record<string, any>;
  const name = meta.full_name || meta.name || meta.fullname || '';
  return typeof name === 'string' ? name.trim() : '';
}

export function getUserEmail(user: User | null | undefined): string {
  return user?.email || '';
}

export function getUserWhatsapp(user: User | null | undefined): string {
  const meta = (user?.user_metadata || {}) as Record<string, any>;
  const raw = meta.whatsapp || meta.whatsapp_number || meta.phone || '';
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * إرسال رمز التحقق إلى البريد — ينشئ الحساب تلقائيًا إن لم يكن موجودًا.
 * البيانات (الاسم/الواتساب) تُحفظ في user_metadata مع الحساب.
 */
export async function sendLoginOtp(params: {
  name: string;
  email: string;
  whatsapp?: string;
}): Promise<{ error: string | null }> {
  const meta: Record<string, string> = { full_name: params.name.trim() };
  const wa = params.whatsapp ? normalizeEgyptPhone(params.whatsapp) : null;
  if (params.whatsapp && !wa) {
    return { error: 'اكتب رقم واتساب صحيح (أرقام فقط)' };
  }
  if (wa) meta.whatsapp = wa;

  const { error } = await supabase.auth.signInWithOtp({
    email: params.email.trim(),
    options: {
      shouldCreateUser: true,
      data: meta,
    },
  });

  if (error) {
    console.warn('[sendLoginOtp]', error.code, error.message);
    return { error: mapAuthError(error.message) };
  }
  return { error: null };
}

/**
 * التحقق من الرمز المكوّن من 6 أرقام.
 * نوع الرمز يختلف بحسب إعدادات المشروع (مستخدم جديد/قديم) —
 * نجرب الأنواع الموثقة بالترتيب حتى ينجح أحدها بصمت.
 */
export async function verifyLoginOtp(
  email: string,
  token: string
): Promise<{ error: string | null }> {
  const types: Array<'email' | 'signup' | 'magiclink'> = ['email', 'signup', 'magiclink'];
  let lastMessage = '';

  for (const type of types) {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type,
    });
    if (!error) return { error: null };
    lastMessage = error.message || '';
    console.warn(`[verifyLoginOtp type=${type}]`, error.code, lastMessage);
  }

  return { error: mapAuthError(lastMessage) };
}

/**
 * ربط طلب سابق بالحساب الحالي — يتطلب (الرقم المرجعي + رقم الواتساب) معًا.
 * الخطأ NOT_SET_UP يعني أن سكربت SQL لم يُشغَّل بعد.
 */
export async function linkMyApplication(
  reference: string,
  whatsapp: string
): Promise<{ error: string | null; notSetUp?: boolean }> {
  const wa = normalizeEgyptPhone(whatsapp);
  if (!reference.trim() || reference.trim().length < 4) {
    return { error: 'اكتب الرقم المرجعي الكامل الذي وصلك عند التقديم.' };
  }
  if (!wa) {
    return { error: 'اكتب رقم واتساب صحيح (أرقام فقط)' };
  }

  const { data, error } = await supabase.rpc('link_application', {
    p_reference: reference.trim(),
    p_whatsapp: wa,
  });

  if (error) {
    console.warn('[linkMyApplication]', error.code, error.message);
    if (error.message?.includes('LINK_NOT_FOUND')) {
      return { error: 'لم نجد طلبًا بهذا الرقم المرجعي ورقم الواتساب معًا. تأكد من الرقمين وحاول مجددًا.' };
    }
    if (error.message?.includes('NOT_AUTHENTICATED')) {
      return { error: 'انتهت صلاحية الجلسة، سجّل الدخول من جديد.' };
    }
    if (error.message?.includes('LINK_BAD_INPUT')) {
      return { error: 'تأكد من صحة الرقم المرجعي ورقم الواتساب.' };
    }
    if (isRpcMissing(error)) {
      return { error: '', notSetUp: true };
    }
    return { error: 'تعذر ربط الطلب الآن، حاول مرة أخرى.' };
  }
  return { error: null };
}

/**
 * قراءة طلبات المستخدم الحالي فقط — عبر دالة آمنة على قاعدة البيانات
 * لا تُعيد إلا صفوف صاحب الجلسة.
 */
export async function fetchMyApplications(): Promise<{
  data: MyApplication[] | null;
  notSetUp?: boolean;
  error?: string | null;
}> {
  const { data, error } = await supabase.rpc('get_my_applications');

  if (error) {
    console.warn('[fetchMyApplications]', error.code, error.message);
    if (isRpcMissing(error)) {
      return { data: null, notSetUp: true };
    }
    return { data: null, error: 'تعذر تحميل طلباتك الآن، حاول بعد قليل.' };
  }
  return { data: (data || []) as MyApplication[] };
}

function isRpcMissing(err: { message?: string; code?: string }): boolean {
  const msg = String(err?.message || '');
  return (
    err?.code === '404' ||
    err?.code === 'PGRST202' ||
    msg.includes('function public.get_my_applications') ||
    msg.includes('function public.link_application') ||
    msg.includes('Could not find the function') ||
    msg.includes('schema cache')
  );
}

/** ترجمة رسائل أخطاء المصادقة إلى العربية */
export function mapAuthError(rawMessage: string): string {
  const raw = String(rawMessage || '');
  if (/otp.*(invalid|incorrect)|invalid.*otp|token has expired|expired|already been used/i.test(raw)) {
    return 'الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا وحاول مجددًا.';
  }
  if (/rate limit|too many/i.test(raw)) {
    return 'وصلت للحد الأقصى لإرسال الرموز مؤقتًا. انتظر ساعة تقريبًا ثم حاول مجددًا.';
  }
  if (/signups not allowed/i.test(raw)) {
    return 'إنشاء الحسابات الجديدة معطّل حاليًا.';
  }
  if (/invalid email|invalid format|unable to validate email/i.test(raw)) {
    return 'صيغة البريد الإلكتروني غير صحيحة.';
  }
  if (/anonymous sign-ins are disabled/i.test(raw)) {
    return 'تعذر الإرسال، تأكد من كتابة البريد الإلكتروني.';
  }
  if (/failed to fetch|network/i.test(raw)) {
    return 'مشكلة في الاتصال بالإنترنت، تحقق من الشبكة وحاول مجددًا.';
  }
  return 'تعذر إكمال العملية الآن، حاول مرة أخرى.';
}
