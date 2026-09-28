// Agents, chauffeurs et utilisateurs (même table, rôles différents)
import CrudPage from '../components/CrudPage.jsx';
import { Badge } from '../components/ui.jsx';
import { ETATS_CHAUFFEUR, ROLES } from '../format.js';

const CONFIG = {
  chauffeur: { title: 'Chauffeurs', subtitle: 'Liste des chauffeurs et leur statut', singular: 'chauffeur' },
  agent: { title: 'Agents', subtitle: 'Agents autorisés à faire des demandes de déplacement', singular: 'agent' },
  tous: { title: 'Utilisateurs', subtitle: 'Tous les comptes : administrateurs, agents et chauffeurs', singular: 'utilisateur' },
};

export default function Utilisateurs({ role }) {
  const cfg = CONFIG[role || 'tous'];
  const isRole = (r) => (edit) => (role || edit.role) === r;

  const fields = [
    { key: 'nom', label: 'Nom complet', required: true },
    { key: 'email', label: 'Email (identifiant de connexion)', type: 'email', required: true },
    ...(!role ? [{ key: 'role', label: 'Rôle', type: 'select', required: true, options: Object.entries(ROLES).map(([value, label]) => ({ value, label })) }] : []),
    { key: 'telephone', label: 'Téléphone' },
    { key: 'matricule', label: 'Matricule' },
    { key: 'service', label: 'Service / Direction', showIf: (e) => (role || e.role) !== 'chauffeur' },
    { key: 'numero_permis', label: 'N° de permis', showIf: isRole('chauffeur') },
    {
      key: 'statut_chauffeur', label: 'Statut', type: 'select', required: true, showIf: isRole('chauffeur'),
      options: ['actif', 'repos', 'conge', 'indisponible'].map((v) => ({ value: v, label: ETATS_CHAUFFEUR[v].label })),
      hint: 'Un chauffeur en repos / congé ne peut pas recevoir de course.',
    },
    { key: 'mot_de_passe', label: 'Mot de passe', type: 'password', required: true, hint: '6 caractères minimum', editHint: 'Laisser vide pour ne pas changer' },
    { key: 'actif', label: 'Compte actif', type: 'checkbox' },
  ];

  const columns = [
    { label: 'Nom', render: (u) => <><strong>{u.nom}</strong><div className="small">{u.email}</div></> },
    ...(!role ? [{ label: 'Rôle', render: (u) => ROLES[u.role] }] : []),
    { label: 'Téléphone', key: 'telephone' },
    { label: 'Matricule', key: 'matricule' },
    ...(role !== 'chauffeur' ? [{ label: 'Service', key: 'service' }] : []),
    ...(role === 'chauffeur' ? [
      { label: 'Permis', key: 'numero_permis' },
      { label: 'Statut', render: (u) => <Badge map={ETATS_CHAUFFEUR} value={u.statut_chauffeur} /> },
    ] : []),
    { label: 'Compte', render: (u) => (u.actif ? <span className="badge ok">Actif</span> : <span className="badge muted">Désactivé</span>) },
  ];

  return (
    <CrudPage
      key={role || 'tous'}
      title={cfg.title}
      subtitle={cfg.subtitle}
      endpoint="/users"
      listUrl={role ? `/users?role=${role}` : '/users'}
      columns={columns}
      fields={fields}
      defaults={{ role: role || 'agent', actif: true, statut_chauffeur: 'actif' }}
      singular={cfg.singular}
      searchKeys={['nom', 'email', 'telephone', 'matricule', 'service']}
      filters={!role ? Object.entries(ROLES).map(([value, label]) => ({ value, label, test: (u) => u.role === value })) : undefined}
      transformBeforeSave={(p) => (role ? { ...p, role } : p)}
    />
  );
}
