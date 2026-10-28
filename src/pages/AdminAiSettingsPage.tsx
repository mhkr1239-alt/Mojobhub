import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AdminNav } from '../components/AdminNav';
import { 
  Sparkles, 
  Key, 
  Cpu, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  Lock,
  Layers,
  Power,
  Activity,
  X
} from 'lucide-react';

interface AiApiKeyRow {
  id: string | number;
  label: string;
  key_hint: string;
  is_active: boolean;
  last_used_at?: string | null;
  last_error?: string | null;
  last_error_at?: string | null;
  created_at?: string;
}

interface DiagnosticItem {
  source: string;
  ok: boolean;
  httpStatus: number | null;
  reason: string;
}

interface DiagnosticResponse {
  primaryPresent: boolean;
  model: string;
  results: DiagnosticItem[];
}

export const AdminAiSettingsPage: React.FC = () => {
  const { session } = useAuth();

  // Status & keys state
  const [primaryConfigured, setPrimaryConfigured] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [keys, setKeys] = useState<AiApiKeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(true);

  // Diagnostics state
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [diagResponse, setDiagResponse] = useState<DiagnosticResponse | null>(null);

  // Model setting state
  const [geminiModel, setGeminiModel] = useState<string>('gemini-3.8-flash');
  const [savingModel, setSavingModel] = useState<boolean>(false);

  // New key form state
  const [newLabel, setNewLabel] = useState<string>('');
  const [newKey, setNewKey] = useState<string>('');
  const [addingKey, setAddingKey] = useState<boolean>(false);

  // Feedback notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchPrimaryStatus();
    fetchModelSetting();
    fetchKeys();
  }, [session?.access_token]);

  // 1. Fetch Primary Key Status from /api/ai/status
  const fetchPrimaryStatus = async () => {
    if (!session?.access_token) return;
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/ai/status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPrimaryConfigured(Boolean(data.primaryConfigured));
      } else {
        setPrimaryConfigured(false);
      }
    } catch (err) {
      console.error('Error fetching primary key status:', err);
      setPrimaryConfigured(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  // 2. Fetch gemini_model from app_settings
  const fetchModelSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'gemini_model')
        .maybeSingle();

      if (!error && data?.value) {
        setGeminiModel(data.value);
      }
    } catch (err) {
      console.error('Error loading gemini_model setting:', err);
    }
  };

  // 3. Save gemini_model
  const handleSaveModel = async (e?: React.FormEvent, overrideModel?: string) => {
    if (e) e.preventDefault();
    const modelToSave = (overrideModel || geminiModel).trim() || 'gemini-3.8-flash';
    if (overrideModel) {
      setGeminiModel(overrideModel);
    }
    setSavingModel(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'gemini_model', value: modelToSave });

      if (error) throw error;
      showToast('success', `تم حفظ اسم النموذج (${modelToSave}) بنجاح.`);
    } catch (err: any) {
      console.error('Error saving model setting:', err);
      showToast('error', `فشل حفظ النموذج: ${err?.message || 'خطأ غير متوقع'}`);
    } finally {
      setSavingModel(false);
    }
  };

  // 3.5 Test Connections (Diagnostics)
  const handleTestConnection = async () => {
    if (!session?.access_token) return;
    setTestingConnection(true);
    try {
      const res = await fetch('/api/ai/diagnostics', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.status === 429) {
        showToast('error', 'تجاوزت الحد المسموح به لاختبار الاتصال (5 طلبات في الدقيقة)، يرجى الانتظار قليلاً.');
        return;
      }

      if (!res.ok) {
        showToast('error', 'فشل في تشغيل فحص الاتصال من الخادم.');
        return;
      }

      const data: DiagnosticResponse = await res.json();
      setDiagResponse(data);
      showToast('success', 'اكتمل اختبار الاتصال لكافة المفاتيح.');
    } catch (err: any) {
      console.error('Error testing connections:', err);
      showToast('error', 'حدث خطأ في الاتصال أثناء إجراء الفحص.');
    } finally {
      setTestingConnection(false);
    }
  };

  const getReasonArabicExplanation = (reason: string, ok: boolean): string => {
    if (ok) return 'الاتصال ناجح والنموذج يستجيب بشكل سليم (جاهز للعمل)';
    switch (reason) {
      case 'RESOURCE_EXHAUSTED':
      case 'QUOTA_EXHAUSTED':
        return 'استنفدت الحصة المتاحة (Quota Exhausted / Rate Limit)';
      case 'API_KEY_INVALID':
      case 'KEY_INVALID':
        return 'مفتاح API غير صالح أو منتهي الصلاحية (Key Invalid)';
      case 'PERMISSION_DENIED':
      case 'KEY_INVALID_OR_FORBIDDEN':
        return 'لا توجد صلاحية للوصول (No Permission / Forbidden)';
      case 'MODEL_NOT_FOUND':
        return 'النموذج غير متاح أو لم يعد مدعومًا (Model Not Found)';
      case 'MODEL_UNAVAILABLE':
        return 'النموذج يواجه ضغطًا عاليًا مؤقتًا، جرب لاحقًا (503 High Demand)';
      case 'NO_KEYS_CONFIGURED':
        return 'لا توجد أي مفاتيح مضافة';
      default:
        return `خطأ في الاتصال: ${reason}`;
    }
  };

  // 4. Fetch ai_api_keys list (Notice: never selects api_key)
  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const { data, error } = await supabase
        .from('ai_api_keys')
        .select('id, label, key_hint, is_active, last_used_at, last_error, last_error_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (err: any) {
      console.error('Error loading API keys:', err);
      showToast('error', `فشل تحميل المفاتيح: ${err?.message || 'خطأ غير متوقع'}`);
    } finally {
      setLoadingKeys(false);
    }
  };

  // 5. Add new API key
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      showToast('error', 'يرجى كتابة تسمية للمفتاح.');
      return;
    }
    const cleanKey = newKey.trim();
    if (!cleanKey || cleanKey.length < 4) {
      showToast('error', 'يرجى إدخال مفتاح API صحيح.');
      return;
    }

    setAddingKey(true);
    try {
      const keyHint = cleanKey.slice(-4);
      const { error } = await supabase.from('ai_api_keys').insert({
        label: newLabel.trim(),
        api_key: cleanKey,
        key_hint: keyHint,
        is_active: true,
      });

      if (error) throw error;

      // Clear input immediately and never display or re-read full key
      setNewLabel('');
      setNewKey('');
      showToast('success', 'تمت إضافة المفتاح الاحتياطي بنجاح.');
      await fetchKeys();
    } catch (err: any) {
      console.error('Error adding key:', err);
      showToast('error', `فشل إضافة المفتاح: ${err?.message || 'خطأ غير متوقع'}`);
    } finally {
      setAddingKey(false);
    }
  };

  // 6. Toggle active status
  const handleToggleActive = async (keyItem: AiApiKeyRow) => {
    try {
      const nextStatus = !keyItem.is_active;
      const { error } = await supabase
        .from('ai_api_keys')
        .update({ is_active: nextStatus })
        .eq('id', keyItem.id);

      if (error) throw error;

      setKeys((prev) =>
        prev.map((k) => (k.id === keyItem.id ? { ...k, is_active: nextStatus } : k))
      );
      showToast('success', nextStatus ? 'تم تفعيل المفتاح.' : 'تم تعطيل المفتاح.');
    } catch (err: any) {
      console.error('Error toggling key status:', err);
      showToast('error', 'فشل تغيير حالة المفتاح.');
    }
  };

  // 7. Delete key
  const handleDeleteKey = async (keyItem: AiApiKeyRow) => {
    if (!window.confirm(`هل أنت متأكد من حذف المفتاح "${keyItem.label}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_api_keys')
        .delete()
        .eq('id', keyItem.id);

      if (error) throw error;

      setKeys((prev) => prev.filter((k) => k.id !== keyItem.id));
      showToast('success', 'تم حذف المفتاح بنجاح.');
    } catch (err: any) {
      console.error('Error deleting key:', err);
      showToast('error', 'فشل حذف المفتاح.');
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'لم يُستخدم بعد';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF2] p-4 sm:p-6 lg:p-8 selection:bg-[#1FA98A]/30 selection:text-white" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation */}
        <AdminNav activeTab="ai-settings" />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#131A21] border border-[#232F3A] rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1FA98A]/10 border border-[#1FA98A]/25 text-[#1FA98A] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#E6EDF2] leading-tight">
                إعدادات الذكاء الاصطناعي (AI Job Builder)
              </h1>
              <p className="text-xs sm:text-sm text-[#8B98A5] mt-0.5">
                إدارة مفاتيح Gemini، التبديل التلقائي عند استنفاد الحصص، وتحديد النموذج المستخدم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1FA98A]/10 hover:bg-[#1FA98A]/20 border border-[#1FA98A]/30 text-xs font-bold text-[#1FA98A] transition cursor-pointer disabled:opacity-50"
              title="اختبار الاتصال بكافة المفاتيح"
            >
              {testingConnection ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#1FA98A]/30 border-t-[#1FA98A] rounded-full animate-spin"></div>
                  <span>جاري الفحص...</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>اختبار الاتصال</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                fetchPrimaryStatus();
                fetchModelSetting();
                fetchKeys();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1A232C] hover:bg-[#232F3A] border border-[#232F3A] text-xs font-bold text-[#8B98A5] hover:text-[#E6EDF2] transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* Toast alert */}
        {toast && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition animate-in fade-in ${
              toast.type === 'success'
                ? 'bg-[#1FA98A]/10 border-[#1FA98A]/30 text-[#1FA98A]'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): Primary Key Status & Fallback Keys */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diagnostics Panel */}
            {(testingConnection || diagResponse) && (
              <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1FA98A]/10 border border-[#1FA98A]/25 flex items-center justify-center text-[#1FA98A]">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#E6EDF2]">
                        نتائج اختبار الاتصال بمفاتيح الذكاء الاصطناعي
                      </h2>
                      {diagResponse && (
                        <span className="text-xs text-[#8B98A5]">
                          تم الاختبار باستخدام النموذج:{' '}
                          <span className="font-mono text-[#1FA98A] font-bold">{diagResponse.model}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A232C] hover:bg-[#232F3A] border border-[#232F3A] text-xs font-bold text-[#8B98A5] hover:text-[#E6EDF2] transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                      <span>إعادة الاختبار</span>
                    </button>

                    {diagResponse && !testingConnection && (
                      <button
                        type="button"
                        onClick={() => setDiagResponse(null)}
                        className="p-1.5 rounded-lg text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#1A232C] transition cursor-pointer"
                        title="إخفاء النتائج"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {testingConnection ? (
                  <div className="py-6 text-center text-xs text-[#8B98A5] space-y-2">
                    <div className="w-6 h-6 border-2 border-[#1FA98A]/30 border-t-[#1FA98A] rounded-full animate-spin mx-auto"></div>
                    <p>جاري اختبار الاتصال وإرسال إشارة تجريبية (ping) لكل مفتاح مع النموذج الحالي...</p>
                  </div>
                ) : diagResponse ? (
                  <div className="space-y-3">
                    {/* Quota suggestion if primary key hit quota for this model */}
                    {diagResponse.results.some(
                      (r) =>
                        r.source === 'primary' &&
                        !r.ok &&
                        (r.reason === 'RESOURCE_EXHAUSTED' || r.reason === 'QUOTA_EXHAUSTED')
                    ) && (
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-amber-400 font-bold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>المفتاح الأساسي استنفد حصته للنموذج الحالي ({diagResponse.model})</span>
                        </div>
                        <p className="text-[#8B98A5] leading-relaxed">
                          نقترح اختيار نموذج آخر من قائمة النماذج السريعة مثل{' '}
                          <button
                            type="button"
                            onClick={() => handleSaveModel(undefined, 'gemini-3.1-flash-lite')}
                            className="font-mono font-bold text-[#1FA98A] underline hover:text-[#25c49f] cursor-pointer"
                          >
                            gemini-3.1-flash-lite
                          </button>{' '}
                          لتفادي نفاد الحصة واستئناف العمل فورًا.
                        </p>
                      </div>
                    )}

                    {/* Results list */}
                    <div className="space-y-2">
                      {diagResponse.results.length === 0 ? (
                        <p className="text-xs text-[#8B98A5] text-center py-3">
                          لا توجد مفاتيح متاحة للاختبار (المفتاح الأساسي غير مضبوط ولا توجد مفاتيح احتياطية).
                        </p>
                      ) : (
                        diagResponse.results.map((res, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                              res.ok
                                ? 'bg-[#1FA98A]/5 border-[#1FA98A]/25'
                                : 'bg-red-500/5 border-red-500/25'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#E6EDF2]">
                                  {res.source === 'primary' ? 'المفتاح الأساسي (Primary)' : res.source}
                                </span>
                                {res.httpStatus && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131A21] border border-[#232F3A] text-[#8B98A5]">
                                    HTTP {res.httpStatus}
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    res.ok
                                      ? 'text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/20'
                                      : 'text-red-400 bg-red-500/10 border border-red-500/20'
                                  }`}
                                >
                                  {res.reason}
                                </span>
                              </div>
                              <p className="text-xs text-[#8B98A5] leading-relaxed">
                                {getReasonArabicExplanation(res.reason, res.ok)}
                              </p>
                            </div>

                            <div className="shrink-0 self-start sm:self-auto">
                              {res.ok ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/25">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>ناجح ومتصل</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>فشل الاتصال</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Primary Key Card */}
            <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1A232C] border border-[#232F3A] flex items-center justify-center text-[#1FA98A]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#E6EDF2]">
                      المفتاح الأساسي (Primary Gemini Key)
                    </h2>
                    <span className="text-xs text-[#8B98A5]">
                      بيئة العمل المباشرة (process.env.GEMINI_API_KEY)
                    </span>
                  </div>
                </div>

                {loadingStatus ? (
                  <div className="w-5 h-5 border-2 border-[#1FA98A]/30 border-t-[#1FA98A] rounded-full animate-spin"></div>
                ) : primaryConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1FA98A]"></span>
                    <span>مضبوط وجاهز للعمل</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>غير مضبوط في متغيرات البيئة</span>
                  </span>
                )}
              </div>

              <div className="bg-[#1A232C] border border-[#232F3A] rounded-lg p-3 text-xs text-[#8B98A5] leading-relaxed">
                يتم استدعاء هذا المفتاح أولاً كأولوية في كل عملية استخراج لإعلان وظيفة. إذا استنفد هذا المفتاح حصته (Quota 429) أو واجه خطأ صلاحيات، يتحول النظام فورًا وبشكل تلقائي إلى المفاتيح الاحتياطية المسجلة أدناه.
              </div>
            </div>

            {/* Fallback Keys List */}
            <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1A232C] border border-[#232F3A] flex items-center justify-center text-[#1FA98A]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#E6EDF2]">
                      مفاتيح API الاحتياطية ({keys.length})
                    </h2>
                    <span className="text-xs text-[#8B98A5]">
                      تُستخدم بالترتيب الزمني عند نفاد حصة المفتاح الأساسي
                    </span>
                  </div>
                </div>
              </div>

              {loadingKeys ? (
                <div className="py-8 text-center text-xs text-[#8B98A5]">
                  <div className="w-6 h-6 border-2 border-[#1FA98A]/30 border-t-[#1FA98A] rounded-full animate-spin mx-auto mb-2"></div>
                  <span>جاري تحميل المفاتيح الاحتياطية...</span>
                </div>
              ) : keys.length === 0 ? (
                <div className="py-8 text-center bg-[#1A232C]/50 border border-dashed border-[#232F3A] rounded-xl p-6">
                  <Key className="w-8 h-8 text-[#8B98A5]/40 mx-auto mb-2" />
                  <p className="text-xs text-[#8B98A5] font-medium">
                    لا توجد مفاتيح احتياطية مضافة بعد.
                  </p>
                  <p className="text-[11px] text-[#8B98A5]/70 mt-1">
                    أضف مفتاحًا احتياطيًا من النموذج الجانبي لضمان استمرارية خدمة الذكاء الاصطناعي دون انقطاع.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {keys.map((k) => (
                    <div
                      key={k.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        k.is_active
                          ? 'bg-[#1A232C] border-[#232F3A]'
                          : 'bg-[#1A232C]/40 border-[#232F3A]/60 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#E6EDF2]">
                              {k.label}
                            </span>
                            <span className="text-[11px] font-mono text-[#8B98A5] bg-[#131A21] px-2 py-0.5 rounded border border-[#232F3A]">
                              •••• {k.key_hint}
                            </span>
                            {k.is_active ? (
                              <span className="text-[10px] font-bold text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/20 px-1.5 py-0.5 rounded">
                                مفعّل
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#8B98A5] bg-[#232F3A] px-1.5 py-0.5 rounded">
                                معطّل
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8B98A5]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#8B98A5]/70" />
                              <span>آخر استخدام: {formatDate(k.last_used_at)}</span>
                            </span>
                            {k.last_error && (
                              <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded font-mono text-[10px]" title={k.last_error_at || ''}>
                                خطأ: {k.last_error}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(k)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              k.is_active
                                ? 'bg-[#131A21] text-[#1FA98A] hover:bg-[#1FA98A]/10 border border-[#232F3A]'
                                : 'bg-[#131A21] text-[#8B98A5] hover:text-[#E6EDF2] border border-[#232F3A]'
                            }`}
                            title={k.is_active ? 'تعطيل المفتاح' : 'تفعيل المفتاح'}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{k.is_active ? 'إيقاف' : 'تفعيل'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteKey(k)}
                            className="p-1.5 rounded-lg text-[#8B98A5] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            title="حذف المفتاح"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1 col): Add Key Form & Model Configuration */}
          <div className="space-y-6">
            {/* Add Key Form */}
            <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#1FA98A]" />
                <h2 className="text-sm font-bold text-[#E6EDF2]">
                  إضافة مفتاح احتياطي جديد
                </h2>
              </div>

              <form onSubmit={handleAddKey} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#8B98A5] mb-1">
                    اسم / تسمية المفتاح <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="مثال: حساب شخصي 1 أو مشروع احتياطي"
                    className="w-full bg-[#1A232C] border border-[#232F3A] rounded-lg px-3 py-2 text-xs text-[#E6EDF2] placeholder-[#8B98A5]/50 focus:border-[#1FA98A] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8B98A5] mb-1">
                    مفتاح API الكامل <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#1A232C] border border-[#232F3A] rounded-lg pr-3 pl-8 py-2 text-xs text-[#E6EDF2] placeholder-[#8B98A5]/50 focus:border-[#1FA98A] outline-none font-mono"
                      required
                    />
                    <Lock className="w-3.5 h-3.5 text-[#8B98A5] absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-[#8B98A5] mt-1 leading-relaxed">
                    يتم تخزين آخر 4 خانات فقط للتلميح، ولن يتم عرض المفتاح في الواجهة نهائيًا.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={addingKey}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-[#1FA98A] hover:bg-[#1aa082] disabled:opacity-50 text-[#0B0F14] font-bold text-xs py-2.5 px-4 rounded-lg transition shadow-xs cursor-pointer"
                >
                  {addingKey ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#0B0F14]/30 border-t-[#0B0F14] rounded-full animate-spin"></div>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>حفظ المفتاح الاحتياطي</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Model Configuration Card */}
            <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#1FA98A]" />
                <h2 className="text-sm font-bold text-[#E6EDF2]">
                  نموذج الذكاء الاصطناعي (Model)
                </h2>
              </div>

              <form onSubmit={handleSaveModel} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#8B98A5] mb-1">
                    اسم النموذج المستخدم في التحليل
                  </label>
                  <input
                    type="text"
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    placeholder="gemini-3.8-flash"
                    className="w-full bg-[#1A232C] border border-[#232F3A] rounded-lg px-3 py-2 text-xs text-[#E6EDF2] placeholder-[#8B98A5]/50 focus:border-[#1FA98A] outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <span className="text-[11px] text-[#8B98A5] block mb-1.5 font-medium">
                    نماذج شائعة وسريعة:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['gemini-3.8-flash', 'gemini-3.1-flash-lite'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setGeminiModel(m)}
                        className={`text-[10px] font-mono px-2 py-1 rounded transition cursor-pointer ${
                          geminiModel === m
                            ? 'bg-[#1FA98A]/20 text-[#1FA98A] border border-[#1FA98A]/40'
                            : 'bg-[#1A232C] text-[#8B98A5] hover:text-[#E6EDF2] border border-[#232F3A]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingModel}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-[#1A232C] hover:bg-[#232F3A] border border-[#232F3A] hover:border-[#1FA98A]/30 text-[#E6EDF2] font-bold text-xs py-2 px-3 rounded-lg transition cursor-pointer"
                >
                  {savingModel ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>جاري حفظ النموذج...</span>
                    </>
                  ) : (
                    <span>تحديث اسم النموذج</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
