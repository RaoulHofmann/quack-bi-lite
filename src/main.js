import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// Register service worker for offline support and COOP/COEP headers (needed for DuckDB-WASM)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js', { scope: '' }).catch(() => {})
}

createApp(App).mount('#app')
