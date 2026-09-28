import { fmtDateTime, fmtDuree, fmtNombre } from '../format.js';
import { StatutBadge } from './ui.jsx';

export default function DemandeDetail({ d }) {
  return (
    <dl className="dl">
      <dt>Référence</dt><dd><strong>{d.reference}</strong> <StatutBadge statut={d.statut} /></dd>
      <dt>Demandeur</dt><dd>{d.agent_nom}{d.agent_service ? ` — ${d.agent_service}` : ''}</dd>
      <dt>Motif</dt><dd>{d.motif}</dd>
      <dt>Itinéraire</dt><dd>{d.lieu_depart} → <strong>{d.destination}</strong>{d.itineraire_nom ? <span className="small"> ({d.itineraire_nom})</span> : null}</dd>
      <dt>Départ prévu</dt><dd>{fmtDateTime(d.date_depart_prevue)}</dd>
      <dt>Retour prévu</dt><dd>{fmtDateTime(d.date_retour_prevue)}</dd>
      <dt>Passagers</dt><dd>{d.nb_passagers}</dd>
      <dt>Véhicule</dt><dd>{d.vehicule_immatriculation ? `${d.vehicule_immatriculation} — ${d.vehicule_marque} ${d.vehicule_modele || ''}` : '—'}</dd>
      <dt>Chauffeur</dt><dd>{d.chauffeur_nom ? `${d.chauffeur_nom}${d.chauffeur_telephone ? ` (${d.chauffeur_telephone})` : ''}` : '—'}</dd>
      {d.commentaire_admin && (<><dt>Commentaire admin</dt><dd>{d.commentaire_admin}</dd></>)}
      {d.traite_par_nom && (<><dt>Traité par</dt><dd>{d.traite_par_nom} le {fmtDateTime(d.traite_le)}</dd></>)}
      {d.debut_course && (<><dt>Début course</dt><dd>{fmtDateTime(d.debut_course)}</dd></>)}
      {d.fin_course && (<><dt>Fin course</dt><dd>{fmtDateTime(d.fin_course)}</dd></>)}
      {d.debut_course && (<><dt>Durée</dt><dd><strong>{fmtDuree(d.duree_minutes)}</strong></dd></>)}
      {d.km_depart != null && (<><dt>Kilométrage</dt><dd>{fmtNombre(d.km_depart)} → {fmtNombre(d.km_retour)} {d.km_parcourus != null && <strong>({fmtNombre(d.km_parcourus)} km)</strong>}</dd></>)}
      {d.observations_chauffeur && (<><dt>Observations</dt><dd>{d.observations_chauffeur}</dd></>)}
    </dl>
  );
}
