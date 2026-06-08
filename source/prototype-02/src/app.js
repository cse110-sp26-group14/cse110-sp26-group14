import { Store } from "./core/store.js";
import { Router } from "./core/router.js";
import { EVENTS } from "./core/events.js";
import { routes } from "./routes.js";
import { Modal } from "./components/Modal.js";
import { DailyCheckInForm } from "./components/forms/DailyCheckInForm.js";
import { IssueForm } from "./components/forms/IssueForm.js";
import { AvailabilityCheckForm, parseAvailabilityForm } from "./components/forms/AvailabilityCheckForm.js";
import { createSummaryLogForReport } from "./services/aiLogService.js";
import { syncAvailabilityWithGoogleCalendar } from "./services/googleCalendarService.js";
import { api, isConfigured } from "./services/apiClient.js";
import { startSync } from "./services/syncService.js";
import { todayISO } from "./utils/dates.js";

const store = new Store();
const router = new Router(routes, store);
const modal = new Modal(document.getElementById("modal-host"));

function rerenderIfCurrentRoute(routeHashes) {
  if (routeHashes.includes(window.location.hash || "#dashboard")) {
    router.handleRoute();
  }
}

function wireDailyCheckIn() {
  document.getElementById("btn-daily-checkin").addEventListener("click", () => {
    modal.show("Daily Check-In", DailyCheckInForm());

    document
      .getElementById("checkin-form")
      .addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const payload = {
          userId: 1,
          date: todayISO(),
          mood: formData.get("mood"),
          progress: formData.get("progress"),
          blockers: formData.get("blockers") || "None",
        };

        if (isConfigured()) {
          try {
            await api.createReport(payload);
          } catch (err) {
            console.warn("[CheckIn] API error:", err.message);
          }
        }

        const report = store.addReport(payload);
        const summaryLog = createSummaryLogForReport(report);
        if (summaryLog) store.addAiLog(summaryLog);

        modal.close();
        alert("Check-in submitted!");
      });
  });
}

function wireCreateIssue() {
  document.getElementById("btn-create-issue").addEventListener("click", () => {
    modal.show("Create Issue", IssueForm());

    document
      .getElementById("issue-form")
      .addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const payload = {
          title: formData.get("title"),
          severity: formData.get("severity"),
          status: "open",
          tags: ["User Reported"],
          author: "Maya Patel",
          assignee: null,
          sprintId: 2,
          description: formData.get("description"),
        };

        if (isConfigured()) {
          try {
            await api.createIssue(payload);
          } catch (err) {
            console.warn("[Issue] API error:", err.message);
          }
        }

        store.addIssue(payload);
        modal.close();
      });
  });
}

function wireAvailabilityCheck() {
  document
    .getElementById("btn-availability")
    .addEventListener("click", openAvailabilityCheck);
}

async function openAvailabilityCheck() {
  modal.show("Weekly Availability Check", AvailabilityCheckForm());

  document
    .getElementById("availability-check-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const { grid, weekKey } = parseAvailabilityForm(event.target);
      const syncResult = await syncAvailabilityWithGoogleCalendar(grid);

      if (isConfigured()) {
        const today = todayISO();
        try {
          await api.saveAvailability(today, Object.values(grid)[0] || {});
        } catch (err) {
          console.warn("[Availability] API error:", err.message);
        }
      }

      store.submitWeeklyAvailabilityCheck({
        userId: 1,
        weekKey,
        grid,
        mergedAvailability: syncResult.availability,
        calendarSync: syncResult.sync,
      });

      modal.close();
      rerenderIfCurrentRoute(["#team-availability", "#dashboard"]);
      alert("Availability check submitted!");
    });
}

function wireAddNote() {
  const btn = document.getElementById("btn-add-note");
  if (!btn) return;
  btn.addEventListener("click", () => {
    modal.show(
      "Add Note",
      `
            <form id="note-form" style="display:flex;flex-direction:column;gap:0.75rem;min-width:320px;">
                <div>
                    <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Title</label>
                    <input name="title" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;" placeholder="Note title" />
                </div>
                <div>
                    <label style="display:block;font-size:0.875rem;margin-bottom:0.25rem;">Content</label>
                    <textarea name="content" rows="4" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;"></textarea>
                </div>
                <button type="submit" class="primary-btn" style="justify-content:center;">Save Note</button>
            </form>
        `,
    );

    document.getElementById("note-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      store.addAiLog({
        id: Date.now(),
        type: "Note",
        title: fd.get("title") || "Team Note",
        status: "approved",
        content: fd.get("content"),
        timestamp: new Date().toISOString(),
        details: { input: "Manual note", reviewer: "Maya Patel" },
      });
      modal.close();
      rerenderIfCurrentRoute(["#ai-log"]);
    });
  });
}

