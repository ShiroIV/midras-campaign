import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import MonsterCard from '../components/MonsterCard';

export default function BestiaryPlayer() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [characters, setCharacters] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [allMonsters, setAllMonsters] = useState([]);
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [serialInput, setSerialInput] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [detailedMonster, setDetailedMonster] = useState(null);
  const [cardMonster, setCardMonster] = useState(null);

  useEffect(() => {
    api.characters.list(campaignId).then(d => {
      setCharacters(d.characters);
      if (d.characters.length > 0) setSelectedChar(d.characters[0].id);
    }).catch(() => {});
    api.monsters.listPublic(campaignId).then(d => setAllMonsters(d.monsters)).catch(() => {});
  }, [campaignId]);

  useEffect(() => {
    if (selectedChar) {
      api.monsters.unlocked(selectedChar).then(d => {
        setUnlockedIds(new Set(d.monsters.map(m => m.id)));
      }).catch(() => {});
    }
  }, [selectedChar]);

  const handleUnlock = async () => {
    if (!serialInput.trim() || !selectedChar) return;
    setMessage('');
    try {
      const d = await api.monsters.unlock(serialInput.trim(), selectedChar);
      setUnlockedIds(prev => new Set([...prev, d.monster.id]));
      setSerialInput('');
      setMessage(`✓ ${d.monster.name} débloqué !`);
    } catch (e) {
      setMessage(`✗ ${e.message}`);
    }
  };

  const showMonsterDetail = async (monsterId) => {
    try {
      const d = await api.monsters.get(monsterId);
      setDetailedMonster(d.monster);
    } catch {}
  };

  const parsedSkills = (s) => {
    try { return JSON.parse(s); } catch { return []; }
  };

  const displayedMonsters = filter === 'unlocked'
    ? allMonsters.filter(m => unlockedIds.has(m.id))
    : allMonsters;

  return (
    <div>
      <button onClick={() => navigate(`/campaigns/${campaignId}`)} style={{ marginBottom: 12 }}>&larr; Retour</button>
      <h2>Bestiaire</h2>

      <div style={{ margin: '12px 0', padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#f9f9f9' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {characters.length > 0 && (
            <div>
              <label style={{ marginRight: 8 }}>Personnage :</label>
              <select value={selectedChar || ''} onChange={e => setSelectedChar(Number(e.target.value))} style={{ padding: 8 }}>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', gap: 4 }}>
            <input
              value={serialInput}
              onChange={e => setSerialInput(e.target.value)}
              placeholder="Entrez un code sériel (ex: 123-456-789)"
              style={{ flex: 1, padding: 8, fontFamily: 'monospace' }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            />
            <button onClick={handleUnlock}>Débloquer</button>
          </div>
        </div>
        {message && (
          <div style={{ marginTop: 8, padding: '6px 12px', background: message.startsWith('✓') ? '#e8f5e9' : '#ffebee', borderRadius: 4 }}>
            {message}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setFilter('all')} style={{ background: filter === 'all' ? '#1976d2' : '#eee', color: filter === 'all' ? '#fff' : '#333', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>
          Tous ({allMonsters.length})
        </button>
        <button onClick={() => setFilter('unlocked')} style={{ background: filter === 'unlocked' ? '#1976d2' : '#eee', color: filter === 'unlocked' ? '#fff' : '#333', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}>
          Débloqués ({unlockedIds.size})
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {displayedMonsters.map(m => {
          const isUnlocked = unlockedIds.has(m.id);
          return (
            <div
              key={m.id}
              onClick={() => isUnlocked && showMonsterDetail(m.id)}
              style={{
                padding: 12, border: '1px solid #ddd', borderRadius: 8, textAlign: 'center',
                background: isUnlocked ? '#fff' : '#f5f5f5', cursor: isUnlocked ? 'pointer' : 'default',
                opacity: isUnlocked ? 1 : 0.6, transition: '0.2s',
              }}
            >
              {m.image_url && isUnlocked ? (
                <img src={m.image_url} alt={m.name} style={{ width: '100%', height: 140, objectFit: 'contain', borderRadius: 4 }} />
              ) : (
                <div style={{ width: '100%', height: 140, background: '#ddd', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em', color: '#999' }}>
                  {isUnlocked ? '?' : '🔒'}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <strong>{isUnlocked ? m.name : '???'}</strong>
              </div>
              <div style={{ fontSize: '0.8em', color: '#666', marginTop: 2 }}>
                {isUnlocked ? (
                  <span style={{ padding: '1px 6px', background: '#e3f2fd', borderRadius: 4 }}>{m.tier}</span>
                ) : 'Non débloqué'}
              </div>
            </div>
          );
        })}
      </div>

      {detailedMonster && (
        <div
          onClick={() => setDetailedMonster(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100, cursor: 'pointer',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 500, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{detailedMonster.name}</h2>
              <button onClick={() => setDetailedMonster(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ margin: '12px 0', textAlign: 'center' }}>
              {detailedMonster.image_url ? (
                <img src={detailedMonster.image_url} alt={detailedMonster.name} style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8 }} />
              ) : <div style={{ height: 150, background: '#eee', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Aucune image</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, margin: '12px 0' }}>
              <span style={{ padding: '4px 12px', background: '#e3f2fd', borderRadius: 4, fontSize: '0.85em' }}>{detailedMonster.tier}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8em', color: '#888' }}>#{detailedMonster.serial_number}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, margin: '12px 0', textAlign: 'center' }}>
              {[
                { label: 'Force', val: detailedMonster.force },
                { label: 'Int', val: detailedMonster.int },
                { label: 'Agi', val: detailedMonster.agi },
                { label: 'PV', val: detailedMonster.pv },
                { label: 'Armure', val: detailedMonster.armor },
              ].map(s => (
                <div key={s.label} style={{ padding: 8, background: '#f9f9f9', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.7em', color: '#888' }}>{s.label}</div>
                  <div style={{ fontSize: '1.3em', fontWeight: 'bold' }}>{s.val}</div>
                </div>
              ))}
            </div>

            {detailedMonster.lore && (
              <div style={{ margin: '12px 0', padding: 12, background: '#f5f5f5', borderRadius: 6, fontStyle: 'italic', color: '#555' }}>
                {detailedMonster.lore}
              </div>
            )}

            {parsedSkills(detailedMonster.skills).length > 0 && (
              <div style={{ margin: '12px 0' }}>
                <h4 style={{ margin: '0 0 8px' }}>Compétences</h4>
                {parsedSkills(detailedMonster.skills).map((sk, i) => (
                  <div key={i} style={{ padding: '6px 8px', background: '#f9f9f9', borderRadius: 4, marginBottom: 4 }}>
                    <strong>{sk.name}</strong>{sk.desc && <span style={{ color: '#666', marginLeft: 8 }}>{sk.desc}</span>}
                  </div>
                ))}
              </div>
            )}
            {detailedMonster && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button onClick={() => { setCardMonster(detailedMonster); }} style={{ padding: '8px 20px' }}>
                  Télécharger la carte
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {cardMonster && <MonsterCard monster={cardMonster} onClose={() => setCardMonster(null)} />}

      {displayedMonsters.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', marginTop: 24 }}>
          {filter === 'unlocked' ? 'Aucun monstre débloqué.' : 'Aucun monstre dans le bestiaire.'}
        </p>
      )}
    </div>
  );
}
