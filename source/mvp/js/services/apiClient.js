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
 * @param {{ email: string, password: string }} payload
 */
export async function apiLogin(payload) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false);
  return res.json();
}

/**
 * @param {object} payload
 */
export async function apiSignUp(payload) {
  const res = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, false);
  return res.json();
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
 * @param {object} payload
 */
export async function postAiTeamSummary() {
  const res = await request('/api/ai/team-summary', { method: 'POST', body: '{}' });
  return res.json();
}

/**
 * @param {string} goals
 */
export async function postAiSuggestTasks(goals, sprintId = 2) {
  const res = await request('/api/ai/suggest-tasks', {
    method: 'POST',
    body: JSON.stringify({ goals, sprintId }),
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
