# Changelog

**SE SitRep** — CSE 110 Group 14 (CS Stress 14)

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

| Version | Date (approx.) | Git tag |
|---------|----------------|---------|
| [0.1.2](#012--2026-05-26) | 2026-05-26 → present | *current release* |
| [0.1.1](#011--2026-05-24) | 2026-05-24 | `v0.1.1` / `V0.1.0` |
| [0.0.1](#001--2026-05-21) | 2026-05-21 | `0.0.1` |
| [0.0.0](#000--2026-04-10) | 2026-04-10 → 2026-05-19 | — |

---

## [0.1.2] — 2026-05-26

Sprint 3 polish, live sync, UX improvements, and documentation for final submission.

### `source/mvp/` (frontend)
- Redesigned **Backlog** page and Add Task modal; task detail opens on row click.
- **Rich-text descriptions** for tasks (bold, italic, lists) with formatting toolbar.
- **Delete task** from backlog detail modal.
- **Re-open Issue** button to undo resolved status.
- **Editable** issues and daily reports in the UI.
- **Team availability** page — interactive layout, availability log, meeting modal fixes.
- **Live network sync** — multi-assign tasks, sub-tasks, shared state via API.
- Sprint picker uses **stored sprint status** instead of recalculating from date only.
- Google Calendar sync button and saved calendar view fixes.
- Search bar and editor focus fixes; task description shown and saved correctly end-to-end.
- **JSDoc** added across `components/`, `config/`, `core/`, `services/`, `utils/`, `views/`, `main.js`.

### `source/worker/` (API)
- `DELETE /api/tasks/:id` endpoint.
- Task **description** field persisted and returned on create/update.
- Fixes for remote task merge collisions and store sync errors.

### `source/prototype-02/`
- Live network sync and availability log parity with MVP experiments.
- E2E test fixes for availability UI.

### `specs/`
- `feature/specs_reqs.md` — consolidated requirements from planning phase.
- `adr/prototype2-adr.md`, Cloudflare + Google Calendar ADRs updated.

### `docs/`
- `GENAI_USAGE.md` — team GenAI principles and lessons learned.
- `DEPLOY.md` — unchanged deploy path; referenced for AI secret setup.

### `admin/`
- `meetings/` — Week 8 sprint review & retrospective, Sprint 3 planning; Week 9–10 standups (`052626`–`060726`).
- `feedback/feedback.md` — Group 15 peer repository review (May 26).

### CI / tests
- Unit and E2E tests updated for backlog redesign, availability, and description editor.
- Issue view redesign tried and **reverted** (PR #84 → #85) after team review.

### Notable dev log (see [raw log](#012-raw-log-2026-05-26--present))
- May 29: large `rena-live-network` merge batch — sync, backlog, calendar, availability.
- May 31–Jun 1: description editor + delete task + Worker DELETE endpoint.
- Jun 5–7: `specs_reqs.md`, Week 9/10 notes, `GENAI_USAGE.md`.

---

## [0.1.1] — 2026-05-24

Calendar integration and mobile fixes after first MVP tag.

### `source/mvp/`
- **Google Calendar** OAuth client, sync button, and calendar display on dashboard.
- **Sprint calendar** feature merged (`add_calendar`).
- **Mobile** — navigation expand on small screens; responsive test fixes.
- Sprint task display and auto-close behavior fixes.

### `specs/adr/`
- `googlecalendar-adr.md` — decision record for Calendar integration.

### `admin/meetings/`
- Week 8 TA meeting, agile standups, sprint review, Sprint 3 planning notes (`051826`, `051926`, `052126-*`).

### Notable dev log (see [raw log](#011-raw-log-2026-05-24--2026-05-25))
- May 22: Google client ID, API key, sync button in partials, calendar resync.
- May 25: `add_calendar` feature PR #62 merged; meeting notes naming aligned.

---

## [0.0.1] — 2026-05-21

First tagged MVP — runnable app with deploy pipeline and demo video.

### `source/mvp/` (new)
- Modular ES frontend: login, dashboard, daily check-in, backlog, issues, sprint views.
- Toast / low-lag feedback messages; placeholder screens replaced with working UI.
- Initial JSDoc and unit tests.

### `source/worker/` (new)
- Cloudflare Worker + D1 API: auth (JWT), tasks, issues, reports, sprints.
- DeepSeek routes: `POST /api/ai/team-summary` (and suggest-tasks).
- `schema.sql`, `seed.sql` — demo user `maya@team.local`.

### `source/prototype-02/`
- Weekly **availability check** flow added (feeds MVP design).

### `.github/workflows/`
- **CI** — lint, unit tests (MVP + prototype-02), Worker tests, E2E smoke.
- **Deploy** — GitHub Pages (`source/mvp`) + Worker publish on push to `main`.

### `docs/`
- `DEPLOY.md` — one-time Cloudflare setup and GitHub Actions variables.

### `admin/`
- `videos/statusvideo1.mp4` + [YouTube demo](https://www.youtube.com/watch?v=CDHrgQq1I8E).
- Week 7 meeting notes; MVP sprint standups (`052026`, `052126`).

### Removed
- Render backend deploy path; `source/backend` dropped from pipeline.

### Notable dev log (see [raw log](#000-raw-log-2026-04-10--2026-05-19))
- May 20: `mvp` branch merged (PR #36–#55) — largest single-day import; Cloudflare deploy same day.
- May 21: `mvp-mobile` PRs #56–#61 — mobile nav + sprint auto-close fixes (tag `0.0.1`).

---

## [0.0.0] — 2026-04-10 → 2026-05-19

Discovery, research, and prototype phase (no semver tag).

### `admin/`
- Team roster, rules, branding (`team.md`, signed contracts).
- Kickoff and Week 2–6 meeting notes; team intro video.
- AI warm-up planning notes.

### `specs/`
- `research/` — user personas and research PDFs (all members).
- `feature/feature_list.md`, `feature_specs.md` — product scope (login, calendar, check-in, AI, issues, backlog).
- `adr/` folder — MADR template for architecture decisions.

### `source/` (prototypes)
- **Prototype v1** — first static UI scaffold.
- **`prototype-02/`** — vanilla JS SPA (hash router, store, taskService, localStorage); becomes CI test baseline.
- **Prototype-03** — experimental wireframe with limited dependencies.
- Google Calendar OAuth experiments (client ID, API key).

### `.github/workflows/`
- First **CI workflow** for prototype-02 (ESLint, Stylelint, html-validate, Jest).

### Other
- `cse110_14_docume.md` — early architecture / operational draft.
- Path from prototype → **`source/mvp/`** import begins end of phase (Week 7–8).

### Notable dev log (see [raw log](#000-raw-log-2026-04-10--2026-05-19))
- Apr 10–13: repo bootstrap, team rules/contracts, kickoff notes, intro video.
- May 4–12: all members upload research; `feature_list` + prototype v1 (PR #18).
- May 13–14: prototype-02/03 wireframes; refactor into modular `.js`; calendar OAuth experiments.
- May 20 (start of 0.0.1): CI workflow PR #35 lands end of this phase.

---

---

## Raw commit log

Summaries from `git log --reverse` (**245** entries). Useful for tracing *when* something landed; top sections above describe *what* changed by area.

### [0.0.0] raw log (2026-04-10 → 2026-05-19)

*98 entries — 72 direct commits, 26 merges*

#### 2026-04-10

- initial commit
- folder
- added rules
- added rules
- added rules
- Add files via upload
- removed rules yuwu
- Add files via upload
- Alex contract
- added placeholder for brand
- Merged PR #1 (`cse110-sp26-group14/yuwu`)
- Add files via upload
- added team md
- added team page
- Merged PR #2 (`cse110-sp26-group14/yuwu`)
- Added signed rules file
- Add files via upload

#### 2026-04-11

- Add files via upload
- Add files via upload
- Rules - Owen Atis
- kaitlyn nguy's signed contract
- added binteng's rule
- Merged PR

#### 2026-04-12

- Owen - team.md Additions
- added team.md
- Update team.md
- added team md
- add backend role Allison
- added kickoff meeting notes
- updated teams.md
- updated teams.md
- updated teams.md
- added another meeting notes
- added team.md, fix meeting notes
- added video link
- format space
- format

#### 2026-04-13

- Added video
- Add project rules and guidelines for CSE110 group
- Add files via upload
- Delete admin/misc/rules-AdithyaGundlapalli
- added TA meeting notes
- update Jacky's About Me

#### 2026-04-20

- added meeting notes 4:20
- Merged PR #4 (`cse110-sp26-group14/meeting-notes-4-20`)
- added meeting notes
- Merged PR #5 (`cse110-sp26-group14/meeting-notes-4-20`)
- Update 041226-week2.md

#### 2026-05-04

- added week5 agile meetings
- added TA meeting notes
- Merged PR #6 (`cse110-sp26-group14/meeting-notes-4-20`)
- added research folder for the sprint 1
- added yuwu's research
- Merged PR #8 (`cse110-sp26-group14/yuwu-research`)
- Merged PR

#### 2026-05-05

- added allison's research
- Merged PR #9 (`cse110-sp26-group14/research/allison`)
- Rename research pdf allison
- jacky prelim research #7
- Merged PR #10 (`cse110-sp26-group14/jacky-research`)

#### 2026-05-07

- Add files via upload
- Merged PR #11 (`cse110-sp26-group14/binteng`)

#### 2026-05-10

- Added my research and user stories
- added alex research
- Add files via upload
- Owen Atis Project Research
- Add files via upload

#### 2026-05-11

- added week6 meeting
- Merged PR #12 (`cse110-sp26-group14/yuwu-research`)

#### 2026-05-12

- add research
- added user research pdf
- Merged PR #16 (`cse110-sp26-group14/alex1`)
- added feature_list and feature specs
- added feature to the right place
- Merged PR #17 (`cse110-sp26-group14/feature_summary`)
- added adr folder for future step
- prototype commit v1
- Merged PR #18 (`cse110-sp26-group14/jacky-frontend-prototype-01`)
- Pushing in the Meeting Notes for 05/12/2026

#### 2026-05-13

- Merged PR
- Merged PR #19 (`cse110-sp26-group14/main`)
- Merged PR #21 (`cse110-sp26-group14/owen`)
- Added prototype-02 and prototype-03 as further rough wireframes. Prototype-02 uses only vanilla dev tools, and Prototype-03 uses limited dependencies

#### 2026-05-14

- Merged PR #22 (`cse110-sp26-group14/ben_branch`)
- add client id
- added client id in app.js
- Refactored the code base into its own folder and .js
- oauth pops up but access blocked
- Merged PR #23 (`cse110-sp26-group14/jacky-prototype-02-improvement-01`)
- calendar api key now works onto the list
- Merged PR
- Merged PR #28 (`cse110-sp26-group14/kait-be-p01`)

#### 2026-05-15

- update backlog changes

#### 2026-05-16

- Merged PR
- Merged PR #29 (`cse110-sp26-group14/adithya-branch`)

#### 2026-05-17

- Merged PR

#### 2026-05-19

- Added GitIgnore
- Merged PR

### [0.0.1] raw log (2026-05-20 → 2026-05-23)

*70 entries — 41 direct commits, 29 merges*

#### 2026-05-20

- added first draft of documentation
- Merged PR #31 (`cse110-sp26-group14/chripach`)
- added week7 meeting notes
- Merged PR #34 (`cse110-sp26-group14/yuwu-meetingnotes`)
- Add CI workflow for prototype-02 (lint, unit tests, e2e placeholder)
- Merged PR #35 (`cse110-sp26-group14/qa-feature-cicd`)
- added mvp
- Merged PR #36 (`cse110-sp26-group14/mvp`)
- fix(mvp): CI unit tests use local auth, register jest setup
- Merged PR #37 (`cse110-sp26-group14/mvp-yuwu`)
- changed api to deepseek
- Merged PR #38 (`cse110-sp26-group14/mvp`)
- fix(ci): deploy workflow secrets syntax for Render hook
- Merged PR #39 (`cse110-sp26-group14/mvp`)
- fix(ci): deploy workflow secrets syntax for Render hook
- Merged PR #40 (`cse110-sp26-group14/mvp`)
- test action
- Merged PR #41 (`cse110-sp26-group14/mvp`)
- added more features replaced the placeholder
- Merged PR
- Merged PR #42 (`cse110-sp26-group14/mvp`)
- added the render to deploy
- Merged PR #43 (`cse110-sp26-group14/mvp`)
- feat(prototype-02): add weekly availability check flow
- another test to fix the issue for sed can not run
- Merged PR #45 (`cse110-sp26-group14/mvp`)
- added jsdoc and more test on new features
- Merged PR #46 (`cse110-sp26-group14/mvp`)
- fixed css selector issue
- Merged PR #47 (`cse110-sp26-group14/mvp`)
- added unit test for latest feature
- Merged PR #48 (`cse110-sp26-group14/mvp`)
- added unit test for latest feature
- Merged PR #49 (`cse110-sp26-group14/mvp`)
- Deploy Cloudflare Worker and GitHub Pages
- Merged PR #50 (`cse110-sp26-group14/mvp`)
- Remove Render backend; wire GitHub Actions to Cloudflare Worker.
- Drop Render/backend from deploy paths; ignore source/backend.
- Merged PR #51 (`cse110-sp26-group14/mvp`)
- added a low lag message
- Merged PR #52 (`cse110-sp26-group14/mvp`)
- fixed the toast
- Merged PR #53 (`cse110-sp26-group14/mvp`)
- fixed the toast
- Merged PR #54 (`cse110-sp26-group14/mvp`)
- fixed the toast
- Merged PR #55 (`cse110-sp26-group14/mvp`)
- [Video] Status1 Video
- Rename statusvideo1.mp4.mp4 to statusvideo1.mp4
- Fixed the status video 1
- added video
- added video link in readme

#### 2026-05-21

- added the fix for the mobile
- Merged PR #56 (`cse110-sp26-group14/mvp-mobile`)
- added the fix for the mobile
- Merged PR #57 (`cse110-sp26-group14/mvp-mobile`)
- fixed the test for mobile
- Merged PR #58 (`cse110-sp26-group14/mvp-mobile`)
- fixed the bug for the mobile app could not expand the nevegation
- Merged PR #59 (`cse110-sp26-group14/mvp-mobile`)
- fixed the bug for sprint not auto closing
- Merged PR #60 (`cse110-sp26-group14/mvp-mobile`)
- fixed the sprint task
- Merged PR #61 (`cse110-sp26-group14/mvp-mobile`)

#### 2026-05-22

- add sync button in partials
- resynced google calendar
- added client id
- i accidentally added the local link oopsie
- removed extra sync button
- added api key

### [0.1.1] raw log (2026-05-24 → 2026-05-25)

*6 entries — 4 direct commits, 2 merges*

#### 2026-05-24

- added week8 meeting notes
- added meeting notes for the review, planning

#### 2026-05-25

- Merged PR #63 (`cse110-sp26-group14/mvp-mobile`)
- [Feature] Merge pull request #62 from cse110-sp26-group14/add_calendar
- Merged PR #44 (`cse110-sp26-group14/ben_branch_2`)
- changed the naming of the meeting notes to align with previous ones

### [0.1.2] raw log (2026-05-26 → present)

*71 entries — 47 direct commits, 24 merges*

#### 2026-05-26

- Added group 15 repository review
- changed the name for the feedback and put it into the directory
- changed the name for the feedback and put it into the directory

#### 2026-05-29

- feat: live network sync, multi-assign tasks, and sub-tasks (prototype-02)
- Merged PR #70 (`cse110-sp26-group14/rena-live-network`)
- feat(mvp): live network sync, multi-assign tasks, and sub-tasks
- fix(mvp): pickDefaultSprint uses stored status instead of recalculating from real date
- Merged PR #71 (`cse110-sp26-group14/rena-live-network`)
- CLoaudfare and Google Calendar ADR
- Make issues and reports editable
- Fixed small bug
- Another Bug Fix
- fix: avoid updateTaskRemote merge collision
- Merged PR #74 (`cse110-sp26-group14/ben_branch_2`)
- Almost complete Google Calendar API
- Merged PR #75 (`cse110-sp26-group14/OwenDocumentation`)
- fixed api base url and bugged sync google calendar button
- saved calendar view
- Merged PR #77 (`cse110-sp26-group14/calendar_bugs`)
- feat(mvp): redesign Backlog UI and Add Task modal to match new design
- fix(mvp): fix e2e test failures from UI redesign
- Merged PR #79 (`cse110-sp26-group14/rena-live-network`)
- feat(mvp): open task detail modal on row click in backlog
- Merged PR #82 (`cse110-sp26-group14/rena-live-network`)
- feat: implemented interactive team availability page

#### 2026-05-30

- Issue view frontend redesign
- Merged PR #84 (`cse110-sp26-group14/jacky-frontend-redesign-01`)
- Revert "Issue view frontend redesign"
- Merged PR #85 (`cse110-sp26-group14/revert-84-jacky-frontend-redesign-01`)

#### 2026-05-31

- JSdocs added to files in /components
- added JSDocs to files in /config and /core
- added JSDocs to files in /services
- added JSDocs to files in /utils. many had docs with no description, so added descriptions.
- added JSDocs to files in /views. added descriptions where functions had none.
- added JSDocs to file main
- adding prototype2-adr file
- Merged PR #86 (`cse110-sp26-group14/addJSDocs`)
- fix(mvp): show task description in backlog detail modal
- Merged PR #87 (`cse110-sp26-group14/rena-live-network`)
- fix(mvp): restore focus after rerender so search bar doesn't pause on each keystroke
- Merged PR #88 (`cse110-sp26-group14/rena-live-network`)
- fix(mvp): wire up formatting toolbar buttons in task creation modal
- Merged PR #89 (`cse110-sp26-group14/rena-live-network`)
- fix(mvp): prevent formatting toolbar buttons from stealing textarea focus
- Merged PR #90 (`cse110-sp26-group14/rena-live-network`)
- Fix media query syntax and formatting in CSS files
- Fix failing CI tests: correct avail-add-meeting button ID in E2E, add Availability Log section to prototype-02 view
- Re-apply: add Availability Log section to prototype-02 AvailabilityView
- Fix: always open meeting modal from avail button regardless of best time data
- fix(mvp): replace description textarea with contenteditable rich text editor for real bold/italic/list formatting
- Fix: availability log shows 'name submitted weekKey' and 'Local busy blocks were applied'
- Merged PR #91 (`cse110-sp26-group14/rena-live-network`)
- Merged PR #83 (`cse110-sp26-group14/adithya-branch-2`)
- fix(mvp): add proper indentation styling for lists in description editor
- Merged PR #92 (`cse110-sp26-group14/rena-live-network`)
- feat(mvp): add delete task button to backlog task detail modal
- Merged PR #93 (`cse110-sp26-group14/rena-live-network`)

#### 2026-06-01

- Merged PR
- feat(worker): add DELETE /api/tasks/:id endpoint
- Merged PR #94 (`cse110-sp26-group14/rena-live-network`)
- fix(worker): save and return description field on tasks
- Merged PR #95 (`cse110-sp26-group14/rena-live-network`)
- fix(mvp): sync description hidden input on form submit before FormData is collected
- Merged PR #96 (`cse110-sp26-group14/rena-live-network`)
- feat: add Re-open Issue button to undo resolved status

#### 2026-06-04

- Fix runtime errors store.js and dataSyncService.js and also JSDoc for deleteTask from add to delete in store.js
- Merged PR #97 (`cse110-sp26-group14/allison/feat-unresolve-issue`)

#### 2026-06-05

- specs: document of specs and reqs from planning phase
- Merged PR #98 (`cse110-sp26-group14/allison/add-specs-reqs-doc`)

#### 2026-06-07

- added the week 9, 10 meeting notes
- added ai_use log documentation

## Maintenance

- **Summary sections** — update per release (`0.1.2` is current; latest Git tag is `v0.1.1`).
- **Raw log** — refresh from: `git log --format='%ad|%s' --date=short --reverse`
