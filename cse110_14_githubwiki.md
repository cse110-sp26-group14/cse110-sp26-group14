# Github Wiki: SE SitRep

Author: Christian Pacheco

This document establishes a comprehensive functional, structural, and operational blueprint for the modernized **SE SitRep** platform. It provides clear structural architectural interfaces, backend runtime mechanics, data contracts, and environment configurations required for ongoing engineering execution, verification, and service maintenance.

---

## 1. Executive Architectural Blueprint

The platform has evolved from a pure client-side mockup into a secure, distributed **Full-Stack Client-Server Architecture** deployed on Cloudflare's serverless edge networks.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                         index.html & UI Shell                         │
│                   (Visual Layout / DOM Target Nodes)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ (Asynchronous HTTP Engine: JSON / CORS)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│          CLOUDFLARE WORKER BACKEND RUNTIME (index.js / api.js)        │
│                                                                        │
│  ┌─────────────────────────┐              ┌─────────────────────────┐  │
│  │      Auth Engine        │              │    AI Request Engine    │  │
│  │   (auth.js / pass.js)   │              │      (openai.js)        │  │
│  └────────────┬────────────┘              └────────────┬────────────┘  │
│               │                                        │               │
└───────────────┼────────────────────────────────────────┼───────────────┘
                │                                        │
                │ (SQL Read / Write)                     │ (REST Stream / JSON API)
                ▼                                        ▼
