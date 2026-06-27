// Service Worker for ResumeMorph
// Version: 2.0.1 (Production Audit Build)

const CACHE_NAME = 'resumemorph-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
];

// Install: Cache essential assets immediately
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing v2...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force this new SW to become active immediately
  self.skipWaiting();
});

// Activate: Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating and claiming clients...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Purging old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Notify all tabs that a new version is active
      return self.clients.claim();
    })
  );
});

// Fetch: Smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests and cross-origin requests (except CDNs if needed)
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // 2. Bypass cache for API calls and Firebase Auth/Firestore
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('firestore.googleapis.com') || 
      url.hostname.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  // 3. Navigation requests: Return index.html (SPA Fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 4. Stale-while-revalidate for everything else
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Only cache successful standard responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Silent fail for background updates
      });

      return cachedResponse || fetchPromise;
    })
  );
});
