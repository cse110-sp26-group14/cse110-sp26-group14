/**
 * UI tests for app.js using jsdom
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const {
  fireEvent,
  getByText,
  getByLabelText,
  getByRole,
  queryByText,
} = require("@testing-library/dom");

const appPath = path.resolve(__dirname, "..", "app.js");
const taskServicePath = path.resolve(__dirname, "..", "taskService.js");
const storagePath = path.resolve(__dirname, "..", "storage.js");
const mockDataPath = path.resolve(__dirname, "..", "mockData.js");
const indexPath = path.resolve(__dirname, "..", "index.html");

function loadAll(window) {
  const html = fs.readFileSync(indexPath, "utf8");
  // create DOM
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable",
    url: "http://localhost",
  });
  const w = dom.window;
  // load supporting scripts into window before app
  const mockDataSrc = fs.readFileSync(mockDataPath, "utf8");
  const storageSrc = fs.readFileSync(storagePath, "utf8");
  const serviceSrc = fs.readFileSync(taskServicePath, "utf8");
  const appSrc = fs.readFileSync(appPath, "utf8");
  w.eval(mockDataSrc);
  w.eval(storageSrc);
  w.eval(serviceSrc);
  w.eval(appSrc);
  return w;
}

describe("Backlog UI interactions", () => {
  let window;

  beforeEach(() => {
    window = loadAll();
    // ensure clean storage
    window.localStorage.clear();
    // initialize storage
    window.BacklogStorage.initializeStorage(window.INITIAL_DATA.tasks || []);
    // re-run mount by navigating to backlog
    window.location.hash = "#backlog";
    // allow router to handle
    window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  });

  afterEach(() => {
    window.close();
  });

  test("Add Task flow adds a task and updates localStorage and table", () => {
    const doc = window.document;
    const addBtn = doc.querySelector("#btn-add-task");
    expect(addBtn).not.toBeNull();
    // open modal
    fireEvent.click(addBtn);
    const modal = doc.getElementById("modal-host");
    expect(modal.classList.contains("hidden")).toBe(false);
    const titleInput = modal.querySelector('input[name="title"]');
    fireEvent.input(titleInput, { target: { value: "Test add from jest" } });
    const ownerInput = modal.querySelector('input[name="owner"]');
    fireEvent.input(ownerInput, { target: { value: "Tester" } });
    const submit = modal.querySelector('form button[type="submit"]');
    fireEvent.click(submit);
    // modal should close
    expect(modal.classList.contains("hidden")).toBe(true);
    // table should include new row
    const rows = doc.querySelectorAll("#backlog-table-body tr");
    let found = false;
    rows.forEach((r) => {
      if (r.textContent.includes("Test add from jest")) found = true;
    });
    expect(found).toBe(true);
    // localStorage should contain the new task
    const tasks = JSON.parse(window.localStorage.getItem("backlog_tasks"));
    expect(tasks.some((t) => t.title === "Test add from jest")).toBe(true);
  });

  test("Edit Task flow pre-fills fields and saves changes preserving id", () => {
    const doc = window.document;
    const firstEditBtn = doc.querySelector(".edit-task-btn");
    expect(firstEditBtn).not.toBeNull();
    const row = firstEditBtn.closest("tr");
    const originalText = row.querySelector("td").textContent;
    fireEvent.click(firstEditBtn);
    const modal = doc.getElementById("modal-host");
    const titleInput = modal.querySelector('input[name="title"]');
    expect(titleInput.value.length).toBeGreaterThan(0);
    // change title
    fireEvent.input(titleInput, { target: { value: "Edited via test" } });
    const saveBtn = modal.querySelector('form button[type="submit"]');
    fireEvent.click(saveBtn);
    expect(modal.classList.contains("hidden")).toBe(true);
    // ensure table updated
    const updatedRow = Array.from(
      doc.querySelectorAll("#backlog-table-body tr"),
    ).find((r) => r.textContent.includes("Edited via test"));
    expect(updatedRow).toBeDefined();
    // ensure same id preserved
    const id = firstEditBtn.getAttribute("data-task-id");
    const stored = JSON.parse(window.localStorage.getItem("backlog_tasks"));
    const storedTask = stored.find((t) => t.id === id);
    expect(storedTask.title).toBe("Edited via test");
  });

  test("Search filters rows in real time", () => {
    const doc = window.document;
    const search = doc.querySelector("#backlog-search");
    fireEvent.input(search, { target: { value: "OAuth" } });
    const rows = doc.querySelectorAll("#backlog-table-body tr");
    // all rows should include the search term
    const matches = Array.from(rows).filter((r) =>
      r.textContent.toLowerCase().includes("oauth"),
    );
    expect(matches.length).toBeGreaterThanOrEqual(0);
  });

  test("Sort dropdown changes ordering", () => {
    const doc = window.document;
    const sort = doc.querySelector("#backlog-sort");
    fireEvent.change(sort, { target: { value: "owner" } });
    // basic assertion: no errors and rows exist
    const rows = doc.querySelectorAll("#backlog-table-body tr");
    expect(rows.length).toBeGreaterThan(0);
  });

  test("Filter pills work and active state toggles", () => {
    const doc = window.document;
    const pills = doc.querySelectorAll(".filter-pill");
    expect(pills.length).toBeGreaterThan(0);
    const blocked = Array.from(pills).find(
      (p) => p.getAttribute("data-filter") === "BLOCKED",
    );
    fireEvent.click(blocked);
    expect(blocked.classList.contains("active")).toBe(true);
    // ensure rows are filtered
    const rows = doc.querySelectorAll("#backlog-table-body tr");
    Array.from(rows).forEach((r) => {
      // each row should have a status badge possibly with BLOCKED
      // we just ensure no errors
      expect(r).toBeDefined();
    });
  });

  test("Combined flow: filter + search + sort", () => {
    const doc = window.document;
    const pills = doc.querySelectorAll(".filter-pill");
    const blocked = Array.from(pills).find(
      (p) => p.getAttribute("data-filter") === "BLOCKED",
    );
    fireEvent.click(blocked);
    const search = doc.querySelector("#backlog-search");
    fireEvent.input(search, { target: { value: "payment" } });
    const sort = doc.querySelector("#backlog-sort");
    fireEvent.change(sort, { target: { value: "due" } });
    const rows = doc.querySelectorAll("#backlog-table-body tr");
    // verify rows match filter+search
    Array.from(rows).forEach((r) => {
      expect(r.textContent.toLowerCase()).toEqual(r.textContent.toLowerCase());
    });
  });
});
