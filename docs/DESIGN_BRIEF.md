# Design Brief — SE SitRep

**Team:** CSE 110 Group 14 (CS Stress 14)  
**Product:** SE SitRep — a lightweight team status and sprint coordination tool for small Agile software teams.

---

## Problem

Small Agile teams struggle to stay aligned without constant synchronous meetings. Common questions go unanswered or get lost in chat:

- What is everyone doing today?
- Have we checked in?
- Are there blockers?
- How is the team feeling?
- When can we all meet?

Tools like [Steady](https://runsteady.com/) (formerly Status Hero) show this is a real product domain. Our course prompt also asks how this changes when **AI agents** are part of the team — they may need tracking and visibility too.

---

## Target users

| Role | Needs |
|------|--------|
| **Team member** | Quick async check-in, see own tasks and sprint context, report blockers |
| **Team lead / scrum lead** | Dashboard view of team progress, blockers, mood signals, sprint health |
| **Course stakeholder (TA)** | Observable Agile process, working MVP, clear documentation |

**Research artifacts:** personas and user stories in [`specs/research/`](../specs/research/) (e.g. `research-story-persona-allison.pdf`, `kaitlyn-user-stories.pdf`, `user_research_insights.pdf`).

---

## Product goals (this quarter)

1. **Async check-in** — daily progress in under ~60 seconds, attached to the active sprint.
2. **Team dashboard** — sprint progress, priority tasks, blockers, and activity at a glance.
3. **Blocker / issue tracking** — surface urgent items on the dashboard.
4. **Availability & calendar** — answer “when can we meet?” with sprint deadlines and team availability.
5. **AI-assisted summaries** — condense team reports so leads can sync without another meeting.
6. **Authentication & roles** — login, profiles, and lead vs. member visibility (e.g. mood data).

Full feature list: [`specs/feature/feature_list.md`](../specs/feature/feature_list.md).

---

## Out of scope (for now)

- Full replacement for Slack, Jira, or GitHub Issues
- Native mobile apps (web / PWA only)
- Heavy frameworks or large dependency stacks without TA approval
- Production-grade multi-tenant SaaS or billing

---

## Constraints

| Area | Choice |
|------|--------|
| **Frontend** | Vanilla HTML, CSS, modular ES modules (`source/mvp/`) |
| **Backend** | Cloudflare Worker + D1 (`source/worker/`) — Pages/Cloudflare only |
| **Process** | Documented sprints, standups, PRs, ADRs, CI/CD, tests |
| **Design inputs** | Personas, user stories, wireframes before heavy implementation |

Technical decisions recorded in [`specs/adr/`](../specs/adr/).

---

## Success criteria (MVP)

- User can **log in** and see a **personalized sprint dashboard**.
- User can submit an **async daily check-in** (status, blockers, notes).
- Team can view **blockers / issues** and sprint **calendar / availability**.
- **AI summary** of team reports is available to leads.
- App is **deployed** (GitHub Pages + Cloudflare Worker) with **CI tests** passing.

Requirements detail: [`specs/feature/specs_reqs.md`](../specs/feature/specs_reqs.md).

---

## Design progression

1. **Research** — domain study, personas, user stories → `specs/research/`
2. **Wireframes / mockups** — Figma and early prototypes → `source/prototype-02/`, meeting notes Week 6
3. **MVP** — modular app + API → `source/mvp/`, `source/worker/`
4. **Iterate** — Sprint 3 polish, live sync, peer feedback → `docs/CHANGELOG.md`

---

## Related docs

- [Feature specs](../specs/feature/feature_specs.md)
- [Deployment](DEPLOY.md)
- [Changelog](CHANGELOG.md)
