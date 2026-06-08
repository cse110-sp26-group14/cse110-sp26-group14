/**
 * Team Availability page — When2Meet-style weekly scheduler.
 * Left card: My Availability (click/drag to paint 15-min blocks)
 * Right card: Team Heatmap (green density overlay)
 * @module views/AvailabilityView
 */

import { BaseView } from "./BaseView.js";
import {
  fetchWeeklyAvailability,
  putWeeklyAvailability,
  fetchTeamHeatmap,
} from "../services/apiClient.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function nextDateForDay(dayAbbr) {
  const target = DAY_INDEX[dayAbbr];
  const today = new Date();
  const toLocalISO = (date) => 
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (target === undefined) return toLocalISO(today);
  let diff = target - today.getDay();
  if (diff < 0) diff += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + diff);
  return toLocalISO(nextDate);
}
const DAY_LABELS = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

/** Build every 15-min label from 00:00 to 23:45 */
function buildTimeSlots() {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}
const TIME_SLOTS = buildTimeSlots(); // 96 entries

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
    this._heatmapData = { heatmap: {}, teamSize: 0, users: [] };
    this._dragging = false;
    this._paintMode = true;
    this._container = null;
    this._bestKey = null;
    this._debouncedSave = debounce(() => this._saveAvailability(), 700);
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
            <div class="avail-loading-overlay" id="my-avail-loading"><div class="avail-spinner"></div></div>
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
              <div class="avail-loading-overlay" id="team-heatmap-loading"><div class="avail-spinner"></div></div>
              <div class="avail-tooltip" id="avail-tooltip" role="tooltip" aria-hidden="true"></div>
            </div>
          </div>

          <!-- Best Meeting Time -->
          <div class="avail-card avail-best-card">
            <div class="avail-best-inner">
              <div class="avail-best-icon">✨</div>
              <div class="avail-best-info">
                <div class="avail-best-title">Best meeting time</div>
                <div class="avail-best-slot" id="avail-best-slot">Calculating…</div>
                <div class="avail-best-score" id="avail-best-score"></div>
              </div>
            </div>
            <button type="button" class="avail-add-meeting-btn" id="avail-add-meeting-btn">
              📅 Add meeting to calendar
            </button>
          </div>

          <!-- Current Active Team -->
          <div class="avail-card">
            <div class="avail-team-section-title">CURRENT ACTIVE TEAM</div>
            <div class="avail-team-list" id="avail-team-list">
              <div class="avail-team-loading">Loading team…</div>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  /**
   * Wires the view's buttons after render: the "update my availability" button
   * (which triggers the availability modal) and the "add meeting" button (which
   * dispatches an open-meeting-modal event prefilled with the best time).
   * @param {HTMLElement} container
   */
  mount(container) {
    this._container = container;

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
        const detail = {};
        if (this._bestKey) {
          const [day, time] = this._bestKey.split("_");
          detail.time = time;
          detail.date = nextDateForDay(day);
        }
        window.dispatchEvent(
          new CustomEvent("sitrep:open-meeting-modal", { detail }),
        );
      });

    // Load data then scroll to 08:00
    Promise.all([this._loadMyAvailability(), this._loadTeamHeatmap()]).then(
      () => this._scrollToHour(8),
    );
  }

  // ─── Data ──────────────────────────────────────────────────────────────

  async _loadMyAvailability() {
    const overlay = this._container.querySelector("#my-avail-loading");
    try {
      const slots = await fetchWeeklyAvailability();
      this._mySlots = new Set(slots);
      this._paintMyGrid();
    } catch (err) {
      console.warn("[AvailabilityView] load my avail:", err);
    } finally {
      if (overlay) overlay.style.display = "none";
    }
  }

  async _loadTeamHeatmap() {
    const overlay = this._container.querySelector("#team-heatmap-loading");
    try {
      const data = await fetchTeamHeatmap();
      this._heatmapData = data;
      this._paintHeatmap();
      this._renderBestTime();
      this._renderTeamList();
    } catch (err) {
      console.warn("[AvailabilityView] load heatmap:", err);
    } finally {
      if (overlay) overlay.style.display = "none";
    }
  }

  async _saveAvailability() {
    try {
      await putWeeklyAvailability([...this._mySlots]);
      const data = await fetchTeamHeatmap();
      this._heatmapData = data;
      this._paintHeatmap();
      this._renderBestTime();
    } catch (err) {
      console.warn("[AvailabilityView] save:", err);
    }
  }

  // ─── Paint ─────────────────────────────────────────────────────────────

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

  _paintHeatmap() {
    const { heatmap, teamSize } = this._heatmapData;
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
  }

  _renderBestTime() {
    const { heatmap, teamSize } = this._heatmapData;
    let bestKey = null;
    let bestCount = 0;
    for (const [key, val] of Object.entries(heatmap || {})) {
      if (val.count > bestCount) {
        bestCount = val.count;
        bestKey = key;
      }
    }
    this._bestKey = bestKey;
    const slotEl = this._container.querySelector("#avail-best-slot");
    const scoreEl = this._container.querySelector("#avail-best-score");
    if (bestKey && slotEl) {
      const [day, time] = bestKey.split("_");
      slotEl.textContent = `${DAY_LABELS[day] || day} • ${fmt12(time)}`;
      if (scoreEl) scoreEl.textContent = `${bestCount}/${teamSize} team score`;
    } else if (slotEl) {
      slotEl.textContent = "No availability data yet";
      if (scoreEl) scoreEl.textContent = "";
    }
  }

  _renderTeamList() {
    const list = this._container.querySelector("#avail-team-list");
    if (!list) return;
    const { users } = this._heatmapData;
    if (!users?.length) {
      list.innerHTML =
        '<div class="avail-team-loading">No team members found.</div>';
      return;
    }
    list.innerHTML = users
      .map(
        (u) => `
      <div class="avail-team-member">
        <div class="avail-avatar" style="background:${stringToColor(u.name)}">${initials(u.name)}</div>
        <div class="avail-member-info">
          <span class="avail-member-name">${u.name}</span>
          ${u.role ? `<span class="avail-member-role">(${u.role})</span>` : ""}
        </div>
      </div>
    `,
      )
      .join("");
  }

  // ─── Drag ──────────────────────────────────────────────────────────────

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

    // Touch
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

  // ─── Tooltip ───────────────────────────────────────────────────────────

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
      const { teamSize } = this._heatmapData;
      tooltip.innerHTML = `
        <div class="avail-tooltip-header">${DAY_LABELS[cell.dataset.day] || cell.dataset.day} &bull; ${fmt12(cell.dataset.time)}</div>
        <div class="avail-tooltip-label">Available:</div>
        <ul class="avail-tooltip-users">${users.map((u) => `<li>• ${u}</li>`).join("")}</ul>
        <div class="avail-tooltip-count">${cell.dataset.count} of ${teamSize} team members</div>
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

  // ─── Scroll to hour ────────────────────────────────────────────────────

  _scrollToHour(hour) {
    // Cell height = 16px, header = 28px, each hour = 4 rows
    const scrollTop = 28 + hour * 4 * 16 - 40;
    ["#my-scroll", "#heat-scroll"].forEach((id) => {
      const el = this._container.querySelector(id);
      if (el) el.scrollTop = Math.max(0, scrollTop);
    });
  }
}
