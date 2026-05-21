/**
 * JSON responses + CORS for Worker.
 * @module http
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * @param {unknown} body
 * @param {number} [status]
 * @returns {Response}
 */
export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

/**
 * @param {Request} request
 * @returns {Promise<Record<string, unknown>>}
 */
export async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/**
 * @param {Request} request
 * @returns {string|null}
 */
export function getBearerToken(request) {
  const h = request.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}

export { CORS };
