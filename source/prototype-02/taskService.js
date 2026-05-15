// taskService.js - business logic for backlog tasks
(function (window) {
  const PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const STATUS_ORDER = ["BLOCKED", "PROGRESS", "OPEN", "RESOLVED"];
  // Current sprint - update as needed
  const CURRENT_SPRINT = "Sprint 2";

  function generateId(existingTasks) {
    const ids = existingTasks.map((t) => t.id).filter(Boolean);
    // ids like task_001 etc. find max numeric
    let max = 0;
    ids.forEach((id) => {
      const m = id.match(/(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return `task_${String(max + 1).padStart(3, "0")}`;
  }

  function normalizeTaskInput(input) {
    return {
      title: (input.title || "").trim(),
      owner: input.owner ? input.owner.trim() : null,
      sprint: input.sprint ? String(input.sprint).trim() : null,
      priority: input.priority ? String(input.priority).toUpperCase() : "LOW",
      status: input.status ? String(input.status).toUpperCase() : "OPEN",
      dueDate: input.dueDate ? String(input.dueDate) : null,
    };
  }

  function validateTask(task) {
    if (!task.title || task.title.length === 0) {
      return { valid: false, message: "Task title is required" };
    }
    // additional simple checks can be added here
    return { valid: true };
  }

  function getAllTasks() {
    return BacklogStorage.getTasksFromStorage();
  }

  function addTask(input) {
    const tasks = getAllTasks();
    const normalized = normalizeTaskInput(input);
    const v = validateTask(normalized);
    if (!v.valid) return { success: false, error: v.message };

    const newTask = Object.assign({}, normalized, {
      id: generateId(tasks),
      sprint:
        normalized.sprint ||
        `Sprint ${extractSprintNumberFromTasks(tasks) || 1}`,
    });

    tasks.unshift(newTask); // add at top
    BacklogStorage.saveTasksToStorage(tasks);
    return { success: true, task: newTask };
  }

  function extractSprintNumberFromTasks(tasks) {
    // find numeric sprint from existing tasks' sprint strings like 'Sprint 2'
    for (let t of tasks) {
      if (t.sprint) {
        const m = t.sprint.match(/(\d+)/);
        if (m) return Number(m[1]);
      }
    }
    return null;
  }

  function searchTasks(query, tasks) {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    if (!q) return tasks.slice();
    return tasks.filter((t) => {
      return (
        (t.title || "").toLowerCase().includes(q) ||
        (t.owner || "").toLowerCase().includes(q) ||
        (t.sprint || "").toLowerCase().includes(q) ||
        (t.priority || "").toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q)
      );
    });
  }

  function sortTasks(tasks, option) {
    const list = tasks.slice();
    if (!option) return list;
    const opt = String(option).toLowerCase();
    if (opt.includes("priority")) {
      list.sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.priority) -
          PRIORITY_ORDER.indexOf(b.priority),
      );
    } else if (opt.includes("due")) {
      list.sort((a, b) => {
        const da = a.dueDate || "9999-12-31";
        const db = b.dueDate || "9999-12-31";
        return da.localeCompare(db);
      });
    } else if (opt.includes("owner")) {
      list.sort((a, b) => (a.owner || "").localeCompare(b.owner || ""));
    } else if (opt.includes("status")) {
      list.sort(
        (a, b) =>
          STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
      );
    } else if (opt.includes("sprint")) {
      list.sort((a, b) => {
        const sa = (a.sprint || "").match(/(\d+)/);
        const sb = (b.sprint || "").match(/(\d+)/);
        return (sa ? Number(sa[1]) : 999) - (sb ? Number(sb[1]) : 999);
      });
    }
    return list;
  }

  function getTaskById(taskId) {
    if (!taskId) return null;
    const tasks = BacklogStorage.getTasksFromStorage();
    return tasks.find((t) => t.id === taskId) || null;
  }

  function updateTask(updated) {
    if (!updated || !updated.id)
      return { success: false, error: "Invalid task id" };
    const tasks = BacklogStorage.getTasksFromStorage();
    const idx = tasks.findIndex((t) => t.id === updated.id);
    if (idx === -1) return { success: false, error: "Task not found" };

    // Normalize incoming fields but preserve id
    const normalized = Object.assign(
      {},
      tasks[idx],
      normalizeTaskInput(updated),
      { id: tasks[idx].id },
    );
    tasks[idx] = normalized;
    BacklogStorage.saveTasksToStorage(tasks);
    return { success: true, task: normalized, tasks };
  }

  // Filters tasks by filter key
  // Supported filter keys: ALL, HIGH_PRIORITY, UNASSIGNED, THIS_SPRINT, FUTURE_SPRINT, AI_SUGGESTED, BLOCKED, COMPLETED
  function filterTasks(tasks, filterType) {
    if (!filterType || filterType === "ALL") return tasks.slice();
    const type = String(filterType).toUpperCase();
    if (type === "HIGH_PRIORITY") {
      return tasks.filter(
        (t) =>
          (t.priority || "").toUpperCase() === "HIGH" ||
          (t.priority || "").toUpperCase() === "CRITICAL",
      );
    }
    if (type === "UNASSIGNED") {
      return tasks.filter((t) => !t.owner || t.owner === "" || t.owner === "—");
    }
    if (type === "THIS_SPRINT") {
      return tasks.filter((t) => (t.sprint || "") === CURRENT_SPRINT);
    }
    if (type === "FUTURE_SPRINT") {
      const cur = (CURRENT_SPRINT || "").match(/(\d+)/);
      const curNum = cur ? Number(cur[1]) : null;
      if (curNum === null) return [];
      return tasks.filter((t) => {
        const m = (t.sprint || "").match(/(\d+)/);
        const n = m ? Number(m[1]) : null;
        return n !== null && n > curNum;
      });
    }
    if (type === "AI_SUGGESTED") {
      return tasks.filter((t) => !!t.aiSuggested === true);
    }
    if (type === "BLOCKED") {
      return tasks.filter((t) => (t.status || "").toUpperCase() === "BLOCKED");
    }
    if (type === "COMPLETED") {
      return tasks.filter((t) => (t.status || "").toUpperCase() === "RESOLVED");
    }
    return tasks.slice();
  }

  window.TaskService = {
    getAllTasks,
    addTask,
    getTaskById,
    updateTask,
    filterTasks,
    searchTasks,
    sortTasks,
  };
})(window);
