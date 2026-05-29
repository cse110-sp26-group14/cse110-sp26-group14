/**
 * Live sync: polls /api/state every POLL_MS, detects changes, notifies users.
 */
import { api, isConfigured } from './apiClient.js';
import { EVENTS } from '../core/events.js';

const POLL_MS = 10_000;

let pollTimer = null;
let lastTasksHash = '';
let lastUsersHash = '';
let store = null;
let router = null;

function hashTasks(tasks) {
    return JSON.stringify((tasks || []).map((t) => `${t.id}:${t.status}:${t.updatedAt}:${t.assignees}`));
}

function hashUsers(users) {
    return JSON.stringify((users || []).map((u) => `${u.id}:${u.isOnline}`));
}

async function poll() {
    if (!isConfigured()) return;
    try {
        const state = await api.getState();
        let changed = false;

        const newTasksHash = hashTasks(state.tasks);
        if (newTasksHash !== lastTasksHash && lastTasksHash !== '') {
            store.setTasks(state.tasks || []);
            showSyncBanner('Tasks updated by another user.');
            changed = true;
        }
        lastTasksHash = newTasksHash;

        const newUsersHash = hashUsers(state.users);
        if (newUsersHash !== lastUsersHash && lastUsersHash !== '') {
            store.setUsers(state.users || []);
            changed = true;
        }
        lastUsersHash = newUsersHash;

        if (changed && router) {
            const hash = window.location.hash || '#dashboard';
            if (['#backlog', '#dashboard', '#team-availability'].includes(hash)) {
                router.handleRoute();
            }
        }
    } catch (err) {
        console.warn('[Sync] Poll failed:', err.message);
    }
}

export async function startSync(storeRef, routerRef) {
    store = storeRef;
    router = routerRef;
    if (!isConfigured()) return;

    try {
        const state = await api.getState();
        lastTasksHash = hashTasks(state.tasks);
        lastUsersHash = hashUsers(state.users);
        store.setTasks(state.tasks || []);
        store.setUsers(state.users || []);
        if (router) router.handleRoute();
    } catch (err) {
        console.warn('[Sync] Initial load failed:', err.message);
    }

    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(poll, POLL_MS);
}

export function stopSync() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
}

function showSyncBanner(msg) {
    const existing = document.getElementById('sync-banner');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'sync-banner';
    el.textContent = `🔄 ${msg}`;
    el.style.cssText = `
        position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
        background: #1d4ed8; color: white; padding: 0.6rem 1.4rem;
        border-radius: 999px; font-size: 0.875rem; font-weight: 500;
        z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4500);
}
