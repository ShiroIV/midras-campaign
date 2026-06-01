import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', (req, res) => {
  const campaigns = db.prepare(`
    SELECT c.* FROM campaigns c
    JOIN campaign_players cp ON cp.campaign_id = c.id
    WHERE cp.user_id = ?
    ORDER BY c.created_at DESC
  `).all(req.user.id);
  res.json({ campaigns });
});

router.post('/', requireRole('mj'), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nom requis' });

  const result = db.prepare('INSERT INTO campaigns (name, description) VALUES (?, ?)').run(name, description || '');

  db.prepare('INSERT INTO campaign_players (user_id, campaign_id, character_id) VALUES (?, ?, NULL)').run(req.user.id, result.lastInsertRowid);

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ campaign });
});

router.get('/:id', (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campagne introuvable' });

  const players = db.prepare(`
    SELECT u.id, u.username, u.role, cp.character_id, c.name as character_name
    FROM campaign_players cp
    JOIN users u ON u.id = cp.user_id
    LEFT JOIN characters c ON c.id = cp.character_id
    WHERE cp.campaign_id = ?
  `).all(req.params.id);

  res.json({ campaign, players });
});

router.put('/:id', requireRole('mj'), (req, res) => {
  const { name, description } = req.body;
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Campagne introuvable' });

  db.prepare('UPDATE campaigns SET name = ?, description = ? WHERE id = ?')
    .run(name || existing.name, description !== undefined ? description : existing.description, req.params.id);

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ campaign });
});

router.delete('/:id', requireRole('mj'), (req, res) => {
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Campagne introuvable' });

  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/players', requireRole('mj'), (req, res) => {
  const { username } = req.body;
  const user = db.prepare('SELECT id, username, role FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const existing = db.prepare('SELECT id FROM campaign_players WHERE user_id = ? AND campaign_id = ?').get(user.id, req.params.id);
  if (existing) return res.status(409).json({ error: 'Déjà membre' });

  db.prepare('INSERT INTO campaign_players (user_id, campaign_id) VALUES (?, ?)').run(user.id, req.params.id);
  res.status(201).json({ user });
});

router.delete('/:id/players/:userId', requireRole('mj'), (req, res) => {
  db.prepare('DELETE FROM campaign_players WHERE user_id = ? AND campaign_id = ?').run(req.params.userId, req.params.id);
  res.json({ success: true });
});

router.get('/:id/stats', requireRole('mj'), (req, res) => {
  const { id } = req.params;

  const characters = db.prepare('SELECT COUNT(*) as c FROM characters WHERE campaign_id = ?').get(id).c;
  const players = db.prepare('SELECT COUNT(*) as c FROM campaign_players cp JOIN users u ON u.id = cp.user_id WHERE cp.campaign_id = ? AND u.role = \'player\'').get(id).c;
  const items = db.prepare('SELECT COUNT(*) as c FROM items').get().c;
  const monsters = db.prepare('SELECT COUNT(*) as c FROM monsters').get().c;
  const maps = db.prepare('SELECT COUNT(*) as c FROM maps WHERE campaign_id = ?').get(id).c;
  const pins = db.prepare('SELECT COUNT(*) as c FROM pins p JOIN maps m ON m.id = p.map_id WHERE m.campaign_id = ?').get(id).c;
  const events = db.prepare('SELECT COUNT(*) as c FROM calendar_events WHERE campaign_id = ?').get(id).c;
  const seasons = db.prepare('SELECT COUNT(*) as c FROM seasons WHERE campaign_id = ?').get(id).c;

  const calendarState = db.prepare('SELECT * FROM calendar_state WHERE campaign_id = ?').get(id);

  res.json({
    stats: { characters, players, items, monsters, maps, pins, events, seasons },
    calendarState: calendarState || { year: 1, month: 1, week: 1, day: 1 },
  });
});

export default router;
