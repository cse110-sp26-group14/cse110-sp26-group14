/**
 * SQLite database layer (team-shared).
 * @module lib/database
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'sitrep.db');
const SEED_PATH = path.join(__dirname, '..', 'data', 'seed.json');

/** @type {import('better-sqlite3').Database|null} */
let db = null;

/**
 * @returns {import('better-sqlite3').Database}
 */
export function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    migrate();
    seedIfEmpty();
  }
  return db;
}

function migrate() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT,
      avatar TEXT,
      is_admin INTEGER DEFAULT 0,
      availability_json TEXT DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY,
      name TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT
    );
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY,
      sprint_id INTEGER,
      title TEXT,
      date TEXT,
      time TEXT,
      format TEXT,
      location TEXT,
      zoom_link TEXT,
      goal TEXT
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      title TEXT,
      owner TEXT,
      sprint_id INTEGER,
      priority TEXT,
      status TEXT,
      due TEXT,
      source TEXT
    );
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY,
      title TEXT,
      severity TEXT,
      status TEXT,
      tags_json TEXT,
      author TEXT,
      assignee TEXT,
      sprint_id INTEGER,
      created TEXT,
      description TEXT
    );
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      sprint_id INTEGER,
      date TEXT,
      status TEXT,
      mood TEXT,
      progress TEXT,
      blockers TEXT,
      notes TEXT,
      timestamp TEXT
    );
    CREATE TABLE IF NOT EXISTS ai_logs (
      id INTEGER PRIMARY KEY,
      type TEXT,
      title TEXT,
      status TEXT,
      content TEXT,
      timestamp TEXT,
      details_json TEXT
    );
    CREATE TABLE IF NOT EXISTS availability (
      date TEXT,
      user_id INTEGER,
      slots_json TEXT,
      PRIMARY KEY (date, user_id)
    );
  `);
  try {
    getDb().exec('ALTER TABLE tasks ADD COLUMN source TEXT');
  } catch {
    /* column exists */
  }
  try {
    getDb().exec('ALTER TABLE issues ADD COLUMN due TEXT');
  } catch {
    /* column exists */
  }
  getDb().exec(`
    UPDATE tasks
    SET due = (
      SELECT end_date FROM sprints WHERE sprints.id = tasks.sprint_id
    )
    WHERE (due IS NULL OR due = '')
      AND sprint_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM sprints WHERE sprints.id = tasks.sprint_id AND end_date IS NOT NULL)
  `);
}

function seedIfEmpty() {
  const count = getDb().prepare('SELECT COUNT(*) AS c FROM users').get();
  if (count.c > 0) return;

  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  const insUser = getDb().prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar, is_admin, availability_json)
    VALUES (@id, @name, @email, @password_hash, @role, @avatar, @is_admin, '{}')
  `);

  const demoHash = hashPassword('demo1234');
  const users = [
    { id: 1, name: 'Maya Patel', email: 'maya@team.local', role: 'Project Manager', avatar: 'MP', is_admin: 1 },
    { id: 2, name: 'Alex Chen', email: 'alex@team.local', role: 'Frontend', avatar: 'AC', is_admin: 0 },
    { id: 3, name: 'Jordan Lee', email: 'jordan@team.local', role: 'Backend', avatar: 'JL', is_admin: 0 },
    { id: 4, name: 'Priya Shah', email: 'priya@team.local', role: 'QA / Testing', avatar: 'PS', is_admin: 0 },
    { id: 5, name: 'Sam Rivera', email: 'sam@team.local', role: 'Documentation', avatar: 'SR', is_admin: 0 },
  ];
  users.forEach((u) => insUser.run({ ...u, password_hash: demoHash }));

  const insSprint = getDb().prepare(`
    INSERT INTO sprints (id, name, start_date, end_date, status) VALUES (@id, @name, @start, @end, @status)
  `);
  seed.sprints.forEach((s) => insSprint.run({
    id: s.id, name: s.name, start: s.start, end: s.end, status: s.status,
  }));

  seed.meetings?.forEach((m) => {
    getDb().prepare(`
      INSERT INTO meetings (id, sprint_id, title, date, time, format, location, zoom_link, goal)
      VALUES (@id, @sprintId, @title, @date, @time, @format, @location, @zoomLink, @goal)
    `).run(m);
  });

  seed.tasks.forEach((t) => {
    getDb().prepare(`
      INSERT INTO tasks (id, title, owner, sprint_id, priority, status, due)
      VALUES (@id, @title, @owner, @sprintId, @priority, @status, @due)
    `).run({
      id: t.id, title: t.title, owner: t.owner, sprintId: t.sprintId,
      priority: t.priority, status: t.status, due: t.due,
    });
  });

  seed.issues.forEach((i) => {
    getDb().prepare(`
      INSERT INTO issues (id, title, severity, status, tags_json, author, assignee, sprint_id, created, description)
      VALUES (@id, @title, @severity, @status, @tags, @author, @assignee, @sprintId, @created, @description)
    `).run({
      ...i, tags: JSON.stringify(i.tags || []), sprintId: i.sprintId,
    });
  });

  seed.reports.forEach((r) => {
    getDb().prepare(`
      INSERT INTO reports (id, user_id, sprint_id, date, status, mood, progress, blockers, notes, timestamp)
      VALUES (@id, @userId, @sprintId, @date, @status, @mood, @progress, @blockers, @notes, @timestamp)
    `).run({
      id: r.id, userId: r.userId, sprintId: 2, date: r.date, status: r.status,
      mood: r.mood, progress: r.progress, blockers: r.blockers, notes: r.notes || '',
      timestamp: r.timestamp,
    });
  });

  seed.aiLogs.forEach((l) => {
    getDb().prepare(`
      INSERT INTO ai_logs (id, type, title, status, content, timestamp, details_json)
      VALUES (@id, @type, @title, @status, @content, @timestamp, @details)
    `).run({ ...l, details: JSON.stringify(l.details || {}) });
  });

  const avail = seed.availability || {};
  Object.entries(avail).forEach(([date, byUser]) => {
    Object.entries(byUser).forEach(([userId, slots]) => {
      getDb().prepare(`
        INSERT INTO availability (date, user_id, slots_json) VALUES (?, ?, ?)
      `).run([date, Number(userId), JSON.stringify(slots)]);
    });
  });
}

