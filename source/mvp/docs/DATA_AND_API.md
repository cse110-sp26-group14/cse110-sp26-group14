# Shared data & API

## Architecture

```
Browser (source/mvp)  --fetch + Bearer token-->  Node API (source/backend)
                                                      SQLite (data/sitrep.db)
                                                      OpenAI (server-side key)
```

## Default config

`index.html` sets:

```javascript
window.SITREP_CONFIG = {
  dataMode: 'api',
  apiBaseUrl: 'http://localhost:3001',
  googleClientId: '',
};
```

## Auth flow

1. `POST /api/auth/login` → `{ token, user }`
2. Frontend stores token; sends `Authorization: Bearer <token>` on all `/api/*` routes (except login/signup/health).
3. `user.profileUserId` links to team user row for reports and check-ins.

## Main endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/state` | Full shared state after login |
| `GET/POST /api/issues` | Team issues |
| `POST /api/reports` | Daily check-in |
| `POST /api/ai/team-summary` | OpenAI summary → AI log |
| `POST /api/ai/suggest-tasks` | Admin: OpenAI tasks → sprint |

Requires `OPENAI_API_KEY` in `source/backend/.env` for AI routes.

## Google Calendar

Set `googleClientId` in `SITREP_CONFIG`. OAuth origins must include your dev URL (e.g. `http://localhost:5173`). Scaffold: `js/services/googleCalendarService.js`.

## Deploy notes

- Frontend: GitHub Pages / static host — point `apiBaseUrl` to deployed API.
- Backend: Render, Railway, Fly.io, etc. — set env vars; enable CORS origin if not `*`.
