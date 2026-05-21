/**
 * Build team roster + check-in + availability context for AI task/issue assignment.
 * Principle: no check-in or no availability data → assume the member has time.
 * @module utils/teamContext
 */

import { todayISO } from './dates.js';

/** @type {string[]} */
const POSITIVE_SLOTS = ['available', 'preferred', 'tentative'];

/** @type {string[]} */
const NEGATIVE_SLOTS = ['unavailable', 'needs_coverage'];

/**
 * @typedef {object} MemberAvailabilitySummary
 * @property {boolean} hasData
 * @property {string} summary
 * @property {number} freeRatio 0–1
 */

/**
 * @typedef {object} TeamMemberContext
 * @property {number} userId
 * @property {string} name
 * @property {string} role
 * @property {boolean} hasCheckIn
 * @property {boolean} assumedAvailable
 * @property {object|null} checkIn
 * @property {string} availabilitySummary
 * @property {'high'|'medium'|'low'} capacity
 * @property {number} freeRatio
 */

/**
 * @typedef {object} TeamContext
 * @property {object|null} sprint
 * @property {TeamMemberContext[]} members
 * @property {string} principles
 */

/**
 * @param {Record<string, string>} [slots]
 * @returns {MemberAvailabilitySummary}
 */
export function summarizeAvailabilitySlots(slots) {
  if (!slots || !Object.keys(slots).length) {
    return {
      hasData: false,
      summary: 'No availability on file — assume full day available',
      freeRatio: 1,
    };
  }
  const values = Object.values(slots);
  let score = 0;
  values.forEach((s) => {
    if (POSITIVE_SLOTS.includes(s)) score += 1;
    else if (NEGATIVE_SLOTS.includes(s)) score += 0;
    else score += 0.5;
  });
  const freeRatio = score / values.length;
  const open = values.filter((s) => POSITIVE_SLOTS.includes(s)).length;
  return {
    hasData: true,
    summary: `${open}/${values.length} time slots open`,
    freeRatio,
  };
}

/**
 * Latest availability slots for a user (profile + shared calendar map).
 * @param {object} user
 * @param {Record<string, Record<string|number, Record<string, string>>>} availabilityMap
 * @param {string[]} [dates] ISO dates to scan (newest first)
 * @returns {Record<string, string>}
 */
export function getLatestAvailabilityForUser(user, availabilityMap, dates = []) {
  for (const date of dates) {
    const day = availabilityMap[date];
    if (!day) continue;
    const slots = day[user.id] ?? day[String(user.id)];
    if (slots && Object.keys(slots).length) return slots;
  }
  if (user.availability && Object.keys(user.availability).length) {
    return user.availability;
  }
  return {};
}

/**
 * @param {object} user
 * @param {object[]} reports
 * @param {Record<string, Record<string|number, Record<string, string>>>} availabilityMap
 * @param {number} sprintId
 * @param {string[]} recentDates
 * @returns {TeamMemberContext}
 */
export function buildMemberContext(user, reports, availabilityMap, sprintId, recentDates) {
  const userReports = reports
    .filter((r) => Number(r.userId) === Number(user.id))
    .filter((r) => r.sprintId == null || Number(r.sprintId) === Number(sprintId))
    .sort((a, b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date));

  const latest = userReports[0] || null;
  const hasCheckIn = Boolean(latest);
  const assumedAvailable = !hasCheckIn;

  const slots = getLatestAvailabilityForUser(user, availabilityMap, recentDates);
  const avail = summarizeAvailabilitySlots(slots);

  let capacity = 'high';
  if (hasCheckIn) {
    if (latest.status === 'Blocked') capacity = 'low';
    else if (latest.blockers && latest.blockers !== 'None') capacity = 'medium';
    else if (latest.status === 'Not Started') capacity = 'medium';
    else capacity = 'high';
  }
  if (avail.hasData && avail.freeRatio < 0.35) {
    capacity = capacity === 'high' ? 'medium' : 'low';
  }

  return {
    userId: user.id,
    name: user.name,
    role: user.role || 'Team Member',
    hasCheckIn,
    assumedAvailable,
    checkIn: latest
      ? {
        date: latest.date,
        status: latest.status,
        mood: latest.mood,
        progress: latest.progress,
        blockers: latest.blockers,
        notes: latest.notes,
      }
      : null,
    availabilitySummary: avail.summary,
    capacity,
    freeRatio: avail.freeRatio,
  };
}

/**
 * @param {object} state App state (users, reports, availability, sprints)
 * @param {number} [sprintId]
 * @returns {TeamContext}
 */
export function buildTeamContextForAi(state, sprintId) {
  const sid = sprintId ?? state.sprints?.find((s) => s.status === 'active')?.id ?? 2;
  const sprint = state.sprints?.find((s) => Number(s.id) === Number(sid)) || null;
  const availabilityMap = state.availability || {};
  const recentDates = Object.keys(availabilityMap).sort().reverse().slice(0, 7);
  if (!recentDates.includes(todayISO())) recentDates.unshift(todayISO());

  const members = (state.users || []).map((u) => buildMemberContext(
    u,
    state.reports || [],
    availabilityMap,
    sid,
    recentDates,
  ));

  return {
    sprint,
    members,
    principles: 'If a member has no check-in, assume they have time. If availability is missing, assume full-day available. Prefer assigning work by role fit and higher capacity.',
  };
}

/**
 * Plain-text block for LLM prompts.
 * @param {TeamContext} ctx
 * @returns {string}
 */
export function formatTeamContextForPrompt(ctx) {
  const sprintLine = ctx.sprint
    ? `Sprint: ${ctx.sprint.name} (${ctx.sprint.start} – ${ctx.sprint.end})`
    : 'Sprint: (unknown)';
  const roster = ctx.members.map((m) => {
    const checkIn = m.hasCheckIn
      ? `check-in ${m.checkIn.date}: [${m.checkIn.status}] ${(m.checkIn.progress || '').slice(0, 80)}; blockers: ${m.checkIn.blockers || 'None'}`
      : 'no check-in — ASSUME HAS TIME';
    return `- ${m.name} (${m.role}): capacity=${m.capacity}; ${m.availabilitySummary}; ${checkIn}`;
  }).join('\n');
  return `${sprintLine}\nPrinciples: ${ctx.principles}\nTeam roster:\n${roster}`;
}
