const CACHE_NAME = 'metricall-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // No interceptar peticiones a Supabase, API endpoints o extensiones de navegador
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api') || url.pathname.includes('/rest/v1')) {
    return;
  }

  // Navegación (HTML principal) -> Network-first con fallback a caché
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Recursos estáticos (JS, CSS, fuentes, imágenes locales) -> Stale-while-revalidate
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Resto de peticiones: Network first con fallback a cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Manejo de eventos de Notificación PWA (Click e Interacción)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let urlToOpen = '/(drawer)';

  if (data.tarjetaId && data.tableroId) {
    urlToOpen = `/tablero/${data.tableroId}?abrirTarjeta=${data.tarjetaId}`;
  } else if (data.tipo === 'mensaje' || data.chatUserId) {
    urlToOpen = '/(drawer)/(tabs)/mensajes';
  } else if (data.url) {
    urlToOpen = data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si la ventana ya está abierta, la enfocamos y le enviamos mensaje
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({ type: 'PWA_NOTIFICATION_CLICK', data });
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrimos una nueva con la ruta correspondiente
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Soporte para Push Events en PWA
self.addEventListener('push', (event) => {
  let payload = { titulo: 'Metricall', mensaje: 'Nueva actualización en Metricall', data: {} };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (_) {
    if (event.data) {
      payload.mensaje = event.data.text();
    }
  }

  const title = payload.titulo || payload.title || 'Metricall';
  const options = {
    body: payload.mensaje || payload.body || 'Tienes una nueva actualización en Metricall.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: payload.data || payload,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
