import CrudPage from '../components/CrudPage.jsx';
import { Badge } from '../components/ui.jsx';
import { DISPO_VEHICULE, ETATS_VEHICULE, fmtHeure, fmtNombre } from '../format.js';

const fields = [
  { key: 'immatriculation', label: 'Immatriculation', required: true },
  { key: 'marque', label: 'Marque', required: true },
  { key: 'modele', label: 'Modèle' },
  { key: 'type', label: 'Type', type: 'select', options: ['Berline', '4x4', 'Pick-up', 'Minibus', 'Bus', 'Camion', 'Moto', 'Autre'].map((v) => ({ value: v, label: v })) },
  { key: 'places', label: 'Nombre de places', type: 'number', min: 1 },
  { key: 'carburant', label: 'Carburant', type: 'select', options: ['Diesel', 'Essence', 'Hybride', 'Électrique'].map((v) => ({ value: v, label: v })) },
  { key: 'kilometrage', label: 'Kilométrage actuel', type: 'number', min: 0 },
  {
    key: 'etat', label: 'État', type: 'select', required: true,
    options: Object.entries(ETATS_VEHICULE).map(([value, o]) => ({ value, label: o.label })),
    hint: '« En panne » ou « En maintenance » rend le véhicule indisponible.',
  },
  { key: 'observations', label: 'Observations', type: 'textarea', full: true },
  { key: 'actif', label: 'Véhicule actif dans le parc', type: 'checkbox' },
];

const columns = [
  { label: 'Immatriculation', render: (v) => <strong>{v.immatriculation}</strong> },
  { label: 'Véhicule', render: (v) => <>{v.marque} {v.modele}<div className="small">{[v.type, v.places && `${v.places} places`, v.carburant].filter(Boolean).join(' · ')}</div></> },
  { label: 'Kilométrage', num: true, render: (v) => fmtNombre(v.kilometrage) },
  { label: 'État', render: (v) => <Badge map={ETATS_VEHICULE} value={v.etat} /> },
  {
    label: 'Disponibilité',
    render: (v) => (
      <>
        <Badge map={DISPO_VEHICULE} value={v.disponibilite} />
        {v.course_id && (
          <div className="small">
            {v.course_chauffeur} → {v.course_destination}<br />depuis {fmtHeure(v.course_debut)} · pour {v.course_agent}
          </div>
        )}
        {v.missions_a_venir > 0 && <div className="small">{v.missions_a_venir} mission(s) planifiée(s)</div>}
      </>
    ),
  },
  { label: 'Courses', num: true, render: (v) => v.total_courses },
];

const filters = [
  { value: 'disponible', label: 'Disponibles', test: (v) => v.disponibilite === 'disponible' },
  { value: 'en_mission', label: 'En mission', test: (v) => v.disponibilite === 'en_mission' },
  { value: 'indisponible', label: 'Indisponibles', test: (v) => v.disponibilite === 'indisponible' },
];

export default function Vehicules() {
  return (
    <CrudPage
      title="Véhicules"
      subtitle="Parc automobile, état et disponibilité en temps réel"
      endpoint="/vehicules"
      columns={columns}
      fields={fields}
      defaults={{ etat: 'bon', actif: true, places: 5, kilometrage: 0 }}
      singular="véhicule"
      searchKeys={['immatriculation', 'marque', 'modele', 'type']}
      filters={filters}
    />
  );
}
