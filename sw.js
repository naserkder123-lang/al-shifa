const CACHE_NAME = 'alshifa-cache-v9';

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
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Alshifa cache installation failed:', error);
        throw error;
      })
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

  // التعامل مع طلبات GET فقط
  if (request.method !== 'GET') {
    return;
  }

  let requestURL;

  try {
    requestURL = new URL(request.url);
  } catch (error) {
    return;
  }

  // السماح فقط بطلبات HTTP و HTTPS
  if (
    requestURL.protocol !== 'http:' &&
    requestURL.protocol !== 'https:'
  ) {
    return;
  }

  // عدم التدخل في الطلبات الخارجية مثل Firebase
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  const pathname = requestURL.pathname.toLowerCase();

  // عدم تخزين أو اعتراض طلبات تسجيل الدخول والمصادقة وواجهات API
  if (
    pathname.startsWith('/api/') ||
    pathname.includes('/login') ||
    pathname.includes('/signin') ||
    pathname.includes('/auth') ||
    pathname.includes('/logout') ||
    pathname.includes('/session')
  ) {
    return;
  }

  // صفحات التطبيق: الشبكة أولًا ثم الكاش عند عدم توفر الشبكة
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

  // تخزين الملفات الثابتة فقط
  const isStaticFile =
    /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|json)$/i
      .test(requestURL.pathname);

  if (!isStaticFile) {
    return;
  }

  // الملفات الثابتة: الكاش أولًا ثم الشبكة
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
            return new Response('المحتوى غير متاح دون اتصال', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: {
                'Content-Type': 'text/plain; charset=utf-8'
              }
            });
          });
      })
  );
});
