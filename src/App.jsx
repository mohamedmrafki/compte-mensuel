import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// ── Mode démonstration ────────────────────────────────────────────────────────
const DEMO_MODE = new URLSearchParams(window.location.search).get("demo") === "1";
const _now = new Date();
const _mk = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}`;
const _d = (n) => `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
const DEMO_COURSES = [
  { id: "d1", date: _d(Math.min(25, new Date(_now.getFullYear(), _now.getMonth() + 1, 0).getDate())), heure: "09:30", client: "M. Bernard", chauffeur: "Mohamed", vehicule: "Classe E", prestation: "transfert", prise: "Hôtel Plaza Athénée, 25 Avenue Montaigne, 75008 Paris", depose: "Aéroport CDG Terminal 2E", prixTTC: "120", supplements: [], total: "120", tips: "20", chauffeurFlatRate: "", chauffeurHourlyRate: "", chauffeurCost: "0", isPrivate: false, company: "Allocab", notes: "" },
  { id: "d2", date: _d(22), heure: "14:00", client: "Mme Laurent", chauffeur: "Mohamed", vehicule: "Classe V", prestation: "transfert", prise: "Gare de Lyon, Paris", depose: "Hôtel du Louvre, 75001 Paris", prixTTC: "65", supplements: [{ id: "s1", type: "Bagages", description: "3 valises", amount: "10" }], total: "75", tips: "0", chauffeurFlatRate: "", chauffeurHourlyRate: "", chauffeurCost: "0", isPrivate: true, company: "", notes: "" },
  { id: "d3", date: _d(20), heure: "07:15", client: "Dupont SA", chauffeur: "Mohamed", vehicule: "Classe S", prestation: "transfert", prise: "Orly Terminal 4", depose: "La Défense, Tour First, 92400 Courbevoie", prixTTC: "95", supplements: [], total: "95", tips: "0", chauffeurFlatRate: "", chauffeurHourlyRate: "", chauffeurCost: "0", isPrivate: false, company: "Snapcar", notes: "" },
  { id: "d4", date: _d(18), heure: "10:00", client: "Groupe Michelin", chauffeur: "Oumar", vehicule: "Classe V", prestation: "mad", tauxHoraire: "70", nbHeures: "4", prixTTC: "", supplements: [], total: "280", tips: "0", chauffeurFlatRate: "", chauffeurHourlyRate: "45", chauffeurCost: "180", isPrivate: false, company: "Allocab", notes: "Journée réunion Paris" },
  { id: "d5", date: _d(15), heure: "18:45", client: "M. Chen", chauffeur: "Mohamed", vehicule: "Classe E", prestation: "transfert", prise: "Musée du Louvre, 75001 Paris", depose: "Hôtel George V, 75008 Paris", prixTTC: "45", supplements: [{ id: "s2", type: "Attente", description: "30 min", amount: "15" }], total: "60", tips: "10", chauffeurFlatRate: "", chauffeurHourlyRate: "", chauffeurCost: "0", isPrivate: true, company: "", notes: "" },
  { id: "d6", date: _d(10), heure: "08:00", client: "Air France Corp.", chauffeur: "Mohamed", vehicule: "Classe E", prestation: "transfert", prise: "7 Avenue Kléber, 75016 Paris", depose: "Aéroport CDG Terminal 1", prixTTC: "110", supplements: [], total: "110", tips: "0", chauffeurFlatRate: "", chauffeurHourlyRate: "", chauffeurCost: "0", isPrivate: false, company: "Snapcar", notes: "" },
];
const DEMO_FRAIS = [
  { id: "df1", date: _d(1), category: "SFR", amount: "49", notes: "Forfait pro mobile", isRecurring: true, recurringId: "rec1" },
  { id: "df2", date: _d(5), category: "Essence / Péage", amount: "180", notes: "Plein + péage A1", isRecurring: false, recurringId: null },
  { id: "df3", date: _d(15), category: "Entretien / Réparation", amount: "320", notes: "Vidange Classe E", isRecurring: false, recurringId: null },
];
const DEMO_COMPANIES = [
  { id: "dc1", name: "Allocab", profile: "demo", adresse: "15 Rue de la Paix, 75001 Paris", email: "compta@allocab.com", siren: "812 345 678", prices: { "Classe E": { aeroport: "120", paris: "55", mad: "60" }, "Classe V": { aeroport: "160", paris: "80", mad: "75" }, "Classe S": { aeroport: "180", paris: "95", mad: "90" } } },
  { id: "dc2", name: "Snapcar", profile: "demo", adresse: "8 Boulevard Haussmann, 75009 Paris", email: "", siren: "", prices: { "Classe E": { aeroport: "95", paris: "45", mad: "55" }, "Classe V": { aeroport: "130", paris: "65", mad: "70" }, "Classe S": { aeroport: "150", paris: "80", mad: "85" } } },
];
const DEMO_CHAUFFEURS = [
  { id: "ch1", name: "Mohamed", is_default: true, profile: "demo" },
  { id: "ch2", name: "Oumar", is_default: false, profile: "demo" },
];

// ── Constantes ────────────────────────────────────────────────────────────────
const C = {
  bg: "#05060A", surface: "#0D0F18", card: "#111520", border: "#1C2235", border2: "#283248",
  gold: "#D4A853", goldBright: "#F0C870", goldDim: "#7A5F2E", goldGlow: "rgba(212,168,83,0.12)",
  green: "#2ECC8A", red: "#E85555", blue: "#4F8EF7", purple: "#9B7EF5", orange: "#F5923C", teal: "#26C4B0",
  text: "#EDF0F7", muted: "#576075", white: "#FFFFFF",
};
const FONT = { display: "'Bebas Neue', sans-serif", body: "'Inter', sans-serif" };

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const LIEUX = ["CDG","ORY","LBG","Gare de l'Est","Gare de Lyon","Gare du Nord","Gare Montparnasse"];
const FRAIS_CATS = ["Essence / Péage","Bureau","Digidom","Assurance","SFR","Site web","Entretien / Réparation","Nourriture","Autre"];
const VEHICULES = ["Classe E","Classe V","Classe S"];
const SUPPLEMENT_TYPES = ["Attente","Stop supplémentaire","Parking","Péage","Nuit / Dimanche","Bagages","Autre"];
const AEROPORTS = ["CDG","ORY","LBG"];
const SOUS_TRAITANT_TARIFS = {
  "Classe E": { aeroport: 80, paris: 50, mad: 50 },
  "Classe V": { aeroport: 90, paris: 60, mad: 60 },
  "Classe S": { aeroport: 130, paris: 80, mad: 80 },
};
const isAeroportTrajet = (prise, depose) => AEROPORTS.some(a => (prise || "").toUpperCase().includes(a) || (depose || "").toUpperCase().includes(a));

const PROFILES = [
  { id: "oumar",      name: "Oumar",      company: "Faiz Transport Paris", color: "#5B9CF6" },
  { id: "mohamed",    name: "Mohamed",    company: "AMR Drive",            color: "#C8A45A" },
  { id: "commission", name: "Commission", company: "Commune",              color: "#2ECC8A" },
];

const INVOICE_STATUSES = [
  { key: "a_envoyer",  label: "À envoyer",      emoji: "📋", color: "#6B748A", bg: "#6B748A18", border: "#6B748A55" },
  { key: "envoyee",    label: "Envoyée",         emoji: "📤", color: "#5B9CF6", bg: "#5B9CF618", border: "#5B9CF655" },
  { key: "payee",      label: "Payée ✓",         emoji: "✅", color: "#3DD68C", bg: "#3DD68C18", border: "#3DD68C55" },
];
const invoiceStatusInfo = key => INVOICE_STATUSES.find(s => s.key === key) || INVOICE_STATUSES[0];

