import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFetch } from '../hooks.js';
import DecisionModal from '../components/DecisionModal.jsx';
import { ErrorBox, Loading, PageHead, StatutBadge } from '../components/ui.jsx';
import { fmtDateTime } from '../format.js';

const TABS = [
  { v: 'soumise,en_attente', l: 'À traiter' },
  { v: 'validee', l: 'Validées' },
  { v: 'en_cours', l: 'En cours' },
  { v: 'terminee', l: 'Terminées' },
  { v: 'rejetee,annulee', l: 'Rejetées / annulées' },
  { v: '', l: 'Toutes' },
];

export default function DemandesAdmin() {
  const [tab, setTab] = useState('soumise,en_attente');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState(null);
  const location = useLocation();
  const params = new URLSearchParams();
  if (tab) params.set('statut', tab);
  if (search) params.set('q', search);
  const { data, error, loading, reload } = useFetch(`/demandes?${params}`, { refreshMs: 30000 });

  return (
    <>
      <PageHead title="Demandes de déplacement" subtitle="Validez, mettez en attente ou rejetez les demandes des agents">
        <Link className="btn primary" to="/nouvelle-demande">+ Nouvelle demande</Link>
      </PageHead>
      {location.state?.msg && <div className="success-msg">{location.state.msg}</div>}
      <div className="tabs">
        {TABS.map((t) => <button key={t.l} className={tab === t.v ? 'active' : ''} onClick={() => setTab(t.v)}>{t.l}</button>)}
      </div>
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setSearch(q); }}>
        <input placeholder="Référence, agent, chauffeur, destination, plaque…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 280 }} />
        <button className="btn">Rechercher</button>
        {search && <button type="button" className="btn ghost" onClick={() => { setQ(''); setSearch(''); }}>Effacer</button>}
      </form>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Réf.</th><th>Demandeur</th><th>Motif</th><th>Trajet</th><th>Période prévue</th><th>Véhicule</th><th>Chauffeur</th><th>Statut</th><th /></tr>
            </thead>
            <tbody>
              {(data || []).map((d) => (
                <tr key={d.id}>
                  <td className="strong">{d.reference}<div className="small">{fmtDateTime(d.created_at)}</div></td>
                  <td>{d.agent_nom}<div className="small">{d.agent_service}</div></td>
                  <td style={{ maxWidth: 220 }}>{d.motif}</td>
                  <td>{d.lieu_depart} → <strong>{d.destination}</strong><div className="small">{d.nb_passagers} passager(s)</div></td>
                  <td>{fmtDateTime(d.date_depart_prevue)}<div className="small">→ {fmtDateTime(d.date_retour_prevue)}</div></td>
                  <td>{d.vehicule_immatriculation || <span className="small">—</span>}</td>
                  <td>{d.chauffeur_nom || <span className="small">—</span>}</td>
                  <td><StatutBadge statut={d.statut} /></td>
                  <td>
                    <button className={`btn sm ${['soumise', 'en_attente'].includes(d.statut) ? 'primary' : ''}`} onClick={() => setSel(d)}>
                      {['soumise', 'en_attente'].includes(d.statut) ? 'Traiter' : 'Voir'}
                    </button>
                  </td>
                </tr>
              ))}
              {!data?.length && <tr><td colSpan={9} className="empty">Aucune demande</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {sel && <DecisionModal demande={sel} onClose={() => setSel(null)} onDone={() => { setSel(null); reload(); }} />}
    </>
  );
}
