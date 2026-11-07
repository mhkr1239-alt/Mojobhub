import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setupAdminServiceWorker } from '../lib/adminServiceWorker';

export const AdminPwaSetup: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

    if (isAdminRoute) {
      // (a) Make sure <link rel="manifest" id="admin-manifest" href="/manifest.json"> exists in document.head
      let manifestLink = document.getElementById('admin-manifest') as HTMLLinkElement | null;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.id = 'admin-manifest';
        manifestLink.rel = 'manifest';
        manifestLink.href = '/manifest.json';
        document.head.appendChild(manifestLink);
      }

      // (b) Register the admin service worker once via the single-flight helper (WP-2.2)
      // scope: '/admin/' + legacy root-scope migration — handled inside the helper
      if ('serviceWorker' in navigator) {
        void setupAdminServiceWorker();
      }
    } else {
      // On any other pathname remove the #admin-manifest link if present
      const manifestLink = document.getElementById('admin-manifest');
      if (manifestLink) {
        manifestLink.remove();
      }
    }
  }, [location.pathname]);

  return null;
};
