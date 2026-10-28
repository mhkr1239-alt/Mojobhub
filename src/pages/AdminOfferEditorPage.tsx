import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, JobOffer, FormFieldDefinition } from '../lib/supabase';
import { AdminNav } from '../components/AdminNav';
import { 
  ArrowRight, 
  Save, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Briefcase, 
  Sparkles, 
  Layers, 
  FileText, 
  Info, 
  Building2, 
  Phone, 
  Globe, 
  Tag, 
  Clock, 
  MapPin, 
  Banknote, 
  UserCheck, 
  User, 
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowDownToLine
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SuggestedField extends FormFieldDefinition {
  reason: string;
}

export const AdminOfferEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Active tab state
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'form'>('basic');

  // Loading & notification states
  const [initialLoading, setInitialLoading] = useState<boolean>(isEditing);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { session } = useAuth();

  // AI Job Builder state
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(true);
  const [adText, setAdText] = useState<string>('');
  const [analyzingAd, setAnalyzingAd] = useState<boolean>(false);
  const [aiError, setAiError] = useState<{
    isAllKeys?: boolean;
    isModelNotFound?: boolean;
    message: string;
    rawDetails?: string | null;
  } | null>(null);
  const [aiExtracted, setAiExtracted] = useState<any | null>(null);
  const [usedKey, setUsedKey] = useState<string>('');
  const [selectedAiFieldKeys, setSelectedAiFieldKeys] = useState<Set<string>>(new Set());
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  // Raw original offer to preserve any unedited custom fields
  const [originalDetails, setOriginalDetails] = useState<Record<string, any>>({});

  // 1. Basic Info tab state
  const [title, setTitle] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [offerType, setOfferType] = useState<string>('call_center');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // 2. Details tab state
  const [salary, setSalary] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [shift, setShift] = useState<string>('');
  const [ageMin, setAgeMin] = useState<string>('');
  const [ageMax, setAgeMax] = useState<string>('');
  const [genderRequirement, setGenderRequirement] = useState<string>('either');
  const [nationalityRequirement, setNationalityRequirement] = useState<string>('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefitInput, setNewBenefitInput] = useState<string>('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [newRequirementInput, setNewRequirementInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // 3. Application Form tab state
  const [formFields, setFormFields] = useState<FormFieldDefinition[]>([]);
  const [dismissedSuggestionKeys, setDismissedSuggestionKeys] = useState<string[]>([]);

  // Fetch existing offer if editing
  useEffect(() => {
    if (!isEditing || !id) return;

    const loadOffer = async () => {
      setInitialLoading(true);
      try {
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('لم يتم العثور على الوظيفة المطلوبة.');

        // Fill Basic Info
        setTitle(data.title || '');
        setCompanyName(data.company_name || '');
        setOfferType(data.offer_type || 'call_center');
        setWhatsappNumber(data.whatsapp_number || '');
        setIsActive(data.is_active ?? true);

        // Fill Details
        const det = data.details || {};
        setOriginalDetails(det);
        setSalary(det.salary || det.المرتب || '');
        setLocation(det.location || det.المكان || '');
        setShift(det.shift || det.الشفت || det.مواعيد || '');
        setAgeMin(det.age_min ? String(det.age_min) : '');
        setAgeMax(det.age_max ? String(det.age_max) : '');
        setGenderRequirement(det.gender_requirement || det.gender || 'either');
        setNationalityRequirement(det.nationality_requirement || det.nationality || '');

        // Benefits (can be array or string)
        let loadedBenefits: string[] = [];
        const rawB = det.benefits || det.المميزات || det.perks;
        if (Array.isArray(rawB)) {
          loadedBenefits = rawB.map(String);
        } else if (typeof rawB === 'string' && rawB.trim()) {
          loadedBenefits = [rawB.trim()];
        }
        setBenefits(loadedBenefits);

        // Requirements (can be array or string)
        let loadedRequirements: string[] = [];
        const rawReq = det.requirements || det.الشروط || det.متطلبات;
        if (Array.isArray(rawReq)) {
          loadedRequirements = rawReq.map(String);
        } else if (typeof rawReq === 'string' && rawReq.trim()) {
          loadedRequirements = [rawReq.trim()];
        }
        setRequirements(loadedRequirements);

        // Notes
        const rawNotes = det.notes || det.ملاحظات || '';
        setNotes(typeof rawNotes === 'string' ? rawNotes : '');

        // Fill Form Fields
        if (data.form_fields && Array.isArray(data.form_fields)) {
          setFormFields(data.form_fields);
        } else {
          setFormFields([]);
        }
      } catch (err: any) {
        console.error('Error loading offer:', err);
        setToastMessage({
          type: 'error',
          text: `فشل تحميل الوظيفة: ${err?.message || 'خطأ غير متوقع'}`,
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadOffer();
  }, [id, isEditing]);

  // Suggested Fields based on offer_type and title / company keywords
  const suggestedFields = useMemo<SuggestedField[]>(() => {
    const list: SuggestedField[] = [];
    const lowerTitle = (title + ' ' + companyName).toLowerCase();
    const currentKeys = new Set(formFields.map((f) => f.key.toLowerCase()));

    // Rule 1: offer_type = "factory"
    if (offerType === 'factory' || lowerTitle.includes('مصنع') || lowerTitle.includes('factory')) {
      if (!currentKeys.has('age')) {
        list.push({
          key: 'age',
          label: 'السن',
          type: 'number',
          required: true,
          reason: 'مقترح لوظائف المصانع والعمالة للتحقق من السن القانوني',
        });
      }
      if (!currentKeys.has('residence') && !currentKeys.has('location')) {
        list.push({
          key: 'residence',
          label: 'محل الإقامة / المنطقة',
          type: 'text',
          required: true,
          reason: 'لتحديد قرب المتقدم من خطوط سير أوتوبيسات المصنع',
        });
      }
      if (!currentKeys.has('national_id_photo_front')) {
        list.push({
          key: 'national_id_photo_front',
          label: 'صورة البطاقة (وجه أمامي)',
          type: 'file',
          required: true,
          reason: 'مستند أساسي للتحقق من هوية العامل',
        });
      }
      if (!currentKeys.has('national_id_photo_back')) {
        list.push({
          key: 'national_id_photo_back',
          label: 'صورة البطاقة (وجه خلفي)',
          type: 'file',
          required: true,
          reason: 'مستند أساسي للتحقق من عنوان وسريان البطاقة',
        });
      }
    }

    // Rule 2: offer_type = "call_center" or title/company contains "english"
    if (
      offerType === 'call_center' ||
      lowerTitle.includes('english') ||
      lowerTitle.includes('انجليزي') ||
      lowerTitle.includes('dial') ||
      lowerTitle.includes('telesales') ||
      lowerTitle.includes('كول سنتر')
    ) {
      if (!currentKeys.has('previous_experience')) {
        list.push({
          key: 'previous_experience',
          label: 'الخبرة السابقة',
          type: 'text',
          required: false,
          reason: 'لتقييم مدى دراية المتقدم بالعمل في الكول سنتر',
        });
      }
      if (!currentKeys.has('graduation_status')) {
        list.push({
          key: 'graduation_status',
          label: 'الموقف من التخرج',
          type: 'select',
          options: ['Graduate', 'Undergraduate', 'Dropout', 'Gap Year'],
          required: true,
          reason: 'أساسي لتحديد إمكانية التفرغ التام للشفتات',
        });
      }
      if (!currentKeys.has('voice_note')) {
        list.push({
          key: 'voice_note',
          label: 'رابط التسجيل الصوتي (Vocaroo)',
          type: 'url',
          required: true,
          reason: 'مطلوب لاختبار النطق ومستوى اللغة الإنجليزية',
        });
      }
      if (!currentKeys.has('cv_link') && !currentKeys.has('cv')) {
        list.push({
          key: 'cv_link',
          label: 'رابط السيرة الذاتية (Google Drive)',
          type: 'url',
          required: false,
          reason: 'للاطلاع على الملف التعريفي والخبرات الإضافية',
        });
      }
    }

    // Rule 3: title/company contains "real estate" or "عقار"
    if (
      lowerTitle.includes('real estate') ||
      lowerTitle.includes('realestate') ||
      lowerTitle.includes('عقارات') ||
      lowerTitle.includes('عقار')
    ) {
      if (!currentKeys.has('has_driving_license')) {
        list.push({
          key: 'has_driving_license',
          label: 'هل تمتلك رخصة قيادة؟',
          type: 'select',
          options: ['Yes', 'No'],
          required: true,
          reason: 'ضروري لوظائف المبيعات العقارية والمعاينات',
        });
      }
      if (!currentKeys.has('owns_car')) {
        list.push({
          key: 'owns_car',
          label: 'هل تمتلك سيارة خاصة؟',
          type: 'select',
          options: ['Yes', 'No'],
          required: true,
          reason: 'مطلوب للانتقال ومرافقة العملاء للمشاريع',
        });
      }
    }

    // Filter out dismissed items
    return list.filter((item) => !dismissedSuggestionKeys.includes(item.key));
  }, [offerType, title, companyName, formFields, dismissedSuggestionKeys]);

  // Benefit chip helpers
  const handleAddBenefit = () => {
    const trimmed = newBenefitInput.trim();
    if (!trimmed) return;
    if (!benefits.includes(trimmed)) {
      setBenefits([...benefits, trimmed]);
    }
    setNewBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  // Requirement chip helpers
  const handleAddRequirement = () => {
    const trimmed = newRequirementInput.trim();
    if (!trimmed) return;
    if (!requirements.includes(trimmed)) {
      setRequirements([...requirements, trimmed]);
    }
    setNewRequirementInput('');
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  // Form field helpers
  const handleAddSuggestedField = (suggested: SuggestedField) => {
    const newField: FormFieldDefinition = {
      key: suggested.key,
      label: suggested.label,
      type: suggested.type,
      required: suggested.required,
      options: suggested.options ? [...suggested.options] : undefined,
    };
    setFormFields((prev) => [...prev, newField]);
  };

  const handleDismissSuggestedField = (key: string) => {
    setDismissedSuggestionKeys((prev) => [...prev, key]);
  };

  const handleAddNewBlankField = () => {
    const nextIndex = formFields.length + 1;
    const newField: FormFieldDefinition = {
      key: `field_${nextIndex}`,
      label: `سؤال جديد ${nextIndex}`,
      type: 'text',
      required: false,
    };
    setFormFields((prev) => [...prev, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<FormFieldDefinition>) => {
    setFormFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveField = (index: number) => {
    setFormFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formFields.length - 1) return;

    setFormFields((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // AI Builder Handlers
  const handleAnalyzeAd = async () => {
    if (!adText.trim()) {
      setAiError({ isAllKeys: false, message: 'يرجى لصق نص إعلان الوظيفة أولاً.' });
      return;
    }
    if (adText.length > 6000) {
      setAiError({ isAllKeys: false, message: 'نص الإعلان يتجاوز الحد الأقصى (6000 حرف).' });
      return;
    }

    setAnalyzingAd(true);
    setAiError(null);
    setAiExtracted(null);

    try {
      const res = await fetch('/api/ai/parse-job-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ adText: adText.trim() }),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 503 || resData?.error === 'ALL_KEYS_FAILED') {
          let reasonsText = '';
          if (Array.isArray(resData?.details)) {
            reasonsText = resData.details
              .map((d: any) => `${d.key || 'key'}: ${d.reason || 'FAILED'}`)
              .join('\n');
          } else if (resData?.details) {
            reasonsText = typeof resData.details === 'object'
              ? JSON.stringify(resData.details, null, 2)
              : String(resData.details);
          }

          setAiError({
            isAllKeys: true,
            message: 'كل مفاتيح الذكاء الاصطناعي استنفدت أو غير صالحة، أضف مفتاحًا جديدًا من إعدادات الذكاء الاصطناعي',
            rawDetails: reasonsText || null,
          });
        } else if (
          res.status === 404 ||
          resData?.status === 404 ||
          String(resData?.message || '').includes('404') ||
          String(resData?.message || '').toLowerCase().includes('not found') ||
          String(resData?.details || '').includes('404') ||
          String(resData?.details || '').toLowerCase().includes('not found')
        ) {
          const rawDetail = resData?.message || resData?.details || '404 Model Not Found';
          setAiError({
            isModelNotFound: true,
            message: 'الموديل المحدد غير متاح. غيّره من إعدادات الذكاء الاصطناعي.',
            rawDetails: typeof rawDetail === 'object' ? JSON.stringify(rawDetail, null, 2) : String(rawDetail),
          });
        } else {
          setAiError({
            isAllKeys: false,
            message: resData?.message || 'حصل خطأ أثناء تحليل الإعلان، يرجى المحاولة مرة أخرى.',
            rawDetails: resData?.details ? String(resData.details) : null,
          });
        }
        return;
      }

      if (resData?.data) {
        setAiExtracted(resData.data);
        setUsedKey(resData.usedKey || 'primary');
        const fieldKeys = new Set<string>(
          (resData.data.form_fields || []).map((f: any) => f.key)
        );
        setSelectedAiFieldKeys(fieldKeys);
      }
    } catch (err: any) {
      console.error('Error analyzing ad with AI:', err);
      setAiError({
        isAllKeys: false,
        message: 'تعذر الاتصال بخدمة الذكاء الاصطناعي، تأكد من اتصالك بالإنترنت.',
      });
    } finally {
      setAnalyzingAd(false);
    }
  };

  const handleApplyAiData = () => {
    if (!aiExtracted) return;
    const ext = aiExtracted;
    const filled = new Set<string>();

    if (ext.title) {
      setTitle(ext.title);
      filled.add('title');
    }
    if (ext.company_name) {
      setCompanyName(ext.company_name);
      filled.add('companyName');
    }
    if (ext.offer_type && ['factory', 'call_center', 'other'].includes(ext.offer_type)) {
      setOfferType(ext.offer_type);
      filled.add('offerType');
    }

    const det = ext.details || {};
    if (det.salary) {
      setSalary(det.salary);
      filled.add('salary');
    }
    if (det.location) {
      setLocation(det.location);
      filled.add('location');
    }
    if (det.shift) {
      setShift(det.shift);
      filled.add('shift');
    }
    if (det.age_min) {
      setAgeMin(String(det.age_min));
      filled.add('ageMin');
    }
    if (det.age_max) {
      setAgeMax(String(det.age_max));
      filled.add('ageMax');
    }
    if (det.gender_requirement && ['male', 'female', 'either'].includes(det.gender_requirement)) {
      setGenderRequirement(det.gender_requirement);
      filled.add('genderRequirement');
    }
    if (det.nationality_requirement) {
      setNationalityRequirement(det.nationality_requirement);
      filled.add('nationalityRequirement');
    }
    if (Array.isArray(det.benefits) && det.benefits.length > 0) {
      setBenefits(det.benefits.map(String));
      filled.add('benefits');
    }
    if (Array.isArray(det.requirements) && det.requirements.length > 0) {
      setRequirements(det.requirements.map(String));
      filled.add('requirements');
    }
    if (det.notes && typeof det.notes === 'string' && det.notes.trim()) {
      setNotes(det.notes.trim());
      filled.add('notes');
    }

    if (Array.isArray(ext.form_fields)) {
      const selected = ext.form_fields.filter((f: any) => selectedAiFieldKeys.has(f.key));
      if (selected.length > 0) {
        setFormFields(selected);
        filled.add('formFields');
      }
    }

    setAiFilledFields(filled);
    setToastMessage({
      type: 'success',
      text: 'تم تطبيق البيانات المستخرجة على النموذج بنجاح! راجع الحقول ثم اضغط "حفظ الوظيفة" لتثبيتها.',
    });
  };

  const toggleAiFieldSelection = (fieldKey: string) => {
    setSelectedAiFieldKeys((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  };

  const renderAiBadge = (fieldName: string) => {
    if (!aiFilledFields.has(fieldName)) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/25 px-1.5 py-0.5 rounded font-normal mr-2">
        <Sparkles className="w-2.5 h-2.5" />
        <span>مستخرج بالذكاء الاصطناعي</span>
      </span>
    );
  };

  // Auto generate a safe snake_case key from label if needed
  const generateKeyFromLabel = (label: string): string => {
    const trimmed = label.trim().toLowerCase();
    // If it contains english letters, slugify
    const slug = trimmed
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    return slug || `field_${Date.now().toString(36).slice(-4)}`;
  };

  // Save Offer Handler (Section 3)
  const handleSave = async () => {
    setToastMessage(null);

    // Basic validation
    if (!title.trim()) {
      setActiveTab('basic');
      setToastMessage({ type: 'error', text: 'برجاء كتابة عنوان الوظيفة (Title).' });
      return;
    }
    if (!companyName.trim()) {
      setActiveTab('basic');
      setToastMessage({ type: 'error', text: 'برجاء كتابة اسم الشركة (Company Name).' });
      return;
    }

    setSaving(true);

    try {
      // Assemble structured details jsonb
      const assembledDetails: Record<string, any> = {
        ...originalDetails,
        salary: salary.trim(),
        location: location.trim(),
        shift: shift.trim(),
        age_min: ageMin ? parseInt(ageMin, 10) : null,
        age_max: ageMax ? parseInt(ageMax, 10) : null,
        gender_requirement: genderRequirement,
        nationality_requirement: nationalityRequirement.trim(),
        benefits: benefits,
        requirements: requirements,
        notes: notes.trim(),
      };

      // Clean up form_fields array
      const cleanedFormFields = formFields.map((f, i) => ({
        key: f.key.trim() || `field_${i + 1}`,
        label: f.label.trim() || `سؤال ${i + 1}`,
        type: f.type,
        required: Boolean(f.required),
        ...(f.type === 'select' ? { options: f.options || [] } : {}),
      }));

      const payload = {
        title: title.trim(),
        company_name: companyName.trim(),
        offer_type: offerType,
        whatsapp_number: whatsappNumber.trim() || null,
        is_active: isActive,
        details: assembledDetails,
        form_fields: cleanedFormFields,
      };

      if (isEditing && id) {
        // Update existing offer
        const { error: updateError } = await supabase
          .from('offers')
          .update(payload)
          .eq('id', id);

        if (updateError) throw updateError;

        setToastMessage({
          type: 'success',
          text: 'تم حفظ وتحديث بيانات الوظيفة بنجاح في Supabase 🎉',
        });
      } else {
        // Insert new offer
        const { data: newRow, error: insertError } = await supabase
          .from('offers')
          .insert(payload)
          .select()
          .single();

        if (insertError) throw insertError;

        // Redirect to /admin/offers on create success
        navigate('/admin/offers', {
          state: { createdOfferId: newRow?.id },
        });
      }
    } catch (err: any) {
      console.error('Error saving offer:', err);
      setToastMessage({
        type: 'error',
        text: `فشل حفظ الوظيفة: ${err?.message || 'تأكد من صلاحيات قاعدة البيانات وحاول مجدداً'}`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF2] py-8 px-4" dir="rtl">
        <div className="max-w-5xl mx-auto animate-pulse space-y-6">
          <div className="h-6 bg-[#1A232C] rounded-lg w-1/4"></div>
          <div className="h-10 bg-[#1A232C] rounded-lg w-1/2"></div>
          <div className="h-64 bg-[#131A21] border border-[#232F3A] rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF2] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-32" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Admin Nav Component */}
        <AdminNav activeTab="offers" />

        {/* Header and Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              to="/admin/offers"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B98A5] hover:text-[#E6EDF2] mb-2 transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لقائمة الوظائف</span>
            </Link>

            <h1 className="text-xl sm:text-2xl font-bold text-[#E6EDF2] tracking-tight">
              {isEditing ? `تعديل: ${title || 'الوظيفة'}` : 'إنشاء وظيفة جديدة'}
            </h1>
            <p className="text-xs sm:text-sm text-[#8B98A5] mt-1">
              {isEditing
                ? 'تعديل البيانات الأساسية، التفاصيل، وبناء فورم التقديم المخصص.'
                : 'أدخل تفاصيل الوظيفة الجديدة وقم بتهيئة أسئلة التقديم المطلوبة.'}
            </p>
          </div>

          {isEditing && (
            <div className="flex items-center gap-2">
              <Link
                to={`/offers/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B98A5] hover:text-[#E6EDF2] bg-[#1A232C] border border-[#232F3A] hover:bg-[#232F3A] px-3 py-2 rounded-lg transition shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>معاينة صفحة التقديم</span>
              </Link>
            </div>
          )}
        </div>

        {/* Feedback Toast */}
        {toastMessage && (
          <div
            className={`mb-6 p-3.5 rounded-lg border flex items-start gap-3 text-xs sm:text-sm font-semibold transition-all ${
              toastMessage.type === 'success'
                ? 'bg-[#1FA98A]/10 border-[#1FA98A]/30 text-[#1FA98A]'
                : 'bg-[#E1615E]/10 border-[#E1615E]/30 text-[#E1615E]'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{toastMessage.text}</div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs text-[#8B98A5] hover:text-[#E6EDF2] cursor-pointer"
            >
              إغلاق ✕
            </button>
          </div>
        )}

        {/* ================= AI JOB BUILDER PANEL (/admin/offers/new) ================= */}
        {!isEditing && (
          <div className="bg-[#131A21] border border-[#232F3A] rounded-xl mb-6 shadow-sm overflow-hidden transition-all">
            {/* Collapsible Header */}
            <div
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none bg-[#1A232C]/40 hover:bg-[#1A232C]/70 transition border-b border-[#232F3A]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1FA98A]/10 border border-[#1FA98A]/25 text-[#1FA98A] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-[#E6EDF2]">
                      إنشاء بالذكاء الاصطناعي
                    </h2>
                    <span className="text-[10px] font-mono text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/25 px-2 py-0.5 rounded-full">
                      Gemini AI
                    </span>
                  </div>
                  <p className="text-xs text-[#8B98A5] mt-0.5">
                    الصق نص إعلان الوظيفة لتحليله واستخراج كافة التفاصيل والأسئلة تلقائيًا.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="text-[#8B98A5] hover:text-[#E6EDF2] p-1.5 rounded-lg bg-[#131A21] border border-[#232F3A] transition"
              >
                {aiPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Collapsible Body */}
            {aiPanelOpen && (
              <div className="p-4 sm:p-6 space-y-4">
                {/* Textarea for ad text */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#E6EDF2]">
                      نص إعلان الوظيفة
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        adText.length > 5500 ? 'text-amber-400 font-bold' : 'text-[#8B98A5]'
                      }`}
                    >
                      {adText.length} / 6000 حرف
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    value={adText}
                    onChange={(e) => setAdText(e.target.value.slice(0, 6000))}
                    placeholder="الصق نص الإعلان هنا، مثل:
مطلوب فورا لمصنع مواد غذائية بالعبور عمال إنتاج
- المرتب: 6000 جنيه + مواصلات مجانية
- السن: من 18 إلى 35 سنة
- الشفت: 8 ساعات مع توفير سكن للمغتربين
- الأوراق المطلوبة: صورة البطاقة الشخصية، كشف طبي..."
                    className="w-full bg-[#1A232C] border border-[#232F3A] focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-xl p-3.5 text-xs sm:text-sm text-[#E6EDF2] placeholder-[#8B98A5]/60 outline-none transition leading-relaxed"
                  />
                </div>

                {/* Action button */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAnalyzeAd}
                    disabled={analyzingAd || !adText.trim()}
                    className="inline-flex items-center justify-center gap-2 bg-[#1FA98A] hover:bg-[#1aa082] disabled:opacity-50 text-[#0B0F14] font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    {analyzingAd ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#0B0F14]/30 border-t-[#0B0F14] rounded-full animate-spin"></div>
                        <span>جاري تحليل الإعلان واستخراج البيانات...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>تحليل الإعلان</span>
                      </>
                    )}
                  </button>

                  {adText.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdText('');
                        setAiExtracted(null);
                        setAiError(null);
                      }}
                      className="text-xs text-[#8B98A5] hover:text-red-400 transition"
                    >
                      مسح النص
                    </button>
                  )}
                </div>

                {/* AI Error Display */}
                {aiError && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl text-xs sm:text-sm text-red-400 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold block leading-relaxed">{aiError.message}</span>
                        {aiError.rawDetails && (
                          <details className="mt-2 text-xs text-red-300">
                            <summary className="cursor-pointer font-bold select-none text-red-400 hover:text-red-300">
                              تفاصيل
                            </summary>
                            <div className="mt-1.5 p-2 bg-[#0B0F14]/70 rounded border border-red-500/20 font-mono text-[11px] text-red-300 break-words whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto" dir="ltr">
                              {aiError.rawDetails}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>

                    {(aiError.isAllKeys || aiError.isModelNotFound) && (
                      <Link
                        to="/admin/ai-settings"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E6EDF2] bg-[#1A232C] border border-[#232F3A] hover:bg-[#232F3A] px-3 py-1.5 rounded-lg transition shrink-0 self-start sm:self-auto"
                      >
                        <span>إعدادات الذكاء الاصطناعي</span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </Link>
                    )}
                  </div>
                )}

                {/* Review Area */}
                {aiExtracted && (
                  <div className="bg-[#1A232C] border border-[#232F3A] rounded-xl p-4 sm:p-5 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-[#232F3A] pb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#1FA98A]" />
                        <h3 className="text-sm font-bold text-[#E6EDF2]">
                          نتيجة تحليل الإعلان
                        </h3>
                      </div>
                      <span className="text-[11px] text-[#8B98A5] font-mono bg-[#131A21] px-2 py-0.5 rounded border border-[#232F3A]">
                        المفتاح المستخدم: {usedKey}
                      </span>
                    </div>

                    {/* Extracted Basic Values Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div className="bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                        <span className="text-[#8B98A5] block text-[11px] mb-0.5">المسمى الوظيفي:</span>
                        <span className="font-bold text-[#E6EDF2]">{aiExtracted.title || '—'}</span>
                      </div>

                      <div className="bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                        <span className="text-[#8B98A5] block text-[11px] mb-0.5">جهة العمل / الشركة:</span>
                        <span className="font-bold text-[#E6EDF2]">{aiExtracted.company_name || '—'}</span>
                      </div>

                      <div className="bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                        <span className="text-[#8B98A5] block text-[11px] mb-0.5">نوع الوظيفة:</span>
                        <span className="font-bold text-[#1FA98A]">{aiExtracted.offer_type || '—'}</span>
                      </div>

                      <div className="bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                        <span className="text-[#8B98A5] block text-[11px] mb-0.5">المرتب:</span>
                        <span className="font-bold text-[#E6EDF2]">{aiExtracted.details?.salary || 'غير محدد'}</span>
                      </div>

                      <div className="bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                        <span className="text-[#8B98A5] block text-[11px] mb-0.5">المكان / المنطقة:</span>
                        <span className="font-bold text-[#E6EDF2]">{aiExtracted.details?.location || 'غير محدد'}</span>
                      </div>

                      <div className="bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                        <span className="text-[#8B98A5] block text-[11px] mb-0.5">مواعيد العمل / الشفت:</span>
                        <span className="font-bold text-[#E6EDF2]">{aiExtracted.details?.shift || 'غير محدد'}</span>
                      </div>

                      {(aiExtracted.details?.age_min || aiExtracted.details?.age_max) && (
                        <div className="bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                          <span className="text-[#8B98A5] block text-[11px] mb-0.5">السن:</span>
                          <span className="font-bold text-[#E6EDF2]">
                            {aiExtracted.details?.age_min || '—'} إلى {aiExtracted.details?.age_max || '—'} سنة
                          </span>
                        </div>
                      )}

                      {aiExtracted.details?.gender_requirement && (
                        <div className="bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                          <span className="text-[#8B98A5] block text-[11px] mb-0.5">النوع المطلوب:</span>
                          <span className="font-bold text-[#E6EDF2]">
                            {aiExtracted.details.gender_requirement === 'male' ? 'ذكور فقط' : aiExtracted.details.gender_requirement === 'female' ? 'إناث فقط' : 'ذكور وإناث'}
                          </span>
                        </div>
                      )}

                      {Array.isArray(aiExtracted.details?.benefits) && aiExtracted.details.benefits.length > 0 && (
                        <div className="sm:col-span-2 lg:col-span-3 bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                          <span className="text-[#8B98A5] block text-[11px] mb-1.5">المميزات المستخرجة:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {aiExtracted.details.benefits.map((b: string, i: number) => (
                              <span key={i} className="text-xs bg-[#1A232C] text-[#E6EDF2] px-2 py-0.5 rounded border border-[#232F3A]">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(aiExtracted.details?.requirements) && aiExtracted.details.requirements.length > 0 && (
                        <div className="sm:col-span-2 lg:col-span-3 bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                          <span className="text-[#8B98A5] block text-[11px] mb-1.5">الشروط المستخرجة:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {aiExtracted.details.requirements.map((r: string, i: number) => (
                              <span key={i} className="text-xs bg-[#1A232C] text-[#E6EDF2] px-2 py-0.5 rounded border border-[#232F3A]">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiExtracted.details?.notes && (
                        <div className="sm:col-span-2 lg:col-span-3 bg-[#131A21] p-3 rounded-lg border border-[#232F3A]">
                          <span className="text-[#8B98A5] block text-[11px] mb-0.5">ملاحظات:</span>
                          <span className="text-xs text-[#E6EDF2] leading-relaxed whitespace-pre-wrap">{aiExtracted.details.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Suggested Form Fields Checklist */}
                    {Array.isArray(aiExtracted.form_fields) && aiExtracted.form_fields.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[#232F3A]">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#E6EDF2]">
                            حقول نموذج التقديم المقترحة ({aiExtracted.form_fields.length}):
                          </label>
                          <span className="text-[11px] text-[#8B98A5]">
                            حدد الحقول التي ترغب بإضافتها إلى الفورم
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {aiExtracted.form_fields.map((field: any, idx: number) => {
                            const isChecked = selectedAiFieldKeys.has(field.key);
                            return (
                              <label
                                key={field.key || idx}
                                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                                  isChecked
                                    ? 'bg-[#131A21] border-[#1FA98A]/40 text-[#E6EDF2]'
                                    : 'bg-[#131A21]/50 border-[#232F3A] text-[#8B98A5]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleAiFieldSelection(field.key)}
                                    className="w-4 h-4 rounded border-[#232F3A] text-[#1FA98A] focus:ring-0 cursor-pointer"
                                  />
                                  <span className="font-bold">{field.label}</span>
                                  <code className="text-[10px] font-mono text-[#8B98A5]">
                                    ({field.key})
                                  </code>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-[#8B98A5] bg-[#1A232C] px-1.5 py-0.5 rounded">
                                    {field.type}
                                  </span>
                                  {field.required ? (
                                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                                      إجباري
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#8B98A5] bg-[#232F3A] px-1.5 py-0.5 rounded">
                                      اختياري
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Apply Button */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#232F3A]">
                      <button
                        type="button"
                        onClick={handleApplyAiData}
                        className="inline-flex items-center justify-center gap-2 bg-[#1FA98A] hover:bg-[#1aa082] text-[#0B0F14] font-bold text-xs sm:text-sm py-2.5 px-6 rounded-xl transition shadow-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>تطبيق على النموذج</span>
                      </button>

                      <span className="text-[11px] text-[#8B98A5]">
                        تنبيه: لن يتم حفظ الوظيفة تلقائيًا — راجع البيانات أولاً ثم اضغط "حفظ الوظيفة" أسفل الصفحة.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Three Tabs Header */}
        <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-1 mb-6 shadow-sm">
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'basic'
                  ? 'bg-[#1FA98A] text-[#0B0F14] shadow-xs'
                  : 'text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#1A232C]'
              }`}
            >
              <Info className="w-4 h-4 shrink-0" />
              <span>معلومات أساسية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-[#1FA98A] text-[#0B0F14] shadow-xs'
                  : 'text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#1A232C]'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>التفاصيل</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-[#1FA98A] text-[#0B0F14] shadow-xs'
                  : 'text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#1A232C]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>فورم التقديم</span>
              {renderAiBadge('formFields')}
              {formFields.length > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                    activeTab === 'form' ? 'bg-[#0B0F14]/20 text-[#0B0F14]' : 'bg-[#1A232C] text-[#8B98A5]'
                  }`}
                >
                  {formFields.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Tab Content Body */}
        <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-5 sm:p-6 shadow-sm">
          {/* ================= TAB 1: BASIC INFO ================= */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="border-b border-[#232F3A] pb-3">
                <h2 className="text-base font-bold text-[#E6EDF2]">معلومات أساسية عن الوظيفة</h2>
                <p className="text-xs text-[#8B98A5] mt-0.5">
                  البيانات الرئيسية المربوطة مباشرة بأعمدة جدول <code className="font-mono text-[#1FA98A] bg-[#1A232C] border border-[#232F3A] px-1.5 py-0.5 rounded text-[11px]">offers</code>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    عنوان الوظيفة (Job Title) <span className="text-[#E1615E]">*</span>
                    {renderAiBadge('title')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#8B98A5]">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: موظف خدمة عملاء - Dial Expert"
                      className={`w-full pr-9 pl-3 py-2.5 bg-[#1A232C] border ${
                        aiFilledFields.has('title') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                      } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition`}
                    />
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    اسم الشركة (Company Name) <span className="text-[#E1615E]">*</span>
                    {renderAiBadge('companyName')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#8B98A5]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="مثال: Dial Expert"
                      className={`w-full pr-9 pl-3 py-2.5 bg-[#1A232C] border ${
                        aiFilledFields.has('companyName') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                      } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition`}
                    />
                  </div>
                </div>

                {/* Offer Type Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    نوع الوظيفة (Offer Type)
                    {renderAiBadge('offerType')}
                  </label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
                    className={`w-full px-3 py-2.5 bg-[#1A232C] border ${
                      aiFilledFields.has('offerType') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                    } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] outline-none transition cursor-pointer`}
                  >
                    <option value="call_center">كول سنتر / خدمة عملاء (call_center)</option>
                    <option value="factory">مصانع / عمالة وإنتاج (factory)</option>
                    <option value="other">وظائف أخرى (other)</option>
                  </select>
                  <p className="text-[11px] text-[#8B98A5]">
                    يؤثر على الحقول التلقائية المقترحة في تبويب "فورم التقديم".
                  </p>
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    رقم WhatsApp الخاص بالوظيفة (للمتابعة)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#8B98A5]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+2010XXXXXXXX"
                      className="w-full pr-9 pl-3 py-2.5 bg-[#1A232C] border border-[#232F3A] focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] font-mono text-left outline-none transition"
                    />
                  </div>
                </div>

                {/* Is Active Toggle Switch */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    حالة الوظيفة (متاحة للتقديم للجمهور)
                  </label>
                  <div className="flex items-center gap-3 p-2.5 bg-[#1A232C] border border-[#232F3A] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? 'bg-[#1FA98A]' : 'bg-[#232F3A]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#E6EDF2] shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isActive ? '-translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-[#E6EDF2]">
                      {isActive ? '🟢 نشطة ومتاحة للتقديم' : '⚪ معطلة ومغلقة حالياً'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: DETAILS ================= */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="border-b border-[#232F3A] pb-3">
                <h2 className="text-base font-bold text-[#E6EDF2]">تفاصيل وشروط الوظيفة</h2>
                <p className="text-xs text-[#8B98A5] mt-0.5">
                  حقول مهيكلة يتم تجميعها تلقائياً داخل عمود <code className="font-mono text-[#1FA98A] bg-[#1A232C] border border-[#232F3A] px-1.5 py-0.5 rounded text-[11px]">details</code> بتنسيق JSONB.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Salary */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    المرتب (Salary)
                    {renderAiBadge('salary')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#8B98A5]">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="مثال: 18000 EGP net + عمولة"
                      className={`w-full pr-9 pl-3 py-2.5 bg-[#1A232C] border ${
                        aiFilledFields.has('salary') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                      } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition`}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    مكان العمل (Location)
                    {renderAiBadge('location')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#8B98A5]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="مثال: القاهرة، مدينة نصر (Hybrid أو On-site)"
                      className={`w-full pr-9 pl-3 py-2.5 bg-[#1A232C] border ${
                        aiFilledFields.has('location') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                      } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition`}
                    />
                  </div>
                </div>

                {/* Shift */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    مواعيد العمل والشفت (Shift)
                    {renderAiBadge('shift')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#8B98A5]">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      placeholder="مثال: من الإثنين للجمعة 4 مساءً - 1 صباحاً (يومين إجازة)"
                      className={`w-full pr-9 pl-3 py-2.5 bg-[#1A232C] border ${
                        aiFilledFields.has('shift') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                      } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition`}
                    />
                  </div>
                </div>

                {/* Age Min & Max */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    الحد الأدنى للسن (Age Min)
                    {renderAiBadge('ageMin')}
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="70"
                    value={ageMin}
                    onChange={(e) => setAgeMin(e.target.value)}
                    placeholder="مثال: 21"
                    className={`w-full px-3 py-2.5 bg-[#1A232C] border ${
                      aiFilledFields.has('ageMin') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                    } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    الحد الأقصى للسن (Age Max)
                    {renderAiBadge('ageMax')}
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="70"
                    value={ageMax}
                    onChange={(e) => setAgeMax(e.target.value)}
                    placeholder="مثال: 35"
                    className={`w-full px-3 py-2.5 bg-[#1A232C] border ${
                      aiFilledFields.has('ageMax') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                    } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition`}
                  />
                </div>

                {/* Gender Requirement */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    شرط النوع (Gender Requirement)
                    {renderAiBadge('genderRequirement')}
                  </label>
                  <select
                    value={genderRequirement}
                    onChange={(e) => setGenderRequirement(e.target.value)}
                    className={`w-full px-3 py-2.5 bg-[#1A232C] border ${
                      aiFilledFields.has('genderRequirement') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                    } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] outline-none transition cursor-pointer`}
                  >
                    <option value="either">ذكور وإناث (متاح للجميع)</option>
                    <option value="male">ذكور فقط</option>
                    <option value="female">إناث فقط</option>
                  </select>
                </div>

                {/* Nationality Requirement */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    شرط الجنسية (Nationality Requirement)
                    {renderAiBadge('nationalityRequirement')}
                  </label>
                  <select
                    value={nationalityRequirement}
                    onChange={(e) => setNationalityRequirement(e.target.value)}
                    className={`w-full px-3 py-2.5 bg-[#1A232C] border ${
                      aiFilledFields.has('nationalityRequirement') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                    } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] outline-none transition cursor-pointer`}
                  >
                    <option value="">غير محدد</option>
                    <option value="مصريين فقط">مصريين فقط</option>
                    <option value="مصريين وأجانب">مصريين وأجانب</option>
                    {Boolean(nationalityRequirement && nationalityRequirement !== 'مصريين فقط' && nationalityRequirement !== 'مصريين وأجانب') && (
                      <option value={nationalityRequirement}>
                        {nationalityRequirement} (قيمة مخصصة محفوظة)
                      </option>
                    )}
                  </select>
                </div>

                {/* Benefits (Repeatable Chip List) */}
                <div className="space-y-2 sm:col-span-2 pt-2 border-t border-[#232F3A]">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    المميزات (Benefits)
                    {renderAiBadge('benefits')}
                  </label>
                  <p className="text-xs text-[#8B98A5]">
                    أضف كل ميزة واضغط على "إضافة" أو Enter. يتم حفظها كمصفوفة نصوص داخل <code className="font-mono text-[#1FA98A] bg-[#1A232C] border border-[#232F3A] px-1 py-0.5 rounded text-[11px]">details.benefits</code>.
                  </p>

                  {/* Input + Add button */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newBenefitInput}
                      onChange={(e) => setNewBenefitInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBenefit();
                        }
                      }}
                      placeholder="اكتب ميزة (مثل: تأمين صحي واجتماعي، مواصلات مجانية، عمولة شهرية)..."
                      className="flex-1 px-3 py-2 bg-[#1A232C] border border-[#232F3A] focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="inline-flex items-center gap-1.5 bg-[#1FA98A] hover:bg-[#18886F] text-[#0B0F14] font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة ميزة</span>
                    </button>
                  </div>

                  {/* Benefits Chips List */}
                  <div className="flex flex-wrap gap-2 pt-2 min-h-8">
                    {benefits.length === 0 ? (
                      <span className="text-xs text-[#8B98A5] italic">لم تتم إضافة أي مميزات بعد.</span>
                    ) : (
                      benefits.map((b, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-[#1A232C] border border-[#232F3A] text-[#E6EDF2] text-xs font-medium px-2.5 py-1 rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5 text-[#1FA98A]" />
                          <span>{b}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(idx)}
                            className="w-4 h-4 rounded hover:bg-[#232F3A] flex items-center justify-center text-[#8B98A5] hover:text-[#E1615E] transition cursor-pointer ml-0.5"
                            title="حذف"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Requirements (Repeatable Chip List) */}
                <div className="space-y-2 sm:col-span-2 pt-2 border-t border-[#232F3A]">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    الشروط (Requirements)
                    {renderAiBadge('requirements')}
                  </label>
                  <p className="text-xs text-[#8B98A5]">
                    أضف كل شرط واضغط على "إضافة" أو Enter (مثل: مستوى الإنجليزية، المؤهل، موقف التجنيد، لابتوب وإنترنت أرضي...). يتم حفظها داخل <code className="font-mono text-[#1FA98A] bg-[#1A232C] border border-[#232F3A] px-1 py-0.5 rounded text-[11px]">details.requirements</code>.
                  </p>

                  {/* Input + Add button */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRequirementInput}
                      onChange={(e) => setNewRequirementInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRequirement();
                        }
                      }}
                      placeholder="اكتب شرطاً (مثل: إنجليزي B2 فأعلى، مؤهل عالي، موقف محدد من التجنيد)..."
                      className="flex-1 px-3 py-2 bg-[#1A232C] border border-[#232F3A] focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="inline-flex items-center gap-1.5 bg-[#1FA98A] hover:bg-[#18886F] text-[#0B0F14] font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة شرط</span>
                    </button>
                  </div>

                  {/* Requirements Chips List */}
                  <div className="flex flex-wrap gap-2 pt-2 min-h-8">
                    {requirements.length === 0 ? (
                      <span className="text-xs text-[#8B98A5] italic">لم تتم إضافة أي شروط بعد.</span>
                    ) : (
                      requirements.map((r, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-[#1A232C] border border-[#232F3A] text-[#E6EDF2] text-xs font-medium px-2.5 py-1 rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5 text-[#1FA98A]" />
                          <span>{r}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(idx)}
                            className="w-4 h-4 rounded hover:bg-[#232F3A] flex items-center justify-center text-[#8B98A5] hover:text-[#E1615E] transition cursor-pointer ml-0.5"
                            title="حذف"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Notes (Textarea) */}
                <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-[#232F3A]">
                  <label className="block text-xs font-semibold text-[#E6EDF2]">
                    ملاحظات (Notes)
                    {renderAiBadge('notes')}
                  </label>
                  <p className="text-xs text-[#8B98A5]">
                    أي استثناءات (مثل السن حتى 35 لأصحاب الخبرة)، فترة التدريب، أو مواعيد المقابلات. يتم حفظها داخل <code className="font-mono text-[#1FA98A] bg-[#1A232C] border border-[#232F3A] px-1 py-0.5 rounded text-[11px]">details.notes</code>.
                  </p>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: التدريب مدفوع الأجر لمدة أسبوعين، متاح استثناء السن حتى 35 سنة لأصحاب الخبرة السابقة..."
                    className={`w-full px-3 py-2.5 bg-[#1A232C] border ${
                      aiFilledFields.has('notes') ? 'border-[#1FA98A]/50 ring-1 ring-[#1FA98A]/20' : 'border-[#232F3A]'
                    } focus:border-[#1FA98A] focus:ring-1 focus:ring-[#1FA98A] rounded-lg text-xs text-[#E6EDF2] placeholder-[#8B98A5] outline-none transition resize-y`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 3: APPLICATION FORM ================= */}
          {activeTab === 'form' && (
            <div className="space-y-6">
              <div className="border-b border-[#232F3A] pb-3">
                <h2 className="text-base font-bold text-[#E6EDF2]">بناء وتخصيص فورم التقديم</h2>
                <p className="text-xs text-[#8B98A5] mt-0.5">
                  تعديل مصفوفة حقول التقديم <code className="font-mono text-[#1FA98A] bg-[#1A232C] border border-[#232F3A] px-1.5 py-0.5 rounded text-[11px]">form_fields</code> الخاصة بهذه الوظيفة.
                </p>
              </div>

              {/* SECTION A: Suggested Fields Panel */}
              <div className="bg-[#1A232C] border border-[#232F3A] rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#131A21] border border-[#232F3A] text-[#1FA98A] flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#E6EDF2]">الحقول المقترحة للوظيفة</h3>
                      <p className="text-[11px] text-[#8B98A5]">
                        بناءً على نوع الوظيفة ({offerType}) والكلمات المفتاحية في العنوان.
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/20 px-2 py-0.5 rounded">
                    {suggestedFields.length} مقترحات
                  </span>
                </div>

                {suggestedFields.length === 0 ? (
                  <div className="text-xs text-[#8B98A5] bg-[#131A21] border border-[#232F3A] rounded-lg p-3 text-center">
                    جميع الحقول المقترحة إما مضافة بالفعل في الفورم أدناه أو تم تجاهلها.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedFields.map((sug) => (
                      <div
                        key={sug.key}
                        className="bg-[#131A21] border border-[#232F3A] rounded-lg p-3.5 flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-[#E6EDF2]">{sug.label}</span>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-[#1A232C] border border-[#232F3A] text-[#1FA98A] rounded">
                              {sug.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8B98A5] mt-1 leading-relaxed">{sug.reason}</p>
                          <div className="text-[11px] font-mono text-[#8B98A5] mt-1">
                            key: <code className="text-[#1FA98A]">{sug.key}</code>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#232F3A]">
                          <button
                            type="button"
                            onClick={() => handleAddSuggestedField(sug)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B0F14] bg-[#1FA98A] hover:bg-[#18886F] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>➕ إضافة للفورم</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDismissSuggestedField(sug.key)}
                            className="text-xs font-medium text-[#8B98A5] hover:text-[#E6EDF2] cursor-pointer"
                          >
                            تجاهل ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION B: Field List Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-[#E6EDF2]">حقول الفورم الحالية ({formFields.length})</h3>
                    <p className="text-[11px] text-[#8B98A5]">
                      رتب الحقول، حدد إذا كان الحقل إجبارياً، وعدل خيارات القوائم المنسدلة.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewBlankField}
                    className="inline-flex items-center gap-1.5 bg-[#1A232C] hover:bg-[#232F3A] text-[#1FA98A] border border-[#232F3A] font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ إضافة حقل</span>
                  </button>
                </div>

                {formFields.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-[#232F3A] rounded-xl p-6 bg-[#1A232C]/40">
                    <FileText className="w-8 h-8 text-[#8B98A5] mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-[#E6EDF2]">لا توجد حقول في الفورم بعد</h4>
                    <p className="text-xs text-[#8B98A5] max-w-sm mx-auto mt-1 mb-3">
                      يمكنك اختيار حقول من لوحة "الحقول المقترحة" أعلاه أو الضغط على زر إضافة حقل مخصص.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddNewBlankField}
                      className="inline-flex items-center gap-1.5 bg-[#1FA98A] text-[#0B0F14] font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-[#18886F] transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ إضافة أول حقل</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formFields.map((field, index) => (
                      <div
                        key={index}
                        className="bg-[#1A232C] border border-[#232F3A] rounded-xl p-3.5 sm:p-4 space-y-3 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#232F3A]">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-[#131A21] text-[#1FA98A] border border-[#232F3A] flex items-center justify-center font-mono font-bold text-xs">
                              {index + 1}
                            </span>
                            <span className="font-bold text-xs text-[#E6EDF2]">{field.label || 'حقل بدون اسم'}</span>
                            <span className="text-[11px] font-mono text-[#8B98A5]">({field.key})</span>
                          </div>

                          {/* Reordering and Delete controls */}
                          <div className="flex items-center gap-1 self-end sm:self-center">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveField(index, 'up')}
                              title="تحريك لأعلى"
                              className="p-1 text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#131A21] rounded disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={index === formFields.length - 1}
                              onClick={() => handleMoveField(index, 'down')}
                              title="تحريك لأسفل"
                              className="p-1 text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#131A21] rounded disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveField(index)}
                              title="حذف الحقل"
                              className="p-1 text-[#E1615E] hover:text-[#E1615E] hover:bg-[#E1615E]/10 rounded cursor-pointer ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Field configuration inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Label */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-[#E6EDF2]">عنوان السؤال (Label)</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => {
                                const newLabel = e.target.value;
                                handleUpdateField(index, {
                                  label: newLabel,
                                  ...(field.key.startsWith('field_')
                                    ? { key: generateKeyFromLabel(newLabel) }
                                    : {}),
                                });
                              }}
                              placeholder="مثال: رقم بطاقة الرقم القومي"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#131A21] border border-[#232F3A] focus:border-[#1FA98A] outline-none text-xs text-[#E6EDF2] transition"
                            />
                          </div>

                          {/* Key */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-[#E6EDF2]">
                              مفتاح الحقل البرمجي (Key)
                            </label>
                            <input
                              type="text"
                              dir="ltr"
                              value={field.key}
                              onChange={(e) => handleUpdateField(index, { key: e.target.value })}
                              placeholder="e.g. national_id"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#131A21] border border-[#232F3A] focus:border-[#1FA98A] outline-none text-xs text-[#E6EDF2] font-mono text-left transition"
                            />
                          </div>

                          {/* Type */}
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-[#E6EDF2]">نوع الإدخال (Type)</label>
                            <select
                              value={field.type}
                              onChange={(e) =>
                                handleUpdateField(index, {
                                  type: e.target.value as any,
                                  options: e.target.value === 'select' ? field.options || ['خيار 1', 'خيار 2'] : undefined,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#131A21] border border-[#232F3A] focus:border-[#1FA98A] outline-none text-xs text-[#E6EDF2] transition cursor-pointer"
                            >
                              <option value="text">نص عادي (Text)</option>
                              <option value="number">أرقام (Number)</option>
                              <option value="select">قائمة منسدلة (Select)</option>
                              <option value="file">رفع ملف / مستند (File Upload)</option>
                              <option value="url">رابط / لينك صوتي (URL)</option>
                            </select>
                          </div>
                        </div>

                        {/* Required Toggle & Select Options */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-[#E6EDF2]">
                            <input
                              type="checkbox"
                              checked={Boolean(field.required)}
                              onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                              className="w-3.5 h-3.5 rounded bg-[#131A21] border-[#232F3A] text-[#1FA98A] focus:ring-[#1FA98A]"
                            />
                            <span>حقل إجباري (مطلوب قبل الإرسال)</span>
                          </label>

                          {field.type === 'select' && (
                            <div className="flex-1 max-w-md space-y-1">
                              <span className="text-[11px] font-bold text-[#8B98A5] block">
                                خيارات القائمة (مفصولة بفاصلة ,):
                              </span>
                              <input
                                type="text"
                                value={(field.options || []).join(', ')}
                                onChange={(e) => {
                                  const rawOpts = e.target.value;
                                  const parsed = rawOpts.split(',').map((s) => s.trim());
                                  handleUpdateField(index, { options: parsed });
                                }}
                                placeholder="Graduate, Undergraduate, Dropout"
                                className="w-full px-2 py-1 rounded bg-[#131A21] border border-[#232F3A] text-xs text-[#E6EDF2] outline-none focus:border-[#1FA98A] font-mono"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleAddNewBlankField}
                        className="w-full py-2.5 border border-dashed border-[#232F3A] hover:border-[#1FA98A] text-[#8B98A5] hover:text-[#1FA98A] rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 bg-[#1A232C]/40 hover:bg-[#1A232C] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ إضافة حقل جديد للفورم</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Save Behavior - Always visible & Sticky at bottom on mobile */}
      <div className="fixed bottom-0 inset-x-0 bg-[#131A21]/95 backdrop-blur-md border-t border-[#232F3A] py-3 px-4 z-40 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs text-[#8B98A5] hidden sm:block">
            <span>سيتم حفظ التغييرات مباشرة في جدول <code className="font-mono text-[#1FA98A] font-bold">offers</code> في Supabase.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              to="/admin/offers"
              className="px-3.5 py-2 rounded-lg border border-[#232F3A] text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#1A232C] text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </Link>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 bg-[#1FA98A] hover:bg-[#18886F] text-[#0B0F14] font-bold text-xs py-2 px-5 rounded-lg transition shadow-xs disabled:opacity-50 cursor-pointer flex-1 sm:flex-initial"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#0B0F14]/30 border-t-[#0B0F14] rounded-full animate-spin"></div>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'حفظ التعديلات' : 'حفظ ونشر الوظيفة'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
