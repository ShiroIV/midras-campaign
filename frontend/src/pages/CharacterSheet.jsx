import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function CharacterSheet() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [allItems, setAllItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');

  useEffect(() => {
    api.characters.get(id).then(d => {
      setCharacter(d.character);
      const inv = JSON.parse(d.character.inventory || '[]');
      setInventory(inv);
    }).catch(() => navigate('/'));
    api.items.list().then(d => setAllItems(d.items)).catch(() => {});
  }, [id]);

  const isOwnerOrMj = user.role === 'mj';

  const addItem = () => {
    if (!selectedItemId) return;
    const item = allItems.find(i => i.id === Number(selectedItemId));
    if (!item) return;

    const existing = inventory.find(i => i.item_id === item.id);
    if (existing) {
      setInventory(inventory.map(i => i.id === existing.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setInventory([...inventory, { id: Date.now(), item_id: item.id, name: item.name, qty: 1, weight: item.weight, effect: item.effect, lore: item.lore }]);
    }
    setSelectedItemId('');
  };

  const addCustomItem = () => {
    const name = prompt('Nom de l\'objet (libre) :');
    if (!name) return;
    setInventory([...inventory, { id: Date.now(), name, qty: 1, weight: 0 }]);
  };

  const changeQty = (index, delta) => {
    setInventory(inventory.map((item, i) => {
      if (i === index) {
        const newQty = item.qty + delta;
        return newQty <= 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeInventoryItem = (itemId) => {
    setInventory(inventory.filter(i => i.id !== itemId));
  };

  const saveInventory = async () => {
    await api.characters.update(id, { inventory: JSON.stringify(inventory) });
    setCharacter({ ...character, inventory: JSON.stringify(inventory) });
    setEditing(false);
  };

  const startEdit = () => {
    setEditData({
      name: character.name, race: character.race,
      force: character.force, int: character.int, agi: character.agi,
      pv_max: character.pv_max, pv_current: character.pv_current,
      mana_max: character.mana_max, mana_current: character.mana_current,
      endurance_max: character.endurance_max, endurance_current: character.endurance_current,
      level: character.level, divinity: character.divinity, spirituality: character.spirituality,
    });
    setEditing(true);
  };

  const saveAll = async () => {
    await api.characters.update(id, { ...editData, inventory: JSON.stringify(inventory) });
    setCharacter({ ...character, ...editData, inventory: JSON.stringify(inventory) });
    setEditing(false);
  };

  const totalWeight = inventory.reduce((sum, i) => sum + (i.weight || 0) * i.qty, 0);

  if (!character) return <div>Chargement...</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>&larr; Retour</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{character.name}</h2>
        {isOwnerOrMj && !editing && <button onClick={startEdit}>Modifier</button>}
        {editing && <button onClick={saveAll} style={{ background: '#4CAF50', color: 'white' }}>Enregistrer</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Stats principales</h3>
          {['force', 'int', 'agi'].map(s => (
            <div key={s} style={{ margin: '8px 0' }}>
              <strong>{s === 'force' ? 'Force' : s === 'int' ? 'Intelligence' : 'Agilité'}:</strong>{' '}
              {editing
                ? <input type="number" value={editData[s]} onChange={e => setEditData({...editData, [s]: +e.target.value})} style={{ width: 80, padding: 4 }} />
                : character[s]
              }
            </div>
          ))}
          <p><strong>Race:</strong> {editing
            ? <input value={editData.race} onChange={e => setEditData({...editData, race: e.target.value})} style={{ padding: 4 }} />
            : character.race || 'Inconnue'
          }</p>
          <p><strong>Niveau:</strong> {editing
            ? <input type="number" value={editData.level} onChange={e => setEditData({...editData, level: +e.target.value})} style={{ width: 60, padding: 4 }} />
            : character.level
          }</p>
        </div>

        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Ressources</h3>
          <p><strong>PV:</strong> {editing
            ? <><input type="number" value={editData.pv_current} onChange={e => setEditData({...editData, pv_current: +e.target.value})} style={{ width: 60, padding: 4 }} /> / <input type="number" value={editData.pv_max} onChange={e => setEditData({...editData, pv_max: +e.target.value})} style={{ width: 60, padding: 4 }} /></>
            : `${character.pv_current} / ${character.pv_max}`
          }</p>
          <p><strong>Mana:</strong> {editing
            ? <><input type="number" value={editData.mana_current} onChange={e => setEditData({...editData, mana_current: +e.target.value})} style={{ width: 60, padding: 4 }} /> / <input type="number" value={editData.mana_max} onChange={e => setEditData({...editData, mana_max: +e.target.value})} style={{ width: 60, padding: 4 }} /></>
            : `${character.mana_current} / ${character.mana_max}`
          }</p>
          <p><strong>Endurance:</strong> {editing
            ? <><input type="number" value={editData.endurance_current} onChange={e => setEditData({...editData, endurance_current: +e.target.value})} style={{ width: 60, padding: 4 }} /> / <input type="number" value={editData.endurance_max} onChange={e => setEditData({...editData, endurance_max: +e.target.value})} style={{ width: 60, padding: 4 }} /></>
            : `${character.endurance_current} / ${character.endurance_max}`
          }</p>
        </div>

        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Stats spirituelles</h3>
          <p><strong>Divinité:</strong> {editing
            ? <input type="number" value={editData.divinity} onChange={e => setEditData({...editData, divinity: +e.target.value})} style={{ width: 80, padding: 4 }} />
            : character.divinity
          } / 100</p>
          <p><strong>Spiritualité:</strong> {editing
            ? <input type="number" value={editData.spirituality} onChange={e => setEditData({...editData, spirituality: +e.target.value})} style={{ width: 80, padding: 4 }} />
            : character.spirituality
          }</p>
        </div>

        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Inventaire</h3>
            <span style={{ fontSize: '0.85em', color: '#666' }}>Poids total: {totalWeight}</span>
          </div>

          {inventory.length === 0 ? <p>Sac vide</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px' }}>Objet</th>
                  <th style={{ padding: '6px 8px', width: 60 }}>Qté</th>
                  <th style={{ padding: '6px 8px', width: 60 }}>Pds</th>
                  <th style={{ padding: '6px 8px' }}>Effet</th>
                  <th style={{ padding: '6px 8px', width: 60 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <strong>{item.name}</strong>
                      {item.lore && <div style={{ fontSize: '0.8em', color: '#999', fontStyle: 'italic' }}>{item.lore}</div>}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <button onClick={() => changeQty(idx, -1)} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 3, padding: '0 6px', cursor: 'pointer' }}>-</button>
                      <span style={{ margin: '0 8px' }}>{item.qty}</span>
                      <button onClick={() => changeQty(idx, 1)} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 3, padding: '0 6px', cursor: 'pointer' }}>+</button>
                    </td>
                    <td style={{ padding: '6px 8px', color: '#666' }}>{(item.weight || 0) * item.qty}</td>
                    <td style={{ padding: '6px 8px', fontSize: '0.85em', color: '#555' }}>{item.effect || '-'}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <button onClick={() => removeInventoryItem(item.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '0.8em' }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} style={{ padding: 6, flex: 1, minWidth: 200 }}>
              <option value="">Ajouter un objet...</option>
              {allItems.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.weight} pd)</option>
              ))}
            </select>
            <button onClick={addItem}>+ Ajouter</button>
            <button onClick={addCustomItem} style={{ fontSize: '0.85em' }}>Texte libre</button>
          </div>

          <button onClick={saveInventory} style={{ marginTop: 12, width: '100%', background: '#4CAF50', color: '#fff' }}>
            Sauvegarder l'inventaire
          </button>
        </div>
      </div>
    </div>
  );
}
