# Deployment & API keys

| Part | Hosting | Where to configure |
|------|---------|-------------------|
| **Frontend** `source/mvp` | **GitHub Pages** | Repo **Variables**: `API_BASE_URL` |
| **Backend** `source/backend` | **Render** (free Node) | Render **Environment**: `DEEPSEEK_API_KEY`, etc. |

> GitHub Pages only serves **static** files. It cannot run Node/SQLite. The API must run on Render (or another PaaS). The frontend reaches it via `API_BASE_URL`.

---

## 1. Where API keys go (never commit them)

### DeepSeek (AI summary & task suggestions) — **Render only**

1. Create an API key at [DeepSeek Platform](https://platform.deepseek.com/api_keys).
2. Open [Render Dashboard](https://dashboard.render.com) → your Web Service → **Environment**.
3. Add:

   | Key | Value |
   |-----|--------|
   | `DEEPSEEK_API_KEY` | Your DeepSeek API key |
   | `DEEPSEEK_MODEL` | Optional; default `deepseek-v4-flash` (or `deepseek-v4-pro`) |

4. **Save Changes** → Render redeploys automatically.

The backend calls the OpenAI-compatible endpoint: `https://api.deepseek.com/chat/completions` (no `openai` npm package required).

**Do not** put `DEEPSEEK_API_KEY` in:

- Git commits, `index.html`, or `appConfig.js`
- GitHub Actions Variables (the frontend workflow does not need it)
- GitHub Pages build artifacts

When users click **AI Team Summary**, the browser calls your **Render backend**, which uses the env key to call DeepSeek.

### Frontend → backend URL — **GitHub Variable**

1. Repo **Settings → Secrets and variables → Actions → Variables**
2. Add **`API_BASE_URL`** = your Render public URL, e.g.:

   ```text
   https://se-sitrep-api.onrender.com
   ```

   (no trailing `/`)

3. On push to `main`, the Deploy workflow replaces `apiBaseUrl` in the Pages build from `localhost` to this URL.

### Optional: auto-deploy backend — **GitHub Secret**

1. Render service → **Settings → Deploy Hook** → copy URL  
2. GitHub **Settings → Secrets and variables → Actions → Secrets**  
3. Add **`RENDER_DEPLOY_HOOK`** = that URL  

### Google Calendar (optional)

1. Create an OAuth Web Client ID in [Google Cloud Console](https://console.cloud.google.com/).
2. **Authorized JavaScript origins**:
   - `http://localhost:5173` (local)
   - `https://<your-username>.github.io` (Pages)
3. Set `googleClientId` in `SITREP_CONFIG` (or a GitHub Variable `GOOGLE_CLIENT_ID`).

Never put the Google **Client Secret** in the frontend (browser uses Client ID only).

---

## 2. One-time setup

### GitHub Pages (frontend)

1. **Settings → Pages → Build and deployment → Source** → **GitHub Actions**
2. Add Variable **`API_BASE_URL`** (see above)

### Render (backend)

1. **New → Web Service** → connect this repo  
2. **Root Directory**: `source/backend`  
3. **Build Command**: `npm install`  
4. **Start Command**: `npm start`  
5. Add **`DEEPSEEK_API_KEY`** in Environment  
6. After deploy, copy the URL into GitHub **`API_BASE_URL`**  
7. Optional: add **`RENDER_DEPLOY_HOOK`** Secret  

You can also import `source/backend/render.yaml` (Blueprint).

### Push to `main`

- **CI** (`.github/workflows/ci.yml`): backend + MVP tests  
- **Deploy** (`.github/workflows/deploy.yml`): Render + Pages  

Live site: `https://<org>.github.io/<repo>/`

---

## 3. Local development

```bash
# Backend — key in source/backend/.env (gitignored)
cd source/backend
cp .env.example .env
# Edit .env: DEEPSEEK_API_KEY=...
npm install && npm start

# Frontend
cd source/mvp
npx serve . -p 5173
```

`index.html` uses `apiBaseUrl: http://localhost:3001` for local dev only.

---

## 4. Data flow after deploy

| Action | Frontend | Backend API |
|--------|----------|-------------|
| Login / sign-up | `authService` | `POST /api/auth/login` |
| Load team data | `hydrateStoreFromApi` on start | `GET /api/state` |
| Daily check-in | `createReportRemote` | `POST /api/reports` |
| Create issue | `createIssueRemote` | `POST /api/issues` |
| Resolve issue | Issues page button | `PATCH /api/issues/:id` |
| Availability | Availability form | `PUT /api/availability` |
| Profile | Settings form | `PUT /api/users/me` |
| Add task | Backlog form | `POST /api/tasks` |
| AI summary / tasks | Header buttons | `POST /api/ai/*` (needs `DEEPSEEK_API_KEY` on Render) |

CI does **not** call DeepSeek; it only runs SQLite/auth unit tests.
