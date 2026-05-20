# Software Engineering Documentation & Operational Playbook: SE SitRep

This document establishes a comprehensive functional and architectural index for the legacy compatibility monolith and associated modules. It provides clear structural line boundaries, runtime logic matrices, and operational workflows required for incoming engineering teams to seamlessly maintain, validate, and execute the workspace.

# Operational Guide: How to Run and Initialize the Workspace


---

## 1. Executive Architectural Blueprint

The application is structured as a client-side Single Page Application (SPA) driven by an asynchronous **Hash Router**, maintaining runtime visibility contracts via a custom reactive **Pub/Sub Store Engine**. Domain mutations, state validation parameters, and persistent disk interfaces are decoupled from UI assembly templates to ensure isolated regression boundaries.

```
                                ┌─────────────────────────┐
                                │       index.html        │ (Visual Shell Layout / DOM Targets)
                                └────────────┬────────────┘
                                             │
                                             ▼
                                ┌─────────────────────────┐
                                │         app.js          │ (Monolithic Visual Controller)
                                │  ┌───────────────────┐  │
                                │  │   Store Engine    │  │ ◄─── Syncs Caches & State
                                │  └───────────────────┘  │
                                │  ┌───────────────────┐  │
                                │  │ Client Hash Router│  │ ◄─── Manages Window Hash Changes
                                │  └───────────────────┘  │
                                └───────┬───────────┬─────┘
                                        │           │
                      ┌─────────────────┘           └─────────────────┐
                      ▼                                               ▼
              ┌─────────────────────────┐                     ┌─────────────────────────┐
              │     taskService.js      │                     │   Google Calendar Sync  │
              │(Domain Logic Operations)│                     │ (gapi JavaScript SDK)   │
              └────────────────┬────────┘                     └─────────────────────────┘
                               │
                               ▼
              ┌─────────────────────────┐
              │       storage.js        │
              │ (localStorage Interface)│
              └─────────────────────────┘
```

---

## 2. Comprehensive Component Matrix: View Controller (`app.js`)

`app.js` serves as the primary runtime coordinator. It manages central synchronization bounds, external developer API lifecycles, hash history state transitions, and component layouts.

### A. Enterprise Integration: Google Calendar Sync Engine
Captures chronological parameters and third-party script buffers to render external schedule records inside the local calendar UI framework.

| Component Identifier | Type Scope | Operational Specification & Verification Constraints |
| :--- | :--- | :--- |
| `GAPI_CLIENT_ID` | String Constant | OAuth 2.0 application client authentication token string targeting the authorized Google Cloud developer platform. |
| `googleEvents` | Array\<Object\> | Shared data memory buffer used to temporarily isolate parsed meeting elements fetched from the API before UI rendering loops execute. |
| `gapiInited` | Boolean Flag | State condition indicator verifying lower-level library load status. Default valuation initializes to `false`. |
| `gapiInit()` | Function | Requests the asynchronous `gapi.load('client')` lifecycle sequence. Sets configuration parameters targeting the Google Calendar v3 REST schema metadata matrix, modifying `gapiInited = true` upon resolution. |
| `initGoogleCalendar()` | Function | Intercepts navigation actions. Inspects `gapiInited` status and fires synchronous user alerts if assets are unready. Instantiates token client sequences requesting `calendar.readonly` authorization scopes. |
| `fetchGoogleEvents()` | Function | Executes an asynchronous network call querying remote calendar indices. Restricts search scopes using hardcoded ISO bounds (`timeMin: 2026-05-12T00:00:00Z` to `timeMax: 2026-05-20T23:59:59Z`). Forces a complete layout viewport redraw if browser window pathing anchors match the `#calendar` fragment. |

### B. Reactive Data Pipeline (`Store` Class)
Operates as a centralized state broker managing pub/sub lifecycles. This component ensures synchronized boundaries between local caches and presentation elements.

