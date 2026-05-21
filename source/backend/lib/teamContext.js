/**
 * Team roster + check-in + availability for AI assignment (server-side).
 * @module lib/teamContext
 */

const POSITIVE = ['available', 'preferred', 'tentative'];
const NEGATIVE = ['unavailable', 'needs_coverage'];

/**
 * @param {Record<string, string>} slots
 */
function summarizeSlots(slots) {
  if (!slots || !Object.keys(slots).length) {
    return { hasData: false, summary: 'No availability — assume full day available', freeRatio: 1 };
  }
  const values = Object.values(slots);
  let score = 0;
  values.forEach((s) => {
    if (POSITIVE.includes(s)) score += 1;
    else if (NEGATIVE.includes(s)) score += 0;
    else score += 0.5;
  });
  const freeRatio = score / values.length;
  const open = values.filter((s) => POSITIVE.includes(s)).length;
  return { hasData: true, summary: `${open}/${values.length} slots open`, freeRatio };
}

/**
 * @param {object} state
 * @param {number} sprintId
 * @returns {{ sprint: object|null, members: object[], principles: string }}
 */
export function buildTeamContextForAi(state, sprintId) {
  const sid = sprintId ?? state.sprints?.find((s) => s.status === 'active')?.id ?? 2;
  const sprint = state.sprints?.find((s) => Number(s.id) === Number(sid)) || null;
  const availabilityMap = state.availability || {};
  const dates = Object.keys(availabilityMap).sort().reverse().slice(0, 7);

  const members = (state.users || []).map((user) => {
    const reports = (state.reports || [])
      .filter((r) => Number(r.userId) === Number(user.id))
      .filter((r) => r.sprintId == null || Number(r.sprintId) === Number(sid))
      .sort((a, b) => (b.timestamp || b.date).localeCompare(a.timestamp || a.date));
    const latest = reports[0] || null;
    const hasCheckIn = Boolean(latest);

    let slots = user.availability || {};
    for (const d of dates) {
      const day = availabilityMap[d];
      const s = day?.[user.id] ?? day?.[String(user.id)];
      if (s && Object.keys(s).length) {
        slots = s;
        break;
      }
    }
    const avail = summarizeSlots(slots);

    let capacity = 'high';
    if (hasCheckIn) {
      if (latest.status === 'Blocked') capacity = 'low';
      else if (latest.blockers && latest.blockers !== 'None') capacity = 'medium';
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
      assumedAvailable: !hasCheckIn,
      checkIn: latest ? {
        date: latest.date,
        status: latest.status,
        progress: latest.progress,
        blockers: latest.blockers,
      } : null,
      availabilitySummary: avail.summary,
      capacity,
      freeRatio: avail.freeRatio,
    };
  });

  return {
    sprint,
    members,
    principles: 'No check-in means assume has time. Missing availability means full-day available. Match owner to role and capacity.',
  };
}

/**
 * @param {{ sprint: object|null, members: object[], principles: string }} ctx
 * @returns {string}
 */
export function formatTeamContextForPrompt(ctx) {
  const sprintLine = ctx.sprint
    ? `Sprint: ${ctx.sprint.name} (${ctx.sprint.start} – ${ctx.sprint.end})`
    : 'Sprint: (unknown)';
  const roster = ctx.members.map((m) => {
    const ci = m.hasCheckIn
      ? `check-in: [${m.checkIn.status}] ${(m.checkIn.progress || '').slice(0, 80)}; blockers: ${m.checkIn.blockers || 'None'}`
      : 'no check-in — ASSUME HAS TIME';
    return `- ${m.name} (${m.role}): capacity=${m.capacity}; ${m.availabilitySummary}; ${ci}`;
  }).join('\n');
  return `${sprintLine}\n${ctx.principles}\nRoster:\n${roster}`;
}
