import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'sitrep-test.db');

before(() => {
  process.env.PORT = '0';
  try {
    fs.unlinkSync(DB_PATH);
  } catch {
    /* ignore */
  }
});

after(() => {
  try {
    fs.unlinkSync(DB_PATH);
  } catch {
    /* ignore */
  }
});

test('SQLite seed and auth', async () => {
  const mod = await import(`../lib/database.js?test=${Date.now()}`);
  const { getDb, hashPassword, verifyPassword, createIssue, getFullState } = mod;

  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get();
  assert.ok(count.c >= 5);

  const hash = hashPassword('testpass');
  assert.ok(verifyPassword('testpass', hash));
  assert.equal(verifyPassword('wrong', hash), false);

  const issue = createIssue({
    title: 'Test issue',
    author: 'Tester',
    severity: 'low',
  });
  assert.equal(issue.title, 'Test issue');

  const state = getFullState();
  assert.ok(state.issues.some((i) => i.title === 'Test issue'));
});

test('createMeeting and updateAiLog', async () => {
  const mod = await import(`../lib/database.js?meet=${Date.now()}`);
  const { createMeeting, createAiLog, updateAiLog } = mod;

  const meeting = createMeeting({
    title: 'API Test Meeting',
    date: '2026-06-01',
    time: '10:00 AM',
    sprintId: 2,
  });
  assert.equal(meeting.title, 'API Test Meeting');
  assert.equal(meeting.sprintId, 2);

  const log = createAiLog({
    type: 'Suggestion',
    title: 'Review tasks',
    status: 'pending',
    content: '2 suggestions',
  });
  const updated = updateAiLog(log.id, { status: 'approved' });
  assert.ok(updated);
  assert.equal(updated.status, 'approved');
});
