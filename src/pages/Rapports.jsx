// Rapports : activité par chauffeur, véhicule, agent, destination, journal complet
import { useState } from 'react';
import { useFetch } from '../hooks.js';
import { Badge, ErrorBox, Loading, PageHead, Stat } from '../components/ui.jsx';
import { ETATS_CHAUFFEUR, STATUTS, exportCSV, fmtDate, fmtDateTime, fmtDuree, fmtNombre, isoDay } from '../format.js';

function presets() {
  const t = new Date();
  const y = t.getFullYear();
  const m = t.getMonth();
  return [
    { l: '7 derniers jours', du: isoDay(new Date(t.getTime() - 6 * 86400000)), au: isoDay(t) },
    { l: 'Ce mois', du: isoDay(new Date(y, m, 1)), au: isoDay(t) },
    { l: 'Mois dernier', du: isoDay(new Date(y, m - 1, 1)), au: isoDay(new Date(y, m, 0)) },
    { l: 'Cette année', du: isoDay(new Date(y, 0, 1)), au: isoDay(t) },
  ];
}

const Bar = ({ value, max }) => (
  <div className="bar"><span style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div>
);

export default function Rapports() {
  const P = presets();
  const [periode, setPeriode] = useState({ du: P[1].du, au: P[1].au });
  const { data, error, loading } = useFetch(`/rapports?du=${periode.du}&au=${periode.au}`);

  const exportJournal = () =>
    exportCSV(`journal_courses_${periode.du}_${periode.au}.csv`, [
      { label: 'Référence', key: 'reference' }, { label: 'Agent', key: 'agent_nom' }, { label: 'Service', key: 'agent_service' },
      { label: 'Motif', key: 'motif' }, { label: 'Départ', key: 'lieu_depart' }, { label: 'Destination', key: 'destination' },
      { label: 'Véhicule', key: 'immatriculation' }, { label: 'Chauffeur', key: 'chauffeur_nom' },
      { label: 'Début', csv: (r) => fmtDateTime(r.debut_course) }, { label: 'Fin', csv: (r) => fmtDateTime(r.fin_course) },
      { label: 'Durée (min)', key: 'duree_minutes' }, { label: 'Km parcourus', key: 'km_parcourus' },
      { label: 'Observations', key: 'observations_chauffeur' },
    ], data.journal);

  const exportChauffeurs = () =>
    exportCSV(`rapport_chauffeurs_${periode.du}_${periode.au}.csv`, [
      { label: 'Chauffeur', key: 'nom' }, { label: 'Courses (période)', key: 'nb_courses' },
      { label: 'Durée totale (min)', key: 'duree_totale_min' }, { label: 'Km', key: 'km_total' },
      { label: 'Courses 7 j', key: 'courses_7j' }, { label: 'Conduite 7 j (min)', key: 'minutes_7j' },
      { label: 'Repos conseillé', csv: (r) => (r.alerte_repos ? 'Oui' : 'Non') },
    ], data.par_chauffeur);

  const exportVehicules = () =>
    exportCSV(`rapport_vehicules_${periode.du}_${periode.au}.csv`, [
      { label: 'Immatriculation', key: 'immatriculation' }, { label: 'Marque', key: 'marque' }, { label: 'Modèle', key: 'modele' },
      { label: 'Courses', key: 'nb_courses' }, { label: 'Durée totale (min)', key: 'duree_totale_min' }, { label: 'Km', key: 'km_total' },
    ], data.par_vehicule);

  return (
    <>
      <PageHead title="Rapports" subtitle={`Période du ${fmtDate(periode.du)} au ${fmtDate(periode.au)}`}>
        <button className="btn" onClick={() => window.print()}>🖨 Imprimer</button>
      </PageHead>
      <div className="toolbar">
        {P.map((p) => (
          <button key={p.l} className={`btn sm ${periode.du === p.du && periode.au === p.au ? 'primary' : ''}`} onClick={() => setPeriode({ du: p.du, au: p.au })}>{p.l}</button>
        ))}
        <input type="date" value={periode.du} onChange={(e) => setPeriode({ ...periode, du: e.target.value })} />
        <input type="date" value={periode.au} onChange={(e) => setPeriode({ ...periode, au: e.target.value })} />
      </div>
      <ErrorBox error={error} />
      {loading || !data ? <Loading /> : <Contenu data={data} exports={{ exportJournal, exportChauffeurs, exportVehicules }} />}
    </>
  );
}

