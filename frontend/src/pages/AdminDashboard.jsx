import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function AdminDashboard() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.campaigns.stats(campaignId).then(setStats).catch(e => toast.error(e.message));
  }, [campaignId]);

  const modules = [
    { path: `/campaigns/${campaignId}/admin`, label: 'Dashboard', desc: 'Vue d\'ensemble' },
    { path: `/campaigns/${campaignId}/maps`, label: 'Cartes', desc: 'Gestion des cartes' },
    { path: `/campaigns/${campaignId}/calendar`, label: 'Calendrier', desc: 'Calendrier de la campagne' },
    { path: `/campaigns/${campaignId}/bestiary/admin`, label: 'Bestiaire', desc: 'Gestion des monstres' },
    { path: `/campaigns/${campaignId}/items`, label: 'Objets', desc: 'Catalogue d\'objets' },
  ];

  return (
    <div>
      <h2>Administration</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>Campagne #{campaignId}</p>

      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Personnages', value: stats.characters },
            { label: 'Monstres', value: stats.monsters },
            { label: 'Cartes', value: stats.maps },
            { label: 'Événements', value: stats.events },
            { label: 'Objets', value: stats.items },
            { label: 'Joueurs', value: stats.members },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>{s.value}</div>
              <div style={{ fontSize: '0.8em', color: '#888', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {modules.map(m => (
          <Link key={m.path} to={m.path} className="card" style={{ textDecoration: 'none', display: 'block' }}>
            <h3 style={{ margin: 0 }}>{m.label}</h3>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.9em' }}>{m.desc}</p>
          </Link>
        ))}
      </div>

      {user.role === 'player' && (
        <div style={{ marginTop: 24 }}>
          <Link to={`/campaigns/${campaignId}/bestiary`} className="card" style={{ textDecoration: 'none', display: 'block' }}>
            <h3>Bestiaire</h3>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.9em' }}>Consulter le bestiaire</p>
          </Link>
        </div>
      )}
    </div>
  );
}
