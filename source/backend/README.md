# SE SitRep Backend

Vanilla Node.js HTTP API with **SQLite** (team-shared data), **session auth**, and **DeepSeek** for AI summaries and sprint task suggestions.

## Render deploy (Node version)

Render must use **Node 20**, not Node 26. `better-sqlite3` has no prebuild for Node 26 and will fail to compile.

In the Render dashboard → your service → **Environment**:

| Key | Value |
|-----|--------|
| `NODE_VERSION` | `20.18.0` |

Or rely on `source/backend/.node-version` (committed in this repo).

## Quick start

```bash
cd source/backend
cp .env.example .env
# Edit .env — set DEEPSEEK_API_KEY for AI features
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
| GET | `/api/health` | No | Health + DeepSeek configured flag |
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
| POST | `/api/ai/team-summary` | Bearer | DeepSeek team summary + AI log |
| POST | `/api/ai/suggest-tasks` | Bearer (admin) | DeepSeek task suggestions |

Send `Authorization: Bearer <token>` on protected routes.

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | For AI | [DeepSeek API key](https://platform.deepseek.com/api_keys) |
| `DEEPSEEK_MODEL` | No | Default `deepseek-v4-flash` |
| `DEEPSEEK_BASE_URL` | No | Default `https://api.deepseek.com` |
| `PORT` | No | Default `3001` |
| `HOST` | No | Default `0.0.0.0` |

Database file: `data/sitrep.db` (created on first run from `data/seed.json`).

## Tests & CI

```bash
npm test
```

GitHub Actions: `.github/workflows/ci.yml` (job `backend`).  
Production deploy: Render + `RENDER_DEPLOY_HOOK` — see [docs/DEPLOY.md](../../docs/DEPLOY.md).