/**
 * @param {string} password
 * @returns {string}
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * @param {string} password
 * @param {string} stored
 * @returns {boolean}
 */
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const attempt = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'));
}

/**
 * @returns {object}
 */
export function getFullState() {
  const d = getDb();
  const users = d.prepare('SELECT id, name, role, avatar, is_admin AS isAdmin, availability_json FROM users').all()
    .map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      isAdmin: Boolean(u.isAdmin),
      availability: JSON.parse(u.availability_json || '{}'),
      isOnline: isUserOnline(u.id),
    }));

  return {
    users,
    sprints: d.prepare('SELECT id, name, start_date AS start, end_date AS end, status FROM sprints').all(),
    meetings: d.prepare('SELECT id, sprint_id AS sprintId, title, date, time, format, location, zoom_link AS zoomLink, goal FROM meetings').all(),
    tasks: d.prepare('SELECT id, title, owner, sprint_id AS sprintId, priority, status, due, source FROM tasks').all(),
    issues: d.prepare('SELECT id, title, severity, status, tags_json, author, assignee, sprint_id AS sprintId, created, description, due FROM issues').all()
      .map((i) => ({
        ...i,
        tags: JSON.parse(i.tags_json || '[]'),
        tags_json: undefined,
        due: i.due || i.created,
      })),
    reports: d.prepare('SELECT id, user_id AS userId, date, status, mood, progress, blockers, notes, timestamp FROM reports ORDER BY timestamp DESC').all(),
    aiLogs: d.prepare('SELECT id, type, title, status, content, timestamp, details_json FROM ai_logs ORDER BY id DESC').all()
      .map((l) => ({ ...l, details: JSON.parse(l.details_json || '{}'), details_json: undefined })),
    availability: buildAvailabilityMap(),
  };
}

/**
 * @param {number} userId
 * @returns {boolean}
 */
function isUserOnline(userId) {
  const row = getDb().prepare(`
    SELECT expires_at FROM sessions WHERE user_id = ? ORDER BY expires_at DESC LIMIT 1
  `).get(userId);
  if (!row) return false;
  return new Date(row.expires_at) > new Date();
}

function buildAvailabilityMap() {
  const rows = getDb().prepare('SELECT date, user_id, slots_json FROM availability').all();
  /** @type {Record<string, Record<string, object>>} */
  const map = {};
  rows.forEach((r) => {
    if (!map[r.date]) map[r.date] = {};
    map[r.date][r.user_id] = JSON.parse(r.slots_json || '{}');
  });
  return map;
}

export function listIssues() {
  return getFullState().issues;
}

/**
 * @param {object} input
 * @returns {object}
 */
export function createIssue(input) {
  const id = (getDb().prepare('SELECT MAX(id) AS m FROM issues').get().m || 0) + 1;
  const created = input.created || new Date().toISOString().slice(0, 10);
  const sprintId = input.sprintId ?? 2;
  let due = input.due ?? null;
  if (!due) {
    const sprint = getDb().prepare('SELECT end_date FROM sprints WHERE id = ?').get(sprintId);
    due = sprint?.end_date ?? created;
  }
  const issue = {
    id,
    title: input.title,
    severity: input.severity || 'medium',
    status: input.status || 'open',
    tags: input.tags || [],
    author: input.author,
    assignee: input.assignee ?? null,
    sprintId,
    created,
    description: input.description || '',
    due,
  };
  getDb().prepare(`
    INSERT INTO issues (id, title, severity, status, tags_json, author, assignee, sprint_id, created, description, due)
    VALUES (@id, @title, @severity, @status, @tags, @author, @assignee, @sprintId, @created, @description, @due)
  `).run({ ...issue, tags: JSON.stringify(issue.tags) });
  return issue;
}

