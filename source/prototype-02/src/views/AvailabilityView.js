import { BaseView } from "./BaseView.js";
import { EVENTS } from "../core/events.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const CURRENT_USER_ID = 1;

function buildTimeSlots() {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}
const TIME_SLOTS = buildTimeSlots();

function slotKey(day, time) {
  return `${day}_${time}`;
}

function fmt12(time) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function heatColor(count, teamSize) {
  if (!count || !teamSize) return "";
  const pct = count / teamSize;
  if (pct <= 0.25) return "#d1fae5";
  if (pct <= 0.5) return "#6ee7b7";
  if (pct <= 0.75) return "#10b981";
  return "#065f46";
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 55%)`;
}

// ─── View ─────────────────────────────────────────────────────────────────────

export class AvailabilityView extends BaseView {
  constructor(store) {
    super(store);
    this._mySlots = new Set();
    this._dragging = false;
    this._paintMode = true;
    this._container = null;
    this._bestKey = null;
    this._debouncedSave = debounce(() => this._save(), 700);
  }

  render() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const headerRow = `
            <div class="avail-header-time"></div>
            ${DAYS.map((d) => `<div class="avail-header-day">${d}</div>`).join("")}
        `;
    const bodyRows = TIME_SLOTS.map((time) => {
      const isHour = time.endsWith(":00");
      return `
                <div class="avail-time-label${isHour ? " avail-time-hour" : ""}">${isHour ? time : ""}</div>
                ${DAYS.map(
                  (day) => `
                    <div class="avail-cell avail-cell-mine"
                         data-day="${day}" data-time="${time}"
                         data-key="${slotKey(day, time)}"></div>
                `,
                ).join("")}
            `;
    }).join("");
    const heatRows = TIME_SLOTS.map((time) => {
      const isHour = time.endsWith(":00");
      return `
                <div class="avail-time-label${isHour ? " avail-time-hour" : ""}">${isHour ? time : ""}</div>
                ${DAYS.map(
                  (day) => `
                    <div class="avail-cell avail-cell-heat"
                         data-day="${day}" data-time="${time}"
                         data-key="${slotKey(day, time)}"></div>
                `,
                ).join("")}
            `;
    }).join("");

    return `
            <div class="view-header">
                <h1 class="view-title">Team Availability</h1>
                <p class="view-subtitle">Find the best time for your team to sync.</p>
            </div>

            <div class="avail-page-layout">

                <!-- LEFT: My Availability -->
                <div class="avail-card">
                    <div class="avail-card-header">
                        <div>
                            <h2 class="avail-card-title">My Availability</h2>
                            <p class="avail-card-desc">Click and drag to toggle your available hours.</p>
                        </div>
                        <div class="avail-tz-badge">
                            <div class="avail-tz-label">YOUR TIMEZONE:</div>
                            <div class="avail-tz-value">${tz}</div>
                        </div>
                    </div>
                    <div class="avail-grid-wrapper">
                        <div class="avail-grid-scroll" id="my-scroll">
                            <div class="avail-grid" id="my-avail-grid" style="grid-template-columns: 52px repeat(7, 1fr)">
                                ${headerRow}${bodyRows}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN -->
                <div class="avail-right-col">

                    <!-- Team Heatmap -->
                    <div class="avail-card avail-heatmap-card">
                        <div class="avail-card-header">
                            <h2 class="avail-card-title">Team Heatmap</h2>
                            <div class="avail-heat-legend">
                                <span class="avail-legend-label">Low</span>
                                <span class="avail-legend-swatch" style="background:#d1fae5"></span>
                                <span class="avail-legend-swatch" style="background:#6ee7b7"></span>
                                <span class="avail-legend-swatch" style="background:#10b981"></span>
                                <span class="avail-legend-swatch" style="background:#065f46"></span>
                                <span class="avail-legend-label">High</span>
                            </div>
                        </div>
                        <div class="avail-grid-wrapper" style="position:relative">
                            <div class="avail-grid-scroll" id="heat-scroll">
                                <div class="avail-grid" id="team-heatmap-grid" style="grid-template-columns: 52px repeat(7, 1fr)">
                                    ${headerRow}${heatRows}
                                </div>
                            </div>
                            <div class="avail-tooltip" id="avail-tooltip" role="tooltip" aria-hidden="true"></div>
                        </div>
                    </div>

                    <!-- Best Meeting Time -->
                    <div class="avail-card avail-best-card">
                        <div class="avail-best-inner">
                            <div class="avail-best-icon">✨</div>
                            <div class="avail-best-info">
                                <div class="avail-best-title">Best meeting time</div>
                                <div class="avail-best-slot" id="avail-best-slot">No data yet</div>
                                <div class="avail-best-score" id="avail-best-score"></div>
                            </div>
                        </div>
                        <button type="button" class="avail-add-meeting-btn" id="avail-add-meeting-btn">
                            📅 Add to calendar
                        </button>
                    </div>

                    <!-- Current Active Team -->
                    <div class="avail-card">
                        <div class="avail-team-section-title">CURRENT ACTIVE TEAM</div>
                        <div class="avail-team-list" id="avail-team-list"></div>
                    </div>

                </div>
            </div>

            <!-- Availability Log -->
            <div class="card" style="margin-top:1.5rem">
                <div class="card-header">
                    <h2 class="card-title">Availability Log</h2>
                </div>
                <div id="avail-log-list">
                    <p style="color:var(--text-muted);font-size:0.875rem">No submissions yet.</p>
                </div>
            </div>
        `;
  }

  mount(container) {
    this._container = container;

    // Load saved slots for current user
    const saved = this.store.getWeeklySlots(CURRENT_USER_ID);
    this._mySlots = new Set(saved);

    // Paint grids
    this._paintMyGrid();
    this._computeAndPaintHeatmap();
    this._renderBestTime();
    this._renderTeamList();

    // Scroll to 08:00
    this._scrollToHour(8);

    // Drag on My Availability
    this._wireDrag(container.querySelector("#my-avail-grid"));

    // Tooltip on Heatmap
    this._wireTooltip(
      container.querySelector("#team-heatmap-grid"),
      container.querySelector("#avail-tooltip"),
    );

    // Add meeting button
    container
      .querySelector("#avail-add-meeting-btn")
      ?.addEventListener("click", () => {
        const btn = document.getElementById("btn-daily-checkin");
        if (btn) btn.click();
      });

    // Availability Log
    this._renderAvailabilityLog(container);
    this.store.subscribe(EVENTS.AVAILABILITY_LOGS_CHANGED, () => {
      this._renderAvailabilityLog(this._container);
    });
  }

  // ─── Paint ──────────────────────────────────────────────────────────────

  _renderAvailabilityLog(container) {
    const list = container?.querySelector("#avail-log-list");
    if (!list) return;
    const logs = this.store.getAvailabilityLogs();
    if (!logs || logs.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem">No submissions yet.</p>`;
      return;
    }
    list.innerHTML = logs
      .map((log) => {
        const syncStatus = log.calendarSync?.status || "skipped";
        const syncLabel =
          syncStatus === "fallback"
            ? "Local busy blocks were applied"
            : syncStatus === "ok"
              ? "Google Calendar synced"
              : "No calendar sync";
        const date = log.submittedAt
          ? new Date(log.submittedAt).toLocaleString()
          : "";
        const submittedLine = `${log.userName || "Unknown"} submitted ${log.weekKey || ""}`;
        return `
        <div class="activity-card" style="margin-bottom:0.75rem">
          <div class="activity-card-top">
            <span class="activity-card-title">${submittedLine}</span>
            <span class="activity-card-time">${date}</span>
          </div>
          <div class="activity-card-body">${log.sprintName || ""}</div>
          <div class="activity-card-meta">${syncLabel}</div>
        </div>`;
      })
      .join("");
  }

  _paintMyGrid() {
    this._container
      .querySelectorAll("#my-avail-grid .avail-cell-mine")
      .forEach((cell) => {
        cell.classList.toggle(
          "avail-cell-active",
          this._mySlots.has(cell.dataset.key),
        );
      });
  }

  _computeAndPaintHeatmap() {
    const users = this.store.getUsers();
    const teamSize = users.length;
    // Build heatmap: { slotKey: { count, users } }
    const heatmap = {};
    users.forEach((u) => {
      const slots = this.store.getWeeklySlots(u.id);
      slots.forEach((key) => {
        if (!heatmap[key]) heatmap[key] = { count: 0, users: [] };
        heatmap[key].count++;
        heatmap[key].users.push(u.name);
      });
    });

    this._container
      .querySelectorAll("#team-heatmap-grid .avail-cell-heat")
      .forEach((cell) => {
        const entry = heatmap[cell.dataset.key];
        const count = entry?.count || 0;
        const color = heatColor(count, teamSize);
        cell.style.backgroundColor = color || "";
        cell.dataset.count = count;
        cell.dataset.users = entry?.users?.join(",") || "";
      });

    // Compute best time
    let bestKey = null;
    let bestCount = 0;
    for (const [key, val] of Object.entries(heatmap)) {
      if (val.count > bestCount) {
        bestCount = val.count;
        bestKey = key;
      }
    }
    this._bestKey = bestKey;
    this._bestCount = bestCount;
    this._teamSize = teamSize;
  }

  _renderBestTime() {
    const slotEl = this._container.querySelector("#avail-best-slot");
    const scoreEl = this._container.querySelector("#avail-best-score");
    if (this._bestKey && slotEl) {
      const [day, time] = this._bestKey.split("_");
      slotEl.textContent = `${DAY_LABELS[day] || day} • ${fmt12(time)}`;
      if (scoreEl)
        scoreEl.textContent = `${this._bestCount}/${this._teamSize} team score`;
    } else if (slotEl) {
      slotEl.textContent = "No availability data yet";
      if (scoreEl) scoreEl.textContent = "";
    }
  }

  _renderTeamList() {
    const list = this._container.querySelector("#avail-team-list");
    if (!list) return;
    const users = this.store.getUsers();
    list.innerHTML = users
      .map(
        (u) => `
            <div class="avail-team-member">
                <div class="avail-avatar" style="background:${stringToColor(u.name)}">${initials(u.name)}</div>
                <div class="avail-member-info">
                    <span class="avail-member-name">${u.name}${u.id === CURRENT_USER_ID ? " (You)" : ""}</span>
                    ${u.role ? `<span class="avail-member-role">(${u.role})</span>` : ""}
                </div>
            </div>
        `,
      )
      .join("");
  }

  // ─── Drag ───────────────────────────────────────────────────────────────

  _wireDrag(grid) {
    if (!grid) return;

    const toggle = (cell, forcePaint) => {
      if (!cell) return;
      const key = cell.dataset.key;
      const add =
        forcePaint !== undefined ? forcePaint : !this._mySlots.has(key);
      if (add) {
        this._mySlots.add(key);
        cell.classList.add("avail-cell-active");
      } else {
        this._mySlots.delete(key);
        cell.classList.remove("avail-cell-active");
      }
    };

    grid.addEventListener("mousedown", (e) => {
      const cell = e.target.closest(".avail-cell-mine");
      if (!cell) return;
      e.preventDefault();
      this._dragging = true;
      this._paintMode = !this._mySlots.has(cell.dataset.key);
      toggle(cell);
    });

    grid.addEventListener("mouseover", (e) => {
      if (!this._dragging) return;
      toggle(e.target.closest(".avail-cell-mine"), this._paintMode);
    });

    const cellAt = (x, y) =>
      document.elementFromPoint(x, y)?.closest(".avail-cell-mine");

    grid.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        const cell = cellAt(t.clientX, t.clientY);
        if (!cell) return;
        e.preventDefault();
        this._dragging = true;
        this._paintMode = !this._mySlots.has(cell.dataset.key);
        toggle(cell);
      },
      { passive: false },
    );

    grid.addEventListener(
      "touchmove",
      (e) => {
        if (!this._dragging) return;
        e.preventDefault();
        const t = e.touches[0];
        toggle(cellAt(t.clientX, t.clientY), this._paintMode);
      },
      { passive: false },
    );

    const stopDrag = () => {
      if (this._dragging) {
        this._dragging = false;
        this._debouncedSave();
      }
    };
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchend", stopDrag);
  }

  _save() {
    this.store.setWeeklySlots(CURRENT_USER_ID, [...this._mySlots]);
    // Repaint heatmap after save
    this._computeAndPaintHeatmap();
    this._renderBestTime();
  }

  // ─── Tooltip ────────────────────────────────────────────────────────────

  _wireTooltip(grid, tooltip) {
    if (!grid || !tooltip) return;

    grid.addEventListener("mouseover", (e) => {
      const cell = e.target.closest(".avail-cell-heat");
      if (!cell || !parseInt(cell.dataset.count || "0", 10)) {
        tooltip.style.display = "none";
        return;
      }
      const users = cell.dataset.users
        ? cell.dataset.users.split(",").filter(Boolean)
        : [];
      tooltip.innerHTML = `
                <div class="avail-tooltip-header">${DAY_LABELS[cell.dataset.day] || cell.dataset.day} &bull; ${fmt12(cell.dataset.time)}</div>
                <div class="avail-tooltip-label">Available:</div>
                <ul class="avail-tooltip-users">${users.map((u) => `<li>• ${u}</li>`).join("")}</ul>
                <div class="avail-tooltip-count">${cell.dataset.count} of ${this.store.getUsers().length} team members</div>
            `;
      tooltip.style.display = "block";
      tooltip.setAttribute("aria-hidden", "false");
    });

    grid.addEventListener("mousemove", (e) => {
      const cell = e.target.closest(".avail-cell-heat");
      if (!cell || !parseInt(cell.dataset.count || "0", 10)) {
        tooltip.style.display = "none";
        return;
      }
      const wrap = this._container.querySelector(".avail-heatmap-card");
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top + 14;
      if (x + 220 > rect.width) x = e.clientX - rect.left - 224;
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });

    grid.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
      tooltip.setAttribute("aria-hidden", "true");
    });
  }

  // ─── Scroll ─────────────────────────────────────────────────────────────

  _scrollToHour(hour) {
    const scrollTop = 28 + hour * 4 * 16 - 40;
    ["#my-scroll", "#heat-scroll"].forEach((id) => {
      const el = this._container.querySelector(id);
      if (el) el.scrollTop = Math.max(0, scrollTop);
    });
  }
}
