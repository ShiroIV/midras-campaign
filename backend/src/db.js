import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');

mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(join(DATA_DIR, 'midras.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('mj', 'player')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS campaign_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    character_id INTEGER,
    UNIQUE(user_id, campaign_id)
  );

  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    race TEXT DEFAULT '',
    force INTEGER DEFAULT 10,
    int INTEGER DEFAULT 10,
    agi INTEGER DEFAULT 10,
    pv_max INTEGER DEFAULT 100,
    pv_current INTEGER DEFAULT 100,
    mana_max INTEGER DEFAULT 50,
    mana_current INTEGER DEFAULT 50,
    endurance_max INTEGER DEFAULT 50,
    endurance_current INTEGER DEFAULT 50,
    level INTEGER DEFAULT 1,
    divinity INTEGER DEFAULT 0,
    spirituality INTEGER DEFAULT 10,
    inventory TEXT DEFAULT '[]',
    skills TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    effect TEXT DEFAULT '',
    lore TEXT DEFAULT '',
    weight REAL DEFAULT 0,
    icon_url TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS monsters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    crop_x REAL DEFAULT 0,
    crop_y REAL DEFAULT 0,
    crop_w REAL DEFAULT 100,
    crop_h REAL DEFAULT 100,
    force INTEGER DEFAULT 10,
    int INTEGER DEFAULT 10,
    agi INTEGER DEFAULT 10,
    pv INTEGER DEFAULT 50,
    armor INTEGER DEFAULT 0,
    skills TEXT DEFAULT '[]',
    lore TEXT DEFAULT '',
    tier TEXT DEFAULT 'common',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS player_bestiary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    monster_id INTEGER NOT NULL REFERENCES monsters(id) ON DELETE CASCADE,
    unlocked_at TEXT DEFAULT (datetime('now')),
    UNIQUE(player_id, monster_id)
  );

  CREATE TABLE IF NOT EXISTS maps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    map_id INTEGER NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    x REAL NOT NULL,
    y REAL NOT NULL,
    label TEXT DEFAULT '',
    description TEXT DEFAULT '',
    icon_type TEXT DEFAULT 'pin',
    visible_to_players INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS calendar_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    year INTEGER DEFAULT 1,
    month INTEGER DEFAULT 1,
    week INTEGER DEFAULT 1,
    day INTEGER DEFAULT 1,
    UNIQUE(campaign_id)
  );

  CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    year INTEGER DEFAULT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT DEFAULT 'normal',
    repeat TEXT DEFAULT 'none' CHECK(repeat IN ('none', 'yearly', 'monthly')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_month INTEGER NOT NULL,
    start_day INTEGER NOT NULL,
    weather_table TEXT DEFAULT '{}',
    stat_modifiers TEXT DEFAULT '{}'
  );
`);

export default db;