┌─────────────────────────────────┐      ┌─────────────────────────────────┐
│     CLOUDFLARE D1 DATABASE      │      │       DEEPSEEK AI ENGINE        │
│    (Relational State Engine)    │      │     (deepseek-v4-flash)         │
└─────────────────────────────────┘      └─────────────────────────────────┘
```

### A. Modular Code Matrix & Mapping

- **`index.js`**: Core entry point for the Cloudflare Worker. Intercepts incoming global inbound HTTP fetch traffic, handles preflight CORS `OPTIONS` verification handshake sequences, and inspects route namespaces to isolate `/api` routing paths.

- **`api.js`**: The monolithic routing engine mapping explicit path names and HTTP verbs to secure transaction modules. Manages JSON stream transformation, security boundaries, and input sanitization parameters.

- **`auth.js` & `password.js`**: Manages secure session lifecycle infrastructure, permission roles, user registration vectors, and cryptographically verified login handshakes using cryptographically isolated salts.

- **`db.js`**: Centralized Relational Query Broker. Encapsulates direct data access logic away from endpoint definitions, abstracting underlying raw SQL statement formulations for users, tasks, subtasks, metrics, schedules, and audit trails.

- **`openai.js`**: Third-party wrapper logic handling prompt formulation, model configuration declarations, token response transformation patterns, and automated structured JSON parsing logic.

- **`teamContext.js`**: Advanced processing layer that reduces dynamic schedules, status report arrays, and attendance parameters down to concise numerical profiles for prompt embedding consumption.

- **`sprintLifecycle.js`**: Temporal state synchronization engine that compares current timestamps to calendar ranges to transition active, past, and upcoming milestone boundaries.

- **`http.js`**: Micro-utility wrapper encapsulating repetitive cross-origin response initialization hooks, HTTP code distributions, and Bearer token parsing macros.

---

## 2. Technical Capabilities & Domain Specifications

### A. Token-Based Session Authentication Engine

The system uses standard stateless Bearer tokens backed by an explicit database relational validation layer for secure sessions.

#### 1. Password Scrypt Isolation

Password values are processed with standard cryptographically secure random bytes via:

```js
crypto.randomBytes(16)
```

as an independent salt string.

The system performs high-iteration keyspace generation using:

```js
crypto.scryptSync(password, salt, 64)
```

#### 2. Timing Attack Hardening

Verification loops bypass standard character checks which can break on execution duration discrepancies.

It utilizes:

```js
crypto.timingSafeEqual()
```

to negate timing-channel side-channel vector analysis.

#### 3. Session Refresh Routine

User requests extract token authorization blocks using:

```js
/^Bearer\s+(.+)$/i
```

When validated successfully against live expiration dates:

```sql
expires_at > datetime('now')
```

the session window automatically propagates outward into the future by a static timeline factor:

```js
SESSION_DAYS = 7
```

refreshing user engagement parameters implicitly.

---

### B. Relational Data Management & Optimistic Locking

State calculations bypass simple web cache constructs to query a formal SQLite engine instance over Cloudflare's D1 network layer.

#### Mid-Air Collision Prevention

Write actions on key task targets carry explicit snapshot assertions:

```js
expectedUpdatedAt
```

If a record's current database update marker deviates from this value, the transactional layer throws an explicit:

```http
409 Conflict
```

exception to shield concurrent updates from clobbering other team member updates.

#### Hierarchical Subtask Control

Task items implement deep nesting logic.

Specialized subtask modification blocks assert explicit validation parameters: a team member is prevented from toggling completion flags unless they are explicitly assigned to that individual node.

---

### C. True DeepSeek AI Intelligence Orchestration

The background processing matrix utilizes a live API integration with the `deepseek-v4-flash` LLM layer.

#### Dynamic Team Profiling

Rather than relying on simple text queries, `teamContext.js` loops through active schedules and check-ins to compute an active availability balance ratio:

```math
freeRatio =
(Σ Positive Available Slots)
/
(Total Assigned Matrix Range)
```

Or in LaTeX:

```latex
\text{freeRatio} =
\frac{\sum \text{Positive Available Slots}}
{\text{Total Assigned Matrix Range}}
```

Individuals with a ratio below `0.35` are automatically labeled with a `low` capacity classification, preventing prompt structures from assigning them excess incoming tasks.

#### Robust Fail-Safe Fallbacks

If the AI engine returns unparseable or truncated raw markdown formats outside of requested strict JSON arrays:

1. Interceptors capture the script error.
2. Route an alert trace into the `ai_logs` relational table.
3. Automatically construct a valid fallback task configuration array.
4. Guarantee uninterrupted interface processing loops.

---

## 3. Operational Implementation Guide

### A. Target Environmental Prerequisites

- Node.js Runtime: `v18.x` or higher
- Cloudflare Wrangler CLI installed globally

---

### B. Project Bootstrapping & Deployment Instructions

#### 1. Authentication Token Binding

Initialize platform keys inside Cloudflare's secure secret storage.

```bash
wrangler secret put DEEPSEEK_API_KEY
```

#### 2. Database Structure Provisioning

Execute migration definitions against local or edge-hosted D1 instances.

```bash
wrangler d1 execute se-sitrep-db --file=./schema.sql
```

#### 3. Local Testing Workspace Verification

Boot the local edge-worker development environment.

```bash
wrangler dev
```

#### 4. Production Environment Shipping

Compile scripts and deploy to Cloudflare's edge network.

```bash
wrangler deploy
```

---

### C. Core Integration Verification Matrix

| Target Context Pathway | Request Method | Expected Security Scope | Standard Response Codes | Expected JSON Payload |
|------------------------|----------------|-------------------------|-------------------------|----------------------|
| `/api/health` | GET | Public / Open | 200 OK | `{ "ok": true, "provider": "deepseek", "configured": true }` |
| `/api/auth/signup` | POST | Public / Open | 200 OK / 400 Bad Request | Registered user payload + initial token |
| `/api/auth/login` | POST | Public / Open | 200 OK / 401 Unauthorized | Authenticated client config map + session token |
| `/api/state` | GET | Bearer Token Required | 200 OK / 401 Unauthorized | Composite payload containing active sprints, tasks, users |
| `/api/tasks/:id` | PATCH | Bearer Token Required | 200 OK / 409 Conflict | Updated task state or conflict rejection |
| `/api/ai/suggest-tasks` | POST | Bearer Token Required | 200 OK / 500 Server Error | DeepSeek recommendation array or fallback payload |

---

## 4. Test Suite Architecture & Execution Paradigms

### A. Environment Separation Protocols

Testing sweeps operate through isolated local sandbox nodes.

Database interactions utilize mock local SQL memory drivers to verify database methods without modifying production data instances or consuming real DeepSeek token quotas.

---

### B. Multi-Thread Processing Collision Isolation

#### Serial Task Enforcement Execution

Ensure local runners operate through serialized execution loops.

Example:

```bash
npm test -- --runInBand
```

Because database actions share in-memory operational states, parallel execution threads can introduce state collisions leading to false-positive validation failures.

#### Platform Component Injection Polyfills

Modern edge APIs missing from basic Node.js environments are loaded through explicit pre-run script setups.

Common polyfilled components include:

```js
TextEncoder
TextDecoder
URL
Request
Response
Headers
```

These constructors should be initialized before component verification assertions execute.

---

# Local Run Guide: SE SitRep

Follow these steps to spin up the full-stack serverless environment and database sandbox locally.

### 1. Prerequisites
* **Node.js (v18+)** installed.

### 2. Install Tools & Dependencies
```bash
npm install
npm install -g wrangler
```

### 3. Initialize the Local Database
```bash
wrangler d1 execute se-sitrep-db --local --file=./schema.sql
```

### 4. Start the Backend Edge Server
```bash
wrangler dev
```
*Backend API runs at `http://localhost:8787` (keep terminal open).*

### 5. Launch the Frontend UI
* Open `index.html` directly in your browser or via VS Code **Live Server**.
* Ensure frontend client points to your local backend URL: `http://localhost:8787/api/`.

### 6. Verify Connection
```bash
curl http://localhost:8787/api/health
```
**Expected Response:**
```json
{ "ok": true, "provider": "deepseek", "configured": true }
```

---

### Running Tests
Run automated test suites sequentially to prevent state collisions:
```bash
npm test -- --runInBand
```

# End of Document
**SE SitRep — Github Wiki**
