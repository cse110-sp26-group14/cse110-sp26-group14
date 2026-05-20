/**
 * Auth: API mode (shared backend) or local demo (localStorage).
 * @module services/authService
 */

import { useRemoteData } from '../config/appConfig.js';
import {
  apiLogin,
  apiSignUp,
  apiLogout,
  apiMe,
  getApiToken,
  setApiToken,
} from './apiClient.js';
import { loadState, saveState } from './storageService.js';
import { createId } from '../utils/ids.js';

const USERS_KEY = 'se-sitrep-auth-users';
const SESSION_KEY = 'se-sitrep-session';

/**
 * @param {string} name
 * @returns {string}
 */
function avatarFromName(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * @returns {AuthUser[]}
 */
function loadUsers() {
  return loadState(USERS_KEY, []);
}

/**
 * @param {AuthUser[]} users
 */
function saveUsers(users) {
  saveState(USERS_KEY, users);
}

/**
 * @param {object} apiUser
 * @param {string} token
 */
function persistApiSession(apiUser, token) {
  setApiToken(token);
  saveState(SESSION_KEY, { mode: 'api', user: apiUser });
}

/**
 * Register a new account.
 * @param {{ name: string, email: string, password: string, role?: string }} payload
 * @returns {Promise<{ ok: boolean, error?: string, user?: object }>}
 */
export async function signUp(payload) {
  if (useRemoteData()) {
    const result = await apiSignUp(payload);
    if (!result.ok) return result;
    persistApiSession(result.user, result.token);
    return { ok: true, user: result.user };
  }

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();
  const name = payload.name?.trim();

  if (!name || !email || !password) {
    return { ok: false, error: 'Name, email, and password are required.' };
  }
  if (password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' };
  }

  const users = loadUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const user = {
    id: createId(),
    name,
    email,
    password,
    role: payload.role?.trim() || 'Team Member',
    avatar: avatarFromName(name),
    profileUserId: null,
  };

  users.push(user);
  saveUsers(users);
  saveState(SESSION_KEY, { userId: user.id });
  return { ok: true, user };
}

/**
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ ok: boolean, error?: string, user?: object }>}
 */
export async function login(payload) {
  if (useRemoteData()) {
    const result = await apiLogin(payload);
    if (!result.ok) return result;
    persistApiSession(result.user, result.token);
    return { ok: true, user: result.user };
  }

  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  const user = loadUsers().find((u) => u.email === email && u.password === password);
  if (!user) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  saveState(SESSION_KEY, { userId: user.id });
  return { ok: true, user };
}

/** Clear session. */
export async function logout() {
  if (useRemoteData() && getApiToken()) {
    await apiLogout();
  }
  localStorage.removeItem(SESSION_KEY);
}

/**
 * @returns {Promise<object|null>}
 */
export async function getSessionUser() {
  const session = loadState(SESSION_KEY, null);
  if (!session) return null;

  if (useRemoteData() && (session.mode === 'api' || getApiToken())) {
    if (session.user && getApiToken()) return session.user;
    try {
      const user = await apiMe();
      if (user) {
        saveState(SESSION_KEY, { mode: 'api', user });
        return user;
      }
    } catch {
      return null;
    }
    return null;
  }

  if (!session.userId) return null;
  return loadUsers().find((u) => u.id === session.userId) || null;
}

/**
 * Demo helper: ensure default admin exists for first visit (local mode only).
 */
export function ensureDemoAccount() {
  if (useRemoteData()) return;

  const users = loadUsers();
  if (users.length > 0) return;

  saveUsers([
    {
      id: 'demo-admin',
      name: 'Maya Patel',
      email: 'maya@team.local',
      password: 'demo1234',
      role: 'Project Manager',
      avatar: 'MP',
      profileUserId: 1,
      isAdmin: true,
    },
    {
      id: 'demo-member',
      name: 'Alex Chen',
      email: 'alex@team.local',
      password: 'demo1234',
      role: 'Frontend',
      avatar: 'AC',
      profileUserId: 2,
    },
  ]);
}
