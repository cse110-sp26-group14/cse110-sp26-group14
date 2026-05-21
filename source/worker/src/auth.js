/**
 * Auth for Cloudflare Worker + D1.
 * @module auth
 */

import crypto from 'node:crypto';
import { hashPassword, verifyPassword } from './password.js';

const SESSION_DAYS = 7;

/**
 * Register a new user and start a session.
 * @param {D1Database} db
 * @param {object} input
 * @returns {Promise<{ ok: boolean, error?: string, user?: object, token?: string }>}
 */
export async function signUp(db, input) {
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
  const exists = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (exists) return { ok: false, error: 'Email already registered.' };
  const max = await db.prepare('SELECT MAX(id) AS m FROM users').first();
  const id = (max?.m || 0) + 1;
  const avatar = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  await db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, avatar, is_admin)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).bind(id, name, email, hashPassword(password), role, avatar).run();
  return createSession(db, id);
}

/**
 * @param {D1Database} db
 * @param {object} input
 * @returns {Promise<{ ok: boolean, error?: string, user?: object, token?: string }>}
 */
export async function login(db, input) {
  const email = String(input.email || '').trim().toLowerCase();
  const password = String(input.password || '');
  const row = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!row || !verifyPassword(password, row.password_hash)) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  return createSession(db, row.id);
}

/**
 * @param {D1Database} db
 * @param {number} userId
 */
async function createSession(db, userId) {
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  await db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, userId, expires.toISOString()).run();
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  return { ok: true, user: userRowToClient(user), token };
}

/**
 * @param {D1Database} db
 * @param {string|null} token
 * @returns {Promise<object|null>} client user or null
 */
export async function getUserFromToken(db, token) {
  if (!token) return null;
  const row = await db.prepare(`
    SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).bind(token).first();
  if (!row) return null;
  const renewed = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await db.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?').bind(renewed, token).run();
  return userRowToClient(row);
}

/**
 * @param {D1Database} db
 * @param {string} token
 */
export async function logout(db, token) {
  if (token) {
    await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
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
