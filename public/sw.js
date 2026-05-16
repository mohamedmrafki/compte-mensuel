const CACHE_NAME = 'chauffeur-app-v2'

self.addEventListener('install', (event) => {
  // Forcer le nouveau SW à prendre la main immédiatement
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Supprimer les anciens caches
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
      // Prendre le contrôle de toutes les fenêtres ouvertes
      self.clients.claim(),
    ])
  )
})

// Stratégie : network-first pour HTML (toujours la dernière version),
// cache-first pour les assets hashés (jamais besoin de revalider).
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  // Ne jamais cacher les appels Supabase/API externes
  if (url.hostname.includes('supabase') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('api-adresse.data.gouv.fr') ||
      url.hostname.includes('nominatim') ||
      url.hostname.includes('telegram.org')) {
    return
  }

  // HTML / racine : network-first avec fallback cache (gère l'offline)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/index.html')))
    )
    return
  }

  // Assets statiques (JS, CSS, images, polices) : cache-first
  // Les noms de fichiers Vite contiennent un hash, donc safe à cacher longtemps
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached
        return fetch(req).then((res) => {
          if (res.ok && (req.destination === 'script' || req.destination === 'style' ||
                          req.destination === 'image' || req.destination === 'font')) {
            const copy = res.clone()
            caches.open(CACHE_NAME).then((c) => c.put(req, copy))
          }
          return res
        }).catch(() => cached)
      })
    )
  }
})
