import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useFetch } from '../hooks.js';
import { ROLES } from '../format.js';

const MENUS = {
  admin: [
    { section: 'Pilotage' },
    { to: '/', label: 'Tableau de bord', icon: '📊', end: true },
    { to: '/demandes', label: 'Demandes', icon: '📝', badge: 'pending' },
    { to: '/suivi', label: 'Suivi en temps réel', icon: '🛰️' },
    { to: '/courses', label: 'Historique des courses', icon: '🧾' },
    { to: '/rapports', label: 'Rapports', icon: '📈' },
    { to: '/nouvelle-demande', label: 'Nouvelle demande', icon: '➕' },
    { section: 'Back-office' },
    { to: '/vehicules', label: 'Véhicules', icon: '🚙' },
    { to: '/chauffeurs', label: 'Chauffeurs', icon: '🧑‍✈️' },
    { to: '/agents', label: 'Agents', icon: '👥' },
    { to: '/itineraires', label: 'Itinéraires', icon: '🗺️' },
    { to: '/utilisateurs', label: 'Utilisateurs', icon: '🔐' },
  ],
  agent: [
    { to: '/', label: 'Mes demandes', icon: '📝', end: true },
    { to: '/nouvelle-demande', label: 'Nouvelle demande', icon: '➕' },
  ],
  chauffeur: [
    { to: '/', label: 'Mes courses', icon: '🚙', end: true },
    { to: '/historique', label: 'Mon historique', icon: '🧾' },
  ],
};

function PendingCount() {
  const { data } = useFetch('/dashboard', { refreshMs: 30000 });
  const n = data ? data.demandes.soumises + data.demandes.en_attente : 0;
  return n ? <span className="count">{n}</span> : null;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const items = MENUS[user.role] || [];

  // Ferme le menu mobile après navigation
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setOpen(false);
  }

  return (
    <div className="app">
      <div className="topbar">
        <button onClick={() => setOpen(true)} aria-label="Menu">☰</button>
        <strong>Gestion du charroi</strong>
      </div>
      <aside className={`sidebar ${open ? 'open' : ''}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="brand">
          <span style={{ fontSize: 26 }}>🚙</span>
          <div>Gestion du charroi<small>Véhicules & courses</small></div>
        </div>
        <nav className="nav">
          {items.map((it, i) =>
            it.section ? (
              <div key={i} className="nav-section">{it.section}</div>
            ) : (
              <NavLink key={it.to} to={it.to} end={it.end}>
                <span>{it.icon}</span> {it.label}
                {it.badge === 'pending' && <PendingCount />}
              </NavLink>
            )
          )}
          <div className="nav-section">Compte</div>
          <NavLink to="/compte"><span>⚙️</span> Mon compte</NavLink>
        </nav>
        <div className="userbox">
          <div className="strong">{user.nom}</div>
          <div className="role">{ROLES[user.role]}</div>
          <button className="btn sm" onClick={logout}>Se déconnecter</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
