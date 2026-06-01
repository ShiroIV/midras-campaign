import { useRef, useState, useEffect } from 'react';

const TIER_COLORS = {
  common: '#78909c', uncommon: '#4caf50', rare: '#2196f3',
  epic: '#9c27b0', legendary: '#ff9800',
};

export default function MonsterCard({ monster, onClose }) {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const canvasRef = useRef(null);

  const skills = (() => { try { return JSON.parse(monster.skills || '[]'); } catch { return []; } })();

  useEffect(() => {
    if (!monster.image_url) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const crop = {
        x: (monster.crop_x || 0) / 100,
        y: (monster.crop_y || 0) / 100,
        w: (monster.crop_w || 100) / 100,
        h: (monster.crop_h || 100) / 100,
      };
      const c = document.createElement('canvas');
      c.width = img.naturalWidth * crop.w;
      c.height = img.naturalHeight * crop.h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, img.naturalWidth * crop.x, img.naturalHeight * crop.y,
        c.width, c.height, 0, 0, c.width, c.height);
      setPreviewUrl(c.toDataURL('image/png'));
    };
    img.src = monster.image_url;
  }, [monster.image_url, monster.crop_x, monster.crop_y, monster.crop_w, monster.crop_h]);

  const download = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${monster.name.replace(/[^a-zA-Z0-9]/g, '_')}_carte.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('Export error:', e); }
    setExporting(false);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, cursor: 'pointer',
        }}
      >
        <div onClick={e => e.stopPropagation()} style={{ cursor: 'default' }}>
          <div
            ref={cardRef}
            style={{
              width: 340, background: '#fff', borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontFamily: 'Georgia, serif',
            }}
          >
            <div style={{
              background: `linear-gradient(135deg, ${TIER_COLORS[monster.tier] || '#78909c'}, ${TIER_COLORS[monster.tier] || '#78909c'}aa)`,
              padding: '16px 20px', color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 22, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{monster.name}</h2>
                <span style={{
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
                  background: 'rgba(255,255,255,0.3)', padding: '3px 10px', borderRadius: 12,
                }}>{monster.tier}</span>
              </div>
            </div>

            <div style={{ padding: 16, textAlign: 'center', background: '#f5f5f5', borderBottom: '2px solid #eee' }}>
              {previewUrl ? (
                <img src={previewUrl} alt={monster.name}
                  style={{ width: '100%', height: 220, objectFit: 'contain', borderRadius: 8, background: '#fff' }}
                />
              ) : monster.image_url ? (
                <img src={monster.image_url} alt={monster.name}
                  style={{ width: '100%', height: 220, objectFit: 'contain', borderRadius: 8, background: '#fff' }}
                />
              ) : (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 8, color: '#999' }}>
                  Aucune image
                </div>
              )}
            </div>

            <div style={{ padding: 16 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 12,
              }}>
                {[
                  { label: 'FOR', val: monster.force },
                  { label: 'INT', val: monster.int },
                  { label: 'AGI', val: monster.agi },
                  { label: 'PV', val: monster.pv },
                  { label: 'ARM', val: monster.armor },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '6px 0', background: '#f9f9f9', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 'bold', letterSpacing: 1 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {skills.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Compétences</div>
                  {skills.map((sk, i) => (
                    <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                      <strong>{sk.name}</strong>
                      {sk.desc && <span style={{ color: '#666', marginLeft: 4 }}>— {sk.desc}</span>}
                    </div>
                  ))}
                </div>
              )}

              {monster.lore && (
                <div style={{ fontStyle: 'italic', fontSize: 12, color: '#777', borderTop: '1px solid #eee', paddingTop: 8, marginBottom: 8 }}>
                  {monster.lore}
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: 10, color: '#bbb', fontFamily: 'monospace', letterSpacing: 1, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                #{monster.serial_number}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={download} disabled={exporting} style={{ padding: '10px 24px', fontSize: 14 }}>
              {exporting ? 'Génération...' : 'Télécharger la carte (PNG)'}
            </button>
            <button onClick={onClose} style={{ padding: '10px 24px', fontSize: 14 }}>Fermer</button>
          </div>
        </div>
      </div>
    </>
  );
}
