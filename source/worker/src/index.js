/**
 * SE SitRep API — Cloudflare Worker entry.
 * @module index
 */

import { CORS } from './http.js';
import { handleApi } from './api.js';

export default {
  /**
   * @param {Request} request
   * @param {object} env
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      return handleApi(request, env);
    }
    return new Response('SE SitRep API — use /api/health', { status: 200, headers: CORS });
  },
};
