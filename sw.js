const CACHE_NAME = 'alshifa-cache-v5';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((error) => {
        console.error('Alshifa cache installation failed:', error);
      })
      .then(() => self.skipWaiting())
  );
});

// تفعيل Service Worker وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// التعامل مع طلبات الشبكة
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // نريد فقط GET
  if (request.method !== 'GET') {
    return;
  }

  let requestURL;

  try {
    requestURL = new URL(request.url);
  } catch (error) {
    return;
  }

  // تجاهل أي بروتوكول غير HTTP/HTTPS
  if (
    requestURL.protocol !== 'http:' &&
    requestURL.protocol !== 'https:'
  ) {
    return;
  }

  // لا نتدخل في الطلبات الخارجية.
  // هذا مهم حتى لا يتدخل Service Worker في Firebase
  // أو APIs أو خدمات خارجية.
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  // التعامل مع صفحات التطبيق والتنقل
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, responseClone))
              .catch(() => {});

            return response;
          }

          return caches.match('./index.html');
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedPage) => {
              return cachedPage || caches.match('./index.html');
            });
        })
    );

    return;
  }

  // الملفات الثابتة: Cache First
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (!response || !response.ok) {
              return response;
            }

            const responseClone = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              })
              .catch(() => {});

            return response;
          })
          .catch(() => {
            return undefined;
          });
      })
  );
});
