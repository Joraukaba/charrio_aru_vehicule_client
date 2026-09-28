import { Link } from 'react-router-dom';
import { useFetch, useNow } from '../hooks.js';
import { ErrorBox, Loading, PageHead, Stat } from '../components/ui.jsx';
import { fmtDateTime, fmtDuree, fmtHeure } from '../format.js';

export default function Dashboard() {
  const { data, error, loading } = useFetch('/dashboard', { refreshMs: 20000 });
  const now = useNow(30000);
  if (loading && !data) return <Loading />;
  if (!data) return <ErrorBox error={error} />;
  const { vehicules: v, chauffeurs: c, demandes: d } = data;
  const aTraiter = d.soumises + d.en_attente;

  return (
    <>
      <PageHead title="Tableau de bord" subtitle={`Situation en direct — ${new Date(now).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`}>
        {aTraiter > 0 && <Link className="btn primary" to="/demandes">Traiter {aTraiter} demande(s)</Link>}
      </PageHead>
      <ErrorBox error={error} />
      <div className="stats">
        <Stat label="Véhicules disponibles" value={`${v.disponibles} / ${v.total}`} sub={`${v.en_mission} en mission · ${v.indisponibles} en panne/maintenance`} />
        <Stat label="Chauffeurs disponibles" value={`${c.disponibles} / ${c.total}`} sub={`${c.en_course} en course · ${c.indisponibles} repos/congé`} />
        <Stat label="Demandes à traiter" value={aTraiter} sub={`${d.soumises} nouvelle(s) · ${d.en_attente} en attente`} alert={aTraiter > 0} />
        <Stat label="Courses planifiées" value={d.validees} sub="validées, pas encore parties" />
        <Stat label="Courses aujourd’hui" value={d.courses_aujourdhui} sub={`${d.terminees_aujourdhui} terminée(s)`} />
        <Stat label="Retours en retard" value={data.retards} sub="courses dépassant l’heure prévue" alert={data.retards > 0} />
      </div>

      <div className="card">
        <h2>🛰️ Véhicules en mouvement ({data.en_mouvement.length})</h2>
        {data.en_mouvement.length === 0 ? <div className="empty">Aucun véhicule en course actuellement.</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Véhicule</th><th>Chauffeur</th><th>Occupé par</th><th>Destination</th><th>Parti à</th><th>Durée écoulée</th><th>Retour prévu</th></tr></thead>
              <tbody>
                {data.en_mouvement.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.immatriculation}</strong><div className="small">{m.marque} {m.modele}</div></td>
                    <td>{m.chauffeur_nom}<div className="small">{m.chauffeur_telephone}</div></td>
                    <td>{m.agent_nom}<div className="small">{m.motif}</div></td>
                    <td>{m.lieu_depart} → <strong>{m.destination}</strong></td>
                    <td>{fmtHeure(m.debut_course)}<div className="small">{fmtDateTime(m.debut_course)}</div></td>
                    <td><span className="badge live">{fmtDuree((now - new Date(m.debut_course)) / 60000)}</span></td>
                    <td className={m.en_retard ? 'late' : ''}>{fmtDateTime(m.date_retour_prevue)}{m.en_retard && <div>⚠ En retard</div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>📅 Prochaines missions validées</h2>
        {data.a_venir.length === 0 ? <div className="empty">Aucune mission planifiée.</div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Réf.</th><th>Départ prévu</th><th>Destination</th><th>Agent</th><th>Véhicule</th><th>Chauffeur</th></tr></thead>
              <tbody>
                {data.a_venir.map((m) => (
                  <tr key={m.id}>
                    <td className="strong">{m.reference}</td>
                    <td>{fmtDateTime(m.date_depart_prevue)}</td>
                    <td>{m.destination}</td>
                    <td>{m.agent_nom}</td>
                    <td>{m.immatriculation}</td>
                    <td>{m.chauffeur_nom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
