import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase.js";

// ── Constantes ────────────────────────────────────────────────────────────────
const C = {
  bg: "#08090D", surface: "#10121A", card: "#161B26", border: "#1E2535",
  gold: "#C8A45A", goldDim: "#8A6E38", green: "#3DD68C", red: "#F26B6B",
  blue: "#5B9CF6", purple: "#9B7EF5", orange: "#FB923C", teal: "#2DD4BF",
  text: "#E8EAF0", muted: "#6B748A", white: "#FFFFFF",
};

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const LIEUX = ["CDG","ORY","LBG","Gare de l'Est","Gare de Lyon","Gare du Nord","Gare Montparnasse"];
const FRAIS_CATS = ["Essence / Péage","Bureau","Digidom","Assurance","SFR","Site web","Entretien / Réparation","Nourriture","Autre"];
const VEHICULES = ["Classe E","Classe V"];
const SUPPLEMENT_TYPES = ["Attente","Stop supplémentaire","Parking","Péage","Nuit / Dimanche","Bagages","Autre"];

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
  <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: active ? C.gold : C.surface, color: active ? C.bg : C.muted, whiteSpace: "nowrap" }}>{label}</button>
);
const Card = ({ children, style }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, ...style }}>{children}</div>
);
const Stat = ({ label, value, color = C.text, sub }) => (
  <Card style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
  </Card>
);
const Lbl = ({ children }) => <label style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{children}</label>;
const iBase = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, padding: "8px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" };
const Input = ({ label, ...p }) => (<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{label && <Lbl>{label}</Lbl>}<input {...p} style={{ ...iBase, ...p.style }} /></div>);
const Textarea = ({ label, ...p }) => (<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{label && <Lbl>{label}</Lbl>}<textarea {...p} style={{ ...iBase, resize: "vertical", minHeight: 56, ...p.style }} /></div>);
const Btn = ({ children, onClick, variant = "primary", style, small }) => {
  const bg = variant === "primary" ? C.gold : variant === "danger" ? C.red : C.surface;
  const col = variant === "ghost" ? C.muted : C.bg;
  return <button onClick={onClick} style={{ background: bg, color: col, border: "none", borderRadius: 8, cursor: "pointer", padding: small ? "6px 12px" : "10px 18px", fontSize: small ? 12 : 14, fontWeight: 600, ...style }} onMouseOver={e => e.currentTarget.style.opacity = .8} onMouseOut={e => e.currentTarget.style.opacity = 1}>{children}</button>;
};
const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

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
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  useEffect(() => {
    setF(p => ({ ...p, total: computeTotal(p), chauffeurCost: computeChauffeurCost(p) }));
  }, [f.prestation, f.prixTTC, f.tauxHoraire, f.nbHeures, f.chauffeurFlatRate, f.chauffeurHourlyRate, JSON.stringify(f.supplements)]);
  const isOtherDriver = f.chauffeur && f.chauffeur !== defaultChauffeur;
  const companyOk = f.company && savedCompanies.some(c => c.name.toLowerCase() === f.company.trim().toLowerCase());
  const chauffeurSaved = savedChauffeurs.some(c => c.toLowerCase() === (f.chauffeur || "").trim().toLowerCase());
  const valid = f.date && Number(f.total) > 0;
  const supTotal = (f.supplements || []).reduce((s, x) => s + Number(x.amount || 0), 0);
  const vColor = v => v === "Classe E" ? C.blue : C.purple;
  return (
    <Modal title={initial ? "Modifier la course" : "Nouvelle course"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Input label="Date" type="date" value={f.date} onChange={e => set("date", e.target.value)} style={{ flex: 1 }} />
          <Input label="Heure" type="time" value={f.heure} onChange={e => set("heure", e.target.value)} style={{ flex: 1 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <ACInput label="Chauffeur" value={f.chauffeur} onChange={v => set("chauffeur", v)} suggestions={savedChauffeurs} placeholder="Nom du chauffeur" icon="🧑‍✈️" />
          {f.chauffeur?.trim() && !chauffeurSaved && <button onClick={() => onSaveChauffeur(f.chauffeur.trim())} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 13, textAlign: "left", padding: 0 }}>💾 Mémoriser « {f.chauffeur.trim()} »</button>}
          {chauffeurSaved && f.chauffeur?.trim() && <div style={{ fontSize: 12, color: C.green }}>✓ Mémorisé</div>}
        </div>
        <Input label="Nom du client" value={f.client} onChange={e => set("client", e.target.value)} placeholder="Ex: M. Dupont" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Lbl>Catégorie véhicule</Lbl>
          <div style={{ display: "flex", gap: 8 }}>
            {VEHICULES.map(v => (
              <button key={v} onClick={() => set("vehicule", v)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${f.vehicule === v ? vColor(v) : C.border}`, background: f.vehicule === v ? `${vColor(v)}18` : C.surface, color: f.vehicule === v ? vColor(v) : C.muted, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                {v === "Classe E" ? "🚙" : "🚐"} {v}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Lbl>Type de prestation</Lbl>
          <div style={{ display: "flex", gap: 8 }}>
            {[["transfert","🚗 Transfert"],["mad","⏱ Mise à dispo"]].map(([val, lbl]) => (
              <button key={val} onClick={() => set("prestation", val)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${f.prestation === val ? C.gold : C.border}`, background: f.prestation === val ? `${C.gold}18` : C.surface, color: f.prestation === val ? C.gold : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{lbl}</button>
            ))}
          </div>
        </div>
        <ACInput label="Prise en charge" value={f.prise} onChange={v => set("prise", v)} suggestions={LIEUX} placeholder="Adresse ou lieu (CDG, ORY…)" />
        <ACInput label="Dépose" value={f.depose} onChange={v => set("depose", v)} suggestions={LIEUX} placeholder="Adresse ou lieu" />
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
            <div style={{ fontSize: 12, color: C.orange, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>💰 Tarif payé à {f.chauffeur}</div>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" id="priv" checked={f.isPrivate} onChange={e => { set("isPrivate", e.target.checked); if (e.target.checked) set("company", ""); }} />
          <label htmlFor="priv" style={{ color: C.text, fontSize: 14, cursor: "pointer" }}>Course privée – encaissement direct</label>
        </div>
        {!f.isPrivate && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <ACInput label="Société / Plateforme" value={f.company} onChange={v => set("company", v)} suggestions={savedCompanies.map(c => c.name)} placeholder="Nom de la société…" icon="🏢" />
            {f.company?.trim() && !companyOk && <button onClick={() => onSaveCompany(f.company.trim())} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 13, textAlign: "left", padding: 0 }}>💾 Mémoriser « {f.company.trim()} »</button>}
            {companyOk && <div style={{ fontSize: 12, color: C.green }}>✓ Société mémorisée</div>}
          </div>
        )}
        <Textarea label="Notes" value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Informations supplémentaires…" />
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
const defCompany = () => ({ id: uid(), name: "", adresse: "", email: "", tva: "", siren: "" });
function CompanyInfoModal({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial ? { ...initial } : defCompany());
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title={f.name || "Nouvelle société"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="Nom *" value={f.name} onChange={e => set("name", e.target.value)} placeholder="Nom de la société" />
        <Textarea label="Adresse" value={f.adresse} onChange={e => set("adresse", e.target.value)} placeholder="12 rue…, 75001 Paris" />
        <Input label="Email" type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="facturation@société.fr" />
        <Input label="N° TVA" value={f.tva} onChange={e => set("tva", e.target.value)} placeholder="FR00 000000000" />
        <Input label="SIREN" value={f.siren} onChange={e => set("siren", e.target.value)} placeholder="000 000 000" />
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

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
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

  const mk = monthKey(year, month);
  const savedChauffeurs = chauffeurObjects.map(c => c.name);

  // Chargement de la config (une seule fois)
  useEffect(() => {
    (async () => {
      const [companiesRes, chauffeursRes, recurringRes] = await Promise.all([
        supabase.from("companies").select("*").order("name"),
        supabase.from("chauffeurs").select("*").order("name"),
        supabase.from("recurring_frais").select("*").order("created_at"),
      ]);
      setSavedCompanies(companiesRes.data || []);
      const chData = chauffeursRes.data || [];
      setChauffeurObjects(chData);
      const def = chData.find(c => c.is_default);
      if (def) setDefaultChauffeur(def.name);
      setRecurringFrais((recurringRes.data || []).map(recurringFromDb));
    })();
  }, []);

  // Chargement des données du mois (rechargé à chaque changement de mois)
  useEffect(() => {
    setLoaded(false);
    (async () => {
      const [coursesRes, fraisRes, invoiceRes] = await Promise.all([
        supabase.from("courses").select("*").eq("month_key", mk).order("heure"),
        supabase.from("frais").select("*").eq("month_key", mk).order("date"),
        supabase.from("invoice_statuses").select("*").like("id", `${mk}:%`),
      ]);
      const dbCourses = (coursesRes.data || []).map(courseFromDb);
      const dbFrais = (fraisRes.data || []).map(fraisFromDb);
      dbCourses.sort((a, b) => (a.heure || "99:99").localeCompare(b.heure || "99:99") || a.date.localeCompare(b.date));
      dbFrais.sort((a, b) => a.date.localeCompare(b.date));
      setCourses(dbCourses);
      setFrais(dbFrais);
      const ivs = {};
      (invoiceRes.data || []).forEach(s => { ivs[s.id] = s.status; });
      setInvoiceStatuses(ivs);
      setLoaded(true);
    })();
  }, [mk]);

  // Application des frais récurrents après chargement du mois
  useEffect(() => {
    if (!loaded) return;
    applyRecurringToMonth(mk, year, month, recurringFrais);
  }, [loaded]);

  // Les données actives du mois sont directement courses / frais
  const mc = courses;
  const mf = frais;

  const totalCA = mc.reduce((s, c) => s + Number(c.total || 0), 0);
  const totalTips = mc.reduce((s, c) => s + Number(c.tips || 0), 0);
  const totalFrais = mf.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalCC = mc.reduce((s, c) => s + Number(c.chauffeurCost || 0), 0);
  const net = totalCA - totalFrais - totalCC;
  const byCompany = {};
  mc.filter(c => c.company && !c.isPrivate).forEach(c => { if (!byCompany[c.company]) byCompany[c.company] = { amount: 0, trips: [] }; byCompany[c.company].amount += Number(c.total || 0); byCompany[c.company].trips.push(c); });
  const privateCA = mc.filter(c => c.isPrivate).reduce((s, c) => s + Number(c.total || 0), 0);
  const byVehicle = {};
  mc.forEach(c => { const v = c.vehicule || "N/A"; if (!byVehicle[v]) byVehicle[v] = { trips: 0, ca: 0 }; byVehicle[v].trips++; byVehicle[v].ca += Number(c.total || 0); });
  const byChauffeur = {};
  mc.filter(c => c.chauffeur && c.chauffeur !== defaultChauffeur && Number(c.chauffeurCost) > 0).forEach(c => {
    if (!byChauffeur[c.chauffeur]) byChauffeur[c.chauffeur] = { trips: [], cost: 0, ca: 0 };
    byChauffeur[c.chauffeur].trips.push(c);
    byChauffeur[c.chauffeur].cost += Number(c.chauffeurCost || 0);
    byChauffeur[c.chauffeur].ca += Number(c.total || 0);
  });

  // ── Handlers Courses ────────────────────────────────────────────────────────
  const saveCourse = async (c) => {
    await supabase.from("courses").upsert(courseToDb(c, mk));
    setCourses(prev => {
      const list = [...prev];
      const idx = list.findIndex(x => x.id === c.id);
      if (idx >= 0) list[idx] = c; else list.push(c);
      list.sort((a, b) => (a.heure || "99:99").localeCompare(b.heure || "99:99") || a.date.localeCompare(b.date));
      return list;
    });
    setShowCourseModal(false); setEditCourse(null);
  };
  const deleteCourse = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    await supabase.from("courses").delete().eq("id", id);
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  // ── Handlers Frais ──────────────────────────────────────────────────────────
  const saveFrais = async (f) => {
    await supabase.from("frais").upsert(fraisToDb(f, mk));
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
    await supabase.from("frais").delete().eq("id", id);
    setFrais(prev => prev.filter(f => f.id !== id));
  };

  // ── Handlers Sociétés ───────────────────────────────────────────────────────
  const handleSaveCompany = async (nameOrObj) => {
    if (typeof nameOrObj === "string") {
      if (!savedCompanies.some(c => c.name.toLowerCase() === nameOrObj.toLowerCase())) {
        const company = { ...defCompany(), id: uid(), name: nameOrObj };
        await supabase.from("companies").upsert(company);
        setSavedCompanies(prev => [...prev, company]);
      }
    } else {
      await supabase.from("companies").upsert(nameOrObj);
      setSavedCompanies(prev => { const idx = prev.findIndex(c => c.id === nameOrObj.id); if (idx >= 0) { const l = [...prev]; l[idx] = nameOrObj; return l; } return [...prev, nameOrObj]; });
    }
    setEditCompany(null);
  };
  const deleteCompany = async (id) => {
    if (!window.confirm("Supprimer ?")) return;
    await supabase.from("companies").delete().eq("id", id);
    setSavedCompanies(prev => prev.filter(c => c.id !== id));
  };

  // ── Handlers Chauffeurs ─────────────────────────────────────────────────────
  const handleSaveChauffeur = async (name) => {
    if (!chauffeurObjects.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      const isFirst = chauffeurObjects.length === 0;
      const newCh = { id: uid(), name, is_default: isFirst };
      await supabase.from("chauffeurs").upsert(newCh);
      setChauffeurObjects(prev => [...prev, newCh]);
      if (isFirst) setDefaultChauffeur(name);
    }
  };
  const handleDeleteChauffeur = async (name) => {
    if (!window.confirm(`Supprimer ${name} ?`)) return;
    const ch = chauffeurObjects.find(c => c.name === name);
    if (ch) { await supabase.from("chauffeurs").delete().eq("id", ch.id); }
    setChauffeurObjects(prev => prev.filter(c => c.name !== name));
    if (defaultChauffeur === name) setDefaultChauffeur("");
  };
  const handleSetDefault = async (name) => {
    const updates = chauffeurObjects.map(c => ({ ...c, is_default: c.name === name }));
    await supabase.from("chauffeurs").upsert(updates);
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
      toAdd.forEach(f => supabase.from("frais").upsert(fraisToDb(f, targetMk)).then(() => {}));
      return [...prev, ...toAdd].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleSaveRecurring = async (list) => {
    const { data: existing } = await supabase.from("recurring_frais").select("id");
    const existingIds = (existing || []).map(r => r.id);
    const newIds = list.map(r => r.id);
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    if (toDelete.length > 0) await supabase.from("recurring_frais").delete().in("id", toDelete);
    if (list.length > 0) await supabase.from("recurring_frais").upsert(list.map(recurringToDb));
    setRecurringFrais(list);
    applyRecurringToMonth(mk, year, month, list);
    setShowRecurringModal(false);
  };

  const recurringCount = recurringFrais.filter(r => r.active).length;
  const monthRecurringTotal = recurringFrais.filter(r => r.active && r.amount).reduce((s, r) => s + Number(r.amount || 0), 0);

  // ── Statuts factures ────────────────────────────────────────────────────────
  const setInvoiceStatus = async (companyName, status) => {
    const key = `${mk}:${companyName}`;
    await supabase.from("invoice_statuses").upsert({ id: key, status, updated_at: new Date().toISOString() });
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

  const vColor = v => v === "Classe E" ? C.blue : v === "Classe V" ? C.purple : C.muted;
  const vIcon = v => v === "Classe E" ? "🚙" : v === "Classe V" ? "🚐" : "🚗";

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: C.text, maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 8px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.bg, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.goldDim, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Course Privée</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>Mes Comptes</div>
              {defaultChauffeur && <button onClick={() => setShowChauffeurSettings(true)} style={{ background: `${C.gold}18`, border: `1px solid ${C.gold}44`, borderRadius: 20, padding: "3px 10px", fontSize: 12, color: C.gold, fontWeight: 600, cursor: "pointer" }}>🧑‍✈️ {defaultChauffeur}</button>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={prevMonth} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>‹</button>
            <button onClick={() => setShowMonthPicker(true)} style={{ background: `${C.gold}18`, border: `1px solid ${C.gold}55`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", minWidth: 90, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.goldDim, fontWeight: 700 }}>{year}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, textTransform: "capitalize" }}>{MOIS[month].slice(0, 4)}.</div>
            </button>
            <button onClick={nextMonth} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>›</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {[["dashboard","📊 Résumé"],["courses","🚗 Courses"],["chauffeurs","🧑‍✈️ Chauffeurs"],["frais","💸 Frais"],["societes","🏢 Sociétés"]].map(([id, lbl]) => (
            <Pill key={id} label={lbl} active={tab === id} onClick={() => setTab(id)} />
          ))}
        </div>
      </div>

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
                  <Btn small onClick={exportPDF} style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}` }}>📄 PDF</Btn>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Stat label="CA Brut" value={fmt(totalCA)} color={C.gold} sub={`${mc.length} course${mc.length > 1 ? "s" : ""}`} />
                  <Stat label="Pourboires" value={fmt(totalTips)} color={C.green} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Stat label="Frais" value={fmt(totalFrais)} color={C.red} />
                  <Stat label="Chauffeurs" value={fmt(totalCC)} color={C.orange} />
                </div>
                <Card style={{ borderColor: net >= 0 ? `${C.green}44` : `${C.red}44` }}>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Net (CA − Frais − Chauffeurs)</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: net >= 0 ? C.green : C.red, fontFamily: "monospace" }}>{fmt(net)}</div>
                </Card>
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
                  <div><span style={{ fontWeight: 700 }}>{mc.length} course{mc.length > 1 ? "s" : ""}</span><span style={{ color: C.gold, fontWeight: 700, fontFamily: "monospace", marginLeft: 8 }}>{fmt(totalCA)}</span></div>
                  <Btn onClick={() => setShowCourseModal(true)} small>+ Course</Btn>
                </div>
                {mc.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.muted }}><div style={{ fontSize: 40 }}>🚕</div><div style={{ marginTop: 8 }}>Aucune course ce mois</div></div>}
                {mc.map(c => {
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
                          <div style={{ fontSize: 18, fontWeight: 700, color: C.gold, fontFamily: "monospace" }}>{fmt(c.total)}</div>
                          <div style={{ display: "flex", gap: 6 }}><Btn small variant="ghost" onClick={() => setEditCourse(c)}>✏️</Btn><Btn small variant="danger" onClick={() => deleteCourse(c.id)}>🗑</Btn></div>
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
                          : <Btn small variant="ghost" onClick={() => setEditCompany({ ...defCompany(), id: uid(), name })} style={{ color: C.blue }}>+ Infos de facturation</Btn>}
                      </div>
                    </Card>
                  );
                })}
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Sociétés mémorisées ({savedCompanies.length})</div>
                    <Btn small onClick={() => setEditCompany({ ...defCompany(), id: uid() })}>+ Ajouter</Btn>
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
