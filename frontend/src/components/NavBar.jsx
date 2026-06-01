import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const inCampaign = location.pathname.match(/^\/campaigns\/(\d+)/);
  const campaignId = inCampaign ? inCampaign[1] : null;

  if (!user) return null;

  const isDashboard = location.pathname === '/';

  return (
    <div style={{
      background: '#1a1a2e', color: '#fff', padding: '0 16px',
      display: 'flex', alignItems: 'center', height: 48, gap: 16,
      position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <Link to="/" style={{ fontWeight: 'bold', fontSize: '1.1em', textDecoration: 'none', color: '#fff', letterSpacing: 0.5 }}>
        Midras
      </Link>

      {!isDashboard && (
        <Link to="/" style={{ color: '#90caf9', textDecoration: 'none', fontSize: '0.9em' }}>
          &larr; Campagnes
        </Link>
      )}

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: '0.85em', color: '#90caf9' }}>
        {user.username}
        <span style={{ marginLeft: 8, padding: '1px 6px', background: 'rgba(255,255,255,0.15)', borderRadius: 4, fontSize: '0.85em' }}>
          {user.role}
        </span>
      </span>
      <button onClick={logout} style={{ padding: '4px 12px', fontSize: '0.85em', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}>
        Déconnexion
      </button>
    </div>
  );
}
