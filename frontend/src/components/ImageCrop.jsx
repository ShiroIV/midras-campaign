import { useState, useRef, useEffect } from 'react';

export default function ImageCrop({ src, onCrop, initialCrop }) {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [crop, setCrop] = useState(initialCrop || { x: 10, y: 10, w: 80, h: 80 });
  const [dragging, setDragging] = useState(null);

  const handleMouseDown = (e, handle) => {
    e.preventDefault();
    setDragging(handle);
  };

  const handleMouseMove = (e) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    setCrop(prev => {
      let c = { ...prev };
      const min = 5;
      switch (dragging) {
        case 'se': c.w = Math.max(min, px - c.x); c.h = Math.max(min, py - c.y); break;
        case 'ne': c.x = Math.min(px, c.x + c.w - min); c.w = Math.max(min, (c.x + c.w) - px); c.h = Math.max(min, py - c.y); break;
        case 'sw': c.y = Math.min(py, c.y + c.h - min); c.w = Math.max(min, px - c.x); c.h = Math.max(min, (c.y + c.h) - py); break;
        case 'nw': c.x = Math.min(px, c.x + c.w - min); c.y = Math.min(py, c.y + c.h - min); c.w = Math.max(min, (c.x + c.w) - px); c.h = Math.max(min, (c.y + c.h) - py); break;
        case 'move':
          c.x = Math.max(0, Math.min(100 - c.w, px - (prev._ox || 0)));
          c.y = Math.max(0, Math.min(100 - c.h, py - (prev._oy || 0)));
          break;
        case 'e': c.w = Math.max(min, px - c.x); break;
        case 'w': c.x = Math.min(px, c.x + c.w - min); c.w = Math.max(min, (c.x + c.w) - px); break;
        case 's': c.h = Math.max(min, py - c.y); break;
        case 'n': c.y = Math.min(py, c.y + c.h - min); c.h = Math.max(min, (c.y + c.h) - py); break;
      }
      return c;
    });
  };

  const handleMouseUp = () => setDragging(null);

  const handleMoveStart = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ox = ((e.clientX - rect.left) / rect.width) * 100;
    const oy = ((e.clientY - rect.top) / rect.height) * 100;
    setCrop(prev => ({ ...prev, _ox: ox - prev.x, _oy: oy - prev.y }));
    setDragging('move');
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [dragging]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', userSelect: 'none' }}
        onMouseDown={handleMoveStart}
      >
        <img ref={imgRef} src={src} alt="Crop" style={{ display: 'block', maxWidth: '100%', pointerEvents: 'none' }} />

        <div style={{
          position: 'absolute', left: `${crop.x}%`, top: `${crop.y}%`,
          width: `${crop.w}%`, height: `${crop.h}%`,
          border: '2px solid #fff', outline: '1px solid rgba(0,0,0,0.5)',
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', cursor: 'move',
          pointerEvents: 'auto',
        }} />

        {['nw', 'ne', 'sw', 'se'].map(h => (
          <div key={h} onMouseDown={(e) => handleMouseDown(e, h)}
            style={{
              position: 'absolute', width: 12, height: 12, background: '#fff', border: '2px solid #1976d2',
              borderRadius: '50%', cursor: `${h}-resize`, zIndex: 2,
              left: h.includes('w') ? `${crop.x - 0.5}%` : `${crop.x + crop.w - 0.5}%`,
              top: h.includes('n') ? `${crop.y - 0.5}%` : `${crop.y + crop.h - 0.5}%`,
              transform: 'translate(-50%, -50%)', pointerEvents: 'auto',
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => onCrop && onCrop(crop)}>Valider le crop</button>
        <span style={{ fontSize: '0.8em', color: '#666' }}>
          Position: {Math.round(crop.x)}%,{Math.round(crop.y)}% — Taille: {Math.round(crop.w)}×{Math.round(crop.h)}
        </span>
      </div>
    </div>
  );
}
