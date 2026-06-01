/**
 * D1 database access (async).
 * @module db
 */

import { syncSprintStatusesInDb } from './sprintLifecycle.js';

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
  await syncSprintStatusesInDb(db);

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

  const taskRows = (await db.prepare(
    'SELECT * FROM tasks ORDER BY id',
  ).all()).results;
  const tasks = taskRows.map(rowToTask);

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
 * @param {number} id
 * @param {object} patch
 */
export async function updateIssue(db, id, patch) {
  const row = await db.prepare('SELECT * FROM issues WHERE id = ?').bind(id).first();
  if (!row) return null;

  const tags = patch.tags ?? JSON.parse(row.tags_json || '[]');
  const issue = {
    id: row.id,
    title: patch.title ?? row.title,
    severity: patch.severity ?? row.severity,
    status: patch.status ?? row.status,
    tags,
    author: row.author,
    assignee: patch.assignee ?? row.assignee,
    sprintId: patch.sprintId ?? row.sprint_id,
    created: row.created,
    description: patch.description ?? row.description,
    due: patch.due ?? row.due,
  };

  await db.prepare(`
    UPDATE issues
    SET title=?, severity=?, status=?, tags_json=?, assignee=?, sprint_id=?, description=?, due=?
    WHERE id=?
  `).bind(
    issue.title, issue.severity, issue.status, JSON.stringify(issue.tags), issue.assignee,
    issue.sprintId, issue.description, issue.due, id,
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
 * @param {number} id
 * @param {object} patch
 */
export async function updateReport(db, id, patch) {
  const row = await db.prepare('SELECT * FROM reports WHERE id = ?').bind(id).first();
  if (!row) return null;

  const report = {
    id: row.id,
    userId: row.user_id,
    sprintId: row.sprint_id,
    date: row.date,
    status: patch.status ?? row.status,
    mood: patch.mood ?? row.mood,
    progress: patch.progress ?? row.progress,
    blockers: patch.blockers ?? row.blockers,
    notes: patch.notes ?? row.notes,
    timestamp: row.timestamp,
  };

  await db.prepare(`
    UPDATE reports
    SET status=?, mood=?, progress=?, blockers=?, notes=?
    WHERE id=?
  `).bind(
    report.status, report.mood, report.progress, report.blockers, report.notes, id,
  ).run();

  return report;
}

/**
 * @param {D1Database} db
 * @param {{ name: string, start: string, end: string, status?: string }} input
 */
export async function createSprint(db, input) {
  const max = await db.prepare('SELECT MAX(id) AS m FROM sprints').first();
  const id = (max?.m || 0) + 1;
  const status = input.status || 'planned';
  if (status === 'active') {
    await db.prepare(`UPDATE sprints SET status = 'planned' WHERE status = 'active'`).run();
  }
  const sprint = {
    id,
    name: String(input.name).trim(),
    start: input.start,
    end: input.end,
    status,
  };
  await db.prepare(`
    INSERT INTO sprints (id, name, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, sprint.name, sprint.start, sprint.end, sprint.status).run();
  await syncSprintStatusesInDb(db);
  const row = await db.prepare(
    'SELECT id, name, start_date AS start, end_date AS end, status FROM sprints WHERE id = ?',
  ).bind(id).first();
  return row || sprint;
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
  const assignees = input.assignees ?? (input.owner ? [input.owner] : []);
  const owner = input.owner ?? assignees[0] ?? null;
  const now = new Date().toISOString();
  const task = {
    id,
    title: input.title,
    owner,
    sprintId,
    priority: input.priority || 'medium',
    status: input.status || 'open',
    due,
    source: input.source ?? null,
    assignees,
    parentTaskId: input.parentTaskId ?? null,
    updatedAt: now,
    subtaskReviewStatus: null,
  };
  await db.prepare(`
    INSERT INTO tasks (id, title, owner, sprint_id, priority, status, due, source,
      assignees_json, parent_task_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, task.title, task.owner, sprintId, task.priority, task.status, due, task.source,
    JSON.stringify(assignees), task.parentTaskId, now,
  ).run();
  return task;
}

/**
 * @param {D1Database} db
 * @param {number} id
 * @param {object} patch
 * @param {string|null} [expectedUpdatedAt] - conflict detection: reject if server timestamp differs
 */
export async function updateTask(db, id, patch, expectedUpdatedAt = null) {
  const row = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  if (!row) return { ok: false, error: 'Task not found' };

  if (expectedUpdatedAt && row.updated_at && row.updated_at !== expectedUpdatedAt) {
    return {
      ok: false,
      conflict: true,
      error: 'Task was modified by another user. Reload to see latest version.',
      serverTask: rowToTask(row),
    };
  }

  const now = new Date().toISOString();
  const assignees = patch.assignees ?? JSON.parse(row.assignees_json || '[]');
  const owner = patch.owner ?? (assignees[0] || row.owner);
  const status = patch.status ?? row.status;
  const priority = patch.priority ?? row.priority;
  const title = patch.title ?? row.title;
  const due = patch.due ?? row.due;
  const subtaskReviewStatus = patch.subtaskReviewStatus ?? row.subtask_review_status ?? null;

  await db.prepare(`
    UPDATE tasks SET title=?, owner=?, priority=?, status=?, due=?,
      assignees_json=?, updated_at=?, subtask_review_status=?
    WHERE id=?
  `).bind(title, owner, priority, status, due, JSON.stringify(assignees), now, subtaskReviewStatus, id).run();

  const updated = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  return { ok: true, task: rowToTask(updated) };
}

/**
 * @param {D1Database} db
 * @param {number} parentId
 * @param {object} input
 */
export async function deleteTask(db, id) {
  await db.prepare('DELETE FROM tasks WHERE id = ? OR parent_task_id = ?').bind(id, id).run();
}

export async function createSubtask(db, parentId, input) {
  const parent = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(parentId).first();
  if (!parent) return null;
  return createTask(db, {
    ...input,
    parentTaskId: parentId,
    sprintId: parent.sprint_id,
    due: input.due ?? parent.due,
    source: 'subtask',
  });
}

/**
 * @param {D1Database} db
 * @param {number} parentId
 */
export async function getSubtasks(db, parentId) {
  const rows = (await db.prepare(
    'SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY id',
  ).bind(parentId).all()).results;
  return rows.map(rowToTask);
}

/**
 * @param {D1Database} db
 * @param {number} subtaskId
 * @param {string} completedBy
 */
export async function completeSubtask(db, subtaskId, completedBy) {
  const row = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(subtaskId).first();
  if (!row) return { ok: false, error: 'Subtask not found' };
  const assignees = JSON.parse(row.assignees_json || '[]');
  if (assignees.length > 0 && !assignees.includes(completedBy)) {
    return { ok: false, error: 'Only the assigned person can complete this subtask.' };
  }

  const now = new Date().toISOString();
  await db.prepare(
    `UPDATE tasks SET status='resolved', updated_at=? WHERE id=?`,
  ).bind(now, subtaskId).run();

  if (row.parent_task_id) {
    const siblings = (await db.prepare(
      `SELECT status FROM tasks WHERE parent_task_id = ?`,
    ).bind(row.parent_task_id).all()).results;
    const allDone = siblings.every((s) => s.status === 'resolved');
    if (allDone) {
      await db.prepare(
        `UPDATE tasks SET subtask_review_status='pending', updated_at=? WHERE id=?`,
      ).bind(now, row.parent_task_id).run();
      const maxR = await db.prepare('SELECT MAX(id) AS m FROM task_reviews').first();
      await db.prepare(
        `INSERT INTO task_reviews (id, parent_task_id, status, created) VALUES (?, ?, 'pending', ?)`,
      ).bind((maxR?.m || 0) + 1, row.parent_task_id, now).run();
    }
  }

  const updated = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(subtaskId).first();
  return { ok: true, task: rowToTask(updated) };
}

/**
 * @param {D1Database} db
 */
export async function getActiveUsers(db) {
  const rows = (await db.prepare(`
    SELECT u.id, u.name, u.role, u.avatar
    FROM users u
    JOIN sessions s ON s.user_id = u.id
    WHERE s.expires_at > ?
    GROUP BY u.id
  `).bind(new Date().toISOString()).all()).results;
  return rows;
}

/**
 * @param {object} row
 */
function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    owner: row.owner,
    sprintId: row.sprint_id,
    priority: row.priority,
    status: row.status,
    due: row.due,
    source: row.source,
    assignees: JSON.parse(row.assignees_json || '[]'),
    parentTaskId: row.parent_task_id ?? null,
    updatedAt: row.updated_at ?? null,
    subtaskReviewStatus: row.subtask_review_status ?? null,
  };
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
  const title = patch.title ?? row.title;
  const type = patch.type ?? row.type;
  const status = patch.status ?? row.status;
  const content = patch.content ?? row.content;
  await db.prepare(`
    UPDATE ai_logs SET title = ?, type = ?, status = ?, content = ? WHERE id = ?
  `).bind(title, type, status, content, id).run();
  return {
    id: row.id,
    type,
    title,
    status,
    content,
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
