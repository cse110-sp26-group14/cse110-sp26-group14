# Deployment (GitHub Actions only)

| Part | Hosting | Directory |
|------|---------|-----------|
| **Frontend** | **GitHub Pages** | `source/mvp` |
| **API + DB** | **Cloudflare Worker + D1** | `source/worker` |

Push to `main` / `master` (or run **Deploy** workflow manually) to deploy both.

---

## One-time: Cloudflare (before first Actions deploy)

Run once from any machine with Node 20+ (creates D1 and secrets on your Cloudflare account):

```bash
cd source/worker
npm install
npx wrangler login
npx wrangler d1 create se-sitrep
# Save database_id for GitHub variable D1_DATABASE_ID

npx wrangler d1 execute se-sitrep --remote --file=./schema.sql
npx wrangler d1 execute se-sitrep --remote --file=./seed.sql
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler deploy
```

Note the Worker URL, e.g. `https://se-sitrep-api.<subdomain>.workers.dev`.  
Verify: `https://<worker-url>/api/health` → `{ "ok": true, ... }`.

---

## GitHub repository settings

1. **Settings → Pages → Source** → **GitHub Actions**
2. **Settings → Secrets and variables → Actions**

| Name | Type | Purpose |
|------|------|---------|
| `CLOUDFLARE_API_TOKEN` | Secret | `wrangler deploy` in Actions |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | Cloudflare account ID |
| `D1_DATABASE_ID` | Variable | D1 `database_id` from `d1 create` |
| `API_BASE_URL` | Variable | Worker URL (no trailing `/`) |

3. Push to `main` / `master` → **Deploy** workflow:
   - Deploys Worker + D1 binding
   - Replaces `__API_BASE_URL__` in `source/mvp/index.html` with `API_BASE_URL`
   - Publishes `source/mvp` to GitHub Pages

Live site: `https://<org>.github.io/<repo>/`

Demo login: `maya@team.local` / `demo1234`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Deploy: missing `D1_DATABASE_ID` | Set variable from `wrangler d1 create` |
| Deploy: API inject failed | Set `API_BASE_URL`; check workflow log |
| Login fails on Pages | `API_BASE_URL` must match deployed Worker URL |
| AI 503 | `wrangler secret put DEEPSEEK_API_KEY` on Worker |
| Empty DB | Re-run `schema.sql` + `seed.sql` on remote D1 |
| Too much random data | `cd source/worker && npm run db:reset` (clears tables + demo seed) |

---

## CI

`.github/workflows/ci.yml`: worker unit tests + mvp lint/unit/E2E (tests only; not production hosting).
