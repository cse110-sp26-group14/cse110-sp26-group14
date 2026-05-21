/**
 * DeepSeek API for Worker (env bindings).
 * @module openai
 */

/**
 * @param {object} env
 * @returns {boolean}
 */
export function isOpenAiConfigured(env) {
  return Boolean(env.DEEPSEEK_API_KEY);
}

/**
 * @param {object} env
 * @param {string} system
 * @param {string} user
 * @returns {Promise<string>}
 */
async function chat(env, system, user) {
  const base = (env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const model = env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
  const key = env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY is not set. Use: wrangler secret put DEEPSEEK_API_KEY');

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      stream: false,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * @param {object} env
 * @param {object[]} reports
 * @param {object[]} issues
 */
export async function generateTeamSummary(env, reports, issues) {
  const reportText = reports.map((r) =>
    `- ${r.user_name || r.userId}: [${r.status}] ${r.progress}; blockers: ${r.blockers}`,
  ).join('\n');
  const issueText = issues.map((i) => `- ${i.title} (${i.severity}, ${i.status})`).join('\n');
  const model = env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
  const content = await chat(
    env,
    'You are an agile coach. Summarize team daily reports in 3-5 sentences. Mention completed work, in-progress work, blockers, missing check-ins, and sprint risks. Be concise.',
    `Reports:\n${reportText || 'No reports yet.'}\n\nOpen issues:\n${issueText || 'None.'}`,
  );
  return {
    content,
    details: { reportCount: reports.length, openIssues: issues.length, model, provider: 'deepseek' },
  };
}

/**
 * @param {object} env
 * @param {string} goals
 * @param {object[]} issues
 * @param {object|null} sprint
 * @param {string} teamContextText
 */
export async function generateTaskSuggestions(env, goals, issues, sprint, teamContextText) {
  const issueText = issues.map((i) => `- ${i.title} (${i.severity}, assignee: ${i.assignee || 'none'})`).join('\n');
  const sprintDates = sprint ? `${sprint.start} to ${sprint.end}` : 'current sprint';
  const raw = await chat(
    env,
    'You help sprint planning. Return ONLY valid JSON: an array of 3-5 objects. Each object: title (string), priority (critical|high|medium|low), due (YYYY-MM-DD within sprint), owner (string — MUST be an exact name from the team roster). Assign owners by role fit, check-in capacity, and availability. If someone has no check-in, assume they have time. No markdown.',
    `Sprint goals: ${goals}\nSprint dates: ${sprintDates}\n\n${teamContextText}\n\nOpen issues:\n${issueText || 'None'}\n\nSpread due dates across the sprint. Prefer members with high capacity.`,
  );
  let tasks = [];
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (Array.isArray(parsed)) tasks = parsed;
  } catch {
    const fallbackDue = sprint?.end || new Date().toISOString().slice(0, 10);
    tasks = [
      { title: `${goals} — spike`, priority: 'high', due: fallbackDue, owner: null },
      { title: `${goals} — implementation`, priority: 'medium', due: fallbackDue, owner: null },
      { title: `${goals} — QA pass`, priority: 'medium', due: fallbackDue, owner: null },
    ];
  }
  return { tasks, raw };
}
