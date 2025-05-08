// service-worker.js - Service worker for caching and offline support
const CACHE_NAME = "cyberpunk-portfolio-v1"
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/js/main.js",
  "/js/core.js",
  "/js/windows.js",
  "/js/desktop.js",
  "/js/starfield.js",
  "/js/music-player.js",
  "/js/nature-gallery.js",
  "/js/snake-game.js",
  "/js/accessibility.js",
  "/js/mobile.js",
  "/resume.html",
  "/resume.css",
  "/contact.html",
  "/nature.html",
  "/nature.css",
  "/nature.js",
  "/snake.html",
  "/snake.css",
  "/snake.js",
  // Add critical images
  "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/Benny.png?v=1746392528967",
  "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/whodat.gif?v=1746365769069",
  "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/octavia.jpg?v=1746412752104",
  "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/MilesSwings2025.jpg?v=1746410914289",
]

// Install event - cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE)
      })
      .then(() => self.skipWaiting()),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME
            })
            .map((cacheName) => {
              return caches.delete(cacheName)
            }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Fetch event - serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes("cdn.glitch.global")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      // Clone the request
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        // Cache the new resource
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }),
  )
})
