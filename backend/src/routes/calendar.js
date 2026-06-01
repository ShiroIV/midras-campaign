import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const DAYS_PER_WEEK = 10;
const WEEKS_PER_MONTH = 4;
const MONTHS_PER_YEAR = 10;
const DAYS_PER_MONTH = DAYS_PER_WEEK * WEEKS_PER_MONTH;
const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

function absDay(state) {
  return (state.year - 1) * DAYS_PER_YEAR + (state.month - 1) * DAYS_PER_MONTH + (state.week - 1) * DAYS_PER_WEEK + state.day;
}

function getCurrentSeason(campaignId, state) {
  const seasons = db.prepare('SELECT * FROM seasons WHERE campaign_id = ? ORDER BY start_month, start_day').all(campaignId);
  const currentAbs = absDay(state);
  let currentSeason = null;

  for (const s of seasons) {
    const seasonAbs = (state.year - 1) * DAYS_PER_YEAR + (s.start_month - 1) * DAYS_PER_MONTH + s.start_day;
    if (seasonAbs <= currentAbs) {
      currentSeason = s;
    }
  }
  if (!currentSeason && seasons.length > 0) {
    currentSeason = seasons[seasons.length - 1];
  }
  return currentSeason;
}

function initCalendarState(campaignId) {
  let state = db.prepare('SELECT * FROM calendar_state WHERE campaign_id = ?').get(campaignId);
  if (!state) {
    db.prepare('INSERT INTO calendar_state (campaign_id, year, month, week, day) VALUES (?, 1, 1, 1, 1)').run(campaignId);
    state = db.prepare('SELECT * FROM calendar_state WHERE campaign_id = ?').get(campaignId);
  }
  return state;
}

router.get('/:campaignId', (req, res) => {
  const { campaignId } = req.params;
  const state = initCalendarState(Number(campaignId));

  const events = db.prepare('SELECT * FROM calendar_events WHERE campaign_id = ? ORDER BY year, month, day').all(campaignId);
  const seasons = db.prepare('SELECT * FROM seasons WHERE campaign_id = ? ORDER BY start_month, start_day').all(campaignId);
  const currentSeason = getCurrentSeason(campaignId, state);

  res.json({
    calendar: {
      daysPerWeek: DAYS_PER_WEEK,
      weeksPerMonth: WEEKS_PER_MONTH,
      monthsPerYear: MONTHS_PER_YEAR,
      daysPerMonth: DAYS_PER_MONTH,
      daysPerYear: DAYS_PER_YEAR,
    },
    state,
    events,
    seasons,
    currentSeason,
  });
});

router.put('/:campaignId/state', requireRole('mj'), (req, res) => {
  const { campaignId } = req.params;
  const { year, month, week, day } = req.body;

  const state = initCalendarState(Number(campaignId));
  const y = year ?? state.year;
  const m = month ?? state.month;
  const w = week ?? state.week;
  const d = day ?? state.day;

  if (m < 1 || m > MONTHS_PER_YEAR || w < 1 || w > WEEKS_PER_MONTH || d < 1 || d > DAYS_PER_WEEK) {
    return res.status(400).json({ error: 'Date invalide' });
  }

  db.prepare('UPDATE calendar_state SET year = ?, month = ?, week = ?, day = ? WHERE campaign_id = ?')
    .run(y, m, w, d, campaignId);

  const newState = initCalendarState(Number(campaignId));
  const currentSeason = getCurrentSeason(campaignId, newState);
  const events = db.prepare(`
    SELECT * FROM calendar_events
    WHERE campaign_id = ?
      AND ((year = ? AND month = ? AND day = ?) OR repeat != 'none')
    ORDER BY month, day
  `).all(campaignId, y, m, d);

  res.json({ state: newState, currentSeason, todayEvents: events });
});

router.post('/:campaignId/advance', requireRole('mj'), (req, res) => {
  const { campaignId } = req.params;
  const { unit = 'day', amount = 1 } = req.body;
  const state = initCalendarState(Number(campaignId));

  let { year, month, week, day } = state;
  let remaining = amount;

  while (remaining > 0) {
    if (unit === 'day') {
      day += remaining;
      remaining = 0;
    } else if (unit === 'week') {
      day += remaining * DAYS_PER_WEEK;
      remaining = 0;
    } else if (unit === 'month') {
      day += remaining * DAYS_PER_MONTH;
      remaining = 0;
    }

    while (day > DAYS_PER_WEEK) {
      day -= DAYS_PER_WEEK;
      week++;
      if (week > WEEKS_PER_MONTH) {
        week = 1;
        month++;
        if (month > MONTHS_PER_YEAR) {
          month = 1;
          year++;
        }
      }
    }
  }

  db.prepare('UPDATE calendar_state SET year=?, month=?, week=?, day=? WHERE campaign_id=?')
    .run(year, month, week, day, campaignId);

  const newState = initCalendarState(Number(campaignId));
  const currentSeason = getCurrentSeason(campaignId, newState);
  const todayEvents = db.prepare(`
    SELECT * FROM calendar_events
    WHERE campaign_id = ?
      AND ((year = ? AND month = ? AND day = ?) OR (repeat = 'yearly' AND month = ? AND day = ?))
    ORDER BY title
  `).all(campaignId, year, month, day, month, day);

  res.json({ state: newState, currentSeason, todayEvents });
});

