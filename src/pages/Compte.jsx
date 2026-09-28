import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PageHead } from '../components/ui.jsx';
import { ROLES } from '../format.js';

export default function Compte() {
  const { user } = useAuth();
  const [f, setF] = useState({ ancien: '', nouveau: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (f.nouveau !== f.confirm) return setErr('Les deux mots de passe ne correspondent pas');
    try {
      await api.put('/auth/password', { ancien: f.ancien, nouveau: f.nouveau });
      setMsg('Mot de passe modifié.');
      setF({ ancien: '', nouveau: '', confirm: '' });
    } catch (e2) {
      setErr(e2.message);
    }
  };

  return (
    <>
      <PageHead title="Mon compte" />
      <div className="grid grid-2">
        <div className="card">
          <h2>Informations</h2>
          <dl className="dl">
            <dt>Nom</dt><dd>{user.nom}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Rôle</dt><dd>{ROLES[user.role]}</dd>
            {user.telephone && (<><dt>Téléphone</dt><dd>{user.telephone}</dd></>)}
            {user.service && (<><dt>Service</dt><dd>{user.service}</dd></>)}
          </dl>
        </div>
        <form className="card" onSubmit={submit}>
          <h2>Changer mon mot de passe</h2>
          {msg && <div className="success-msg">{msg}</div>}
          {err && <div className="error">{err}</div>}
          {[['ancien', 'Mot de passe actuel'], ['nouveau', 'Nouveau mot de passe'], ['confirm', 'Confirmer le nouveau']].map(([k, l]) => (
            <div className="field" key={k}>
              <label>{l}</label>
              <input type="password" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required minLength={k === 'ancien' ? 1 : 6} />
            </div>
          ))}
          <button className="btn primary">Enregistrer</button>
        </form>
      </div>
    </>
  );
}
