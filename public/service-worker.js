const CACHE_NAME = 'quack-bi-lite-v1'
const PRECACHE_URLS = ['/']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    )
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim())
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', (e) => {
  e.respondWith(handleFetch(e.request))
})

async function handleFetch(request) {
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return new Response('', { status: 408 })
  }

  const isNoCors = request.mode === 'no-cors'
  if (isNoCors) {
    return fetchAndPatchHeaders(request).catch(() => new Response('', { status: 408 }))
  }

  if (request.method !== 'GET') {
    return fetchAndPatchHeaders(request)
  }

  // For model files from Hugging Face, let them pass through
  const url = new URL(request.url)
  if (url.hostname.includes('huggingface') || url.hostname.includes('hf.co')) {
    return fetchAndPatchHeaders(request)
  }

  // For DuckDB-WASM and other large binary assets, try network first
  if (url.pathname.match(/\.(wasm|worker\.js)$/)) {
    try {
      const response = await fetchAndPatchHeaders(request)
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME)
        cache.put(request, response.clone())
      }
      return response
    } catch {
      const cached = await caches.match(request)
      if (cached) return cached
      return new Response('Offline', { status: 503 })
    }
  }

  // For everything else, network-first with cache fallback
  const cached = await caches.match(request)
  try {
    const response = await fetchAndPatchHeaders(request)
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    if (cached) return cached
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/')
      if (fallback) return fallback
    }
    return new Response('Offline', { status: 503 })
  }
}

async function fetchAndPatchHeaders(request) {
  const r = await fetch(request).catch(() => null)
  if (!r || r.status === 0) return r

  const headers = new Headers(r.headers)
  headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')

  return new Response(r.body, {
    status: r.status,
    statusText: r.statusText,
    headers,
  })
}
