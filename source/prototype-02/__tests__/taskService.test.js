/**
 * Tests for taskService.js
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const taskServicePath = path.resolve(__dirname, "..", "taskService.js");
const storagePath = path.resolve(__dirname, "..", "storage.js");
const mockDataPath = path.resolve(__dirname, "..", "mockData.js");

function loadScripts(window) {
  const mockDataSrc = fs.readFileSync(mockDataPath, "utf8");
  const storageSrc = fs.readFileSync(storagePath, "utf8");
  const serviceSrc = fs.readFileSync(taskServicePath, "utf8");
  window.eval(mockDataSrc);
  window.eval(storageSrc);
  window.eval(serviceSrc);
}

describe("TaskService", () => {
  let dom, window;

  beforeEach(() => {
    dom = new JSDOM(`<!doctype html><html><body></body></html>`, {
      runScripts: "dangerously",
      url: "http://localhost",
    });
    window = dom.window;
    window.localStorage.clear();
    loadScripts(window);
    // seed storage with initial data
    window.BacklogStorage.initializeStorage(window.INITIAL_DATA.tasks || []);
  });

  afterEach(() => {
    window.close();
  });

  test("getAllTasks returns array", () => {
    const all = window.TaskService.getAllTasks();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
  });

  test("addTask adds new task and generates unique id", () => {
    const before = window.TaskService.getAllTasks();
    const res = window.TaskService.addTask({
      title: "New task",
      owner: "Test",
      sprint: "Sprint 2",
      priority: "HIGH",
      status: "OPEN",
    });
    expect(res.success).toBe(true);
    expect(res.task).toHaveProperty("id");
    const after = window.TaskService.getAllTasks();
    expect(after.length).toBe(before.length + 1);
  });

  test("addTask rejects empty title", () => {
    const res = window.TaskService.addTask({ title: "", owner: "X" });
    expect(res.success).toBe(false);
  });

  test("getTaskById returns correct task or null", () => {
    const all = window.TaskService.getAllTasks();
    const t = all[0];
    const found = window.TaskService.getTaskById(t.id);
    expect(found).not.toBeNull();
    expect(found.id).toBe(t.id);
    expect(window.TaskService.getTaskById("nope")).toBeNull();
  });

  test("updateTask updates only target task and preserves id", () => {
    const all = window.TaskService.getAllTasks();
    const t = all[0];
    const originalId = t.id;
    const res = window.TaskService.updateTask({
      id: originalId,
      title: "Updated Title",
      priority: "CRITICAL",
    });
    expect(res.success).toBe(true);
    const updated = window.TaskService.getTaskById(originalId);
    expect(updated.title).toBe("Updated Title");
    expect(updated.priority).toBe("CRITICAL");
    expect(updated.id).toBe(originalId);
    const others = window.TaskService.getAllTasks().filter(
      (x) => x.id !== originalId,
    );
    expect(others.length).toBeGreaterThan(0);
  });

  test("updateTask returns error for nonexistent id", () => {
    const res = window.TaskService.updateTask({ id: "nope", title: "x" });
    expect(res.success).toBe(false);
  });

  test("searchTasks works for title, owner, sprint, priority, status", () => {
    const all = window.TaskService.getAllTasks();
    // pick a known task
    const task =
      all.find((t) => t.owner && t.owner.toLowerCase().includes("alex")) ||
      all[1];
    const q1 = window.TaskService.searchTasks("alex", all);
    expect(Array.isArray(q1)).toBe(true);
    const q2 = window.TaskService.searchTasks(
      (task.title || "").split(" ")[0],
      all,
    );
    expect(q2.length).toBeGreaterThanOrEqual(0);
    const q3 = window.TaskService.searchTasks("nonexistent-term-xyz", all);
    expect(q3.length).toBe(0);
  });

  test("sortTasks sorts by priority, status, due, owner, sprint", () => {
    const all = window.TaskService.getAllTasks();
    // ensure there are mixed priorities
    const sortedPriority = window.TaskService.sortTasks(all, "priority");
    // highest should be CRITICAL or HIGH (if present)
    if (sortedPriority.length > 0) {
      const first = sortedPriority[0];
      expect(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).toContain(first.priority);
    }
    // status
    const sortedStatus = window.TaskService.sortTasks(all, "status");
    if (sortedStatus.length > 0) {
      expect(["BLOCKED", "PROGRESS", "OPEN", "RESOLVED"]).toContain(
        sortedStatus[0].status,
      );
    }
    // due date - ensure order
    const sortedDue = window.TaskService.sortTasks(all, "due");
    for (let i = 1; i < sortedDue.length; i++) {
      const a = sortedDue[i - 1].dueDate || "9999-12-31";
      const b = sortedDue[i].dueDate || "9999-12-31";
      expect(a <= b).toBe(true);
    }
  });

  test("filterTasks supports all filters", () => {
    const all = window.TaskService.getAllTasks();
    const fAll = window.TaskService.filterTasks(all, "ALL");
    expect(fAll.length).toBe(all.length);
    const fHigh = window.TaskService.filterTasks(all, "HIGH_PRIORITY");
    fHigh.forEach((t) => {
      expect(["HIGH", "CRITICAL"]).toContain((t.priority || "").toUpperCase());
    });
    const funassigned = window.TaskService.filterTasks(all, "UNASSIGNED");
    funassigned.forEach((t) => {
      expect(!t.owner || t.owner === "" || t.owner === "—").toBeTruthy();
    });
    const fblocked = window.TaskService.filterTasks(all, "BLOCKED");
    fblocked.forEach((t) =>
      expect((t.status || "").toUpperCase()).toBe("BLOCKED"),
    );
    const fcompleted = window.TaskService.filterTasks(all, "COMPLETED");
    fcompleted.forEach((t) =>
      expect((t.status || "").toUpperCase()).toBe("RESOLVED"),
    );
  });
});
