// ═══════════════════════════════════════════════════════════════════
// كتالوج خدمات مورا — مصدر البيانات الوحيد المهيكل
// وفق وثيقة مواصفات Mora v1.0 (§3 الكتالوج، §4 الباقات والتسعير)
// ملاحظة: الأسعار استرشادية بالدولار (§3.2) والسعر النهائي يُعتمد
// بعد مراجعة الطلب — لا تُعرض كأسعار ملزمة.
// بنية البيانات جاهزة للترحيل لاحقًا إلى جداول Supabase
// (service_categories / services / service_packages) دون تغيير الواجهة.
// ═══════════════════════════════════════════════════════════════════

export type PricingType = 'fixed' | 'starting_at' | 'quote_required';

export interface ServicePackage {
  key: 'basic' | 'pro' | 'premium';
  nameAr: string;
  pricingType: PricingType;
  /** السعر بالدولار — لأغراض العرض الاسترشادي فقط */
  amountUsd: number | null; // null عند quote_required
  deliveryDays: number;
  revisions: number;
  deliverables: string[];
  scopeNotes: string;
}

export interface ServiceFaq {
  q: string;
  a: string;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  /** مسار أيقونة الفئة من أصول الهوية المرفقة */
  icon: string;
  /** لون تمييز الفئة — مشتق من توكنات Mora */
  color: string;
  colorSoft: string;
  descAr: string;
}

export interface Service {
  slug: string;
  categoryId: string;
  titleAr: string;
  titleEn: string;
  taglineAr: string;
  descriptionAr: string;
  /** متاحة للطلب فورًا أم قريبًا */
  status: 'available' | 'coming_soon';
  packages: ServicePackage[];
  /** الحقل الديناميكي الخاص بهذه الخدمة في نموذج الطلب (§5.2) */
  extraField?: { question: string; placeholder: string };
  requirementsAr: string[];
  faq: ServiceFaq[];
}

// ─── الفئات الست (أيقوناتها من public/brand/service-category-icons) ───

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'career',
    slug: 'career',
    nameAr: 'الخدمات المهنية والوظيفية',
    nameEn: 'Career Services',
    icon: '/brand/service-category-icons/career.svg',
    color: '#4C83E8',
    colorSoft: '#E8F0FD',
    descAr: 'سيرة ذاتية، لينكدإن، وإعداد كامل لمرحلة البحث عن وظيفة.',
  },
  {
    id: 'design',
    slug: 'design',
    nameAr: 'التصميم والهوية البصرية',
    nameEn: 'Design & Creative',
    icon: '/brand/service-category-icons/design.svg',
    color: '#625BE7',
    colorSoft: '#ECEBFB',
    descAr: 'شعارات، هوية بصرية، عروض تقديمية، وتصميمات سوشيال ميديا.',
  },
  {
    id: 'web',
    slug: 'web-tech',
    nameAr: 'المواقع والتكنولوجيا',
    nameEn: 'Web & Technology',
    icon: '/brand/service-category-icons/web-tech.svg',
    color: '#11A99A',
    colorSoft: '#E1F3F0',
    descAr: 'صفحات هبوط ومواقع أعمال جاهزة تعمل فعليًا على الجوال والحاسب.',
  },
  {
    id: 'business',
    slug: 'business',
    nameAr: 'خدمات الأعمال والمكاتب',
    nameEn: 'Business & Office',
    icon: '/brand/service-category-icons/business.svg',
    color: '#B4831C',
    colorSoft: '#FBF1DD',
    descAr: 'إكسل ولوحات بيانات، مستندات أعمال، وتنظيم البيانات.',
  },
  {
    id: 'media',
    slug: 'media',
    nameAr: 'المحتوى والإعلام',
    nameEn: 'Media & Content',
    icon: '/brand/service-category-icons/media.svg',
    color: '#625BE7',
    colorSoft: '#ECEBFB',
    descAr: 'مونتاج فيديو، تحرير صوت، وكتابة محتوى تسويقي.',
  },
  {
    id: 'documents',
    slug: 'documents',
    nameAr: 'المستندات والتعليم',
    nameEn: 'Documents & Learning',
    icon: '/brand/service-category-icons/documents.svg',
    color: '#13263F',
    colorSoft: '#E7EBF1',
    descAr: 'ترجمة، تدقيق لغوي، تفريغ صوتي، وتنسيق مستندات وأبحاث.',
  },
];

// ─── خطوات العمل الموحدة (وفق §5.1 رحلة العميل) ───

export const SERVICE_PROCESS_STEPS = [
  {
    title: 'أرسل طلبك',
    desc: 'املأ نموذج الطلب بوضوح — الخدمة والباقة ووصف المطلوب.',
  },
  {
    title: 'مراجعة وتأكيد',
    desc: 'نراجع الطلب ونؤكد معك النطاق النهائي والسعر والمدة قبل البدء.',
  },
  {
    title: 'التنفيذ',
    desc: 'نبدأ العمل ونطلب منك أي معلومات إضافية عند الحاجة.',
  },
  {
    title: 'التسليم والتعديلات',
    desc: 'تستلم المخرجات وتطلب تعديلاتك ضمن حدود الباقة المختارة.',
  },
] as const;

