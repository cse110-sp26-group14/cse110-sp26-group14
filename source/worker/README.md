# SE SitRep API — Cloudflare Worker + D1

Production API for SE SitRep. All `/api/*` routes (auth, tasks, issues, AI, availability).

## Tests & JSDoc

- **Tests:** `npm test` (`test/*.test.js`, Node test runner)
- **JSDoc:** `@module` / `@param` / `@returns` on `src/*.js`

## One-time setup + deploy

```bash
npm install
npx wrangler login
npx wrangler d1 create se-sitrep
# database_id → wrangler.toml or GitHub variable D1_DATABASE_ID

npm run db:remote
npx wrangler secret put DEEPSEEK_API_KEY
npm run deploy
```

Ongoing deploys: push to `main` (GitHub Actions) or `npm run deploy`.

See [docs/DEPLOY.md](../../docs/DEPLOY.md).

## Demo accounts (after seed)

| Email | Password |
|-------|----------|
| `maya@team.local` | `demo1234` |
| `alex@team.local` | `demo1234` |
