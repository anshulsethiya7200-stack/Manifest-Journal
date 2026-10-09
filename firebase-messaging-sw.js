// ════════════════════════════════════════════════════════════════════════════
// Manifest Journal — Firebase Cloud Messaging Background Service Worker
// ════════════════════════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize Firebase with the provided configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAFfTDrw0sESsTua52l_7JhA4Y-oW2Tlo",
  authDomain: "manifest-journal-9bb90.firebaseapp.com",
  projectId: "manifest-journal-9bb90",
  storageBucket: "manifest-journal-9bb90.firebasestorage.app",
  messagingSenderId: "338855149178",
  appId: "1:338855149178:web:23b6be17010acc887085c3",
  measurementId: "G-EL3V0ENWEC"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle incoming background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'Manifest Journal ✨';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'Stay anchored to your daily manifestation rituals.',
    icon: payload.notification?.icon || payload.data?.icon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: payload.data?.tag || 'manifest-notification',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      url: payload.data?.url || '/',
      ...(payload.data || {}),
    },
  };

  return self.registration.showNotification(title, options);
});

// Handle notification click to open / focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client && urlToOpen !== '/') {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
