/**
 * SE SitRep API — Vanilla Node.js (SQLite, auth, OpenAI).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq < 1) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
}

import http from 'http';
import { sendJson, readBody, parseJsonBody, getBearerToken } from './lib/httpUtil.js';
import {
  getDb, getFullState, listIssues, createIssue, createReport, createTask, createAiLog,
  listReportsForAi, listOpenIssuesForAi, updateUserProfile,
} from './lib/database.js';
import { signUp, login, logout, getUserFromToken } from './lib/auth.js';
import { generateTeamSummary, generateTaskSuggestions, isOpenAiConfigured } from './lib/openai.js';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

getDb();

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
async function handleRequest(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method || 'GET';

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const raw = ['POST', 'PUT', 'PATCH'].includes(method) ? await readBody(req) : '';
  const body = parseJsonBody(req, raw);
  const token = getBearerToken(req);
  const user = getUserFromToken(token);

  try {
    if (method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, {
        ok: true,
        service: 'se-sitrep-backend',
        ai: {
          provider: 'deepseek',
          configured: isOpenAiConfigured(),
          model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
        },
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/auth/signup') {
      const result = signUp(body);
      sendJson(res, result.ok ? 201 : 400, result);
      return;
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const result = login(body);
      sendJson(res, result.ok ? 200 : 401, result);
      return;
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      logout(token);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (method === 'GET' && pathname === '/api/auth/me') {
      if (!user) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
      }
      sendJson(res, 200, { user });
      return;
    }

    if (!user && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && pathname !== '/api/health') {
      sendJson(res, 401, { error: 'Login required' });
      return;
    }

    if (method === 'GET' && pathname === '/api/state') {
      sendJson(res, 200, getFullState());
      return;
    }

    if (method === 'GET' && pathname === '/api/issues') {
      sendJson(res, 200, listIssues());
      return;
    }

    if (method === 'POST' && pathname === '/api/issues') {
      const issue = createIssue(body);
      sendJson(res, 201, issue);
      return;
    }

    if (method === 'PATCH' && /^\/api\/issues\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const status = body.status || 'resolved';
      getDb().prepare('UPDATE issues SET status = ? WHERE id = ?').run(status, id);
      const row = getDb().prepare('SELECT * FROM issues WHERE id = ?').get(id);
      if (!row) {
        sendJson(res, 404, { error: 'Issue not found' });
        return;
      }
      sendJson(res, 200, {
        ...row,
        tags: JSON.parse(row.tags_json || '[]'),
        sprintId: row.sprint_id,
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/reports') {
      const report = createReport({
        ...body,
        userId: body.userId ?? user.profileUserId,
      });
      sendJson(res, 201, report);
      return;
    }

    if (method === 'POST' && pathname === '/api/tasks') {
      const task = createTask(body);
      sendJson(res, 201, task);
      return;
    }

    if (method === 'PUT' && pathname === '/api/users/me') {
      const updated = updateUserProfile(user.profileUserId, {
        name: body.name,
        role: body.role,
      });
      if (!updated) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }
      sendJson(res, 200, {
        user: {
          id: String(updated.id),
          profileUserId: updated.id,
          name: updated.name,
          email: user.email,
          role: updated.role,
          avatar: updated.avatar,
          isAdmin: Boolean(updated.is_admin ?? updated.isAdmin),
        },
      });
      return;
    }

    if (method === 'PUT' && pathname === '/api/availability') {
      const date = body.date || new Date().toISOString().slice(0, 10);
      const userId = body.userId ?? user.profileUserId;
      const slots = body.slots || {};
      getDb().prepare(`
        INSERT INTO availability (date, user_id, slots_json) VALUES (?, ?, ?)
        ON CONFLICT(date, user_id) DO UPDATE SET slots_json = excluded.slots_json
      `).run(date, userId, JSON.stringify(slots));
      getDb().prepare('UPDATE users SET availability_json = ? WHERE id = ?').run(
        JSON.stringify(slots),
        userId,
      );
      const state = getFullState();
      sendJson(res, 200, { ok: true, date, userId, slots, availability: state.availability });
      return;
    }

    if (method === 'POST' && pathname === '/api/ai/logs') {
      const log = createAiLog({
        type: body.type || 'Note',
        title: body.title || 'Team Note',
        status: 'approved',
        content: body.content || '',
        details: body.details || { input: 'Manual note', reviewer: user.name },
      });
      sendJson(res, 201, { log });
      return;
    }

    if (method === 'POST' && pathname === '/api/ai/team-summary') {
      const reports = listReportsForAi();
      const issues = listOpenIssuesForAi();
      let summary;
      try {
        summary = await generateTeamSummary(reports, issues);
      } catch (err) {
        sendJson(res, 503, { error: err.message });
        return;
      }
      const log = createAiLog({
        type: 'Summary',
        title: 'AI Team Summary Generated',
        status: 'approved',
        content: summary.content,
        details: summary.details,
      });
      sendJson(res, 200, { log, ...summary });
      return;
    }

    if (method === 'POST' && pathname === '/api/ai/suggest-tasks') {
      if (!user.isAdmin) {
        sendJson(res, 403, { error: 'Admin only' });
        return;
      }
      const goals = body.goals || body.input || 'Sprint goals';
      const issues = listOpenIssuesForAi();
      let result;
      try {
        result = await generateTaskSuggestions(goals, issues);
      } catch (err) {
        sendJson(res, 503, { error: err.message });
        return;
      }
      const created = result.tasks.map((t) => createTask({
        title: t.title,
        priority: t.priority || 'medium',
        owner: user.name,
        sprintId: body.sprintId ?? 2,
      }));
      const log = createAiLog({
        type: 'Suggestion',
        title: 'AI Sprint Tasks Suggested',
        status: 'applied',
        content: `${created.length} tasks from: "${goals}"`,
        details: { input: goals, tasks: created },
      });
      sendJson(res, 200, { tasks: created, log, raw: result.raw });
      return;
    }

    sendJson(res, 404, { error: 'Not found', path: pathname });
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: err.message || 'Server error' });
  }
}

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`SE SitRep API http://${HOST}:${PORT}`);
  console.log(`  DeepSeek: ${isOpenAiConfigured() ? 'configured' : 'missing DEEPSEEK_API_KEY'}`);
});