* **State Construction:** Evaluates the persistent browser local storage key matching the indicator string `"se-sitrep-state"`. In the absence of a cached string matrix, executes a silent fallback sequence to fetch the mock dictionary layout matrix defined inside the global context variable: `window.INITIAL_DATA`.
* **Observer Distribution Chain:** Exposes functional public methods `subscribe(event, callback)` and `publish(event, data)` using key string dictionaries to coordinate component updates. Triggers an automatic synchronous string serialization flush to disk (`this.save()`) on every state update transaction.
* **Core Mutation Procedures:**
  * `addReport(report)`: Generates a unique numeric timestamp ID (`Date.now()`), appends the check-in data, broadcasts a `"reportsChanged"` update, and immediately invokes the synchronous helper engine `this.simulateAISummary()`.
  * `addIssue(issue)`: Prepends a new issue dictionary row container to the state tracking layer via an `unshift()` mutation, and dispatches a synchronous event trigger via `this.publish("issuesChanged")`.
* **Automated AI Background Execution Simulation:** Invoking `simulateAISummary()` evaluates the latest check-in report entry. If any blocker tracking strings are typed that do not match the clean baseline token `"None"`, the system automatically inserts a mock summary log into the `aiLogs` index array and pushes a reactive notification alert out via `this.publish("aiLogsChanged")`.

### C. Client Routing Engine (`Router` Class)
Coordinates SPA viewport visual assembly processes without triggering server-side round trips. Listens directly onto native browser change captures using the window layout binding: `window.addEventListener("hashchange")`.

* **Route Parsing Mechanics:** Extracts window location fragments, applying conditional logic fallbacks to enforce default tracking rules pointing unknown hash mutations back to the core dashboard marker: `#dashboard`.
* **Viewport Redraw Sequence:** Flushes stale nodes from container targets using raw DOM text modifications: `this.appContainer.innerHTML = view.render();`. Invokes child implementation hooks via `view.mount(this.appContainer)` to safely secure localized event interceptors, sub-form listeners, and action bindings.

### D. Polymorphic Presentation Blueprints
Every visual interface layout inherits from `BaseView`, adhering to a standardized lifecycle execution contract (`render()` and `mount()`).

* **`BaseView` (Abstract Class):** Baseline blueprint contract mapping global store reference pointers across child components. Implements standard unescaped template string normalizers via `getBadgeHTML(type, label)` to translate task metadata parameters into CSS display chips.
* **`DashboardView`:** Constructs a layout matching a responsive grid system. Evaluates multi-parameter calculations to print current sprint progression percentages (45%), daily member mood tracking entries, real-time simulated AI status logs, and high severity issue metrics.
* **`CalendarView`:** Assembles a tabular calendar layout representation. Connects explicit click patterns on target node element token `#btn-connect-gcal` to link asynchronous enterprise authorization flows. Iterates over elements found in `googleEvents` to construct contextual daily calendar timelines.
* **`BacklogView`:** Orchestrates query updates, filtering pills (`ALL`, `HIGH_PRIORITY`, `BLOCKED`, etc.), and item property sort order parameters over tabular task arrays. Uses helper utility overlay forms (`#add-task-form` and `#edit-task-form`) along with an explicit `showModal()` handler to create or modify tasks.
* **`IssuesView`:** Orchestrates reporting, sorting, and tag filtering parameters over user-reported ticket lists. Intercepts form submission actions on `#issue-form` to invoke state additions via `store.addIssue()`.
* **`AiLogsView`:** Renders a historical summary log index list (`#log-list`) and secondary item metadata tracking viewer layout (`#log-detail`) tracking automated summary engine configurations.
* **`AvailabilityView`:** Renders a structured schedule block matrix grid tracking team members against hourly columns from `9:00` to `17:00`. Displays weighted visual indicators (such as "Needs Coverage" or "Tentative") to compute an optimal meeting time window.

---

## 3. Pure Domain Logic & Transformation Tier

### A. Functional Task Processing Services (`taskService.js`)
Encapsulates sorting, calculation, and input filtering rules. This file maintains complete isolation from the browser DOM environment to support reliable unit testing operations.

* **Unique Identification Generators:** Extracts tracking index integers out of current string identifier keys using regular expression parameters matching the pattern `/(\d+)$/`. Calculates the mathematical ceiling bound of the current set and returns an incremental padded string identity matching the tracking schema: `task_000`.
* **Structural Domain Sorting Framework:** Enforces strict item matching arrays to map task priority and progress tiers onto numeric ordinal evaluation indices:
  * **Priority Index Hierarchy:** `["CRITICAL", "HIGH", "MEDIUM", "LOW"]`
  * **Status Index Hierarchy:** `["BLOCKED", "PROGRESS", "OPEN", "RESOLVED"]`
