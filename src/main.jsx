import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ─── Capture des erreurs globales → log Telegram ─────────────────────────────
// Évite les pertes silencieuses : toute promesse rejetée ou erreur runtime
// non interceptée est envoyée à /api/log qui te DM sur Telegram.

const sentRecently = new Map()
function logToTelegram(label, message) {
  const now = Date.now()
  const last = sentRecently.get(label)
  if (last && now - last < 60_000) return // throttle 1/min côté client
  sentRecently.set(label, now)
  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      label,
      message: String(message || '').slice(0, 1500),
      url: window.location.href,
      ua: navigator.userAgent,
    }),
    keepalive: true, // assure que le fetch part même si la page se ferme
  }).catch(() => {})
}

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const msg = reason?.stack || reason?.message || String(reason)
  logToTelegram('unhandledrejection', msg)
})

window.addEventListener('error', (event) => {
  const msg = `${event.message}\n  at ${event.filename}:${event.lineno}:${event.colno}\n${event.error?.stack || ''}`
  logToTelegram('window.error', msg)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
