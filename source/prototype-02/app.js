/**
 * Compatibility entry point.
 * The application now lives in native ES modules under src/.
 */

// --- 1. State Management (Pub/Sub Store) ---
class Store {
  constructor() {
    const savedData = localStorage.getItem("se-sitrep-state");
    this.state = savedData ? JSON.parse(savedData) : window.INITIAL_DATA;
    this.subscribers = {};
  }

  subscribe(event, callback) {
    if (!this.subscribers[event]) this.subscribers[event] = [];
    this.subscribers[event].push(callback);
  }

  publish(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach((callback) => callback(data));
    }
    this.save();
  }

  save() {
    localStorage.setItem("se-sitrep-state", JSON.stringify(this.state));
  }

  // Getters
  getState() {
    return this.state;
  }
  getActiveSprint() {
    return this.state.sprints.find((s) => s.status === "active");
  }
  getTasksBySprint(sprintId) {
    return this.state.tasks.filter((t) => t.sprintId === sprintId);
  }
  getIssues() {
    return this.state.issues;
  }
  getReports() {
    return this.state.reports;
  }
  getAiLogs() {
    return this.state.aiLogs;
  }
  getUsers() {
    return this.state.users;
  }

  // Setters / Mutations
  addReport(report) {
    report.id = Date.now();
    report.timestamp = new Date().toISOString();
    this.state.reports.push(report);
    this.publish("reportsChanged", this.state.reports);
    this.simulateAISummary();
  }

  addIssue(issue) {
    issue.id = Date.now();
    issue.created = new Date().toISOString().split("T")[0];
    this.state.issues.unshift(issue);
    this.publish("issuesChanged", this.state.issues);
  }

  simulateAISummary() {
    // AI Simulation: Auto-generate a summary log if someone reports a blocker
    const lastReport = this.state.reports[this.state.reports.length - 1];
    if (lastReport.blockers !== "None") {
      const log = {
        id: Date.now(),
        type: "Summary",
        title: "AI Summary Updated",
        status: "approved",
        content: `Alert: ${lastReport.blockers} reported as a blocker. Team summary updated.`,
        timestamp: new Date().toISOString(),
        details: { input: "New check-in report", reviewer: "System" },
      };
      this.state.aiLogs.unshift(log);
      this.publish("aiLogsChanged", this.state.aiLogs);
    }
  }
}

const store = new Store();

// --- 2. Routing ---
class Router {
  constructor(routes) {
    this.routes = routes;
    this.appContainer = document.getElementById("app");
    this.navItems = document.querySelectorAll(".nav-item");

    window.addEventListener("hashchange", () => this.handleRoute());
    this.handleRoute(); // Init on load
  }

  handleRoute() {
    const hash = window.location.hash || "#dashboard";
    const route = this.routes[hash];

    if (route) {
      this.updateNav(hash);
      this.renderView(route);
    } else {
      console.error("Route not found:", hash);
      window.location.hash = "#dashboard";
    }
  }

