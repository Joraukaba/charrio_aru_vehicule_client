import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Compte from './pages/Compte.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DemandesAdmin from './pages/DemandesAdmin.jsx';
import Suivi from './pages/Suivi.jsx';
import Courses from './pages/Courses.jsx';
import Rapports from './pages/Rapports.jsx';
import Vehicules from './pages/Vehicules.jsx';
import Utilisateurs from './pages/Utilisateurs.jsx';
import Itineraires from './pages/Itineraires.jsx';
import DemandeForm from './pages/DemandeForm.jsx';
import MesDemandes from './pages/MesDemandes.jsx';
import MesCourses from './pages/MesCourses.jsx';
import HistoriqueChauffeur from './pages/HistoriqueChauffeur.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Chargement…</div>;
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/connexion" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/compte" element={<Compte />} />
        {user.role === 'admin' && (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/demandes" element={<DemandesAdmin />} />
            <Route path="/suivi" element={<Suivi />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/rapports" element={<Rapports />} />
            <Route path="/nouvelle-demande" element={<DemandeForm />} />
            <Route path="/vehicules" element={<Vehicules />} />
            <Route path="/chauffeurs" element={<Utilisateurs role="chauffeur" />} />
            <Route path="/agents" element={<Utilisateurs role="agent" />} />
            <Route path="/utilisateurs" element={<Utilisateurs />} />
            <Route path="/itineraires" element={<Itineraires />} />
          </>
        )}
        {user.role === 'agent' && (
          <>
            <Route path="/" element={<MesDemandes />} />
            <Route path="/nouvelle-demande" element={<DemandeForm />} />
            <Route path="/demandes/:id/modifier" element={<DemandeForm />} />
          </>
        )}
        {user.role === 'chauffeur' && (
          <>
            <Route path="/" element={<MesCourses />} />
            <Route path="/historique" element={<HistoriqueChauffeur />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
