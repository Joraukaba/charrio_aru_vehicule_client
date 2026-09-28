// Espace agent : suivi de ses demandes
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useFetch } from '../hooks.js';
import DemandeDetail from '../components/DemandeDetail.jsx';
import { ErrorBox, Loading, Modal, PageHead, StatutBadge } from '../components/ui.jsx';
import { fmtDateTime, STATUTS } from '../format.js';

export default function MesDemandes() {
  const { data, error, loading, reload } = useFetch('/demandes', { refreshMs: 30000 });
  const [tab, setTab] = useState('');
  const [detail, setDetail] = useState(null);
  const location = useLocation();
  const nav = useNavigate();
  const msg = location.state?.msg;

  const rows = (data || []).filter((d) => !tab || d.statut === tab);

  const annuler = async (d) => {
    if (!window.confirm(`Annuler la demande ${d.reference} ?`)) return;
    try {
      await api.post(`/demandes/${d.id}/annuler`);
      setDetail(null);
      reload();
    } catch (e) {
      window.alert(e.message);
    }
  };

  return (
    <>
      <PageHead title="Mes demandes de déplacement" subtitle="Suivez l’état de vos demandes">
        <Link className="btn primary" to="/nouvelle-demande">+ Nouvelle demande</Link>
      </PageHead>
      {msg && <div className="success-msg">{msg}</div>}
      <div className="tabs">
        <button className={!tab ? 'active' : ''} onClick={() => setTab('')}>Toutes</button>
        {Object.entries(STATUTS).map(([k, v]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{v.label}</button>
        ))}
      </div>
      <ErrorBox error={error} />
      {loading ? <Loading /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Référence</th><th>Motif</th><th>Trajet</th><th>Départ prévu</th><th>Véhicule / Chauffeur</th><th>Statut</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="strong">{d.reference}</td>
                  <td>{d.motif}</td>
                  <td>{d.lieu_depart} → {d.destination}</td>
                  <td>{fmtDateTime(d.date_depart_prevue)}</td>
                  <td>{d.vehicule_immatriculation || '—'}<div className="small">{d.chauffeur_nom}</div></td>
                  <td>
                    <StatutBadge statut={d.statut} />
                    {d.commentaire_admin && ['rejetee', 'en_attente'].includes(d.statut) && <div className="small">{d.commentaire_admin}</div>}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn sm" onClick={() => setDetail(d)}>Détails</button>
                      {['soumise', 'en_attente'].includes(d.statut) && (
                        <button className="btn sm" onClick={() => nav(`/demandes/${d.id}/modifier`)}>Modifier</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="empty">Aucune demande</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {detail && (
        <Modal
          title={`Demande ${detail.reference}`}
          onClose={() => setDetail(null)}
          footer={['soumise', 'en_attente', 'validee'].includes(detail.statut) && (
            <button className="btn danger" onClick={() => annuler(detail)}>Annuler cette demande</button>
          )}
        >
          <DemandeDetail d={detail} />
        </Modal>
      )}
    </>
  );
}
