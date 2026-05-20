# 051426-week7-agile-standup.md

# Meeting Notes: Week 7 Agile Stand Up

## Team information

- **Team number / name:** CSE 110 — **Group 14** / **CS Stress 14**
- **Meeting type:** Agile Stand Up
- **Date:** May 14, 2026
- **Participants (in person):** Owen Atis, Kaitlyn Nguy, Binteng Tan, Rena Tokhi, Jacky Yu, Adithya Gundlapalli
- **Participants (async):** Remaining team members — caught up via meeting notes online (`admin/meetings/051426-week7-agile-standup.md`)
- **Related docs:** `051226-week7-meeting-notes.md` (frontend feature specs), `051326-week7-agile-standup.md` (prototype directions, JSDoc/ADR/CI/CD from 5/13)

---

## Session goals (status)

| Goal | Status |
|------|--------|
| Decide on a frontend prototype to base the project on | **Complete** |
| Establish a build pipeline for Wednesday | **Under discussion** |
| Set up proper documentation for current frontend | **In progress** |
| Implement small backend functionality | **In progress** |
| Set up proper unit testing | **In progress** |

---

## Discussion summary

### Team availability & meeting cadence

- Team is discussing **mandatory meeting dates**.
- **Standups after class:** **Tuesday** and **Thursday**.
- **Wednesday** left open as a possible day for an **in-person** session (not finalized).

### Frontend prototype decision

Last meeting left **three** frontend prototypes under consideration:

| Prototype | Contributors | Summary |
|-----------|--------------|---------|
| **Prototype 1** | Jacky Yu | Initial prototype; **many dependencies**; fully implemented frontend with working navigation between displays |
| **Prototype 2** | Benjamin Scheeger & Owen Atis | Recreated Prototype 1 with **zero dependencies**; visually similar to Prototype 1; minor visual feedback items when switching displays |
| **Prototype 3** | Benjamin Scheeger | Recreated Prototype 2 with **a few dependencies**; visually most different from the other two |

**Agreed prototype: Prototype 2** — expand this implementation going forward.

**Rationale:**

- Visually close to Prototype 1 (familiar UX baseline)
- **Fewer dependencies** → easier to track and justify in **ADR** documentation
- Reduces risk of brittle third-party packages breaking the final product
- **JavaScript** aligns with **JSDoc** documentation workflow from 5/13

### Build pipeline

- For work leading into **Thursday** and beyond, team wants a **proper build pipeline** for upcoming weeks.
- **Current pipeline:** GitHub Push → Build
- **Possible expansion:** GitHub Push → **Unit Test** → Build

### Frontend (Prototype 2)

- Prototype 2 originally had all logic in a **single `app.js`** (Benjamin Scheeger & Owen Atis).
- **Jacky Yu** refactored Prototype 2 so functionality is **split across multiple files** with clearer module boundaries.
- **Layout** is largely in place; **frontend functionality documentation** is **in progress**.

### Backend

- **Kaitlyn Nguy:** **Calendar integration** (Google API) is **in progress**.
- **Adithya Gundlapalli:** **Task model** implemented — add, edit, search, and sort; tasks persist to **backlog** via `local_storage`.
- Additional backend scope may shift toward **documentation** as priorities are finalized.

### Documentation

- Active discussion on documentation approach.
- Current plan includes: **prompts**, **functions** (e.g. JSDoc), **ADR** docs, and related artifacts.

### QA / quality assurance

- **QA approach** is **under discussion**; options on the table (mix also possible):

  1. **Frontend and Backend** implement unit tests; **QA** runs/reviews those tests.
  2. **QA** writes unit tests while reviewing code.
  3. **Hybrid:** dev teams own primary tests; QA adds tests for gaps found in review.

---

## Decisions

- **Base frontend:** **Prototype 2** (Benjamin Scheeger & Owen Atis; zero-dependency; modular refactor by Jacky Yu).
- **Meeting cadence (proposed):** Standups **Tuesday and Thursday** after class; Wednesday in-person TBD.
- **CI/CD direction:** Evolve pipeline toward **Push → Unit Test → Build** (build step exists today).
- **Documentation scope:** Prompts, function-level docs (JSDoc), and ADRs.
- **QA model:** Not finalized — hybrid approach is acceptable until roles are clearer.

---

## Action items

- [ ] Continue expanding **Prototype 2** as the canonical frontend codebase.
- [ ] Add **frontend functionality documentation** (JSDoc + any user-facing notes).
- [ ] Extend CI/CD: **GitHub Push → Unit Test → Build** (target for Thursday onward).
- [ ] **Kaitlyn Nguy:** Continue **Google Calendar API** integration.
- [ ] **Adithya Gundlapalli:** Finish/document **Task Model** + backlog `local_storage` behavior.
- [ ] Document and align remaining **backend** scope (including documentation tasks as needed).
- [ ] **ADR(s)** for retained choices (Prototype 2, deps, Google API, storage).
- [ ] Clarify **QA vs dev** ownership of unit tests (pick option 1, 2, or hybrid).
- [ ] Finalize **mandatory meeting schedule** (Tue/Thu standups; Wed in-person decision).
- [ ] Team: review `051226-week7-meeting-notes.md`, `051326-week7-agile-standup.md`, and this file; keep progress/blockers visible in Slack/GitHub.
