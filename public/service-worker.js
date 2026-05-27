// Dual-purpose: runs as a <script> to register itself as a service worker,
// and runs as the service worker to inject COOP/COEP headers.
// Required for DuckDB-WASM SharedArrayBuffer on GitHub Pages.

if (typeof window === 'undefined') {
  // --- Service worker context ---

  self.addEventListener('install', () => self.skipWaiting())
  self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

  async function handleFetch(request) {
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
      return
    }

    // For model files from HuggingFace, try direct then proxy fallback
    let hfResponse = null
    const url = new URL(request.url)
    if (url.hostname.includes('huggingface') || url.hostname.includes('hf.co')) {
      const hfRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        mode: 'cors',
        credentials: 'omit',
        cache: request.cache,
        redirect: 'follow',
      })
      try {
        hfResponse = await fetch(hfRequest)
        if (!hfResponse.ok) hfResponse = null
      } catch {
        hfResponse = null
      }
      if (!hfResponse) {
        const proxyUrl = `https://cors-anywhere.herokuapp.com/?${encodeURIComponent(request.url)}`
        try {
          hfResponse = await fetch(proxyUrl)
        } catch {}
      }
    }

    // no-cors requests need credentials: omit to avoid COEP blocking them
    if (request.mode === 'no-cors') {
      request = new Request(request.url, {
        cache: request.cache,
        credentials: 'omit',
        headers: request.headers,
        integrity: request.integrity,
        destination: request.destination,
        keepalive: request.keepalive,
        method: request.method,
        mode: request.mode,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
        signal: request.signal,
      })
    }

    const r = hfResponse || await fetch(request).catch(() => null)
    if (!r || r.status === 0) return r

    const headers = new Headers(r.headers)
    headers.set('Cross-Origin-Embedder-Policy', 'credentialless')
    headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    headers.set('Access-Control-Allow-Origin', '*')

    return new Response(r.body, {
      status: r.status,
      statusText: r.statusText,
      headers,
    })
  }

  self.addEventListener('fetch', (e) => {
    e.respondWith(handleFetch(e.request))
  })
} else {
  // --- Browser context: register this script as the service worker ---

  ;(async function () {
    if (window.crossOriginIsolated !== false) return

    const registration = await navigator.serviceWorker
      .register(document.currentScript.src, {
        scope: new URL('.', document.currentScript.src).pathname,
      })
      .catch((e) => console.error('Service Worker registration failed:', e))

    if (registration) {
      registration.addEventListener('updatefound', () => {
        window.location.reload()
      })
      if (registration.active && !navigator.serviceWorker.controller) {
        window.location.reload()
      }
    }
  })()
}
