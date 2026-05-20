# 051326-week7-agile-standup.md

# Meeting Notes: Week 7 Agile Stand Up

## Team information

- **Team number / name:** CSE 110 — **Group 14** / **CS Stress 14**
- **Meeting type:** Agile Stand Up (in-person collaborative work session)
- **Date:** May 13, 2026
- **Duration:** Extended working session (after lecture)
- **Participants (in person):** Owen Atis, Benjamin Scheeger, Christian Pacheco, Kaitlyn Nguy
- **Participants (async):** Remaining team members — caught up via meeting notes online (`admin/meetings/051326-week7-agile-standup.md`)
- **Related docs:** See `051226-week7-meeting-notes.md` for frontend feature specs (including **AI Async Reminder & Summary** and async check-in requirements). See `051226-week7-agile-standup.md` for context on scheduling this session.

---

## Discussion summary

### Powell’s office hours (technical direction)

- **Stack baseline:** Continue with **JavaScript** (not switching stacks by default).
- **API documentation — JSDoc:**
  - Use JSDoc comments; tooling can parse comments and produce a **JSON representation** of the API, then generate a **documentation website**.
  - Benefit: **documentation stays in sync with code** without a separate manual doc pass for API surfaces.
- **Conventional Commits:**
  - Adopt a **set commit-message format** so changelogs are easier to generate and read.
- **TypeScript (optional, not default):**
  - TypeScript may be used, but requires an **ADR** to justify the choice.
  - Trade-off: would need **manually maintained** documentation paths compared to the JSDoc workflow above.

### Deliverables & pipeline

- **Video demonstration due Wednesday (5/14):**
  - Target: **something working by Wednesday night** plus a **video showcase** of progress.
- **Build / deploy:**
  - Likely need a **build pipeline** (even if only **partially working** at first).
  - **CI/CD:** On push, deploy to **Google** (hosting target TBD in implementation).
  - Need **proper documentation** alongside pipeline setup.

### Priority: frontend first

- **Frontend comes before backend** (backend can still proceed in parallel).
- Frontend needs **testing**, **QA**, and **documentation** as first-class work—not only feature code.
- Team should align with **`051226-week7-meeting-notes.md`** for async/check-in/calendar/backlog specs discussed earlier.

### Current frontend prototype — concerns

- **Too many dependencies** → higher risk the app **breaks over time** as packages change.
- If the team keeps current dependencies, each significant choice needs an **ADR** explaining why.
- **Using AI for fixes:** Only effective with a **strong design goal** for what the AI should change; otherwise output drifts.
- Team needs **ADRs and recorded rationale** for major technical choices.
- To avoid large dependency trees: prefer **native browser APIs** and minimal libraries.

---

## Frontend prototype work (this session)

**Contributors (this session):** Benjamin Scheeger, Owen Atis, Kaitlyn Nguy, and Christian Pacheco produced **two additional frontend prototypes**:

| Prototype | Dependency strategy |
|-----------|---------------------|
| **A — Zero dependency** | Native HTML5, CSS3 (variables), Vanilla JS (ES6+); no npm, no CDN scripts, no build step; open `index.html` in browser |
| **B — Lean / minimal deps** | Native-first (Web Components, CSS Grid/Flexbox, Fetch API); **only** approved libs: `chart.js`, `lucide-icons`, `date-fns` |

**Shared implementation choices (Prototype B user answers):**

- **Component styling:** Light DOM (recommended)
- **Routing:** Hash router (`#dashboard`, `#calendar`, etc.)

### Prototype A — zero dependency (“Vanilla SE SitRep”)

- **Goal:** “SE SitRep” SPA with **zero external dependencies** (no React/Vue/Tailwind/Bootstrap/jQuery/npm).
- **Architecture:**
  - Centralized **Store** + `localStorage` persistence
  - **Hash-based router** for views
  - Views via template literals + `#app` `innerHTML`
- **Features (client-side simulation where needed):**
  - Mock login, sprint calendar (active sprint highlight), async check-in (timestamped, sprint-linked)
  - Simulated AI summary / task suggestions → **AI Log**
  - Availability grid + “best meeting time” from overlap
  - Issue CRUD; critical issues → **Urgent** on dashboard
- **Deliverables:** `index.html`, `style.css`, `app.js`, `mockData.js`
- **Visual refs:** images 66–71 (dashboard, calendar, backlog, issues, availability, AI log)

### Prototype B — lean deps (“SE SitRep / Agile Operations Center”)

- **Philosophy:** “Lean & Mean” — maximize native APIs; libraries only where native is insufficient.
- **Architecture:**
  - `SitRepStore` with **Proxy-based** reactivity
  - **Native Web Components** (status badges, mood emojis, task cards)
  - `theme.css` with CSS variables (charcoal / neon purple `#A855F7`, status colors); **Bento Grid** layouts
  - **IndexedDB** helper for reports/backlog persistence
  - **AIEngine** simulates “SIT-BOT” (daily summary, sprint task suggestions, agent status in Team SitRep table)
- **Features:** All 9 user-facing areas (login, calendar, dashboard, async check-in, AI summaries, AI task suggestions, issues, activity log, availability); check-in modal with mood picker per mock
- **Deliverables:** `index.html`, `main.js`, `store.js`, `router.js`, `components/` directory
- **Visual refs:** images 72–76 (dashboard, check-ins, sprint board, analytics, new check-in modal)

---

## Decisions

- **Documentation approach:** Prefer **JSDoc** + generated API docs for JavaScript; **Conventional Commits** for changelog hygiene.
- **TypeScript:** Allowed only with an **ADR**; not the default path from this meeting.
- **Wednesday deadline:** Working demo + **video demonstration** (night of 5/14).
- **CI/CD:** Pursue a **push-to-deploy** pipeline toward **Google** hosting (can start partial).
- **Frontend priority:** Complete/test/document frontend before leaning on backend integration.
- **Dependency policy:** Either **reduce/reformat the current base without heavy deps**, or **document each retained dependency via ADR**.
- **Two prototypes** (zero-deps vs lean-deps) are the current comparison set for choosing a direction; align with specs in `051226-week7-meeting-notes.md` (especially async check-in / AI summary).

---

## Main goals (immediate)

1. **Reformat the existing frontend base** to reduce or eliminate unnecessary dependencies (or ADR each retained dependency).
2. Add **unit tests** and **end-to-end tests** for the frontend.
3. Write **ADRs** and **general documentation** explaining why the team chose stack, deps, and architecture.

---

## Action items

- [ ] Pick a frontend direction (Prototype A zero-deps vs Prototype B lean-deps) and reconcile with `051226-week7-meeting-notes.md` feature list.
- [ ] Draft ADR(s) for: dependency choices, any TypeScript decision, and AI-assist boundaries (design goals for AI-generated changes).
- [ ] Set up **JSDoc** (or equivalent) so API/docs stay in sync with code.
- [ ] Adopt **Conventional Commits** in the repo README or contributing guide.
- [ ] Deliver **working demo + video** by **Wednesday night (5/14)**.
- [ ] Start **CI/CD** pipeline (build on push → deploy to Google), even if initially partial.
- [ ] Add **frontend unit tests** and **E2E tests** for critical flows (login, check-in, calendar, issues).
- [ ] Team: review this file + `051226-week7-meeting-notes.md`; keep progress/blockers visible in Slack/GitHub.
