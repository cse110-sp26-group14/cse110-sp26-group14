/**
 * HTTP client for shared team data (issues, reports, auth, AI).
 * @module services/apiClient
 */

import { appConfig } from '../config/appConfig.js';

const TOKEN_KEY = 'se-sitrep-api-token';

/**
 * @returns {string|null}
 */
export function getApiToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * @param {string|null} token
 */
export function setApiToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 * @param {boolean} [auth]
 * @returns {Promise<Response>}
 */
async function request(path, init = {}, auth = true) {
  const base = appConfig.apiBaseUrl.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };
  if (auth) {
    const token = getApiToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text || response.statusText}`);
  }
  return response;
}

/**
 * Parse JSON error body from auth API responses.
 * @param {string} raw
 * @param {number} status
 * @returns {string}
 */
export function parseAuthApiError(raw, status) {
  const trimmed = (raw || '').trim();
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      if (data.error) return String(data.error);
    } catch {
      /* ignore */
    }
  }
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]);
      if (data.error) return String(data.error);
    } catch {
      /* ignore */
    }
  }
  if (status === 401) return 'Invalid email or password.';
  if (status >= 500) return 'Server error. Please try again later.';
  return 'Could not reach the server. Check your connection.';
}

/**
 * Auth POST — returns JSON without throwing on 4xx (login/signup show UI errors).
 * @param {string} path
 * @param {object} body
 * @returns {Promise<object>}
 */
async function postAuthJson(path, body) {
  const base = appConfig.apiBaseUrl.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: 'Could not reach the server. Check apiBaseUrl and that the Cloudflare Worker is deployed.' };
  }

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      error: data.error || parseAuthApiError(text, response.status),
      ...data,
    };
  }

  return { ok: data.ok !== false, ...data };
}

/**
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ ok: boolean, error?: string, user?: object, token?: string }>}
 */
export async function apiLogin(payload) {
  return postAuthJson('/api/auth/login', payload);
}

/**
 * @param {object} payload
 * @returns {Promise<{ ok: boolean, error?: string, user?: object, token?: string }>}
 */
export async function apiSignUp(payload) {
  return postAuthJson('/api/auth/signup', payload);
}

export async function apiLogout() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch {
    /* ignore */
  }
  setApiToken(null);
}

/**
 * @returns {Promise<object|null>}
 */
export async function apiMe() {
  const token = getApiToken();
  if (!token) return null;
  const res = await request('/api/auth/me');
  const data = await res.json();
  return data.user || null;
}

/**
 * @returns {Promise<object[]>}
 */
export async function fetchIssues() {
  const res = await request('/api/issues');
  return res.json();
}

/**
 * @param {object} issue
 * @returns {Promise<object>}
 */
export async function postIssue(issue) {
  const res = await request('/api/issues', {
    method: 'POST',
    body: JSON.stringify(issue),
  });
  return res.json();
}

/**
 * @param {number} id
 * @param {object} patch
 */
export async function patchIssue(id, patch) {
  const res = await request(`/api/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.json();
}

/**
 * @param {number} id
 * @param {object} patch
 */
export async function patchInlineTask(id, patch) {
  const res = await request(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.json();
}

/**
 * @returns {Promise<object>}
 */
export async function fetchAppState() {
  const res = await request('/api/state');
  return res.json();
}

/**
 * @param {object} report
 * @returns {Promise<object>}
 */
export async function postReport(report) {
  const res = await request('/api/reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
  return res.json();
}

/**
 * @param {number} id
 * @param {object} patch
 */
export async function patchReport(id, patch) {
  const res = await request(`/api/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.json();
}

/**
 * @param {object} task
 */
export async function postTask(task) {
  const res = await request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
  return res.json();
}

/**
 * @param {{ name: string, start: string, end: string, status?: string }} sprint
 */
export async function postSprint(sprint) {
  const res = await request('/api/sprints', {
    method: 'POST',
    body: JSON.stringify(sprint),
  });
  return res.json();
}

/**
 * @param {object} meeting
 */
export async function postMeeting(meeting) {
  const res = await request('/api/meetings', {
    method: 'POST',
    body: JSON.stringify(meeting),
  });
  return res.json();
}

/**
 * @param {number} id
 * @param {{ status: string }} patch
 */
export async function patchAiLog(id, patch) {
  const res = await request(`/api/ai/logs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return res.json();
}

/**
 * @param {object} payload
 */
export async function postAiTeamSummary() {
  const res = await request('/api/ai/team-summary', { method: 'POST', body: '{}' });
  return res.json();
}

/**
 * @param {string} goals Sprint goals text
 * @param {number} [sprintId] Target sprint id
 * @param {object} [teamContext] Roster, check-ins, availability for assignment
 * @returns {Promise<{ suggestions: object[], tasks: object[], log: object }>}
 */
export async function postAiSuggestTasks(goals, sprintId = 2, teamContext = null) {
  const res = await request('/api/ai/suggest-tasks', {
    method: 'POST',
    body: JSON.stringify({ goals, sprintId, teamContext }),
  });
  return res.json();
}

/**
 * @param {{ title: string, content: string, type?: string }} payload
 */
export async function postAiLog(payload) {
  const res = await request('/api/ai/logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * @param {object} payload
 */
export async function putAvailability(payload) {
  const res = await request('/api/availability', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * @param {{ name?: string, role?: string }} payload
 */
export async function putUserProfile(payload) {
  const res = await request('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.json();
}

/**
 * Update a task (with optional conflict detection via expectedUpdatedAt).
 * Returns { ok, task } or throws with err.conflict = true on 409.
 * @param {number} id
 * @param {object} patch
 * @returns {Promise<object>}
 */
export async function patchTask(id, patch) {
  const base = appConfig.apiBaseUrl.replace(/\/$/, '');
  const url = `${base}/api/tasks/${id}`;
  const token = getApiToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(patch) });
  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch { /* ignore */ }
  if (!response.ok) {
    const err = new Error(`API ${response.status}: ${text || response.statusText}`);
    err.status = response.status;
    err.conflict = response.status === 409;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * Create a sub-task under a parent task.
 * @param {number} parentId
 * @param {object} subtask
 * @returns {Promise<object>}
 */
export async function postSubtask(parentId, subtask) {
  const res = await request(`/api/tasks/${parentId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify(subtask),
  });
  return res.json();
}

/**
 * Mark a sub-task complete (server enforces assignee-only rule).
 * @param {number} subtaskId
 * @returns {Promise<object>}
 */
export async function completeSubtask(subtaskId) {
  const res = await request(`/api/subtasks/${subtaskId}/complete`, {
    method: 'PATCH',
    body: '{}',
  });
  return res.json();
}

/**
 * Get currently active users (users with live sessions).
 * @returns {Promise<object[]>}
 */
export async function fetchActiveUsers() {
  const res = await request('/api/active-users');
  return res.json();
}
