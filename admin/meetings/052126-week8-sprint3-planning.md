# 052126-week8-sprint3-planning.md

# Meeting Notes: Week 8 Sprint 3 Planning

## Team information

- **Team number / name:** CSE 110 — **Group 14** / **CS Stress 14**
- **Meeting type:** Sprint Planning Meeting (Sprint 3)
- **Date:** May 21, 2026
- **Duration:** Short planning sync (after Sprint Review & Retrospective)
- **Participants:** Team members present at lecture; others via async notes
- **Related docs:** `052126-week8-sprint-review-retrospective.md`, `052126-week8-agile-standup.md`

---

## Sprint 3 objective (Week 8)

- **Get Sprint 3 work done correctly** on top of the existing **MVP** (polish, align, and document — not rebuild from scratch).

---

## Sprint 3 tasks (summary)

| # | Task | Owners |
|---|------|--------|
| 1 | **Design:** Adjust MVP UI (e.g. **time availability** and related screens) | Design |
| 2 | **Frontend:** Adapt MVP frontend to the updated design | Front End |
| 3 | **Backend:** Apply supporting changes (including **Calendar** fix) | Back End |
| 4 | **Code standards (frontend):** Review frontend conventions; fix or ticket issues | Front End + **QA** |
| 5 | **Code standards (backend):** Review backend conventions; fix or ticket issues | Back End + **QA** |
| 6 | **MVP documentation:** Document the MVP (features, setup, architecture, usage) | **Documentation** group |

---

## Sprint Goal

Complete Sprint 3 (Week 8) work by:

- Updating the **design/UI** (MVP frontend) — especially **time availability**
- **Frontend** implements design changes on the MVP
- **Backend** supports UI changes and fixes **Calendar**
- **Code standards** review completed separately for **frontend** and **backend** (each group owns its stack; **QA** participates in both)
- **MVP documentation** written and committed by the **Documentation** group

---

## Scope

### 1) Design & UI updates

- **Design group** adjusts MVP screens and interaction patterns.
- **Time availability** flow/UI needs revision (clarity, input, and display).
- Provide updated mocks/specs so frontend can implement consistently.

### 2) Frontend

- **Frontend** adapts MVP UI to the updated design (layout, components, availability-related views).
- Coordinate with backend on API/data contracts affected by UI changes.

### 3) Backend

- **Backend** implements/fixes supporting logic — including **Calendar** fixes and any API changes required by the new UI.
- Keep changes testable via the **QA test pipeline / CI/CD**.

### 4) Code standards — frontend

- **Front End group** reviews frontend code conventions (style, structure, component patterns, PR hygiene).
- **QA + Testing** participates in the frontend standards pass (lint/tests/pipeline as applicable).
- Findings → fixes or GitHub issues owned by frontend.

### 5) Code standards — backend

- **Back End group** reviews backend code conventions (API structure, error handling, tests, PR hygiene).
- **QA + Testing** participates in the backend standards pass (pipeline/test coverage as applicable).
- Findings → fixes or GitHub issues owned by backend.

### 6) MVP documentation

- **Documentation group** owns MVP documentation end-to-end.
- Document the current **MVP** so others (TAs, peer review, future teammates) can understand what it does and how to run it.
- Suggested contents: overview, main features, setup/run instructions, high-level architecture, known limitations, and links to design/specs where relevant.

---

## Deliverables

- [ ] Updated design artifacts (Figma/docs) for **time availability** and related MVP screens
- [ ] Frontend MVP UI updated to match new design
- [ ] Backend changes merged (Calendar + any availability-related endpoints/logic)
- [ ] **Frontend** code standards review completed (Front End + QA; findings documented)
- [ ] **Backend** code standards review completed (Back End + QA; findings documented)
- [ ] **MVP documentation** committed to the repo by **Documentation** group (e.g. under `docs/` or agreed folder)
- [ ] Tests passing through **test pipeline / CI/CD** on main integration branch

---

## Deadlines / cadence

- **Week 8 (Sprint 3):** Execute Sprint 3 scope above; use **weekly Wednesday** standup + collaborative work session (per retrospective incorporation).
- **Ongoing:** Async updates in Slack/GitHub when unable to attend Wednesday session.

---

## Work distribution (high-level)

| Area | Owners | Focus |
|------|--------|--------|
| Design / UI | Design group | Time availability UX, MVP screen revisions |
| Frontend | Front End group | Implement design updates on MVP |
| Backend | Back End group | Calendar fix + API/logic for UI changes |
| QA / CI | QA + Testing | Pipeline runs, testing tasks, quality gates |
| Code standards (frontend) | Front End + QA | Frontend convention review + fixes/issues |
| Code standards (backend) | Back End + QA | Backend convention review + fixes/issues |
| MVP documentation | Documentation group | MVP overview, setup, features, architecture notes |

---

## Decisions

- Sprint 3 is explicitly a **polish + alignment sprint**: MVP exists; **Week 8** improves UX/integration and code health.
- **Wednesday collaborative meetings** are the default integration mechanism for Sprint 3 (see `052126-week8-sprint-review-retrospective.md`).
- **Calendar** fix remains a backend priority carried from prior Week 8 work into Sprint 3.

---

## Upcoming ceremonies

- **Weekly Wednesday:** Standup + in-person collaborative work block.
- **After lecture (Tue/Wed as available):** Short sync when lecture attendees are present.

---

## Action items

- [ ] **Design:** Revise MVP UI (**time availability** + related screens); publish updated references for frontend.
- [ ] **Frontend:** Implement design changes; pair with backend on contract changes.
- [ ] **Backend:** Complete **Calendar** fix; support availability-related backend work.
- [ ] **QA:** Run **test pipeline / CI/CD** on Sprint 3 PRs; track failures.
- [ ] **Front End + QA:** Complete **frontend code standards** review; file/fix frontend issues.
- [ ] **Back End + QA:** Complete **backend code standards** review; file/fix backend issues.
- [ ] **Documentation group:** Write and commit **MVP documentation** (run guide + feature/architecture summary).
- [ ] **All:** Post progress/blockers in Slack/GitHub if missing Wednesday session.