// ─── الخدمات العشر للإطلاق الأول (§3.2) + خدمات «قريبًا» (§3.3–3.8) ───

export const SERVICES: Service[] = [
  // ═══ 1. ATS Professional CV ═══
  {
    slug: 'ats-cv',
    categoryId: 'career',
    titleAr: 'سيرة ذاتية احترافية متوافقة مع ATS',
    titleEn: 'ATS Professional CV',
    taglineAr: 'سيرة تتجاوز أنظمة الفرز الآلي وتوصل لمسؤول التوظيف.',
    descriptionAr:
      'ننشئ أو نعيد هيكلة سيرتك الذاتية لتتوافق مع أنظمة الفرز الآلي (ATS) التي تستخدمها الشركات، بتنسيق نظيف وكلمات مفتاحية مناسبة لمجالك والمسمى المستهدف — بالعربية أو الإنجليزية.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: 'تحسين CV قائم',
        pricingType: 'fixed',
        amountUsd: 15,
        deliveryDays: 3,
        revisions: 1,
        deliverables: ['ملف PDF', 'ملف DOCX قابل للتعديل'],
        scopeNotes: 'إعادة هيكلة وتنسيق سيرتك الحالية لتتوافق مع أنظمة ATS، مع ضبط الأقسام والكلمات المفتاحية.',
      },
      {
        key: 'pro',
        nameAr: 'إنشاء CV كامل من الصفر',
        pricingType: 'fixed',
        amountUsd: 22,
        deliveryDays: 4,
        revisions: 2,
        deliverables: ['ملف PDF', 'ملف DOCX', 'مقتطف نبذة مهنية قصيرة'],
        scopeNotes: 'كتابة CV كامل من معلوماتك: الخبرات، التعليم، المهارات، الإنجازات — بصياغة مهنية متوافقة مع ATS.',
      },
      {
        key: 'premium',
        nameAr: 'CV + تخصيص لوظيفة محددة',
        pricingType: 'fixed',
        amountUsd: 30,
        deliveryDays: 5,
        revisions: 2,
        deliverables: ['ملف PDF', 'ملف DOCX', 'نسخة مخصصة لإعلان الوظيفة'],
        scopeNotes: 'كل ما في الباقة الاحترافية، مع تخصيص نسخة كاملة لإعلان وظيفة محدد تختاره.',
      },
    ],
    extraField: {
      question: 'المسمى الوظيفي المستهدف',
      placeholder: 'مثال: محاسب أول، موظف مبيعات، مهندس برمجيات…',
    },
    requirementsAr: [
      'نسخة من سيرتك الحالية إن وجدت (PDF أو Word).',
      'معلومات الخبرات والتعليم والمهارات بدقة.',
      'المسمى الوظيفي المستهدف ومجال العمل.',
      'إعلان الوظيفة المستهدفة (للباقة المميزة أو التخصيص).',
    ],
    faq: [
      {
        q: 'هل يضمن توافق ATS الحصول على وظيفة؟',
        a: 'لا — توافق ATS يجعل سيرتك تتجاوز مرحلة الفرز الآلي بنسبة أعلى، لكن قرار التوظيف يعتمد على خبراتك والمقابلات. لا نضمن وظيفة ولا نضيف خبرات غير حقيقية.',
      },
      {
        q: 'بأي لغة تُكتب السيرة؟',
        a: 'بالعربية أو الإنجليزية أو الاثنتين معًا — حدد المطلوب في وصف الطلب.',
      },
      {
        q: 'ماذا لو لم تكن معلوماتي كافية؟',
        a: 'نطلب منك معلومات إضافية قبل البدء، وتراجع أنت كل معلومة شخصية قبل الاعتماد النهائي.',
      },
    ],
  },

  // ═══ 2. LinkedIn Profile Optimization ═══
  {
    slug: 'linkedin-profile',
    categoryId: 'career',
    titleAr: 'تحسين ملف LinkedIn',
    titleEn: 'LinkedIn Profile Optimization',
    taglineAr: 'ملف احترافي يظهر في البحث ويقنع مسؤول التوظيف من أول نظرة.',
    descriptionAr:
      'نحسّن عناصر ملفك على LinkedIn: العنوان المهني، قسم About، الخبرات والمهارات والإنجازات — بصياغة موجهة للمسمى المستهدف وتقوية الظهور في نتائج بحث المسؤولين.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: 'الأساسيات',
        pricingType: 'fixed',
        amountUsd: 10,
        deliveryDays: 2,
        revisions: 1,
        deliverables: ['عنوان مهني جديد', 'نص قسم About', 'قائمة مهارات مقترحة'],
        scopeNotes: 'إعادة صياغة العنوان والنبذة وترتيب المهارات حسب مجالك.',
      },
      {
        key: 'pro',
        nameAr: 'تحسين شامل',
        pricingType: 'fixed',
        amountUsd: 18,
        deliveryDays: 3,
        revisions: 2,
        deliverables: ['كل ما في الأساسيات', 'إعادة صياغة الخبرات والإنجازات', 'توصيات ضبط إعدادات الظهور'],
        scopeNotes: 'تحديث كامل لأقسام الملف الأساسية مع نصوص جاهزة للنسخ إلى حسابك.',
      },
      {
        key: 'premium',
        nameAr: 'شامل + استراتيجية استخدام',
        pricingType: 'fixed',
        amountUsd: 25,
        deliveryDays: 4,
        revisions: 2,
        deliverables: ['كل ما في التحسين الشامل', 'دليل مصغر: كيف تستخدم الملف للبحث عن فرص', 'قائمة كلمات مفتاحية لمجالك'],
        scopeNotes: 'تحسين الملف بالكامل مع إرشادات عملية لاستخدامه في البحث والتواصل.',
      },
    ],
    extraField: {
      question: 'رابط حساب LinkedIn الحالي (اختياري)',
      placeholder: 'https://linkedin.com/in/…',
    },
    requirementsAr: [
      'رابط حسابك الحالي إن وجد، أو سيرتك الذاتية.',
      'الدور المستهدف والمجال.',
      'أبرز الإنجازات التي تريد إبرازها.',
      'لغة الملف المطلوبة (عربي/إنجليزي).',
    ],
    faq: [
      {
        q: 'هل تقومون بتعديل الحساب بنفسيكم؟',
        a: 'نوفر لك النصوص والتعديلات جاهزة وطبقًا مباشرًا خطوة بخطوة — لا نطلب كلمة مرور حسابك أبدًا.',
      },
      {
        q: 'هل يزيد الملف المحسّن فرص التوظيف؟',
        a: 'الملف المحسّن يرفع ظهورك في بحث المسؤولين ويوصل رسالتك المهنية أوضح — لكنه لا يضمن عروض عمل.',
      },
      {
        q: 'أريد الحفاظ على خصوصيتي، هل يمكن ذلك؟',
        a: 'نعم — نرشدك لضبط إعدادات الظهور والخصوصية ضمن التوصيات المرفقة.',
      },
    ],
  },

  // ═══ 3. Cover Letter ═══
  {
    slug: 'cover-letter',
    categoryId: 'career',
    titleAr: 'خطاب تغطية مخصص',
    titleEn: 'Cover Letter Writing',
    taglineAr: 'رسالة افتتاحية قوية تربط خبرتك بوظيفة معينة.',
    descriptionAr:
      'كتابة Cover Letter باحترافية: تعريف موجز بقيمتك، وربط خبراتك بمتطلبات الوظيفة المستهدفة — صياغة شخصية لا قوالب عامة.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: 'خطاب عام احترافي',
        pricingType: 'fixed',
        amountUsd: 5,
        deliveryDays: 2,
        revisions: 1,
        deliverables: ['خطاب تغطية بصيغة نصية + Word'],
        scopeNotes: 'خطاب قابل لإعادة الاستخدام لأي وظيفة في مجالك، مبني على سيرتك.',
      },
      {
        key: 'premium',
        nameAr: 'مخصص لإعلان وظيفة محدد',
        pricingType: 'fixed',
        amountUsd: 12,
        deliveryDays: 2,
        revisions: 2,
        deliverables: ['خطاب مخصص لإعلان الوظيفة', 'نسخة نصية قصيرة لنماذج التقديم'],
        scopeNotes: 'تحليل إعلان الوظيفة وصياغة خطاب يجيب عن متطلباتها بالتحديد.',
      },
    ],
    extraField: {
      question: 'الوظيفة أو الشركة المستهدفة (إن وجدت)',
      placeholder: 'مثال: وظيفة خدمة عملاء في شركة اتصالات…',
    },
    requirementsAr: [
      'سيرتك الذاتية أو ملخص خبراتك.',
      'إعلان الوظيفة المستهدفة (للباقة المخصصة).',
      'لغة الخطاب المطلوبة.',
    ],
    faq: [
      {
        q: 'هل يمكن استخدام نفس الخطاب لوظائف متعددة؟',
        a: 'الباقة العامة صالحة لمجالك عمومًا، لكن الخطاب المخصص لإعلان محدد أقوى أثرًا — نوصي بالتخصيص للوظائف المهمة لك.',
      },
      {
        q: 'ما الفرق بينه وبين الـ CV؟',
        a: 'السيرة تسرد حقائقك، الخطاب يروي لماذا أنت الأنسب لهذه الوظيفة تحديدًا — الاثنان يكملان بعضهما.',
      },
    ],
  },

  // ═══ 4. PowerPoint Presentation ═══
  {
    slug: 'powerpoint',
    categoryId: 'design',
    titleAr: 'تصميم عروض PowerPoint',
    titleEn: 'PowerPoint Presentation',
    taglineAr: 'عرض تقديمي منظم ومرئي يناسب جمهورك وهدفك.',
    descriptionAr:
      'تحويل محتواك إلى عرض تقديمي احترافي: بنية واضحة، تصميم متسق، رسوم وأيقونات توضيحية — للعروض التعليمية أو التجارية أو مشاريع التخرج.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: 'حتى 10 شرائح',
        pricingType: 'starting_at',
        amountUsd: 15,
        deliveryDays: 3,
        revisions: 1,
        deliverables: ['ملف PPTX قابل للتعديل', 'نسخة PDF'],
        scopeNotes: 'تصميم قالب موحد وتنسيق المحتوى على القالب.',
      },
      {
        key: 'pro',
        nameAr: 'حتى 20 شريحة',
        pricingType: 'starting_at',
        amountUsd: 30,
        deliveryDays: 4,
        revisions: 2,
        deliverables: ['ملف PPTX', 'نسخة PDF', 'أيقونات ورسوم توضيحية'],
        scopeNotes: 'تصميم مخصص بألوانك وهويتك مع رسوم توضيحية للمفاهيم.',
      },
      {
        key: 'premium',
        nameAr: 'حتى 35 شريحة',
        pricingType: 'starting_at',
        amountUsd: 50,
        deliveryDays: 6,
        revisions: 2,
        deliverables: ['ملف PPTX', 'نسخة PDF', 'إنفوجرافيك ورسوم بيانية'],
        scopeNotes: 'عرض متكامل مع إنفوجرافيك وتحويل البيانات إلى رسوم بيانية.',
      },
    ],
    extraField: {
      question: 'موضوع العرض وعدد الشرائح التقريبي',
      placeholder: 'مثال: عرض مشروع تخرج — نحو 18 شريحة…',
    },
    requirementsAr: [
      'محتوى العرض (نصوص، نقاط، بيانات).',
      'الجمهور المستهدف وهدف العرض.',
      'الهوية البصرية إن وجدت (ألوان، شعار).',
      'أي مواد مصدرية (صور، ملفات).',
    ],
    faq: [
      {
        q: 'هل تكتبون المحتوى أم تصممون فقط؟',
        a: 'الأساس هو محتواك أنت؛ نساعد في ترتيبه وصياغة العناوين، ولا ن invent بيانات أو أرقامًا غير مقدمة منك.',
      },
      {
        q: 'هل الملف قابل للتعديل من قبلي؟',
        a: 'نعم — نسلّم ملف PPTX كاملًا قابلًا للتحرير.',
      },
      {
        q: 'عندي أكثر من 35 شريحة؟',
        a: 'أرسل طلبك وسيُعتمد سعر خاص بعد مراجعة حجم العمل.',
      },
    ],
  },

  // ═══ 5. Company Profile ═══
  {
    slug: 'company-profile',
    categoryId: 'design',
    titleAr: 'تصميم Company Profile',
    titleEn: 'Company Profile Design',
    taglineAr: 'ملف تعريفي للشركة يعرض قيمتك باحتراف أمام العملاء والممولين.',
    descriptionAr:
      'تصميم ملف تعريفي احترافي لشركتك: نبذة، خدمات، إنجازات، فريق، وبيانات تواصل — بتصميم متسق مع هويتك، جاهز للطباعة والعرض الرقمي.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: 'حتى 8 صفحات',
        pricingType: 'starting_at',
        amountUsd: 25,
        deliveryDays: 5,
        revisions: 1,
        deliverables: ['ملف PDF جاهز للطباعة', 'ملف المصدر إن طُلب'],
        scopeNotes: 'قالب تصميم موحد وتنسيق محتواك على القالب.',
      },
      {
        key: 'pro',
        nameAr: 'حتى 15 صفحة',
        pricingType: 'starting_at',
        amountUsd: 40,
        deliveryDays: 7,
        revisions: 2,
        deliverables: ['ملف PDF', 'ملف المصدر', 'رسوم وإنفوجرافيك للخدمات'],
        scopeNotes: 'تصميم مخصص كامل مع إنفوجرافيك يوضح خدماتك وأرقامك.',
      },
      {
        key: 'premium',
        nameAr: 'حتى 25 صفحة + نسخة إنجليزية',
        pricingType: 'starting_at',
        amountUsd: 60,
        deliveryDays: 9,
        revisions: 2,
        deliverables: ['نسخة عربية + نسخة إنجليزية', 'ملف PDF + المصدر'],
        scopeNotes: 'النسخة الاحترافية الكاملة بجانب ترجمة النسخة الإنجليزية من محتواك.',
      },
    ],
    extraField: {
      question: 'عدد الصفحات التقريبي ومجال الشركة',
      placeholder: 'مثال: شركة مقاولات — نحو 12 صفحة…',
    },
    requirementsAr: [
      'محتوى الملف: نبذة الشركة، الخدمات، الإنجازات.',
      'الشعار والألوان والهوية إن وجدت.',
      'الصور المسموح استخدامها.',
      'بيانات التواصل المطلوب إظهارها.',
    ],
    faq: [
      {
        q: 'هل تكتبون محتوى الملف؟',
        a: 'نصيغ وتنظم محتواك المقدم، ونطلب منك اعتماد أي صياغة جديدة قبل النهائية — لا نختلق أرقامًا أو إنجازات.',
      },
      {
        q: 'هل صالح للطباعة؟',
        a: 'نعم — نسلّم PDF بجودة طباعة مع هوامش آمنة.',
      },
    ],
  },

  // ═══ 6. Social Media Designs ═══
  {
    slug: 'social-media-designs',
    categoryId: 'design',
    titleAr: 'تصميمات السوشيال ميديا',
    titleEn: 'Social Media Designs',
    taglineAr: 'منشورات متناسقة تعكس هويتك وترفع تفاعل جمهورك.',
    descriptionAr:
      'تصميم منشورات لمنصاتك الاجتماعية بأسلوب موحد وهوية ثابتة: عروض، إعلانات، تعليمي، مناسبات — مقاسات صحيحة لكل منصة.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: '4 منشورات',
        pricingType: 'fixed',
        amountUsd: 12,
        deliveryDays: 3,
        revisions: 1,
        deliverables: ['4 تصاميم بالمقاسات المطلوبة', 'ملفات PNG عالية الجودة'],
        scopeNotes: 'تصميمات منفردة بأسلوب موحد على قالب أساسي.',
      },
      {
        key: 'pro',
        nameAr: '8 منشورات',
        pricingType: 'fixed',
        amountUsd: 22,
        deliveryDays: 5,
        revisions: 2,
        deliverables: ['8 تصاميم', 'قالب قابل لإعادة الاستخدام', 'ملفات المصدر'],
        scopeNotes: 'باوة شهرية مصغرة مع قالب تحتفظ به لتصميماتك القادمة.',
      },
      {
        key: 'premium',
        nameAr: '16 منشورًا',
        pricingType: 'fixed',
        amountUsd: 40,
        deliveryDays: 7,
        revisions: 2,
        deliverables: ['16 تصميمًا', 'قوالب متعددة', 'ملفات المصدر', 'صور غلاف للمنصات'],
        scopeNotes: 'تغطية شهرية كاملة مع غلاف وقالب متنوع للمحتوى المتكرر.',
      },
    ],
    extraField: {
      question: 'المنصات المستهدفة',
      placeholder: 'مثال: فيسبوك وإنستغرام…',
    },
    requirementsAr: [
      'الشعار والألوان والهوية إن وجدت.',
      'نصوص المنشورات أو مواضيعها.',
      'أي صور منتجات أو مراجع تفضلها.',
    ],
    faq: [
      {
        q: 'هل تكتبون نصوص المنشورات؟',
        a: 'نقترح صياغة نصية مناسبة للتصميم عند الحاجة، والاعتماد النهائي لك.',
      },
      {
        q: 'هل يمكن طلب منشورات إضافية؟',
        a: 'نعم — تُسعّر المنشورات الإضافية خارج الباقة بسعر الوحدة المتفق عليه.',
      },
    ],
  },

  // ═══ 7. Logo & Brand Identity ═══
  {
    slug: 'logo-brand',
    categoryId: 'design',
    titleAr: 'تصميم الشعار والهوية',
    titleEn: 'Logo & Brand Identity',
    taglineAr: 'شعار وهوية تميّز نشاطك عن أول نظرة.',
    descriptionAr:
      'تصميم شعار احترافي وهوية بصرية متكاملة حسب نطاق عملك: من شعار بسيط للانطلاقة إلى دليل هوية كامل يوحد كل مخرجاتك.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: 'شعار بسيط',
        pricingType: 'starting_at',
        amountUsd: 15,
        deliveryDays: 4,
        revisions: 2,
        deliverables: ['شعار بصيغ PNG + PDF', 'نسخة ألوان ونسخة أحادية'],
        scopeNotes: 'مقترحان للشعار واختيار أحدهما مع تعديلات ضمن الحد.',
      },
      {
        key: 'pro',
        nameAr: 'شعار + هوية مصغرة',
        pricingType: 'starting_at',
        amountUsd: 45,
        deliveryDays: 6,
        revisions: 2,
        deliverables: ['ملفات الشعار الكاملة (SVG/PNG/PDF)', 'بطاقة أعمال', 'ترويسة وورقة رسمية'],
        scopeNotes: 'شعار مطوّر مع تطبيقات أساسية تخدمك فورًا.',
      },
      {
        key: 'premium',
        nameAr: 'هوية كاملة',
        pricingType: 'quote_required',
        amountUsd: null,
        deliveryDays: 10,
        revisions: 3,
        deliverables: ['كل ما سبق', 'لوحة ألوان وخطوط معتمدة', 'دليل هوية مصغر', 'تطبيقات إضافية (أغلفة، بطاقات)'],
        scopeNotes: 'نظام هوية موحد يُوثق في دليل مصغر يمكنك تمريره لأي مصمم لاحقًا.',
      },
    ],
    extraField: {
      question: 'اسم النشاط ومجاله',
      placeholder: 'مثال: متجر عطور إلكتروني…',
    },
    requirementsAr: [
      'اسم النشاط ومجال عمله وجمهوره.',
      'أسلوب مفضل (عصري، كلاسيكي، فاخر…) وأمثلة تعجبك.',
      'الألوان المفضلة أو المطلوب تجنبها.',
    ],
    faq: [
      {
        q: 'هل أملك الشعار النهائي حقوقه؟',
        a: 'نعم — بعد التسليم والاعتماد والدفاع النهائي، تصبح المخرجات ملكك لاستخدامك التجاري.',
      },
      {
        q: 'ماذا لو لم يعجبني أي مقترح؟',
        a: 'نستمع لتوجيهاتك ونعيد التوجيه — لذلك وضعنا عدد تعديلات واضح في كل باقة، والتغييرات الجذرية خارج النطاق تُسعّر عرضًا جديدًا.',
      },
    ],
  },

  // ═══ 8. Landing Page Development ═══
  {
    slug: 'landing-page',
    categoryId: 'web',
    titleAr: 'تطوير صفحة هبوط',
    titleEn: 'Landing Page Development',
    taglineAr: 'صفحة هدف واحد: تشرح، تقنع، وتجمع الطلبات.',
    descriptionAr:
      'بناء صفحة هبوط سريعة ومتجاوبة هدفها تحويل الزائر إلى عميل: عرض واضح للخدمة أو المنتج، مزايا، دعوة لإجراء، ونموذج تواصل يعمل فعليًا.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: 'صفحة أساسية',
        pricingType: 'fixed',
        amountUsd: 40,
        deliveryDays: 5,
        revisions: 1,
        deliverables: ['صفحة متجاوبة كاملة', 'نموذج تواصل يعمل', 'رفع على استضافتك أو مساعدتك في استضافتها'],
        scopeNotes: 'صفحة واحدة ببنية تسويقية قياسية على قالب محسّن.',
      },
      {
        key: 'pro',
        nameAr: 'صفحة مخصصة',
        pricingType: 'fixed',
        amountUsd: 70,
        deliveryDays: 7,
        revisions: 2,
        deliverables: ['كل ما في الأساسية', 'تصميم مخصص بهويتك', 'SEO أساسي للعناوين والوصف'],
        scopeNotes: 'تصميم فريد بهويتك مع إعداد أساسي لمحركات البحث.',
      },
      {
        key: 'premium',
        nameAr: 'مخصصة + تحليلات',
        pricingType: 'fixed',
        amountUsd: 100,
        deliveryDays: 9,
        revisions: 2,
        deliverables: ['كل ما في المخصصة', 'ربط Google Analytics', 'نسخة إنجليزية للصفحة'],
        scopeNotes: 'إضافة قياس الزيارات وفهم مصادرها، ونسخة لغوية ثانية.',
      },
    ],
    extraField: {
      question: 'الهدف من الصفحة',
      placeholder: 'مثال: جمع طلبات حجز، عرض خدمة واحدة، حملة إعلانية…',
    },
    requirementsAr: [
      'وصف النشاط والعرض المطلوب إبرازه.',
      'النصوص والصور المتاحة (أو نطلب اعتماد صياغة جديدة).',
      'أمثلة صفحات تعجبك إن وجدت.',
      'النطاق والاستضافة إن وُجدا — ونرشدك لإنشائهما إن لم يوجدا.',
    ],
    faq: [
      {
        q: 'هل تشمل الباقة الاستضافة والنطاق؟',
        a: 'لا — التكاليف السنوية للاستضافة والنطاق مستقلة وتدفع لمزودها مباشرة؛ نرشدك للاختيار ونتولى الإعداد.',
      },
      {
        q: 'أعدّل الصفحة لاحقًا بنفسي؟',
        a: 'نعم — نسلّمك الملفات أو رابط الإدارة مع شرح مختصر، والتعديلات الكبيرة تُسعّر عرضًا جديدًا.',
      },
    ],
  },

  // ═══ 9. Business Website ═══
  {
    slug: 'business-website',
    categoryId: 'web',
    titleAr: 'تطوير موقع أعمال',
    titleEn: 'Business Website Development',
    taglineAr: 'موقع متكامل يمثل شركتك ويشغل خدماتك الحقيقية.',
    descriptionAr:
      'بناء موقع متعدد الصفحات لنشاطك التجاري: من نحن، الخدمات، المدونة إن رغبت، نماذج تواصل — بتصميم احترافي وأداء سريع على الجوال والحاسب.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: 'حتى 5 صفحات',
        pricingType: 'starting_at',
        amountUsd: 100,
        deliveryDays: 12,
        revisions: 2,
        deliverables: ['موقع متجاوب كامل', 'نماذج تواصل تعمل', 'إعداد أساسي SEO'],
        scopeNotes: 'موقع تمهيدي متكامل يعرض نشاطك باحتراف.',
      },
      {
        key: 'pro',
        nameAr: 'حتى 10 صفحات + مدونة',
        pricingType: 'starting_at',
        amountUsd: 180,
        deliveryDays: 18,
        revisions: 2,
        deliverables: ['كل ما في الأساسي', 'قسم مدونة قابل للتحديث', 'ربط أدوات القياس'],
        scopeNotes: 'موقع أوسع مع محتوى قابل للتحديث منك.',
      },
      {
        key: 'premium',
        nameAr: 'مشروع مخصص',
        pricingType: 'quote_required',
        amountUsd: 250,
        deliveryDays: 21,
        revisions: 3,
        deliverables: ['نطاق يُتفق عليه عرضًا خاصًا', 'متجر إلكتروني أو وظائف مخصصة إن لزمت'],
        scopeNotes: 'للمشاريع الأوسع: متاجر، حجوزات، لوحات — يُعتمد النطاق والسعر بعرض خاص قبل البدء.',
      },
    ],
    extraField: {
      question: 'الصفحات المطلوبة تقريبًا',
      placeholder: 'مثال: الرئيسية، خدمات، من نحن، تواصل…',
    },
    requirementsAr: [
      'وصف النشاط وصفحاته المطلوبة.',
      'المحتوى والصور المتاحة.',
      'أمثلة مواقع تعجبك.',
      'النطاق والاستضافة إن وُجدا.',
    ],
    faq: [
      {
        q: 'ما التقنية المستخدمة؟',
        a: 'نختار الأنسب لحجم مشروعك بين قوالب محسّنة وحلول مخصصة، ونوضح لك الخيارات قبل البدء.',
      },
      {
        q: 'هل يوجد صيانة بعد التسليم؟',
        a: 'التسليم يشمل إصلاح أي ملاحظات ضمن التعديلات المتفق عليها؛ ويمكن الاتفاق على صيانة شهرية كخدمة مستقلة.',
      },
    ],
  },

  // ═══ 10. Excel Dashboards ═══
  {
    slug: 'excel-dashboard',
    categoryId: 'business',
    titleAr: 'لوحات بيانات Excel',
    titleEn: 'Excel Dashboards',
    taglineAr: 'بياناتك تتحول لقرارات: لوحات تفاعلية وتقارير واضحة.',
    descriptionAr:
      'تحويل بياناتك المتناثرة إلى لوحات متابعة تفاعلية: تنظيف وتنظيم البيانات، رسوم بيانية، مؤشرات أداء، وتقارير تتحديث تلقائيًا عند إدخال بيانات جديدة.',
    status: 'available',
    packages: [
      {
        key: 'basic',
        nameAr: 'لوحة واحدة',
        pricingType: 'starting_at',
        amountUsd: 20,
        deliveryDays: 3,
        revisions: 1,
        deliverables: ['ملف Excel منظم', 'لوحة متابعة برسوم بيانية'],
        scopeNotes: 'تنظيف بسيط للبيانات وبناء لوحة واحدة واضحة.',
      },
      {
        key: 'pro',
        nameAr: 'لوحات متعددة تفاعلية',
        pricingType: 'starting_at',
        amountUsd: 40,
        deliveryDays: 5,
        revisions: 2,
        deliverables: ['ملف Excel', 'لوحات متعددة بمقسمات تفاعلية (Slicers)', 'ورقة إدخال منظم'],
        scopeNotes: 'فلترة تفاعلية وتقارير متعددة الزوايا من نفس البيانات.',
      },
      {
        key: 'premium',
        nameAr: 'تقرير متكامل',
        pricingType: 'starting_at',
        amountUsd: 60,
        deliveryDays: 7,
        revisions: 2,
        deliverables: ['كل ما في المتعددة', 'أتمتة صيغ وجداول محورية', 'دليل استخدام مصغر'],
        scopeNotes: 'نظام متابعة كامل يتحمل بيانات شهرية متجددة.',
      },
    ],
    extraField: {
      question: 'وصف البيانات المتوفرة',
      placeholder: 'مثال: مبيعات شهرية بملف Excel — نحو 500 صف…',
    },
    requirementsAr: [
      'ملف بياناتك (Excel أو CSV) غير الحساس.',
      'النتيجة المطلوبة: ماذا تريد أن ترى في اللوحة؟',
      'أي تقارير حالية تستخدمها كمرجع.',
    ],
    faq: [
      {
        q: 'بياناتي حساسة — هل هي آمنة؟',
        a: 'أرسل نسخة غير حساسة إن أمكن (أرقام معدلة)، ونستخدم بياناتك للتنفيذ فقط ثم نحذفها وفق سياسة الاحتفاظ.',
      },
      {
        q: 'هل تعمل اللوحة على نسختي من Excel؟',
        a: 'نلتزم بأي إصدار حديث من Excel، ونخبرك مسبقًا إن احتاجت اللوحة إصدارًا أحدث.',
      },
    ],
  },

  // ═══════ خدمات «قريبًا» — تمثل باقي الفئات (§3.3–3.8) ═══════
  {
    slug: 'interview-prep',
    categoryId: 'career',
    titleAr: 'التحضير للمقابلات',
    titleEn: 'Interview Preparation',
    taglineAr: 'أسئلة متوقعة وإجابات تدريبية ومحاكاة مقابلة حقيقية.',
    descriptionAr:
      'جلسة تحضير متخصصة لمقابلتك: أسئلة متوقعة على الدور المستهدف، إجابات تدريبية ببنية واضحة، ومحاكاة بمراجعة أداء.',
    status: 'coming_soon',
    packages: [],
    requirementsAr: [],
    faq: [],
  },
  {
    slug: 'youtube-thumbnails',
    categoryId: 'design',
    titleAr: 'صور مصغرة لليوتيوب',
    titleEn: 'YouTube Thumbnails',
    taglineAr: 'صور مصغرة ترفع نسبة النقر على فيديوهاتك.',
    descriptionAr: 'تصميم صور مصغرة جذابة متوافقة مع محتوى القناة ونمطها البصري.',
    status: 'coming_soon',
    packages: [],
    requirementsAr: [],
    faq: [],
  },
  {
    slug: 'website-maintenance',
    categoryId: 'web',
    titleAr: 'صيانة وتحسين المواقع',
    titleEn: 'Website Maintenance',
    taglineAr: 'تحديثات أسبوعية، إصلاح أخطاء، وتحسين سرعة موقعك القائم.',
    descriptionAr: 'اشتراك صيانة لموقعك الحالي: تحديث المحتوى، إصلاح الأعطال، وتحسين الأداء.',
    status: 'coming_soon',
    packages: [],
    requirementsAr: [],
    faq: [],
  },
  {
    slug: 'data-entry',
    categoryId: 'business',
    titleAr: 'إدخال وتنظيف البيانات',
    titleEn: 'Data Entry & Cleaning',
    taglineAr: 'بيانات منظمة وخالية من التكرار والأخطاء.',
    descriptionAr: 'إدخال بياناتك في جداول منظمة، تنظيفها من التكرار، وتوحيد صيغها.',
    status: 'coming_soon',
    packages: [],
    requirementsAr: [],
    faq: [],
  },
  {
    slug: 'video-editing',
    categoryId: 'media',
    titleAr: 'مونتاج فيديو قصير',
    titleEn: 'Short Video Editing',
    taglineAr: 'ريلز وشورتس بمونتاج سريع الإيقاع يوقف التمرير.',
    descriptionAr: 'مونتاج فيديوهات قصيرة للمنصات الاجتماعية: قص، مؤثرات، ترجمة، وجاذبية بصرية.',
    status: 'coming_soon',
    packages: [],
    requirementsAr: [],
    faq: [],
  },
  {
    slug: 'translation-proofreading',
    categoryId: 'documents',
    titleAr: 'ترجمة وتدقيق لغوي',
    titleEn: 'Translation & Proofreading',
    taglineAr: 'ترجمة دقيقة وتدقيق يرفع جودة مستنداتك.',
    descriptionAr: 'ترجمة مستندات عامة بين العربية والإنجليزية، وتدقيق لغوي شامل للنصوص.',
    status: 'coming_soon',
    packages: [],
    requirementsAr: [],
    faq: [],
  },
];

