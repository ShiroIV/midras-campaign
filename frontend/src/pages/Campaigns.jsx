import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { api.campaigns.list().then(d => setCampaigns(d.campaigns)).catch(() => {}); }, []);

  const create = async (e) => {
    e.preventDefault();
    const d = await api.campaigns.create({ name, description: desc });
    setCampaigns([d.campaign, ...campaigns]);
    setName(''); setDesc(''); setShowCreate(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Campagnes</h2>
        {user.role === 'mj' && <button onClick={() => setShowCreate(!showCreate)}>Nouvelle campagne</button>}
      </div>

      {showCreate && (
        <form onSubmit={create} className="card" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ width: '100%', padding: 8, marginTop: 4 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">Créer</button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: '#e0e0e0', color: '#333' }}>Annuler</button>
          </div>
        </form>
      )}

      {campaigns.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
          Aucune campagne. {user.role === 'mj' && 'Créez-en une avec le bouton ci-dessus !'}
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
          {campaigns.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/campaigns/${c.id}`)}
              className="card"
              style={{ cursor: 'pointer' }}
            >
              <h3 style={{ margin: 0 }}>{c.name}</h3>
              {c.description && <p style={{ margin: '4px 0 0', color: '#666', fontSize: '0.9em' }}>{c.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
