import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { AdminNav } from '../components/AdminNav';
import { friendlyDbError } from '../lib/friendlyError';
import {
  RefreshCw,
  Search,
  ClipboardList,
  Clock,
  Mail,
  Phone,
  Globe,
  Link2,
  User,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';

// ─── الحالات المعتمدة (وفق §5.3 — الجولة الأولى التشغيلية) ───
const REQUEST_STATUSES = [
  { value: 'submitted', label: 'جديد', color: '#4C83E8' },
  { value: 'needs_information', label: 'يحتاج معلومات', color: '#E0A23C' },
  { value: 'awaiting_payment', label: 'بانتظار الدفع', color: '#B4831C' },
  { value: 'in_progress', label: 'قيد التنفيذ', color: '#625BE7' },
  { value: 'delivered', label: 'مُسلَّم', color: '#1FA98A' },
  { value: 'completed', label: 'مكتمل', color: '#1FA98A' },
  { value: 'cancelled', label: 'ملغى', color: '#E1615E' },
] as const;

const statusMeta = (v: string) => REQUEST_STATUSES.find((s) => s.value === v) ?? REQUEST_STATUSES[0];

interface ServiceRequest {
  id: string;
  reference_code: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  preferred_contact: string | null;
  service_slug: string;
  service_title: string;
  package_key: string | null;
  package_name: string | null;
  extra_field_question: string | null;
  extra_field_answer: string | null;
  details: string;
  reference_link: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const AdminServiceRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (qErr) throw qErr;
      setRequests((data as ServiceRequest[]) || []);
    } catch (err: any) {
      console.error('[admin-service-requests]', err);
      setError(friendlyDbError(err, 'فشل تحميل طلبات الخدمات من قاعدة البيانات.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const { error: uErr } = await supabase.from('service_requests').update({ status }).eq('id', id);
    if (uErr) {
      console.error('[update-status]', uErr);
      setError(friendlyDbError(uErr, 'فشل تحديث حالة الطلب.'));
    } else {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
    setUpdatingId(null);
  };

  const saveNote = async (id: string) => {
    const note = (noteDraft[id] ?? '').trim();
    setUpdatingId(id);
    const { error: uErr } = await supabase.from('service_requests').update({ admin_notes: note || null }).eq('id', id);
    if (uErr) {
      console.error('[save-note]', uErr);
      setError(friendlyDbError(uErr, 'فشل حفظ الملاحظة الداخلية.'));
    } else {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, admin_notes: note || null } : r)));
    }
    setUpdatingId(null);
  };

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase().trim();
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!t) return true;
      return (
        r.reference_code.toLowerCase().includes(t) ||
        r.name.toLowerCase().includes(t) ||
        r.email.toLowerCase().includes(t) ||
        r.service_title.toLowerCase().includes(t)
      );
    });
  }, [requests, searchTerm, statusFilter]);

  const countByStatus = (v: string) => requests.filter((r) => r.status === v).length;
  const newCount = countByStatus('submitted');

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF2] py-6 sm:py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <AdminNav activeTab="service-requests" />

        {/* الترويسة */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#E6EDF2] tracking-tight">طلبات الخدمات</h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8B98A5]">
              طلبات خدمات مورا الواردة من الموقع العام — مراجعة وتحديث الحالة والملاحظات الداخلية.
            </p>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B98A5] hover:text-[#E6EDF2] bg-[#131A21] border border-[#232F3A] hover:bg-[#1A232C] px-3 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatBox label="إجمالي الطلبات" value={requests.length} color="#E6EDF2" />
          <StatBox label="جديدة تحتاج مراجعة" value={newCount} color="#4C83E8" />
          <StatBox label="قيد التنفيذ" value={countByStatus('in_progress')} color="#625BE7" />
          <StatBox label="مكتملة" value={countByStatus('completed') + countByStatus('delivered')} color="#1FA98A" />
        </div>

        {/* البحث والفلترة */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-[#8B98A5] pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالرقم المرجعي، الاسم، البريد، أو الخدمة…"
              className="w-full bg-[#131A21] border border-[#232F3A] rounded-lg pr-10 pl-3 py-2 text-xs text-[#E6EDF2] placeholder:text-[#8B98A5]/70 focus:outline-none focus:ring-1 focus:ring-[#1FA98A]/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#131A21] border border-[#232F3A] rounded-lg px-3 py-2 text-xs text-[#E6EDF2] focus:outline-none focus:ring-1 focus:ring-[#1FA98A]/50 cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            {REQUEST_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* الأخطاء */}
        {error && (
          <div className="flex items-center gap-2 bg-[#E1615E]/10 border border-[#E1615E]/30 text-[#E1615E] rounded-lg p-3 text-xs font-bold mb-5">
            <MessageSquare className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* القائمة */}
        {loading ? (
          <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-10 text-center text-[#8B98A5] text-xs">
            جارٍ تحميل الطلبات…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-10 text-center">
            <ClipboardList className="w-10 h-10 text-[#8B98A5]/40 mx-auto mb-3" />
            <p className="text-xs text-[#8B98A5]">
              {requests.length === 0
                ? 'لا توجد طلبات خدمات بعد — أول ما يصل طلب من الموقع هيظهر هنا فورًا.'
                : 'لا توجد طلبات مطابقة للبحث أو الفلترة الحالية.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((r) => {
              const meta = statusMeta(r.status);
              const expanded = expandedId === r.id;
              return (
                <div key={r.id} className="bg-[#131A21] border border-[#232F3A] rounded-xl overflow-hidden shadow-xs">
                  {/* صف الطلب */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : r.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right hover:bg-[#1A232C]/60 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[11px] font-bold text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/25 px-2 py-0.5 rounded" dir="ltr">
                        {r.reference_code}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#E6EDF2] truncate">{r.service_title}</p>
                        <p className="text-[10px] text-[#8B98A5] truncate">
                          {r.name} · {r.package_name ?? 'بدون باقة'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[10px] text-[#8B98A5] hidden sm:inline">
                        {new Date(r.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                      </span>
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                        style={{ color: meta.color, backgroundColor: `${meta.color}1A`, border: `1px solid ${meta.color}40` }}
                      >
                        {meta.label}
                      </span>
                      {expanded ? <ChevronUp className="w-4 h-4 text-[#8B98A5]" /> : <ChevronDown className="w-4 h-4 text-[#8B98A5]" />}
                    </div>
                  </button>

                  {/* التفاصيل الموسعة */}
                  {expanded && (
                    <div className="border-t border-[#232F3A] px-4 py-4 space-y-4">
                      {/* بيانات العميل */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                        <InfoRow icon={<User className="w-3.5 h-3.5" />} label="الاسم" value={r.name} />
                        <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="البريد" value={r.email} ltr />
                        {r.phone && <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="الهاتف" value={r.phone} ltr />}
                        {r.country && <InfoRow icon={<Globe className="w-3.5 h-3.5" />} label="البلد" value={r.country} />}
                        <InfoRow
                          icon={<Clock className="w-3.5 h-3.5" />}
                          label="قناة التواصل المفضلة"
                          value={r.preferred_contact === 'phone' ? 'الهاتف' : 'البريد الإلكتروني'}
                        />
                        {r.reference_link && (
                          <InfoRow
                            icon={<Link2 className="w-3.5 h-3.5" />}
                            label="رابط مرجعي"
                            value={r.reference_link}
                            ltr
                            href={r.reference_link}
                          />
                        )}
                      </div>

                      {/* الحقل الديناميكي */}
                      {r.extra_field_question && r.extra_field_answer && (
                        <div className="bg-[#1A232C] border border-[#232F3A] rounded-lg p-3">
                          <p className="text-[10px] font-bold text-[#8B98A5] mb-1">{r.extra_field_question}</p>
                          <p className="text-xs text-[#E6EDF2]">{r.extra_field_answer}</p>
                        </div>
                      )}

                      {/* وصف المطلوب */}
                      <div className="bg-[#1A232C] border border-[#232F3A] rounded-lg p-3">
                        <p className="text-[10px] font-bold text-[#8B98A5] mb-1">وصف المطلوب من العميل</p>
                        <p className="text-xs text-[#E6EDF2] leading-relaxed whitespace-pre-wrap">{r.details}</p>
                      </div>

                      {/* الأدوات: تغيير الحالة + ملاحظة داخلية */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-[#8B98A5] mb-1.5">تحديث الحالة</label>
                          <div className="flex items-center gap-2">
                            <select
                              value={r.status}
                              onChange={(e) => updateStatus(r.id, e.target.value)}
                              disabled={updatingId === r.id}
                              className="flex-1 bg-[#131A21] border border-[#232F3A] rounded-lg px-3 py-2 text-xs text-[#E6EDF2] focus:outline-none focus:ring-1 focus:ring-[#1FA98A]/50 disabled:opacity-50 cursor-pointer"
                            >
                              {REQUEST_STATUSES.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                            {updatingId === r.id && <span className="text-[10px] text-[#8B98A5]">جارٍ الحفظ…</span>}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#8B98A5] mb-1.5">ملاحظة داخلية (لن يراها العميل)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={noteDraft[r.id] ?? r.admin_notes ?? ''}
                              onChange={(e) => setNoteDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              placeholder="مثال: تم التواصل مع العميل وتأكيد السعر…"
                              className="flex-1 bg-[#131A21] border border-[#232F3A] rounded-lg px-3 py-2 text-xs text-[#E6EDF2] placeholder:text-[#8B98A5]/60 focus:outline-none focus:ring-1 focus:ring-[#1FA98A]/50"
                            />
                            <button
                              type="button"
                              onClick={() => saveNote(r.id)}
                              disabled={updatingId === r.id}
                              className="text-[10px] font-bold text-[#0B0F14] bg-[#1FA98A] hover:bg-[#18886F] px-3 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer"
                            >
                              حفظ
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── مكونات مساعدة ───

const StatBox: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="bg-[#131A21] border border-[#232F3A] rounded-xl p-3.5 shadow-xs">
    <div className="text-[11px] font-semibold text-[#8B98A5] mb-1">{label}</div>
    <div className="text-xl font-bold font-mono" style={{ color }}>{value}</div>
  </div>
);

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
  href?: string;
}> = ({ icon, label, value, ltr, href }) => (
  <div className="flex items-start gap-2 bg-[#1A232C] border border-[#232F3A] rounded-lg px-3 py-2">
    <span className="text-[#8B98A5] mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] text-[#8B98A5]">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4C83E8] hover:underline break-all" dir={ltr ? 'ltr' : undefined}>
          {value}
        </a>
      ) : (
        <p className="text-xs text-[#E6EDF2] break-all" dir={ltr ? 'ltr' : undefined}>{value}</p>
      )}
    </div>
  </div>
);