router.get('/:campaignId/events', (req, res) => {
  const { campaignId } = req.params;
  const { month, year } = req.query;
  let query = 'SELECT * FROM calendar_events WHERE campaign_id = ?';
  const params = [campaignId];

  if (month) {
    query += ' AND month = ?';
    params.push(Number(month));
  }
  if (year) {
    query += ' AND (year = ? OR year IS NULL OR repeat != \'none\')';
    params.push(Number(year));
  }

  query += ' ORDER BY month, day';
  const events = db.prepare(query).all(...params);
  res.json({ events });
});

router.post('/:campaignId/events', requireRole('mj'), (req, res) => {
  const { campaignId } = req.params;
  const { title, description, year, month, day, type, repeat } = req.body;

  if (!title || !month || !day) {
    return res.status(400).json({ error: 'Titre, mois et jour requis' });
  }

  const result = db.prepare(
    'INSERT INTO calendar_events (campaign_id, year, month, day, title, description, type, repeat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(campaignId, year ?? null, month, day, title, description || '', type || 'normal', repeat || 'none');

  const event = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ event });
});

router.put('/:campaignId/events/:eventId', requireRole('mj'), (req, res) => {
  const { campaignId, eventId } = req.params;
  const existing = db.prepare('SELECT * FROM calendar_events WHERE id = ? AND campaign_id = ?').get(eventId, campaignId);
  if (!existing) return res.status(404).json({ error: 'Événement introuvable' });

  const { title, description, year, month, day, type, repeat } = req.body;
  db.prepare(`
    UPDATE calendar_events SET title=?, description=?, year=?, month=?, day=?, type=?, repeat=?
    WHERE id=? AND campaign_id=?
  `).run(
    title ?? existing.title,
    description ?? existing.description,
    year !== undefined ? year : existing.year,
    month ?? existing.month,
    day ?? existing.day,
    type ?? existing.type,
    repeat ?? existing.repeat,
    eventId, campaignId
  );

  const event = db.prepare('SELECT * FROM calendar_events WHERE id = ?').get(eventId);
  res.json({ event });
});

router.delete('/:campaignId/events/:eventId', requireRole('mj'), (req, res) => {
  const { campaignId, eventId } = req.params;
  db.prepare('DELETE FROM calendar_events WHERE id = ? AND campaign_id = ?').run(eventId, campaignId);
  res.json({ success: true });
});

router.get('/:campaignId/seasons', (req, res) => {
  const { campaignId } = req.params;
  const seasons = db.prepare('SELECT * FROM seasons WHERE campaign_id = ? ORDER BY start_month, start_day').all(campaignId);
  res.json({ seasons });
});

router.post('/:campaignId/seasons', requireRole('mj'), (req, res) => {
  const { campaignId } = req.params;
  const { name, start_month, start_day, weather_table, stat_modifiers } = req.body;

  if (!name || !start_month || !start_day) {
    return res.status(400).json({ error: 'Nom, mois et jour de début requis' });
  }

  const result = db.prepare(
    'INSERT INTO seasons (campaign_id, name, start_month, start_day, weather_table, stat_modifiers) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(campaignId, name, start_month, start_day, weather_table || '{}', stat_modifiers || '{}');

  const season = db.prepare('SELECT * FROM seasons WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ season });
});

router.put('/:campaignId/seasons/:seasonId', requireRole('mj'), (req, res) => {
  const { campaignId, seasonId } = req.params;
  const existing = db.prepare('SELECT * FROM seasons WHERE id = ? AND campaign_id = ?').get(seasonId, campaignId);
  if (!existing) return res.status(404).json({ error: 'Saison introuvable' });

  const { name, start_month, start_day, weather_table, stat_modifiers } = req.body;
  db.prepare(`
    UPDATE seasons SET name=?, start_month=?, start_day=?, weather_table=?, stat_modifiers=?
    WHERE id=? AND campaign_id=?
  `).run(
    name ?? existing.name,
    start_month ?? existing.start_month,
    start_day ?? existing.start_day,
    weather_table ?? existing.weather_table,
    stat_modifiers ?? existing.stat_modifiers,
    seasonId, campaignId
  );

  const season = db.prepare('SELECT * FROM seasons WHERE id = ?').get(seasonId);
  res.json({ season });
});

router.delete('/:campaignId/seasons/:seasonId', requireRole('mj'), (req, res) => {
  const { campaignId, seasonId } = req.params;
  db.prepare('DELETE FROM seasons WHERE id = ? AND campaign_id = ?').run(seasonId, campaignId);
  res.json({ success: true });
});

export default router;
