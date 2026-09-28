// Formats et libellés

export const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const fmtDate = (v) => {
  if (!v) return '—';
  // "AAAA-MM-JJ" : date locale (évite le décalage de fuseau horaire)
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR');
  }
  return new Date(v).toLocaleDateString('fr-FR');
};

export const fmtHeure = (v) => (v ? new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—');

export function fmtDuree(min) {
  if (min === null || min === undefined || Number.isNaN(Number(min))) return '—';
  const m = Math.max(0, Math.round(Number(min)));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h >= 24) return `${Math.floor(h / 24)} j ${h % 24} h`;
  return h ? `${h} h ${String(r).padStart(2, '0')}` : `${r} min`;
}

export const fmtNombre = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('fr-FR'));

// Valeur pour <input type="datetime-local">
export function toLocalInput(v) {
  if (!v) return '';
  const d = new Date(v);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const toISO = (local) => (local ? new Date(local).toISOString() : null);

export const isoDay = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const STATUTS = {
  soumise: { label: 'Nouvelle', cls: 'info' },
  en_attente: { label: 'En attente', cls: 'warn' },
  validee: { label: 'Validée', cls: 'ok' },
  rejetee: { label: 'Rejetée', cls: 'danger' },
  en_cours: { label: 'En cours', cls: 'live' },
  terminee: { label: 'Terminée', cls: 'muted' },
  annulee: { label: 'Annulée', cls: 'muted' },
};

export const ETATS_VEHICULE = {
  bon: { label: 'Bon état', cls: 'ok' },
  moyen: { label: 'État moyen', cls: 'warn' },
  en_panne: { label: 'En panne', cls: 'danger' },
  en_maintenance: { label: 'En maintenance', cls: 'danger' },
};

export const DISPO_VEHICULE = {
  disponible: { label: 'Disponible', cls: 'ok' },
  en_mission: { label: 'En mission', cls: 'live' },
  indisponible: { label: 'Indisponible', cls: 'danger' },
};

export const ETATS_CHAUFFEUR = {
  disponible: { label: 'Disponible', cls: 'ok' },
  en_course: { label: 'En course', cls: 'live' },
  actif: { label: 'Actif', cls: 'ok' },
  repos: { label: 'En repos', cls: 'warn' },
  conge: { label: 'En congé', cls: 'muted' },
  indisponible: { label: 'Indisponible', cls: 'danger' },
};

export const ROLES = { admin: 'Administrateur', agent: 'Agent', chauffeur: 'Chauffeur' };

// Export CSV (ouvrable dans Excel)
export function exportCSV(filename, columns, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => esc(c.label)).join(';')];
  for (const r of rows) lines.push(columns.map((c) => esc(c.csv ? c.csv(r) : r[c.key])).join(';'));
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
