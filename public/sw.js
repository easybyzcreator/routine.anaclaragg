/**
 * Service Worker for Rotina TDAH - Supporting offline PWA shell and local push.
 */

const CACHE_NAME = "rotina-tdah-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css",
  "/metadata.json"
];

self.addEventListener("install", (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Pre-caching assets failed, skipping for dynamic loading:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // @ts-ignore
  event.respondWith(
    // @ts-ignore
    caches.match(event.request).then((cachedResponse) => {
      // @ts-ignore
      return cachedResponse || fetch(event.request).catch(() => {
        // Fallback for offline API/routing
      });
    })
  );
});

// Listener for native push events
self.addEventListener("push", (event) => {
  // @ts-ignore
  const data = event.data ? event.data.json() : { title: "Aviso de Rotina", body: "Hora de iniciar a atividade!" };
  
  const options = {
    body: data.body,
    icon: "/assets/icon.png",
    badge: "/assets/icon.png",
    vibrate: [200, 100, 200],
    data: {
      url: "/"
    }
  };

  // @ts-ignore
  event.waitUntil(
    // @ts-ignore
    self.registration.showNotification(data.title, options)
  );
});
