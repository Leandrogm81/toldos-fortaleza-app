// Service Worker básico para PWA
var CACHE_NAME = 'tf-app-v1'

var STATIC_ASSETS = [
  '/',
  '/login',
  '/dashboard',
  '/pedidos',
  '/pedidos/novo',
  '/clientes',
  '/agendamentos',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME }).map(function(k) { return caches.delete(k) }))
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', function(event) {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request)
      })
    )
  } else {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        return cached || fetch(event.request)
      })
    )
  }
})
