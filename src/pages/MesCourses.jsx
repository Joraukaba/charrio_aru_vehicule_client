// Espace chauffeur : courses validées, bouton Début course / Fin course
import { useState } from 'react';
import { api } from '../api.js';
import { useFetch, useNow } from '../hooks.js';
import { ErrorBox, Loading, Modal, PageHead, StatutBadge } from '../components/ui.jsx';
import { fmtDateTime, fmtHeure, fmtNombre } from '../format.js';

function Chrono({ depuis }) {
  const now = useNow();
  const s = Math.max(0, Math.floor((now - new Date(depuis).getTime()) / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return <div className="timer">{pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}</div>;
}

function CourseCard({ d, onAction }) {
  const enCours = d.statut === 'en_cours';
  return (
    <div className={`course-card ${enCours ? 'live-card' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span className="strong">{d.reference}</span>
        <StatutBadge statut={d.statut} />
      </div>
      <div className="route">{d.lieu_depart} → {d.destination}</div>
      <div className="small">{d.motif}</div>
      <dl className="dl" style={{ marginTop: 10, gridTemplateColumns: '120px 1fr' }}>
        <dt>Véhicule</dt><dd><strong>{d.vehicule_immatriculation}</strong> — {d.vehicule_marque} {d.vehicule_modele}</dd>
        <dt>Passager(s)</dt><dd>{d.agent_nom}{d.agent_telephone ? ` · ${d.agent_telephone}` : ''} ({d.nb_passagers})</dd>
        <dt>Départ prévu</dt><dd>{fmtDateTime(d.date_depart_prevue)}</dd>
        <dt>Retour prévu</dt><dd>{fmtDateTime(d.date_retour_prevue)}</dd>
        {d.commentaire_admin && (<><dt>Consigne</dt><dd>{d.commentaire_admin}</dd></>)}
        {enCours && (<><dt>Parti à</dt><dd>{fmtHeure(d.debut_course)} · km {fmtNombre(d.km_depart)}</dd></>)}
      </dl>
      {enCours && <Chrono depuis={d.debut_course} />}
      <div style={{ marginTop: 12 }}>
        {enCours ? (
          <button className="btn xl danger" onClick={() => onAction('fin', d)}>🏁 Fin de course</button>
        ) : (
          <button className="btn xl success" onClick={() => onAction('debut', d)}>▶ Début de course</button>
        )}
      </div>
    </div>
  );
}

export default function MesCourses() {
  const { data, error, loading, reload } = useFetch('/demandes?statut=validee,en_cours', { refreshMs: 30000 });
  const [action, setAction] = useState(null); // { type, d }
  const [km, setKm] = useState('');
  const [obs, setObs] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const enCours = (data || []).filter((d) => d.statut === 'en_cours');
  const aFaire = (data || []).filter((d) => d.statut === 'validee').sort((a, b) => new Date(a.date_depart_prevue) - new Date(b.date_depart_prevue));

  const open = (type, d) => {
    setErr(null);
    setObs('');
    setKm(type === 'debut' ? '' : '');
    setAction({ type, d });
  };

  const confirmer = async () => {
    setBusy(true);
    setErr(null);
    try {
      const { type, d } = action;
      if (type === 'debut') await api.post(`/demandes/${d.id}/debut`, { km_depart: km });
      else await api.post(`/demandes/${d.id}/fin`, { km_retour: km, observations: obs });
      setAction(null);
      reload();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="Mes courses" subtitle="Appuyez sur « Début de course » au départ et « Fin de course » au retour." />
      <ErrorBox error={error} />
      {loading ? <Loading /> : (
        <div style={{ maxWidth: 640 }}>
          {enCours.length > 0 && <h2>En cours</h2>}
          {enCours.map((d) => <CourseCard key={d.id} d={d} onAction={open} />)}
          <h2>À effectuer ({aFaire.length})</h2>
          {aFaire.map((d) => <CourseCard key={d.id} d={d} onAction={open} />)}
          {!aFaire.length && <div className="card empty">Aucune course validée pour vous pour le moment.</div>}
        </div>
      )}
      {action && (
        <Modal
          title={action.type === 'debut' ? 'Démarrer la course' : 'Terminer la course'}
          onClose={() => setAction(null)}
          footer={
            <>
              <button className="btn" onClick={() => setAction(null)}>Retour</button>
              <button className={`btn ${action.type === 'debut' ? 'success' : 'danger'}`} onClick={confirmer} disabled={busy}>
                {busy ? '…' : action.type === 'debut' ? 'Confirmer le départ' : 'Confirmer le retour'}
              </button>
            </>
          }
        >
          <ErrorBox error={err} />
          <p>
            <strong>{action.d.reference}</strong> — {action.d.lieu_depart} → {action.d.destination}<br />
            La date et l’heure {action.type === 'debut' ? 'de départ' : 'de retour'} seront enregistrées automatiquement.
          </p>
          <div className="field">
            <label>Kilométrage au compteur {action.type === 'debut' ? '(départ)' : '(retour)'} — facultatif</label>
            <input type="number" inputMode="numeric" min="0" value={km} onChange={(e) => setKm(e.target.value)}
              placeholder={action.type === 'fin' && action.d.km_depart != null ? `Départ : ${action.d.km_depart}` : ''} />
          </div>
          {action.type === 'fin' && (
            <div className="field">
              <label>Observations (incident, carburant…)</label>
              <textarea value={obs} onChange={(e) => setObs(e.target.value)} />
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
