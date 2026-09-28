// Historique complet des courses avec filtres et export Excel (CSV)
import { useState } from 'react';
import { useFetch } from '../hooks.js';
import DecisionModal from '../components/DecisionModal.jsx';
import { ErrorBox, Loading, PageHead, StatutBadge } from '../components/ui.jsx';
import { exportCSV, fmtDateTime, fmtDuree, fmtNombre, isoDay } from '../format.js';

const COLS = [
  { label: 'Référence', key: 'reference' },
  { label: 'Statut', key: 'statut' },
  { label: 'Agent', key: 'agent_nom' },
  { label: 'Motif', key: 'motif' },
  { label: 'Départ', key: 'lieu_depart' },
  { label: 'Destination', key: 'destination' },
  { label: 'Véhicule', key: 'vehicule_immatriculation' },
  { label: 'Chauffeur', key: 'chauffeur_nom' },
  { label: 'Début course', csv: (r) => fmtDateTime(r.debut_course) },
  { label: 'Fin course', csv: (r) => fmtDateTime(r.fin_course) },
  { label: 'Durée (min)', key: 'duree_minutes' },
  { label: 'Km départ', key: 'km_depart' },
  { label: 'Km retour', key: 'km_retour' },
  { label: 'Km parcourus', key: 'km_parcourus' },
  { label: 'Observations', key: 'observations_chauffeur' },
];

export default function Courses() {
  const d0 = new Date();
  const [f, setF] = useState({ du: isoDay(new Date(d0.getFullYear(), d0.getMonth(), 1)), au: isoDay(d0), chauffeur: '', vehicule: '' });
  const [sel, setSel] = useState(null);
  const { data: chauffeurs } = useFetch('/users?role=chauffeur');
  const { data: vehicules } = useFetch('/vehicules');
  const params = new URLSearchParams({ statut: 'en_cours,terminee', limit: '2000' });
  Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
  const { data, error, loading, reload } = useFetch(`/demandes?${params}`);
  const rows = data || [];
  const totalMin = rows.reduce((s, r) => s + (Number(r.duree_minutes) || 0), 0);
  const totalKm = rows.reduce((s, r) => s + (Number(r.km_parcourus) || 0), 0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <PageHead title="Historique des courses" subtitle="Toutes les courses avec heures réelles de départ et de retour">
        <button className="btn" onClick={() => exportCSV(`courses_${f.du}_${f.au}.csv`, COLS, rows)} disabled={!rows.length}>⬇ Exporter (Excel)</button>
      </PageHead>
      <div className="toolbar">
        <label className="small">Du</label><input type="date" value={f.du} onChange={set('du')} />
        <label className="small">au</label><input type="date" value={f.au} onChange={set('au')} />
        <select value={f.chauffeur} onChange={set('chauffeur')}>
          <option value="">Tous les chauffeurs</option>
          {chauffeurs?.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={f.vehicule} onChange={set('vehicule')}>
          <option value="">Tous les véhicules</option>
          {vehicules?.map((v) => <option key={v.id} value={v.id}>{v.immatriculation}</option>)}
        </select>
      </div>
      <p className="small"><strong>{rows.length}</strong> course(s) · durée totale <strong>{fmtDuree(totalMin)}</strong> · <strong>{fmtNombre(totalKm)}</strong> km</p>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Réf.</th><th>Trajet</th><th>Agent</th><th>Véhicule</th><th>Chauffeur</th><th>Début</th><th>Fin</th><th className="num">Durée</th><th className="num">Km</th><th>Statut</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => setSel(r)} style={{ cursor: 'pointer' }}>
                  <td className="strong">{r.reference}</td>
                  <td>{r.lieu_depart} → {r.destination}</td>
                  <td>{r.agent_nom}</td>
                  <td>{r.vehicule_immatriculation}</td>
                  <td>{r.chauffeur_nom}</td>
                  <td>{fmtDateTime(r.debut_course)}</td>
                  <td>{fmtDateTime(r.fin_course)}</td>
                  <td className="num">{fmtDuree(r.duree_minutes)}</td>
                  <td className="num">{fmtNombre(r.km_parcourus)}</td>
                  <td><StatutBadge statut={r.statut} /></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={10} className="empty">Aucune course sur cette période</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {sel && <DecisionModal demande={sel} onClose={() => setSel(null)} onDone={() => { setSel(null); reload(); }} />}
    </>
  );
}
