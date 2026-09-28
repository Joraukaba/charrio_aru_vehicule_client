import CrudPage from '../components/CrudPage.jsx';
import { fmtDuree } from '../format.js';

const fields = [
  { key: 'nom', label: 'Nom de l’itinéraire', required: true, hint: 'Ex. : Siège → Aéroport', full: true },
  { key: 'lieu_depart', label: 'Lieu de départ', required: true },
  { key: 'destination', label: 'Destination', required: true },
  { key: 'distance_km', label: 'Distance (km)', type: 'number', min: 0, step: '0.1' },
  { key: 'duree_estimee_min', label: 'Durée estimée (minutes)', type: 'number', min: 0 },
  { key: 'actif', label: 'Itinéraire actif', type: 'checkbox' },
];

const columns = [
  { label: 'Nom', render: (i) => <strong>{i.nom}</strong> },
  { label: 'Trajet', render: (i) => `${i.lieu_depart} → ${i.destination}` },
  { label: 'Distance', num: true, render: (i) => (i.distance_km != null ? `${i.distance_km} km` : '—') },
  { label: 'Durée estimée', num: true, render: (i) => fmtDuree(i.duree_estimee_min) },
  { label: 'Utilisations', num: true, render: (i) => i.nb_demandes },
];

export default function Itineraires() {
  return (
    <CrudPage
      title="Itinéraires"
      subtitle="Trajets fréquents proposés aux agents lors de leurs demandes"
      endpoint="/itineraires"
      columns={columns}
      fields={fields}
      defaults={{ actif: true }}
      singular="itinéraire"
      searchKeys={['nom', 'lieu_depart', 'destination']}
    />
  );
}
