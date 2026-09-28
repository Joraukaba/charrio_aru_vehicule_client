// Formulaire de demande de déplacement (agent, ou admin pour le compte d'un agent)
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useFetch } from '../hooks.js';
import { ErrorBox, PageHead } from '../components/ui.jsx';
import { DISPO_VEHICULE, ETATS_VEHICULE, toISO, toLocalInput } from '../format.js';

const EMPTY = {
  motif: '', itineraire_id: '', lieu_depart: '', destination: '',
  date_depart_prevue: '', date_retour_prevue: '', nb_passagers: 1, vehicule_id: '', agent_id: '',
};

export default function DemandeForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const isAdmin = user.role === 'admin';
  const { data: itineraires } = useFetch('/itineraires');
  const { data: vehicules } = useFetch('/vehicules?actifs=1');
  const { data: agents } = useFetch(isAdmin ? '/users?role=agent' : null);
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/demandes/${id}`).then((d) =>
      setF({
        ...EMPTY, ...d,
        itineraire_id: d.itineraire_id || '',
        vehicule_id: d.vehicule_id || '',
        date_depart_prevue: toLocalInput(d.date_depart_prevue),
        date_retour_prevue: toLocalInput(d.date_retour_prevue),
      })
    ).catch((e) => setError(e.message));
  }, [id]);

  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));

  const chooseItineraire = (e) => {
    const itId = e.target.value;
    const it = itineraires?.find((x) => String(x.id) === itId);
    setF((o) => {
      const n = { ...o, itineraire_id: itId };
      if (it) {
        n.lieu_depart = it.lieu_depart;
        n.destination = it.destination;
        if (o.date_depart_prevue && !o.date_retour_prevue && it.duree_estimee_min) {
          const r = new Date(new Date(o.date_depart_prevue).getTime() + it.duree_estimee_min * 2 * 60000 + 3600000);
          n.date_retour_prevue = toLocalInput(r);
        }
      }
      return n;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = {
        ...f,
        date_depart_prevue: toISO(f.date_depart_prevue),
        date_retour_prevue: toISO(f.date_retour_prevue),
      };
      if (id) await api.put(`/demandes/${id}`, body);
      else await api.post('/demandes', body);
      nav(isAdmin ? '/demandes' : '/', { state: { msg: id ? 'Demande modifiée.' : 'Demande envoyée. Vous serez informé de la décision ici.' } });
    } catch (err) {
      setError(err.message);
      window.scrollTo(0, 0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead
        title={id ? 'Modifier la demande' : 'Nouvelle demande de déplacement'}
        subtitle="Précisez la cause, l’itinéraire et les horaires. Le chargé du charroi validera et affectera un chauffeur."
      />
      <form className="card" onSubmit={submit} style={{ maxWidth: 820 }}>
        <ErrorBox error={error} />
        {isAdmin && !id && (
          <div className="field">
            <label>Demandeur (agent)</label>
            <select value={f.agent_id} onChange={set('agent_id')}>
              <option value="">Moi-même ({user.nom})</option>
              {agents?.filter((a) => a.actif).map((a) => <option key={a.id} value={a.id}>{a.nom}{a.service ? ` — ${a.service}` : ''}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label>Motif du déplacement (cause) *</label>
          <textarea value={f.motif} onChange={set('motif')} required placeholder="Ex. : Réunion au ministère pour le dossier X" />
        </div>

        <h3>Itinéraire</h3>
        <div className="field">
          <label>Itinéraire habituel</label>
          <select value={f.itineraire_id} onChange={chooseItineraire}>
            <option value="">— Autre trajet (saisir ci-dessous) —</option>
            {itineraires?.map((i) => <option key={i.id} value={i.id}>{i.nom}</option>)}
          </select>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Lieu de départ *</label>
            <input value={f.lieu_depart} onChange={set('lieu_depart')} required />
          </div>
          <div className="field">
            <label>Destination *</label>
            <input value={f.destination} onChange={set('destination')} required />
          </div>
          <div className="field">
            <label>Date et heure de départ *</label>
            <input type="datetime-local" value={f.date_depart_prevue} onChange={set('date_depart_prevue')} required />
          </div>
          <div className="field">
            <label>Date et heure de retour prévue *</label>
            <input type="datetime-local" value={f.date_retour_prevue} onChange={set('date_retour_prevue')} min={f.date_depart_prevue} required />
          </div>
          <div className="field">
            <label>Nombre de passagers</label>
            <input type="number" min="1" value={f.nb_passagers} onChange={set('nb_passagers')} />
          </div>
          <div className="field">
            <label>Véhicule souhaité</label>
            <select value={f.vehicule_id} onChange={set('vehicule_id')}>
              <option value="">Pas de préférence</option>
              {vehicules?.map((v) => {
                const hs = ['en_panne', 'en_maintenance'].includes(v.etat);
                return (
                  <option key={v.id} value={v.id} disabled={hs}>
                    {v.immatriculation} — {v.marque} {v.modele || ''} ({v.places} pl.) · {hs ? ETATS_VEHICULE[v.etat].label : DISPO_VEHICULE[v.disponibilite].label}
                  </option>
                );
              })}
            </select>
            <div className="hint">L’administrateur peut attribuer un autre véhicule selon les disponibilités.</div>
          </div>
        </div>
        <div className="actions">
          <button className="btn primary" disabled={busy}>{busy ? 'Envoi…' : id ? 'Enregistrer' : 'Envoyer la demande'}</button>
          <button type="button" className="btn" onClick={() => nav(-1)}>Annuler</button>
        </div>
      </form>
    </>
  );
}
