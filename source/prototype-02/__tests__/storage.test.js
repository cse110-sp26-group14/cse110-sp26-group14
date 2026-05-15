/**
 * Tests for storage.js
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const storagePath = path.resolve(__dirname, "..", "storage.js");
const mockDataPath = path.resolve(__dirname, "..", "mockData.js");

function loadScripts(window) {
  const mockDataSrc = fs.readFileSync(mockDataPath, "utf8");
  const storageSrc = fs.readFileSync(storagePath, "utf8");
  // evaluate in window context
  window.eval(mockDataSrc);
  window.eval(storageSrc);
}

describe("BacklogStorage", () => {
  let dom;
  let window;

  beforeEach(() => {
    dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
      runScripts: "dangerously",
      url: "http://localhost",
    });
    window = dom.window;
    // clear localStorage
    window.localStorage.clear();
    loadScripts(window);
  });

  afterEach(() => {
    window.close();
  });

  test("initializeStorage populates localStorage from mockData when empty", () => {
    expect(window.localStorage.getItem("backlog_tasks")).toBeNull();
    window.BacklogStorage.initializeStorage(window.INITIAL_DATA.tasks || []);
    const raw = window.localStorage.getItem("backlog_tasks");
    expect(raw).not.toBeNull();
    const tasks = JSON.parse(raw);
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    // check normalized fields
    expect(tasks[0]).toHaveProperty("id");
    expect(tasks[0]).toHaveProperty("title");
    expect(tasks[0]).toHaveProperty("priority");
  });

  test("initializeStorage does not overwrite existing data", () => {
    const existing = [{ id: "task_999", title: "Existing", priority: "LOW" }];
    window.localStorage.setItem("backlog_tasks", JSON.stringify(existing));
    window.BacklogStorage.initializeStorage(window.INITIAL_DATA.tasks || []);
    const stored = JSON.parse(window.localStorage.getItem("backlog_tasks"));
    expect(stored).toEqual(existing);
  });

  test("getTasksFromStorage returns parsed array or empty", () => {
    expect(window.BacklogStorage.getTasksFromStorage()).toEqual([]);
    const sample = [{ id: "task_001", title: "Sample" }];
    window.localStorage.setItem("backlog_tasks", JSON.stringify(sample));
    expect(window.BacklogStorage.getTasksFromStorage()).toEqual(sample);
  });

  test("getTasksFromStorage handles malformed JSON safely", () => {
    window.localStorage.setItem("backlog_tasks", "not-json");
    // should not throw, returns []
    expect(window.BacklogStorage.getTasksFromStorage()).toEqual([]);
  });

  test("saveTasksToStorage saves and overwrites", () => {
    const list1 = [{ id: "task_1", title: "One" }];
    window.BacklogStorage.saveTasksToStorage(list1);
    expect(JSON.parse(window.localStorage.getItem("backlog_tasks"))).toEqual(
      list1,
    );
    const list2 = [
      { id: "task_2", title: "Two" },
      { id: "task_3", title: "Three" },
    ];
    window.BacklogStorage.saveTasksToStorage(list2);
    expect(JSON.parse(window.localStorage.getItem("backlog_tasks"))).toEqual(
      list2,
    );
  });
});
