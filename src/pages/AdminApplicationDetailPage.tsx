import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  supabase, 
  JobApplication, 
  ApplicationStatus, 
  FormFieldDefinition 
} from '../lib/supabase';
import { AdminNav } from '../components/AdminNav';
import { AdminStatusBadge } from '../components/AdminStatusBadge';
import { 
  AdminApplicationDataViewer, 
  isFileObject 
} from '../components/AdminApplicationDataViewer';
import { 
  normalizeEgyptPhone, 
  STATUS_METAS, 
  PIPELINE_STEPS 
} from '../lib/applicationUtils';
import { 
  ArrowRight, 
  User, 
  Phone, 
  Briefcase, 
  Clock, 
  Calendar, 
  MessageCircle, 
  Copy, 
  Check, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Building, 
  FileText,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface ApplicationWithOffer extends JobApplication {
  offers?: {
    id?: string | number;
    title?: string;
    company_name?: string;
    whatsapp_number?: string | null;
    form_fields?: FormFieldDefinition[];
  } | null;
}

export const AdminApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [application, setApplication] = useState<ApplicationWithOffer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Status updating state
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    targetStatus: ApplicationStatus;
    title: string;
    description: string;
  } | null>(null);

  // Admin notes state
  const [notes, setNotes] = useState<string>('');
  const [initialNotes, setInitialNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [notesSuccess, setNotesSuccess] = useState<boolean>(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Copy forwarding block state
  const [copied, setCopied] = useState<boolean>(false);

  // Load application data
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setNotFound(false);
      setFetchError(null);

      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*, offers(id, title, company_name, whatsapp_number, form_fields)')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            if (isMounted) setNotFound(true);
          } else {
            throw error;
          }
        } else if (!data) {
          if (isMounted) setNotFound(true);
        } else {
          if (isMounted) {
            const appData = data as unknown as ApplicationWithOffer;
            setApplication(appData);
            setNotes(appData.admin_notes || '');
            setInitialNotes(appData.admin_notes || '');
          }
        }
      } catch (err: any) {
        console.error('Error fetching application detail:', err);
        if (isMounted) {
          setFetchError(err?.message || 'حدث خطأ أثناء تحميل بيانات الطلب');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const offerInfo = useMemo(() => {
    if (!application?.offers) return null;
    if (Array.isArray(application.offers)) {
      return (application.offers[0] as any) || null;
    }
    return application.offers;
  }, [application?.offers]);

  const candidatePhoneNormalized = useMemo(() => {
    return normalizeEgyptPhone(application?.candidate_whatsapp);
  }, [application?.candidate_whatsapp]);

  const offerPhoneNormalized = useMemo(() => {
    return normalizeEgyptPhone(offerInfo?.whatsapp_number);
  }, [offerInfo?.whatsapp_number]);

  // Handle status update
  const handleStatusClick = (targetStatus: ApplicationStatus) => {
    if (statusUpdating || !application || application.status === targetStatus) return;

    if (targetStatus === 'rejected') {
      setConfirmModal({
        targetStatus: 'rejected',
        title: 'تأكيد رفض الطلب',
        description: `هل أنت متأكد من تغيير حالة طلب المرشح «${application.candidate_name}» إلى «مرفوض»؟`,
      });
      return;
    }

    if (targetStatus === 'hired') {
      setConfirmModal({
        targetStatus: 'hired',
        title: 'تأكيد تعيين المرشح',
        description: `هل أنت متأكد من تغيير حالة طلب المرشح «${application.candidate_name}» إلى «تم التعيين»؟`,
      });
      return;
    }

    applyStatusUpdate(targetStatus);
  };

  const applyStatusUpdate = async (targetStatus: ApplicationStatus) => {
    if (!application || !id) return;

    setStatusError(null);
    const previousStatus = application.status;
    const previousUpdatedAt = application.updated_at;

    // Optimistic UI update
    setApplication((prev) => (prev ? { ...prev, status: targetStatus } : null));
    setStatusUpdating(true);

    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ status: targetStatus })
        .eq('id', id)
        .select('updated_at')
        .single();

      if (error) {
        throw error;
      }

      // Refresh updated_at from returned row
      if (data?.updated_at) {
        setApplication((prev) => (prev ? { ...prev, updated_at: data.updated_at } : null));
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      // Rollback on failure
      setApplication((prev) =>
        prev ? { ...prev, status: previousStatus, updated_at: previousUpdatedAt } : null
      );
      setStatusError(err?.message || 'فشل تحديث حالة الطلب. يُرجى المحاولة مجددًا.');
    } finally {
      setStatusUpdating(false);
      setConfirmModal(null);
    }
  };

  // Handle saving admin notes
  const handleSaveNotes = async () => {
    if (!id || savingNotes) return;

    setSavingNotes(true);
    setNotesError(null);
    setNotesSuccess(false);

    try {
      const { error } = await supabase
        .from('applications')
        .update({ admin_notes: notes })
        .eq('id', id);

      if (error) throw error;

      setInitialNotes(notes);
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving admin notes:', err);
      setNotesError(err?.message || 'فشل حفظ الملاحظات، تحقق من الاتصال.');
    } finally {
      setSavingNotes(false);
    }
  };

  // Build copyable forwarding block
  const forwardingText = useMemo(() => {
    if (!application) return '';

    const title = offerInfo?.title || '—';
    const company = offerInfo?.company_name || '—';
    const cName = application.candidate_name || '—';
    const cPhone = application.candidate_whatsapp || '—';

    const formFields = (offerInfo?.form_fields || []) as FormFieldDefinition[];
    const fieldsMap = new Map<string, string>();
    formFields.forEach((f: FormFieldDefinition) => {
      if (f.key) fieldsMap.set(f.key, f.label || f.key);
    });

    const lines: string[] = [
      `الوظيفة: ${title}`,
      `الجهة: ${company}`,
      `الاسم: ${cName}`,
      `واتساب: ${cPhone}`,
    ];

    const dataObj = application.data || {};
    for (const [key, val] of Object.entries(dataObj)) {
      if (key === 'consent' || key === 'consented_at') continue;
      const label = fieldsMap.get(key) || key.replace(/_/g, ' ');

      if (val === null || val === undefined || val === '') {
        lines.push(`${label}: —`);
      } else if (isFileObject(val)) {
        const fileName = val.file_name || 'ملف مرفق';
        lines.push(`${label}: مرفق - ${fileName} (يُرسل يدويًا)`);
      } else if (typeof val === 'object') {
        lines.push(`${label}: ${JSON.stringify(val)}`);
      } else {
        lines.push(`${label}: ${String(val)}`);
      }
    }

    return lines.join('\n');
  }, [application, offerInfo]);

  const handleCopyForwarding = async () => {
    if (!forwardingText) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(forwardingText);
      } else {
        // Fallback for older environments
        const textArea = document.createElement('textarea');
        textArea.value = forwardingText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Candidate WhatsApp link with encoded message
  const candidateWhatsAppUrl = useMemo(() => {
    if (!candidatePhoneNormalized) return null;
    const greeting = `السلام عليكم ${application?.candidate_name || ''}، بخصوص تقديمك على وظيفة ${offerInfo?.title || 'المعلنة'}.`;
    return `https://wa.me/${candidatePhoneNormalized}?text=${encodeURIComponent(greeting)}`;
  }, [candidatePhoneNormalized, application?.candidate_name, offerInfo?.title]);

  // Employer WhatsApp link
  const employerWhatsAppUrl = useMemo(() => {
    if (!offerPhoneNormalized) return null;
    return `https://wa.me/${offerPhoneNormalized}`;
  }, [offerPhoneNormalized]);

  const hasUnsavedNotes = notes !== initialNotes;

  // Render Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF2] py-6 sm:py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <AdminNav activeTab="applications" />
          <div className="space-y-4 animate-pulse mt-6">
            <div className="h-6 bg-[#1A232C] rounded w-1/4"></div>
            <div className="h-32 bg-[#131A21] border border-[#232F3A] rounded-xl p-6"></div>
            <div className="h-20 bg-[#131A21] border border-[#232F3A] rounded-xl"></div>
            <div className="h-48 bg-[#131A21] border border-[#232F3A] rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render Not Found state
  if (notFound || !application) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF2] py-6 sm:py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <AdminNav activeTab="applications" />
          <div className="text-center py-16 bg-[#131A21] border border-[#232F3A] rounded-xl p-8 mt-6">
            <AlertCircle className="w-12 h-12 text-[#E1615E] mx-auto mb-3" />
            <h2 className="text-base sm:text-lg font-bold text-[#E6EDF2]">الطلب غير موجود</h2>
            <p className="text-xs sm:text-sm text-[#8B98A5] mt-1 mb-6">
              لم يتم العثور على طلب التقديم المطلوب، أو ربما تم حذفه من قاعدة البيانات.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1FA98A] text-[#0B0F14] font-bold text-xs hover:bg-[#18886F] transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لقائمة الطلبات</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pipeline helper
  const currentStatus = (application.status || 'submitted') as ApplicationStatus;
  const currentStepIndex = PIPELINE_STEPS.indexOf(currentStatus);
  const isRejected = currentStatus === 'rejected';

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF2] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-24" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Admin Navigation */}
        <AdminNav activeTab="applications" />

        {/* Back Link */}
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B98A5] hover:text-[#1FA98A] transition group"
          >
            <ArrowRight className="w-3.5 h-3.5 transition group-hover:-translate-x-0.5" />
            <span>العودة إلى قائمة طلبات التقديم</span>
          </Link>
        </div>

        {/* Error banner if any */}
        {fetchError && (
          <div className="p-3 bg-[#E1615E]/10 border border-[#E1615E]/30 rounded-lg flex items-center gap-2 text-xs text-[#E1615E]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {statusError && (
          <div className="p-3 bg-[#E1615E]/10 border border-[#E1615E]/30 rounded-lg flex items-center gap-2 text-xs text-[#E1615E]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusError}</span>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#232F3A]">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-[#1A232C] border border-[#232F3A] text-[#1FA98A] flex items-center justify-center font-bold text-sm">
                  <User className="w-4 h-4" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-[#E6EDF2]">
                  {application.candidate_name}
                </h1>
                <AdminStatusBadge status={application.status} size="md" />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8B98A5]">
                <div className="flex items-center gap-1 font-mono text-[#E6EDF2] bg-[#1A232C] border border-[#232F3A] px-2.5 py-1 rounded-md" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-[#1FA98A]" />
                  <span>{application.candidate_whatsapp}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <Briefcase className="w-3.5 h-3.5 text-[#8B98A5]" />
                  <span>
                    الوظيفة: <strong className="text-[#E6EDF2]">{offerInfo?.title || `معرف: ${application.offer_id}`}</strong>
                    {offerInfo?.company_name && (
                      <span className="text-[#8B98A5]"> — {offerInfo.company_name}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1 text-[11px] text-[#8B98A5] font-mono shrink-0">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#8B98A5]" />
                <span>تاريخ التقديم: {formatDate(application.submitted_at)}</span>
              </div>
              <div className="flex items-center gap-1 text-[#1FA98A]">
                <Clock className="w-3 h-3" />
                <span>آخر تحديث: {formatDate(application.updated_at || application.submitted_at)}</span>
              </div>
            </div>
          </div>

          {/* Quick WhatsApp Actions in Header */}
          <div className="mt-4 pt-3 flex flex-wrap items-center gap-3">
            {candidatePhoneNormalized ? (
              <a
                href={candidateWhatsAppUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-bold text-xs transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>تواصل مع المتقدم على واتساب</span>
              </a>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A232C] border border-[#232F3A] text-xs text-[#8B98A5] cursor-not-allowed">
                <Phone className="w-3.5 h-3.5 text-[#E1615E]" />
                <span>اطلب رقمًا بكود الدولة</span>
              </div>
            )}

            {offerInfo?.whatsapp_number && offerPhoneNormalized ? (
              <a
                href={employerWhatsAppUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1FA98A]/10 hover:bg-[#1FA98A]/20 border border-[#1FA98A]/30 text-[#1FA98A] font-bold text-xs transition cursor-pointer"
              >
                <Building className="w-4 h-4 shrink-0" />
                <span>افتح واتساب الجهة ({offerInfo.company_name || 'جهة العمل'})</span>
              </a>
            ) : (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A232C] border border-[#232F3A] text-xs text-[#8B98A5] cursor-not-allowed"
                title="لم يُسجل رقم واتساب للجهة في بيانات الوظيفة"
              >
                <Building className="w-3.5 h-3.5 text-[#8B98A5]" />
                <span>لا يوجد رقم واتساب مسجل للجهة</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Pipeline Card */}
        <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-[#E6EDF2] flex items-center gap-2">
              <span>مسار حالة الطلب (Status Pipeline)</span>
              {statusUpdating && (
                <div className="w-3 h-3 border-2 border-[#1FA98A]/30 border-t-[#1FA98A] rounded-full animate-spin" />
              )}
            </h2>
            <span className="text-[11px] text-[#8B98A5]">
              انقر على أي مرحلة للتحديث المباشر
            </span>
          </div>

          {/* Stepper on Desktop */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-5 gap-2 relative">
              {PIPELINE_STEPS.map((stepKey, idx) => {
                const meta = STATUS_METAS[stepKey];
                const isCurrent = currentStatus === stepKey;
                const isPassed = !isRejected && currentStepIndex >= idx;

                return (
                  <button
                    key={stepKey}
                    type="button"
                    onClick={() => handleStatusClick(stepKey)}
                    disabled={statusUpdating}
                    className={`group relative flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                      isCurrent
                        ? `${meta.bgColor} ${meta.borderColor} ${meta.textColor} ring-1 ring-current`
                        : isPassed
                        ? 'bg-[#1A232C] border-[#232F3A] text-[#E6EDF2] hover:border-[#1FA98A]/40'
                        : 'bg-[#131A21] border-[#232F3A]/60 text-[#8B98A5] hover:border-[#232F3A] hover:text-[#E6EDF2]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full mb-1.5 flex items-center justify-center text-[11px] font-mono transition ${
                        isCurrent
                          ? 'bg-current text-[#0B0F14]'
                          : isPassed
                          ? 'bg-[#1FA98A]/20 text-[#1FA98A]'
                          : 'bg-[#1A232C] text-[#8B98A5]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Stepper on Mobile */}
          <div className="sm:hidden space-y-2">
            {PIPELINE_STEPS.map((stepKey, idx) => {
              const meta = STATUS_METAS[stepKey];
              const isCurrent = currentStatus === stepKey;
              const isPassed = !isRejected && currentStepIndex >= idx;

              return (
                <button
                  key={stepKey}
                  type="button"
                  onClick={() => handleStatusClick(stepKey)}
                  disabled={statusUpdating}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs font-bold transition cursor-pointer disabled:opacity-60 ${
                    isCurrent
                      ? `${meta.bgColor} ${meta.borderColor} ${meta.textColor} ring-1 ring-current`
                      : isPassed
                      ? 'bg-[#1A232C] border-[#232F3A] text-[#E6EDF2]'
                      : 'bg-[#131A21] border-[#232F3A]/60 text-[#8B98A5]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                        isCurrent
                          ? 'bg-current text-[#0B0F14]'
                          : isPassed
                          ? 'bg-[#1FA98A]/20 text-[#1FA98A]'
                          : 'bg-[#1A232C] text-[#8B98A5]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span>{meta.label}</span>
                  </div>
                  {isCurrent && <span className="text-[10px] font-mono">الحالية ✓</span>}
                </button>
              );
            })}
          </div>

          {/* Separate Rejected Action Button */}
          <div className="mt-4 pt-3 border-t border-[#232F3A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#8B98A5]">
              {isRejected ? (
                <span className="text-[#E1615E] font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  تم استبعاد هذا الطلب (الحالة: مرفوض)
                </span>
              ) : (
                <span>في حال عدم مطابقة المرشح للشروط، يمكنك استبعاد الطلب:</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleStatusClick('rejected')}
              disabled={statusUpdating || isRejected}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                isRejected
                  ? 'bg-[#E1615E]/20 text-[#E1615E] border border-[#E1615E]/40 cursor-default'
                  : 'bg-[#E1615E]/10 hover:bg-[#E1615E]/20 text-[#E1615E] border border-[#E1615E]/30'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isRejected ? 'الطلب مرفوض' : 'رفض الطلب (مرفوض)'}</span>
            </button>
          </div>
        </div>

        {/* Candidate Form Responses (`data`) */}
        <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-bold text-[#E6EDF2] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1FA98A]" />
              <span>بيانات وإجابات المرشح (Candidate Data)</span>
            </h2>
            <span className="text-[11px] text-[#8B98A5] font-mono">
              {Object.keys(application.data || {}).length} حقول
            </span>
          </div>

          <AdminApplicationDataViewer
            data={application.data || {}}
            formFields={offerInfo?.form_fields || []}
            layout="grid"
          />
        </div>

        {/* Copyable Forwarding Block */}
        <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#E6EDF2] flex items-center gap-2">
                <Copy className="w-4 h-4 text-[#1FA98A]" />
                <span>نص جاهز للإرسال للجهة</span>
              </h2>
              <p className="text-xs text-[#8B98A5] mt-0.5">
                نص منسق وجاهز للنسخ والإرسال عبر واتساب أو البريد لمسؤول التوظيف في الشركة.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyForwarding}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${
                copied
                  ? 'bg-[#1FA98A] text-[#0B0F14]'
                  : 'bg-[#1FA98A]/15 hover:bg-[#1FA98A]/25 border border-[#1FA98A]/30 text-[#1FA98A]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم النسخ ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ النص</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={Math.min(14, Math.max(6, forwardingText.split('\n').length + 1))}
              value={forwardingText}
              className="w-full p-3.5 bg-[#0B0F14] border border-[#232F3A] rounded-lg font-mono text-xs text-[#E6EDF2] leading-relaxed resize-none focus:outline-none select-all"
            />
          </div>
        </div>

        {/* Admin Notes */}
        <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#E6EDF2]">ملاحظات المسؤول (Admin Notes)</h2>
              {hasUnsavedNotes && (
                <span className="text-[11px] font-bold text-[#C9822A] bg-[#C9822A]/10 border border-[#C9822A]/20 px-2 py-0.5 rounded-full">
                  تعديلات غير محفوظة *
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={savingNotes || !hasUnsavedNotes}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#0B0F14] bg-[#1FA98A] hover:bg-[#18886F] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {savingNotes ? (
                <div className="w-3 h-3 border-2 border-[#0B0F14]/30 border-t-[#0B0F14] rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>حفظ الملاحظات</span>
            </button>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="اكتب هنا أي ملاحظات داخلية خاصة بالمرشح (مثل نتيجة المقابلة، التقييم، أو التوصيات)..."
            className="w-full p-3 bg-[#1A232C] border border-[#232F3A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] outline-none transition"
          />

          {notesSuccess && (
            <div className="mt-2 text-xs text-[#1FA98A] flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>تم حفظ الملاحظات بنجاح في قاعدة البيانات ✓</span>
            </div>
          )}

          {notesError && (
            <div className="mt-2 text-xs text-[#E1615E] flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{notesError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          dir="rtl"
        >
          <div className="bg-[#131A21] border border-[#232F3A] rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  confirmModal.targetStatus === 'rejected'
                    ? 'bg-[#E1615E]/15 text-[#E1615E] border border-[#E1615E]/30'
                    : 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                }`}
              >
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#E6EDF2]">{confirmModal.title}</h3>
                <p className="text-xs text-[#8B98A5] mt-1 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#232F3A]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={statusUpdating}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#8B98A5] hover:text-[#E6EDF2] bg-[#1A232C] hover:bg-[#1A232C]/80 border border-[#232F3A] transition cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => applyStatusUpdate(confirmModal.targetStatus)}
                disabled={statusUpdating}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white transition cursor-pointer ${
                  confirmModal.targetStatus === 'rejected'
                    ? 'bg-[#E1615E] hover:bg-[#d04f4c]'
                    : 'bg-[#22C55E] hover:bg-[#1eb054]'
                }`}
              >
                {statusUpdating ? 'جاري التحديث...' : 'تأكيد التغيير'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
