import { useFetch } from '../hooks.js';
import { ErrorBox, Loading, PageHead, Stat } from '../components/ui.jsx';
import { fmtDateTime, fmtDuree, fmtNombre } from '../format.js';

export default function HistoriqueChauffeur() {
  const { data, error, loading } = useFetch('/demandes?statut=terminee');
  const rows = data || [];
  const since7 = Date.now() - 7 * 86400000;
  const last7 = rows.filter((d) => new Date(d.debut_course).getTime() >= since7);
  const sum = (list, k) => list.reduce((s, d) => s + (Number(d[k]) || 0), 0);

  return (
    <>
      <PageHead title="Mon historique" subtitle="Toutes vos courses terminées" />
      <div className="stats">
        <Stat label="Courses (7 derniers jours)" value={last7.length} sub={`${fmtDuree(sum(last7, 'duree_minutes'))} de conduite`} />
        <Stat label="Total des courses" value={rows.length} sub={`${fmtDuree(sum(rows, 'duree_minutes'))} au total`} />
        <Stat label="Kilomètres parcourus" value={fmtNombre(sum(rows, 'km_parcourus'))} />
      </div>
      <ErrorBox error={error} />
      {loading ? <Loading /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Réf.</th><th>Trajet</th><th>Véhicule</th><th>Début</th><th>Fin</th><th className="num">Durée</th><th className="num">Km</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="strong">{d.reference}</td>
                  <td>{d.lieu_depart} → {d.destination}<div className="small">{d.agent_nom}</div></td>
                  <td>{d.vehicule_immatriculation}</td>
                  <td>{fmtDateTime(d.debut_course)}</td>
                  <td>{fmtDateTime(d.fin_course)}</td>
                  <td className="num">{fmtDuree(d.duree_minutes)}</td>
                  <td className="num">{fmtNombre(d.km_parcourus)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="empty">Aucune course terminée</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
