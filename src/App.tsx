import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
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
import { AdminPage } from './pages/AdminPage';
import { AdminApplicationDetailPage } from './pages/AdminApplicationDetailPage';
import { AdminOffersPage } from './pages/AdminOffersPage';
import { AdminOfferEditorPage } from './pages/AdminOfferEditorPage';
import { AdminAiSettingsPage } from './pages/AdminAiSettingsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

function PublicLayout() {
  // أنيميشن الظهور عند التمرير — مراقب واحد لكل الصفحات العامة
  useEffect(() => initReveal(), []);

  return (
    <div className="min-h-screen flex flex-col font-sans text-ink selection:bg-[var(--c-accent-soft)] selection:text-[var(--c-accent)]">
      <div className="bg-blobs" aria-hidden="true"><span className="blob-1"></span><span className="blob-2"></span></div>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="footer-deep border-t border-white/10 py-6 text-xs text-[var(--c-deep-ink)] opacity-80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right" dir="rtl">
          <div>
            <span>بوابة التقديم على الوظائف — جميع الحقوق محفوظة</span>
          </div>
          <div className="text-[var(--c-deep-ink)] opacity-70 flex items-center gap-3">
            <Link to="/privacy" className="hover:text-[var(--c-accent)] underline underline-offset-2 transition-colors">
              سياسة الخصوصية
            </Link>
            <span aria-hidden="true">•</span>
            <span>تقديم مباشر وسريع للوظائف المتاحة</span>
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

