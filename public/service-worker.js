const CACHE_NAME = 'resume-builder-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Network First, Cache Fallback for API and dynamic requests
  // Cache First, Network Fallback for static assets
  
  const isApiRequest = event.request.url.includes('/api/');
  const isFirestore = event.request.url.includes('firestore.googleapis.com');
  
  if (isFirestore) {
     // Let Firebase SDK handle Firestore caching
     return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return from cache if found
      if (response) {
        // Update cache in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }).catch(() => {});
        
        return response;
      }
      
      // Navigation Fallback: If it's a navigation request for a page, return cached index.html
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
      
      return fetch(event.request).then(
        (networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        }
      ).catch(() => {
         // Offline fallback if needed
      });
    })
  );
});
