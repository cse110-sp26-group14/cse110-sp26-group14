/**
 * D1 database access (async).
 * @module db
 */

/**
 * @param {D1Database} db
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
async function isUserOnline(db, userId) {
  const row = await db.prepare(`
    SELECT expires_at FROM sessions WHERE user_id = ? ORDER BY expires_at DESC LIMIT 1
  `).bind(userId).first();
  if (!row) return false;
  return new Date(row.expires_at) > new Date();
}

/**
 * Load full app state for GET /api/state.
 * @param {D1Database} db
 * @returns {Promise<object>}
 */
export async function getFullState(db) {
  const userRows = (await db.prepare(
    'SELECT id, name, role, avatar, is_admin AS isAdmin, availability_json FROM users',
  ).all()).results;
  const users = await Promise.all(userRows.map(async (u) => ({
    ...u,
    isAdmin: Boolean(u.isAdmin),
    availability: JSON.parse(u.availability_json || '{}'),
    isOnline: await isUserOnline(db, u.id),
  })));

  const sprints = (await db.prepare(
    'SELECT id, name, start_date AS start, end_date AS end, status FROM sprints',
  ).all()).results;

  const meetings = (await db.prepare(
    'SELECT id, sprint_id AS sprintId, title, date, time, format, location, zoom_link AS zoomLink, goal FROM meetings',
  ).all()).results;

  const tasks = (await db.prepare(
    'SELECT id, title, owner, sprint_id AS sprintId, priority, status, due, source FROM tasks',
  ).all()).results;

  const issues = (await db.prepare(
    'SELECT id, title, severity, status, tags_json, author, assignee, sprint_id AS sprintId, created, description, due FROM issues',
  ).all()).results.map((i) => ({
    ...i,
    tags: JSON.parse(i.tags_json || '[]'),
    due: i.due || i.created,
  }));

  const reports = (await db.prepare(
    'SELECT id, user_id AS userId, sprint_id AS sprintId, date, status, mood, progress, blockers, notes, timestamp FROM reports ORDER BY timestamp DESC',
  ).all()).results;

  const aiLogs = (await db.prepare(
    'SELECT id, type, title, status, content, timestamp, details_json FROM ai_logs ORDER BY id DESC',
  ).all()).results.map((l) => ({
    ...l,
    details: JSON.parse(l.details_json || '{}'),
  }));

  const availRows = (await db.prepare('SELECT date, user_id, slots_json FROM availability').all()).results;
  const availability = {};
  availRows.forEach((r) => {
    if (!availability[r.date]) availability[r.date] = {};
    availability[r.date][r.user_id] = JSON.parse(r.slots_json || '{}');
  });

  return { users, sprints, meetings, tasks, issues, reports, aiLogs, availability };
}

/**
 * @param {D1Database} db
 * @param {object} input
 */
