import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { initReveal } from './lib/revealController';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { Navbar } from './components/Navbar';
import { AdminPwaSetup } from './components/AdminPwaSetup';
import { HomePage } from './pages/HomePage';
import { JobsPage } from './pages/JobsPage';
import { ServicesPage } from './pages/ServicesPage';
import { OfferDetailPage } from './pages/OfferDetailPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { AccountLoginPage } from './pages/AccountLoginPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { AdminApplicationDetailPage } from './pages/AdminApplicationDetailPage';
import { AdminOffersPage } from './pages/AdminOffersPage';
import { AdminOfferEditorPage } from './pages/AdminOfferEditorPage';
import { AdminAiSettingsPage } from './pages/AdminAiSettingsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

function PublicLayout() {
  const location = useLocation();
  // أنيميشن الظهور عند التمرير — مراقب واحد لكل الصفحات العامة
  useEffect(() => initReveal(), []);

  return (
    <div className="min-h-screen flex flex-col font-sans text-ink selection:bg-[var(--c-accent-soft)] selection:text-[var(--c-accent)]">
      <div className="bg-blobs" aria-hidden="true"><span className="blob-1"></span><span className="blob-2"></span></div>
      <Navbar />
      <main className="flex-1">
        {/* انتقال صفحة سلس عند كل تنقل — key يعيد تركيب محتوى المسار مع حركة ظهور هادئة */}
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
      <footer className="footer-deep border-t border-white/10 pt-7 pb-6 text-xs text-[var(--c-deep-ink)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-4" dir="rtl">
          {/* صف العلامة */}
          <div className="flex items-center justify-center sm:justify-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="6" width="5" height="11" rx="2.5" fill="var(--c-sky)" />
                <rect x="12" y="3" width="5" height="14" rx="2.5" fill="var(--c-sky)" />
              </svg>
            </div>
            <span className="font-extrabold text-sm">فرص التوظيف</span>
            <span className="opacity-60">— بوابة التقديم المباشر</span>
          </div>
          <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right opacity-80">
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
            <div className="flex items-center gap-3">
              <Link to="/privacy" className="hover:text-[var(--c-sky)] underline underline-offset-2 transition-colors">
                سياسة الخصوصية
              </Link>
              <span aria-hidden="true">•</span>
              <span>تقديم مباشر وسريع للوظائف المتاحة</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AdminPwaSetup />
        <Routes>
          {/* Public Candidate Experience */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/offers/:id" element={<OfferDetailPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/account/login" element={<AccountLoginPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          {/* Admin Authentication Gate */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/applications/:id"
            element={
              <AdminProtectedRoute>
                <AdminApplicationDetailPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/offers"
            element={
              <AdminProtectedRoute>
                <AdminOffersPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/offers/new"
            element={
              <AdminProtectedRoute>
                <AdminOfferEditorPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/offers/:id/edit"
            element={
              <AdminProtectedRoute>
                <AdminOfferEditorPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-settings"
            element={
              <AdminProtectedRoute>
                <AdminAiSettingsPage />
              </AdminProtectedRoute>
            }
          />

          {/* Catch-all redirect to public home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

