# Prototype 2 — SE SitRep (MVP baseline)

Static web app (`index.html` + `app.js`). **DevDependencies are CI/testing only** — not runtime product deps.

## Local commands

```bash
cd source/prototype-02
npm ci
npm run ci          # lint + unit + e2e placeholder (same as GitHub Actions)
npm run lint        # ESLint (JS) + Stylelint (CSS) + html-validate (HTML)
npm run test:unit   # Jest — __tests__/ (20 tests)
npm run test:e2e    # Placeholder until Playwright (or similar) is added
```

## CI (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

Runs on push/PR when `source/prototype-02/**` changes:

1. **Lint** — JS, CSS, HTML  
2. **Unit tests** — `storage`, `taskService`, `app`  
3. **E2E placeholder** — `e2e/placeholder.test.js`

## Layout

| Path | Role |
|------|------|
| `index.html`, `src/app.js`, `style.css` | Runtime entry (loaded by browser) |
| `storage.js`, `taskService.js`, `mockData.js` | Backlog / tasks |
| `src/` | Active modular ES app |
| `__tests__/` | Unit / UI tests (Jest + jsdom) |
| `e2e/` | E2E placeholder for pipeline |
