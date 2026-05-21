import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { json, getBearerToken } from '../src/http.js';

describe('http', () => {
  test('json returns JSON response with CORS', async () => {
    const res = json({ ok: true }, 200);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'application/json');
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
    const body = await res.json();
    assert.equal(body.ok, true);
  });

  test('getBearerToken parses Authorization header', () => {
    const req = new Request('https://x/api', {
      headers: { Authorization: 'Bearer abc123' },
    });
    assert.equal(getBearerToken(req), 'abc123');
  });
});