* **Advanced Multi-Criteria Filtering Logic:** Handles token processing across custom views. It handles status parsing rules (`HIGH_PRIORITY`), unassigned verification conditions, active sprint lookups, and regex-driven numeric calculations to compute future sprint allocations based on target iteration strings.

### B. Storage Caching Engine Driver (`storage.js`)
Executes an Immediately Invoked Function Expression (IIFE) closure block mapping application data mutations onto browser system variables under the centralized tracking index label: `"backlog_tasks"`.

* **Schema Normalization Layer:** During initial application bootstrapping sequences, the utility function `initializeStorage(initialTasks)` evaluates target keys. It processes raw array inputs to correct structural flaws from legacy formats, converting loose status descriptors and priority metrics into predictable uppercase strings.

---

## 4. UI Shell Mapping Specification (`index.html`)

Establishes the base document layout tree containing static UI structures, global typography variables, color asset configurations, and global workflow entry scripts.

| DOM Anchor ID Selector | Functional Role & Execution Boundary Description |
| :--- | :--- |
| `<main id="app">` | The primary visual viewport target canvas for all rendering modules. Dynamic templates returned by view instances wipe out-of-scope tracking states by completely writing over this element's inner markup bounds. |
| `<div id="modal-host">` | Global layout container used to host interactive modal overlays. Toggles visibility parameters dynamically across view lifecycles by adding or removing the tracking utility style selector: `.hidden`. |
| `.nav-item` | Navigation links containing descriptive attribute indices (`data-view`). Monitored by routing classes to append or remove highlight tracking utility tokens (`.active`) to synchronize the sidebar with the location hash. |

---

## 5. Developer Operations & Operational Playbook

### A. Local Workspace Serving Architecture
This application runs purely as a client-side web application. It relies heavily on standard browser security configurations and state tracking boundaries. 

* **Mandatory Serving Tooling:** All developers **MUST** serve the workspace directory using the **VS Code "Live Server" Extension** (or an equivalent local loopback daemon like `npx serve .`). This ensures assets travel over an authorized local loopback port protocol context (typically `http://127.0.0.1:5500`).
* **Critical Failure Mode Warning:** Under no circumstances should developers launch the application by double-clicking `index.html` to load it directly through the native operating system file path interface (e.g., `file:///C:/...`). Running via the file protocol strips origin access flags, isolates storage scopes, and completely breaks hash history state updates, preventing view routing.

### B. Automated Regression Testing Suite
The testing framework leverages Jest wrapped in a headless virtual DOM tracking context to simulate a browser environment inside Node.

* **Execution Command:** `npm test`
* **Sequence Ordering Constraint:** Test executions are intentionally locked to run inside a single execution thread via the `--runInBand` operational parameter. Because test specs manipulate shared in-memory dataset states and mock disk storage contexts, concurrent parallel processing execution would introduce state collisions and generate false regression alerts.
* **Environment Polyfills Matrix:** Headless evaluation execution requires `jest.setup.js` to initialize before any verification assertions run. This file injects polyfills for modern browser constructors missing in basic Node structures, including `TextEncoder`, `TextDecoder`, and standard `URL` objects.

### C. Third-Party Credentials Configuration
* **OAuth Key Handover Lifecycle:** The parameter variable constant `GAPI_CLIENT_ID` defined at the top of `app.js` points directly to the original development team's Google project console. If taking over codebase ownership, your team must set up an independent Google Developer Console Project, activate the Google Calendar API (v3), whitelist your local development addresses (e.g., `http://localhost:5500`), and overwrite the token constant payload inside the source file.
* **Storage Cache Purging:** Because state data is written down directly to persistent browser storage keys (`backlog_tasks` and `se-sitrep-state`), debugging initialization hooks or caching behaviors requires purging tracking datasets. Execute `localStorage.clear()` within your browser's console to force storage drivers to fallback and re-seed from the core mock array data: `window.INITIAL_DATA`.