// ─── دوال مساعدة ───

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getCategoryById(id: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((c) => c.id === id);
}

export function getServicesByCategory(categoryId: string): Service[] {
  return SERVICES.filter((s) => s.categoryId === categoryId);
}

/** الخدمات المتاحة أولًا ثم القريبة — ضمن كل فئة */
export function sortedServices(): Service[] {
  return [...SERVICES].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'available' ? -1 : 1;
    return a.categoryId.localeCompare(b.categoryId);
  });
}

/** عرض السعر الاسترشادي: «يبدأ من X$» أو «عرض سعر» أو «X$» */
export function formatPriceHint(service: Service): string {
  const fixed = service.packages.filter((p) => p.pricingType === 'fixed' && p.amountUsd);
  const starting = service.packages.filter((p) => p.pricingType === 'starting_at' && p.amountUsd);
  if (service.packages.some((p) => p.pricingType === 'quote_required')) {
    const min = Math.min(...(service.packages.filter((p) => p.amountUsd).map((p) => p.amountUsd as number)));
    return min ? `من ${min}$` : 'عرض سعر';
  }
  if (starting.length) return `يبدأ من ${Math.min(...starting.map((p) => p.amountUsd as number))}$`;
  if (fixed.length) return `${Math.min(...fixed.map((p) => p.amountUsd as number))}$`;
  return 'قريبًا';
}

export const PACKAGE_KEY_LABELS: Record<ServicePackage['key'], string> = {
  basic: 'أساسية',
  pro: 'احترافية',
  premium: 'مميزة',
};