// ── Utilitaires ───────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const fmtNum = (n) => Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (n) => fmtNum(n) + " €";
const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;
const monthLabel = (y, m) => new Date(y, m, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
const today = () => new Date().toISOString().split("T")[0];

// ── Mapping camelCase ↔ snake_case Supabase ───────────────────────────────────
function courseToDb(c, mk) {
  return {
    id: c.id, date: c.date, heure: c.heure || null, client: c.client || null,
    chauffeur: c.chauffeur || null, vehicule: c.vehicule || null,
    prestation: c.prestation || "transfert", prise: c.prise || null, depose: c.depose || null,
    prix_ttc: c.prixTTC !== "" && c.prixTTC != null ? Number(c.prixTTC) : null,
    taux_horaire: c.tauxHoraire !== "" && c.tauxHoraire != null ? Number(c.tauxHoraire) : null,
    nb_heures: c.nbHeures !== "" && c.nbHeures != null ? Number(c.nbHeures) : null,
    supplements: c.supplements || [],
    total: Number(c.total) || 0, tips: Number(c.tips) || 0,
    chauffeur_flat_rate: c.chauffeurFlatRate !== "" && c.chauffeurFlatRate != null ? Number(c.chauffeurFlatRate) : null,
    chauffeur_hourly_rate: c.chauffeurHourlyRate !== "" && c.chauffeurHourlyRate != null ? Number(c.chauffeurHourlyRate) : null,
    chauffeur_cost: Number(c.chauffeurCost) || 0,
    is_private: c.isPrivate || false, company: c.company || null, notes: c.notes || null,
    month_key: mk,
  };
}
function courseFromDb(r) {
  return {
    id: r.id, date: r.date, heure: r.heure || "", client: r.client || "",
    chauffeur: r.chauffeur || "", vehicule: r.vehicule || "Classe E",
    prestation: r.prestation || "transfert", prise: r.prise || "", depose: r.depose || "",
    prixTTC: r.prix_ttc != null ? String(r.prix_ttc) : "",
    tauxHoraire: r.taux_horaire != null ? String(r.taux_horaire) : "",
    nbHeures: r.nb_heures != null ? String(r.nb_heures) : "",
    supplements: r.supplements || [],
    total: r.total != null ? String(r.total) : "",
    tips: r.tips != null ? String(r.tips) : "",
    chauffeurFlatRate: r.chauffeur_flat_rate != null ? String(r.chauffeur_flat_rate) : "",
    chauffeurHourlyRate: r.chauffeur_hourly_rate != null ? String(r.chauffeur_hourly_rate) : "",
    chauffeurCost: r.chauffeur_cost != null ? String(r.chauffeur_cost) : "",
    isPrivate: r.is_private || false, company: r.company || "", notes: r.notes || "",
  };
}
function fraisToDb(f, mk) {
  return {
    id: f.id, date: f.date, category: f.category || null,
    amount: Number(f.amount) || 0, notes: f.notes || null,
    is_recurring: f.isRecurring || false, recurring_id: f.recurringId || null,
    month_key: mk,
  };
}
function fraisFromDb(r) {
  return {
    id: r.id, date: r.date, category: r.category || "",
    amount: r.amount != null ? String(r.amount) : "",
    notes: r.notes || "", isRecurring: r.is_recurring || false, recurringId: r.recurring_id || null,
  };
}
function recurringToDb(r) {
  return { id: r.id, category: r.category || null, amount: Number(r.amount) || 0, notes: r.notes || null, active: r.active !== false, day: Number(r.day) || 1 };
}
function recurringFromDb(r) {
  return { id: r.id, category: r.category || "", amount: r.amount != null ? String(r.amount) : "", notes: r.notes || "", active: r.active !== false, day: r.day || 1 };
}

// ── Composants UI (identiques à l'original) ───────────────────────────────────
const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: "6px 16px", borderRadius: 20, border: active ? `1px solid ${C.gold}55` : `1px solid transparent`, cursor: "pointer", fontSize: active ? 12 : 13, fontWeight: 600, background: active ? C.goldGlow : C.surface, color: active ? C.gold : C.muted, whiteSpace: "nowrap", transition: "all 0.18s ease", boxShadow: active ? `0 0 14px ${C.gold}20` : "none", fontFamily: active ? FONT.display : FONT.body, letterSpacing: active ? "0.08em" : "normal", textTransform: active ? "uppercase" : "none" }}>{label}</button>
);
const Card = ({ children, style }) => (
  <div style={{ background: `linear-gradient(145deg,${C.card} 0%,rgba(14,16,26,0.95) 100%)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, transition: "border-color 0.2s,box-shadow 0.2s,transform 0.2s", ...style }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = style?.borderColor || C.border2; e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.35)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = style?.borderColor || C.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
  >{children}</div>
);
const Stat = ({ label, value, color = C.text, sub }) => (
  <div style={{ flex: 1, minWidth: 0, background: `linear-gradient(145deg,${C.card},rgba(14,16,26,0.95))`, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 16, padding: 16, transition: "box-shadow 0.2s,transform 0.2s" }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.35)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
    <div style={{ fontSize: 10, color, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4, fontWeight: 700, fontFamily: FONT.display }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: FONT.display, letterSpacing: "0.02em" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
  </div>
);
const Lbl = ({ children }) => <label style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: "0.04em" }}>{children}</label>;
const iBase = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "9px 13px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.18s", fontFamily: FONT.body };
const Input = ({ label, ...p }) => (<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{label && <Lbl>{label}</Lbl>}<input {...p} style={{ ...iBase, ...p.style }} onFocus={e => e.currentTarget.style.borderColor = C.gold} onBlur={e => e.currentTarget.style.borderColor = C.border} /></div>);
const Textarea = ({ label, ...p }) => (<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{label && <Lbl>{label}</Lbl>}<textarea {...p} style={{ ...iBase, resize: "vertical", minHeight: 60, ...p.style }} onFocus={e => e.currentTarget.style.borderColor = C.gold} onBlur={e => e.currentTarget.style.borderColor = C.border} /></div>);
const Btn = ({ children, onClick, variant = "primary", style, small }) => {
  const isPrimary = variant === "primary";
  const bg = isPrimary ? `linear-gradient(135deg,${C.gold} 0%,${C.goldBright} 100%)` : variant === "danger" ? C.red : C.surface;
  const col = variant === "ghost" ? C.muted : C.bg;
  const shadow = isPrimary ? `0 4px 16px ${C.gold}35` : "none";
  return <button onClick={onClick} style={{ background: bg, color: col, border: variant === "ghost" ? `1px solid ${C.border}` : "none", borderRadius: 10, cursor: "pointer", padding: small ? "6px 13px" : "10px 20px", fontSize: small ? 13 : 15, fontWeight: 600, boxShadow: shadow, transition: "opacity 0.15s,transform 0.12s,box-shadow 0.15s", fontFamily: isPrimary ? FONT.display : FONT.body, letterSpacing: isPrimary ? "0.06em" : "normal", textTransform: isPrimary ? "uppercase" : "none", ...style }}
    onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
    onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
    onMouseUp={e => e.currentTarget.style.transform = "translateY(-1px)"}
  >{children}</button>;
};

function VoiceNoteBtn({ onText }) {
  const [listening, setListening] = useState(false);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const start = () => {
    const rec = new SR();
    rec.lang = "fr-FR"; rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = e => onText(e.results[0][0].transcript);
    rec.onerror = () => setListening(false);
    rec.start();
  };
  return (
    <button type="button" onClick={start} style={{ background: listening ? `${C.red}30` : `${C.teal}18`, border: `1px solid ${listening ? C.red : C.teal}55`, color: listening ? C.red : C.teal, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
      {listening ? "🔴 Écoute..." : "🎙 Voix"}
    </button>
  );
}
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const y = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, y);
    };
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="slide-up" style={{ background: `linear-gradient(160deg,${C.card} 0%,${C.surface} 100%)`, border: `1px solid ${C.border2}`, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 480, maxHeight: "92dvh", overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: FONT.display }}>{title}</span>
          <button onClick={onClose} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted, fontSize: 16, cursor: "pointer", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ACInput({ label, value, onChange, suggestions, placeholder, icon = "📍" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const filtered = suggestions.filter(s => s.toLowerCase().includes((value || "").toLowerCase()) && s !== value);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <Lbl>{label}</Lbl>}
      <input value={value || ""} onChange={e => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} style={{ ...iBase }} />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 300, marginTop: 4, overflow: "hidden" }}>
          {filtered.map(s => (
            <div key={s} onClick={() => { onChange(s); setOpen(false); }} style={{ padding: "10px 12px", cursor: "pointer", fontSize: 14, color: C.text, borderBottom: `1px solid ${C.border}` }} onMouseOver={e => e.currentTarget.style.background = C.card} onMouseOut={e => e.currentTarget.style.background = "transparent"}>{icon} {s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// Géolocalisation partagée (lat/lon Paris par défaut)
const geoRef = { lat: 48.8566, lon: 2.3522 };
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    p => { geoRef.lat = p.coords.latitude; geoRef.lon = p.coords.longitude; },
    () => {}
  );
}

function formatNominatim(r) {
  const name = r.name || r.display_name.split(",")[0].trim();
  const a = r.address || {};
  const road = [a.house_number, a.road].filter(Boolean).join(" ");
  const city = [a.postcode, a.city || a.town || a.village || a.municipality].filter(Boolean).join(" ");
  const addrLine = [road, city].filter(Boolean).join(", ") || r.display_name.split(",").slice(1, 3).join(",").trim();
  const isNamed = name && !road.startsWith(name);
  return { name: isNamed ? name : null, addr: addrLine, label: isNamed ? (addrLine ? `${name}, ${addrLine}` : name) : addrLine };
}

async function searchPlaces(query) {
  const q = encodeURIComponent(query);
  const { lat, lon } = geoRef;
  const [nomRes, banRes] = await Promise.allSettled([
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=6` +
      `&viewbox=${lon - 0.4},${lat + 0.3},${lon + 0.4},${lat - 0.3}&bounded=0&accept-language=fr`,
      { headers: { "Accept-Language": "fr" } }
    ).then(r => r.json()),
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=4&lat=${lat}&lon=${lon}`).then(r => r.json()),
  ]);
  const results = [];
  const seen = new Set();
  if (nomRes.status === "fulfilled") {
    for (const r of (nomRes.value || [])) {
      const item = formatNominatim(r);
      if (!item.label) continue;
      const key = item.label.toLowerCase().slice(0, 40);
      if (!seen.has(key)) { seen.add(key); results.push(item); }
    }
  }
  if (banRes.status === "fulfilled") {
    for (const f of (banRes.value.features || [])) {
      const label = f.properties.label;
      const key = label.toLowerCase().slice(0, 40);
      if (!seen.has(key)) { seen.add(key); results.push({ name: null, addr: label, label }); }
    }
  }
  return results.slice(0, 7);
}

function poiIcon(item) {
  if (!item.name) return "📍";
  const n = item.name.toLowerCase();
  if (n.includes("hôtel") || n.includes("hotel")) return "🏨";
  if (n.includes("gare") || n.includes("station")) return "🚉";
  if (n.includes("aéroport") || n.includes("airport") || n.includes("cdg") || n.includes("orly")) return "✈️";
  if (n.includes("musée") || n.includes("musee") || n.includes("louvre") || n.includes("orsay")) return "🏛";
  if (n.includes("hôpital") || n.includes("clinique") || n.includes("hospital")) return "🏥";
  if (n.includes("restaurant") || n.includes("brasserie") || n.includes("café") || n.includes("cafe")) return "🍽";
  if (n.includes("palais") || n.includes("château") || n.includes("chateau") || n.includes("tour eiffel")) return "🏰";
  if (n.includes("parc") || n.includes("jardin")) return "🌳";
  return "🏢";
}

function AddressInput({ label, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef();
  const timer = useRef();

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleChange = (v) => {
    onChange(v);
    clearTimeout(timer.current);
    if (!v || v.length < 3) { setSuggestions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await searchPlaces(v);
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch { setSuggestions([]); }
      setLoading(false);
    }, 320);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <Lbl>{label}</Lbl>}
      <div style={{ position: "relative" }}>
        <input value={value || ""} onChange={e => handleChange(e.target.value)} onFocus={() => value && value.length >= 3 && setOpen(suggestions.length > 0)} placeholder={placeholder || "Hôtel, adresse, gare, musée…"} style={{ ...iBase, paddingRight: 36 }} />
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none", opacity: 0.6 }}>{loading ? "⏳" : "🔍"}</div>
      </div>
      {open && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, zIndex: 300, marginTop: 4, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,0.45)" }}>
          {suggestions.map((s, i) => (
            <div key={i} onClick={() => { onChange(s.label); setSuggestions([]); setOpen(false); }}
              style={{ padding: "10px 12px", cursor: "pointer", borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "flex-start", gap: 10 }}
              onMouseOver={e => e.currentTarget.style.background = C.card}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize: 15, marginTop: 1, flexShrink: 0 }}>{poiIcon(s)}</span>
              <div style={{ minWidth: 0 }}>
                {s.name
                  ? <><div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                     <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{s.addr}</div></>
                  : <div style={{ fontSize: 13, color: C.text }}>{s.addr}</div>
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthPickerModal({ year, month, onChange, onClose }) {
  const [y, setY] = useState(year);
  return (
    <Modal title="Choisir une période" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <button onClick={() => setY(v => v - 1)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 18 }}>‹</button>
          <span style={{ fontSize: 22, fontWeight: 800, color: C.gold, minWidth: 70, textAlign: "center" }}>{y}</span>
          <button onClick={() => setY(v => v + 1)} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 18 }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {MOIS.map((m, i) => {
            const active = y === year && i === month;
            return <button key={i} onClick={() => { onChange(y, i); onClose(); }} style={{ padding: "12px 0", borderRadius: 10, border: `2px solid ${active ? C.gold : C.border}`, background: active ? `${C.gold}20` : C.surface, color: active ? C.gold : C.text, fontWeight: active ? 700 : 500, fontSize: 14, cursor: "pointer" }}>{m}</button>;
          })}
        </div>
      </div>
    </Modal>
  );
}

function SupplementsEditor({ supplements, onChange }) {
  const addSupplement = () => onChange([...supplements, { id: uid(), type: "Attente", description: "", amount: "" }]);
  const updateSup = (id, field, value) => onChange(supplements.map(s => s.id === id ? { ...s, [field]: value } : s));
  const removeSup = (id) => onChange(supplements.filter(s => s.id !== id));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Lbl>Suppléments</Lbl>
        <button onClick={addSupplement} style={{ background: `${C.teal}20`, border: `1px solid ${C.teal}55`, color: C.teal, borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Ajouter</button>
      </div>
      {supplements.length === 0 && (
        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "10px 0", background: C.surface, borderRadius: 8, border: `1px dashed ${C.border}` }}>
          Attente, stop, parking… cliquez + Ajouter
        </div>
      )}
      {supplements.map((s, i) => (
        <div key={s.id} style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}33`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Supplément {i + 1}</span>
            <button onClick={() => removeSup(s.id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <select value={s.type} onChange={e => updateSup(s.id, "type", e.target.value)} style={{ ...iBase, appearance: "none", fontSize: 13 }}>
                {SUPPLEMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <input type="number" value={s.amount} onChange={e => updateSup(s.id, "amount", e.target.value)} placeholder="€" style={{ ...iBase, width: 80, textAlign: "right" }} />
          </div>
          <input value={s.description} onChange={e => updateSup(s.id, "description", e.target.value)} placeholder="Détail (ex: 45 min d'attente CDG T2…)" style={{ ...iBase, fontSize: 13 }} />
        </div>
      ))}
      {supplements.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: `${C.teal}15`, borderRadius: 8, padding: "8px 12px" }}>
          <span style={{ fontSize: 13, color: C.teal, fontWeight: 600 }}>Total suppléments</span>
          <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.teal }}>{fmt(supplements.reduce((s, x) => s + Number(x.amount || 0), 0))}</span>
        </div>
      )}
    </div>
  );
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function generateRecapHTML({ year, month, courses, frais, savedCompanies, defaultChauffeur }) {
  const mk = monthKey(year, month);
  const mc = courses[mk] || [];
  const mf = frais[mk] || [];
  const label = monthLabel(year, month);
  const totalCA = mc.reduce((s, c) => s + Number(c.total || 0), 0);
  const totalFrais = mf.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalTips = mc.reduce((s, c) => s + Number(c.tips || 0), 0);
  const totalCC = mc.reduce((s, c) => s + Number(c.chauffeurCost || 0), 0);
  const byCompany = {};
  mc.filter(c => c.company && !c.isPrivate).forEach(c => { if (!byCompany[c.company]) byCompany[c.company] = []; byCompany[c.company].push(c); });
  const privateTrips = mc.filter(c => c.isPrivate);
  const byChauffeur = {};
  mc.filter(c => c.chauffeur && c.chauffeur !== defaultChauffeur && Number(c.chauffeurCost) > 0).forEach(c => {
    if (!byChauffeur[c.chauffeur]) byChauffeur[c.chauffeur] = { trips: [], cost: 0, ca: 0 };
    byChauffeur[c.chauffeur].trips.push(c);
    byChauffeur[c.chauffeur].cost += Number(c.chauffeurCost || 0);
    byChauffeur[c.chauffeur].ca += Number(c.total || 0);
  });
  const byVehicle = {};
  mc.forEach(c => { const v = c.vehicule || "N/A"; if (!byVehicle[v]) byVehicle[v] = { trips: 0, ca: 0 }; byVehicle[v].trips++; byVehicle[v].ca += Number(c.total || 0); });
  const fd = d => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const supTotal = sups => (sups || []).reduce((s, x) => s + Number(x.amount || 0), 0);
  const tripRows = trips => trips.map(c => {
    const sups = c.supplements || [];
    const supSum = supTotal(sups);
    const basePrice = Number(c.total || 0) - supSum;
    return `
    <tr>
      <td>${fd(c.date)}</td><td>${c.heure || "—"}</td><td>${c.client || "—"}</td>
      <td>${c.prestation === "mad" ? "MAD" : "Transfert"}</td>
      <td>${c.vehicule || "—"}</td>
      <td>${[c.prise, c.depose].filter(Boolean).join(" → ") || "—"}</td>
      <td>${c.chauffeur || "—"}</td>
      <td class="amount">${fmtNum(basePrice)} €${supSum > 0 ? `<br><span style="color:#2DD4BF;font-size:10px">+${fmtNum(supSum)} € suppl.</span>` : ""}</td>
      <td class="amount"><b>${fmtNum(c.total)} €</b></td>
    </tr>
    ${sups.length > 0 ? `<tr style="background:#f0fafa"><td colspan="7" style="padding:4px 8px;font-size:10px;color:#888">
      Suppléments : ${sups.map(s => `${s.type}${s.description ? " ("+s.description+")" : ""} : ${fmtNum(s.amount)} €`).join(" · ")}
    </td><td colspan="2"></td></tr>` : ""}`;
  }).join("");
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Récap ${label}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;font-size:12px;padding:20px}
h1{font-size:24px;font-weight:800}h2{font-size:15px;font-weight:700;margin-bottom:4px}
.hdr{display:flex;justify-content:space-between;margin-bottom:24px;padding-bottom:14px;border-bottom:3px solid #C8A45A}
.stats{display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap}
.sbox{flex:1;min-width:100px;background:#f8f7f2;border:1px solid #e8e4d8;border-radius:8px;padding:10px 14px}
.slbl{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:3px}
.sval{font-size:17px;font-weight:800;font-family:monospace}.sval.gold{color:#A0782A}.sval.red{color:#C0392B}.sval.green{color:#1a7a4a}.sval.blue{color:#c05a00}
.sec{margin-bottom:28px}.sechdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;padding:12px 14px;background:#f8f7f2;border-radius:8px;border-left:4px solid #C8A45A}
.badge{background:#C8A45A;color:#fff;font-weight:800;font-size:17px;padding:6px 14px;border-radius:6px;font-family:monospace}.badge.green{background:#1a7a4a}.badge.orange{background:#c05a00}
table{width:100%;border-collapse:collapse;font-size:11px}thead tr{background:#1a1a2e;color:#fff}th{padding:8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
tbody tr:nth-child(even){background:#f8f7f2}td{padding:8px;border-bottom:1px solid #eee;vertical-align:top}tfoot td{background:#f0ead8;border-top:2px solid #C8A45A}
.amount{text-align:right;font-family:monospace;font-weight:600;white-space:nowrap}.tr{font-size:13px;color:#A0782A}
.sectitle{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#888;font-weight:700;margin:24px 0 12px;padding-bottom:5px;border-bottom:1px solid #ddd}
.info{font-size:10px;color:#666;margin-top:2px}
@media print{body{padding:10px}@page{margin:1.2cm;size:A4}.pb{page-break-before:always}}</style></head><body>
<div class="hdr"><div><h1>Récapitulatif mensuel</h1><p style="font-size:15px;font-weight:600;color:#C8A45A;margin-top:4px;text-transform:capitalize">${label}</p><p style="font-size:11px;color:#888;margin-top:2px">Généré le ${new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}</p></div></div>
<div class="stats">
  <div class="sbox"><div class="slbl">CA Brut</div><div class="sval gold">${fmtNum(totalCA)} €</div></div>
  <div class="sbox"><div class="slbl">Pourboires</div><div class="sval green">${fmtNum(totalTips)} €</div></div>
  <div class="sbox"><div class="slbl">Frais</div><div class="sval red">${fmtNum(totalFrais)} €</div></div>
  <div class="sbox"><div class="slbl">Chauffeurs</div><div class="sval blue">${fmtNum(totalCC)} €</div></div>
  <div class="sbox"><div class="slbl">Net</div><div class="sval ${totalCA-totalFrais-totalCC>=0?"green":"red"}">${fmtNum(totalCA-totalFrais-totalCC)} €</div></div>
</div>
${Object.keys(byVehicle).length>0?`<p class="sectitle">🚗 Par gamme</p><div class="sec"><table><thead><tr><th>Véhicule</th><th>Nb courses</th><th>CA Total</th></tr></thead><tbody>${Object.entries(byVehicle).map(([v,d])=>`<tr><td><b>${v}</b></td><td>${d.trips}</td><td class="amount">${fmtNum(d.ca)} €</td></tr>`).join("")}</tbody></table></div>`:""}
${Object.keys(byCompany).length>0?`<p class="sectitle">🏢 À facturer par société</p>${Object.entries(byCompany).map(([name,trips])=>{const info=savedCompanies.find(c=>c.name.toLowerCase()===name.toLowerCase());const total=trips.reduce((s,c)=>s+Number(c.total||0),0);return`<div class="sec pb"><div class="sechdr"><div><h2>${name}</h2>${info?.adresse?`<p class="info">📍 ${info.adresse}</p>`:""}${info?.email?`<p class="info">✉️ ${info.email}</p>`:""}${info?.siren?`<p class="info">SIREN : ${info.siren}</p>`:""}${info?.tva?`<p class="info">TVA : ${info.tva}</p>`:""}</div><div class="badge">${fmtNum(total)} €</div></div><table><thead><tr><th>Date</th><th>Heure</th><th>Client</th><th>Prestation</th><th>Véhicule</th><th>Trajet</th><th>Chauffeur</th><th>Base</th><th>Total TTC</th></tr></thead><tbody>${tripRows(trips)}</tbody><tfoot><tr><td colspan="8" style="text-align:right;font-weight:700">Total</td><td class="amount tr">${fmtNum(total)} €</td></tr></tfoot></table></div>`;}).join("")}`:""}
${privateTrips.length>0?`<p class="sectitle">💵 Courses privées</p><div class="sec"><div class="sechdr"><h2>Encaissement direct</h2><div class="badge green">${fmtNum(privateTrips.reduce((s,c)=>s+Number(c.total||0),0))} €</div></div><table><thead><tr><th>Date</th><th>Heure</th><th>Client</th><th>Prestation</th><th>Véhicule</th><th>Trajet</th><th>Chauffeur</th><th>Base</th><th>Total TTC</th></tr></thead><tbody>${tripRows(privateTrips)}</tbody></table></div>`:""}
${Object.keys(byChauffeur).length>0?`<p class="sectitle">🧑‍✈️ Récapitulatif chauffeurs</p>${Object.entries(byChauffeur).map(([name,d])=>`<div class="sec"><div class="sechdr"><div><h2>${name}</h2><p class="info">${d.trips.length} course${d.trips.length>1?"s":""} · CA : ${fmtNum(d.ca)} €</p></div><div class="badge orange">À payer : ${fmtNum(d.cost)} €</div></div><table><thead><tr><th>Date</th><th>Heure</th><th>Client</th><th>Prestation</th><th>Véhicule</th><th>Trajet</th><th>Tarif</th><th>CA</th><th>À payer</th></tr></thead><tbody>${d.trips.map(c=>`<tr><td>${fd(c.date)}</td><td>${c.heure||"—"}</td><td>${c.client||"—"}</td><td>${c.prestation==="mad"?"MAD":"Transfert"}</td><td>${c.vehicule||"—"}</td><td>${[c.prise,c.depose].filter(Boolean).join(" → ")||"—"}</td><td>${c.prestation==="mad"&&c.chauffeurHourlyRate?`${fmtNum(c.chauffeurHourlyRate)}€/h × ${c.nbHeures}h`:"Forfait"}</td><td class="amount">${fmtNum(c.total)} €</td><td class="amount" style="color:#c05a00;font-weight:700">${fmtNum(c.chauffeurCost)} €</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="7" style="text-align:right;font-weight:700">Total à payer à ${name}</td><td class="amount tr">${fmtNum(d.ca)} €</td><td class="amount" style="color:#c05a00;font-weight:800">${fmtNum(d.cost)} €</td></tr></tfoot></table></div>`).join("")}`:""}
${mf.length>0?`<p class="sectitle">💸 Frais</p><div class="sec"><table><thead><tr><th>Date</th><th>Catégorie</th><th>Détail</th><th>Montant</th></tr></thead><tbody>${mf.map(f=>`<tr><td>${fd(f.date)}</td><td>${f.category}</td><td>${f.notes||"—"}</td><td class="amount">${fmtNum(f.amount)} €</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="3" style="text-align:right;font-weight:700">Total</td><td class="amount tr">${fmtNum(totalFrais)} €</td></tr></tfoot></table></div>`:""}
</body></html>`;
}

// ── Modal Course ──────────────────────────────────────────────────────────────
const defCourse = (dc = "") => ({
  id: uid(), date: today(), heure: "", client: "", chauffeur: dc,
  vehicule: "Classe E", prestation: "transfert",
  prise: "", depose: "",
  prixTTC: "", tauxHoraire: "", nbHeures: "",
  supplements: [],
  total: "", tips: "",
  chauffeurFlatRate: "", chauffeurHourlyRate: "", chauffeurCost: "",
  isPrivate: false, company: "", notes: "",
});

function computeTotal(f) {
  const supTotal = (f.supplements || []).reduce((s, x) => s + Number(x.amount || 0), 0);
  if (f.prestation === "transfert") return String((Number(f.prixTTC || 0) + supTotal).toFixed(2));
  if (f.tauxHoraire && f.nbHeures) return String((Number(f.tauxHoraire) * Number(f.nbHeures) + supTotal).toFixed(2));
  return supTotal > 0 ? String(supTotal.toFixed(2)) : "";
}
function computeChauffeurCost(f) {
  if (f.prestation === "transfert") return f.chauffeurFlatRate ? String(Number(f.chauffeurFlatRate).toFixed(2)) : "";
  if (f.prestation === "mad" && f.chauffeurHourlyRate && f.nbHeures)
    return String((Number(f.chauffeurHourlyRate) * Number(f.nbHeures)).toFixed(2));
  return "";
}

function CourseModal({ initial, onSave, onClose, savedCompanies, onSaveCompany, savedChauffeurs, onSaveChauffeur, defaultChauffeur }) {
  const [f, setF] = useState(() => initial ? { supplements: [], ...initial } : defCourse(defaultChauffeur));
  const [tarifType, setTarifType] = useState(() => initial?.prestation === "mad" ? "mad" : null);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Auto-calcul total
  useEffect(() => {
    setF(p => ({ ...p, total: computeTotal(p), chauffeurCost: computeChauffeurCost(p) }));
  }, [f.prestation, f.prixTTC, f.tauxHoraire, f.nbHeures, f.chauffeurFlatRate, f.chauffeurHourlyRate, JSON.stringify(f.supplements)]);

  // Auto-fill tarif sous-traitant depuis la grille
  useEffect(() => {
    const isOther = f.chauffeur && f.chauffeur !== defaultChauffeur;
    if (!isOther || !f.vehicule) return;
    const tarifs = SOUS_TRAITANT_TARIFS[f.vehicule];
    if (!tarifs) return;
    if (f.prestation === "transfert") {
      const isAero = isAeroportTrajet(f.prise, f.depose);
      const rate = isAero ? tarifs.aeroport : tarifs.paris;
      setF(p => ({ ...p, chauffeurFlatRate: String(rate) }));
    } else if (f.prestation === "mad") {
      setF(p => ({ ...p, chauffeurHourlyRate: String(tarifs.mad) }));
    }
  }, [f.chauffeur, f.vehicule, f.prestation, f.prise, f.depose]);

  // Auto-fill prix depuis le tarif de la société
  useEffect(() => {
    if (!f.company || !f.vehicule) return;
    const companyObj = savedCompanies.find(c => c.name.toLowerCase() === f.company.toLowerCase());
    if (!companyObj?.prices) return;
    const vp = companyObj.prices[f.vehicule];
    if (!vp) return;
    // Type explicite choisi par l'utilisateur, sinon auto-détecté
    const detected = tarifType || (f.prestation === "mad" ? "mad" : isAeroportTrajet(f.prise, f.depose) ? "aeroport" : "paris");
    if (detected === "aeroport" || detected === "paris") {
      const price = vp[detected];
      if (price) setF(p => ({ ...p, prestation: "transfert", prixTTC: String(price) }));
    } else if (detected === "mad") {
      const rate = vp.mad;
      if (rate) setF(p => ({ ...p, prestation: "mad", tauxHoraire: String(rate) }));
    }
  }, [f.company, f.vehicule, tarifType, f.prise, f.depose, f.prestation]);

  const isOtherDriver = f.chauffeur && f.chauffeur !== defaultChauffeur;
  const companyObj = savedCompanies.find(c => c.name.toLowerCase() === (f.company || "").trim().toLowerCase());
  const companyOk = !!companyObj;
  const chauffeurSaved = savedChauffeurs.some(c => c.toLowerCase() === (f.chauffeur || "").trim().toLowerCase());
  const valid = f.date && Number(f.total) > 0;
  const supTotal = (f.supplements || []).reduce((s, x) => s + Number(x.amount || 0), 0);
  const vColor = v => v === "Classe E" ? C.blue : v === "Classe V" ? C.purple : C.teal;

  return (
    <Modal title={initial ? "Modifier la course" : "Nouvelle course"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Input label="Date" type="date" value={f.date} onChange={e => set("date", e.target.value)} style={{ flex: 1 }} />
          <Input label="Heure" type="time" value={f.heure} onChange={e => set("heure", e.target.value)} style={{ flex: 1 }} />
        </div>

        {/* Société en premier */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" id="priv" checked={f.isPrivate} onChange={e => { set("isPrivate", e.target.checked); if (e.target.checked) { set("company", ""); setTarifType(null); } }} />
          <label htmlFor="priv" style={{ color: C.text, fontSize: 14, cursor: "pointer" }}>Course privée – encaissement direct</label>
        </div>
        {!f.isPrivate && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <ACInput label="Société / Plateforme" value={f.company} onChange={v => { set("company", v); setTarifType(null); }} suggestions={savedCompanies.map(c => c.name)} placeholder="Nom de la société…" icon="🏢" />
            {f.company?.trim() && !companyOk && <button onClick={() => onSaveCompany(f.company.trim())} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 13, textAlign: "left", padding: 0 }}>💾 Mémoriser « {f.company.trim()} »</button>}
            {companyOk && <div style={{ fontSize: 12, color: C.green }}>✓ Société mémorisée</div>}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <ACInput label="Chauffeur" value={f.chauffeur} onChange={v => set("chauffeur", v)} suggestions={savedChauffeurs} placeholder="Nom du chauffeur" icon="🧑‍✈️" />
          {f.chauffeur?.trim() && !chauffeurSaved && <button onClick={() => onSaveChauffeur(f.chauffeur.trim())} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 13, textAlign: "left", padding: 0 }}>💾 Mémoriser « {f.chauffeur.trim()} »</button>}
          {chauffeurSaved && f.chauffeur?.trim() && <div style={{ fontSize: 12, color: C.green }}>✓ Mémorisé</div>}
        </div>

        <Input label="Nom du client" value={f.client} onChange={e => set("client", e.target.value)} placeholder="Ex: M. Dupont" />

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Lbl>Catégorie véhicule</Lbl>
          <div style={{ display: "flex", gap: 6 }}>
            {VEHICULES.map(v => (
              <button key={v} onClick={() => set("vehicule", v)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${f.vehicule === v ? vColor(v) : C.border}`, background: f.vehicule === v ? `${vColor(v)}18` : C.surface, color: f.vehicule === v ? vColor(v) : C.muted, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                {v === "Classe E" ? "🚙" : v === "Classe V" ? "🚐" : "🚗"} {v.replace("Classe ", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Tarif auto depuis société */}
        {companyOk && companyObj.prices && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Lbl>Type de tarif</Lbl>
            <div style={{ display: "flex", gap: 6 }}>
              {TARIF_TYPES.map(t => (
                <button key={t.key} onClick={() => setTarifType(t.key)} style={{ flex: 1, padding: "9px 4px", borderRadius: 10, border: `2px solid ${tarifType === t.key ? C.gold : C.border}`, background: tarifType === t.key ? `${C.gold}18` : C.surface, color: tarifType === t.key ? C.gold : C.muted, fontWeight: 600, fontSize: 11, cursor: "pointer", textAlign: "center" }}>
                  {t.key === "aeroport" ? "✈️ Aéroport" : t.key === "paris" ? "🗼 Paris" : "⏱ MAD"}
                </button>
              ))}
            </div>
            {tarifType && <div style={{ fontSize: 11, color: C.green }}>✓ Prix appliqué depuis les tarifs de la société</div>}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Lbl>Type de prestation</Lbl>
          <div style={{ display: "flex", gap: 8 }}>
            {[["transfert","🚗 Transfert"],["mad","⏱ Mise à dispo"]].map(([val, lbl]) => (
              <button key={val} onClick={() => set("prestation", val)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${f.prestation === val ? C.gold : C.border}`, background: f.prestation === val ? `${C.gold}18` : C.surface, color: f.prestation === val ? C.gold : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{lbl}</button>
            ))}
          </div>
        </div>

        <AddressInput label="Prise en charge" value={f.prise} onChange={v => set("prise", v)} placeholder="Adresse ou lieu (CDG, ORY…)" />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button type="button" onClick={() => setF(p => ({ ...p, prise: p.depose, depose: p.prise }))}
            style={{ background: C.surface, border: `1px solid ${C.border2}`, color: C.muted, borderRadius: 20, padding: "4px 14px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.muted; }}
            title="Inverser prise en charge et dépose">
            ⇅ Inverser
          </button>
        </div>
        <AddressInput label="Dépose" value={f.depose} onChange={v => set("depose", v)} placeholder="Adresse ou lieu" />

        {f.prestation === "transfert" ? (
          <Input label="Prix de base TTC (€)" type="number" value={f.prixTTC} onChange={e => set("prixTTC", e.target.value)} placeholder="0.00" />
        ) : (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, color: C.purple, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Prix mise à disposition</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Input label="Taux horaire TTC (€/h)" type="number" value={f.tauxHoraire} onChange={e => set("tauxHoraire", e.target.value)} placeholder="ex: 60" style={{ flex: 1 }} />
              <Input label="Nb d'heures" type="number" step="0.5" value={f.nbHeures} onChange={e => set("nbHeures", e.target.value)} placeholder="ex: 4" style={{ flex: 1 }} />
            </div>
            {f.tauxHoraire && f.nbHeures && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                <span style={{ color: C.muted }}>Base ({f.tauxHoraire}€/h × {f.nbHeures}h)</span>
                <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{fmt(Number(f.tauxHoraire) * Number(f.nbHeures))}</span>
              </div>
            )}
          </div>
        )}

        <SupplementsEditor supplements={f.supplements || []} onChange={sups => set("supplements", sups)} />

        {Number(f.total) > 0 && (
          <div style={{ background: `${C.gold}12`, border: `1px solid ${C.gold}44`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {f.prestation === "transfert" && Number(f.prixTTC) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>Prix de base</span><span style={{ fontFamily: "monospace" }}>{fmt(f.prixTTC)}</span></div>
              )}
              {f.prestation === "mad" && f.tauxHoraire && f.nbHeures && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>Base MAD</span><span style={{ fontFamily: "monospace" }}>{fmt(Number(f.tauxHoraire) * Number(f.nbHeures))}</span></div>
              )}
              {supTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.teal }}>Suppléments ({(f.supplements || []).length})</span><span style={{ fontFamily: "monospace", color: C.teal }}>+{fmt(supTotal)}</span></div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: `1px solid ${C.gold}33` }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Total TTC client</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: C.gold, fontFamily: "monospace" }}>{fmt(f.total)}</span>
              </div>
            </div>
          </div>
        )}

        {isOtherDriver && (
          <div style={{ background: `${C.orange}12`, border: `2px solid ${C.orange}55`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: C.orange, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>💰 Tarif payé à {f.chauffeur}</div>
              {SOUS_TRAITANT_TARIFS[f.vehicule] && <span style={{ fontSize: 11, color: C.green, background: `${C.green}18`, borderRadius: 6, padding: "2px 8px" }}>Grille auto</span>}
            </div>
            {f.prestation === "transfert" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Lbl>Forfait transfert (€)</Lbl>
                  {Number(f.prixTTC) > 0 && <span style={{ fontSize: 11, color: C.muted }}>Prix client : {fmt(f.prixTTC)}</span>}
                </div>
                <input type="number" value={f.chauffeurFlatRate} onChange={e => set("chauffeurFlatRate", e.target.value)} placeholder="ex: 150" style={{ ...iBase }} />
                {Number(f.chauffeurFlatRate) > 0 && Number(f.total) > 0 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "8px 12px" }}><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>À payer</div><div style={{ fontSize: 16, fontWeight: 700, color: C.orange, fontFamily: "monospace" }}>{fmt(f.chauffeurFlatRate)}</div></div>
                    <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "8px 12px" }}><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Marge</div><div style={{ fontSize: 16, fontWeight: 700, color: Number(f.total) - Number(f.chauffeurFlatRate) >= 0 ? C.green : C.red, fontFamily: "monospace" }}>{fmt(Number(f.total) - Number(f.chauffeurFlatRate))}</div></div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Lbl>Taux horaire chauffeur (€/h)</Lbl>
                  {f.tauxHoraire && <span style={{ fontSize: 11, color: C.muted }}>Client : {f.tauxHoraire}€/h</span>}
                </div>
                <input type="number" value={f.chauffeurHourlyRate} onChange={e => set("chauffeurHourlyRate", e.target.value)} placeholder="ex: 35" style={{ ...iBase }} />
                {Number(f.chauffeurHourlyRate) > 0 && Number(f.nbHeures) > 0 && (
                  <div style={{ background: C.surface, borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.muted }}>{f.chauffeurHourlyRate}€/h × {f.nbHeures}h</span><span style={{ fontWeight: 700, color: C.orange, fontFamily: "monospace" }}>{fmt(Number(f.chauffeurHourlyRate) * Number(f.nbHeures))}</span></div>
                    {Number(f.total) > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 6, borderTop: `1px solid ${C.border}` }}><span style={{ color: C.muted }}>Marge</span><span style={{ fontWeight: 700, fontFamily: "monospace", color: Number(f.total) - Number(f.chauffeurHourlyRate) * Number(f.nbHeures) >= 0 ? C.green : C.red }}>{fmt(Number(f.total) - Number(f.chauffeurHourlyRate) * Number(f.nbHeures))}</span></div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Input label="Pourboire (€)" type="number" value={f.tips} onChange={e => set("tips", e.target.value)} placeholder="0" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Lbl>Notes</Lbl>
            <VoiceNoteBtn onText={t => set("notes", (f.notes ? f.notes + " " : "") + t)} />
          </div>
          <textarea value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Informations supplémentaires…" style={{ ...iBase, resize: "vertical", minHeight: 56 }} />
        </div>
        <Btn onClick={() => valid && onSave(f)} style={{ marginTop: 4 }}>{initial ? "Enregistrer" : "Ajouter la course"}</Btn>
        {!valid && <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>Date et prix requis</div>}
      </div>
    </Modal>
  );
}

// ── Modal Frais ───────────────────────────────────────────────────────────────
const defFrais = () => ({ id: uid(), date: today(), category: "", amount: "", notes: "" });
function FraisModal({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial || defFrais());
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title={initial ? "Modifier" : "Nouvelle dépense"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="Date" type="date" value={f.date} onChange={e => set("date", e.target.value)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Lbl>Catégorie</Lbl>
          <select value={f.category} onChange={e => set("category", e.target.value)} style={{ ...iBase, appearance: "none" }}>
            <option value="">-- Catégorie --</option>
            {FRAIS_CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Montant (€)" type="number" value={f.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" />
        <Textarea label="Notes" value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Détail…" />
        <Btn onClick={() => f.category && f.amount && onSave(f)}>{initial ? "Enregistrer" : "Ajouter"}</Btn>
      </div>
    </Modal>
  );
}

// ── Modal Frais Récurrents ────────────────────────────────────────────────────
const defRecurring = () => ({ id: uid(), category: "", amount: "", notes: "", active: true, day: 1 });
function RecurringFraisModal({ recurringFrais, onSave, onClose }) {
  const [list, setList] = useState(recurringFrais.map(r => ({ ...r })));
  const add = () => setList(p => [...p, defRecurring()]);
  const upd = (id, k, v) => setList(p => p.map(r => r.id === id ? { ...r, [k]: v } : r));
  const remove = id => setList(p => p.filter(r => r.id !== id));
  return (
    <Modal title="⚙️ Frais récurrents" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Ces frais sont ajoutés automatiquement au 1er jour de chaque mois.</div>
        {list.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>Aucun frais récurrent configuré</div>}
        {list.map((r, i) => (
          <div key={r.id} style={{ background: C.surface, border: `1px solid ${r.active ? C.red + "55" : C.border}`, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: r.active ? C.red : C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Charge #{i + 1}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => upd(r.id, "active", !r.active)} style={{ background: r.active ? `${C.green}22` : C.surface, border: `1px solid ${r.active ? C.green : C.border}`, color: r.active ? C.green : C.muted, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{r.active ? "✓ Actif" : "Inactif"}</button>
                <button onClick={() => remove(r.id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Lbl>Catégorie</Lbl>
              <select value={r.category} onChange={e => upd(r.id, "category", e.target.value)} style={{ ...iBase, appearance: "none" }}>
                <option value="">-- Catégorie --</option>
                {FRAIS_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 4 }}><Lbl>Montant (€)</Lbl><input type="number" value={r.amount} onChange={e => upd(r.id, "amount", e.target.value)} placeholder="0.00" style={{ ...iBase }} /></div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}><Lbl>Jour du mois</Lbl><input type="number" min="1" max="28" value={r.day} onChange={e => upd(r.id, "day", Number(e.target.value))} style={{ ...iBase }} /></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><Lbl>Libellé / notes</Lbl><input value={r.notes} onChange={e => upd(r.id, "notes", e.target.value)} placeholder="ex: Abonnement SFR Pro" style={{ ...iBase }} /></div>
          </div>
        ))}
        <button onClick={add} style={{ background: `${C.red}15`, border: `1px dashed ${C.red}55`, color: C.red, borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>+ Ajouter une charge récurrente</button>
        <Btn onClick={() => onSave(list)} style={{ marginTop: 4 }}>Enregistrer</Btn>
      </div>
    </Modal>
  );
}

// ── Modal Société ─────────────────────────────────────────────────────────────
const defPrices = () => Object.fromEntries(VEHICULES.map(v => [v, { aeroport: "", paris: "", mad: "" }]));
const defCompany = (name = "") => ({ id: uid(), name, prices: defPrices() });

const TARIF_TYPES = [
  { key: "aeroport", label: "Aéroport (CDG/ORY/LBG)" },
  { key: "paris",    label: "Paris → Paris" },
  { key: "mad",      label: "Mise à dispo (€/h)" },
];

function CompanyInfoModal({ initial, onSave, onClose }) {
  const [f, setF] = useState(() => {
    const base = initial ? { ...initial } : defCompany();
    const prices = { ...defPrices(), ...(base.prices || {}) };
    VEHICULES.forEach(v => { prices[v] = { aeroport: "", paris: "", mad: "", ...(prices[v] || {}) }; });
    return { ...base, prices };
  });
  const setPrice = (v, t, val) => setF(p => ({ ...p, prices: { ...p.prices, [v]: { ...p.prices[v], [t]: val } } }));
  const vColor = v => v === "Classe E" ? C.blue : v === "Classe V" ? C.purple : C.teal;
  const vIcon  = v => v === "Classe E" ? "🚙" : v === "Classe V" ? "🚐" : "🚗";
  return (
    <Modal title={f.name || "Nouvelle société"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input label="Nom de la société *" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Foobar SAS" />
        {VEHICULES.map(v => (
          <div key={v} style={{ background: C.surface, border: `1px solid ${vColor(v)}33`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: vColor(v), textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{vIcon(v)} {v}</div>
            {TARIF_TYPES.map(t => (
              <div key={t.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1, fontSize: 13, color: C.muted }}>{t.label}</div>
                <input type="number" value={f.prices[v]?.[t.key] || ""} onChange={e => setPrice(v, t.key, e.target.value)} placeholder="—" style={{ ...iBase, width: 90, textAlign: "right" }} />
                <span style={{ fontSize: 12, color: C.muted, minWidth: 20 }}>{t.key === "mad" ? "€/h" : "€"}</span>
              </div>
            ))}
          </div>
        ))}
        <Btn onClick={() => f.name.trim() && onSave(f)}>Enregistrer</Btn>
      </div>
    </Modal>
  );
}

// ── Modal Chauffeurs ──────────────────────────────────────────────────────────
function ChauffeurSettingsModal({ savedChauffeurs, defaultChauffeur, onSetDefault, onAdd, onDelete, onClose }) {
  const [newName, setNewName] = useState("");
  return (
    <Modal title="Gérer les chauffeurs" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nouveau chauffeur…" style={{ ...iBase, flex: 1 }} onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { onAdd(newName.trim()); setNewName(""); } }} />
          <Btn small onClick={() => { if (newName.trim()) { onAdd(newName.trim()); setNewName(""); } }}>Ajouter</Btn>
        </div>
        {savedChauffeurs.map(c => (
          <div key={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surface, borderRadius: 10, padding: "10px 14px", border: defaultChauffeur === c ? `1px solid ${C.gold}` : `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span>🧑‍✈️</span><span style={{ fontWeight: 600 }}>{c}</span>
              {defaultChauffeur === c && <span style={{ fontSize: 11, color: C.gold, background: `${C.gold}20`, borderRadius: 4, padding: "2px 7px" }}>Par défaut</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {defaultChauffeur !== c && <Btn small variant="ghost" onClick={() => onSetDefault(c)} style={{ color: C.gold, fontSize: 11 }}>⭐ Défaut</Btn>}
              <Btn small variant="danger" onClick={() => onDelete(c)}>🗑</Btn>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ── Écran de verrouillage PIN ─────────────────────────────────────────────────
const PIN_CODE = "93270";
function PinLock({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleKey = (k) => {
    if (k === "del") { setInput(p => p.slice(0, -1)); setError(false); return; }
    const next = input + k;
    setInput(next);
    if (next.length === PIN_CODE.length) {
      if (next === PIN_CODE) { sessionStorage.setItem("pin_ok", "1"); onUnlock(); }
      else { setError(true); setTimeout(() => { setInput(""); setError(false); }, 700); }
    }
  };

  return (
    <div style={{ background: `radial-gradient(ellipse 80% 40% at 50% -5%, ${C.goldGlow} 0%, transparent 60%), ${C.bg}`, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, padding: 32, fontFamily: FONT.body }}>
      <div className="fade-up" style={{ textAlign: "center" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: `linear-gradient(135deg,${C.goldDim}25,${C.gold}15)`, border: `1px solid ${C.gold}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 18px", boxShadow: `0 0 40px ${C.gold}15` }}>🔐</div>
        <div style={{ fontFamily: FONT.display, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>Mes Comptes</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 5, letterSpacing: "0.12em", textTransform: "uppercase" }}>Entrez votre code d'accès</div>
      </div>
      <div className={error ? "shake" : "fade-in"} style={{ display: "flex", gap: 16 }}>
        {Array.from({ length: PIN_CODE.length }).map((_, i) => (
          <div key={i} className={i < input.length ? "dot-pop" : ""} style={{ width: 13, height: 13, borderRadius: "50%", background: i < input.length ? (error ? C.red : C.gold) : "transparent", border: `2px solid ${i < input.length ? (error ? C.red : C.gold) : C.border2}`, transition: "border-color 0.15s", boxShadow: i < input.length && !error ? `0 0 10px ${C.gold}70` : "none" }} />
        ))}
      </div>
      {error && <div style={{ fontSize: 13, color: C.red, marginTop: -20, fontWeight: 500 }}>Code incorrect, réessayez</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%", maxWidth: 290 }}>
        {["1","2","3","4","5","6","7","8","9","","0","del"].map((k, i) => (
          k === "" ? <div key={i} /> :
          <button key={i} onClick={() => handleKey(k)} style={{ height: 70, borderRadius: 14, border: `1px solid ${C.border2}`, background: k === "del" ? "transparent" : `linear-gradient(145deg,${C.surface},${C.card})`, color: k === "del" ? C.muted : C.text, fontSize: k === "del" ? 20 : 26, fontWeight: k === "del" ? 400 : 700, cursor: "pointer", transition: "transform 0.1s,background 0.12s", fontFamily: k === "del" ? "inherit" : FONT.display }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.93)"; e.currentTarget.style.background = k !== "del" ? `linear-gradient(145deg,${C.border2},${C.surface})` : `${C.surface}30`; }}
            onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = k === "del" ? "transparent" : `linear-gradient(145deg,${C.surface},${C.card})`; }}
            onTouchStart={e => { e.currentTarget.style.transform = "scale(0.93)"; }}
            onTouchEnd={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >{k === "del" ? "⌫" : k}</button>
        ))}
      </div>
    </div>
  );
}

// ── Sélecteur de profil ───────────────────────────────────────────────────────
function ProfilePicker({ onSelect }) {
  return (
    <div style={{ background: `radial-gradient(ellipse 80% 40% at 50% -5%, ${C.goldGlow} 0%, transparent 60%), ${C.bg}`, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 32, fontFamily: FONT.body }}>
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: C.goldDim, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>Faiz Transport Paris</div>
        <div style={{ fontFamily: FONT.display, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-0.03em" }}>Mes Comptes</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Sélectionne ton profil pour continuer</div>
      </div>
      {PROFILES.map((p, i) => (
        <button key={p.id} onClick={() => onSelect(p.id)} className="fade-up" style={{ width: "100%", maxWidth: 340, background: `linear-gradient(145deg,${C.card},${C.surface})`, border: `1px solid ${p.color}35`, borderLeft: `3px solid ${p.color}`, borderRadius: 16, padding: "20px 22px", cursor: "pointer", textAlign: "left", transition: "transform 0.18s,box-shadow 0.18s,border-color 0.18s", animationDelay: `${i * 0.08}s` }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${p.color}15`; e.currentTarget.style.borderColor = `${p.color}60`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${p.color}35`; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${p.color}18`, border: `1px solid ${p.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧑‍✈️</div>
            <div>
              <div style={{ fontFamily: FONT.display, fontSize: 17, fontWeight: 700, color: p.color }}>{p.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.company}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(() => DEMO_MODE || sessionStorage.getItem("pin_ok") === "1");
  const [profile, setProfile] = useState(() => DEMO_MODE ? "demo" : (localStorage.getItem("cp_profile") || null));

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab, setTab] = useState("dashboard");

  // Données du mois courant (tableaux plats, chargés depuis Supabase)
  const [courses, setCourses] = useState([]);
  const [frais, setFrais] = useState([]);

  // Config globale
  const [savedCompanies, setSavedCompanies] = useState([]);
  const [chauffeurObjects, setChauffeurObjects] = useState([]); // [{id, name, is_default}]
  const [defaultChauffeur, setDefaultChauffeur] = useState("");
  const [invoiceStatuses, setInvoiceStatuses] = useState({});
  const [recurringFrais, setRecurringFrais] = useState([]);

  // Modales
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [showFraisModal, setShowFraisModal] = useState(false);
  const [editFrais, setEditFrais] = useState(null);
  const [editCompany, setEditCompany] = useState(null);
  const [showChauffeurSettings, setShowChauffeurSettings] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChauffeur, setFilterChauffeur] = useState("");
  const [prevMonthCA, setPrevMonthCA] = useState(null);
  const [commissionCA, setCommissionCA] = useState(0);
  const [objectifCA, setObjectifCA] = useState(() => Number(localStorage.getItem(`objectif_${profile || ""}`) || 0));
  const [showObjectifInput, setShowObjectifInput] = useState(false);
  const [objectifInputVal, setObjectifInputVal] = useState("");

  const mk = monthKey(year, month);
  const savedChauffeurs = chauffeurObjects.map(c => c.name);
  const profileInfo = PROFILES.find(p => p.id === profile);

  const switchProfile = (p) => {
    localStorage.setItem("cp_profile", p);
    setCourses([]); setFrais([]); setSavedCompanies([]); setChauffeurObjects([]);
    setDefaultChauffeur(""); setRecurringFrais([]); setInvoiceStatuses({}); setLoaded(false);
    setProfile(p);
  };

  const [dbError, setDbError] = useState(null);

  // Chargement de la config (une seule fois)
  useEffect(() => {
    if (!profile) return;
    if (DEMO_MODE) {
      setSavedCompanies(DEMO_COMPANIES);
      setChauffeurObjects(DEMO_CHAUFFEURS);
      setDefaultChauffeur("Mohamed");
      setRecurringFrais([]);
      return;
    }
    (async () => {
      try {
        const companiesQuery = profile === "commission"
          ? supabase.from("companies").select("*").order("name")
          : supabase.from("companies").select("*").eq("profile", profile).order("name");
        const [companiesRes, chauffeursRes, recurringRes] = await Promise.all([
          companiesQuery,
          supabase.from("chauffeurs").select("*").eq("profile", profile).order("name"),
          supabase.from("recurring_frais").select("*").eq("profile", profile).order("created_at"),
        ]);
        if (companiesRes.error) throw companiesRes.error;
        if (chauffeursRes.error) throw chauffeursRes.error;
        if (recurringRes.error) throw recurringRes.error;
        // Dédoublonner les sociétés par nom (garder le premier trouvé)
        const allCompanies = companiesRes.data || [];
        const seen = new Set();
        const uniqueCompanies = allCompanies.filter(c => {
          if (seen.has(c.name)) return false;
          seen.add(c.name);
          return true;
        });
        setSavedCompanies(uniqueCompanies);
        const chData = chauffeursRes.data || [];
        setChauffeurObjects(chData);
        const def = chData.find(c => c.is_default);
        if (def) setDefaultChauffeur(def.name);
        setRecurringFrais((recurringRes.data || []).map(recurringFromDb));
        setDbError(null);
      } catch (e) {
        setDbError("Erreur de connexion à la base de données. Vérifie ta connexion internet.");
      }
    })();
  }, [profile]);

  // Chargement des données du mois (rechargé à chaque changement de mois)
  useEffect(() => {
    if (!profile) return;
    if (DEMO_MODE) {
      setCourses(DEMO_COURSES);
      setFrais(DEMO_FRAIS);
      setPrevMonthCA(3850);
      setLoaded(true);
      return;
    }
    setLoaded(false); setPrevMonthCA(null);
    (async () => {
      try {
        const prevMk = month === 0 ? `${year - 1}-12` : `${year}-${String(month).padStart(2, "0")}`;
        const queries = [
          supabase.from("courses").select("*").eq("month_key", mk).eq("profile", profile).order("heure"),
          supabase.from("frais").select("*").eq("month_key", mk).eq("profile", profile).order("date"),
          supabase.from("invoice_statuses").select("*").like("id", `${mk}:%`).eq("profile", profile),
          supabase.from("courses").select("total").eq("month_key", prevMk).eq("profile", profile),
        ];
        if (profile !== "commission") {
          queries.push(supabase.from("courses").select("total,chauffeur_cost").eq("month_key", mk).eq("profile", "commission"));
        }
        const [coursesRes, fraisRes, invoiceRes, prevRes, commRes] = await Promise.all(queries);
        if (coursesRes.error) throw coursesRes.error;
        if (fraisRes.error) throw fraisRes.error;
        const dbCourses = (coursesRes.data || []).map(courseFromDb);
        const dbFrais = (fraisRes.data || []).map(fraisFromDb);
        dbCourses.sort((a, b) => b.date.localeCompare(a.date) || (b.heure || "00:00").localeCompare(a.heure || "00:00"));
        dbFrais.sort((a, b) => a.date.localeCompare(b.date));
        setCourses(dbCourses);
        setFrais(dbFrais);
        const ivs = {};
        (invoiceRes.data || []).forEach(s => { ivs[s.id] = s.status; });
        setInvoiceStatuses(ivs);
        setPrevMonthCA((prevRes.data || []).reduce((s, r) => s + Number(r.total || 0), 0));
        if (commRes) setCommissionCA((commRes.data || []).reduce((s, r) => s + Number(r.total || 0) - Number(r.chauffeur_cost || 0), 0));
        else setCommissionCA(0);
        setLoaded(true);
        setDbError(null);
      } catch (e) {
        setDbError("Erreur lors du chargement des données. Vérifie ta connexion.");
        setLoaded(true);
      }
    })();
  }, [mk, profile]);

  // Application des frais récurrents après chargement du mois
  useEffect(() => {
    if (!loaded) return;
    applyRecurringToMonth(mk, year, month, recurringFrais);
  }, [loaded]);

  // Les données actives du mois sont directement courses / frais
  const mc = courses;
  const mf = frais;

  const totalCA = mc.reduce((s, c) => s + Number(c.total || 0), 0);
  const totalCC = mc.reduce((s, c) => s + Number(c.chauffeurCost || 0), 0);
  const totalMargeCommission = profile === "commission" ? totalCA - totalCC : commissionCA;
  const commissionShare = totalMargeCommission / 2;
  const totalCAAvecCommission = profile !== "commission" ? totalCA + commissionShare : totalCA;
  const totalTips = mc.reduce((s, c) => s + Number(c.tips || 0), 0);
  const totalFrais = mf.reduce((s, f) => s + Number(f.amount || 0), 0);
  const net = totalCA - totalFrais - totalCC;
  const byCompany = {};
  mc.filter(c => c.company && !c.isPrivate).forEach(c => { if (!byCompany[c.company]) byCompany[c.company] = { amount: 0, trips: [] }; byCompany[c.company].amount += Number(c.total || 0); byCompany[c.company].trips.push(c); });
  const privateCA = mc.filter(c => c.isPrivate).reduce((s, c) => s + Number(c.total || 0), 0);
  const byVehicle = {};
  mc.forEach(c => { const v = c.vehicule || "N/A"; if (!byVehicle[v]) byVehicle[v] = { trips: 0, ca: 0 }; byVehicle[v].trips++; byVehicle[v].ca += Number(c.total || 0); });
  const todayStr = today();
  const todayCA = mc.filter(c => c.date === todayStr).reduce((s, c) => s + Number(c.total || 0), 0);
  const todayCount = mc.filter(c => c.date === todayStr).length;
  const uniqueDriversInMonth = [...new Set(mc.map(c => c.chauffeur || defaultChauffeur).filter(Boolean))];
  const filteredCourses = mc.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (c.client || "").toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q) || new Date(c.date).toLocaleDateString("fr-FR").includes(q);
    const matchDriver = !filterChauffeur || (filterChauffeur === (c.chauffeur || defaultChauffeur));
    return matchSearch && matchDriver;
  });
  const byChauffeur = {};
  mc.filter(c => c.chauffeur && c.chauffeur !== defaultChauffeur && Number(c.chauffeurCost) > 0).forEach(c => {
    if (!byChauffeur[c.chauffeur]) byChauffeur[c.chauffeur] = { trips: [], cost: 0, ca: 0 };
    byChauffeur[c.chauffeur].trips.push(c);
    byChauffeur[c.chauffeur].cost += Number(c.chauffeurCost || 0);
    byChauffeur[c.chauffeur].ca += Number(c.total || 0);
  });

  // ── Handlers Courses ────────────────────────────────────────────────────────
  const saveCourse = async (c) => {
    if (!DEMO_MODE) await supabase.from("courses").upsert({ ...courseToDb(c, mk), profile });
    setCourses(prev => {
      const list = [...prev];
      const idx = list.findIndex(x => x.id === c.id);
      if (idx >= 0) list[idx] = c; else list.push(c);
      list.sort((a, b) => b.date.localeCompare(a.date) || (b.heure || "00:00").localeCompare(a.heure || "00:00"));
      return list;
    });
    setShowCourseModal(false); setEditCourse(null);
  };
  const deleteCourse = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    if (!DEMO_MODE) await supabase.from("courses").delete().eq("id", id);
    setCourses(prev => prev.filter(c => c.id !== id));
  };
  const duplicateCourse = (c) => {
    setEditCourse({ ...c, id: uid(), date: today(), heure: "" });
  };
  const exportCSV = () => {
    const headers = ["Date","Heure","Client","Société","Chauffeur","Véhicule","Prestation","Prise","Dépose","Total TTC","Pourboire","Notes"];
    const rows = mc.map(c => [c.date, c.heure, c.client, c.isPrivate ? "Privé" : c.company, c.chauffeur, c.vehicule, c.prestation === "mad" ? "MAD" : "Transfert", c.prise, c.depose, c.total, c.tips, c.notes].map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `courses_${mk}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const saveObjectif = (val) => {
    const n = Number(val) || 0;
    setObjectifCA(n);
    localStorage.setItem(`objectif_${profile}`, String(n));
    setShowObjectifInput(false);
  };

  // ── Handlers Frais ──────────────────────────────────────────────────────────
  const saveFrais = async (f) => {
    if (!DEMO_MODE) await supabase.from("frais").upsert({ ...fraisToDb(f, mk), profile });
    setFrais(prev => {
      const list = [...prev];
      const idx = list.findIndex(x => x.id === f.id);
      if (idx >= 0) list[idx] = f; else list.push(f);
      list.sort((a, b) => a.date.localeCompare(b.date));
      return list;
    });
    setShowFraisModal(false); setEditFrais(null);
  };
  const deleteFrais = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    if (!DEMO_MODE) await supabase.from("frais").delete().eq("id", id);
    setFrais(prev => prev.filter(f => f.id !== id));
  };

  // ── Handlers Sociétés ───────────────────────────────────────────────────────
  const handleSaveCompany = async (nameOrObj) => {
    if (typeof nameOrObj === "string") {
      if (!savedCompanies.some(c => c.name.toLowerCase() === nameOrObj.toLowerCase())) {
        const company = { ...defCompany(nameOrObj), profile };
        if (!DEMO_MODE) await supabase.from("companies").upsert(company);
        setSavedCompanies(prev => [...prev, company]);
      }
    } else {
      if (!DEMO_MODE) await supabase.from("companies").upsert({ ...nameOrObj, profile });
      setSavedCompanies(prev => { const idx = prev.findIndex(c => c.id === nameOrObj.id); if (idx >= 0) { const l = [...prev]; l[idx] = nameOrObj; return l; } return [...prev, nameOrObj]; });
    }
    setEditCompany(null);
  };
  const deleteCompany = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    if (!DEMO_MODE) await supabase.from("companies").delete().eq("id", id);
    setSavedCompanies(prev => prev.filter(c => c.id !== id));
  };

  // ── Handlers Chauffeurs ─────────────────────────────────────────────────────
  const handleSaveChauffeur = async (name) => {
    if (!chauffeurObjects.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      const isFirst = chauffeurObjects.length === 0;
      const newCh = { id: uid(), name, is_default: isFirst, profile };
      if (!DEMO_MODE) await supabase.from("chauffeurs").upsert(newCh);
      setChauffeurObjects(prev => [...prev, newCh]);
      if (isFirst) setDefaultChauffeur(name);
    }
  };
  const handleDeleteChauffeur = async (name) => {
    if (!window.confirm(`Supprimer ${name} ?`)) return;
    const ch = chauffeurObjects.find(c => c.name === name);
    if (ch && !DEMO_MODE) { await supabase.from("chauffeurs").delete().eq("id", ch.id); }
    setChauffeurObjects(prev => prev.filter(c => c.name !== name));
    if (defaultChauffeur === name) setDefaultChauffeur("");
  };
  const handleSetDefault = async (name) => {
    const updates = chauffeurObjects.map(c => ({ ...c, is_default: c.name === name, profile }));
    if (!DEMO_MODE) await supabase.from("chauffeurs").upsert(updates);
    setChauffeurObjects(updates);
    setDefaultChauffeur(name);
  };

  // ── Frais récurrents ────────────────────────────────────────────────────────
  const applyRecurringToMonth = (targetMk, targetYear, targetMonth, recList) => {
    const active = recList.filter(r => r.active && r.category && r.amount);
    if (active.length === 0) return;
    setFrais(prev => {
      const appliedIds = new Set(prev.filter(f => f.recurringId).map(f => f.recurringId));
      const toAdd = active.filter(r => !appliedIds.has(r.id)).map(r => ({
        id: uid(), recurringId: r.id,
        date: `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(Math.min(r.day, 28)).padStart(2, "0")}`,
        category: r.category, amount: r.amount, notes: r.notes, isRecurring: true,
      }));
      if (toAdd.length === 0) return prev;
      if (!DEMO_MODE) toAdd.forEach(f => supabase.from("frais").upsert({ ...fraisToDb(f, targetMk), profile }).then(() => {}));
      return [...prev, ...toAdd].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleSaveRecurring = async (list) => {
    if (!DEMO_MODE) {
      const { data: existing } = await supabase.from("recurring_frais").select("id").eq("profile", profile);
      const existingIds = (existing || []).map(r => r.id);
      const newIds = list.map(r => r.id);
      const toDelete = existingIds.filter(id => !newIds.includes(id));
      if (toDelete.length > 0) await supabase.from("recurring_frais").delete().in("id", toDelete);
      if (list.length > 0) await supabase.from("recurring_frais").upsert(list.map(r => ({ ...recurringToDb(r), profile })));
    }
    setRecurringFrais(list);
    applyRecurringToMonth(mk, year, month, list);
    setShowRecurringModal(false);
  };

  const recurringCount = recurringFrais.filter(r => r.active).length;
  const monthRecurringTotal = recurringFrais.filter(r => r.active && r.amount).reduce((s, r) => s + Number(r.amount || 0), 0);

  // ── Statuts factures ────────────────────────────────────────────────────────
  const setInvoiceStatus = async (companyName, status) => {
    const key = `${mk}:${companyName}`;
    if (!DEMO_MODE) await supabase.from("invoice_statuses").upsert({ id: key, status, updated_at: new Date().toISOString(), profile });
    setInvoiceStatuses(prev => ({ ...prev, [key]: status }));
  };
  const getInvoiceStatus = (companyName) => invoiceStatuses[`${mk}:${companyName}`] || "a_envoyer";

  // ── Navigation ──────────────────────────────────────────────────────────────
  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };
  const exportPDF = () => {
    const coursesDict = { [mk]: courses };
    const fraisDict = { [mk]: frais };
    const w = window.open("", "_blank");
    w.document.write(generateRecapHTML({ year, month, courses: coursesDict, frais: fraisDict, savedCompanies, defaultChauffeur }));
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const vColor = v => v === "Classe E" ? C.blue : v === "Classe V" ? C.purple : C.teal;
  const vIcon = v => v === "Classe E" ? "🚙" : v === "Classe V" ? "🚐" : "🚗";

  // ── Rendu ───────────────────────────────────────────────────────────────────
  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;
  if (!profile) return <ProfilePicker onSelect={switchProfile} />;

  return (
    <div style={{ background: C.bg, minHeight: "100dvh", fontFamily: FONT.body, color: C.text, maxWidth: 480, margin: "0 auto" }}>
      {DEMO_MODE && (
        <div style={{ background: `linear-gradient(90deg,${C.orange},#F5C23C)`, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, zIndex: 20 }}>
          <span style={{ fontSize: 16 }}>👁</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.bg, fontFamily: FONT.display, letterSpacing: "0.1em", textTransform: "uppercase" }}>Mode démonstration</div>
            <div style={{ fontSize: 11, color: "rgba(0,0,0,0.6)" }}>Données fictives — aucune modification enregistrée</div>
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: `rgba(5,6,10,0.95)`, backdropFilter: "blur(12px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: C.goldDim, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 2 }}>Course Privée</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontFamily: FONT.display, fontSize: 24, color: C.text, letterSpacing: "0.06em", textTransform: "uppercase" }}>Mes Comptes</div>
              {defaultChauffeur && <button onClick={() => setShowChauffeurSettings(true)} style={{ background: C.goldGlow, border: `1px solid ${C.gold}40`, borderRadius: 20, padding: "3px 10px", fontSize: 12, color: C.gold, fontWeight: 600, cursor: "pointer", transition: "all 0.18s" }}>🧑‍✈️ {defaultChauffeur}</button>}
            </div>
            <button onClick={() => { localStorage.removeItem("cp_profile"); setProfile(null); }} style={{ background: `${profileInfo?.color || C.blue}12`, border: `1px solid ${profileInfo?.color || C.blue}35`, borderRadius: 20, padding: "2px 10px", fontSize: 11, color: profileInfo?.color || C.blue, fontWeight: 600, cursor: "pointer", marginTop: 5 }}>
              👤 {profileInfo?.name} · {profileInfo?.company} ↩
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={prevMonth} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 17, transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.text; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>‹</button>
            <button onClick={() => setShowMonthPicker(true)} style={{ background: C.goldGlow, border: `1px solid ${C.gold}40`, borderRadius: 10, padding: "6px 12px", cursor: "pointer", minWidth: 88, textAlign: "center", transition: "all 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = `${C.gold}70`} onMouseLeave={e => e.currentTarget.style.borderColor = `${C.gold}40`}>
              <div style={{ fontSize: 10, color: C.goldDim, fontWeight: 700, letterSpacing: "0.06em" }}>{year}</div>
              <div style={{ fontFamily: FONT.display, fontSize: 13, fontWeight: 700, color: C.gold, textTransform: "capitalize" }}>{MOIS[month].slice(0, 4)}.</div>
            </button>
            <button onClick={nextMonth} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, width: 34, height: 34, cursor: "pointer", fontSize: 17, transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.text; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>›</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch" }}>
          {[["dashboard","📊 Résumé"],["courses","🚗 Courses"],["chauffeurs","🧑‍✈️ Chauffeurs"],["frais","💸 Frais"],["societes","🏢 Sociétés"]]
            .filter(([id]) => profile !== "commission" || (id !== "frais" && id !== "chauffeurs"))
            .map(([id, lbl]) => (
              <Pill key={id} label={lbl} active={tab === id} onClick={() => setTab(id)} />
            ))}
        </div>
      </div>

      {dbError && (
        <div style={{ background: `${C.red}18`, border: `1px solid ${C.red}55`, borderRadius: 10, margin: "8px 16px", padding: "10px 14px", fontSize: 13, color: C.red, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>⚠️ {dbError}</span>
          <button onClick={() => setDbError(null)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
      )}

      <div style={{ padding: 16 }}>
        {!loaded && tab !== "dashboard" ? (
          <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
            <div style={{ fontSize: 32 }}>⏳</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>Chargement…</div>
          </div>
        ) : (
          <>
            {/* DASHBOARD */}
            {tab === "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, textTransform: "capitalize" }}>{monthLabel(year, month)}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small onClick={exportCSV} style={{ background: C.surface, color: C.teal, border: `1px solid ${C.teal}44` }}>📊 CSV</Btn>
                    <Btn small onClick={exportPDF} style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}` }}>📄 PDF</Btn>
                  </div>
                </div>
                {todayCount > 0 && (
                  <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}33`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><div style={{ fontSize: 11, color: C.goldDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Aujourd'hui</div><div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{todayCount} course{todayCount > 1 ? "s" : ""}</div></div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.gold, fontFamily: "monospace" }}>{fmt(todayCA)}</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <Card style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>CA Brut</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>{fmt(totalCA)}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{mc.length} course{mc.length > 1 ? "s" : ""}</div>
                    {prevMonthCA !== null && totalCA > 0 && (
                      <div style={{ fontSize: 11, marginTop: 4, color: totalCA >= prevMonthCA ? C.green : C.red, fontWeight: 600 }}>
                        {totalCA >= prevMonthCA ? "▲" : "▼"} {prevMonthCA > 0 ? `${Math.round(Math.abs(totalCA - prevMonthCA) / prevMonthCA * 100)}% vs mois préc.` : "Nouveau mois"}
                      </div>
                    )}
                  </Card>
                  <Stat label="Pourboires" value={fmt(totalTips)} color={C.green} />
                </div>
                {profile !== "commission" && commissionCA > 0 && (
                  <Card style={{ borderColor: `${C.green}44` }}>
                    <div style={{ fontSize: 10, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>Commission commune</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: C.muted }}>Total commissions (marge)</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.text }}>{fmt(commissionCA)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: `${C.green}12`, borderRadius: 8, padding: "8px 12px" }}>
                      <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>Ta part (÷2)</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 800, color: C.green, fontSize: 17 }}>{fmt(commissionShare)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>CA total (perso + commission)</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.gold }}>{fmt(totalCAAvecCommission)}</span>
                    </div>
                  </Card>
                )}
                {profile === "commission" ? (
                  <>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Stat label="Chauffeurs" value={fmt(totalCC)} color={C.orange} />
                      <Card style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontWeight: 700 }}>Marge nette</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: C.green, fontFamily: "monospace" }}>{fmt(totalMargeCommission)}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>CA − Chauffeurs</div>
                      </Card>
                    </div>
                    <Card style={{ borderColor: `${C.green}55` }}>
                      <div style={{ fontSize: 11, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>Répartition (marge ÷ 2)</div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {PROFILES.filter(p => p.id !== "commission").map(p => (
                          <div key={p.id} style={{ flex: 1, background: `${p.color}12`, border: `1px solid ${p.color}44`, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
                            <div style={{ fontSize: 12, color: p.color, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: p.color }}>{fmt(totalMargeCommission / 2)}</div>
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>÷ 2</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Stat label="Frais" value={fmt(totalFrais)} color={C.red} />
                      <Stat label="Chauffeurs" value={fmt(totalCC)} color={C.orange} />
                    </div>
                    <Card style={{ borderColor: net >= 0 ? `${C.green}44` : `${C.red}44` }}>
                      <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Net (CA − Frais − Chauffeurs)</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: net >= 0 ? C.green : C.red, fontFamily: "monospace" }}>{fmt(net)}</div>
                    </Card>
                    <Card>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Objectif mensuel</div>
                        <button onClick={() => { setObjectifInputVal(String(objectifCA || "")); setShowObjectifInput(v => !v); }} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✏️</button>
                      </div>
                      {showObjectifInput && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <input type="number" value={objectifInputVal} onChange={e => setObjectifInputVal(e.target.value)} placeholder="ex: 5000" style={{ ...iBase, flex: 1 }} />
                          <Btn small onClick={() => saveObjectif(objectifInputVal)}>OK</Btn>
                        </div>
                      )}
                      {objectifCA > 0 ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                            <span style={{ color: C.muted }}>{fmt(totalCA)} / {fmt(objectifCA)}</span>
                            <span style={{ fontWeight: 700, color: totalCA >= objectifCA ? C.green : C.gold }}>{Math.min(100, Math.round(totalCA / objectifCA * 100))}%</span>
                          </div>
                          <div style={{ background: C.surface, borderRadius: 6, height: 8, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, totalCA / objectifCA * 100)}%`, background: totalCA >= objectifCA ? C.green : C.gold, borderRadius: 6, transition: "width 0.4s" }} />
                          </div>
                          {totalCA >= objectifCA && <div style={{ fontSize: 12, color: C.green, marginTop: 6, fontWeight: 700 }}>🎉 Objectif atteint !</div>}
                        </>
                      ) : (
                        <div style={{ fontSize: 13, color: C.muted }}>Définir un objectif de CA pour voir ta progression.</div>
                      )}
                    </Card>
                  </>
                )}
                {Object.keys(byVehicle).length > 0 && (
                  <Card>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Par gamme</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {Object.entries(byVehicle).map(([v, d]) => (
                        <div key={v} style={{ flex: 1, background: C.surface, borderRadius: 10, padding: "12px 14px", border: `1px solid ${vColor(v)}44` }}>
                          <div style={{ fontSize: 18, marginBottom: 4 }}>{vIcon(v)}</div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: vColor(v) }}>{v}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color: C.text, marginTop: 4 }}>{fmt(d.ca)}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{d.trips} course{d.trips > 1 ? "s" : ""}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {Object.keys(byCompany).length > 0 && (
                  <Card>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>À facturer</div>
                    {Object.entries(byCompany).map(([name, d]) => (
                      <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                        <div><div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div><div style={{ fontSize: 11, color: C.muted }}>{d.trips.length} course{d.trips.length > 1 ? "s" : ""}</div></div>
                        <div style={{ fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>{fmt(d.amount)}</div>
                      </div>
                    ))}
                    {privateCA > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}><div style={{ fontWeight: 600 }}>Privé (cash)</div><div style={{ fontWeight: 700, color: C.green, fontFamily: "monospace" }}>{fmt(privateCA)}</div></div>}
                  </Card>
                )}
                {mc.length === 0 && mf.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.muted }}><div style={{ fontSize: 40 }}>🚗</div><div style={{ marginTop: 8 }}>Aucune donnée ce mois</div></div>}
              </div>
            )}

            {/* COURSES */}
            {tab === "courses" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><span style={{ fontWeight: 700 }}>{filteredCourses.length} course{filteredCourses.length > 1 ? "s" : ""}</span><span style={{ color: C.gold, fontWeight: 700, fontFamily: "monospace", marginLeft: 8 }}>{fmt(filteredCourses.reduce((s,c) => s + Number(c.total||0), 0))}</span></div>
                  <Btn onClick={() => setShowCourseModal(true)} small>+ Course</Btn>
                </div>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 Rechercher client, société, date…" style={{ ...iBase, fontSize: 13 }} />
                {uniqueDriversInMonth.length > 1 && (
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch" }}>
                    <button onClick={() => setFilterChauffeur("")} style={{ padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: !filterChauffeur ? C.gold : C.surface, color: !filterChauffeur ? C.bg : C.muted, whiteSpace: "nowrap" }}>Tous</button>
                    {uniqueDriversInMonth.map(d => <button key={d} onClick={() => setFilterChauffeur(filterChauffeur === d ? "" : d)} style={{ padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: filterChauffeur === d ? C.gold : C.surface, color: filterChauffeur === d ? C.bg : C.muted, whiteSpace: "nowrap" }}>🧑‍✈️ {d}</button>)}
                  </div>
                )}
                {mc.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.muted }}><div style={{ fontSize: 40 }}>🚕</div><div style={{ marginTop: 8 }}>Aucune course ce mois</div></div>}
                {filteredCourses.length === 0 && mc.length > 0 && <div style={{ textAlign: "center", padding: 24, color: C.muted }}>Aucun résultat pour « {searchQuery} »</div>}
                {filteredCourses.map(c => {
                  const sups = c.supplements || [];
                  const supSum = sups.reduce((s, x) => s + Number(x.amount || 0), 0);
                  return (
                    <Card key={c.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6, alignItems: "center" }}>
                            {c.heure && <span style={{ background: C.goldDim, color: C.white, borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>⏰ {c.heure}</span>}
                            <span style={{ fontSize: 12, color: C.muted }}>{new Date(c.date).toLocaleDateString("fr-FR")}</span>
                            {c.vehicule && <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, fontWeight: 600, background: `${vColor(c.vehicule)}22`, color: vColor(c.vehicule) }}>{vIcon(c.vehicule)} {c.vehicule}</span>}
                            <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, fontWeight: 600, background: c.prestation === "mad" ? `${C.purple}22` : `${C.blue}22`, color: c.prestation === "mad" ? C.purple : C.blue }}>{c.prestation === "mad" ? "⏱ MAD" : "🚗 Transfert"}</span>
                            {c.isPrivate ? <span style={{ fontSize: 11, color: C.green, background: `${C.green}22`, borderRadius: 4, padding: "2px 7px" }}>Privé</span> : c.company && <span style={{ fontSize: 11, color: C.gold, background: `${C.gold}18`, borderRadius: 4, padding: "2px 7px" }}>{c.company}</span>}
                            {sups.length > 0 && <span style={{ fontSize: 11, color: C.teal, background: `${C.teal}18`, borderRadius: 4, padding: "2px 7px" }}>+{sups.length} suppl.</span>}
                          </div>
                          {c.chauffeur && <div style={{ fontSize: 12, color: c.chauffeur !== defaultChauffeur ? C.orange : C.muted, marginBottom: 3 }}>🧑‍✈️ {c.chauffeur}{c.chauffeur !== defaultChauffeur && Number(c.chauffeurCost) > 0 ? ` · ${fmt(c.chauffeurCost)}` : ""}</div>}
                          {c.client && <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>👤 {c.client}</div>}
                          {(c.prise || c.depose) && <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{c.prise && <span>📍 {c.prise}</span>}{c.prise && c.depose && " → "}{c.depose && <span>🏁 {c.depose}</span>}</div>}
                          {sups.length > 0 && <div style={{ fontSize: 11, color: C.teal, marginBottom: 3 }}>{sups.map(s => s.type).join(" · ")} : +{fmt(supSum)}</div>}
                          {c.prestation === "mad" && c.tauxHoraire && c.nbHeures && <div style={{ fontSize: 11, color: C.muted }}>Client : {c.tauxHoraire}€/h × {c.nbHeures}h</div>}
                          {Number(c.tips) > 0 && <div style={{ fontSize: 12, color: C.green, marginTop: 2 }}>+{fmt(c.tips)} pourboire</div>}
                          {c.notes && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{c.notes}</div>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginLeft: 10 }}>
                          <div style={{ background: C.gold, color: C.bg, fontFamily: FONT.display, fontSize: 17, fontWeight: 700, letterSpacing: "0.04em", padding: "4px 11px", borderRadius: 8, whiteSpace: "nowrap" }}>{fmt(c.total)}</div>
                          <div style={{ display: "flex", gap: 6 }}><Btn small variant="ghost" onClick={() => setEditCourse(c)}>✏️</Btn><Btn small variant="ghost" onClick={() => duplicateCourse(c)} style={{ color: C.teal }}>📋</Btn><Btn small variant="danger" onClick={() => deleteCourse(c.id)}>🗑</Btn></div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* CHAUFFEURS */}
            {tab === "chauffeurs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Récap – {MOIS[month]} {year}</div>
                  <Btn small onClick={exportPDF} style={{ background: `${C.gold}18`, color: C.gold, border: `1px solid ${C.gold}44` }}>📄 PDF</Btn>
                </div>
                {(() => {
                  const ownTrips = mc.filter(c => c.chauffeur === defaultChauffeur || !c.chauffeur);
                  const ownCA = ownTrips.reduce((s, c) => s + Number(c.total || 0), 0);
                  const ownTips = ownTrips.reduce((s, c) => s + Number(c.tips || 0), 0);
                  const bv = {};
                  ownTrips.forEach(c => { const v = c.vehicule || "N/A"; if (!bv[v]) bv[v] = { trips: 0, ca: 0 }; bv[v].trips++; bv[v].ca += Number(c.total || 0); });
                  return (
                    <Card style={{ borderColor: `${C.gold}55` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div><div style={{ fontWeight: 700, fontSize: 16 }}>🧑‍✈️ {defaultChauffeur || "Principal"}</div><div style={{ fontSize: 12, color: C.gold, marginTop: 2 }}>Chauffeur principal</div></div>
                        <div style={{ textAlign: "right" }}><div style={{ fontWeight: 800, fontSize: 20, color: C.gold, fontFamily: "monospace" }}>{fmt(ownCA)}</div><div style={{ fontSize: 11, color: C.muted }}>{ownTrips.length} course{ownTrips.length > 1 ? "s" : ""}</div></div>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "10px 12px" }}><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>CA</div><div style={{ fontSize: 16, fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>{fmt(ownCA)}</div></div>
                        <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "10px 12px" }}><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Pourboires</div><div style={{ fontSize: 16, fontWeight: 700, color: C.green, fontFamily: "monospace" }}>{fmt(ownTips)}</div></div>
                      </div>
                      {Object.entries(bv).map(([v, d]) => <div key={v} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${C.border}` }}><span style={{ fontSize: 13, color: vColor(v) }}>{vIcon(v)} {v}</span><span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{fmt(d.ca)} · {d.trips} course{d.trips > 1 ? "s" : ""}</span></div>)}
                    </Card>
                  );
                })()}
                {Object.keys(byChauffeur).length === 0
                  ? <div style={{ textAlign: "center", padding: 24, color: C.muted }}><div style={{ fontSize: 32 }}>🧑‍✈️</div><div style={{ marginTop: 6 }}>Aucun autre chauffeur ce mois</div></div>
                  : Object.entries(byChauffeur).map(([name, d]) => (
                    <Card key={name} style={{ borderColor: `${C.orange}44` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div><div style={{ fontWeight: 700, fontSize: 16 }}>🧑‍✈️ {name}</div><div style={{ fontSize: 12, color: C.orange }}>Chauffeur externe</div></div>
                        <div style={{ textAlign: "right" }}><div style={{ fontSize: 11, color: C.muted }}>CA généré</div><div style={{ fontWeight: 700, fontSize: 16, color: C.gold, fontFamily: "monospace" }}>{fmt(d.ca)}</div></div>
                      </div>
                      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "10px 12px" }}><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>À payer</div><div style={{ fontSize: 18, fontWeight: 800, color: C.orange, fontFamily: "monospace" }}>{fmt(d.cost)}</div></div>
                        <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: "10px 12px" }}><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Marge</div><div style={{ fontSize: 18, fontWeight: 800, color: d.ca - d.cost >= 0 ? C.green : C.red, fontFamily: "monospace" }}>{fmt(d.ca - d.cost)}</div></div>
                      </div>
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
                        {d.trips.map(c => (
                          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                            <div>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <span style={{ color: C.muted }}>{new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</span>
                                {c.heure && <span style={{ color: C.gold }}>{c.heure}</span>}
                                {c.client && <span style={{ color: C.text }}>· {c.client}</span>}
                              </div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{c.prestation === "mad" && c.chauffeurHourlyRate ? `⏱ ${c.chauffeurHourlyRate}€/h × ${c.nbHeures}h` : "🚗 Forfait"}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontFamily: "monospace", fontWeight: 600 }}>{fmt(c.total)}</div>
                              <div style={{ fontSize: 11, color: C.orange, fontFamily: "monospace" }}>−{fmt(c.chauffeurCost)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))
                }
                {Object.keys(byChauffeur).length > 0 && (
                  <Card>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Total à payer</div>
                    {Object.entries(byChauffeur).map(([name, d]) => <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}><span>🧑‍✈️ {name}</span><span style={{ fontWeight: 700, color: C.orange, fontFamily: "monospace" }}>{fmt(d.cost)}</span></div>)}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10 }}><span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 800, color: C.orange, fontFamily: "monospace" }}>{fmt(totalCC)}</span></div>
                  </Card>
                )}
              </div>
            )}

            {/* FRAIS */}
            {tab === "frais" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><span style={{ fontWeight: 700 }}>{mf.length} dépense{mf.length > 1 ? "s" : ""}</span><span style={{ color: C.red, fontWeight: 700, fontFamily: "monospace", marginLeft: 8 }}>{fmt(totalFrais)}</span></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowRecurringModal(true)} style={{ background: `${C.red}15`, border: `1px solid ${C.red}44`, color: C.red, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      🔁 Récurrents{recurringCount > 0 ? ` (${recurringCount})` : ""}
                    </button>
                    <Btn onClick={() => setShowFraisModal(true)} small>+ Dépense</Btn>
                  </div>
                </div>
                {recurringCount > 0 && (
                  <div style={{ background: `${C.red}0D`, border: `1px solid ${C.red}33`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>🔁 Charges fixes ce mois</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{recurringFrais.filter(r => r.active).map(r => r.notes || r.category).join(" · ")}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: C.red, fontFamily: "monospace" }}>{fmt(monthRecurringTotal)}</div>
                  </div>
                )}
                {mf.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.muted }}><div style={{ fontSize: 40 }}>💸</div><div>Aucun frais ce mois</div></div>}
                {mf.map(f => (
                  <Card key={f.id} style={f.isRecurring ? { borderColor: `${C.red}44` } : {}}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{f.category}</div>
                          {f.isRecurring && <span style={{ fontSize: 10, color: C.red, background: `${C.red}18`, borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>🔁 Auto</span>}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted }}>{new Date(f.date).toLocaleDateString("fr-FR")}</div>
                        {f.notes && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{f.notes}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: C.red, fontFamily: "monospace" }}>{fmt(f.amount)}</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {!f.isRecurring && <Btn small variant="ghost" onClick={() => setEditFrais(f)}>✏️</Btn>}
                          <Btn small variant="danger" onClick={() => deleteFrais(f.id)}>🗑</Btn>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* SOCIETES */}
            {tab === "societes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>À facturer – {MOIS[month]} {year}</div>
                  <Btn small onClick={exportPDF} style={{ background: `${C.gold}18`, color: C.gold, border: `1px solid ${C.gold}44` }}>📄 PDF</Btn>
                </div>
                {Object.keys(byCompany).length > 0 && (() => {
                  const counts = { a_envoyer: 0, envoyee: 0, payee: 0 };
                  Object.keys(byCompany).forEach(name => { counts[getInvoiceStatus(name)]++; });
                  return (
                    <div style={{ display: "flex", gap: 8 }}>
                      {INVOICE_STATUSES.map(s => (
                        <div key={s.key} style={{ flex: 1, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                          <div style={{ fontSize: 16 }}>{s.emoji}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{counts[s.key]}</div>
                          <div style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {Object.keys(byCompany).length === 0 && <div style={{ textAlign: "center", padding: 24, color: C.muted }}><div style={{ fontSize: 32 }}>🏢</div><div style={{ marginTop: 6 }}>Aucune course société ce mois</div></div>}
                {Object.entries(byCompany).sort((a, b) => b[1].amount - a[1].amount).map(([name, d]) => {
                  const info = savedCompanies.find(c => c.name.toLowerCase() === name.toLowerCase());
                  const status = getInvoiceStatus(name);
                  const si = invoiceStatusInfo(status);
                  return (
                    <Card key={name} style={{ borderColor: si.border }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: si.color, background: si.bg, border: `1px solid ${si.border}`, borderRadius: 20, padding: "2px 8px" }}>{si.emoji} {si.label}</span>
                          </div>
                          {info?.adresse && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📍 {info.adresse}</div>}
                          {info?.email && <div style={{ fontSize: 11, color: C.muted }}>✉️ {info.email}</div>}
                          {info?.siren && <div style={{ fontSize: 11, color: C.muted }}>SIREN : {info.siren}</div>}
                          {info?.tva && <div style={{ fontSize: 11, color: C.muted }}>TVA : {info.tva}</div>}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 20, color: si.key === "payee" ? C.green : C.gold, fontFamily: "monospace" }}>{fmt(d.amount)}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                        {INVOICE_STATUSES.map(s => (
                          <button key={s.key} onClick={() => setInvoiceStatus(name, s.key)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `2px solid ${status === s.key ? s.color : C.border}`, background: status === s.key ? s.bg : C.surface, color: status === s.key ? s.color : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            {s.emoji} {s.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                        {d.trips.map(c => {
                          const sups = c.supplements || [];
                          const supSum = sups.reduce((s, x) => s + Number(x.amount || 0), 0);
                          return (
                            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                              <div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                  <span style={{ color: C.muted }}>{new Date(c.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</span>
                                  {c.heure && <span style={{ color: C.gold, fontWeight: 600 }}>{c.heure}</span>}
                                  {c.vehicule && <span style={{ fontSize: 11, color: vColor(c.vehicule) }}>{vIcon(c.vehicule)}</span>}
                                  {c.client && <span style={{ color: C.text }}>· {c.client}</span>}
                                </div>
                                {(c.prise || c.depose) && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{c.prise}{c.prise && c.depose ? " → " : ""}{c.depose}</div>}
                                {sups.length > 0 && <div style={{ fontSize: 11, color: C.teal, marginTop: 1 }}>{sups.map(s => s.type).join(" · ")} : +{fmt(supSum)}</div>}
                              </div>
                              <span style={{ fontWeight: 600, fontFamily: "monospace", flexShrink: 0 }}>{fmt(c.total)}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 10 }}>
                        {info ? <Btn small variant="ghost" onClick={() => setEditCompany(info)} style={{ color: C.muted }}>✏️ Infos</Btn>
                          : <Btn small variant="ghost" onClick={() => setEditCompany(defCompany(name))} style={{ color: C.blue }}>+ Infos de facturation</Btn>}
                      </div>
                    </Card>
                  );
                })}
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Sociétés mémorisées ({savedCompanies.length})</div>
                    <Btn small onClick={() => setEditCompany(defCompany())}>+ Ajouter</Btn>
                  </div>
                  {savedCompanies.length === 0 && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>Aucune société mémorisée</div>}
                  {savedCompanies.map(c => (
                    <Card key={c.id} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>{c.adresse && <div style={{ fontSize: 12, color: C.muted }}>📍 {c.adresse}</div>}{c.email && <div style={{ fontSize: 12, color: C.muted }}>✉️ {c.email}</div>}{c.siren && <div style={{ fontSize: 12, color: C.muted }}>SIREN : {c.siren}</div>}{c.tva && <div style={{ fontSize: 12, color: C.muted }}>TVA : {c.tva}</div>}</div>
                        <div style={{ display: "flex", gap: 6 }}><Btn small variant="ghost" onClick={() => setEditCompany(c)}>✏️</Btn><Btn small variant="danger" onClick={() => deleteCompany(c.id)}>🗑</Btn></div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      {showRecurringModal && <RecurringFraisModal recurringFrais={recurringFrais} onSave={handleSaveRecurring} onClose={() => setShowRecurringModal(false)} />}
      {showMonthPicker && <MonthPickerModal year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} onClose={() => setShowMonthPicker(false)} />}
      {(showCourseModal || editCourse) && <CourseModal initial={editCourse} onSave={saveCourse} onClose={() => { setShowCourseModal(false); setEditCourse(null); }} savedCompanies={savedCompanies} onSaveCompany={handleSaveCompany} savedChauffeurs={savedChauffeurs} onSaveChauffeur={handleSaveChauffeur} defaultChauffeur={defaultChauffeur} />}
      {(showFraisModal || editFrais) && <FraisModal initial={editFrais} onSave={saveFrais} onClose={() => { setShowFraisModal(false); setEditFrais(null); }} />}
      {editCompany && <CompanyInfoModal initial={editCompany} onSave={handleSaveCompany} onClose={() => setEditCompany(null)} />}
      {showChauffeurSettings && <ChauffeurSettingsModal savedChauffeurs={savedChauffeurs} defaultChauffeur={defaultChauffeur} onSetDefault={handleSetDefault} onAdd={handleSaveChauffeur} onDelete={handleDeleteChauffeur} onClose={() => setShowChauffeurSettings(false)} />}

      {/* Bouton flottant + */}
      {tab === "courses" && !showCourseModal && !editCourse && <button onClick={() => setShowCourseModal(true)} style={{ position: "fixed", bottom: 24, right: 24, width: 54, height: 54, borderRadius: "50%", background: C.gold, border: "none", cursor: "pointer", fontSize: 24, color: C.bg, fontWeight: 700, boxShadow: `0 4px 20px ${C.gold}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>}
      {tab === "frais" && !showFraisModal && !editFrais && !showRecurringModal && <button onClick={() => setShowFraisModal(true)} style={{ position: "fixed", bottom: 24, right: 24, width: 54, height: 54, borderRadius: "50%", background: C.red, border: "none", cursor: "pointer", fontSize: 24, color: C.white, fontWeight: 700, boxShadow: `0 4px 20px ${C.red}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>}
    </div>
  );
}