export async function createIssue(db, input) {
  const max = await db.prepare('SELECT MAX(id) AS m FROM issues').first();
  const id = (max?.m || 0) + 1;
  const created = input.created || new Date().toISOString().slice(0, 10);
  const sprintId = input.sprintId ?? 2;
  let due = input.due ?? null;
  if (!due) {
    const sprint = await db.prepare('SELECT end_date FROM sprints WHERE id = ?').bind(sprintId).first();
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
  await db.prepare(`
    INSERT INTO issues (id, title, severity, status, tags_json, author, assignee, sprint_id, created, description, due)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, issue.title, issue.severity, issue.status, JSON.stringify(issue.tags),
    issue.author, issue.assignee, sprintId, created, issue.description, due,
  ).run();
  return issue;
}

/**
 * @param {D1Database} db
 * @param {object} input
 */
export async function createReport(db, input) {
  const active = await db.prepare(`SELECT id FROM sprints WHERE status = 'active' LIMIT 1`).first();
  const max = await db.prepare('SELECT MAX(id) AS m FROM reports').first();
  const id = (max?.m || 0) + 1;
  const report = {
    id,
    userId: input.userId,
    sprintId: input.sprintId ?? active?.id ?? 2,
    date: input.date || new Date().toISOString().slice(0, 10),
    status: input.status || 'In Progress',
    mood: input.mood || 'Neutral',
    progress: input.progress || '',
    blockers: input.blockers || 'None',
    notes: input.notes || '',
    timestamp: input.timestamp || new Date().toISOString(),
  };
  await db.prepare(`
    INSERT INTO reports (id, user_id, sprint_id, date, status, mood, progress, blockers, notes, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, report.userId, report.sprintId, report.date, report.status, report.mood,
    report.progress, report.blockers, report.notes, report.timestamp,
  ).run();
  return report;
}

/**
 * @param {D1Database} db
 * @param {object} input
 */
export async function createTask(db, input) {
  const max = await db.prepare('SELECT MAX(id) AS m FROM tasks').first();
  const id = (max?.m || 0) + 1;
  const sprintId = input.sprintId ?? 2;
  let due = input.due ?? null;
  if (!due) {
    const sprint = await db.prepare('SELECT end_date FROM sprints WHERE id = ?').bind(sprintId).first();
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
  await db.prepare(`
    INSERT INTO tasks (id, title, owner, sprint_id, priority, status, due, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, task.title, task.owner, sprintId, task.priority, task.status, due, task.source).run();
  return task;
}

/**
 * @param {D1Database} db
 * @param {object} input
 */
export async function createMeeting(db, input) {
  const max = await db.prepare('SELECT MAX(id) AS m FROM meetings').first();
  const id = (max?.m || 0) + 1;
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
  await db.prepare(`
    INSERT INTO meetings (id, sprint_id, title, date, time, format, location, zoom_link, goal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, meeting.sprintId, meeting.title, meeting.date, meeting.time,
    meeting.format, meeting.location, meeting.zoomLink, meeting.goal,
  ).run();
  return meeting;
}

/**
 * @param {D1Database} db
 * @param {object} log
 */
export async function createAiLog(db, log) {
  const max = await db.prepare('SELECT MAX(id) AS m FROM ai_logs').first();
  const id = (max?.m || 0) + 1;
  const entry = {
    id,
    type: log.type || 'Summary',
    title: log.title || 'AI Log',
    status: log.status || 'approved',
    content: log.content || '',
    timestamp: log.timestamp || new Date().toISOString(),
    details: log.details || {},
  };
  await db.prepare(`
    INSERT INTO ai_logs (id, type, title, status, content, timestamp, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, entry.type, entry.title, entry.status, entry.content, entry.timestamp,
    JSON.stringify(entry.details),
  ).run();
  return entry;
}

/**
 * @param {D1Database} db
 * @param {number} id
 * @param {object} patch
 */
export async function updateAiLog(db, id, patch) {
  const row = await db.prepare('SELECT * FROM ai_logs WHERE id = ?').bind(id).first();
  if (!row) return null;
  const status = patch.status ?? row.status;
  await db.prepare('UPDATE ai_logs SET status = ? WHERE id = ?').bind(status, id).run();
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

/**
 * @param {D1Database} db
 */
export async function listReportsForAi(db) {
  return (await db.prepare(`
    SELECT r.*, u.name AS user_name FROM reports r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.timestamp DESC LIMIT 50
  `).all()).results;
}

/**
 * @param {D1Database} db
 */
export async function listOpenIssuesForAi(db) {
  return (await db.prepare(`SELECT * FROM issues WHERE status != 'resolved' ORDER BY id DESC`).all()).results;
}

/**
 * @param {D1Database} db
 * @param {number} userId
 * @param {{ name?: string, role?: string }} fields
 */
export async function updateUserProfile(db, userId, fields) {
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!row) return null;
  const name = fields.name?.trim() || row.name;
  const role = fields.role?.trim() || row.role;
  await db.prepare('UPDATE users SET name = ?, role = ? WHERE id = ?').bind(name, role, userId).run();
  return db.prepare('SELECT id, name, role, avatar, is_admin AS isAdmin FROM users WHERE id = ?').bind(userId).first();
}
