import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads', 'maps');
mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(authenticate);

router.get('/campaign/:campaignId', (req, res) => {
  const maps = db.prepare('SELECT * FROM maps WHERE campaign_id = ? ORDER BY created_at ASC').all(req.params.campaignId);
  res.json({ maps });
});

router.post('/campaign/:campaignId', requireRole('mj'), upload.single('image'), (req, res) => {
  const { campaignId } = req.params;
  const { name, slug } = req.body;

  const campaign = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(campaignId);
  if (!campaign) return res.status(404).json({ error: 'Campagne introuvable' });

  if (!name || !req.file) return res.status(400).json({ error: 'Nom et image requis' });

  const imageUrl = `/uploads/maps/${req.file.filename}`;
  const mapSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const result = db.prepare('INSERT INTO maps (campaign_id, name, image_url, slug) VALUES (?, ?, ?, ?)').run(campaignId, name, imageUrl, mapSlug);
  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ map });
});

router.get('/:id', (req, res) => {
  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(req.params.id);
  if (!map) return res.status(404).json({ error: 'Carte introuvable' });

  const pins = db.prepare('SELECT * FROM pins WHERE map_id = ? ORDER BY created_at ASC').all(req.params.id);
  const filteredPins = req.user.role === 'mj' ? pins : pins.filter(p => p.visible_to_players);

  res.json({ map, pins: filteredPins });
});

router.put('/:id', requireRole('mj'), (req, res) => {
  const existing = db.prepare('SELECT * FROM maps WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Carte introuvable' });

  const { name } = req.body;
  db.prepare('UPDATE maps SET name = ? WHERE id = ?').run(name || existing.name, req.params.id);
  const map = db.prepare('SELECT * FROM maps WHERE id = ?').get(req.params.id);
  res.json({ map });
});

router.delete('/:id', requireRole('mj'), (req, res) => {
  const existing = db.prepare('SELECT * FROM maps WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Carte introuvable' });

  db.prepare('DELETE FROM pins WHERE map_id = ?').run(req.params.id);
  db.prepare('DELETE FROM maps WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:mapId/pins', requireRole('mj'), (req, res) => {
  const { mapId } = req.params;
  const map = db.prepare('SELECT id FROM maps WHERE id = ?').get(mapId);
  if (!map) return res.status(404).json({ error: 'Carte introuvable' });

  const { x, y, label, description, icon_type, visible_to_players } = req.body;
  if (x === undefined || y === undefined) return res.status(400).json({ error: 'Position x, y requise' });

  const result = db.prepare(
    'INSERT INTO pins (map_id, x, y, label, description, icon_type, visible_to_players) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(mapId, x, y, label || '', description || '', icon_type || 'pin', visible_to_players !== undefined ? (visible_to_players ? 1 : 0) : 1);

  const pin = db.prepare('SELECT * FROM pins WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ pin });
});

router.put('/:mapId/pins/:pinId', requireRole('mj'), (req, res) => {
  const { mapId, pinId } = req.params;
  const existing = db.prepare('SELECT * FROM pins WHERE id = ? AND map_id = ?').get(pinId, mapId);
  if (!existing) return res.status(404).json({ error: 'Pin introuvable' });

  const { x, y, label, description, icon_type, visible_to_players } = req.body;
  db.prepare(
    'UPDATE pins SET x=?, y=?, label=?, description=?, icon_type=?, visible_to_players=? WHERE id=? AND map_id=?'
  ).run(
    x ?? existing.x, y ?? existing.y,
    label ?? existing.label, description ?? existing.description,
    icon_type ?? existing.icon_type,
    visible_to_players !== undefined ? (visible_to_players ? 1 : 0) : existing.visible_to_players,
    pinId, mapId
  );

  const pin = db.prepare('SELECT * FROM pins WHERE id = ?').get(pinId);
  res.json({ pin });
});

router.delete('/:mapId/pins/:pinId', requireRole('mj'), (req, res) => {
  const { mapId, pinId } = req.params;
  db.prepare('DELETE FROM pins WHERE id = ? AND map_id = ?').run(pinId, mapId);
  res.json({ success: true });
});

export default router;
