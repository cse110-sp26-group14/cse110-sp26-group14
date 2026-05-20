/**
 * OpenAI Chat Completions for team summary and task suggestions.
 * @module lib/openai
 */

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * @returns {boolean}
 */
export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * @param {string} system
 * @param {string} user
 * @returns {Promise<string>}
 */
async function chat(system, user) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set on the server. Copy .env.example to .env');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
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
    details: { reportCount: reports.length, openIssues: issues.length, model: MODEL },
  };
}

/**
 * @param {string} goals
 * @param {object[]} issues
 * @returns {Promise<{ tasks: object[], raw: string }>}
 */
export async function generateTaskSuggestions(goals, issues) {
  const issueText = issues.map((i) => `- ${i.title}`).join('\n');
  const raw = await chat(
    'You help sprint planning. Return ONLY valid JSON: an array of 3-5 objects with keys title (string), priority (critical|high|medium|low). No markdown.',
    `Sprint goals: ${goals}\n\nOpen issues:\n${issueText || 'None'}`,
  );

  let tasks = [];
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (Array.isArray(parsed)) tasks = parsed;
  } catch {
    tasks = [
      { title: `${goals} — spike`, priority: 'high' },
      { title: `${goals} — implementation`, priority: 'medium' },
      { title: `${goals} — QA pass`, priority: 'medium' },
    ];
  }
  return { tasks, raw };
}
