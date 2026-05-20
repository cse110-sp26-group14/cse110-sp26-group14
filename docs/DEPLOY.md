# 部署与 API Key 配置

| 部分 | 托管 | 配置位置 |
|------|------|----------|
| **前端** `source/mvp` | **GitHub Pages** | 仓库 **Variables**：`API_BASE_URL` |
| **后端** `source/backend` | **Render**（免费 Node） | Render **Environment**：`OPENAI_API_KEY` 等 |

> GitHub Pages **只能**托管静态网页，不能跑 Node/SQLite。API 必须部署在 Render（或其它 PaaS），前端通过 `API_BASE_URL` 访问。

---

## 一、API Key 放哪里？（不要写进代码仓库）

### 1. OpenAI（AI 总结 / 任务建议）— **只放在 Render**

1. 打开 [Render Dashboard](https://dashboard.render.com) → 你的 Web Service → **Environment**
2. 添加：

   | Key | Value |
   |-----|--------|
   | `OPENAI_API_KEY` | 在 [OpenAI API Keys](https://platform.openai.com/api-keys) 创建的 key（`sk-...`） |
   | `OPENAI_MODEL` | 可选，默认 `gpt-4o-mini` |

3. **Save Changes** → Render 会自动重新部署

**不要**把 `OPENAI_API_KEY` 放进：

- Git 仓库、`index.html`、`appConfig.js`
- GitHub Actions Variables（前端 workflow 不需要）
- GitHub Pages 部署产物

前端点「AI Team Summary」时，请求发到 **你的 Render 后端**，由后端用环境变量里的 key 调 OpenAI。

### 2. 前端连哪个后端 — **GitHub Variables**

1. 仓库 **Settings → Secrets and variables → Actions → Variables**
2. 新建 **`API_BASE_URL`** = Render 公网地址，例如：

   ```text
   https://se-sitrep-api.onrender.com
   ```

   （不要末尾 `/`）

3. 推送到 `main` 后，Deploy workflow 会把 Pages 上的 `apiBaseUrl` 从 `localhost` 替换成该地址。

### 3. 触发 Render 部署 — **GitHub Secret**

1. Render 服务 → **Settings → Deploy Hook** → 复制 URL  
2. GitHub **Settings → Secrets and variables → Actions → Secrets**  
3. 新建 **`RENDER_DEPLOY_HOOK`** = 上述 URL  

### 4. Google Calendar（可选）

若要用 Google 日历同步：

1. [Google Cloud Console](https://console.cloud.google.com/) 创建 OAuth Web Client ID  
2. **Authorized JavaScript origins** 加上：
   - `http://localhost:5173`（本地）
   - `https://<你的用户名>.github.io`（Pages）
3. 在 **GitHub Variables** 增加 `GOOGLE_CLIENT_ID`（可选），或部署前改 `index.html` 里 `SITREP_CONFIG.googleClientId`  

不要把 Google **Client Secret** 放进前端（浏览器只用 Client ID）。

---

## 二、一次性部署步骤

### GitHub Pages（前端）

1. **Settings → Pages → Build and deployment → Source** → **GitHub Actions**
2. 设置 Variable **`API_BASE_URL`**（见上）

### Render（后端）

1. **New → Web Service** → 连接本仓库  
2. **Root Directory**: `source/backend`  
3. **Build**: `npm install` · **Start**: `npm start`  
4. Environment 添加 **`OPENAI_API_KEY`**  
5. 部署完成后，把 URL 写入 GitHub **`API_BASE_URL`**  
6. 配置 **`RENDER_DEPLOY_HOOK`** Secret  

也可使用仓库内 `source/backend/render.yaml`。

### 推送 main

- **CI** (`.github/workflows/ci.yml`)：后端 + MVP 测试  
- **Deploy** (`.github/workflows/deploy.yml`)：Render + Pages  

访问：`https://<org>.github.io/<repo>/`

---

## 三、本地开发

```bash
# 后端 — key 放在 source/backend/.env（已在 .gitignore）
cd source/backend
cp .env.example .env
# 编辑 .env：OPENAI_API_KEY=sk-...
npm install && npm start

# 前端
cd source/mvp
npx serve . -p 5173
```

`index.html` 默认 `apiBaseUrl: http://localhost:3001`，仅本地有效。

---

## 四、功能与数据流（部署后）

| 操作 | 前端 | 后端 API |
|------|------|----------|
| 登录 / 注册 | `authService` | `POST /api/auth/login` |
| 加载团队数据 | 启动时 `hydrateStoreFromApi` | `GET /api/state` |
| Daily Check-In | 表单 → `createReportRemote` | `POST /api/reports` |
| 创建 Issue | 表单 → `createIssueRemote` | `POST /api/issues` |
| 解决 Issue | Issues 页按钮 | `PATCH /api/issues/:id` |
| 可用性 | Availability 表单 | `PUT /api/availability` |
| 个人设置 | Settings 表单 | `PUT /api/users/me` |
| 添加任务 | Backlog 表单 | `POST /api/tasks` |
| AI 总结 / 任务 | 头部按钮 | `POST /api/ai/*`（需 Render 上的 OpenAI key） |

CI **不会**使用真实 OpenAI key，只跑 SQLite/认证单元测试。
