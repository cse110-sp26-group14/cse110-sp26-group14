/**
 * Create sprint task form — redesigned with type selector, assignee chips, rich description.
 * @module components/forms/TaskForm
 */

import { defaultDueForSprint } from '../../utils/taskHelpers.js';

/**
 * Escapes a value for safe insertion into HTML by replacing `&`, `<`, `>`, and `"`.
 * @param {*} s - Any value; coerced to a string (nullish becomes an empty string).
 * @returns {string} The HTML-escaped string.
 */
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Derives uppercase initials from a name: first + last initial when two or more
 * name parts are present, otherwise the first character of the only part.
 * @param {string} name - The full name to derive initials from.
 * @returns {string} The uppercase initials, or `'?'` when no name is given.
 */
function initials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || '?')[0].toUpperCase();
}

/**
 * Picks a stable avatar color for a name by hashing its characters into a fixed palette.
 * @param {string} name - The name used to deterministically select a color.
 * @returns {string} A hex color string from the palette.
 */
function avatarColor(name) {
  const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
  let hash = 0;
  for (const c of (name || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return palette[hash % palette.length];
}

/**
 * Builds the create-sprint-task form markup, including the type selector,
 * assignee dropdown/multi-select, rich-description toolbar, and the
 * sprint/priority/due-date row, with defaults derived from the store.
 * @param {import('../../core/store.js').Store} store - Application store used to resolve the active/selected sprint, the user list, all sprints, and the current user.
 * @returns {string} HTML form markup
 */
export function TaskForm(store) {
  const sprint = store.getSelectedSprint() || store.getActiveSprint();
  const defaultDue = defaultDueForSprint(sprint);
  const users = store.getUsers();
  const sprints = store.getState().sprints || [];
  const currentUser = store.currentAuthUser?.name;

  const types = [
    { value: 'bug',           label: 'Bug',           color: '#dc2626', bg: '#fee2e2' },
    { value: 'feature',       label: 'Feature',       color: '#4f46e5', bg: '#e0e7ff' },
    { value: 'chore',         label: 'Chore',         color: '#374151', bg: '#f3f4f6' },
    { value: 'documentation', label: 'Documentation', color: '#15803d', bg: '#dcfce7' },
  ];

  return `
    <style>
      #task-form .type-btn { cursor:pointer;border:2px solid transparent;border-radius:999px;padding:0.3rem 0.9rem;font-size:0.82rem;font-weight:600;transition:all 0.15s;background:var(--bg-color);color:var(--text-color); }
      #task-form .type-btn.selected { border-color:var(--text-color) !important; }
      #task-form .assignee-chip { display:inline-flex;align-items:center;gap:0.3rem;background:#f3f4f6;border-radius:999px;padding:0.2rem 0.5rem 0.2rem 0.3rem;font-size:0.82rem;font-weight:500; }
      #task-form .assignee-chip button { background:none;border:none;cursor:pointer;color:#9ca3af;font-size:0.9rem;line-height:1;padding:0;margin-left:0.1rem; }
      #task-form .assignee-chip button:hover { color:#374151; }
      #task-form .fmt-btn { background:none;border:none;cursor:pointer;padding:0.25rem 0.4rem;border-radius:4px;font-size:0.85rem;color:#6b7280;font-weight:600; }
      #task-form .fmt-btn:hover { background:#f3f4f6; }
      #task-form input, #task-form select { outline:none; }
      #task-form input:focus, #task-form select:focus { border-color:#6366f1 !important; }
      #task-description:empty:before { content:attr(data-placeholder);color:#9ca3af;pointer-events:none; }
      #task-description:focus { outline:none; }
    </style>

    <form id="task-form">
      <!-- Title + Auto-fill -->
      <div style="display:flex;gap:0.75rem;align-items:center;margin-bottom:1.25rem;">
        <div style="flex:1;">
          <label style="display:block;font-size:0.85rem;font-weight:600;color:#374151;margin-bottom:0.35rem;">Title</label>
          <input id="task-title" name="title" type="text" required
            placeholder="e.g., Migrate billing schema to v3"
            style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.55rem 0.75rem;font-size:0.9rem;box-sizing:border-box;" />
        </div>
        <div style="padding-top:1.4rem;">
          <button type="button" id="task-autofill-btn" style="
            display:inline-flex;align-items:center;gap:0.4rem;
            border:1px solid #e5e7eb;border-radius:8px;padding:0.55rem 0.9rem;
            background:#fff;font-size:0.82rem;font-weight:500;color:#374151;cursor:pointer;
            white-space:nowrap;
          ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Auto-fill description
          </button>
        </div>
      </div>

      <!-- Type -->
      <div style="margin-bottom:1.25rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;color:#374151;margin-bottom:0.5rem;">Type</label>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;" id="task-type-btns">
          ${types.map((t, i) => `
            <button type="button" class="type-btn ${i === 1 ? 'selected' : ''}" data-type="${t.value}"
              style="--bg-color:${t.bg};--text-color:${t.color};background:${t.bg};color:${t.color};${i === 1 ? `border-color:${t.color};` : ''}">
              ${t.label}
            </button>
          `).join('')}
        </div>
        <input type="hidden" id="task-type" name="type" value="feature" />
      </div>

      <!-- Assignees -->
      <div style="margin-bottom:1.25rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;color:#374151;margin-bottom:0.5rem;">Assignees</label>
        <div id="assignee-input-box" style="
          display:flex;align-items:center;flex-wrap:wrap;gap:0.4rem;
          border:1px solid #e5e7eb;border-radius:8px;padding:0.45rem 0.65rem;
          min-height:42px;cursor:text;
        ">
          <div id="assignee-chips" style="display:contents;"></div>
          <input type="text" id="assignee-search" placeholder="Search team..."
            autocomplete="off"
            style="border:none;outline:none;font-size:0.85rem;flex:1;min-width:100px;padding:0.1rem 0;" />
        </div>
        <div id="assignee-dropdown" style="
          display:none;position:absolute;z-index:200;
          background:#fff;border:1px solid #e5e7eb;border-radius:8px;
          box-shadow:0 4px 16px rgba(0,0,0,0.1);margin-top:0.25rem;
          max-height:180px;overflow-y:auto;min-width:220px;
        ">
          ${users.map((u) => `
            <div class="assignee-option" data-name="${esc(u.name)}" style="
              display:flex;align-items:center;gap:0.6rem;padding:0.6rem 0.9rem;
              cursor:pointer;font-size:0.875rem;
            ">
              <span style="display:inline-flex;align-items:center;justify-content:center;
                width:28px;height:28px;border-radius:50%;background:${avatarColor(u.name)};
                color:#fff;font-size:0.72rem;font-weight:700;flex-shrink:0;">
                ${esc(initials(u.name))}
              </span>
              <span>${esc(u.name)}</span>
              <span style="color:#9ca3af;font-size:0.78rem;margin-left:auto;">${esc(u.role)}</span>
            </div>
          `).join('')}
        </div>
        <!-- Hidden multi-select to carry values on submit -->
        <select id="task-assignees" name="assignees" multiple style="display:none;">
          ${users.map((u) => `<option value="${esc(u.name)}" ${u.name === currentUser ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}
        </select>
      </div>

      <!-- Description -->
      <div style="margin-bottom:1.25rem;">
        <label style="display:block;font-size:0.85rem;font-weight:600;color:#374151;margin-bottom:0.5rem;">Description</label>
        <div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div style="display:flex;align-items:center;gap:0.1rem;padding:0.4rem 0.6rem;border-bottom:1px solid #f3f4f6;background:#fafafa;">
            <button type="button" class="fmt-btn" data-cmd="bold" title="Bold"><b>B</b></button>
            <button type="button" class="fmt-btn" data-cmd="italic" title="Italic"><i>I</i></button>
            <button type="button" class="fmt-btn" data-cmd="code" title="Code">&lt;/&gt;</button>
            <button type="button" class="fmt-btn" data-cmd="link" title="Link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
            <div style="width:1px;height:16px;background:#e5e7eb;margin:0 0.2rem;"></div>
            <button type="button" class="fmt-btn" data-cmd="ul" title="Bullet list">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button type="button" class="fmt-btn" data-cmd="ol" title="Numbered list">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/>
                <line x1="10" y1="18" x2="21" y2="18"/>
                <path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
              </svg>
            </button>
          </div>
          <div id="task-description" contenteditable="true"
            data-placeholder="Add more details or use AI to scaffold a description..."
            style="width:100%;border:none;padding:0.75rem;font-size:0.875rem;min-height:100px;box-sizing:border-box;font-family:inherit;outline:none;line-height:1.6;"></div>
          <input type="hidden" id="task-description-hidden" name="description">
        </div>
      </div>

      <!-- Sprint / Priority / Due Date row -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;margin-bottom:1.5rem;">
        <div>
          <label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.35rem;">Sprint</label>
          <select id="task-sprint" name="sprintId" style="
            width:100%;border:1px solid #e5e7eb;border-radius:8px;
            padding:0.5rem 0.65rem;font-size:0.85rem;color:#374151;background:#fff;box-sizing:border-box;
          ">
            ${sprints.map((s) => {
              const isCurrent = s.status === 'active';
              return `<option value="${s.id}" ${s.id === sprint?.id ? 'selected' : ''}>${esc(s.name)}${isCurrent ? ' (Current)' : ''}</option>`;
            }).join('')}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.35rem;">Priority</label>
          <select id="task-priority" name="priority" style="
            width:100%;border:1px solid #e5e7eb;border-radius:8px;
            padding:0.5rem 0.65rem;font-size:0.85rem;color:#374151;background:#fff;box-sizing:border-box;
          ">
            <option value="critical">🔴 Critical</option>
            <option value="high">🟡 High</option>
            <option value="medium" selected>🔵 Medium</option>
            <option value="low">⚪ Low</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.35rem;">Due Date</label>
          <input id="task-due" name="due" type="date" value="${defaultDue}" required style="
            width:100%;border:1px solid #e5e7eb;border-radius:8px;
            padding:0.5rem 0.65rem;font-size:0.85rem;color:#374151;box-sizing:border-box;
          " />
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;">
        <button type="button" id="task-form-cancel" style="
          padding:0.55rem 1.2rem;border-radius:8px;border:1px solid #e5e7eb;
          background:#fff;font-size:0.9rem;font-weight:500;color:#374151;cursor:pointer;
        ">Cancel</button>
        <button type="submit" style="
          padding:0.55rem 1.4rem;border-radius:8px;border:none;
          background:#4f46e5;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;
        ">Add task</button>
      </div>
    </form>
  `;
}

/**
 * Wire the interactive bits of TaskForm after it's inserted into the DOM.
 * Call this once after injecting TaskForm() HTML.
 * @param {HTMLElement} container - the element containing the form HTML
 * @param {import('../../core/store.js').Store} store
 * @param {Function} onCancel - called when Cancel is clicked
 */
export function mountTaskForm(container, store, onCancel) {
  // Type pill selector
  const typeInput = container.querySelector('#task-type');
  container.querySelectorAll('.type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.type-btn').forEach((b) => {
        b.classList.remove('selected');
        b.style.borderColor = 'transparent';
      });
      btn.classList.add('selected');
      btn.style.borderColor = btn.style.color;
      if (typeInput) typeInput.value = btn.dataset.type;
    });
  });

  // Assignee chip input
  const selectedAssignees = new Set();
  const currentUser = store.currentAuthUser?.name;
  if (currentUser) selectedAssignees.add(currentUser);

  const chipsEl = container.querySelector('#assignee-chips');
  const searchEl = container.querySelector('#assignee-search');
  const dropdownEl = container.querySelector('#assignee-dropdown');
  const hiddenSelect = container.querySelector('#task-assignees');

  /**
   * Re-renders the selected-assignee chips into the chips container and
   * wires each chip's remove button to deselect that assignee.
   * @returns {void}
   */
  function renderChips() {
    if (!chipsEl) return;
    chipsEl.innerHTML = [...selectedAssignees].map((name) => `
      <span class="assignee-chip">
        <span style="display:inline-flex;align-items:center;justify-content:center;
          width:20px;height:20px;border-radius:50%;background:${avatarColor(name)};
          color:#fff;font-size:0.6rem;font-weight:700;">
          ${initials(name)}
        </span>
        ${esc(name)}
        <button type="button" data-remove="${esc(name)}" aria-label="Remove">×</button>
      </span>
    `).join('');

    // wire remove buttons
    chipsEl.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedAssignees.delete(btn.dataset.remove);
        syncHiddenSelect();
        renderChips();
      });
    });
  }

  /**
   * Syncs the hidden multi-select's option `selected` flags to match the
   * current set of selected assignees, so the values submit with the form.
   * @returns {void}
   */
  function syncHiddenSelect() {
    if (!hiddenSelect) return;
    [...hiddenSelect.options].forEach((o) => {
      o.selected = selectedAssignees.has(o.value);
    });
  }

  /**
   * Shows or hides each assignee option in the dropdown based on whether its
   * name contains the (case-insensitive) query.
   * @param {string} q - The search query to filter assignee options by.
   * @returns {void}
   */
  function filterDropdown(q) {
    if (!dropdownEl) return;
    const query = q.toLowerCase();
    dropdownEl.querySelectorAll('.assignee-option').forEach((opt) => {
      const name = opt.dataset.name || '';
      opt.style.display = name.toLowerCase().includes(query) ? '' : 'none';
    });
  }

  searchEl?.addEventListener('focus', () => {
    if (dropdownEl) dropdownEl.style.display = 'block';
  });

  searchEl?.addEventListener('input', (e) => {
    filterDropdown(e.target.value);
    if (dropdownEl) dropdownEl.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    if (dropdownEl && !container.querySelector('#assignee-input-box')?.contains(e.target) && !dropdownEl.contains(e.target)) {
      dropdownEl.style.display = 'none';
    }
  }, { once: false });

  container.querySelector('#assignee-input-box')?.addEventListener('click', () => {
    searchEl?.focus();
  });

  dropdownEl?.querySelectorAll('.assignee-option').forEach((opt) => {
    opt.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const name = opt.dataset.name;
      if (name) {
        selectedAssignees.add(name);
        syncHiddenSelect();
        renderChips();
        if (searchEl) searchEl.value = '';
        filterDropdown('');
      }
    });
    opt.addEventListener('mouseenter', () => { opt.style.background = '#f9fafb'; });
    opt.addEventListener('mouseleave', () => { opt.style.background = ''; });
  });

  renderChips();
  syncHiddenSelect();

  // Formatting toolbar
  container.querySelectorAll('.fmt-btn').forEach((btn) => {
    btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep editor focus + selection
    btn.addEventListener('click', () => {
      const editor = container.querySelector('#task-description');
      if (!editor) return;
      editor.focus();
      const cmd = btn.dataset.cmd;
      if (cmd === 'bold') {
        document.execCommand('bold', false, null);
      } else if (cmd === 'italic') {
        document.execCommand('italic', false, null);
      } else if (cmd === 'code') {
        const sel = window.getSelection();
        const text = sel?.toString() || '';
        document.execCommand('insertHTML', false, `<code style="background:#f3f4f6;padding:0.1em 0.3em;border-radius:3px;font-family:monospace;">${text || '&nbsp;'}</code>`);
      } else if (cmd === 'link') {
        const url = prompt('Enter URL:');
        if (url) document.execCommand('createLink', false, url);
      } else if (cmd === 'ul') {
        document.execCommand('insertUnorderedList', false, null);
      } else if (cmd === 'ol') {
        document.execCommand('insertOrderedList', false, null);
      }
      syncDescription();
    });
  });

  function syncDescription() {
    const editor = container.querySelector('#task-description');
    const hidden = container.querySelector('#task-description-hidden');
    if (editor && hidden) hidden.value = editor.innerText.trim();
  }

  container.querySelector('#task-description')?.addEventListener('input', syncDescription);

  // Auto-fill description
  container.querySelector('#task-autofill-btn')?.addEventListener('click', () => {
    const title = container.querySelector('#task-title')?.value?.trim();
    if (!title) {
      container.querySelector('#task-title')?.focus();
      return;
    }
    const editor = container.querySelector('#task-description');
    if (editor && !editor.innerText.trim()) {
      editor.innerHTML = `<p><strong>${title}</strong></p><p>Acceptance criteria:</p><ul><li></li></ul><p>Notes:</p><ul><li></li></ul>`;
      syncDescription();
      const range = document.createRange();
      const ul = editor.querySelector('ul li');
      if (ul) { range.setStart(ul, 0); range.collapse(true); window.getSelection().removeAllRanges(); window.getSelection().addRange(range); }
    }
  });

  // Cancel button
  container.querySelector('#task-form-cancel')?.addEventListener('click', () => {
    if (onCancel) onCancel();
  });
}