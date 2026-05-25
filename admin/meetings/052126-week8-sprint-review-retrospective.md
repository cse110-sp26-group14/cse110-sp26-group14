# 052126-week8-sprint-review-retrospective.md

# Meeting Notes: Week 8 Sprint Review & Retrospective

## Team information

- **Team number / name:** CSE 110 — **Group 14** / **CS Stress 14**
- **Meeting type:** Sprint Review + Sprint Retrospective (combined)
- **Date:** May 21, 2026
- **Duration:** Short sync (after lecture)
- **Participants:** Team members who attended lecture; others catch up via notes (async)
- **Related docs:** `052026-week8-agile-standup.md`, `052126-week8-agile-standup.md`, `051926-week8-agile-standup.md`

---

## Sprint Review (Sprint 2 → MVP milestone)

### Summary of completed work

- Team reviewed progress on prior sprint tasks and overall delivery.
- Overall assessment: **Sprint 2 went well** — the team made strong progress from planning through implementation.
- Key outcomes delivered:
  - **Prototype → MVP** (working baseline; Yu and teammates drove MVP completion; team notified on **5/21**).
  - **QA test pipeline** established and reported **ready** (**5/21**).
  - **CI/CD** work advanced in parallel with QA/testing (Push → test → build direction).
  - **Demo video** planned, recorded, and aligned with the **5/20** timeline (`052026-week8-agile-standup.md`).

### What went well

- Clear milestone progression: discovery/prototype work → **MVP** suitable for demo and further iteration.
- QA ownership of **testing pipeline** improved confidence in changes landing on main.
- Meeting notes and GitHub artifacts provide traceability for standups and sprint ceremonies.

### Gaps / carry-over

- **Calendar** functionality still needs backend fixes (identified **5/21**; in progress).
- **Design** will update **MVP frontend** (UI polish on current MVP).
- Some teammates could not join every live session; async updates remain necessary but were not always sufficient on their own.

---

## Sprint Retrospective

### What worked

- Sprint 2 planning and execution were **effective** — team completed major technical milestones (prototype/MVP, pipeline).
- When people **coordinated live** (lecture follow-ups, targeted syncs), blockers were resolved faster.

### What did not work as well

- **Async-only coordination** sometimes slowed assigned tasks — progress was harder to verify without live alignment.
- Not everyone could attend every evening/Zoom session; information had to be relayed via Slack/notes.

### Root cause (process)

- Tasks assigned across sub-teams (frontend, backend, design, QA) need **shared work time** to integrate changes, not only asynchronous status updates.

### Team feedback (context shared for next session)

> During a prior lecture/work session, some teammates felt workflow efficiency could improve if we rely only on async updates. A **focused in-person collaborative session after lecture** (hackathon-style) was suggested so people work in the same place and unblock each other faster.  
> — Coordination message (Yu Wu), shared before the post-lecture working session.

---

## Retrospective action items (incorporation — evidence)

| Retrospective insight | Concrete change (evidence) |
|----------------------|----------------------------|
| Need more **synchronous, in-person collaboration** | Schedule **weekly Wednesday** team session: **standup-style check-in + collaborative work block** (not notes-only). |
| Async updates alone are insufficient | If unable to attend Wednesday session, members **must** post progress + blockers in **Slack/GitHub**; owners respond same week. |
| Align sub-teams before Week 9 push | **Backend** fixes **Calendar**; **Design** updates MVP UI (e.g., time availability); **Frontend** adapts to design changes. |

### Decisions (process improvements)

- **Adopt weekly Wednesday working meeting** for the remainder of the quarter:
  - Short **standup** (what we did / doing / blockers).
  - **Collaborative work time** afterward (hackathon-style), especially for integration tasks.
- Continue **Tuesday after-lecture** sync when available; Wednesday is the **mandatory alignment + work** anchor.
- Post-lecture **focused work sessions** encouraged when tasks need cross-group coordination (per team message above).

---

## Action items

- [ ] **All:** Attend **Wednesday** standup + work session when possible; otherwise update Slack/GitHub with progress and blockers.
- [ ] **Backend:** Fix **Calendar**; coordinate with frontend/design.
- [ ] **Design:** Revise MVP UI (including **time availability** UX); hand off specs to frontend.
- [ ] **QA:** Keep **test pipeline / CI/CD** running on new PRs; flag regressions early.
- [ ] **Yu / leads:** Keep `admin/meetings/` notes updated so async members stay aligned.
