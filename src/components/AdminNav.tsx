import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, FileText, ShieldCheck, LogOut, ExternalLink, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminPushNotificationOptIn } from './AdminPushNotificationOptIn';

interface AdminNavProps {
  activeTab?: 'applications' | 'offers' | 'ai-settings';
}

export const AdminNav: React.FC<AdminNavProps> = ({ activeTab }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const currentTab =
    activeTab ||
    (location.pathname.startsWith('/admin/ai-settings')
      ? 'ai-settings'
      : location.pathname.startsWith('/admin/offers')
      ? 'offers'
      : 'applications');

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="mb-6 bg-[#131A21] border border-[#232F3A] rounded-xl p-2.5 sm:p-3 shadow-md" dir="rtl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left/Right branding info */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1A232C] border border-[#232F3A] flex items-center justify-center text-[#1FA98A]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-[#E6EDF2] block leading-tight">
                  لوحة تحكم المسؤول
                </span>
                <span className="text-[10px] font-mono text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/20 px-1.5 py-0.2 rounded">
                  Admin
                </span>
              </div>
              {user?.email && (
                <span className="text-[11px] text-[#8B98A5] font-mono block leading-tight truncate max-w-[200px]">
                  {user.email}
                </span>
              )}
            </div>
          </div>

          {/* Quick link to candidate site on mobile */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            title="معاينة الموقع العام"
            className="md:hidden text-[#8B98A5] hover:text-[#E6EDF2] p-1.5 rounded-lg bg-[#1A232C] border border-[#232F3A]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Navigation Tabs + Push Opt-in + Logout */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-[#1A232C] p-1 rounded-lg border border-[#232F3A] flex-1 md:flex-initial">
            <Link
              to="/admin"
              className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                currentTab === 'applications'
                  ? 'bg-[#131A21] text-[#1FA98A] border border-[#232F3A] shadow-xs'
                  : 'text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#131A21]/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>طلبات التقديم</span>
            </Link>

            <Link
              to="/admin/offers"
              className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                currentTab === 'offers'
                  ? 'bg-[#131A21] text-[#1FA98A] border border-[#232F3A] shadow-xs'
                  : 'text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#131A21]/50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>إدارة الوظائف</span>
            </Link>

            <Link
              to="/admin/ai-settings"
              className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                currentTab === 'ai-settings'
                  ? 'bg-[#131A21] text-[#1FA98A] border border-[#232F3A] shadow-xs'
                  : 'text-[#8B98A5] hover:text-[#E6EDF2] hover:bg-[#131A21]/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>الذكاء الاصطناعي</span>
            </Link>
          </div>

          {/* Push notification toggle */}
          <AdminPushNotificationOptIn />

          {/* View candidate site button (desktop) */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            title="معاينة الموقع العام"
            className="hidden md:inline-flex items-center gap-1 text-xs text-[#8B98A5] hover:text-[#E6EDF2] px-2.5 py-1.5 rounded-lg bg-[#1A232C] border border-[#232F3A] transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>الموقع</span>
          </Link>

          {/* Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            title="تسجيل الخروج من لوحة التحكم"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#E1615E] bg-[#E1615E]/10 hover:bg-[#E1615E]/20 border border-[#E1615E]/20 transition cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 rotate-180" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
};

