import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads', 'monsters');
mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `monster-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function generateSerial() {
  while (true) {
    const s = `${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const existing = db.prepare('SELECT id FROM monsters WHERE serial_number = ?').get(s);
    if (!existing) return s;
  }
}

const router = Router();
router.use(authenticate);

router.get('/', requireRole('mj'), (req, res) => {
  const monsters = db.prepare('SELECT * FROM monsters ORDER BY created_at DESC').all();
  res.json({ monsters });
});

router.get('/list/:campaignId', (req, res) => {
  const monsters = db.prepare('SELECT id, serial_number, name, tier, image_url FROM monsters ORDER BY name ASC').all();
  res.json({ monsters });
});

router.get('/:id', (req, res) => {
  const monster = db.prepare('SELECT * FROM monsters WHERE id = ?').get(req.params.id);
  if (!monster) return res.status(404).json({ error: 'Monstre introuvable' });
  res.json({ monster });
});

const parseMonsterBody = (req) => {
  if (req.is('multipart/form-data')) {
    return {
      name: req.body.name, force: req.body.force, int: req.body.int, agi: req.body.agi,
      pv: req.body.pv, armor: req.body.armor, skills: req.body.skills, lore: req.body.lore,
      tier: req.body.tier, crop_x: req.body.crop_x, crop_y: req.body.crop_y,
      crop_w: req.body.crop_w, crop_h: req.body.crop_h,
      imageFile: req.file,
    };
  }
  return { ...req.body, imageFile: undefined };
};

router.post('/', requireRole('mj'), (req, res, next) => {
  if (req.is('multipart/form-data')) return upload.single('image')(req, res, next);
  next();
}, (req, res) => {
  const data = parseMonsterBody(req);
  if (!data.name) return res.status(400).json({ error: 'Nom requis' });

  const serial = generateSerial();
  const imageUrl = data.imageFile ? `/uploads/monsters/${data.imageFile.filename}` : '';

  const result = db.prepare(`
    INSERT INTO monsters (serial_number, name, image_url, crop_x, crop_y, crop_w, crop_h, force, int, agi, pv, armor, skills, lore, tier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    serial, data.name, imageUrl,
    data.crop_x ?? 0, data.crop_y ?? 0, data.crop_w ?? 100, data.crop_h ?? 100,
    data.force ?? 10, data.int ?? 10, data.agi ?? 10,
    data.pv ?? 50, data.armor ?? 0,
    data.skills || '[]', data.lore || '', data.tier || 'common'
  );

  const monster = db.prepare('SELECT * FROM monsters WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ monster });
});

router.put('/:id', requireRole('mj'), (req, res, next) => {
  if (req.is('multipart/form-data')) return upload.single('image')(req, res, next);
  next();
}, (req, res) => {
  const existing = db.prepare('SELECT * FROM monsters WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Monstre introuvable' });

  const data = parseMonsterBody(req);
  const imageUrl = data.imageFile ? `/uploads/monsters/${data.imageFile.filename}` : existing.image_url;

  db.prepare(`
    UPDATE monsters SET name=?, image_url=?, crop_x=?, crop_y=?, crop_w=?, crop_h=?,
    force=?, int=?, agi=?, pv=?, armor=?, skills=?, lore=?, tier=?
    WHERE id=?
  `).run(
    data.name ?? existing.name, imageUrl,
    data.crop_x ?? existing.crop_x, data.crop_y ?? existing.crop_y,
    data.crop_w ?? existing.crop_w, data.crop_h ?? existing.crop_h,
    data.force ?? existing.force, data.int ?? existing.int, data.agi ?? existing.agi,
    data.pv ?? existing.pv, data.armor ?? existing.armor,
    data.skills ?? existing.skills, data.lore ?? existing.lore,
    data.tier ?? existing.tier,
    req.params.id
  );

  const monster = db.prepare('SELECT * FROM monsters WHERE id = ?').get(req.params.id);
  res.json({ monster });
});

router.delete('/:id', requireRole('mj'), (req, res) => {
  const existing = db.prepare('SELECT * FROM monsters WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Monstre introuvable' });

  db.prepare('DELETE FROM player_bestiary WHERE monster_id = ?').run(req.params.id);
  db.prepare('DELETE FROM monsters WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/unlock', (req, res) => {
  const { serial_number, character_id } = req.body;
  if (!serial_number || !character_id) return res.status(400).json({ error: 'Code sériel et personnage requis' });

  const monster = db.prepare('SELECT * FROM monsters WHERE serial_number = ?').get(serial_number);
  if (!monster) return res.status(404).json({ error: 'Code sériel invalide' });

  const existing = db.prepare('SELECT id FROM player_bestiary WHERE player_id = ? AND monster_id = ?').get(character_id, monster.id);
  if (existing) return res.status(409).json({ error: 'Monstre déjà débloqué' });

  db.prepare('INSERT INTO player_bestiary (player_id, monster_id) VALUES (?, ?)').run(character_id, monster.id);
  res.status(201).json({ monster });
});

router.get('/unlocked/:characterId', (req, res) => {
  const monsters = db.prepare(`
    SELECT m.* FROM monsters m
    JOIN player_bestiary pb ON pb.monster_id = m.id
    WHERE pb.player_id = ?
    ORDER BY pb.unlocked_at DESC
  `).all(req.params.characterId);

  res.json({ monsters });
});

export default router;
