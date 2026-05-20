/**
 * Auth: signup, login, sessions.
 * @module lib/auth
 */

import crypto from 'crypto';
import { getDb, hashPassword, verifyPassword } from './database.js';

const SESSION_DAYS = 7;

/**
 * @param {object} input
 * @returns {{ ok: boolean, error?: string, user?: object, token?: string }}
 */
export function signUp(input) {
  const email = String(input.email || '').trim().toLowerCase();
  const name = String(input.name || '').trim();
  const password = String(input.password || '');
  const role = String(input.role || 'Team Member').trim();

  if (!email || !name || !password) {
    return { ok: false, error: 'Name, email, and password are required.' };
  }
  if (password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' };
  }

  const exists = getDb().prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return { ok: false, error: 'Email already registered.' };

  const avatar = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const maxId = getDb().prepare('SELECT MAX(id) AS m FROM users').get().m || 0;
  const id = maxId + 1;

  getDb().prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar, is_admin)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(id, name, email, hashPassword(password), role, avatar);

  return createSession(id);
}

/**
 * @param {object} input
 * @returns {{ ok: boolean, error?: string, user?: object, token?: string }}
 */
export function login(input) {
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const row = getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  return createSession(row.id);
}

/**
 * @param {number} userId
 */
function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  getDb().prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    expires.toISOString(),
  );
  const user = userRowToClient(getDb().prepare('SELECT * FROM users WHERE id = ?').get(userId));
  return { ok: true, user, token };
}

/**
 * @param {string|null} token
 * @returns {object|null}
 */
export function getUserFromToken(token) {
  if (!token) return null;
  const row = getDb().prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token);
  if (!row) return null;
  getDb().prepare('UPDATE sessions SET expires_at = ? WHERE token = ?').run(
    new Date(Date.now() + SESSION_DAYS * 86400000).toISOString(),
    token,
  );
  return userRowToClient(row);
}

/**
 * @param {string} token
 */
export function logout(token) {
  if (token) {
    getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}

/**
 * @param {object} row
 */
function userRowToClient(row) {
  return {
    id: String(row.id),
    profileUserId: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar,
    isAdmin: Boolean(row.is_admin),
  };
}
