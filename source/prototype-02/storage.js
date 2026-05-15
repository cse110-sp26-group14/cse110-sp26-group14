// storage.js - simple localStorage wrapper for backlog tasks
(function (window) {
  const STORAGE_KEY = "backlog_tasks";

  function initializeStorage(initialTasks) {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Normalize initial tasks to expected schema
      const tasks = (initialTasks || []).map((t) => ({
        id:
          typeof t.id === "string"
            ? t.id
            : `task_${String(t.id).padStart(3, "0")}`,
        title: t.title || "",
        owner: t.owner || null,
        sprint: t.sprint || `Sprint ${t.sprintId || t.sprint || 0}`,
        priority: (t.priority || "low").toUpperCase(),
        status: (t.status || "open").toUpperCase(),
        dueDate: t.due || t.dueDate || null,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }

  function getTasksFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse backlog tasks from storage", e);
      return [];
    }
  }

  function saveTasksToStorage(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  window.BacklogStorage = {
    initializeStorage,
    getTasksFromStorage,
    saveTasksToStorage,
  };
})(window);
