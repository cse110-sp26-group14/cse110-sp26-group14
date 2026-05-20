/**
 * JSON file persistence (team-shared database for MVP).
 * @module lib/db
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
const SEED_PATH = path.join(__dirname, '..', 'data', 'seed.json');

/** @type {object|null} */
let cache = null;

/**
 * @returns {Promise<object>}
 */
export async function loadDb() {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    cache = JSON.parse(raw);
    return cache;
  } catch (err) {
    if (err.code === 'ENOENT') {
      const seed = await fs.readFile(SEED_PATH, 'utf8');
      cache = JSON.parse(seed);
      await saveDb(cache);
      return cache;
    }
    throw err;
  }
}

/**
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function saveDb(data) {
  cache = data;
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * @returns {Promise<number>}
 */
export async function nextIssueId() {
  const db = await loadDb();
  const max = db.issues.reduce((m, i) => Math.max(m, Number(i.id) || 0), 0);
  return max + 1;
}
