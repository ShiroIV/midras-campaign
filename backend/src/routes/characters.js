import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/campaign/:campaignId', (req, res) => {
  const characters = db.prepare('SELECT * FROM characters WHERE campaign_id = ? ORDER BY created_at ASC').all(req.params.campaignId);
  res.json({ characters });
});

router.post('/campaign/:campaignId', requireRole('mj'), (req, res) => {
  const campaign = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(req.params.campaignId);
  if (!campaign) return res.status(404).json({ error: 'Campagne introuvable' });

  const { name, race, force, int, agi, pv_max, pv_current, mana_max, mana_current, endurance_max, endurance_current, level, divinity, spirituality, inventory, skills } = req.body;

  if (!name) return res.status(400).json({ error: 'Nom requis' });

  const result = db.prepare(`
    INSERT INTO characters (campaign_id, name, race, force, int, agi, pv_max, pv_current, mana_max, mana_current, endurance_max, endurance_current, level, divinity, spirituality, inventory, skills)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.campaignId, name, race || '',
    force ?? 10, int ?? 10, agi ?? 10,
    pv_max ?? 100, pv_current ?? (pv_max ?? 100),
    mana_max ?? 50, mana_current ?? (mana_max ?? 50),
    endurance_max ?? 50, endurance_current ?? (endurance_max ?? 50),
    level ?? 1, divinity ?? 0, spirituality ?? 10,
    inventory || '[]', skills || '[]'
  );

  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ character });
});

router.get('/:id', (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!character) return res.status(404).json({ error: 'Personnage introuvable' });

  const membership = db.prepare(`
    SELECT cp.user_id, cp.campaign_id FROM campaign_players cp
    JOIN characters c ON c.campaign_id = cp.campaign_id
    WHERE c.id = ? AND cp.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!membership && req.user.role !== 'mj') {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  res.json({ character });
});

router.put('/:id', (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!character) return res.status(404).json({ error: 'Personnage introuvable' });

  const membership = db.prepare(`
    SELECT cp.user_id FROM campaign_players cp
    JOIN characters c ON c.campaign_id = cp.campaign_id
    WHERE c.id = ? AND cp.user_id = ?
  `).get(req.params.id, req.user.id);

  const isMj = req.user.role === 'mj';
  const isOwner = !!membership;

  if (!isMj && !isOwner) return res.status(403).json({ error: 'Accès refusé' });

  if (!isMj && !isOwner) return res.status(403).json({ error: 'Accès refusé' });

  const allowedFields = isMj
    ? ['name', 'race', 'force', 'int', 'agi', 'pv_max', 'pv_current', 'mana_max', 'mana_current', 'endurance_max', 'endurance_current', 'level', 'divinity', 'spirituality', 'inventory', 'skills']
    : ['inventory'];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Aucun champ valide à mettre à jour' });
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);

  db.prepare(`UPDATE characters SET ${setClauses} WHERE id = ?`).run(...values, req.params.id);

  const updated = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  res.json({ character: updated });
});

router.delete('/:id', requireRole('mj'), (req, res) => {
  const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!character) return res.status(404).json({ error: 'Personnage introuvable' });

  db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
