# Shared data & API

## Architecture

```
Browser (source/mvp)  --fetch + Bearer token-->  Node API (source/backend)
                                                      SQLite (data/sitrep.db)
                                                      DeepSeek (server-side key)
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
2. Frontend stores token; sends `Authorization: Bearer <token>` on protected `/api/*` routes.
3. `user.profileUserId` links to the team user row for reports and check-ins.

## Main endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/state` | Full shared state after login |
| `GET/POST /api/issues` | Team issues |
| `POST /api/reports` | Daily check-in |
| `POST /api/ai/team-summary` | DeepSeek summary → AI log |
| `POST /api/ai/suggest-tasks` | Admin: DeepSeek tasks → sprint |

Requires `DEEPSEEK_API_KEY` in `source/backend/.env` (or Render env) for AI routes.

## Google Calendar

Set `googleClientId` in `SITREP_CONFIG`. OAuth origins must include your dev URL (e.g. `http://localhost:5173`). See `js/services/googleCalendarService.js`.

## Deploy notes

- **Frontend**: GitHub Pages — set repo variable `API_BASE_URL` to your Render API URL.
- **Backend**: Render — set `DEEPSEEK_API_KEY`; see [docs/DEPLOY.md](../../../docs/DEPLOY.md).
