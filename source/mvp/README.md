# SE SitRep MVP

Course MVP from **prototype-02**, aligned with `specs/feature/feature_list.md` and `feature_specs.md`.

## Full stack (recommended)

**Terminal 1 — backend** (SQLite + auth + DeepSeek):

```bash
cd source/backend
cp .env.example .env   # set DEEPSEEK_API_KEY for AI buttons
npm install
npm start              # http://localhost:3001
```

**Terminal 2 — frontend**:

```bash
cd source/mvp
npx --yes serve . -p 5173
# http://localhost:5173
```

`index.html` defaults to `dataMode: 'api'` and `apiBaseUrl: 'http://localhost:3001'`.

## Demo login (server accounts)

| Email | Password | Notes |
|-------|----------|-------|
| `maya@team.local` | `demo1234` | Admin — AI task suggestions |
| `alex@team.local` | `demo1234` | Member |

Sign up also works; accounts are stored in SQLite on the server.

## Local-only mode

Open `http://localhost:5173/?dataMode=local` or set `window.SITREP_CONFIG.dataMode = 'local'` to use browser `localStorage` (no shared team data).

## Quality

```bash
cd source/mvp
npm install
npx playwright install chromium   # first time only
npm run ci                      # lint + unit + E2E (Playwright)
npm run test:e2e                # browser tests only
npm run test:e2e:ui             # interactive debugger
```

E2E runs against `?dataMode=local` (no backend required). Specs live in `e2e/*.spec.js`.

## Features

| # | Feature | Status |
|---|---------|--------|
| 1 | Login / sign-up | ✅ API + SQLite |
| 2 | Sprint calendar | ✅ |
| 3 | Dashboard | ✅ |
| 4 | Async check-in | ✅ POST `/api/reports` |
| 5 | AI team summary | ✅ DeepSeek via `POST /api/ai/team-summary` |
| 6 | AI task suggestion | ✅ Admin + DeepSeek `/api/ai/suggest-tasks` |
| 7 | Issues / blockers | ✅ Shared list + create |
| 8 | Activity log / backlog | ✅ AI log + backlog views |
| 9 | Availability | ✅ Seed grid + online indicators from sessions |

See [docs/DATA_AND_API.md](docs/DATA_AND_API.md), [docs/DEPLOY.md](../../docs/DEPLOY.md), and [../backend/README.md](../backend/README.md).

**Production:** GitHub Pages deploys this folder; set repo variable `API_BASE_URL` to your Render API URL.
