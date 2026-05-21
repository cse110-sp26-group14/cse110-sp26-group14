/**
 * API route handler for all /api/* routes.
 * @module api
 */

import { json, parseBody, getBearerToken } from './http.js';
import * as auth from './auth.js';
import * as db from './db.js';
import { isOpenAiConfigured, generateTeamSummary, generateTaskSuggestions } from './openai.js';
import { buildTeamContextForAi, formatTeamContextForPrompt } from './teamContext.js';

/**
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function handleApi(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await parseBody(request) : {};
  const token = getBearerToken(request);
  const user = await auth.getUserFromToken(env.DB, token);

  try {
    if (method === 'GET' && pathname === '/api/health') {
      return json({
        ok: true,
        service: 'se-sitrep-worker',
        ai: {
          provider: 'deepseek',
          configured: isOpenAiConfigured(env),
          model: env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
        },
      });
    }

    if (method === 'POST' && pathname === '/api/auth/signup') {
      const result = await auth.signUp(env.DB, body);
      return json(result, result.ok ? 201 : 400);
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const result = await auth.login(env.DB, body);
      return json(result, result.ok ? 200 : 401);
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      await auth.logout(env.DB, token);
      return json({ ok: true });
    }

    if (method === 'GET' && pathname === '/api/auth/me') {
      if (!user) return json({ error: 'Unauthorized' }, 401);
      return json({ user });
    }

    if (!user && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && pathname !== '/api/health') {
      return json({ error: 'Login required' }, 401);
    }

    if (method === 'GET' && pathname === '/api/state') {
      return json(await db.getFullState(env.DB));
    }

    if (method === 'GET' && pathname === '/api/issues') {
      const state = await db.getFullState(env.DB);
      return json(state.issues);
    }

    if (method === 'POST' && pathname === '/api/issues') {
      const issue = await db.createIssue(env.DB, body);
      return json(issue, 201);
    }

    const issuePatch = pathname.match(/^\/api\/issues\/(\d+)$/);
    if (method === 'PATCH' && issuePatch) {
      const id = Number(issuePatch[1]);
      const status = body.status || 'resolved';
      await env.DB.prepare('UPDATE issues SET status = ? WHERE id = ?').bind(status, id).run();
      const row = await env.DB.prepare('SELECT * FROM issues WHERE id = ?').bind(id).first();
      if (!row) return json({ error: 'Issue not found' }, 404);
      return json({
        ...row,
        tags: JSON.parse(row.tags_json || '[]'),
        sprintId: row.sprint_id,
        due: row.due || row.created,
      });
    }

    if (method === 'POST' && pathname === '/api/reports') {
      const report = await db.createReport(env.DB, {
        ...body,
        userId: body.userId ?? user.profileUserId,
      });
      return json(report, 201);
    }

    if (method === 'POST' && pathname === '/api/tasks') {
      const task = await db.createTask(env.DB, body);
      return json(task, 201);
    }

    if (method === 'POST' && pathname === '/api/meetings') {
      const meeting = await db.createMeeting(env.DB, { ...body, sprintId: body.sprintId ?? 2 });
      return json(meeting, 201);
    }

    if (method === 'PUT' && pathname === '/api/users/me') {
      const updated = await db.updateUserProfile(env.DB, user.profileUserId, {
        name: body.name,
        role: body.role,
      });
      if (!updated) return json({ error: 'User not found' }, 404);
      return json({
        user: {
          id: String(updated.id),
          profileUserId: updated.id,
          name: updated.name,
          email: user.email,
          role: updated.role,
          avatar: updated.avatar,
          isAdmin: Boolean(updated.isAdmin),
        },
      });
    }

    if (method === 'PUT' && pathname === '/api/availability') {
      const date = body.date || new Date().toISOString().slice(0, 10);
      const userId = body.userId ?? user.profileUserId;
      const slots = body.slots || {};
      await env.DB.prepare(`
        INSERT INTO availability (date, user_id, slots_json) VALUES (?, ?, ?)
        ON CONFLICT(date, user_id) DO UPDATE SET slots_json = excluded.slots_json
      `).bind(date, userId, JSON.stringify(slots)).run();
      await env.DB.prepare('UPDATE users SET availability_json = ? WHERE id = ?')
        .bind(JSON.stringify(slots), userId).run();
      const state = await db.getFullState(env.DB);
      return json({ ok: true, date, userId, slots, availability: state.availability });
    }

    if (method === 'POST' && pathname === '/api/ai/logs') {
      const log = await db.createAiLog(env.DB, {
        type: body.type || 'Note',
        title: body.title || 'Team Note',
        status: body.status || 'approved',
        content: body.content || '',
        details: body.details || { input: 'Manual note', reviewer: user.name },
      });
      return json({ log }, 201);
    }

    const aiLogPatch = pathname.match(/^\/api\/ai\/logs\/(\d+)$/);
    if (method === 'PATCH' && aiLogPatch) {
      const updated = await db.updateAiLog(env.DB, Number(aiLogPatch[1]), body);
      if (!updated) return json({ error: 'Log not found' }, 404);
      return json({ log: updated });
    }

    if (method === 'POST' && pathname === '/api/ai/team-summary') {
      const reports = await db.listReportsForAi(env.DB);
      const issues = await db.listOpenIssuesForAi(env.DB);
      let summary;
      try {
        summary = await generateTeamSummary(env, reports, issues);
      } catch (err) {
        return json({ error: err.message }, 503);
      }
      const log = await db.createAiLog(env.DB, {
        type: 'Summary',
        title: 'AI Team Summary Generated',
        status: 'approved',
        content: summary.content,
        details: summary.details,
      });
      return json({ log, ...summary });
    }

    if (method === 'POST' && pathname === '/api/ai/suggest-tasks') {
      const goals = body.goals || body.input || 'Sprint goals';
      const sprintId = Number(body.sprintId) || 2;
      const state = await db.getFullState(env.DB);
      const teamContext = body.teamContext || buildTeamContextForAi(state, sprintId);
      const teamText = formatTeamContextForPrompt(teamContext);
      const issues = await db.listOpenIssuesForAi(env.DB);
      const sprint = state.sprints.find((s) => Number(s.id) === sprintId) || null;
      let result;
      try {
        result = await generateTaskSuggestions(env, goals, issues, sprint, teamText);
      } catch (err) {
        return json({ error: err.message }, 503);
      }
      const rosterNames = new Set((teamContext.members || []).map((m) => m.name));
      const suggestions = result.tasks.map((t) => {
        let owner = t.owner || null;
        if (owner && !rosterNames.has(owner)) {
          const match = [...rosterNames].find((n) => n.toLowerCase().includes(String(owner).toLowerCase()));
          owner = match || owner;
        }
        return {
          title: t.title,
          priority: t.priority || 'medium',
          due: t.due || sprint?.end || null,
          owner,
        };
      });
      const parseFailed = Boolean(result.parseFailed);
      const log = await db.createAiLog(env.DB, {
        type: 'Suggestion',
        title: 'AI Sprint Tasks Suggested',
        status: 'pending',
        content: parseFailed
          ? `Review ${suggestions.length} fallback task(s) — AI response could not be parsed for: "${goals}"`
          : `Review ${suggestions.length} task suggestion(s) for: "${goals}"`,
        details: {
          input: goals,
          suggestions,
          teamContext,
          sprintId,
          parseFailed,
          parseError: result.parseError || null,
          modelResponsePreview: (result.raw || '').slice(0, 800),
          source: 'deepseek',
        },
      });
      return json({
        suggestions,
        tasks: suggestions,
        log,
        parseFailed,
        warning: parseFailed
          ? 'AI response could not be parsed; showing fallback tasks.'
          : undefined,
        raw: result.raw,
      });
    }

    if (method === 'POST' && pathname === '/api/sprints') {
      if (!body.name?.trim() || !body.start || !body.end) {
        return json({ error: 'name, start, and end are required' }, 400);
      }
      const sprint = await db.createSprint(env.DB, body);
      return json(sprint, 201);
    }

    return json({ error: 'Not found', path: pathname }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: err.message || 'Server error' }, 500);
  }
}
