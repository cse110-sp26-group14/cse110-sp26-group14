/**
 * DeepSeek Chat API (OpenAI-compatible) for team summary and task suggestions.
 * @see https://api-docs.deepseek.com/
 * @module lib/openai
 */

const BASE_URL = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

/**
 * @returns {boolean}
 */
export function isOpenAiConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

/** @returns {boolean} */
export function isAiConfigured() {
  return isOpenAiConfigured();
}

/**
 * @returns {string}
 */
function getApiKey() {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error('DEEPSEEK_API_KEY is not set on the server. Copy .env.example to .env');
  }
  return key;
}

/**
 * @param {string} system
 * @param {string} user
 * @returns {Promise<string>}
 */
async function chat(system, user) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
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
 * @param {object[]} reports
 * @param {object[]} issues
 * @returns {Promise<{ content: string, details: object }>}
 */
export async function generateTeamSummary(reports, issues) {
  const reportText = reports.map((r) =>
    `- ${r.user_name || r.userId}: [${r.status}] ${r.progress}; blockers: ${r.blockers}`,
  ).join('\n');
  const issueText = issues.map((i) => `- ${i.title} (${i.severity}, ${i.status})`).join('\n');

  const content = await chat(
    'You are an agile coach. Summarize team daily reports in 3-5 sentences. Mention completed work, in-progress work, blockers, missing check-ins, and sprint risks. Be concise.',
    `Reports:\n${reportText || 'No reports yet.'}\n\nOpen issues:\n${issueText || 'None.'}`,
  );

  return {
    content,
    details: {
      reportCount: reports.length,
      openIssues: issues.length,
      model: MODEL,
      provider: 'deepseek',
    },
  };
}

/**
 * @param {string} goals
 * @param {object[]} issues
 * @param {object|null} sprint
 * @param {string} teamContextText formatted roster / check-ins / availability
 * @returns {Promise<{ tasks: object[], raw: string }>}
 */
export async function generateTaskSuggestions(goals, issues, sprint, teamContextText) {
  const issueText = issues.map((i) => `- ${i.title} (${i.severity}, assignee: ${i.assignee || 'none'})`).join('\n');
  const sprintDates = sprint ? `${sprint.start} to ${sprint.end}` : 'current sprint';
  const raw = await chat(
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
