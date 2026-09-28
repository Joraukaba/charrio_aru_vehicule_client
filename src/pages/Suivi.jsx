// Suivi en temps réel : où sont les véhicules et les chauffeurs
import { useFetch, useNow } from '../hooks.js';
import { Badge, ErrorBox, Loading, PageHead } from '../components/ui.jsx';
import { DISPO_VEHICULE, ETATS_CHAUFFEUR, ETATS_VEHICULE, fmtDateTime, fmtDuree, fmtHeure, fmtNombre } from '../format.js';

export default function Suivi() {
  const veh = useFetch('/vehicules?actifs=1', { refreshMs: 20000 });
  const ch = useFetch('/users/chauffeurs/etat', { refreshMs: 20000 });
  const now = useNow(30000);

  return (
    <>
      <PageHead title="Suivi en temps réel" subtitle="Actualisation automatique toutes les 20 secondes" />
      <div className="card">
        <h2>🚙 Véhicules</h2>
        <ErrorBox error={veh.error} />
        {!veh.data ? <Loading /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Véhicule</th><th>État</th><th>Disponibilité</th><th>Chauffeur</th><th>Occupé par</th><th>Destination</th><th>Depuis</th><th className="num">Km</th></tr></thead>
              <tbody>
                {veh.data.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.immatriculation}</strong><div className="small">{v.marque} {v.modele}</div></td>
                    <td><Badge map={ETATS_VEHICULE} value={v.etat} /></td>
                    <td><Badge map={DISPO_VEHICULE} value={v.disponibilite} />{v.missions_a_venir > 0 && <div className="small">{v.missions_a_venir} planifiée(s)</div>}</td>
                    <td>{v.course_chauffeur || '—'}</td>
                    <td>{v.course_agent || '—'}</td>
                    <td>{v.course_destination || '—'}</td>
                    <td>{v.course_debut ? <>{fmtHeure(v.course_debut)}<div className="small">{fmtDuree((now - new Date(v.course_debut)) / 60000)}</div></> : '—'}</td>
                    <td className="num">{fmtNombre(v.kilometrage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>🧑‍✈️ Chauffeurs</h2>
        <ErrorBox error={ch.error} />
        {!ch.data ? <Loading /> : (
          <>
            <p className="small">
              Alerte repos si plus de {ch.data.seuils.courses_7j} courses ou {ch.data.seuils.heures_7j} h de conduite sur 7 jours
              (modifiable dans le fichier de configuration).
            </p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Chauffeur</th><th>État</th><th>Course actuelle</th><th>Prochaine mission</th><th className="num">Courses 7 j</th><th className="num">Conduite 7 j</th><th>Repos</th></tr></thead>
                <tbody>
                  {ch.data.chauffeurs.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.nom}</strong><div className="small">{c.telephone}</div></td>
                      <td><Badge map={ETATS_CHAUFFEUR} value={c.etat} /></td>
                      <td>{c.course_id ? <>{c.course_vehicule} → {c.course_destination}<div className="small">depuis {fmtHeure(c.course_debut)}</div></> : '—'}</td>
                      <td>{c.prochaine_mission ? <>{fmtDateTime(c.prochaine_mission)}<div className="small">{c.prochaine_destination}</div></> : '—'}</td>
                      <td className="num">{c.courses_7j}</td>
                      <td className="num">{fmtDuree(c.minutes_7j)}</td>
                      <td>{c.alerte_repos ? <span className="badge warn">Repos conseillé</span> : <span className="badge ok">OK</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