function subscribeToStoreEvents() {
  store.subscribe(EVENTS.AI_LOGS_CHANGED, () =>
    rerenderIfCurrentRoute(["#ai-log"]),
  );
  store.subscribe(EVENTS.ISSUES_CHANGED, () =>
    rerenderIfCurrentRoute(["#issues", "#dashboard"]),
  );
  store.subscribe(EVENTS.TASKS_CHANGED, () =>
    rerenderIfCurrentRoute(["#backlog", "#dashboard"]),
  );
  store.subscribe(EVENTS.AVAILABILITY_CHANGED, () =>
    rerenderIfCurrentRoute(["#team-availability", "#dashboard"]),
  );
  store.subscribe(EVENTS.USERS_CHANGED, () =>
    rerenderIfCurrentRoute(["#backlog", "#settings"]),
  );
}

function maybePromptForWeeklyAvailability() {
  if (store.needsWeeklyAvailabilityPrompt()) {
    setTimeout(() => openAvailabilityCheck(), 0);
  }
}

function wireMeetingModal() {
  window.addEventListener("sitrep:open-meeting-modal", (e) => {
    const detail = e.detail || {};
    const date = detail.date || new Date().toISOString().slice(0, 10);
    const time = detail.time || "10:00 AM";
    const hasRec = Boolean(detail.teamCount && detail.teamSize);
    const banner = hasRec
      ? `<div class="avail-recommendation-banner">
                 <span class="avail-rec-icon">✨</span>
                 <div>
                   <div class="avail-rec-title">Recommended based on team availability</div>
                   <div class="avail-rec-sub">${detail.teamCount} of ${detail.teamSize} members available</div>
                 </div>
               </div>`
      : "";
    const dateClass = detail.date ? "avail-autofill-highlight" : "";
    const timeClass = detail.time ? "avail-autofill-highlight" : "";

    modal.show(
      "Schedule Meeting",
      `
            <form id="meeting-form" style="display:flex;flex-direction:column;gap:0.75rem;min-width:320px;">
                ${banner}
                <div>
                    <label style="display:block;font-size:0.875rem;font-weight:600;margin-bottom:0.25rem;">Title</label>
                    <input name="title" value="Team Sync" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;box-sizing:border-box;" required />
                </div>
                <div>
                    <label style="display:block;font-size:0.875rem;font-weight:600;margin-bottom:0.25rem;">Date</label>
                    <input name="date" type="date" value="${date}" class="${dateClass}" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;box-sizing:border-box;" required />
                </div>
                <div>
                    <label style="display:block;font-size:0.875rem;font-weight:600;margin-bottom:0.25rem;">Time</label>
                    <input name="time" type="text" value="${time}" placeholder="10:00 AM" class="${timeClass}" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;box-sizing:border-box;" required />
                </div>
                <div>
                    <label style="display:block;font-size:0.875rem;font-weight:600;margin-bottom:0.25rem;">Format</label>
                    <select name="format" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;box-sizing:border-box;">
                        <option value="Zoom">Zoom</option>
                        <option value="In-person">In-person</option>
                        <option value="Hybrid">Hybrid</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;font-size:0.875rem;font-weight:600;margin-bottom:0.25rem;">Goal (optional)</label>
                    <textarea name="goal" rows="2" placeholder="Sprint planning, retro, etc." style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:6px;box-sizing:border-box;"></textarea>
                </div>
                <button type="submit" class="primary-btn" style="justify-content:center;">Add to sprint calendar</button>
            </form>
        `,
    );

    setTimeout(() => {
      document
        .getElementById("meeting-form")
        ?.querySelector("input,select,textarea")
        ?.focus();
    }, 50);

    document
      .getElementById("meeting-form")
      .addEventListener("submit", (evt) => {
        evt.preventDefault();
        const fd = new FormData(evt.target);
        store.addAiLog({
          id: Date.now(),
          type: "Meeting",
          title: fd.get("title") || "Team Sync",
          status: "scheduled",
          content: `${fd.get("date")} at ${fd.get("time")} · ${fd.get("format")}`,
          timestamp: new Date().toISOString(),
          details: { goal: fd.get("goal") || "" },
        });
        modal.close();
        rerenderIfCurrentRoute([
          "#calendar",
          "#dashboard",
          "#team-availability",
        ]);
        alert("Meeting scheduled!");
      });
  });
}

wireDailyCheckIn();
wireCreateIssue();
wireAvailabilityCheck();
wireAddNote();
wireMeetingModal();
subscribeToStoreEvents();
router.init();
maybePromptForWeeklyAvailability();

startSync(store, router);
