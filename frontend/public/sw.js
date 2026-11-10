// Service Worker for আমরা মোহাম্মদপুরী (Amra Mohammodpury)
// Enables Web Push Notifications, Background Notifications, Safe Static Asset Caching, and PWA Support.
const SW_VERSION = 'v3-clean';
const STATIC_CACHE_NAME = `amra-static-${SW_VERSION}`;

// Precache strictly safe, public, non-sensitive static branding assets
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
  '/logos/app-logo.png',
  '/sounds/notification.wav',
  '/fonts/SolaimanLipi.woff2',
  '/fonts/SolaimanLipi-Bold.woff2',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        // Precache error should never block SW installation
        console.warn('[SW] Precache non-blocking warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== STATIC_CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Safe Caching & Fetch Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 1. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 2. NEVER cache sensitive or dynamic requests:
  // - API endpoints (/api/*)
  // - Cross-origin backend API (onrender.com or localhost:5000)
  // - Next.js RSC Server Components (_rsc query)
  // - Socket.io or WebSockets
  // - Browser extensions
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('onrender.com') ||
    url.pathname.includes('/socket.io') ||
    url.searchParams.has('_rsc') ||
    !url.protocol.startsWith('http')
  ) {
    return;
  }

  // 3. Cache-First for safe static assets (icons, logos, fonts, sounds, manifest)
  const isSafeStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/logos/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.startsWith('/sounds/') ||
      url.pathname === '/manifest.json' ||
      url.pathname === '/favicon.png' ||
      url.pathname === '/favicon.ico');

  if (isSafeStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Network-First with safe fallback for HTML navigations
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }
});

// Push notification event (triggered when app is closed or in background)
self.addEventListener('push', (event) => {
  let data = {
    title: 'আমরা মোহাম্মদপুরী',
    body: 'আপনার অ্যাকাউন্টে নতুন আপডেট এসেছে!',
    url: '/organization/member',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const title = data.title || 'আমরা মোহাম্মদপুরী';
  const options = {
    body: data.body || 'নতুন নোটিফিকেশন!',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    vibrate: [300, 100, 300, 100, 300],
    sound: '/sounds/notification.wav',
    data: {
      url: data.url || '/organization/member',
      dateOfArrival: Date.now(),
    },
    tag: data.tag || 'org-notification-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'দেখুন' },
      { action: 'close', title: 'বাতিল' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event (opens or focuses the app)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(urlToOpen)) {
            return client.focus();
          }
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle local broadcast message to trigger notification from foreground/client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, tag } = event.data;
    self.registration.showNotification(title || 'আমরা মোহাম্মদপুরী', {
      body: body || 'নতুন নোটিফিকেশন',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [300, 100, 300, 100, 300],
      sound: '/sounds/notification.wav',
      data: { url: url || '/organization/member' },
      tag: tag || 'local-notification',
      renotify: true,
    });
  }
});
