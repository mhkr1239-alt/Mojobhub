import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const AdminPwaSetup: React.FC = () => {
  const location = useLocation();
  const swRegisteredRef = useRef(false);

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

      // (b) Register "/service-worker.js" once if "serviceWorker" in navigator
      if ('serviceWorker' in navigator && !swRegisteredRef.current) {
        swRegisteredRef.current = true;
        navigator.serviceWorker.register('/service-worker.js').catch((err) => {
          console.error('Admin service worker registration failed:', err);
        });
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
