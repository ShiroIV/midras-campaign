import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import ImageCrop from '../components/ImageCrop';
import MonsterCard from '../components/MonsterCard';

export default function MonstersAdmin() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [monsters, setMonsters] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropData, setCropData] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [cardMonster, setCardMonster] = useState(null);

  const [form, setForm] = useState({
    name: '', force: 10, int: 10, agi: 10, pv: 50, armor: 0,
    skills: '[]', lore: '', tier: 'common', image: null,
  });

  useEffect(() => {
    if (user.role === 'mj') {
      api.monsters.listAll().then(d => setMonsters(d.monsters)).catch(() => {});
    }
  }, [refresh, user]);

  const openCreate = () => {
    setForm({ name: '', force: 10, int: 10, agi: 10, pv: 50, armor: 0, skills: '[]', lore: '', tier: 'common', image: null });
    setEditing(null);
    setCropSrc(null);
    setCropData(null);
    setShowForm(true);
  };

  const openEdit = (m) => {
    setForm({
      name: m.name, force: m.force, int: m.int, agi: m.agi,
      pv: m.pv, armor: m.armor, skills: m.skills, lore: m.lore, tier: m.tier, image: null,
    });
    setEditing(m.id);
    setCropSrc(null);
    setCropData({ x: m.crop_x, y: m.crop_y, w: m.crop_w, h: m.crop_h });
    setShowForm(true);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({ ...form, image: file });
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target.result);
      setCropData(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = (data) => {
    setCropData(data);
    setCropSrc(null);
  };

  const removeCrop = () => {
    setCropData(null);
    setCropSrc(null);
  };

  const save = async () => {
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('force', form.force);
    fd.append('int', form.int);
    fd.append('agi', form.agi);
    fd.append('pv', form.pv);
    fd.append('armor', form.armor);
    fd.append('skills', form.skills);
    fd.append('lore', form.lore);
    fd.append('tier', form.tier);
    if (cropData) {
      fd.append('crop_x', cropData.x);
      fd.append('crop_y', cropData.y);
      fd.append('crop_w', cropData.w);
      fd.append('crop_h', cropData.h);
    }
    if (form.image) fd.append('image', form.image);

    if (editing) {
      await api.monsters.update(editing, fd);
    } else {
      await api.monsters.create(fd);
    }
    setShowForm(false);
    setRefresh(r => r + 1);
  };

  const deleteMonster = async (id, name) => {
    if (!confirm(`Supprimer ${name} ?`)) return;
    await api.monsters.delete(id);
    setRefresh(r => r + 1);
  };

  const skillsArr = (s) => {
    try { return JSON.parse(s); } catch { return []; }
  };

  return (
    <div>
      <button onClick={() => navigate(`/campaigns/${campaignId}`)} style={{ marginBottom: 12 }}>&larr; Retour</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Bestiaire — Administration</h2>
        {!showForm && <button onClick={openCreate}>Nouveau monstre</button>}
      </div>

      {showForm && (
        <div style={{ margin: '16px 0', padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>{editing ? 'Modifier' : 'Créer'} un monstre</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, margin: '12px 0' }}>
            <div><label>Nom *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ width: '100%', padding: 6 }} /></div>
            <div><label>Tier</label><select value={form.tier} onChange={e => setForm({...form, tier: e.target.value})} style={{ width: '100%', padding: 6 }}>
              <option value="common">Commun</option><option value="uncommon">Peu commun</option>
              <option value="rare">Rare</option><option value="epic">Épique</option><option value="legendary">Légendaire</option>
            </select></div>
            <div><label>Image</label><input type="file" accept="image/*" onChange={handleImageSelect} style={{ width: '100%', padding: 4 }} /></div>
            <div><label>Force</label><input type="number" value={form.force} onChange={e => setForm({...form, force: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
            <div><label>Intelligence</label><input type="number" value={form.int} onChange={e => setForm({...form, int: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
            <div><label>Agilité</label><input type="number" value={form.agi} onChange={e => setForm({...form, agi: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
            <div><label>PV</label><input type="number" value={form.pv} onChange={e => setForm({...form, pv: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
            <div><label>Armure</label><input type="number" value={form.armor} onChange={e => setForm({...form, armor: +e.target.value})} style={{ width: '100%', padding: 6 }} /></div>
            <div style={{ gridColumn: 'span 3' }}><label>Compétences (JSON)</label><textarea value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} rows={2} style={{ width: '100%', padding: 6 }} /></div>
            <div style={{ gridColumn: 'span 3' }}><label>Lore / Description</label><textarea value={form.lore} onChange={e => setForm({...form, lore: e.target.value})} rows={3} style={{ width: '100%', padding: 6 }} /></div>
          </div>

          {cropSrc && (
            <div style={{ margin: '12px 0', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
              <h4>Rogner l'image</h4>
              <ImageCrop src={cropSrc} onCrop={handleCrop} />
            </div>
          )}

          {cropData && !cropSrc && (
            <div style={{ margin: '12px 0', padding: 8, background: '#e8f5e9', borderRadius: 4 }}>
              Crop défini : ({Math.round(cropData.x)}%, {Math.round(cropData.y)}%) {Math.round(cropData.w)}×{Math.round(cropData.h)}
              <button onClick={removeCrop} style={{ marginLeft: 12, fontSize: '0.8em' }}>Modifier</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save}>{editing ? 'Enregistrer' : 'Créer'}</button>
            <button onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {monsters.length === 0 ? (
        <p>Aucun monstre dans le bestiaire.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {monsters.map(m => (
            <div key={m.id} style={{ display: 'flex', gap: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8, alignItems: 'start' }}>
              {m.image_url ? (
                <img src={m.image_url} alt={m.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }} />
              ) : (
                <div style={{ width: 80, height: 80, background: '#eee', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8em', color: '#999' }}>N/A</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{m.name}</strong>
                  <span style={{ fontSize: '0.8em', padding: '2px 8px', background: '#e3f2fd', borderRadius: 4 }}>{m.tier}</span>
                </div>
                <div style={{ fontSize: '0.85em', color: '#555', marginTop: 4 }}>
                  F:{m.force} I:{m.int} A:{m.agi} | PV:{m.pv} Armure:{m.armor}
                </div>
                <div style={{ fontSize: '0.8em', color: '#888', marginTop: 2 }}>
                  Code: {m.serial_number}
                </div>
                {m.lore && <p style={{ fontSize: '0.85em', margin: '4px 0 0', color: '#666' }}>{m.lore}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => openEdit(m)} style={{ fontSize: '0.8em' }}>Modifier</button>
                <button onClick={() => setCardMonster(m)} style={{ fontSize: '0.8em' }}>Carte</button>
                <button onClick={() => deleteMonster(m.id, m.name)} style={{ fontSize: '0.8em', color: 'red' }}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cardMonster && <MonsterCard monster={cardMonster} onClose={() => setCardMonster(null)} />}
    </div>
  );
}
