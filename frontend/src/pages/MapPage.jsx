import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function MapPage() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const imgRef = useRef(null);

  const [maps, setMaps] = useState([]);
  const [currentMap, setCurrentMap] = useState(null);
  const [pins, setPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [addingPin, setAddingPin] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [pinForm, setPinForm] = useState({ label: '', description: '', icon_type: 'pin', visible_to_players: true });
  const [newPinPos, setNewPinPos] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const isMj = user.role === 'mj';

  useEffect(() => {
    api.maps.list(campaignId).then(d => {
      setMaps(d.maps);
      if (d.maps.length > 0 && !currentMap) setCurrentMap(d.maps[0].id);
    });
  }, [campaignId, refresh]);

  useEffect(() => {
    if (currentMap) {
      api.maps.get(currentMap).then(d => {
        setCurrentMap(d.map.id);
        setPins(d.pins);
      });
    }
  }, [currentMap, refresh]);

  const activeMap = maps.find(m => m.id === currentMap);

  const handleImageClick = (e) => {
    if (!addingPin || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewPinPos({ x, y });
  };

  const createPin = async () => {
    if (!newPinPos || !currentMap) return;
    const d = await api.maps.pins.create(currentMap, {
      x: newPinPos.x, y: newPinPos.y, ...pinForm,
    });
    setPins([...pins, d.pin]);
    setNewPinPos(null);
    setAddingPin(false);
    setPinForm({ label: '', description: '', icon_type: 'pin', visible_to_players: true });
  };

  const deletePin = async (pinId) => {
    if (!confirm('Supprimer ce pin ?')) return;
    await api.maps.pins.delete(currentMap, pinId);
    setPins(pins.filter(p => p.id !== pinId));
    setSelectedPin(null);
  };

  const togglePinVisibility = async (pin) => {
    const d = await api.maps.pins.update(currentMap, pin.id, { visible_to_players: !pin.visible_to_players });
    setPins(pins.map(p => p.id === pin.id ? d.pin : p));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadName || !uploadFile) return;
    const formData = new FormData();
    formData.append('name', uploadName);
    formData.append('image', uploadFile);
    const d = await api.maps.upload(campaignId, formData);
    setMaps([...maps, d.map]);
    setCurrentMap(d.map.id);
    setShowUploadForm(false);
    setUploadName('');
    setUploadFile(null);
  };

  const deleteMap = async (mapId) => {
    if (!confirm('Supprimer cette carte et tous ses pins ?')) return;
    await api.maps.delete(mapId);
    const remaining = maps.filter(m => m.id !== mapId);
    setMaps(remaining);
    if (currentMap === mapId) setCurrentMap(remaining.length > 0 ? remaining[0].id : null);
    setSelectedPin(null);
  };

  return (
    <div>
      <button onClick={() => navigate(`/campaigns/${campaignId}`)} style={{ marginBottom: 12 }}>&larr; Retour</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Cartes</h2>
        {isMj && <button onClick={() => setShowUploadForm(!showUploadForm)}>Ajouter une carte</button>}
      </div>

      {isMj && showUploadForm && (
        <form onSubmit={handleUpload} style={{ margin: '12px 0', padding: 16, border: '1px solid #ccc', borderRadius: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="Nom de la carte" required style={{ padding: 8, flex: 1 }} />
          <input type="file" accept="image/*" onChange={e => setUploadFile(e.target.files[0])} required style={{ padding: 4 }} />
          <button type="submit">Uploader</button>
          <button type="button" onClick={() => setShowUploadForm(false)}>Annuler</button>
        </form>
      )}

      {maps.length === 0 ? (
        <p style={{ marginTop: 24 }}>Aucune carte. {isMj && 'Ajoutez-en une !'}</p>
      ) : (
        <>
          <div style={{ margin: '12px 0', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {maps.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={() => { setCurrentMap(m.id); setSelectedPin(null); setAddingPin(false); }}
                  style={{
                    padding: '6px 14px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer',
                    background: currentMap === m.id ? '#1976d2' : '#fff',
                    color: currentMap === m.id ? '#fff' : '#333',
                    fontWeight: currentMap === m.id ? 'bold' : 'normal',
                  }}
                >
                  {m.name}
                </button>
                {isMj && <button onClick={() => deleteMap(m.id)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '0.8em' }}>✕</button>}
              </div>
            ))}
            {isMj && activeMap && (
              <button
                onClick={() => { setAddingPin(!addingPin); setNewPinPos(null); }}
                style={{
                  padding: '6px 14px', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer',
                  background: addingPin ? '#e65100' : '#fff', color: addingPin ? '#fff' : '#333',
                }}
              >
                {addingPin ? 'Annuler placement' : 'Ajouter un pin'}
              </button>
            )}
          </div>

          {activeMap && (
            <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', background: '#f0f0f0' }}>
              <img
                ref={imgRef}
                src={activeMap.image_url}
                alt={activeMap.name}
                style={{ width: '100%', display: 'block', cursor: addingPin ? 'crosshair' : 'default' }}
                onClick={handleImageClick}
              />

              {pins.map(pin => (
                <div
                  key={pin.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedPin(pin); setAddingPin(false); }}
                  style={{
                    position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)',
                    cursor: 'pointer', zIndex: 10,
                  }}
                  title={pin.label}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50% 50% 50% 0', background: pin.visible_to_players ? '#d32f2f' : '#999',
                    transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}>
                    <span style={{ transform: 'rotate(45deg)', color: '#fff', fontSize: 12, lineHeight: 1 }}>📍</span>
                  </div>
                  <div style={{
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: -28,
                    background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: 4,
                    fontSize: 12, whiteSpace: 'nowrap', display: pin === selectedPin ? 'block' : 'none',
                  }}>
                    {pin.label}
                  </div>
                </div>
              ))}

              {isMj && newPinPos && (
                <div style={{
                  position: 'absolute', left: `${newPinPos.x}%`, top: `${newPinPos.y}%`, transform: 'translate(-50%, -100%)',
                  zIndex: 20, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  width: 220,
                }}>
                  <div style={{ fontSize: '0.8em', marginBottom: 8, color: '#666' }}>
                    Position: ({Math.round(newPinPos.x)}, {Math.round(newPinPos.y)})
                  </div>
                  <input value={pinForm.label} onChange={e => setPinForm({...pinForm, label: e.target.value})} placeholder="Nom du lieu" style={{ width: '100%', padding: 6, marginBottom: 4 }} />
                  <input value={pinForm.description} onChange={e => setPinForm({...pinForm, description: e.target.value})} placeholder="Description" style={{ width: '100%', padding: 6, marginBottom: 4 }} />
                  <label style={{ fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <input type="checkbox" checked={pinForm.visible_to_players} onChange={e => setPinForm({...pinForm, visible_to_players: e.target.checked})} />
                    Visible par les joueurs
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={createPin} style={{ flex: 1 }}>Ajouter</button>
                    <button onClick={() => setNewPinPos(null)}>Annuler</button>
                  </div>
                </div>
              )}

              {selectedPin && !newPinPos && (
                <div style={{
                  position: 'absolute', left: `${selectedPin.x}%`, top: `${selectedPin.y}%`,
                  transform: 'translate(-50%, -120%)', zIndex: 20, background: '#fff', padding: 12,
                  borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', minWidth: 200,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{selectedPin.label}</strong>
                    <button onClick={() => setSelectedPin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                  {selectedPin.description && <p style={{ margin: '4px 0', fontSize: '0.9em', color: '#555' }}>{selectedPin.description}</p>}
                  <div style={{ fontSize: '0.8em', color: '#888' }}>
                    {!selectedPin.visible_to_players && <span style={{ color: 'red' }}>Caché des joueurs</span>}
                  </div>
                  {isMj && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                      <button onClick={() => togglePinVisibility(selectedPin)} style={{ fontSize: '0.8em' }}>
                        {selectedPin.visible_to_players ? 'Cacher' : 'Montrer'}
                      </button>
                      <button onClick={() => deletePin(selectedPin.id)} style={{ fontSize: '0.8em', color: 'red' }}>Supprimer</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