function Contenu({ data, exports }) {
  const r = data.resume;
  const maxJour = Math.max(1, ...data.par_jour.map((j) => j.nb_courses));
  const maxCh = Math.max(1, ...data.par_chauffeur.map((c) => c.nb_courses));
  const maxV = Math.max(1, ...data.par_vehicule.map((c) => c.nb_courses));
  const totalDemandes = data.statuts.reduce((s, x) => s + x.nb, 0);

  return (
    <>
      <div className="stats">
        <Stat label="Courses effectuées" value={r.nb_courses} />
        <Stat label="Durée totale" value={fmtDuree(r.duree_totale_min)} sub={`moyenne ${fmtDuree(r.duree_moyenne_min)} / course`} />
        <Stat label="Kilomètres parcourus" value={fmtNombre(r.km_total)} />
        <Stat label="Véhicules utilisés" value={r.nb_vehicules} />
        <Stat label="Chauffeurs mobilisés" value={r.nb_chauffeurs} />
        <Stat label="Retours en retard" value={r.nb_retours_en_retard} alert={r.nb_retours_en_retard > 0} />
      </div>

      <div className="card">
        <h2>Courses par jour</h2>
        {data.par_jour.length === 0 ? <div className="empty">Aucune course</div> : (
          <>
            <div className="chart-days">
              {data.par_jour.map((j) => (
                <div key={j.jour} className="col" style={{ height: `${(j.nb_courses / maxJour) * 100}%` }} title={`${fmtDate(j.jour)} : ${j.nb_courses} course(s)`} />
              ))}
            </div>
            <div className="small" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{fmtDate(data.par_jour[0].jour)}</span><span>{fmtDate(data.par_jour[data.par_jour.length - 1].jour)}</span>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Par chauffeur — charge de travail et repos</h2>
          <button className="btn sm" onClick={exports.exportChauffeurs}>⬇ Excel</button>
        </div>
        <p className="small">« Repos conseillé » si plus de {data.seuils.courses_7j} courses ou {data.seuils.heures_7j} h de conduite sur les 7 derniers jours.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Chauffeur</th><th>Statut</th><th className="num">Courses</th><th /><th className="num">Durée totale</th><th className="num">Km</th><th>Dernière course</th><th className="num">7 derniers jours</th><th>Repos</th></tr></thead>
            <tbody>
              {data.par_chauffeur.map((c) => (
                <tr key={c.id}>
                  <td className="strong">{c.nom}</td>
                  <td><Badge map={ETATS_CHAUFFEUR} value={c.statut_chauffeur} /></td>
                  <td className="num strong">{c.nb_courses}</td>
                  <td style={{ width: 120 }}><Bar value={c.nb_courses} max={maxCh} /></td>
                  <td className="num">{fmtDuree(c.duree_totale_min)}</td>
                  <td className="num">{fmtNombre(c.km_total)}</td>
                  <td>{fmtDateTime(c.derniere_course)}</td>
                  <td className="num">{c.courses_7j} · {fmtDuree(c.minutes_7j)}</td>
                  <td>{c.alerte_repos ? <span className="badge warn">Repos conseillé</span> : <span className="badge ok">OK</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Par véhicule</h2>
          <button className="btn sm" onClick={exports.exportVehicules}>⬇ Excel</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Véhicule</th><th className="num">Courses</th><th /><th className="num">Durée totale</th><th className="num">Km (période)</th><th className="num">Compteur</th></tr></thead>
            <tbody>
              {data.par_vehicule.map((v) => (
                <tr key={v.id}>
                  <td><strong>{v.immatriculation}</strong> <span className="small">{v.marque} {v.modele}</span></td>
                  <td className="num strong">{v.nb_courses}</td>
                  <td style={{ width: 120 }}><Bar value={v.nb_courses} max={maxV} /></td>
                  <td className="num">{fmtDuree(v.duree_totale_min)}</td>
                  <td className="num">{fmtNombre(v.km_total)}</td>
                  <td className="num">{fmtNombre(v.kilometrage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Par agent (demandeur)</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Agent</th><th className="num">Demandes</th><th className="num">Acceptées</th><th className="num">Rejetées</th><th className="num">Courses</th></tr></thead>
              <tbody>
                {data.par_agent.map((a) => (
                  <tr key={a.id}>
                    <td>{a.nom}<div className="small">{a.service}</div></td>
                    <td className="num">{a.nb_demandes}</td>
                    <td className="num">{a.nb_acceptees}</td>
                    <td className="num">{a.nb_rejetees}</td>
                    <td className="num">{a.nb_courses}</td>
                  </tr>
                ))}
                {!data.par_agent.length && <tr><td colSpan={5} className="empty">Aucune demande</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2>Destinations les plus fréquentes</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Destination</th><th className="num">Courses</th><th className="num">Durée moy.</th></tr></thead>
              <tbody>
                {data.par_destination.map((x) => (
                  <tr key={x.destination}><td>{x.destination}</td><td className="num">{x.nb_courses}</td><td className="num">{fmtDuree(x.duree_moyenne_min)}</td></tr>
                ))}
                {!data.par_destination.length && <tr><td colSpan={3} className="empty">Aucune course</td></tr>}
              </tbody>
            </table>
          </div>
          <h2 style={{ marginTop: 18 }}>Demandes reçues sur la période ({totalDemandes})</h2>
          <div className="actions">
            {data.statuts.map((s) => (
              <span key={s.statut}><Badge map={STATUTS} value={s.statut} /> {s.nb}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Journal détaillé des courses ({data.journal.length})</h2>
          <button className="btn sm" onClick={exports.exportJournal} disabled={!data.journal.length}>⬇ Excel</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Réf.</th><th>Agent</th><th>Trajet</th><th>Véhicule</th><th>Chauffeur</th><th>Début</th><th>Fin</th><th className="num">Durée</th><th className="num">Km</th></tr></thead>
            <tbody>
              {data.journal.map((j) => (
                <tr key={j.id}>
                  <td className="strong">{j.reference}</td>
                  <td>{j.agent_nom}</td>
                  <td>{j.lieu_depart} → {j.destination}</td>
                  <td>{j.immatriculation}</td>
                  <td>{j.chauffeur_nom}</td>
                  <td>{fmtDateTime(j.debut_course)}</td>
                  <td>{fmtDateTime(j.fin_course)}</td>
                  <td className="num">{fmtDuree(j.duree_minutes)}</td>
                  <td className="num">{fmtNombre(j.km_parcourus)}</td>
                </tr>
              ))}
              {!data.journal.length && <tr><td colSpan={9} className="empty">Aucune course sur la période</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
