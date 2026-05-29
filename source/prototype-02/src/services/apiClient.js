/**
 * HTTP client for the shared Cloudflare Worker API.
 * API URL is read from localStorage (set via Settings) or window.SITREP_API_URL.
 */

const URL_KEY = 'sitrep-api-url';
const TOKEN_KEY = 'se-sitrep-api-token';

export function getApiUrl() {
    return localStorage.getItem(URL_KEY) || (typeof window !== 'undefined' && window.SITREP_API_URL) || '';
}

export function setApiUrl(url) {
    if (url) localStorage.setItem(URL_KEY, url.trim().replace(/\/$/, ''));
    else localStorage.removeItem(URL_KEY);
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
}

export function isConfigured() {
    return Boolean(getApiUrl());
}

async function request(path, init = {}) {
    const base = getApiUrl();
    if (!base) throw new Error('No API URL configured. Set it in Settings.');
    const url = `${base}${path}`;
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
        const text = await res.text();
        const err = new Error(`API ${res.status}: ${text || res.statusText}`);
        err.status = res.status;
        err.conflict = res.status === 409;
        try { err.body = JSON.parse(text); } catch { /* ignore */ }
        throw err;
    }
    return res.json();
}

export const api = {
    /** Full app state snapshot */
    getState: () => request('/api/state'),

    /** Auth */
    login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    logout: () => request('/api/auth/logout', { method: 'POST', body: '{}' }),
    me: () => request('/api/auth/me'),

    /** Tasks */
    getTasks: () => request('/api/tasks'),
    createTask: (data) => request('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    updateTask: (id, data) => request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    /** Sub-tasks */
    createSubtask: (parentId, data) =>
        request(`/api/tasks/${parentId}/subtasks`, { method: 'POST', body: JSON.stringify(data) }),
    getSubtasks: (parentId) => request(`/api/tasks/${parentId}/subtasks`),
    completeSubtask: (id) =>
        request(`/api/subtasks/${id}/complete`, { method: 'PATCH', body: '{}' }),

    /** Other */
    createReport: (data) => request('/api/reports', { method: 'POST', body: JSON.stringify(data) }),
    createIssue: (data) => request('/api/issues', { method: 'POST', body: JSON.stringify(data) }),
    saveAvailability: (date, slots) =>
        request('/api/availability', { method: 'PUT', body: JSON.stringify({ date, slots }) }),
    getActiveUsers: () => request('/api/active-users'),
};
