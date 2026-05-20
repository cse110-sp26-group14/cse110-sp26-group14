/**
 * HTTP helpers for Vanilla Node server.
 * @module lib/httpUtil
 */

/**
 * @param {import('http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(payload);
}

/**
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<string>}
 */
export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * @param {import('http').IncomingMessage} req
 * @returns {Record<string, string>}
 */
export function parseJsonBody(req, raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @returns {string|null}
 */
export function getBearerToken(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}
