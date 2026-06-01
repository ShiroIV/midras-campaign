import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CampaignDetail from './pages/CampaignDetail';
import CharacterSheet from './pages/CharacterSheet';
import CalendarPage from './pages/CalendarPage';
import MapPage from './pages/MapPage';
import MonstersAdmin from './pages/MonstersAdmin';
import BestiaryPlayer from './pages/BestiaryPlayer';
import ItemsAdmin from './pages/ItemsAdmin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <>
      <NavBar />
      <div className="page">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignDetail /></ProtectedRoute>} />
          <Route path="/characters/:id" element={<ProtectedRoute><CharacterSheet /></ProtectedRoute>} />
          <Route path="/campaigns/:campaignId/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/campaigns/:campaignId/maps" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
          <Route path="/campaigns/:campaignId/bestiary/admin" element={<ProtectedRoute><MonstersAdmin /></ProtectedRoute>} />
          <Route path="/campaigns/:campaignId/bestiary" element={<ProtectedRoute><BestiaryPlayer /></ProtectedRoute>} />
          <Route path="/campaigns/:campaignId/items" element={<ProtectedRoute><ItemsAdmin /></ProtectedRoute>} />
          <Route path="/campaigns/:campaignId/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