/**
 * @param {object} input
 * @returns {object}
 */
export function createReport(input) {
  const activeSprint = getDb().prepare(`SELECT id FROM sprints WHERE status = 'active' LIMIT 1`).get();
  const id = (getDb().prepare('SELECT MAX(id) AS m FROM reports').get().m || 0) + 1;
  const report = {
    id,
    userId: input.userId,
    sprintId: input.sprintId ?? activeSprint?.id ?? 2,
    date: input.date || new Date().toISOString().slice(0, 10),
    status: input.status || 'In Progress',
    mood: input.mood || 'Neutral',
    progress: input.progress || '',
    blockers: input.blockers || 'None',
    notes: input.notes || '',
    timestamp: input.timestamp || new Date().toISOString(),
  };
  getDb().prepare(`
    INSERT INTO reports (id, user_id, sprint_id, date, status, mood, progress, blockers, notes, timestamp)
    VALUES (@id, @userId, @sprintId, @date, @status, @mood, @progress, @blockers, @notes, @timestamp)
  `).run(report);
  return report;
}

/**
 * @param {object} input
 * @returns {object}
 */
/**
 * @param {object} input
 * @returns {object}
 */
export function createMeeting(input) {
  const id = (getDb().prepare('SELECT MAX(id) AS m FROM meetings').get().m || 0) + 1;
  const meeting = {
    id,
    sprintId: input.sprintId ?? 2,
    title: input.title || 'Team meeting',
    date: input.date || new Date().toISOString().slice(0, 10),
    time: input.time || '10:00 AM',
    format: input.format || 'Zoom',
    location: input.location || '',
    zoomLink: input.zoomLink || '',
    goal: input.goal || '',
  };
  getDb().prepare(`
    INSERT INTO meetings (id, sprint_id, title, date, time, format, location, zoom_link, goal)
    VALUES (@id, @sprintId, @title, @date, @time, @format, @location, @zoomLink, @goal)
  `).run(meeting);
  return meeting;
}

/**
 * @param {number} id
 * @param {object} patch
 * @returns {object|null}
 */
export function updateAiLog(id, patch) {
  const row = getDb().prepare('SELECT * FROM ai_logs WHERE id = ?').get(id);
  if (!row) return null;
  const status = patch.status ?? row.status;
  getDb().prepare('UPDATE ai_logs SET status = ? WHERE id = ?').run(status, id);
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    status,
    content: row.content,
    timestamp: row.timestamp,
    details: JSON.parse(row.details_json || '{}'),
  };
}

export function createTask(input) {
  const id = (getDb().prepare('SELECT MAX(id) AS m FROM tasks').get().m || 0) + 1;
  const sprintId = input.sprintId ?? 2;
  let due = input.due ?? null;
  if (!due) {
    const sprint = getDb().prepare('SELECT end_date FROM sprints WHERE id = ?').get(sprintId);
    due = sprint?.end_date ?? null;
  }
  const task = {
    id,
    title: input.title,
    owner: input.owner ?? null,
    sprintId,
    priority: input.priority || 'medium',
    status: input.status || 'open',
    due,
    source: input.source ?? null,
  };
  getDb().prepare(`
    INSERT INTO tasks (id, title, owner, sprint_id, priority, status, due, source)
    VALUES (@id, @title, @owner, @sprintId, @priority, @status, @due, @source)
  `).run(task);
  return task;
}

/**
 * @param {object} log
 * @returns {object}
 */
export function createAiLog(log) {
  const id = (getDb().prepare('SELECT MAX(id) AS m FROM ai_logs').get().m || 0) + 1;
  const entry = {
    id,
    type: log.type || 'Summary',
    title: log.title || 'AI Log',
    status: log.status || 'approved',
    content: log.content || '',
    timestamp: log.timestamp || new Date().toISOString(),
    details: log.details || {},
  };
  getDb().prepare(`
    INSERT INTO ai_logs (id, type, title, status, content, timestamp, details_json)
    VALUES (@id, @type, @title, @status, @content, @timestamp, @details)
  `).run({ ...entry, details: JSON.stringify(entry.details) });
  return entry;
}

export function listReportsForAi() {
  return getDb().prepare(`
    SELECT r.*, u.name AS user_name FROM reports r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.timestamp DESC LIMIT 50
  `).all();
}

export function listOpenIssuesForAi() {
  return getDb().prepare(`SELECT * FROM issues WHERE status != 'resolved' ORDER BY id DESC`).all();
}

/**
 * @param {number} userId
 * @param {{ name?: string, role?: string }} fields
 * @returns {object|null}
 */
export function updateUserProfile(userId, fields) {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!row) return null;
  const name = fields.name?.trim() || row.name;
  const role = fields.role?.trim() || row.role;
  getDb().prepare('UPDATE users SET name = ?, role = ? WHERE id = ?').run(name, role, userId);
  return getDb().prepare('SELECT id, name, role, avatar, is_admin AS isAdmin FROM users WHERE id = ?').get(userId);
}
