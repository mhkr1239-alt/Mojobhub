// Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  let payload = {
    title: 'إشعار جديد',
    body: 'هناك تحديث جديد في لوحة التحكم.',
    url: '/admin'
  };

  try {
    if (event.data) {
      const data = event.data.json();
      if (data) {
        payload = {
          title: data.title || payload.title,
          body: data.body || payload.body,
          url: data.url || payload.url
        };
      }
    }
  } catch (err) {
    console.error('Error parsing push data:', err);
    if (event.data) {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: payload.url || '/admin'
    }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Minimal fetch handler for PWA installability requirements
// Strictly pass-through: does not cache or intercept any network, Supabase, or API requests
self.addEventListener('fetch', (event) => {
  // Pass-through without caching
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate if needed
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl) || targetUrl === '/admin') {
            return client.focus();
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
