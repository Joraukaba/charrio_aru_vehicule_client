// Traitement d'une demande par l'admin : voir disponibilités, affecter véhicule + chauffeur, décider
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useFetch } from '../hooks.js';
import DemandeDetail from './DemandeDetail.jsx';
import { ErrorBox, Modal } from './ui.jsx';

export default function DecisionModal({ demande, onClose, onDone }) {
  const d = demande;
  const decidable = ['soumise', 'en_attente', 'validee'].includes(d.statut);
  const { data: dispo, loading } = useFetch(
    decidable ? `/disponibilites?debut=${encodeURIComponent(d.date_depart_prevue)}&fin=${encodeURIComponent(d.date_retour_prevue)}&demande=${d.id}` : null
  );
  const [vehiculeId, setVehiculeId] = useState(d.vehicule_id || '');
  const [chauffeurId, setChauffeurId] = useState(d.chauffeur_id || '');
  const [commentaire, setCommentaire] = useState(d.commentaire_admin || '');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Si le véhicule demandé n'est pas libre, on ne le présélectionne pas
  useEffect(() => {
    if (!dispo) return;
    const v = dispo.vehicules.find((x) => x.id === Number(vehiculeId));
    if (v && !v.disponible) setVehiculeId('');
    const c = dispo.chauffeurs.find((x) => x.id === Number(chauffeurId));
    if (c && !c.disponible) setChauffeurId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispo]);

  const act = async (type) => {
    setBusy(true);
    setError(null);
    try {
      if (type === 'valider') await api.post(`/demandes/${d.id}/valider`, { vehicule_id: vehiculeId, chauffeur_id: chauffeurId, commentaire });
      if (type === 'attente') await api.post(`/demandes/${d.id}/attente`, { commentaire });
      if (type === 'rejeter') {
        if (!commentaire.trim()) throw new Error('Indiquez le motif du rejet dans le commentaire');
        await api.post(`/demandes/${d.id}/rejeter`, { commentaire });
      }
      if (type === 'debut') await api.post(`/demandes/${d.id}/debut`, {});
      if (type === 'fin') await api.post(`/demandes/${d.id}/fin`, {});
      if (type === 'annuler') await api.post(`/demandes/${d.id}/annuler`);
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const footer = decidable ? (
    <>
      {d.statut === 'validee' && <button className="btn" onClick={() => act('debut')} disabled={busy} title="Si le chauffeur ne peut pas le faire lui-même">▶ Démarrer (pour le chauffeur)</button>}
      <button className="btn danger" onClick={() => act('rejeter')} disabled={busy}>Rejeter</button>
      <button className="btn warn" onClick={() => act('attente')} disabled={busy}>Mettre en attente</button>
      <button className="btn success" onClick={() => act('valider')} disabled={busy || !vehiculeId || !chauffeurId}>
        {d.statut === 'validee' ? 'Réaffecter' : 'Valider'}
      </button>
    </>
  ) : d.statut === 'en_cours' ? (
    <button className="btn danger" onClick={() => act('fin')} disabled={busy}>🏁 Terminer (pour le chauffeur)</button>
  ) : null;

  return (
    <Modal title={`Demande ${d.reference}`} onClose={onClose} footer={footer} wide>
      <ErrorBox error={error} />
      <div className="grid grid-2">
        <div><DemandeDetail d={d} /></div>
        {decidable && (
          <div>
            {loading || !dispo ? <div className="small">Vérification des disponibilités…</div> : (
              <>
                <h3>Véhicule {d.vehicule_id ? <span className="small">(demandé : {d.vehicule_immatriculation})</span> : null}</h3>
                <div className="pick-list" style={{ marginBottom: 14 }}>
                  {dispo.vehicules.map((v) => (
                    <label key={v.id} className={`pick ${!v.disponible ? 'disabled' : ''} ${Number(vehiculeId) === v.id ? 'selected' : ''}`}>
                      <input type="radio" name="veh" disabled={!v.disponible} checked={Number(vehiculeId) === v.id} onChange={() => setVehiculeId(v.id)} />
                      <span className="grow"><strong>{v.immatriculation}</strong> — {v.marque} {v.modele} <span className="small">({v.places} pl.)</span>
                        {v.places < d.nb_passagers && <span className="badge warn" style={{ marginLeft: 6 }}>places insuffisantes</span>}
                      </span>
                      {v.disponible ? <span className="badge ok">Libre</span> : <span className="badge danger">{v.raison}</span>}
                    </label>
                  ))}
                </div>
                <h3>Chauffeur</h3>
                <div className="pick-list" style={{ marginBottom: 14 }}>
                  {dispo.chauffeurs.map((c) => (
                    <label key={c.id} className={`pick ${!c.disponible ? 'disabled' : ''} ${Number(chauffeurId) === c.id ? 'selected' : ''}`}>
                      <input type="radio" name="ch" disabled={!c.disponible} checked={Number(chauffeurId) === c.id} onChange={() => setChauffeurId(c.id)} />
                      <span className="grow"><strong>{c.nom}</strong> <span className="small">· {c.courses_7j} course(s) sur 7 j</span></span>
                      {c.disponible ? <span className="badge ok">Libre</span> : <span className="badge danger">{c.raison}</span>}
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="field">
              <label>Commentaire / consigne (obligatoire pour un rejet)</label>
              <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
