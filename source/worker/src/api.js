/**
 * API route handler for all /api/* routes.
 * @module api
 */

import { json, parseBody, getBearerToken } from "./http.js";
import * as auth from "./auth.js";
import * as db from "./db.js";
import {
  isOpenAiConfigured,
  generateTeamSummary,
  generateTaskSuggestions,
} from "./openai.js";
import {
  buildTeamContextForAi,
  formatTeamContextForPrompt,
} from "./teamContext.js";
import { syncSprintStatusesInDb } from "./sprintLifecycle.js";

/**
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
export async function handleApi(request, env) {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;
  const body = ["POST", "PUT", "PATCH"].includes(method)
    ? await parseBody(request)
    : {};
  const token = getBearerToken(request);
  const user = await auth.getUserFromToken(env.DB, token);

  try {
    if (method === "GET" && pathname === "/api/health") {
      return json({
        ok: true,
        service: "se-sitrep-worker",
        ai: {
          provider: "deepseek",
          configured: isOpenAiConfigured(env),
          model: env.DEEPSEEK_MODEL || "deepseek-v4-flash",
        },
      });
    }

    if (method === "POST" && pathname === "/api/auth/signup") {
      const result = await auth.signUp(env.DB, body);
      return json(result, result.ok ? 201 : 400);
    }

    if (method === "POST" && pathname === "/api/auth/login") {
      const result = await auth.login(env.DB, body);
      return json(result, result.ok ? 200 : 401);
    }

    if (method === "POST" && pathname === "/api/auth/logout") {
      await auth.logout(env.DB, token);
      return json({ ok: true });
    }

    if (method === "GET" && pathname === "/api/auth/me") {
      if (!user) return json({ error: "Unauthorized" }, 401);
      return json({ user });
    }

    if (
      !user &&
      pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth/") &&
      pathname !== "/api/health"
    ) {
      return json({ error: "Login required" }, 401);
    }

    if (method === "GET" && pathname === "/api/state") {
      return json(await db.getFullState(env.DB));
    }

    if (method === "GET" && pathname === "/api/issues") {
      const state = await db.getFullState(env.DB);
      return json(state.issues);
    }

    if (method === "POST" && pathname === "/api/issues") {
      const issue = await db.createIssue(env.DB, body);
      return json(issue, 201);
    }

    const issuePatch = pathname.match(/^\/api\/issues\/(\d+)$/);
    if (method === "PATCH" && issuePatch) {
      const id = Number(issuePatch[1]);
      const updated = await db.updateIssue(env.DB, id, body);
      if (!updated) return json({ error: "Issue not found" }, 404);
      return json(updated);
    }

    if (method === "POST" && pathname === "/api/reports") {
      const report = await db.createReport(env.DB, {
        ...body,
        userId: body.userId ?? user.profileUserId,
      });
      return json(report, 201);
    }

    const reportPatch = pathname.match(/^\/api\/reports\/(\d+)$/);
    if (method === "PATCH" && reportPatch) {
      const updated = await db.updateReport(
        env.DB,
        Number(reportPatch[1]),
        body,
      );
      if (!updated) return json({ error: "Report not found" }, 404);
      return json(updated);
    }

    if (method === "GET" && pathname === "/api/tasks") {
      await syncSprintStatusesInDb(env.DB);
      const rows = (
        await env.DB.prepare("SELECT * FROM tasks ORDER BY id").all()
      ).results;
      return json(
        rows.map((r) => ({
          id: r.id,
          title: r.title,
          owner: r.owner,
          sprintId: r.sprint_id,
          priority: r.priority,
          status: r.status,
          due: r.due,
          source: r.source,
          assignees: JSON.parse(r.assignees_json || "[]"),
          parentTaskId: r.parent_task_id ?? null,
          updatedAt: r.updated_at ?? null,
          subtaskReviewStatus: r.subtask_review_status ?? null,
          description: r.description ?? '',
        })),
      );
    }

    if (method === "POST" && pathname === "/api/tasks") {
      const task = await db.createTask(env.DB, body);
      return json(task, 201);
    }

    const taskMatch = pathname.match(/^\/api\/tasks\/(\d+)$/);
    if (method === "DELETE" && taskMatch) {
      const id = Number(taskMatch[1]);
      await db.deleteTask(env.DB, id);
      return json({ success: true });
    }
    if (method === "PATCH" && taskMatch) {
      const id = Number(taskMatch[1]);
      const result = await db.updateTask(
        env.DB,
        id,
        body,
        body.expectedUpdatedAt ?? null,
      );
      if (!result.ok) {
        return json(
          {
            error: result.error,
            conflict: result.conflict ?? false,
            serverTask: result.serverTask ?? null,
          },
          result.conflict ? 409 : 404,
        );
      }
      return json(result.task);
    }

    const subtasksPostMatch = pathname.match(/^\/api\/tasks\/(\d+)\/subtasks$/);
    if (method === "POST" && subtasksPostMatch) {
      const parentId = Number(subtasksPostMatch[1]);
      const subtask = await db.createSubtask(env.DB, parentId, body);
      if (!subtask) return json({ error: "Parent task not found" }, 404);
      return json(subtask, 201);
    }

    const subtasksGetMatch = pathname.match(/^\/api\/tasks\/(\d+)\/subtasks$/);
    if (method === "GET" && subtasksGetMatch) {
      const parentId = Number(subtasksGetMatch[1]);
      const subtasks = await db.getSubtasks(env.DB, parentId);
      return json(subtasks);
    }

    const completeMatch = pathname.match(/^\/api\/subtasks\/(\d+)\/complete$/);
    if (method === "PATCH" && completeMatch) {
      const id = Number(completeMatch[1]);
      const result = await db.completeSubtask(env.DB, id, user.name);
      if (!result.ok) return json({ error: result.error }, 403);
      return json(result.task);
    }

    if (method === "GET" && pathname === "/api/active-users") {
      const activeUsers = await db.getActiveUsers(env.DB);
      return json(activeUsers);
    }

    if (method === "POST" && pathname === "/api/meetings") {
      const meeting = await db.createMeeting(env.DB, {
        ...body,
        sprintId: body.sprintId ?? 2,
      });
      return json(meeting, 201);
    }

    if (method === "PUT" && pathname === "/api/users/me") {
      const updated = await db.updateUserProfile(env.DB, user.profileUserId, {
        name: body.name,
        role: body.role,
      });
      if (!updated) return json({ error: "User not found" }, 404);
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

    if (method === "PUT" && pathname === "/api/availability") {
      const date = body.date || new Date().toISOString().slice(0, 10);
      const userId = body.userId ?? user.profileUserId;
      const slots = body.slots || {};
      await env.DB.prepare(
        `
        INSERT INTO availability (date, user_id, slots_json) VALUES (?, ?, ?)
        ON CONFLICT(date, user_id) DO UPDATE SET slots_json = excluded.slots_json
      `,
      )
        .bind(date, userId, JSON.stringify(slots))
        .run();
      await env.DB.prepare(
        "UPDATE users SET availability_json = ? WHERE id = ?",
      )
        .bind(JSON.stringify(slots), userId)
        .run();
      const state = await db.getFullState(env.DB);
      return json({
        ok: true,
        date,
        userId,
        slots,
        availability: state.availability,
      });
    }

    // Weekly recurring availability (When2Meet style)
    if (method === "GET" && pathname === "/api/availability/weekly") {
      const userId = user.profileUserId;
      const row = await env.DB.prepare(
        "SELECT slots_json FROM availability WHERE date = ? AND user_id = ?",
      )
        .bind("weekly", userId)
        .first();
      const slots = row ? JSON.parse(row.slots_json || "[]") : [];
      return json({ ok: true, slots });
    }

    if (method === "PUT" && pathname === "/api/availability/weekly") {
      const userId = user.profileUserId;
      const slots = Array.isArray(body.slots) ? body.slots : [];
      await env.DB.prepare(
        `
        INSERT INTO availability (date, user_id, slots_json) VALUES (?, ?, ?)
        ON CONFLICT(date, user_id) DO UPDATE SET slots_json = excluded.slots_json
      `,
      )
        .bind("weekly", userId, JSON.stringify(slots))
        .run();
      return json({ ok: true, slots });
    }

    if (method === "GET" && pathname === "/api/availability/team-heatmap") {
      // Fetch all weekly availability rows
      const rows = (
        await env.DB.prepare(
          "SELECT a.user_id, a.slots_json, u.name FROM availability a JOIN users u ON u.id = a.user_id WHERE a.date = 'weekly'",
        ).all()
      ).results;

      // Fetch all users for team size
      const allUsers = (
        await env.DB.prepare("SELECT id, name, role, avatar FROM users").all()
      ).results;

      const heatmap = {};
      for (const row of rows) {
        let slots;
        try {
          slots = JSON.parse(row.slots_json || "[]");
        } catch {
          slots = [];
        }
        for (const slot of slots) {
          if (!heatmap[slot]) heatmap[slot] = { count: 0, users: [] };
          heatmap[slot].count += 1;
          heatmap[slot].users.push(row.name);
        }
      }

      return json({
        ok: true,
        heatmap,
        teamSize: allUsers.length,
        users: allUsers.map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          avatar: u.avatar,
        })),
      });
    }

    if (method === "POST" && pathname === "/api/ai/logs") {
      const log = await db.createAiLog(env.DB, {
        type: body.type || "Note",
        title: body.title || "Team Note",
        status: body.status || "approved",
        content: body.content || "",
        details: body.details || { input: "Manual note", reviewer: user.name },
      });
      return json({ log }, 201);
    }

    const aiLogPatch = pathname.match(/^\/api\/ai\/logs\/(\d+)$/);
    if (method === "PATCH" && aiLogPatch) {
      const updated = await db.updateAiLog(env.DB, Number(aiLogPatch[1]), body);
      if (!updated) return json({ error: "Log not found" }, 404);
      return json({ log: updated });
    }

    if (method === "POST" && pathname === "/api/ai/team-summary") {
      const reports = await db.listReportsForAi(env.DB);
      const issues = await db.listOpenIssuesForAi(env.DB);
      let summary;
      try {
        summary = await generateTeamSummary(env, reports, issues);
      } catch (err) {
        return json({ error: err.message }, 503);
      }
      const log = await db.createAiLog(env.DB, {
        type: "Summary",
        title: "AI Team Summary Generated",
        status: "approved",
        content: summary.content,
        details: summary.details,
      });
      return json({ log, ...summary });
    }

    if (method === "POST" && pathname === "/api/ai/suggest-tasks") {
      const goals = body.goals || body.input || "Sprint goals";
      const sprintId = Number(body.sprintId) || 2;
      const state = await db.getFullState(env.DB);
      const teamContext =
        body.teamContext || buildTeamContextForAi(state, sprintId);
      const teamText = formatTeamContextForPrompt(teamContext);
      const issues = await db.listOpenIssuesForAi(env.DB);
      const sprint =
        state.sprints.find((s) => Number(s.id) === sprintId) || null;
      let result;
      try {
        result = await generateTaskSuggestions(
          env,
          goals,
          issues,
          sprint,
          teamText,
        );
      } catch (err) {
        return json({ error: err.message }, 503);
      }
      const rosterNames = new Set(
        (teamContext.members || []).map((m) => m.name),
      );
      const suggestions = result.tasks.map((t) => {
        let owner = t.owner || null;
        if (owner && !rosterNames.has(owner)) {
          const match = [...rosterNames].find((n) =>
            n.toLowerCase().includes(String(owner).toLowerCase()),
          );
          owner = match || owner;
        }
        return {
          title: t.title,
          priority: t.priority || "medium",
          due: t.due || sprint?.end || null,
          owner,
        };
      });
      const parseFailed = Boolean(result.parseFailed);
      const log = await db.createAiLog(env.DB, {
        type: "Suggestion",
        title: "AI Sprint Tasks Suggested",
        status: "pending",
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
          modelResponsePreview: (result.raw || "").slice(0, 800),
          source: "deepseek",
        },
      });
      return json({
        suggestions,
        tasks: suggestions,
        log,
        parseFailed,
        warning: parseFailed
          ? "AI response could not be parsed; showing fallback tasks."
          : undefined,
        raw: result.raw,
      });
    }

    if (method === "POST" && pathname === "/api/sprints") {
      if (!body.name?.trim() || !body.start || !body.end) {
        return json({ error: "name, start, and end are required" }, 400);
      }
      const sprint = await db.createSprint(env.DB, body);
      return json(sprint, 201);
    }

    return json({ error: "Not found", path: pathname }, 404);
  } catch (err) {
    console.error(err);
    return json({ error: err.message || "Server error" }, 500);
  }
}
