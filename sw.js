// ═══════════════════════════════════════
// FILE: sw.js
// Manifest Journal — Security Layer
// ═══════════════════════════════════════

const APP_VERSION = 'v1.0.1';
const CACHE_NAME = `manifest-journal-${APP_VERSION}`;
const INTEGRITY_CACHE_NAME = 'manifest-journal-integrity';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

const ALLOWED_ORIGINS = [
  self.location.origin,
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

// Notification template presets (never allows unsanitized raw user strings)
const NOTIFICATION_TEMPLATES = {
  'mj-journal': {
    title: 'Time for your daily reflection',
    body: 'Anchor your achievements and maintain your intentional awareness today.',
  },
  'mj-script': {
    title: 'Daily Scripting Momentum',
    body: 'Step into your sacred space and script your intentional reality.',
  },
  'mj-goals': {
    title: 'Check Your Milestones',
    body: 'Review your multi-horizon intentions and celebrate your continuous progress.',
  },
};

/**
 * Computes SHA-256 digest of response body.
 */
async function hashResponse(response) {
  const buffer = await response.clone().arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Safely stores a response along with its SHA-256 integrity hash.
 */
async function putWithIntegrity(cache, integrityCache, request, response) {
  const hash = await hashResponse(response);
  const url = typeof request === 'string' ? request : request.url;

  await cache.put(request, response.clone());
  await integrityCache.put(
    new Request(`${url}-hash`),
    new Response(hash, { headers: { 'Content-Type': 'text/plain' } })
  );
}

/**
 * Verifies all cached assets against their stored SHA-256 hashes.
 */
async function verifyCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const integrityCache = await caches.open(INTEGRITY_CACHE_NAME);
    const requests = await cache.keys();

    let verifiedCount = 0;
    let corruptedCount = 0;

    for (const req of requests) {
      const response = await cache.match(req);
      const hashResponseObj = await integrityCache.match(new Request(`${req.url}-hash`));

      if (response && hashResponseObj) {
        const expectedHash = await hashResponseObj.text();
        const currentHash = await hashResponse(response);

        if (expectedHash !== currentHash) {
          console.warn('[SW Security] Integrity mismatch on cached asset:', req.url);
          corruptedCount++;
          await cache.delete(req);
          await integrityCache.delete(new Request(`${req.url}-hash`));

          // Re-fetch from network to heal cache
          try {
            const fresh = await fetch(req);
            if (fresh.ok) {
              await putWithIntegrity(cache, integrityCache, req, fresh);
            }
          } catch (e) {
            console.warn('[SW Security] Failed to re-fetch corrupted asset:', req.url);
          }
        } else {
          verifiedCount++;
        }
      }
    }

    console.info(`[SW Security] Cache integrity audit: ${verifiedCount} verified, ${corruptedCount} healed.`);
  } catch (err) {
    console.error('[SW Security] Cache verification failed:', err);
  }
}

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      console.log('[SW] Pre-caching secure app shell');
      const cache = await caches.open(CACHE_NAME);
      const integrityCache = await caches.open(INTEGRITY_CACHE_NAME);

      for (const asset of PRECACHE_ASSETS) {
        try {
          const response = await fetch(asset);
          if (response.ok) {
            await putWithIntegrity(cache, integrityCache, asset, response);
          }
        } catch (e) {
          console.warn('[SW] Could not precache asset:', asset);
        }
      }
    })()
  );
  self.skipWaiting();
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== INTEGRITY_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
      await self.clients.claim();
      await verifyCache();
    })()
  );
});

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  const url = new URL(event.request.url);

  // Origin verification: block unauthorized foreign domains
  if (
    event.request.mode !== 'navigate' &&
    !ALLOWED_ORIGINS.some((allowed) => url.origin === allowed || url.origin.endsWith('fonts.googleapis.com') || url.origin.endsWith('fonts.gstatic.com'))
  ) {
    event.respondWith(new Response('Blocked by Service Worker Origin Policy', { status: 403 }));
    return;
  }

  // Navigation requests: network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            const integrityCache = await caches.open(INTEGRITY_CACHE_NAME);
            await putWithIntegrity(cache, integrityCache, event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cached = await caches.match('/index.html');
          return cached || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Static assets: cache-first with strict type validation
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);

        // Security filters before caching
        if (
          !response ||
          response.status !== 200 ||
          response.status === 206 ||
          (response.type === 'opaque' && url.origin === self.location.origin)
        ) {
          return response;
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const pathname = url.pathname.toLowerCase();

        // Enforce content-type correctness before saving to cache
        let isCacheableType = true;
        if (pathname.endsWith('.js') && !contentType.includes('javascript')) {
          isCacheableType = false;
        } else if (pathname.endsWith('.css') && !contentType.includes('text/css')) {
          isCacheableType = false;
        } else if (
          (pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.webp')) &&
          !contentType.includes('image/')
        ) {
          isCacheableType = false;
        }

        if (isCacheableType) {
          const cache = await caches.open(CACHE_NAME);
          const integrityCache = await caches.open(INTEGRITY_CACHE_NAME);
          await putWithIntegrity(cache, integrityCache, event.request, response.clone());
        }

        return response;
      } catch (err) {
        return cached || new Response('Network unavailable', { status: 503 });
      }
    })()
  );
});

// ─── NOTIFICATION CLICK ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  let urlToOpen = '/';

  if (action === 'journal') urlToOpen = '/#journal';
  else if (action === 'script') urlToOpen = '/#scripting';
  else if (action === 'goals') urlToOpen = '/#goals';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

// ─── MESSAGE HANDLER ─────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  // 1. Verify message origin
  if (event.origin !== self.location.origin) {
    return;
  }

  // 2. Validate structure
  if (!event.data || typeof event.data !== 'object' || typeof event.data.type !== 'string') {
    return;
  }

  const { type, payload } = event.data;

  // 3. Whitelist known message actions
  const ALLOWED_MESSAGE_TYPES = [
    'SCHEDULE_NOTIFICATION',
    'SKIP_WAITING',
    'CANCEL_NOTIFICATION',
  ];
  if (!ALLOWED_MESSAGE_TYPES.includes(type)) {
    return;
  }

  if (type === 'SCHEDULE_NOTIFICATION') {
    if (!payload || typeof payload !== 'object') return;

    const delay = parseInt(payload.delay, 10);
    if (isNaN(delay) || delay < 0 || delay > 3600000) {
      console.warn('[SW Security] Rejected SCHEDULE_NOTIFICATION with invalid delay:', payload.delay);
      return;
    }

    const tag = String(payload.tag || '').trim();
    if (!/^mj-[a-z\-]+$/.test(tag)) {
      console.warn('[SW Security] Rejected notification tag pattern mismatch:', tag);
      return;
    }

    // Lookup preset safe copy or cap text length
    const template = NOTIFICATION_TEMPLATES[tag] || {
      title: 'Manifest Journal',
      body: 'Your scheduled manifestation session is ready.',
    };

    setTimeout(() => {
      self.registration.showNotification(template.title, {
        body: template.body.slice(0, 150),
        tag,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        renotify: false,
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: { dateOfArrival: Date.now() },
      });
    }, delay);
  }

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (type === 'CANCEL_NOTIFICATION') {
    // Handled by tag if needed
  }
});
