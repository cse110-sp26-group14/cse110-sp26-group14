/**
 * UI tests for the active modular app entrypoint.
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { fireEvent, waitFor } = require("@testing-library/dom");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "index.html");

const moduleLoadOrder = [
  "src/components/Badge.js",
  "src/views/BaseView.js",
  "src/views/DashboardView.js",
  "src/views/CalendarView.js",
  "src/views/BacklogView.js",
  "src/views/IssuesView.js",
  "src/views/AvailabilityView.js",
  "src/views/AILogView.js",
  "src/views/SettingsView.js",
  "src/routes.js",
  "src/core/events.js",
  "src/services/storageService.js",
  "src/utils/ids.js",
  "src/utils/dates.js",
  "src/core/store.js",
  "src/core/router.js",
  "src/components/Modal.js",
  "src/components/forms/DailyCheckInForm.js",
  "src/components/forms/IssueForm.js",
  "src/components/forms/AvailabilityCheckForm.js",
  "src/services/aiLogService.js",
  "src/services/googleCalendarService.js",
  "src/services/apiClient.js",
  "src/services/syncService.js",
  "src/app.js",
];

function transformModule(source) {
  return source
    .replace(/^import .*;\n/gm, "")
    .replace(/export async function (\w+)/g, "window.$1 = async function $1")
    .replace(/export function (\w+)/g, "window.$1 = function $1")
    .replace(/export class (\w+)/g, "window.$1 = class $1")
    .replace(/export const (\w+)\s*=/g, "window.$1 =");
}

function loadApp(savedState = null) {
  const html = fs.readFileSync(indexPath, "utf8");
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "http://localhost/#dashboard",
  });
  const { window } = dom;
  window.alert = jest.fn();

  window.eval(fs.readFileSync(path.join(root, "mockData.js"), "utf8"));
  if (savedState) {
    window.localStorage.setItem("se-sitrep-state", savedState);
  }

  moduleLoadOrder.forEach((relativePath) => {
    const source = fs.readFileSync(path.join(root, relativePath), "utf8");
    window.eval(transformModule(source));
  });

  return window;
}

function flushTimers() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Modular app entrypoint", () => {
  test("index.html loads src/app.js as a module instead of root app.js", () => {
    const html = fs.readFileSync(indexPath, "utf8");

    expect(html).toContain('type="module" src="src/app.js"');
    expect(html).not.toContain('<script src="app.js"></script>');
  });

  test("weekly availability prompt opens when unresolved", async () => {
    const window = loadApp();
    await flushTimers();

    expect(
      window.document.querySelector("#availability-check-form"),
    ).not.toBeNull();

    window.close();
  });

  test("availability submission updates schedule and creates a log", async () => {
    const window = loadApp();
    await flushTimers();

    const form = window.document.querySelector("#availability-check-form");
    const firstSelect = form.querySelector("select");
    fireEvent.change(firstSelect, { target: { value: "preferred" } });
    fireEvent.submit(form);

    await waitFor(() => {
      const state = JSON.parse(window.localStorage.getItem("se-sitrep-state"));
      expect(state.availabilityLogs).toHaveLength(1);
      expect(Object.keys(state.weeklyAvailabilityChecks)).toHaveLength(1);
    });

    const state = JSON.parse(window.localStorage.getItem("se-sitrep-state"));
    const log = state.availabilityLogs[0];
    expect(log.userId).toBe(1);
    expect(log.calendarSync.status).toBe("fallback");

    const submittedDate = Object.keys(state.availability).find((date) => {
      return state.availability[date]?.[1]?.["9:00"];
    });
    expect(state.availability[submittedDate][1]["9:00"]).toBe("preferred");

    window.close();
  });

  test("same-week prompt is suppressed after submission", async () => {
    const firstWindow = loadApp();
    await flushTimers();
    fireEvent.submit(firstWindow.document.querySelector("#availability-check-form"));

    await waitFor(() => {
      const state = JSON.parse(firstWindow.localStorage.getItem("se-sitrep-state"));
      expect(state.availabilityLogs).toHaveLength(1);
    });

    const savedState = firstWindow.localStorage.getItem("se-sitrep-state");
    firstWindow.close();

    const thirdWindow = loadApp(savedState);
    await flushTimers();

    expect(thirdWindow.document.querySelector("#availability-check-form")).toBeNull();
    thirdWindow.close();
  });

  test("availability log appears on Team Availability view", async () => {
    const window = loadApp();
    await flushTimers();
    fireEvent.submit(window.document.querySelector("#availability-check-form"));

    await waitFor(() => {
      const state = JSON.parse(window.localStorage.getItem("se-sitrep-state"));
      expect(state.availabilityLogs).toHaveLength(1);
    });

    window.location.hash = "#team-availability";
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));

    expect(window.document.body.textContent).toContain("Availability Log");
    expect(window.document.body.textContent).toContain("Local busy blocks");

    window.close();
  });
});
