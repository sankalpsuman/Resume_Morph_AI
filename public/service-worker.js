// Service Worker for ResumeMorph
// Version: 2.0.2 (Production Reliability Build)

const CACHE_NAME = 'resumemorph-v2.0.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
];

// Install: Cache essential assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add all static assets, ignoring errors for individual files to ensure overall success
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(err => console.warn(`[SW] Failed to cache ${url}:`, err)))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Smart caching strategy with absolute reliability
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Safety Filter: Only intercept GET requests from the same origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // 2. Critical Bypass: Never cache Auth, Firestore, or Analytics
  const isCloudService = 
    url.hostname.includes('firestore.googleapis.com') || 
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebasestorage.googleapis.com') ||
    url.hostname.includes('google-analytics.com');

  if (isCloudService || url.pathname.startsWith('/api/')) {
    return;
  }

  // 3. Navigation Strategy: Network First with Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
        .then((response) => response || caches.match('/index.html'))
        // Absolute last resort - if even index.html isn't cached
        .then((response) => response || new Response('Offline: Resource not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        }))
    );
    return;
  }

  // 4. Asset Strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request).then((networkResponse) => {
        // Only cache valid, successful responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          }).catch(err => console.warn('[SW] Cache put error:', err));
        }
        return networkResponse;
      }).catch((err) => {
        // If network fails, we must still return something valid if cachedResponse is missing
        if (!cachedResponse) {
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
        return cachedResponse;
      });

      return cachedResponse || networkFetch;
    }).catch(() => {
      // Emergency fallback for any cache access error
      return fetch(request).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
