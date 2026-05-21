# Shared data & API

## Architecture

```
Browser (source/mvp)  --fetch + Bearer token-->  Cloudflare Worker (source/worker)
                                                      D1 (SQLite at edge)
                                                      DeepSeek (Worker secret)
```

## Default config

`index.html` sets `dataMode: 'api'` and `apiBaseUrl: '__API_BASE_URL__'`.

GitHub Actions **Deploy** replaces `__API_BASE_URL__` with repository variable **`API_BASE_URL`** (your Cloudflare Worker URL).

## Auth flow

1. `POST /api/auth/login` → `{ token, user }`
2. Frontend stores token; sends `Authorization: Bearer <token>` on protected `/api/*` routes.
3. `user.profileUserId` links to the team user row for reports and check-ins.

## Main endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/state` | Full shared state after login |
| `GET/POST /api/issues` | Team issues |
| `POST /api/reports` | Daily check-in |
| `POST /api/tasks` | Sprint tasks |
| `POST /api/ai/team-summary` | DeepSeek summary → AI log |
| `POST /api/ai/suggest-tasks` | DeepSeek task suggestions (uses team context) |

AI routes need `DEEPSEEK_API_KEY` on the Worker: `wrangler secret put DEEPSEEK_API_KEY`.

## Google Calendar

Set `googleClientId` in `SITREP_CONFIG` (optional). OAuth origins must include your GitHub Pages URL. See `js/services/googleCalendarService.js`.

## Deploy

- **Frontend**: GitHub Pages — `API_BASE_URL` variable  
- **API**: Cloudflare Worker + D1 — see [docs/DEPLOY.md](../../../docs/DEPLOY.md) and [source/worker/README.md](../../worker/README.md)
