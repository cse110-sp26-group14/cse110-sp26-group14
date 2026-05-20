# SE SitRep Backend

Vanilla Node.js HTTP API with **SQLite** (team-shared data), **session auth**, and **OpenAI** for AI summaries and sprint task suggestions.

## Quick start

```bash
cd source/backend
cp .env.example .env
# Edit .env — set OPENAI_API_KEY for AI features
npm install
npm start
```

API listens on `http://localhost:3001` (see `PORT` in `.env`).

## Demo accounts (seeded)

| Email | Password | Role |
|-------|----------|------|
| maya@team.local | demo1234 | Project Manager (admin) |
| alex@team.local | demo1234 | Frontend |
| jordan@team.local | demo1234 | Backend |

## Frontend

```bash
cd source/mvp
npx serve . -p 5173
```

Open `http://localhost:5173` — `index.html` sets `SITREP_CONFIG.dataMode: 'api'` and `apiBaseUrl: 'http://localhost:3001'`.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health + OpenAI configured flag |
| POST | `/api/auth/signup` | No | Register |
| POST | `/api/auth/login` | No | Login → `{ token, user }` |
| POST | `/api/auth/logout` | Bearer | Logout |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/state` | Bearer | Full app state (shared) |
| GET/POST | `/api/issues` | Bearer | List / create issues |
| PATCH | `/api/issues/:id` | Bearer | Update issue (e.g. resolve) |
| POST | `/api/reports` | Bearer | Daily check-in |
| POST | `/api/tasks` | Bearer | Create task |
| PUT | `/api/availability` | Bearer | Save availability slots |
| POST | `/api/ai/team-summary` | Bearer | OpenAI team summary + AI log |
| POST | `/api/ai/suggest-tasks` | Bearer (admin) | OpenAI task suggestions |

Send `Authorization: Bearer <token>` on protected routes.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | For AI | OpenAI API key |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `PORT` | No | Default `3001` |
| `HOST` | No | Default `0.0.0.0` |

Database file: `data/sitrep.db` (created on first run from `data/seed.json`).

## Tests & CI

```bash
npm test
```

GitHub Actions: `.github/workflows/ci.yml` (job `backend`).  
Production deploy: Render + `RENDER_DEPLOY_HOOK` — see [docs/DEPLOY.md](../../docs/DEPLOY.md).
