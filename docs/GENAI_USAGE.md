# Generative AI (GenAI) Usage Policy

**Team:** CSE 110 — Group 14 (CS Stress 14)

Per course requirements (`specs/feature/specs_reqs.md` §3.3), **GenAI may be used on this project. If used, it must be exposed and discussed** in pull requests and project documentation. This file records our team’s principles and where we have used GenAI so far.

---

## Principles

1. **Transparency** — Any meaningful GenAI assistance on project code or deliverables is disclosed and discussed as a team (this document, meeting notes, standups).
2. **Supervised use** — GenAI output is a draft, not a final submission. A teammate reviews, tests, and integrates changes before merge.
3. **Human accountability** — We own correctness, security, and design fit. AI does not replace code review, testing, or architectural decisions.
4. **Appropriate scope** — GenAI is used to accelerate repetitive or boilerplate work (scaffolding, doc drafts, refactors). Core product logic and team process decisions remain human-led.

---

## What we use GenAI for

| Area | How GenAI is used | Human oversight |
|------|-------------------|-----------------|
| **MVP / prototype code** | Helped organize and translate early **prototype** UI into runnable MVP structure (layout, component scaffolding, wiring). | Front end, back end, and design reviewed output; bugs fixed in person; QA runs tests via CI pipeline. |
| **Documentation** | Drafted and structured **quick-start** and operational docs (e.g. setup guides, README sections, deployment notes). | Documentation group and leads edited for accuracy against the real repo. |
| **Meeting / process notes** | Occasional drafting or formatting of standup and sprint notes from transcripts. | Meeting owner verifies content before commit. |
| **Product feature (runtime)** | DeepSeek API powers optional **AI team summary** in the app (`/api/ai/*`); this is an explicit product feature, not hidden codegen. | Documented in `source/mvp/docs/DATA_AND_API.md` and `docs/DEPLOY.md`. |

---

## What we do not rely on GenAI for

- Final sign-off on requirements, specs, or grading rubric artifacts without team review
- Merging large (>300 LoC) changes without a PR and teammate evaluation (per team process rules)
- Substituting standups, retrospectives, or issue tracking on GitHub

---

## Discussion: what we learned

This section records our honest team experience with GenAI on this project—not a formal process we always followed, but what we actually observed.

**GenAI is useful, but it is not “free quality.”**  
We found that AI can move fast on boilerplate, layout, and doc drafts. At the same time, it often introduces **bugs that still need a human to catch**. Output can **look correct** (clean syntax, plausible comments, confident tone) while being **wrong in behavior**—wrong API assumptions, subtle logic errors, or code that does not match our real data model. We learned to treat AI output as a **first draft**, then debug and integrate it ourselves (e.g. MVP prototype scaffolding, backend fixes in person on **5/29**).

**Cost, time, and quality (the iron triangle).**  
Using GenAI has a real **cost** (API keys, tokens, tooling). We now understand the tradeoff more clearly: you may **save time** on drafting, but you can **lose quality** if nobody reviews, and you still pay for usage. Faster generation does not automatically mean faster *correct* delivery—review and fix-up time still counts.

**A good resource going forward.**  
Despite the caveats, we see GenAI as a **worthwhile tool** for scaffolding, documentation structure, and repetitive tasks—especially when paired with our own specs, tests, and in-person work sessions. We plan to keep using it **deliberately**, not by default on every change.

**Risk: it is easy to slack off.**  
When AI is always available, it is tempting to **skip thinking**—paste a prompt, accept the answer, and move on. Our takeaway: GenAI should **support** the team’s decisions, not replace understanding the codebase, the requirements, or the grading rubric. Supervised use and actually running/testing the app remain non-negotiable.

---

## Related documentation

- Requirements: `specs/feature/specs_reqs.md` (Generative AI Transparency — **MUST**)
- MVP API (including AI routes): `source/mvp/docs/DATA_AND_API.md`
- Deployment (AI secret setup): `docs/DEPLOY.md`
- Warm-up AI logging practice: course warm-up exercises (prompt/usage logs where required)

---

## Summary

We treat GenAI as a **supervised accelerator**: useful for code scaffolding, doc drafts, and the app’s built-in AI summary feature—but always **exposed, discussed, reviewed, and owned by the team**. It saves time on drafts; it does not remove the need for human judgment, testing, and cost awareness. Questions or corrections: discuss in standup or update this file.
