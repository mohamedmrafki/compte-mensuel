// api/log.js — Endpoint pour recevoir les erreurs frontend et les forwarder sur Telegram
// Utilisé par window.addEventListener("unhandledrejection") + db() wrapper

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;

// Throttle simple en mémoire (reset à chaque cold start serverless, suffisant pour éviter le spam)
const recentLogs = new Map();
const THROTTLE_MS = 60_000; // 1 alerte par minute par "label"

async function sendTelegramMessage(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_USER_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_USER_ID,
        text: text.slice(0, 4000), // limite Telegram
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // si Telegram down, on log juste côté Vercel et on rend la main
  }
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

export default async function handler(req, res) {
  // CORS pour les appels depuis le navigateur (même origine, normalement OK mais on est défensif)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const { label = "unknown", message = "", url = "", ua = "" } = req.body || {};

  // Throttle par label pour éviter le spam si une erreur boucle
  const now = Date.now();
  const lastSent = recentLogs.get(label);
  if (lastSent && now - lastSent < THROTTLE_MS) {
    return res.status(200).json({ ok: true, throttled: true });
  }
  recentLogs.set(label, now);

  // Construction du message Telegram
  const truncatedMessage = String(message).slice(0, 1500);
  const isMobile = /iPhone|iPad|Android/i.test(ua);
  const deviceEmoji = isMobile ? "📱" : "💻";

  const text =
    `🚨 <b>Erreur frontend</b>\n\n` +
    `<b>Label</b> : <code>${escapeHtml(label)}</code>\n` +
    `<b>Message</b> : <code>${escapeHtml(truncatedMessage)}</code>\n\n` +
    `<b>URL</b> : ${escapeHtml(url)}\n` +
    `${deviceEmoji} ${escapeHtml(ua.slice(0, 100))}\n\n` +
    `<i>Throttle : 1 alerte / min par label</i>`;

  await sendTelegramMessage(text);

  return res.status(200).json({ ok: true });
}
