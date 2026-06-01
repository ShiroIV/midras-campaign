import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function CampaignDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [players, setPlayers] = useState([]);
  const [addUser, setAddUser] = useState('');
  const [showCreateChar, setShowCreateChar] = useState(false);
  const [charForm, setCharForm] = useState({ name: '', race: '', force: 10, int: 10, agi: 10, pv_max: 100, pv_current: 100, mana_max: 50, mana_current: 50, endurance_max: 50, endurance_current: 50, level: 1, divinity: 0, spirituality: 10 });

  useEffect(() => {
    api.campaigns.get(id).then(d => { setCampaign(d.campaign); setPlayers(d.players); }).catch(() => navigate('/'));
    api.characters.list(id).then(d => setCharacters(d.characters)).catch(() => {});
  }, [id]);

  const addPlayer = async () => {
    if (!addUser) return;
    try {
      const d = await api.campaigns.addPlayer(id, addUser);
      setPlayers([...players, { username: d.user.username, role: d.user.role, character_id: null, character_name: null }]);
      setAddUser('');
      toast.success('Joueur ajouté');
    } catch (e) { toast.error(e.message); }
  };

  const removePlayer = async (userId) => {
    await api.campaigns.removePlayer(id, userId);
    setPlayers(players.filter(p => p.id !== userId));
    toast.success('Joueur retiré');
  };

  const createCharacter = async (e) => {
    e.preventDefault();
    const d = await api.characters.create(id, charForm);
    setCharacters([...characters, d.character]);
    setShowCreateChar(false);
    toast.success('Personnage créé');
  };

  if (!campaign) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Chargement...</div>;

  return (
    <div>
      <h2>{campaign.name}</h2>
      {campaign.description && <p style={{ color: '#666', marginBottom: 12 }}>{campaign.description}</p>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Link to={`/campaigns/${id}/calendar`} style={{ padding: '8px 16px', background: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: 6 }}>Calendrier</Link>
        <Link to={`/campaigns/${id}/maps`} style={{ padding: '8px 16px', background: '#388e3c', color: 'white', textDecoration: 'none', borderRadius: 6 }}>Cartes</Link>
        <Link to={`/campaigns/${id}/bestiary`} style={{ padding: '8px 16px', background: '#7b1fa2', color: 'white', textDecoration: 'none', borderRadius: 6 }}>Bestiaire</Link>
        {user.role === 'mj' && (
          <>
            <Link to={`/campaigns/${id}/bestiary/admin`} style={{ padding: '8px 16px', background: '#9c27b0', color: 'white', textDecoration: 'none', borderRadius: 6 }}>Bestiaire (Admin)</Link>
            <Link to={`/campaigns/${id}/items`} style={{ padding: '8px 16px', background: '#e65100', color: 'white', textDecoration: 'none', borderRadius: 6 }}>Objets</Link>
            <Link to={`/campaigns/${id}/admin`} style={{ padding: '8px 16px', background: '#37474f', color: 'white', textDecoration: 'none', borderRadius: 6 }}>Admin</Link>
          </>
        )}
      </div>

      {user.role === 'mj' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Ajouter un joueur</h3>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={addUser} onChange={e => setAddUser(e.target.value)} placeholder="Nom d'utilisateur" style={{ padding: 8, flex: 1 }} />
            <button onClick={addPlayer}>Ajouter</button>
          </div>
          {players.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ marginBottom: 8 }}>Membres ({players.length})</h4>
              {players.map(p => (
                <div key={p.id || p.username} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #f0f0f0' }}>
                  <span>{p.username} <span className="badge" style={{ background: '#e3f2fd', color: '#1976d2', marginLeft: 6 }}>{p.role}</span>
                    {p.character_name && <span style={{ color: '#888', marginLeft: 8 }}>&mdash; {p.character_name}</span>}
                  </span>
                  <button onClick={() => removePlayer(p.id)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '0.85em' }}>Retirer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 8 }}>
        <h3>Personnages</h3>
        {user.role === 'mj' && <button onClick={() => setShowCreateChar(!showCreateChar)}>Nouveau personnage</button>}
      </div>

      {showCreateChar && (
        <form onSubmit={createCharacter} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            <div><label>Nom</label><input value={charForm.name} onChange={e => setCharForm({...charForm, name: e.target.value})} required /></div>
            <div><label>Race</label><input value={charForm.race} onChange={e => setCharForm({...charForm, race: e.target.value})} /></div>
            <div><label>Force</label><input type="number" value={charForm.force} onChange={e => setCharForm({...charForm, force: +e.target.value})} /></div>
            <div><label>Intelligence</label><input type="number" value={charForm.int} onChange={e => setCharForm({...charForm, int: +e.target.value})} /></div>
            <div><label>Agilité</label><input type="number" value={charForm.agi} onChange={e => setCharForm({...charForm, agi: +e.target.value})} /></div>
            <div><label>PV Max</label><input type="number" value={charForm.pv_max} onChange={e => setCharForm({...charForm, pv_max: +e.target.value})} /></div>
            <div><label>Mana Max</label><input type="number" value={charForm.mana_max} onChange={e => setCharForm({...charForm, mana_max: +e.target.value})} /></div>
            <div><label>Endurance Max</label><input type="number" value={charForm.endurance_max} onChange={e => setCharForm({...charForm, endurance_max: +e.target.value})} /></div>
            <div><label>Niveau</label><input type="number" value={charForm.level} onChange={e => setCharForm({...charForm, level: +e.target.value})} /></div>
            <div><label>Divinité</label><input type="number" value={charForm.divinity} onChange={e => setCharForm({...charForm, divinity: +e.target.value})} /></div>
            <div><label>Spiritualité</label><input type="number" value={charForm.spirituality} onChange={e => setCharForm({...charForm, spirituality: +e.target.value})} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit">Créer</button>
            <button type="button" onClick={() => setShowCreateChar(false)} style={{ background: '#e0e0e0', color: '#333' }}>Annuler</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
        {characters.map(c => (
          <div key={c.id} onClick={() => navigate(`/characters/${c.id}`)} className="card" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <strong style={{ fontSize: '1.1em' }}>{c.name}</strong>
              <span style={{ fontSize: '0.85em', color: '#888' }}>Niv {c.level} &mdash; {c.race || 'Race inconnue'}</span>
            </div>
            <div style={{ fontSize: '0.9em', color: '#555', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>F:{c.force}</span><span>I:{c.int}</span><span>A:{c.agi}</span>
              <span style={{ color: c.pv_current < c.pv_max * 0.3 ? '#c62828' : '#2e7d32' }}>PV:{c.pv_current}/{c.pv_max}</span>
              <span>Mana:{c.mana_current}/{c.mana_max}</span>
              <span>End:{c.endurance_current}/{c.endurance_max}</span>
            </div>
          </div>
        ))}
        {characters.length === 0 && <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>Aucun personnage dans cette campagne.</p>}
      </div>
    </div>
  );
}
