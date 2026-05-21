/**
 * AI team summary and task suggestions (OpenAI via backend when API mode).
 * @module services/aiSummaryService
 */

import { useRemoteData } from '../config/appConfig.js';
import { postAiTeamSummary, postAiSuggestTasks } from './apiClient.js';
import { createId } from '../utils/ids.js';
import { currentTimestamp, todayISO } from '../utils/dates.js';
import { buildTeamContextForAi } from '../utils/teamContext.js';
import { applyAiTaskSuggestions, pickOwnerForTaskTitle } from '../utils/aiAssignment.js';
import { defaultDueForSprint } from '../utils/taskHelpers.js';

/**
 * Build a short team summary from sprint reports (local fallback).
 * @param {object[]} reports
 * @param {object[]} users
 * @param {number} activeSprintId
 * @returns {{ content: string, missing: number, blockers: string[] }}
 */
export function buildTeamSummary(reports, users, activeSprintId) {
  const today = todayISO();
  const todayReports = reports.filter((r) => r.date === today);
  const missing = Math.max(0, users.length - todayReports.length);

  const blockers = todayReports
    .filter((r) => r.blockers && r.blockers !== 'None')
    .map((r) => r.blockers);

  const inProgress = todayReports.filter((r) => r.status === 'In Progress').length;
  const completed = todayReports.filter((r) => r.status === 'Completed').length;

  let content = `Team mostly on track for sprint ${activeSprintId}. `;
  content += `${completed} completed, ${inProgress} in progress today. `;
  if (blockers.length) {
    content += `${blockers.length} blocker(s) reported. `;
  } else {
    content += 'No blockers reported today. ';
  }
  if (missing) {
    content += `${missing} missing check-in(s).`;
  }

  return { content: content.trim(), missing, blockers };
}

/**
 * @param {object} summaryPayload
 * @returns {object} AI log entry
 */
export function createTeamSummaryLog(summaryPayload) {
  return {
    id: createId(),
    type: 'Summary',
    title: 'AI Team Summary Generated',
    status: 'approved',
    content: summaryPayload.content,
    timestamp: currentTimestamp(),
    details: {
      missingCheckIns: summaryPayload.missing,
      blockers: summaryPayload.blockers,
    },
  };
}

/**
 * Generate team summary (API → OpenAI, or local rules).
 * @param {import('../core/store.js').Store} [store]
 * @returns {Promise<object>} AI log entry
 */
export async function generateTeamSummaryRemote(store) {
  if (useRemoteData()) {
    const result = await postAiTeamSummary();
    return result.log;
  }

  const active = store.getActiveSprint();
  const payload = buildTeamSummary(
    store.getReports(),
    store.getUsers(),
    active?.id ?? 2,
  );
  return createTeamSummaryLog(payload);
}

/**
 * Simulated admin task suggestions using team context (local fallback).
 * @param {string} goalsText
 * @param {import('../utils/teamContext.js').TeamContext} teamContext
 * @returns {object[]}
 */
export function suggestSprintTasks(goalsText, teamContext) {
  const base = goalsText?.trim() || 'Sprint goals';
  const due = defaultDueForSprint(teamContext.sprint);
  const members = teamContext.members || [];
  const drafts = [
    { title: `${base} — API / backend spike`, priority: 'high' },
    { title: `${base} — frontend integration`, priority: 'medium' },
    { title: `${base} — QA regression pass`, priority: 'medium' },
  ];
  return drafts.map((d) => ({
    ...d,
    due,
    owner: pickOwnerForTaskTitle(d.title, members),
  }));
}

/**
 * Request AI task suggestions with team check-in & availability context.
 * @param {import('../core/store.js').Store} store
 * @param {string} goals
 * @param {number} [sprintId]
 * @returns {Promise<{ suggestions: object[], tasks: object[], log: object }>}
 */
export async function suggestSprintTasksRemote(store, goals, sprintId = 2) {
  const teamContext = buildTeamContextForAi(store.getState(), sprintId);

  if (useRemoteData()) {
    const result = await postAiSuggestTasks(goals, sprintId, teamContext);
    const suggestions = applyAiTaskSuggestions(
      result.suggestions || result.tasks || [],
      teamContext,
    );
    return { ...result, suggestions, tasks: suggestions };
  }

  let tasks = suggestSprintTasks(goals, teamContext);
  tasks = applyAiTaskSuggestions(tasks, teamContext);
  const log = {
    id: createId(),
    type: 'Suggestion',
    title: 'AI Sprint Tasks Suggested',
    status: 'pending',
    content: `Review ${tasks.length} task suggestion(s) (local simulation)`,
    timestamp: currentTimestamp(),
    details: { input: goals, suggestions: tasks, teamContext },
  };
  return { suggestions: tasks, tasks, log };
}
