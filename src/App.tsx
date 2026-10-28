import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { Navbar } from './components/Navbar';
import { AdminPwaSetup } from './components/AdminPwaSetup';
import { HomePage } from './pages/HomePage';
import { OfferDetailPage } from './pages/OfferDetailPage';
import { AdminPage } from './pages/AdminPage';
import { AdminApplicationDetailPage } from './pages/AdminApplicationDetailPage';
import { AdminOffersPage } from './pages/AdminOffersPage';
import { AdminOfferEditorPage } from './pages/AdminOfferEditorPage';
import { AdminAiSettingsPage } from './pages/AdminAiSettingsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col text-[#0B2B26] font-sans selection:bg-[#E7F3F0] selection:text-[#0F6657]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-[#E7F3F0] py-6 text-xs text-[#5B6B67]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right" dir="rtl">
          <div>
            <span>بوابة التقديم على الوظائف — جميع الحقوق محفوظة</span>
          </div>
          <div className="text-[#5B6B67]/80">
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
            <Route path="/offers/:id" element={<OfferDetailPage />} />
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

