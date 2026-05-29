/**
 * E2E-style tests for the weekly availability check flow.
 *
 * These run in Jest/jsdom because Prototype 2 does not have a browser runner
 * yet. The tests still boot index.html, load the active modular app, and drive
 * the UI through DOM interactions.
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
  freezeDate(window, "2026-05-21T12:00:00Z");

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

function freezeDate(window, isoTimestamp) {
  const RealDate = window.Date;
  const fixedTime = new RealDate(isoTimestamp).getTime();

  class FixedDate extends RealDate {
    constructor(...args) {
      if (args.length) {
        super(...args);
      } else {
        super(fixedTime);
      }
    }

    static now() {
      return fixedTime;
    }

    static parse(value) {
      return RealDate.parse(value);
    }

    static UTC(...args) {
      return RealDate.UTC(...args);
    }
  }

  window.Date = FixedDate;
}

function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function submitAvailabilityCheck(window) {
  await nextTick();
  const form = window.document.querySelector("#availability-check-form");
  expect(form).not.toBeNull();

  const mondayNine = form.querySelector('[name="2026-05-18__9:00"]');
  const calendarBusySlot = form.querySelector('[name="2026-05-20__14:00"]');
  fireEvent.change(mondayNine, { target: { value: "preferred" } });
  fireEvent.change(calendarBusySlot, { target: { value: "preferred" } });
  fireEvent.submit(form);

  await waitFor(() => {
    const state = JSON.parse(window.localStorage.getItem("se-sitrep-state"));
    expect(state.availabilityLogs).toHaveLength(1);
  });

  return JSON.parse(window.localStorage.getItem("se-sitrep-state"));
}

describe("weekly availability check e2e flow", () => {
  test("auto-prompts, accepts a weekly grid, applies fallback calendar busy blocks, and logs the submission", async () => {
    const window = loadApp();
    const state = await submitAvailabilityCheck(window);

    expect(state.weeklyAvailabilityChecks["2026-W21"].status).toBe("submitted");
    expect(state.availabilityLogs[0].userName).toBe("Maya Patel");
    expect(state.availabilityLogs[0].calendarSync.status).toBe("fallback");
    expect(state.availability["2026-05-18"][1]["9:00"]).toBe("preferred");
    expect(state.availability["2026-05-20"][1]["14:00"]).toBe("unavailable");

    window.close();
  });

  test("renders the updated Team Availability schedule and Availability Log after submission", async () => {
    const window = loadApp();
    await submitAvailabilityCheck(window);

    window.location.hash = "#team-availability";
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));

    const pageText = window.document.body.textContent;
    expect(pageText).toContain("Team Availability");
    expect(pageText).toContain("Availability Log");
    expect(pageText).toContain("Maya Patel submitted 2026-W21");
    expect(pageText).toContain("Local busy blocks were applied");
    expect(pageText).toContain("Unavailable");

    window.close();
  });

  test("does not auto-prompt again during the same week after a saved submission", async () => {
    const firstWindow = loadApp();
    await submitAvailabilityCheck(firstWindow);
    const savedState = firstWindow.localStorage.getItem("se-sitrep-state");
    firstWindow.close();

    const secondWindow = loadApp(savedState);
    await nextTick();

    expect(secondWindow.document.querySelector("#availability-check-form")).toBeNull();
    expect(secondWindow.document.body.textContent).toContain("Complete availability survey");
    expect(secondWindow.document.body.textContent).toContain("Done");

    secondWindow.close();
  });

  test("lets the user manually reopen the availability check from Quick actions after submitting", async () => {
    const firstWindow = loadApp();
    await submitAvailabilityCheck(firstWindow);
    const savedState = firstWindow.localStorage.getItem("se-sitrep-state");
    firstWindow.close();

    const window = loadApp(savedState);
    await nextTick();
    expect(window.document.querySelector("#availability-check-form")).toBeNull();

    fireEvent.click(window.document.querySelector("#btn-availability"));

    expect(window.document.querySelector("#availability-check-form")).not.toBeNull();
    expect(window.document.querySelector("#modal-title").innerText).toBe(
      "Weekly Availability Check",
    );

    window.close();
  });
});
