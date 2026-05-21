# SE SitRep MVP

Frontend (`source/mvp`) — deployed via **GitHub Pages**. API is **Cloudflare Worker** (`source/worker`).

## Production (GitHub Actions)

1. One-time: create D1, seed, and deploy Worker — see [docs/DEPLOY.md](../../docs/DEPLOY.md) Part A.
2. GitHub **Variables**: `API_BASE_URL` (Worker URL), `D1_DATABASE_ID`, `CLOUDFLARE_ACCOUNT_ID`; **Secret**: `CLOUDFLARE_API_TOKEN`.
3. **Pages → Source → GitHub Actions**.
4. Push to `main` / `master` → workflow injects `API_BASE_URL` into `index.html` and publishes this folder.

Demo login (after D1 seed): `maya@team.local` / `demo1234`.

## Structure

| Layer | Location |
|-------|----------|
| HTML | `index.html`, `templates/partials.html` |
| CSS | `css/*.css` |
| JS | `js/views/*`, `js/services/*` |

## CI (maintainers)

```bash
cd source/mvp && npm install && npm run ci
```

Unit/E2E tests may use `?dataMode=local` in the test harness only; production builds always use `dataMode: 'api'`.

See [docs/DATA_AND_API.md](docs/DATA_AND_API.md) and [docs/DEPLOY.md](../../docs/DEPLOY.md).
