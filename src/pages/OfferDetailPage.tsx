import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, JobOffer, FormFieldDefinition } from '../lib/supabase';
import { getJobTypeConfig } from '../lib/jobTypes';
import { normalizeEgyptPhone } from '../lib/applicationUtils';
import { 
  ArrowRight, 
  ArrowLeft,
  Building2, 
  Check, 
  AlertCircle, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Send, 
  Clock, 
  MapPin, 
  Banknote,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  ShieldCheck,
  Lock,
  X,
  Copy
} from 'lucide-react';

interface FormStep {
  id: string;
  title: string;
  fields: FormFieldDefinition[];
  isFinalContactStep?: boolean;
}

export const OfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form values state
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [fileObjects, setFileObjects] = useState<Record<string, File>>({});

  // Fixed fields: candidate_name & candidate_whatsapp
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidateWhatsapp, setCandidateWhatsapp] = useState<string>('');
  const [consent, setConsent] = useState<boolean>(false);

  // Wizard state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isWizardActive, setIsWizardActive] = useState<boolean>(false);

  // Submission state: 'idle' | 'sending' | 'sent'
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  const wizardRef = useRef<HTMLDivElement | null>(null);
  const inputRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!id) return;
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('offers')
        .select('id, title, offer_type, company_name, details, form_fields, is_active, created_at')
        .eq('id', id)
        .single();

      if (queryError) {
        throw new Error(queryError.message);
      }

      setOffer(data);

      if (data?.form_fields && Array.isArray(data.form_fields)) {
        const initialValues: Record<string, any> = {};
        data.form_fields.forEach((field: FormFieldDefinition) => {
          initialValues[field.key] = '';
        });
        setDynamicValues(initialValues);
      }
    } catch (err: any) {
      console.error('Error fetching offer from Supabase:', err);
      setError('تعذر تحميل تفاصيل الوظيفة، تأكد من اتصالك بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  const handleDynamicChange = (key: string, value: any) => {
    setDynamicValues((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Clear error for this field
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    // Auto-sync if candidate name is typed in a full_name field
    if (key === 'full_name' || key === 'name' || key === 'candidate_name') {
      setCandidateName(value);
    }
    // Auto-sync if phone is typed in a phone field
    if (key === 'phone' || key === 'whatsapp') {
      if (!candidateWhatsapp) {
        setCandidateWhatsapp(value);
      }
    }
  };

  const handleCandidateNameChange = (val: string) => {
    setCandidateName(val);
    if (fieldErrors['candidate_name']) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next['candidate_name'];
        return next;
      });
    }
    // Also keep dynamic full_name in sync if present
    if (offer?.form_fields?.some(f => f.key === 'full_name')) {
      setDynamicValues(prev => ({ ...prev, full_name: val }));
    }
  };

  const handleCandidateWhatsappChange = (val: string) => {
    setCandidateWhatsapp(val);
    if (fieldErrors['candidate_whatsapp']) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next['candidate_whatsapp'];
        return next;
      });
    }
    if (offer?.form_fields?.some(f => f.key === 'phone')) {
      setDynamicValues(prev => ({ ...prev, phone: val }));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isAllowedFileType = (file: File): boolean => {
    const validExtensions = /\.(pdf|jpe?g|png)$/i;
    const validMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const hasValidExt = validExtensions.test(file.name);
    const hasValidMime = !file.type || validMimes.includes(file.type.toLowerCase());
    return hasValidExt && hasValidMime;
  };

  const isAllowedFileSize = (file: File): boolean => {
    return file.size <= 5 * 1024 * 1024;
  };

  const handleFileChange = (key: string, file: File | null) => {
    if (file) {
      if (!isAllowedFileType(file)) {
        setFieldErrors((prev) => ({
          ...prev,
          [key]: 'نوع الملف غير مدعوم، المسموح فقط: PDF أو JPG أو PNG.',
        }));
        setFileObjects((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setDynamicValues((prev) => ({ ...prev, [key]: '' }));
        return;
      }

      if (!isAllowedFileSize(file)) {
        setFieldErrors((prev) => ({
          ...prev,
          [key]: 'حجم الملف كبير جداً، الحد الأقصى المسموح به هو 5 ميجابايت.',
        }));
        setFileObjects((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setDynamicValues((prev) => ({ ...prev, [key]: '' }));
        return;
      }

      setFileObjects((prev) => ({ ...prev, [key]: file }));
      setDynamicValues((prev) => ({ ...prev, [key]: file.name }));
      if (fieldErrors[key]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    } else {
      setFileObjects((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setDynamicValues((prev) => ({ ...prev, [key]: '' }));
    }
  };

  // Scroll to and activate wizard
  const scrollToWizard = () => {
    setIsWizardActive(true);
    if (wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Build steps using heuristic
  const buildSteps = (): FormStep[] => {
    const rawFields = offer?.form_fields || [];

    // Categories
    const basicFields: FormFieldDefinition[] = [];
    const expFields: FormFieldDefinition[] = [];
    const docFields: FormFieldDefinition[] = [];
    const otherFields: FormFieldDefinition[] = [];

    rawFields.forEach((field) => {
      const matchText = `${field.key} ${field.label}`.toLowerCase();

      if (
        field.type === 'file' ||
        field.type === 'url' ||
        /cv|resume|file|photo|image|id_|national_id|بطاقة|صورة|ريكورد|صوت|vocaroo|voice|audio|link|رابط|مستند/i.test(matchText)
      ) {
        docFields.push(field);
      } else if (
        /name|اسم|age|سن|عمر|gender|نوع|sex|جنس|residence|city|governorate|address|location|عنوان|محافظة|منطقة|مكان/i.test(matchText)
      ) {
        basicFields.push(field);
      } else if (
        /exp|خبرة|grad|تخرج|edu|تعليم|مؤهل|univ|جامعة|faculty|كلية|lang|لغة|english|انجليزي/i.test(matchText)
      ) {
        expFields.push(field);
      } else {
        otherFields.push(field);
      }
    });

    const steps: FormStep[] = [];

    if (basicFields.length > 0) {
      steps.push({
        id: 'basics',
        title: 'بياناتك الأساسية',
        fields: basicFields,
      });
    }
    if (expFields.length > 0) {
      steps.push({
        id: 'experience',
        title: 'خبرتك',
        fields: expFields,
      });
    }
    if (docFields.length > 0) {
      steps.push({
        id: 'documents',
        title: 'المستندات',
        fields: docFields,
      });
    }
    if (otherFields.length > 0) {
      steps.push({
        id: 'questions',
        title: 'أسئلة الوظيفة',
        fields: otherFields,
      });
    }

    // Always append the fixed step titled "التواصل"
    steps.push({
      id: 'contact',
      title: 'التواصل',
      fields: [],
      isFinalContactStep: true,
    });

    return steps;
  };

  const steps = buildSteps();
  const totalFieldsCount = (offer?.form_fields?.length || 0) + 2;
  const isSingleStepForm = totalFieldsCount <= 2;

  // Validation function for current step
  const validateCurrentStep = (stepIndex: number): boolean => {
    const currentStep = steps[stepIndex];
    if (!currentStep) return true;

    const errors: Record<string, string> = {};
    let firstErrorKey: string | null = null;

    // Validate dynamic fields in this step
    for (const field of currentStep.fields) {
      if (field.type === 'file') {
        const file = fileObjects[field.key];
        if (file) {
          if (!isAllowedFileType(file)) {
            errors[field.key] = 'نوع الملف غير مدعوم، المسموح فقط: PDF أو JPG أو PNG.';
            if (!firstErrorKey) firstErrorKey = field.key;
          } else if (!isAllowedFileSize(file)) {
            errors[field.key] = 'حجم الملف كبير جداً، الحد الأقصى المسموح به هو 5 ميجابايت.';
            if (!firstErrorKey) firstErrorKey = field.key;
          }
        } else if (field.required && !dynamicValues[field.key]) {
          errors[field.key] = 'برجاء رفع الملف المطلوب للمتابعة.';
          if (!firstErrorKey) firstErrorKey = field.key;
        }
      } else if (field.required) {
        const val = dynamicValues[field.key];
        if (val === undefined || val === null || String(val).trim() === '') {
          const keyLower = field.key.toLowerCase();
          if (keyLower.includes('name') || keyLower.includes('اسم')) {
            errors[field.key] = 'اكتب اسمك بالكامل عشان نكمل.';
          } else if (keyLower.includes('phone') || keyLower.includes('موبايل')) {
            errors[field.key] = 'اكتب رقم الموبايل عشان نقدر نتواصل معاك.';
          } else if (keyLower.includes('voice') || keyLower.includes('vocaroo') || keyLower.includes('صوت')) {
            errors[field.key] = 'برجاء وضع رابط الريكورد الصوتي للمتابعة.';
          } else if (field.type === 'select') {
            errors[field.key] = 'اختار إجابة من القائمة.';
          } else {
            errors[field.key] = 'برجاء ملء هذا الحقل للمتابعة.';
          }
          if (!firstErrorKey) firstErrorKey = field.key;
        }
      }
    }

    // Validate final contact step fields
    if (currentStep.isFinalContactStep) {
      if (!candidateName.trim()) {
        errors['candidate_name'] = 'اكتب اسمك بالكامل عشان نكمل.';
        if (!firstErrorKey) firstErrorKey = 'candidate_name';
      }
      const digitsOnly = candidateWhatsapp.replace(/\D/g, '');
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        errors['candidate_whatsapp'] = 'اكتب رقم واتساب صحيح (أرقام فقط)';
        if (!firstErrorKey) firstErrorKey = 'candidate_whatsapp';
      }
    }

    setFieldErrors(errors);

    if (firstErrorKey && inputRefs.current[firstErrorKey]) {
      inputRefs.current[firstErrorKey]?.focus();
      inputRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep(currentStepIndex)) {
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      // Smooth scroll back to top of wizard
      if (wizardRef.current) {
        wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      if (wizardRef.current) {
        wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const generateReferenceCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789';
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[array[i] % chars.length];
    }
    return `JM-${code}`;
  };

  const handleCopyReferenceCode = async () => {
    if (!referenceCode) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(referenceCode);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = referenceCode;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all steps if single form, or current step if wizard
    if (isSingleStepForm) {
      // Validate everything
      for (let i = 0; i < steps.length; i++) {
        if (!validateCurrentStep(i)) return;
      }
    } else {
      if (!validateCurrentStep(currentStepIndex)) return;
    }

    // Required consent validation
    if (!consent) {
      setFieldErrors((prev) => ({
        ...prev,
        consent: 'يجب الموافقة على الشروط للمتابعة وإرسال الطلب.',
      }));
      return;
    }

    if (!offer) {
      setSubmitError('تفاصيل الوظيفة غير مكتملة.');
      return;
    }

    // Browser-side duplicate prevention (same number in two formats):
    // convert the WhatsApp number to one canonical form before insert, so the
    // database unique constraint catches the same number regardless of the
    // format the applicant typed (01x / +201x / 00201x ...).
    const normalizedWhatsapp = normalizeEgyptPhone(candidateWhatsapp);
    if (!normalizedWhatsapp) {
      setFieldErrors((prev) => ({
        ...prev,
        candidate_whatsapp: 'اكتب رقم واتساب صحيح (أرقام فقط)',
      }));
      if (inputRefs.current['candidate_whatsapp']) {
        inputRefs.current['candidate_whatsapp']?.focus();
        inputRefs.current['candidate_whatsapp']?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setSubmitStatus('sending');

    try {
      const finalData: Record<string, any> = { ...dynamicValues };

      // Handle file uploads to Supabase Storage bucket "application-files"
      for (const [key, file] of Object.entries(fileObjects)) {
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${offer.id}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${sanitizedFileName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('application-files')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadErr) {
          throw new Error(uploadErr.message);
        }

        finalData[key] = {
          storage_path: uploadData.path,
          file_name: file.name,
          size: file.size,
        };
      }

      // Add required consent to application data
      finalData.consent = true;
      finalData.consented_at = new Date().toISOString();

      const generatedRefCode = generateReferenceCode();
      finalData.reference_code = generatedRefCode;

      // Insert directly into Supabase applications table (no .select() to avoid RLS error on anon insert)
      const payload = {
        offer_id: offer.id,
        candidate_name: candidateName.trim(),
        candidate_whatsapp: normalizedWhatsapp,
        status: 'submitted',
        data: finalData,
      };

      const { error: insertError } = await supabase
        .from('applications')
        .insert(payload);

      if (insertError) {
        if (insertError.code === '23505') {
          setSubmitStatus('idle');
          setSubmitError('إنت قدّمت على الوظيفة دي قبل كده بنفس رقم الواتساب. لو محتاج تعدّل بياناتك كلمنا.');
          setSubmitting(false);
          return;
        }
        throw new Error(insertError.message);
      }

      setReferenceCode(generatedRefCode);
      setSubmitStatus('sent');
      setTimeout(() => {
        setSubmitSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitStatus('idle');
      if (err?.code === '23505') {
        setSubmitError('إنت قدّمت على الوظيفة دي قبل كده بنفس رقم الواتساب. لو محتاج تعدّل بياناتك كلمنا.');
      } else {
        setSubmitError('حصل خطأ أثناء إرسال طلبك، جرب تاني.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to translate field label to friendly Egyptian Arabic if in English
  const getFieldArabicLabel = (field: FormFieldDefinition) => {
    const key = field.key.toLowerCase();
    const label = field.label;

    if (key === 'full_name' || key === 'name') return 'الاسم بالكامل';
    if (key === 'phone') return 'رقم الموبايل';
    if (key === 'voice_note') return 'رابط الريكورد الصوتي (Vocaroo)';
    if (key === 'national_id') return 'الرقم القومي (14 رقم)';
    if (key === 'cv') return 'السيرة الذاتية (CV)';
    if (key === 'age') return 'السن';
    if (key === 'city' || key === 'location') return 'المدينة / منطقة السكن';
    if (key === 'gender') return 'النوع';
    if (key === 'experience') return 'سنوات الخبرة';
    if (key === 'english') return 'مستوى اللغة الإنجليزية';

    return label;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12" dir="rtl">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-10 bg-slate-200 rounded w-3/4"></div>
          <div className="h-28 bg-white border border-[#E2E8F0] rounded-[16px]"></div>
          <div className="h-44 bg-white border border-[#E2E8F0] rounded-[16px]"></div>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center" dir="rtl">
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-xs">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0A2540] mb-1">تعذر فتح الوظيفة</h2>
          <p className="text-sm text-[#5A6B7E] mb-5">{error || 'الوظيفة غير متاحة حالياً.'}</p>
          <Link
            to="/jobs"
            className="inline-flex items-center justify-center gap-2 bg-[#0F4C81] text-white font-bold text-sm px-5 py-2.5 rounded-[12px] hover:bg-[#0C3D68] transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للوظائف المتاحة</span>
          </Link>
        </div>
      </div>
    );
  }

  // Success State (Section G): One animated check, title, summary card, return button, NO confetti
  if (submitSuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10" dir="rtl">
        <div className="animate-pop bg-white border border-[#E2E8F0] rounded-[24px] p-6 sm:p-8 text-center shadow-soft">
          {/* Animated check: circle scales .8->1 once, path draws once, ~400ms */}
          <div className="w-16 h-16 bg-[#E3EEF7] text-[#0F4C81] border border-[#0F4C81]/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-check-circle">
            <svg
              className="w-8 h-8 text-[#0F4C81]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" className="animate-check-path" />
            </svg>
          </div>

          <h1
            className="animate-fade-up text-2xl font-extrabold text-[#0A2540] mb-2"
            style={{ animationDelay: '100ms' }}
          >
            تم تقديم طلبك بنجاح
          </h1>

          <p
            className="animate-fade-up text-sm text-[#5A6B7E] leading-relaxed mb-6"
            style={{ animationDelay: '180ms' }}
          >
            بياناتك اتسجلت بنجاح، وطلبك أصبح لدى فريق التوظيف للمراجعة.
          </p>

          {/* Reference Code Card */}
          {referenceCode && (
            <div
              className="animate-fade-up bg-white border border-[#E2E8F0] rounded-[16px] p-5 text-center mb-6 shadow-xs"
              style={{ animationDelay: '260ms' }}
            >
              <div className="text-xs font-bold text-[#5A6B7E] mb-1.5">رقم طلبك المرجعي</div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-[#0F4C81] mb-3 select-all" dir="ltr">
                {referenceCode}
              </div>
              <div className="flex justify-center mb-2.5">
                <button
                  type="button"
                  onClick={handleCopyReferenceCode}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-[10px] border border-[#0F4C81]/20 bg-[#E3EEF7] text-[#0F4C81] hover:bg-[#D3E2F0] transition active:scale-95 cursor-pointer"
                >
                  {copiedRef ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#0F4C81]" />
                      <span>تم النسخ ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#0F4C81]" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[#5A6B7E]">
                احتفظ بالرقم ده — استخدمه لو راسلتنا عن طلبك
              </p>
            </div>
          )}

          {/* Small summary card */}
          <div
            className="animate-fade-up bg-[#F7F9FC] border border-[#EDF1F6] rounded-[16px] p-4 text-right mb-8"
            style={{ animationDelay: '340ms' }}
          >
            <div className="text-xs font-medium text-[#5A6B7E] mb-1">تفاصيل الطلب:</div>
            <div className="text-base font-bold text-[#0A2540] mb-0.5">{offer.title}</div>
            <div className="text-sm text-[#5A6B7E] font-medium mb-3">{offer.company_name}</div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F4C81] bg-[#E3EEF7] border border-[#0F4C81]/20 px-3 py-1 rounded-full">
              <span>● تم استلام الطلب</span>
            </div>
          </div>

          {/* Single return button */}
          <Link
            to="/jobs"
            className="w-full inline-flex items-center justify-center gap-2 bg-[#0F4C81] hover:bg-[#0C3D68] text-white font-bold text-base px-6 py-3.5 rounded-[12px] transition shadow-xs"
          >
            <span>العودة للوظائف</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const details = offer.details || {};
  const salary = details.salary || details.المرتب;
  const location = details.location || details.المكان;
  const shift = details.shift || details.الشفت || details.مواعيد;

  // Extract criteria for "هل الوظيفة دي مناسبة ليك؟" (Section C)
  const checklistItems: string[] = [];

  // Age
  const ageVal =
    details.age ||
    details.age_range ||
    details.age_limit ||
    details.السن ||
    (details.age_min && details.age_max
      ? `من ${details.age_min} إلى ${details.age_max} سنة`
      : details.age_min
      ? `من ${details.age_min} سنة`
      : details.age_max
      ? `حتى ${details.age_max} سنة`
      : null);
  if (ageVal) {
    checklistItems.push(`السن: ${ageVal}`);
  }

  // Gender
  const rawGender = details.gender_requirement || details.gender || details.النوع || details.الجنس;
  const genderVal =
    rawGender === 'male'
      ? 'ذكور فقط'
      : rawGender === 'female'
      ? 'إناث فقط'
      : rawGender === 'either'
      ? 'ذكور وإناث'
      : rawGender;
  if (genderVal) {
    checklistItems.push(`متاح لـ: ${genderVal}`);
  }

  // Nationality
  if (details.nationality_requirement) {
    checklistItems.push(`الجنسية: ${details.nationality_requirement}`);
  }

  // Experience
  const expVal = details.experience || details.experience_years || details.الخبرة;
  if (expVal) {
    checklistItems.push(`الخبرة: ${expVal}`);
  }

  // Education / Graduation
  const eduVal = details.education || details.graduation || details.qualification || details.المؤهل || details.التعليم;
  if (eduVal) {
    checklistItems.push(`المؤهل: ${eduVal}`);
  }

  // Language
  const langVal = details.language || details.language_level || details.english || details.الانجليزي || details.اللغة;
  if (langVal) {
    checklistItems.push(`مستوى اللغة: ${langVal}`);
  }

  // Requirements (الشروط) from details.requirements or details.الشروط or details.متطلبات
  const rawRequirements = details.requirements || details.الشروط || details.متطلبات;
  if (Array.isArray(rawRequirements)) {
    rawRequirements.forEach((req: string) => {
      if (req && typeof req === 'string' && req.trim()) {
        checklistItems.push(req.trim());
      }
    });
  } else if (typeof rawRequirements === 'string' && rawRequirements.trim()) {
    checklistItems.push(rawRequirements.trim());
  }

  // Notes (ملاحظات)
  const notesVal = details.notes || details.ملاحظات;
  const notesText = typeof notesVal === 'string' && notesVal.trim() ? notesVal.trim() : null;

  // Extract benefits (Section D)
  const benefitsList: string[] = [];
  const rawBenefits = details.benefits || details.perks || details.المميزات || details.مميزات;
  if (Array.isArray(rawBenefits)) {
    rawBenefits.forEach((b: string) => {
      if (b && typeof b === 'string') benefitsList.push(b);
    });
  } else if (typeof rawBenefits === 'string' && rawBenefits.trim()) {
    benefitsList.push(rawBenefits);
  }

  const currentStep = steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-24" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Link */}
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#5A6B7E] hover:text-[#0A2540] mb-5 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>كل الوظائف</span>
        </Link>

        {/* Section A: Hero Section - 24px radius hierarchy */}
        {(() => {
          const jobType = getJobTypeConfig(offer.offer_type);
          const JobIcon = jobType.icon;

          return (
            <div className="animate-fade-up bg-white border border-[#E2E8F0] rounded-[24px] p-5 sm:p-7 shadow-soft mb-5">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: jobType.softBg,
                    borderColor: 'color-mix(in srgb, var(--c-accent) 20%, transparent)',
                  }}
                  title={jobType.label}
                >
                  <JobIcon className="w-7 h-7" style={{ color: jobType.accent }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0F4C81] bg-[#E3EEF7] border border-[#0F4C81]/15 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F4C81] animate-pulse"></span>
                      <span>التقديم مفتوح</span>
                    </span>

                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: jobType.softBg,
                        borderColor: 'color-mix(in srgb, var(--c-accent) 20%, transparent)',
                        color: jobType.accent,
                      }}
                    >
                      {jobType.label}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A2540] leading-snug">
                    {offer.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-[#5A6B7E] font-medium mt-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#5A6B7E]/70 shrink-0" />
                      <span>{offer.company_name}</span>
                    </div>
                    {offer.details?.governorate && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F4C81] bg-[#E3EEF7] px-2 py-0.5 rounded-[8px]">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{offer.details.governorate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section E: CTA Button 1 right after Hero */}
              <div className="mt-5 pt-4 border-t border-[#EDF1F6] flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={scrollToWizard}
                  className="hidden sm:inline-flex w-full items-center justify-center gap-2 bg-[#0F4C81] hover:bg-[#0C3D68] text-white font-bold text-base py-3 px-6 rounded-[12px] transition-all active:scale-95 hover:shadow-lg shadow-xs cursor-pointer"
                >
                  <span>قدّم على الوظيفة</span>
                  <Sparkles className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const shareText = `وظيفة: ${offer.title} — ${offer.company_name}\nالتفاصيل والتقديم من هنا: ${window.location.href}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] text-[#0F4C81] font-bold text-sm sm:text-base py-3.5 px-4 rounded-[16px] transition-all active:scale-95 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5 fill-current shrink-0 text-[#0F4C81]"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>شارك على واتساب</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Section B: Highlight Cards (Salary, Location, Shift) with Colored Icon Chips on Neutral Cards */}
        {(salary || location || shift) && (
          <div className="animate-fade-up grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {salary && (
              <div className="bg-white border border-[#E2E8F0] border-r-[3px] border-r-[#C9822A] rounded-[16px] p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#C9822A]/15 border border-[#C9822A]/25 text-[#C9822A] flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5 text-[#C9822A]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#5A6B7E] mb-0.5">المرتب</div>
                    <div className="text-sm sm:text-base font-bold text-[#0A2540] leading-tight">
                      {salary}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {location && (
              <div className="bg-white border border-[#E2E8F0] border-r-[3px] border-r-[#0F4C81] rounded-[16px] p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F4C81]/15 border border-[#0F4C81]/25 text-[#0F4C81] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#0F4C81]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#5A6B7E] mb-0.5">مكان الشغل</div>
                    <div className="text-sm sm:text-base font-bold text-[#0A2540] leading-tight">
                      {location}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {shift && (
              <div className="bg-white border border-[#E2E8F0] border-r-[3px] border-r-[#0F4C81] rounded-[16px] p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F4C81]/15 border border-[#0F4C81]/25 text-[#0F4C81] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#0F4C81]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#5A6B7E] mb-0.5">مواعيد العمل</div>
                    <div className="text-sm sm:text-base font-bold text-[#0A2540] leading-tight">
                      {shift}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section C: هل الوظيفة دي مناسبة ليك؟ */}
        {checklistItems.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 shadow-xs mb-5">
            <h2 className="text-base sm:text-lg font-bold text-[#0A2540] mb-3.5">
              هل الوظيفة دي مناسبة ليك؟
            </h2>
            <div className="space-y-2.5">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-start gap-2.5 text-sm text-[#0A2540]">
                  <div className="w-5 h-5 rounded-full bg-[#E3EEF7] border border-[#0F4C81]/15 flex items-center justify-center text-[#0F4C81] shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="font-medium leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section D: المميزات (Benefits) - Mint #3F967F Chips */}
        {benefitsList.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 shadow-xs mb-5">
            <h2 className="text-base sm:text-lg font-bold text-[#0A2540] mb-3.5">
              المميزات
            </h2>
            <div className="space-y-2.5">
              {benefitsList.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2.5 text-sm text-[#0A2540]">
                  <div className="w-6 h-6 rounded-full bg-[#3F967F]/20 border border-[#3F967F]/35 flex items-center justify-center text-[#3F967F] shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="font-medium leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: ملاحظات (Notes) */}
        {notesText && (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 shadow-xs mb-5">
            <h2 className="text-base sm:text-lg font-bold text-[#0A2540] mb-2.5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5A6B7E]" />
              <span>ملاحظات</span>
            </h2>
            <p className="text-sm text-[#0A2540] font-medium leading-relaxed whitespace-pre-wrap">
              {notesText}
            </p>
          </div>
        )}

        {/* 3. قبل ما تقدم Box above the apply CTA */}
        <div className="bg-[#E3EEF7] border border-[#C9822A]/25 rounded-[16px] p-5 mb-5 text-right">
          <div className="flex items-center gap-2 text-[#C9822A] font-bold text-sm sm:text-base mb-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>قبل ما تقدم:</span>
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-[#0A2540] leading-relaxed font-medium">
            <div className="flex items-start gap-2">
              <span className="text-[#C9822A] font-bold shrink-0">•</span>
              <span>راجع الشروط كويس وتأكد إن متطلبات الوظيفة وسنّك مناسبين ليك.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#C9822A] font-bold shrink-0">•</span>
              <span>اتأكد إن بياناتك ورقم الواتساب مكتوبين بدقة عشان نقدر نتواصل معاك بسهولة.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#C9822A] font-bold shrink-0">•</span>
              <span>جهز الملفات المطلوبة (زي السيرة الذاتية أو صورة البطاقة) لو الوظيفة طلباها.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#C9822A] font-bold shrink-0">•</span>
              <span>بعض الوظائف بتتطلب مقابلة شخصية أو مكالمة تليفونية قبل القبول النهائي.</span>
            </div>
          </div>
        </div>

        {/* Section E: CTA Button 2 after requirements & benefits */}
        <div className="mb-8">
          <button
            type="button"
            onClick={scrollToWizard}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#0F4C81] hover:bg-[#0C3D68] text-white font-bold text-base py-3.5 px-6 rounded-[12px] transition shadow-xs cursor-pointer"
          >
            <span>قدّم على الوظيفة</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Section F: Multi-step Application Wizard */}
        <div ref={wizardRef} className="scroll-mt-6">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-xs overflow-hidden">
            {/* Wizard Header / Intro copy */}
            <div className="p-5 sm:p-6 border-b border-[#EDF1F6] bg-[#F7F9FC]/70">
              <p className="text-xs sm:text-sm text-[#5A6B7E] leading-relaxed font-medium">
                جاهز؟ خلينا نقدمك 👋 — التقديم بياخد كام دقيقة حسب متطلبات الوظيفة، هنطلب منك بس البيانات المطلوبة للوظيفة دي.
              </p>

              {/* Progress Indicator with 250ms transition (if multi-step) */}
              {!isSingleStepForm && steps.length > 1 && (
                <div className="mt-4 pt-4 border-t border-[#E2E8F0]/80">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A2540] mb-2">
                    <span className="text-[#0F4C81]">
                      الخطوة {currentStepIndex + 1} من {steps.length}: {currentStep.title}
                    </span>
                    <span className="text-[#5A6B7E] font-mono">
                      {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
                    </span>
                  </div>

                  {/* Smooth progress bar with 250ms transition */}
                  <div className="w-full bg-[#E3EEF7] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0F4C81] h-full rounded-full transition-[width] duration-250 ease-out"
                      style={{ width: `${Math.round(((currentStepIndex + 1) / steps.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner if submit fails */}
            {submitError && (
              <div className="m-5 p-4 bg-red-50 border border-red-200 rounded-[12px] flex items-start gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm font-medium">
                  {submitError}
                </div>
              </div>
            )}

            {/* Form Step Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-5 sm:p-6 space-y-5">
                {/* Single Step Form: Render all steps fields */}
                {isSingleStepForm ? (
                  <>
                    {offer.form_fields?.map((field) => renderFieldInput(field))}
                    {renderFixedContactFields()}
                  </>
                ) : (
                  /* Multi-step: Render current step fields */
                  <>
                    {!currentStep.isFinalContactStep && (
                      <div className="space-y-4">
                        {currentStep.fields.map((field) => renderFieldInput(field))}
                      </div>
                    )}

                    {currentStep.isFinalContactStep && renderFixedContactFields()}
                  </>
                )}

                {/* 5. Required Consent Checkbox before submit */}
                {(isSingleStepForm || currentStepIndex === steps.length - 1) && (
                  <div className="pt-3 border-t border-[#EDF1F6]">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs sm:text-sm text-[#0A2540] font-medium leading-relaxed select-none">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => {
                          setConsent(e.target.checked);
                          if (e.target.checked && fieldErrors['consent']) {
                            setFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next['consent'];
                              return next;
                            });
                          }
                        }}
                        className="w-4 h-4 mt-0.5 rounded border-[#E2E8F0] text-[#0F4C81] focus:ring-[#0F4C81] cursor-pointer shrink-0"
                      />
                      <span>
                        أوافق على استخدام بياناتي وصوري لأغراض التوظيف ومشاركتها مع الجهة المسؤولة
                        عن الوظيفة وفقًا لـ{' '}
                        <Link
                          to="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0F4C81] font-bold underline underline-offset-2 hover:text-[#0C3D68] transition-colors"
                        >
                          سياسة الخصوصية
                        </Link>
                        . <span className="text-red-500">*</span>
                      </span>
                    </label>
                    {fieldErrors['consent'] && (
                      <p className="text-xs font-semibold text-red-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors['consent']}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Wizard Bottom Controls & Trust Line */}
              <div className="p-4 sm:p-5 bg-[#F7F9FC] border-t border-[#EDF1F6] flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  {!isSingleStepForm && currentStepIndex > 0 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F7F9FC] text-[#5A6B7E] font-bold text-sm px-4 py-2.5 rounded-[12px] transition cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>رجوع</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {!isSingleStepForm && currentStepIndex < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0C3D68] text-white font-bold text-sm px-6 py-2.5 rounded-[12px] transition shadow-xs cursor-pointer"
                    >
                      <span>التالي</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    /* Submit button with states: "إرسال طلب التقديم" → "جاري الإرسال..." → "تم الإرسال ✓" */
                    <button
                      type="submit"
                      disabled={submitting || submitStatus === 'sent'}
                      className={`inline-flex items-center gap-2 font-bold text-sm px-6 py-2.5 rounded-[12px] transition shadow-xs cursor-pointer ${
                        submitStatus === 'sent'
                          ? 'bg-[#1FA98A] text-white'
                          : 'bg-[#0F4C81] hover:bg-[#0C3D68] text-white disabled:opacity-50'
                      }`}
                    >
                      {submitStatus === 'sending' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>جاري الإرسال...</span>
                        </>
                      ) : submitStatus === 'sent' ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>تم الإرسال ✓</span>
                        </>
                      ) : (
                        <>
                          <span>إرسال طلب التقديم</span>
                          <Send className="w-4 h-4 rotate-180" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* 5. Trust Line under final submit button */}
                {(isSingleStepForm || currentStepIndex === steps.length - 1) && (
                  <div className="pt-3 border-t border-[#EDF1F6] flex items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-[#5A6B7E] font-medium w-full">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0F4C81]" />
                      <span>تقديم مباشر</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-[#0F4C81]" />
                      <span>بياناتك محفوظة</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F4C81]" />
                      <span>التقديم أونلاين</span>
                    </span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA Bar while reading (Section E) */}
      {!isWizardActive && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-[#E3EEF7] p-3 z-30 sm:hidden shadow-lg">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#0A2540] truncate">{offer.title}</div>
              {salary ? (
                <div className="text-[11px] text-[#0F4C81] font-semibold">{salary}</div>
              ) : (
                <div className="text-[11px] text-[#5A6B7E] font-medium">التقديم متاح الآن</div>
              )}
            </div>

            <button
              type="button"
              onClick={scrollToWizard}
              className="inline-flex items-center justify-center gap-1.5 bg-[#0F4C81] text-white font-bold text-sm px-5 py-2.5 rounded-[12px] shadow-xs shrink-0 cursor-pointer hover:bg-[#0C3D68]"
            >
              <span>قدّم الآن</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render individual dynamic form fields
  function renderFieldInput(field: FormFieldDefinition) {
    const value = dynamicValues[field.key] ?? '';
    const errorMsg = fieldErrors[field.key];
    const isError = Boolean(errorMsg);
    const label = getFieldArabicLabel(field);

    return (
      <div key={field.key} className="space-y-1.5 text-right">
        {field.type !== 'file' ? (
          <label className="block text-xs sm:text-sm font-bold text-[#0A2540]">
            {label}
            {field.required && <span className="text-red-500 mr-1">*</span>}
          </label>
        ) : fileObjects[field.key] ? (
          <label className="block text-xs sm:text-sm font-bold text-[#0A2540]">
            {label}
            {field.required && <span className="text-red-500 mr-1">*</span>}
          </label>
        ) : null}

        {/* Text Input */}
        {field.type === 'text' && (
          <input
            ref={(el) => {
              inputRefs.current[field.key] = el;
            }}
            type="text"
            value={value}
            onChange={(e) => handleDynamicChange(field.key, e.target.value)}
            placeholder={`اكتب ${label.toLowerCase()}`}
            className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm transition outline-none ${
              isError
                ? 'border-red-400 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                : 'border-[#E2E8F0] focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15'
            }`}
          />
        )}

        {/* Number Input */}
        {field.type === 'number' && (
          <input
            ref={(el) => {
              inputRefs.current[field.key] = el;
            }}
            type="number"
            value={value}
            onChange={(e) => handleDynamicChange(field.key, e.target.value)}
            placeholder="أدخل الرقم"
            className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm transition outline-none ${
              isError
                ? 'border-red-400 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                : 'border-[#E2E8F0] focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15'
            }`}
          />
        )}

        {/* Select Dropdown */}
        {field.type === 'select' && (
          <select
            ref={(el) => {
              inputRefs.current[field.key] = el;
            }}
            value={value}
            onChange={(e) => handleDynamicChange(field.key, e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-[12px] border text-sm bg-white transition outline-none ${
              isError
                ? 'border-red-400 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                : 'border-[#E2E8F0] focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15'
            }`}
          >
            <option value="">-- اختار من القائمة --</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        {/* URL Input (e.g. Vocaroo Voice Note) */}
        {field.type === 'url' && (
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#5A6B7E]">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              ref={(el) => {
                inputRefs.current[field.key] = el;
              }}
              type="url"
              dir="ltr"
              value={value}
              onChange={(e) => handleDynamicChange(field.key, e.target.value)}
              placeholder="https://vocaroo.com/..."
              className={`w-full pr-10 pl-3.5 py-2.5 rounded-[12px] border text-sm font-mono transition outline-none text-left ${
                isError
                  ? 'border-red-400 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                  : 'border-[#E2E8F0] focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15'
              }`}
            />
          </div>
        )}

        {/* File Upload Dropzone / Selected Row */}
        {field.type === 'file' && (
          <div
            ref={(el) => {
              inputRefs.current[field.key] = el;
            }}
          >
            {!fileObjects[field.key] ? (
              /* Dropzone block when no file selected */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = e.dataTransfer.files;
                  if (files && files[0]) {
                    handleFileChange(field.key, files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-[16px] p-6 text-center transition-colors ${
                  isError
                    ? 'border-red-300 bg-red-50/20'
                    : 'border-[#E2E8F0] bg-[#F7F9FC] hover:bg-[#F4EFE6]/40 hover:border-[#0F4C81]/40'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-2.5 rounded-full bg-[#E3EEF7] border border-[#0F4C81]/15 text-[#0F4C81] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-[#0A2540] mb-1">
                  {label}
                  {field.required && <span className="text-red-500 mr-1">*</span>}
                </div>
                <p className="text-xs text-[#5A6B7E] mb-3.5 font-medium">
                  PDF أو صورة — حتى 5MB
                </p>
                <label className="inline-flex items-center justify-center gap-1.5 bg-[#0F4C81] hover:bg-[#0C3D68] text-white text-xs font-bold px-4 py-2.5 rounded-[12px] transition cursor-pointer shadow-xs">
                  <span>اختيار الملف</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(e) => {
                      const files = e.target.files;
                      handleFileChange(field.key, files && files[0] ? files[0] : null);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              /* Selected file row */
              <div className="flex items-center justify-between p-3.5 bg-[#F7F9FC] border border-[#E3EEF7] rounded-[12px] transition">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-full bg-[#E3EEF7] border border-[#0F4C81]/20 text-[#0F4C81] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#0A2540] truncate">
                      {fileObjects[field.key].name}
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#5A6B7E] font-mono shrink-0">
                      ({formatFileSize(fileObjects[field.key].size)})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFileChange(field.key, null)}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-[#5A6B7E] hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                  title="حذف الملف"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Inline Error Message */}
        {isError && (
          <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </p>
        )}
      </div>
    );
  }

  // Helper to render fixed contact step
  function renderFixedContactFields() {
    const isNameError = Boolean(fieldErrors['candidate_name']);
    const isWhatsappError = Boolean(fieldErrors['candidate_whatsapp']);

    return (
      <div className="space-y-4">
        {/* candidate_name */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#0A2540]">
            الاسم بالكامل <span className="text-red-500 mr-1">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#5A6B7E]">
              <User className="w-4 h-4" />
            </div>
            <input
              ref={(el) => {
                inputRefs.current['candidate_name'] = el;
              }}
              type="text"
              value={candidateName}
              onChange={(e) => handleCandidateNameChange(e.target.value)}
              placeholder="اكتب اسمك الثلاثي أو الرباعي"
              className={`w-full pr-10 pl-3.5 py-2.5 rounded-[12px] border text-sm transition outline-none ${
                isNameError
                  ? 'border-red-400 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                  : 'border-[#E2E8F0] focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15'
              }`}
            />
          </div>
          {isNameError && (
            <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors['candidate_name']}</span>
            </p>
          )}
        </div>

        {/* candidate_whatsapp */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#0A2540]">
            رقم WhatsApp <span className="text-red-500 mr-1">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#5A6B7E]">
              <Phone className="w-4 h-4" />
            </div>
            <input
              ref={(el) => {
                inputRefs.current['candidate_whatsapp'] = el;
              }}
              type="tel"
              dir="ltr"
              value={candidateWhatsapp}
              onChange={(e) => handleCandidateWhatsappChange(e.target.value)}
              placeholder="01XXXXXXXXX"
              className={`w-full pr-10 pl-3.5 py-2.5 rounded-[12px] border text-sm transition outline-none font-mono text-left ${
                isWhatsappError
                  ? 'border-red-400 bg-red-50/20 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                  : 'border-[#E2E8F0] focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/15'
              }`}
            />
          </div>
          {offer?.details?.nationality_requirement === 'مصريين وأجانب' && (
            <p className="text-xs text-[#0F4C81] font-medium bg-[#0F4C81]/10 border border-[#0F4C81]/20 rounded-lg px-2.5 py-1.5 mt-1">
              لو رقمك مش مصري اكتبه بكود الدولة، مثال: +249...
            </p>
          )}
          <p className="text-xs text-[#5A6B7E] font-medium">
            هنستخدمه للتواصل معاك لو احتجنا أي معلومة بخصوص طلبك.
          </p>
          {isWhatsappError && (
            <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{fieldErrors['candidate_whatsapp']}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
};
