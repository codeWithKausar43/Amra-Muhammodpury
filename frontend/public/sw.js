// Service Worker for আমরা মোহাম্মদপুরী (Amra Mohammodpury)
// Enables Web Push Notifications, Background Notifications, and Sound/Vibration alerts
const SW_VERSION = 'v2-clean';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Push notification event (triggered when app is closed or in background with mobile data / wifi on)
self.addEventListener('push', (event) => {
  let data = {
    title: 'আমরা মোহাম্মদপুরী',
    body: 'আপনার অ্যাকাউন্টে নতুন আপডেট এসেছে!',
    url: '/organization/member',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
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

