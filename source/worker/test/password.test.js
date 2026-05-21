import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/password.js';

describe('password', () => {
  test('hashPassword and verifyPassword round-trip', () => {
    const stored = hashPassword('demo1234');
    assert.match(stored, /^[a-f0-9]+:[a-f0-9]+$/);
    assert.equal(verifyPassword('demo1234', stored), true);
    assert.equal(verifyPassword('wrong', stored), false);
  });
});
