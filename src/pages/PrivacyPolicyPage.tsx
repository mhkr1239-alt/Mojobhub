import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Database,
  Lock,
  Eye,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Clock,
} from 'lucide-react';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ icon, title, children }) => (
  <section className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 sm:p-6 shadow-xs">
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-9 h-9 rounded-[12px] bg-[#E3EEF7] border border-[#0F4C81]/15 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <h2 className="text-base sm:text-lg font-bold text-[#0A2540]">{title}</h2>
    </div>
    <div className="text-sm text-[#5A6B7E] leading-relaxed space-y-2">{children}</div>
  </section>
);

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-16" dir="rtl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-[16px] bg-[#E3EEF7] border border-[#0F4C81]/20 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-7 h-7 text-[#0F4C81]" />
        </div>
        <h1 className="text-[28px] font-extrabold text-[#0A2540] tracking-tight">
          سياسة الخصوصية
        </h1>
        <p className="text-sm text-[#5A6B7E] mt-2">
          بوابة "فرص التوظيف" — توضح هذه الصفحة البيانات التي نجمعها وكيف نستخدمها ونحميها.
        </p>
        <p className="text-xs text-[#5A6B7E]/80 mt-1">آخر تحديث: 1 نوفمبر 2026</p>
      </div>

      {/* Draft notice banner */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-[16px] flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">
          هذه <span className="font-bold">مسودة سياسة خصوصية</span> تحتاج مراجعة قانونية قبل استقبال
          أول متقدم حقيقي. الفقرات هنا تصف طريقة عمل المنصة الفعلية حاليًا، وقد تتحدث الصياغة بعد
          المراجعة.
        </div>
      </div>

      <div className="space-y-4">
        <Section icon={<Database className="w-4.5 h-4.5 text-[#0F4C81]" />} title="البيانات التي نجمعها">
          <p>عند تقديم طلب على وظيفة، نجمع:</p>
          <ul className="list-disc pr-5 space-y-1">
            <li>الاسم بالكامل.</li>
            <li>رقم الواتساب للتواصل.</li>
            <li>بيانات نموذج التقديم الخاصة بكل وظيفة (مثل: السن، محل الإقامة، المؤهلات — حسب متطلبات كل إعلان).</li>
            <li>الملفات التي ترفعها بنفسك (مثل: صورة شخصية، بطاقة الهوية، السيرة الذاتية).</li>
            <li>إثبات موافقتك على هذه السياسة (وقت الموافقة).</li>
          </ul>
          <p>
            لا نجمع أي بيانات دفع أو بطاقات بنكية، والتقديم لا يحتاج إنشاء حساب أو كلمة مرور.
          </p>
        </Section>

        <Section icon={<FileText className="w-4.5 h-4.5 text-[#0F4C81]" />} title="كيف نستخدم بياناتك">
          <ul className="list-disc pr-5 space-y-1">
            <li>مراجعة طلبك للوظيفة التي تقدمت عليها.</li>
            <li>مشاركة بياناتك مع الجهة المسؤولة عن الوظيفة (جهة التوظيف) فقط.</li>
            <li>التواصل معك بشأن طلبك عبر رقم الواتساب الذي كتبته.</li>
          </ul>
          <p>
            لا نستخدم بيانات المتقدمين في إعلانات أو تسويق، ولا نبيعها ولا نؤجرها لأي طرف لأي غرض.
          </p>
        </Section>

        <Section icon={<Lock className="w-4.5 h-4.5 text-[#0F4C81]" />} title="التخزين والحماية">
          <p>
            تُخزَّن البيانات والملفات إلكترونيًا على خدمة استضافة سحابية محمية. الوصول إلى بيانات
            المتقدمين محصور بفريق إدارة المنصة عبر حساب إداري محمي بكلمة مرور، ولا يستطيع الزوار
            العاديون الاطلاع على بيانات أي متقدم.
          </p>
        </Section>

        <Section icon={<Eye className="w-4.5 h-4.5 text-[#0F4C81]" />} title="التتبع وملفات تعريف الارتباط">
          <p>
            صفحات التقديم العامة لا تستخدم أدوات تتبع أو تحليلات خارجية، ولا نضع ملفات تتبع
            (Cookies) على متصفحك.
          </p>
        </Section>

        <Section icon={<UserCheck className="w-4.5 h-4.5 text-[#0F4C81]" />} title="حقوقك">
          <ul className="list-disc pr-5 space-y-1">
            <li>لك الحق في طلب الاطلاع على بياناتك أو تصحيحها أو حذفها.</li>
            <li>الموافقة على هذه السياسة اختيارية، لكنها شرط لإرسال الطلب — لو لم توافق لن يتم إرسال أي بيانات.</li>
          </ul>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-[12px] text-amber-800 text-xs sm:text-sm font-medium">
            وسيلة التواصل لطلبات الاطلاع أو الحذف: غير محددة حاليًا — ستُحدَّث هذه الفقرة عند تحديد
            وسيلة التواصل الرسمية.
          </div>
        </Section>

        <Section icon={<Clock className="w-4.5 h-4.5 text-[#0F4C81]" />} title="مدة الاحتفاظ بالبيانات">
          <p>
            نحتفظ ببياناتك للمدة اللازمة لمراجعة طلبك وإتمام عملية التوظيف للوظيفة التي تقدمت عليها.
            بعد انتهاء الغرض يتم حذف البيانات.
          </p>
        </Section>

        <Section icon={<RefreshCw className="w-4.5 h-4.5 text-[#0F4C81]" />} title="تعديلات على هذه السياسة">
          <p>
            قد نُحدّث هذه السياسة من وقت لآخر، وأي تعديل سيظهر في هذه الصفحة مع تحديث تاريخ "آخر
            تحديث" أعلاها.
          </p>
        </Section>
      </div>

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link
          to="/jobs"
          className="inline-flex items-center justify-center gap-2 bg-[#0F4C81] hover:bg-[#0C3D68] text-white font-bold text-sm px-5 py-2.5 rounded-[12px] transition shadow-xs"
        >
          <span>العودة للوظائف</span>
        </Link>
      </div>
    </div>
  );
};
