import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM items ORDER BY name ASC').all();
  res.json({ items });
});

router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Objet introuvable' });
  res.json({ item });
});

router.post('/', requireRole('mj'), (req, res) => {
  const { name, effect, lore, weight, icon_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });

  const result = db.prepare(
    'INSERT INTO items (name, effect, lore, weight, icon_url) VALUES (?, ?, ?, ?, ?)'
  ).run(name, effect || '', lore || '', weight ?? 0, icon_url || '');

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ item });
});

router.put('/:id', requireRole('mj'), (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Objet introuvable' });

  const { name, effect, lore, weight, icon_url } = req.body;
  db.prepare('UPDATE items SET name=?, effect=?, lore=?, weight=?, icon_url=? WHERE id=?')
    .run(name ?? existing.name, effect ?? existing.effect, lore ?? existing.lore,
      weight ?? existing.weight, icon_url ?? existing.icon_url, req.params.id);

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  res.json({ item });
});

router.delete('/:id', requireRole('mj'), (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Objet introuvable' });

  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
