// api/telegram.js — Webhook Telegram pour commissions Limolane
// Déployé sur Vercel comme serverless function

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ALLOWED_USER_IDS = [parseInt(process.env.TELEGRAM_USER_ID), 1495979322];
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

// ─── Grilles tarifaires ───────────────────────────────────────────────────────

const TARIFS_CLIENT = {
  E: { paris: 71.5, aeroport: 99,   mad: 66   },
  V: { paris: 82.5, aeroport: 115.5, mad: 71.5 },
  S: { paris: 99,   aeroport: 143,  mad: 88   },
};

const TARIFS_CHAUFFEUR = {
  E: { paris: 50, aeroport: 80,  mad: 50 },
  V: { paris: 60, aeroport: 90,  mad: 60 },
  S: { paris: 80, aeroport: 130, mad: 80 },
};

// ─── Envoi message Telegram ───────────────────────────────────────────────────

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

// ─── Parsing via Claude API ───────────────────────────────────────────────────

// Date du jour en heure de Paris (le serveur tourne en UTC)
function todayParis() {
  return new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
}

async function parseMessage(text) {
  const today = todayParis();
  const prompt = `Tu es un assistant qui parse des messages de commission VTC. Nous sommes le ${today}.

Il existe DEUX types de messages. Détermine d'abord le type, puis réponds UNIQUEMENT en JSON valide, sans aucun texte autour.

── TYPE 1 : COMMISSION LIBRE ──
L'utilisateur veut ajouter directement un montant de commission, sans course complète.
Exemples : "ajoute 20€ de commission", "commission 15 euros apport client", "+30 de commission pour Bruno hier"

Réponds alors :
{
  "type_message": "commission_libre",
  "montant": nombre en euros,
  "date": "YYYY-MM-DD" (si "hier", "demain" ou une date est mentionnée, sinon null),
  "chauffeur": "prénom du chauffeur" ou null,
  "note": "raison ou description si mentionnée" ou null
}

── TYPE 2 : COURSE ──
Une course complète. Le message utilise un séparateur "/" pour distinguer les infos course des infos chauffeur :
- AVANT le "/" : date, heure, nom du client, trajet (prise > dépose)
- APRÈS le "/" : prénom du chauffeur et gamme du véhicule

Exemple : "14/04/2026 John Smith CDG > Four Seasons 19h00 / Bruno E"
→ client = "John Smith", chauffeur = "Bruno", gamme = "E"

Réponds alors :
{
  "type_message": "course",
  "date": "YYYY-MM-DD",
  "heure": "HH:MM",
  "client": "Prénom Nom du client",
  "prise": "adresse ou lieu de prise en charge",
  "depose": "adresse ou lieu de dépose (null si MAD)",
  "gamme": "E ou V ou S",
  "chauffeur": "prénom du chauffeur",
  "type": "paris ou aeroport ou mad",
  "duree_heures": null ou nombre (pour MAD uniquement)
}

Règles de détection du type :
- "aeroport" si CDG, ORY, LBG, Roissy, Orly apparaît dans prise ou dépose
- "mad" si mise à disposition, MAD, ou une durée en heures est mentionnée (ex: 2h, 3h)
- "paris" pour tout autre trajet Paris-Paris

Règles gamme :
- E = Business, Classe E, MGE, berline
- V = Van, Classe V, MGV, minivan
- S = Luxury, Classe S, MGS, prestige

Message à parser : "${text}"`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const raw = data.content?.[0]?.text || "";

  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

// ─── Calcul des prix ──────────────────────────────────────────────────────────

function calculerPrix(parsed) {
  const gamme = parsed.gamme?.toUpperCase();
  const type = parsed.type;

  if (!TARIFS_CLIENT[gamme] || !type) return null;

  const prixClient = TARIFS_CLIENT[gamme][type];
  const prixChauffeur = TARIFS_CHAUFFEUR[gamme][type];

  if (type === "mad" && parsed.duree_heures) {
    return {
      prixClient: prixClient * parsed.duree_heures,
      prixChauffeur: prixChauffeur * parsed.duree_heures,
      commission: (prixClient - prixChauffeur) * parsed.duree_heures,
    };
  }

  return {
    prixClient,
    prixChauffeur,
    commission: prixClient - prixChauffeur,
  };
}

// ─── Insertion Supabase ───────────────────────────────────────────────────────

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function insererCourse(parsed, prix) {
  const gammeLabel = parsed.gamme?.toUpperCase() === "V" ? "Classe V" : parsed.gamme?.toUpperCase() === "S" ? "Classe S" : "Classe E";
  const isMad = parsed.type === "mad";

  const body = {
    id: generateUUID(),
    date: parsed.date,
    heure: parsed.heure || "00:00",
    client: parsed.client,
    company: "Limolane",
    prise: parsed.prise,
    depose: parsed.depose || parsed.prise,
    vehicule: gammeLabel,
    prestation: isMad ? "mise-a-disposition" : "transfert",
    prix_ttc: prix.prixClient,
    chauffeur: parsed.chauffeur,
    chauffeur_flat_rate: prix.prixChauffeur,
    chauffeur_cost: prix.prixChauffeur,
    profile: "commission",
    month_key: parsed.date?.slice(0, 7),
    notes: isMad ? `MAD ${parsed.duree_heures}h` : "",
    is_private: false,
    nb_heures: isMad ? parsed.duree_heures : null,
    total: prix.prixClient,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return await res.json();
}

async function insererCommissionLibre(parsed, date) {
  const montant = Number(parsed.montant);

  const body = {
    id: generateUUID(),
    date,
    heure: "00:00",
    client: parsed.note || "Commission libre",
    company: "Limolane",
    prise: "—",
    depose: "—",
    vehicule: "—",
    prestation: "transfert",
    prix_ttc: montant,
    chauffeur: parsed.chauffeur || "—",
    chauffeur_flat_rate: 0,
    chauffeur_cost: 0,
    profile: "commission",
    month_key: date.slice(0, 7),
    notes: "Commission libre",
    is_private: false,
    nb_heures: null,
    total: montant,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  return await res.json();
}

// ─── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  // Vérification de la signature secrète Telegram (anti-spoofing du webhook)
  // Si TELEGRAM_WEBHOOK_SECRET est défini, on exige le header correspondant
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const receivedSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (receivedSecret !== expectedSecret) {
      return res.status(401).json({ ok: false, error: "invalid secret" });
    }
  }

  const { message } = req.body || {};
  if (!message) return res.status(200).json({ ok: true });

  const chatId = message.chat?.id;
  const userId = message.from?.id;
  const text = message.text?.trim();

  // Sécurité : uniquement toi
  if (!ALLOWED_USER_IDS.includes(userId)) {
    await sendMessage(chatId, "⛔ Accès non autorisé.");
    return res.status(200).json({ ok: true });
  }

  if (!text || text.startsWith("/")) {
    await sendMessage(chatId, "👋 Envoie une course :\n<code>14/04/2026 John Smith CDG &gt; Four Seasons Paris 19h00 / Bruno E</code>\n\nOu une commission libre :\n<code>Ajoute 20€ de commission</code>");
    return res.status(200).json({ ok: true });
  }

  try {
    await sendMessage(chatId, "⏳ Traitement en cours...");

    // 1. Parser le message
    const parsed = await parseMessage(text);

    // Commission libre : montant ajouté directement, sans course
    if (parsed?.type_message === "commission_libre") {
      const montant = Number(parsed.montant);
      if (!montant || isNaN(montant)) {
        await sendMessage(chatId, "❌ Je n'ai pas compris le montant. Exemple :\n<code>Ajoute 20€ de commission</code>");
        return res.status(200).json({ ok: true });
      }

      const dateLibre = parsed.date || todayParis();
      await insererCommissionLibre(parsed, dateLibre);

      await sendMessage(chatId,
        `✅ <b>Commission libre ajoutée</b>\n\n` +
        `📅 ${dateLibre}\n` +
        (parsed.chauffeur ? `👨‍✈️ ${parsed.chauffeur}\n` : "") +
        (parsed.note ? `📝 ${parsed.note}\n` : "") +
        `\n📊 <b>Commission : ${montant}€</b>`
      );
      return res.status(200).json({ ok: true });
    }

    if (!parsed || !parsed.date || !parsed.gamme) {
      await sendMessage(chatId, "❌ Je n'ai pas réussi à parser le message. Vérifie le format :\n<code>14/04/2026 John Smith CDG &gt; Four Seasons Paris 19h00 / Bruno E</code>");
      return res.status(200).json({ ok: true });
    }

    // 2. Calculer les prix
    const prix = calculerPrix(parsed);
    if (!prix) {
      await sendMessage(chatId, "❌ Impossible de calculer le prix. Vérifie la gamme (E, V ou S) et le type de trajet.");
      return res.status(200).json({ ok: true });
    }

    // 3. Insérer dans Supabase
    await insererCourse(parsed, prix);

    // 4. Confirmation
    const typeLabel = parsed.type === "aeroport" ? "✈️ Aéroport" : parsed.type === "mad" ? `⏱ MAD ${parsed.duree_heures}h` : "🗼 Paris-Paris";
    const gammeLabel = { E: "Classe E", V: "Classe V", S: "Classe S" }[parsed.gamme?.toUpperCase()] || parsed.gamme;

    await sendMessage(chatId,
      `✅ <b>Commission créée</b>\n\n` +
      `📅 ${parsed.date} à ${parsed.heure || "—"}\n` +
      `👤 ${parsed.client}\n` +
      `📍 ${parsed.prise}${parsed.depose ? " → " + parsed.depose : ""}\n` +
      `🚗 ${gammeLabel} — ${typeLabel}\n` +
      `👨‍✈️ ${parsed.chauffeur}\n\n` +
      `💰 Client : <b>${prix.prixClient}€</b>\n` +
      `💸 Chauffeur : ${prix.prixChauffeur}€\n` +
      `📊 <b>Commission : ${prix.commission}€</b>`
    );

  } catch (err) {
    console.error(err);
    await sendMessage(chatId, `❌ Erreur : ${err.message}`);
  }

  return res.status(200).json({ ok: true });
}
