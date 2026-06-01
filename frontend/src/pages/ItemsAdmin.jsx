import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function ItemsAdmin() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', effect: '', lore: '', weight: 0 });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    api.items.list().then(d => setItems(d.items)).catch(() => {});
  }, [refresh]);

  const openCreate = () => {
    setForm({ name: '', effect: '', lore: '', weight: 0 });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({ name: item.name, effect: item.effect, lore: item.lore, weight: item.weight });
    setEditing(item.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name) return;
    if (editing) {
      await api.items.update(editing, form);
    } else {
      await api.items.create(form);
    }
    setShowForm(false);
    setRefresh(r => r + 1);
  };

  const deleteItem = async (id, name) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    await api.items.delete(id);
    setRefresh(r => r + 1);
  };

  return (
    <div>
      <button onClick={() => navigate(`/campaigns/${campaignId}`)} style={{ marginBottom: 12 }}>&larr; Retour</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Objets — Administration</h2>
        {!showForm && <button onClick={openCreate}>Nouvel objet</button>}
      </div>

      {showForm && (
        <div style={{ margin: '16px 0', padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>{editing ? 'Modifier' : 'Créer'} un objet</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '12px 0' }}>
            <div><label>Nom *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ width: '100%', padding: 6 }} /></div>
            <div><label>Poids</label><input type="number" step="0.1" value={form.weight} onChange={e => setForm({...form, weight: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
            <div style={{ gridColumn: 'span 2' }}><label>Effet</label><textarea value={form.effect} onChange={e => setForm({...form, effect: e.target.value})} rows={2} style={{ width: '100%', padding: 6 }} /></div>
            <div style={{ gridColumn: 'span 2' }}><label>Lore</label><textarea value={form.lore} onChange={e => setForm({...form, lore: e.target.value})} rows={2} style={{ width: '100%', padding: 6 }} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save}>{editing ? 'Enregistrer' : 'Créer'}</button>
            <button onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ marginTop: 24 }}>Aucun objet. Créez-en un !</p>
      ) : (
        <div style={{ marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Nom</th>
                <th style={{ padding: 8 }}>Poids</th>
                <th style={{ padding: 8 }}>Effet</th>
                <th style={{ padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}><strong>{item.name}</strong></td>
                  <td style={{ padding: 8 }}>{item.weight}</td>
                  <td style={{ padding: 8, color: '#666', fontSize: '0.9em' }}>{item.effect || '-'}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={() => openEdit(item)} style={{ fontSize: '0.8em', marginRight: 4 }}>Modifier</button>
                    <button onClick={() => deleteItem(item.id, item.name)} style={{ fontSize: '0.8em', color: 'red' }}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
