const CACHE_NAME = "prodevis-cache-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Ne pas intercepter les appels Firebase/Firestore (toujours en ligne)
  if (
    event.request.url.includes("firestore.googleapis.com") ||
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("gstatic.com/firebasejs")
  ) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            if (
              response &&
              response.status === 200 &&
              event.request.method === "GET"
            ) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
