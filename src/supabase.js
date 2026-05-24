import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars manquants. Copie .env.example → .env.local et remplis tes clés.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// ─── Wrapper sécurisé pour les mutations Supabase ────────────────────────────
// Vérifie que la mutation a réussi, affiche un toast en cas d'erreur,
// log l'erreur sur Telegram en production. Retourne true si OK, false sinon.

let toastHandler = null
export function registerToastHandler(fn) { toastHandler = fn }

const recentLogs = new Map()
function shouldLog(key) {
  const now = Date.now()
  const last = recentLogs.get(key)
  if (last && now - last < 60_000) return false
  recentLogs.set(key, now)
  return true
}

async function reportError(label, message) {
  // Toast à l'écran (si handler enregistré)
  if (toastHandler) toastHandler({ type: 'error', message: `❌ ${label}` })
  // Log Telegram (throttle 1/min par label pour éviter le spam)
  if (!shouldLog(label)) return
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        message: String(message || '').slice(0, 500),
        url: typeof window !== 'undefined' ? window.location.href : '',
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    }).catch(() => {})
  } catch {}
}

/**
 * Wrap un appel Supabase qui retourne { data, error }.
 * @param {string} label - identifiant lisible pour les logs (ex: "save_course")
 * @param {() => Promise<{data,error}>} fn - fonction qui exécute la requête
 * @returns {Promise<{ok: boolean, data?: any, error?: any}>}
 */
export async function db(label, fn) {
  try {
    const { data, error } = await fn()
    if (error) {
      await reportError(`${label}: ${error.message || error.code || 'erreur'}`, error.message || JSON.stringify(error))
      return { ok: false, error }
    }
    return { ok: true, data }
  } catch (err) {
    await reportError(`${label}: ${err.message || 'exception'}`, err.stack || String(err))
    return { ok: false, error: err }
  }
}
