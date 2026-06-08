# Specifications and Requirements

---

## 1. Needed Features

1. Daily check-in form (asynchronous, under 60 seconds).
2. Team status dashboard.
3. Blocker tracking page.
4. Mood / wellbeing signal (visible to everyone or team leads only?).
5. Meeting availability / schedule sync ("When can we all meet?").
6. User authentication (constrained to Cloudflare capabilities or pure client-side mock for initial sprints).

---

## 2. Agile Process & Documentation Requirements

| Requirement          | Description                                                                                                                          |
| :------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| Sprints & Planning   | Documented sprint planning meetings before starting each sprint. Capture results in GitHub.                                          |
| Stand-ups            | Held virtually (Slack) and/or in-person at least 3 times a week, captured in GitHub.                                                 |
| Issue Tracking       | Capture all tasks in GitHub Issues. Work happens and is documented there.                                                            |
| Retrospectives       | At least 2 sprint reviews and retrospectives done and documented by end of quarter.                                                  |
| Pull Requests        | Any code batch (human or AI-generated) exceeding 300 Lines of Code (LoC) requires a pull-request path with evaluation by a teammate. |
| Architecture Records | Capture all major technical decisions as Architectural Decision Records (ADRs) using the MADR format.                                |
| Code Documentation   | Code documentation must be maintained incrementally, strictly utilizing JSDocs for commenting.                                       |

---

## 3. Functional Requirements

**MoSCoW prioritization:**

- **MUST** — non-negotiable for MVP
- **SHOULD** — high value
- **COULD** — nice-to-have

---

### 3.1 Authentication & User Management

_(if we do use authentication, otherwise this is not needed)_

| Feature / Requirement | Priority | Description & Rationale                                                                                                                                    | Acceptance Criteria                                                 |
| :-------------------- | :------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| Core Authentication   |   MUST   | Secure login. Given technical constraints, auth will likely be handled via Cloudflare Access, Cloudflare Workers + JWT, or a TA-approved lightweight BaaS. | User can log in and out securely. Session persists.                 |
| Role Assignment       |   MUST   | Each user is a Lead, Member, or Agent. Leads see mood data.                                                                                                | Lead sees mood signals for all members. Member sees only their own. |

---

### 3.2 Daily Check-In System & Dashboard

| Feature / Requirement   | Priority | Description & Rationale                                                               | Acceptance Criteria                                                           |
| :---------------------- | :------: | :------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------- |
| Daily Check-In Form     |   MUST   | 3 mandatory fields (Work Today, Next Steps, Blocked Status) + optional mood selector. | Form submits with required fields. Mood is optional.                          |
| Mood / Wellbeing Signal |   MUST   | Emoji-scale mood selector. Only the team lead sees individual mood data.              | Mood field visible to submitter and (everyone else or team lead only?).       |
| Team Status Overview    |   MUST   | Main page showing all members' current-day check-in status and blockers.              | Dashboard loads quickly. Members with no check-in show 'Waiting'.             |
| Schedule Sync           |  SHOULD  | A lightweight view of team availability to answer "When can we all meet?".            | Members can input general availability blocks; dashboard visualizes overlaps. |

---

### 3.3 AI Agent Integration

| Feature / Requirement      | Priority | Description & Rationale                                                                                       | Acceptance Criteria                                                               |
| :------------------------- | :------: | :------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------- |
| Agent Status Feed          |  SHOULD  | AI agents appear in the team list and post automated updates (e.g., "Opened PR", "Tests failed").             | Agent card appears in the dashboard with an 'Agent' badge.                        |
| Generative AI Transparency |   MUST   | If GenAI is used to write project code, it must be explicitly exposed and discussed in PRs and documentation. | PR descriptions denote AI-generated segments; teams verify code quality manually. |

---

## 4. Technical & Non-Functional Requirements

> **IMPORTANT ARCHITECTURE NOTE:** All frameworks (React, Vue, Tailwind, etc.) are prohibited without TA approval. The tech stack must reflect fundamental web technologies.

---

### 4.1 Technology Stack Constraints

| Feature / Requirement  | Priority | Description                                                                                 | Acceptance Criteria                                                                              |
| :--------------------- | :------: | :------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------- |
| Frontend Stack         |   MUST   | Standards-based HTML, CSS without a framework, and Vanilla JavaScript without a framework.  | No package.json dependencies for React, Tailwind, Bootstrap, etc., unless ADR approved by TA.    |
| Backend & Hosting      |   MUST   | Server-side logic and hosting must operate exclusively on Cloudflare or GitHub Pages.       | Application deploys successfully via GitHub Actions to Cloudflare Pages/Workers or GitHub Pages. |
| Versioning             |   MUST   | Semantic Versioning (SemVer) must be utilized across the repository.                        | Tags and releases follow MAJOR.MINOR.PATCH format (SemVer).                                      |
| End-User Documentation |   MUST   | All projects must have a dedicated website to document the produced software for end users. | A public-facing documentation site exists alongside the application.                             |

---

### 4.2 CI/CD and Testing

| Feature / Requirement      | Priority | Description                                                                                        | Acceptance Criteria                                                                                                 |
| :------------------------- | :------: | :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| CI/CD Pipeline             |   MUST   | A Continuous Integration/Continuous Deployment pipeline must be built using GitHub Actions.        | Commits to main trigger automated tests and deployments to Cloudflare/GitHub Pages.                                 |
| Early Testing (Unit & E2E) |   MUST   | Unit and End-to-End testing must be demonstrated early and continuously, not tacked on at the end. | Repository contains verifiable testing suites (e.g., Jest/Playwright configured for vanilla JS) from early sprints. |
| Linting & Quality Checks   |   MUST   | Automated linting checks via the CI pipeline.                                                      | Pipeline fails if code does not pass ESLint/Prettier (or equivalent vanilla linters).                               |

---

## 5. Summary

A lightweight, web-based team status and check-in platform purpose-built for software engineering project teams. The fundamental problem it addresses is the fragmentation of team awareness across disconnected tools.