  updateNav(hash) {
    this.navItems.forEach((item) => {
      if (item.getAttribute("href") === hash) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  renderView(ViewClass) {
    const view = new ViewClass(store);
    this.appContainer.innerHTML = view.render();
    view.mount(this.appContainer);
  }
}

// --- 3. Base View Class ---
class BaseView {
  constructor(store) {
    this.store = store;
  }
  render() {
    return "";
  }
  mount(container) {}

  // Helper to generate badges
  getBadgeHTML(type, label) {
    const cleanLabel = label.toLowerCase().replace(" ", "-");
    return `<span class="badge badge-${cleanLabel}">${label}</span>`;
  }
}

// --- 4. Specific Views ---

class DashboardView extends BaseView {
  render() {
    const activeSprint = this.store.getActiveSprint();
    const sprintTasks = this.store.getTasksBySprint(activeSprint.id);
    const issues = this.store.getIssues();
    const urgentIssues = issues.filter(
      (i) => i.severity === "critical" || i.severity === "high",
    );

    return `
            <div class="view-header">
                <h1 class="view-title">Dashboard</h1>
                <p class="view-subtitle">Real-time overview of ${activeSprint.name}</p>
            </div>

            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                <!-- Sprint Progress Card -->
                <div class="card" style="grid-column: span 2;">
                    <div class="card-header">
                        <h3 class="card-title">Current Sprint</h3>
                        <span class="badge badge-medium">Risk: Medium</span>
                    </div>
                    <div class="sprint-info" style="margin-bottom: 1.5rem;">
                        <h2 style="font-size: 1.5rem;">${activeSprint.name} • May 12 – May 19</h2>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">4 days left • keep momentum going.</p>
                    </div>
                    <div class="progress-bar-container" style="background: var(--border); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--primary); width: 45%; height: 100%;"></div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                        Progress 45%
                    </div>
                </div>

                <!-- Daily Check-in Status Card -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Daily check-in</h3>
                    </div>
                    <div style="text-align: center; padding: 1rem 0;">
                        <div class="badge badge-resolved" style="padding: 0.5rem 1rem; font-size: 0.875rem;">● Checked In</div>
                        <p style="margin-top: 1rem; font-size: 0.875rem;">Submitted today. Mood: <strong>Good</strong></p>
                        <p style="color: var(--text-muted); font-size: 0.75rem;">Working on: Lead standup</p>
                    </div>
                    <button class="action-btn" style="width: 100%; margin-top: 1rem; justify-content: center;">Edit Check-In</button>
                </div>

                <!-- This Week / Calendar Preview -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">This week</h3>
                        <a href="#calendar" style="font-size: 0.75rem; color: var(--primary); text-decoration: none;">Open calendar ></a>
                    </div>
                    <div class="week-strip" style="display: flex; gap: 0.5rem; justify-content: space-between;">
                        ${[12, 13, 14, 15, 16, 17, 18]
                          .map(
                            (d) => `
                            <div class="day-box ${d === 13 ? "active" : ""}" style="flex: 1; text-align: center; padding: 0.5rem; border: 1px solid ${d === 13 ? "var(--primary)" : "var(--border)"}; border-radius: var(--radius-md); background: ${d === 13 ? "var(--primary-light)" : "transparent"};">
                                <div style="font-size: 0.6rem; color: var(--text-light);">MON</div>
                                <div style="font-weight: 600; font-size: 0.875rem;">${d}</div>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                    <div style="margin-top: 1rem; padding: 0.75rem; background: var(--primary-light); border-radius: var(--radius-md); border-left: 3px solid var(--primary);">
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--primary);">10:00 Sprint Standup</div>
                    </div>
                </div>

                <!-- AI Async Summary Card -->
                <div class="card" style="background: var(--primary-light); border-color: #dbeafe;">
                    <div class="card-header">
                        <h3 class="card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> AI async summary</h3>
                    </div>
                    <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Team mostly on track. 1 blocker(s) and 2 missing check-in(s).</p>
                    <div style="display: flex; gap: 1rem; text-align: center;">
                        <div style="flex: 1;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--success);">3</div>
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Submitted</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--warning);">2</div>
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Missing</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--danger);">1</div>
                            <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase;">Blockers</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                        <button class="action-btn" style="flex: 1; justify-content: center;">View Updates</button>
                        <button class="primary-btn" style="flex: 1; justify-content: center; font-size: 0.8125rem;">Send Reminder</button>
                    </div>
                </div>

                <!-- Upcoming Meeting Card -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Upcoming meeting</h3>
                    </div>
                    <div class="meeting-details">
                        <h4 style="font-size: 1rem;">Sprint Standup</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0;">2026-05-13 • 10:00</p>
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; margin: 0.5rem 0;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            <span>Online</span>
                        </div>
                        <p style="font-size: 0.875rem; margin-top: 1rem;">Daily sync, surface blockers</p>
                    </div>
                    <button class="action-btn" style="width: 100%; margin-top: 1rem; justify-content: center;">View Details</button>
                </div>

                <!-- Daily Reminders -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Daily reminders</h3>
                    </div>
                    <ul style="list-style: none;">
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                                ${this.getBadgeHTML("resolved", "Resolved")}
                                <span>Submit daily check-in</span>
                            </div>
                            <span style="font-size: 0.75rem; color: var(--text-light);">Open</span>
                        </li>
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                                ${this.getBadgeHTML("resolved", "Resolved")}
                                <span>Complete availability survey</span>
                            </div>
                            <span style="font-size: 0.75rem; color: var(--text-light);">Open</span>
                        </li>
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                                <span class="badge" style="background: var(--warning-light); color: var(--warning);">Due Soon</span>
                                <span>Sprint meeting at 2:00 PM</span>
                            </div>
                        </li>
                        <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
                                <span class="badge" style="background: var(--primary-light); color: var(--primary);">AI Review Needed</span>
                                <span>Review AI suggested tasks</span>
                            </div>
                        </li>
                    </ul>
                </div>

                <!-- Urgent Issues -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Urgent issues</h3>
                        <a href="#issues" style="font-size: 0.75rem; color: var(--primary); text-decoration: none;">View all ></a>
                    </div>
                    <ul style="list-style: none;">
                        ${urgentIssues
                          .map(
                            (issue) => `
                            <li style="margin-bottom: 1rem;">
                                <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                                    ${this.getBadgeHTML(issue.severity, issue.severity.toUpperCase())}
                                    <div>
                                        <div style="font-size: 0.8125rem; font-weight: 600;">${issue.title}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted);">${issue.tags[0]}</div>
                                    </div>
                                </div>
                            </li>
                        `,
                          )
                          .join("")}
                    </ul>
                </div>
            </div>
        `;
  }
}

class CalendarView extends BaseView {
  render() {
    return `
            <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 class="view-title">Sprint Calendar</h1>
                    <p class="view-subtitle">Sprint 2 • May 12 – May 19</p>
                </div>
                <div class="calendar-controls" style="display: flex; gap: 0.5rem; align-items: center; background: var(--white); padding: 0.25rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <button class="action-btn" style="border:none;">May 2026</button>
                    <button class="action-btn" style="border:none;">Sprint 2</button>
                    <button class="action-btn" style="border:none;">Today</button>
                    <div style="width: 1px; background: var(--border); height: 20px; margin: 0 0.25rem;"></div>
                    <button class="action-btn" style="border:none;">Month</button>
                    <button class="action-btn" style="border:none;">Week</button>
                    <button class="action-btn" style="border:none; background: var(--primary); color: white;">Sprint</button>
                </div>
            </div>

            <div class="calendar-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
                <div class="card" style="padding: 1.5rem;">
                    <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border);">
                        ${["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
                          .map(
                            (day) => `
                            <div style="background: var(--bg-main); padding: 0.75rem; text-align: center; font-size: 0.7rem; font-weight: 600; color: var(--text-light);">${day}</div>
                        `,
                          )
                          .join("")}
                        ${[
                          12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
                          25,
                        ]
                          .map(
                            (d) => `
                            <div class="calendar-day" style="background: white; height: 120px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; ${d === 13 ? "border: 2px solid var(--primary); z-index: 10;" : ""}">
                                <div style="font-size: 0.875rem; font-weight: 500; color: ${d < 12 || d > 19 ? "var(--text-light)" : "var(--text-main)"}">${d}</div>
                                ${d === 13 ? '<div style="background: var(--primary-light); color: var(--primary); font-size: 0.6rem; padding: 0.25rem; border-radius: 4px; font-weight: 600;">10:00 Sprint Stan...</div>' : ""}
                                ${d === 15 ? '<div style="background: var(--warning-light); color: var(--warning); font-size: 0.6rem; padding: 0.25rem; border-radius: 4px; font-weight: 600;">Due: Migrate billi...</div>' : ""}
                                ${d === 19 ? '<div style="background: var(--success-light); color: var(--success); font-size: 0.6rem; padding: 0.25rem; border-radius: 4px; font-weight: 600;">14:00 Sprint Revi...</div>' : ""}
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--primary);"></span> Sprint range</div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--info);"></span> Meetings</div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--warning);"></span> Tasks due</div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--primary);"></span> Today</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> May 13</h3>
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <h4 style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-light); margin-bottom: 0.75rem;">Meetings</h4>
                        <div style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
                            <div style="font-weight: 600; font-size: 0.875rem;">Sprint Standup</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">10:00 • online</div>
                        </div>
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <h4 style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-light); margin-bottom: 0.75rem;">Tasks Due</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Nothing scheduled</p>
                    </div>
                    <div>
                        <h4 style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-light); margin-bottom: 0.75rem;">Notes</h4>
                        <p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No notes attached</p>
                    </div>
                </div>
            </div>
        `;
  }
}

class BacklogView extends BaseView {
  render() {
    const tasks = this.store.getState().tasks;
    return `
            <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 class="view-title">Backlog</h1>
                    <p class="view-subtitle">All tasks across past, current, and upcoming sprints.</p>
                </div>
                <button id="btn-add-task" class="primary-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Task</button>
            </div>

            <div class="card" style="padding: 0;">
                <div style="padding: 1.5rem; border-bottom: 1px solid var(--border); display: flex; gap: 1rem; align-items: center;">
                    <div class="search-box" style="flex: 1; border: 1px solid var(--border);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input id="backlog-search" type="text" placeholder="Search tasks...">
                    </div>
                    <select id="backlog-sort" class="dropdown-toggle">
                        <option value="priority">Sort: Priority</option>
                        <option value="due">Sort: Due Date</option>
                        <option value="owner">Sort: Owner</option>
                        <option value="status">Sort: Status</option>
                        <option value="sprint">Sort: Sprint</option>
                    </select>
                </div>
                <div id="backlog-filter-pills" style="padding: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${[
                      { label: "ALL", key: "ALL" },
                      { label: "HIGH PRIORITY", key: "HIGH_PRIORITY" },
                      { label: "UNASSIGNED", key: "UNASSIGNED" },
                      { label: "THIS SPRINT", key: "THIS_SPRINT" },
                      { label: "FUTURE SPRINT", key: "FUTURE_SPRINT" },
                      { label: "AI SUGGESTED", key: "AI_SUGGESTED" },
                      { label: "BLOCKED", key: "BLOCKED" },
                      { label: "COMPLETED", key: "COMPLETED" },
                    ]
                      .map(
                        (p) => `
                        <button class="filter-pill badge" data-filter="${p.key}" style="background: ${p.key === "ALL" ? "var(--primary)" : "var(--primary-light)"}; color: ${p.key === "ALL" ? "white" : "var(--primary)"}; cursor: pointer; border: none;">${p.label}</button>
                    `,
                      )
                      .join("")}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Owner</th>
                            <th>Sprint</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Due</th>
                        </tr>
                    </thead>
                        <tbody id="backlog-table-body">
                        </tbody>
                </table>
            </div>
        `;
  }

  mount(container) {
    // Setup event listeners after DOM insertion
    const addBtn = container.querySelector("#btn-add-task");
    const searchInput = container.querySelector("#backlog-search");
    const sortSelect = container.querySelector("#backlog-sort");
    const tableBody = container.querySelector("#backlog-table-body");
    const filterPillsHost = container.querySelector("#backlog-filter-pills");

    // View state
    let selectedFilter = "ALL";
    let searchQuery = "";
    let sortOption = sortSelect.value || "priority";

    function renderTasks(tasks) {
      // Clear
      tableBody.innerHTML = "";
      tasks.forEach((task) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                        <td style="font-weight: 500;">${escapeHtml(task.title)}</td>
                        <td>${escapeHtml(task.owner || "—")}</td>
                        <td>${escapeHtml(task.sprint || "—")}</td>
                        <td>${getBadge(task.priority)}</td>
                        <td>${getBadge(task.status)}</td>
                        <td style="color: var(--text-muted);">${escapeHtml(task.dueDate || "—")}</td>
            <td style="width:120px; text-align: right;">
              <button class="edit-task-btn edit-icon-btn" data-task-id="${escapeHtml(task.id)}" aria-label="Edit task ${escapeHtml(task.title)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
            </td>
                    `;
        tableBody.appendChild(tr);
      });

      // Attach edit handlers
      const editButtons = tableBody.querySelectorAll(".edit-task-btn");
      editButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = btn.getAttribute("data-task-id");
          const task = TaskService.getTaskById(id);
          if (!task) {
            alert("Task not found");
            return;
          }

          // Open edit modal with prefilled values
          showModal(
            "Edit Task",
            `
            <form id="edit-task-form" style="display:flex;flex-direction:column;gap:0.75rem;min-width:320px;">
              <input type="hidden" name="id" value="${escapeHtml(task.id)}" />
              <div>
                <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Task title *</label>
                <input name="title" required value="${escapeHtml(task.title)}" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
              </div>
              <div>
                <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Owner</label>
                <input name="owner" value="${escapeHtml(task.owner || "")}" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
              </div>
              <div>
                <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Sprint</label>
                <input name="sprint" value="${escapeHtml(task.sprint || "")}" placeholder="Sprint 2" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
              </div>
              <div style="display:flex;gap:0.5rem;">
                <div style="flex:1;">
                  <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Priority</label>
                  <select name="priority" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;">
                    <option value="CRITICAL" ${task.priority === "CRITICAL" ? "selected" : ""}>Critical</option>
                    <option value="HIGH" ${task.priority === "HIGH" ? "selected" : ""}>High</option>
                    <option value="MEDIUM" ${task.priority === "MEDIUM" ? "selected" : ""}>Medium</option>
                    <option value="LOW" ${task.priority === "LOW" ? "selected" : ""}>Low</option>
                  </select>
                </div>
                <div style="flex:1;">
                  <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Status</label>
                  <select name="status" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;">
                    <option value="OPEN" ${task.status === "OPEN" ? "selected" : ""}>Open</option>
                    <option value="PROGRESS" ${task.status === "PROGRESS" ? "selected" : ""}>Progress</option>
                    <option value="BLOCKED" ${task.status === "BLOCKED" ? "selected" : ""}>Blocked</option>
                    <option value="RESOLVED" ${task.status === "RESOLVED" ? "selected" : ""}>Resolved</option>
                  </select>
                </div>
              </div>
              <div>
                <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Due date</label>
                <input name="dueDate" type="date" value="${escapeHtml(task.dueDate || "")}" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
              </div>
              <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
                <button type="submit" class="primary-btn" style="flex:1;justify-content:center;">Save</button>
                <button type="button" id="cancel-edit" class="action-btn" style="flex:1;justify-content:center;">Cancel</button>
              </div>
            </form>
          `,
          );

          const editForm = document.getElementById("edit-task-form");
          const cancelEdit = document.getElementById("cancel-edit");
          cancelEdit.addEventListener("click", () =>
            modalHost.classList.add("hidden"),
          );
          editForm.addEventListener("submit", (ev) => {
            ev.preventDefault();
            const fd = new FormData(editForm);
            const updated = {
              id: fd.get("id"),
              title: fd.get("title"),
              owner: fd.get("owner"),
              sprint: fd.get("sprint"),
              priority: fd.get("priority"),
              status: fd.get("status"),
              dueDate: fd.get("dueDate") || null,
            };

            // Validate title
            if (!updated.title || updated.title.trim() === "") {
              alert("Task title is required");
              return;
            }

            const res = TaskService.updateTask(updated);
            if (!res.success) {
              alert(res.error || "Failed to update task");
              return;
            }

            modalHost.classList.add("hidden");
            // Re-render using composed pipeline
            if (typeof refreshAndRender === "function") refreshAndRender();
          });
        });
      });
    }

    function getBadge(value) {
      const label = (value || "").toString().toUpperCase();
      const clean = label.toLowerCase().replace(" ", "-");
      return `<span class="badge badge-${clean}">${label}</span>`;
    }

    function escapeHtml(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    // Initial render from TaskService
    BacklogStorage.initializeStorage(window.INITIAL_DATA.tasks || []);

    function refreshAndRender() {
      let tasks = TaskService.getAllTasks();
      // 1. apply filter
      tasks = TaskService.filterTasks(tasks, selectedFilter);
      // 2. apply search
      tasks = TaskService.searchTasks(searchQuery, tasks);
      // 3. apply sort
      tasks = TaskService.sortTasks(tasks, sortOption);
      renderTasks(tasks);
    }

    refreshAndRender();

    // Initialize filter pills: set default active and wire click handlers
    const filterPills = filterPillsHost.querySelectorAll(".filter-pill");
    const defaultPill = filterPillsHost.querySelector(
      '.filter-pill[data-filter="ALL"]',
    );
    if (defaultPill) defaultPill.classList.add("active");

    filterPills.forEach((pill) => {
      pill.addEventListener("click", (e) => {
        // Toggle active visual state (exclusive)
        filterPills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");

        // Update filter and re-render
        selectedFilter = pill.getAttribute("data-filter") || "ALL";
        refreshAndRender();
      });
    });

    // Search
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value || "";
      refreshAndRender();
    });

    // Sort
    sortSelect.addEventListener("change", (e) => {
      sortOption = e.target.value;
      refreshAndRender();
    });

    // Add Task modal
    addBtn.addEventListener("click", () => {
      showModal(
        "Add Task",
        `
                    <form id="add-task-form" style="display: flex; flex-direction: column; gap: 0.75rem; min-width: 320px;">
                        <div>
                            <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Task title *</label>
                            <input name="title" required style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
                        </div>
                        <div>
                            <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Owner</label>
                            <input name="owner" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
                        </div>
                        <div>
                            <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Sprint</label>
                            <input name="sprint" placeholder="Sprint 2" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
                        </div>
                        <div style="display:flex;gap:0.5rem;">
                            <div style="flex:1;">
                                <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Priority</label>
                                <select name="priority" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;">
                                    <option value="CRITICAL">Critical</option>
                                    <option value="HIGH" selected>High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>
                            <div style="flex:1;">
                                <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Status</label>
                                <select name="status" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;">
                                    <option value="OPEN" selected>Open</option>
                                    <option value="PROGRESS">Progress</option>
                                    <option value="BLOCKED">Blocked</option>
                                    <option value="RESOLVED">Resolved</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Due date</label>
                            <input name="dueDate" type="date" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" />
                        </div>
                        <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
                            <button type="submit" class="primary-btn" style="flex:1;justify-content:center;">Add</button>
                            <button type="button" id="cancel-add" class="action-btn" style="flex:1;justify-content:center;">Cancel</button>
                        </div>
                    </form>
                `,
      );

      const form = document.getElementById("add-task-form");
      const cancel = document.getElementById("cancel-add");
      cancel.addEventListener("click", () => modalHost.classList.add("hidden"));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const payload = {
          title: fd.get("title"),
          owner: fd.get("owner"),
          sprint: fd.get("sprint"),
          priority: fd.get("priority"),
          status: fd.get("status"),
          dueDate: fd.get("dueDate") || null,
        };
        const res = TaskService.addTask(payload);
        if (!res.success) {
          alert(res.error || "Failed to add task");
          return;
        }
        modalHost.classList.add("hidden");
        // re-render using composed pipeline
        if (typeof refreshAndRender === "function") refreshAndRender();
      });
    });
  }
}

class IssuesView extends BaseView {
  render() {
    const issues = this.store.getIssues();
    return `
            <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 class="view-title">Issues & Reports</h1>
                    <p class="view-subtitle">Bugs, blockers, and process issues.</p>
                </div>
                <button class="primary-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Create Issue / Report</button>
            </div>

            <div class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
                <div class="search-box" style="width: 100%; border: 1px solid var(--border); margin-bottom: 1rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search issues...">
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${[
                      "All",
                      "Open",
                      "In Progress",
                      "Blocked",
                      "High Priority",
                      "Assigned to Me",
                      "Created by Me",
                      "Resolved",
                    ]
                      .map(
                        (tag) => `
                        <span class="badge" style="background: ${tag === "All" ? "var(--primary)" : "var(--primary-light)"}; color: ${tag === "All" ? "white" : "var(--primary)"}; cursor: pointer;">${tag}</span>
                    `,
                      )
                      .join("")}
                </div>
            </div>

            <div class="issues-list" style="display: flex; flex-direction: column; gap: 1rem;">
                ${issues
                  .map(
                    (issue) => `
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <h3 style="font-size: 1.125rem; font-weight: 600;">${issue.title}</h3>
                                ${this.getBadgeHTML(issue.severity, issue.severity.toUpperCase())}
                                ${this.getBadgeHTML(issue.status, issue.status.toUpperCase())}
                                ${issue.tags.map((t) => `<span class="badge" style="background: #f3f4f6; color: #6b7280;">${t}</span>`).join("")}
                            </div>
                        </div>
                        <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem;">${issue.description}</p>
                        <div style="display: flex; gap: 1.5rem; font-size: 0.75rem; color: var(--text-light);">
                            <span>By ${issue.author}</span>
                            <span>Assignee ${issue.assignee || "Unassigned"}</span>
                            <span>Sprint ${issue.sprintId}</span>
                            <span>created ${issue.created}</span>
                        </div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        `;
  }
}

class AvailabilityView extends BaseView {
  render() {
    const users = this.store.getUsers();
    const availability = this.store.getState().availability["2026-05-13"];
    const hours = [
      "9:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
    ];

    return `
            <div class="view-header">
                <h1 class="view-title">Team Availability</h1>
                <p class="view-subtitle">When the team is reachable today.</p>
            </div>

            <div class="availability-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
                <div class="card" style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 1rem;">
                        <span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border);">May 13, 2026</span>
                        <span class="badge" style="background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border);">Sprint 2</span>
                        <select class="dropdown-toggle" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            <option>All formats</option>
                        </select>
                    </div>
                    <div class="availability-grid" style="display: grid; grid-template-columns: 150px repeat(9, 1fr); gap: 1px; background: var(--border);">
                        <div style="background: var(--bg-main); padding: 0.75rem; font-size: 0.75rem; color: var(--text-light);">Today</div>
                        ${hours.map((h) => `<div style="background: var(--bg-main); padding: 0.75rem; text-align: center; font-size: 0.75rem; color: var(--text-light);">${h}</div>`).join("")}
                        
                        ${users
                          .map(
                            (user) => `
                            <div style="background: white; padding: 1rem; border-bottom: 1px solid var(--border);">
                                <div style="font-weight: 600; font-size: 0.875rem;">${user.name}</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted);">${user.role}</div>
                            </div>
                            ${hours
                              .map((h) => {
                                const status =
                                  availability[user.id][h] || "available";
                                const colors = {
                                  preferred: {
                                    bg: "#e0e7ff",
                                    text: "#4338ca",
                                    label: "Preferred",
                                  },
                                  available: {
                                    bg: "#dcfce7",
                                    text: "#15803d",
                                    label: "Available",
                                  },
                                  tentative: {
                                    bg: "#eff6ff",
                                    text: "#1d4ed8",
                                    label: "Tentative",
                                  },
                                  unavailable: {
                                    bg: "#f3f4f6",
                                    text: "#4b5563",
                                    label: "Unavailable",
                                  },
                                  needs_coverage: {
                                    bg: "#fef3c7",
                                    text: "#b45309",
                                    label: "Needs Coverage",
                                  },
                                };
                                const style = colors[status];
                                return `
                                    <div style="background: white; padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: center;">
                                        <div title="${style.label}" style="width: 100%; height: 32px; border-radius: 4px; background: ${style.bg}; color: ${style.text}; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 500;">
                                            ${style.label}
                                        </div>
                                    </div>
                                `;
                              })
                              .join("")}
                        `,
                          )
                          .join("")}
                    </div>
                </div>

                <div class="availability-sidebar" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Best meeting time</h3>
                        </div>
                        <div style="padding: 1.5rem; background: var(--primary-light); border-radius: var(--radius-md); border: 1px solid var(--primary); margin-bottom: 1rem;">
                            <div style="font-weight: 700; font-size: 1rem;">Wed • 2:00 PM</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">4 of 5 available • 1 tentative</div>
                        </div>
                        <div style="font-size: 0.75rem;">
                            <div style="color: var(--text-light); margin-bottom: 0.5rem;">Alternatives</div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;"><span>Thu • 10:00 AM</span> <span>3/5</span></div>
                            <div style="display: flex; justify-content: space-between;"><span>Fri • 11:00 AM</span> <span>3/5</span></div>
                        </div>
                        <button class="primary-btn" style="width: 100%; margin-top: 1.5rem; justify-content: center;">Add Meeting to Calendar</button>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Coverage requests</h3>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem;">
                                <span>Priya • QA on-call</span>
                                <span class="badge" style="background: var(--warning-light); color: var(--warning);">Needs Coverage</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem;">
                                <span>Sam • Docs review</span>
                                <span class="badge" style="background: var(--info-light); color: var(--info);">Tentative</span>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Conflicts</h3>
                        </div>
                        <p style="font-size: 0.8125rem; color: var(--text-muted);">2 conflicts during sprint review window.</p>
                    </div>
                </div>
            </div>
        `;
  }
}

class AILogView extends BaseView {
  render() {
    const logs = this.store.getAiLogs();
    return `
            <div class="view-header">
                <h1 class="view-title">AI Log</h1>
                <p class="view-subtitle">Transparent record of every AI action.</p>
            </div>

            <div class="card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; gap: 1rem; align-items: center;">
                <div class="search-box" style="flex: 1; border: 1px solid var(--border);">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" placeholder="Search...">
                </div>
                <select class="dropdown-toggle"><option>All</option></select>
                <select class="dropdown-toggle"><option>All</option></select>
            </div>

            <div class="ai-log-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
                <div class="log-list" style="display: flex; flex-direction: column; gap: 1rem;">
                    ${logs
                      .map(
                        (log) => `
                        <div class="card" style="cursor: pointer; transition: border-color 0.2s;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="background: var(--primary-light); color: var(--primary); padding: 0.5rem; border-radius: 8px;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                </div>
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <h4 style="font-weight: 600;">${log.title}</h4>
                                        ${this.getBadgeHTML(log.status, log.status.toUpperCase())}
                                    </div>
                                    <p style="font-size: 0.875rem; color: var(--text-muted); margin: 0.25rem 0;">${log.content}</p>
                                    <div style="font-size: 0.7rem; color: var(--text-light);">${log.timestamp.replace("T", " ").substring(0, 19)}</div>
                                </div>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>

                <div class="card" id="log-detail">
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">AI Summary Generated</h3>
                    ${this.getBadgeHTML("resolved", "Approved")}
                    <div style="margin-top: 1.5rem;">
                        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Timestamp</div>
                        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">2026-05-13T09:30:30</div>
                        
                        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Input Source</div>
                        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">3 check-ins</div>

                        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Output</div>
                        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">Team mostly on track; 1 blocker on staging env.</div>

                        <div style="font-size: 0.6rem; color: var(--text-light); text-transform: uppercase;">Reviewer</div>
                        <div style="font-size: 0.8125rem; margin-bottom: 1rem;">Maya Patel</div>
                    </div>
                </div>
            </div>
        `;
  }
}

class SettingsView extends BaseView {
  render() {
    return `
            <div class="view-header">
                <h1 class="view-title">Settings</h1>
                <p class="view-subtitle">Manage your profile and workspace preferences.</p>
            </div>
            <div class="card">
                <p>Settings implementation in progress...</p>
                <button class="primary-btn" style="margin-top: 1rem;" onclick="localStorage.clear(); location.reload();">Reset Application State</button>
            </div>
        `;
  }
}

// --- 5. Initialization ---

const routes = {
  "#dashboard": DashboardView,
  "#calendar": CalendarView,
  "#backlog": BacklogView,
  "#issues": IssuesView,
  "#team-availability": AvailabilityView,
  "#ai-log": AILogView,
  "#settings": SettingsView,
};

const router = new Router(routes);

// --- 6. Modal Logic ---

const modalHost = document.getElementById("modal-host");
const modalTitle = document.getElementById("modal-title");
const modalContent = document.getElementById("modal-content");
const closeModal = document.querySelector(".close-modal");

function showModal(title, contentHTML) {
  modalTitle.innerText = title;
  modalContent.innerHTML = contentHTML;
  modalHost.classList.remove("hidden");
}

closeModal.onclick = () => modalHost.classList.add("hidden");
window.onclick = (e) => {
  if (e.target === modalHost.querySelector(".modal-overlay"))
    modalHost.classList.add("hidden");
};

// Daily Check-In Modal Implementation
document.getElementById("btn-daily-checkin").onclick = () => {
  showModal(
    "Daily Check-In",
    `
        <form id="checkin-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Mood</label>
                <select name="mood" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
                    <option>Good</option>
                    <option>Neutral</option>
                    <option>Stressed</option>
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">What did you work on?</label>
                <textarea name="progress" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md); height: 80px;"></textarea>
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Any blockers?</label>
                <input name="blockers" type="text" placeholder="None" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
            </div>
            <button type="submit" class="primary-btn" style="width: 100%; justify-content: center;">Submit Check-In</button>
        </form>
    `,
  );

  document.getElementById("checkin-form").onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const report = {
      userId: 1, // Mocked as Maya
      date: new Date().toISOString().split("T")[0],
      mood: formData.get("mood"),
      progress: formData.get("progress"),
      blockers: formData.get("blockers") || "None",
    };
    store.addReport(report);
    modalHost.classList.add("hidden");
    alert("Check-in submitted!");
  };
};

// Create Issue Modal
document.getElementById("btn-create-issue").onclick = () => {
  showModal(
    "Create Issue",
    `
        <form id="issue-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Title</label>
                <input name="title" required style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Severity</label>
                <select name="severity" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md);">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">Description</label>
                <textarea name="description" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-md); height: 80px;"></textarea>
            </div>
            <button type="submit" class="primary-btn" style="width: 100%; justify-content: center;">Create Issue</button>
        </form>
    `,
  );

  document.getElementById("issue-form").onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const issue = {
      title: formData.get("title"),
      severity: formData.get("severity"),
      status: "open",
      tags: ["User Reported"],
      author: "Maya Patel",
      assignee: null,
      sprintId: 2,
      description: formData.get("description"),
    };
    store.addIssue(issue);
    modalHost.classList.add("hidden");
    // If critical, immediately update dashboard
    if (
      window.location.hash === "#dashboard" ||
      window.location.hash === "#issues"
    ) {
      router.handleRoute();
    }
  };
};

// Global Listeners for re-rendering on store change
store.subscribe("aiLogsChanged", () => {
  if (window.location.hash === "#ai-log") router.handleRoute();
});
store.subscribe("issuesChanged", () => {
  if (
    window.location.hash === "#issues" ||
    window.location.hash === "#dashboard"
  )
    router.handleRoute();
});
