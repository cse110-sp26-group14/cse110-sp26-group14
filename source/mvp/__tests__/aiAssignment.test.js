import { pickOwnerForTaskTitle, applyAiTaskSuggestions } from '../js/utils/aiAssignment.js';
import { buildTeamContextForAi } from '../js/utils/teamContext.js';
import { INITIAL_DATA } from '../js/data/initialData.js';

describe('aiAssignment', () => {
  test('pickOwnerForTaskTitle prefers backend role for API work', () => {
    const ctx = buildTeamContextForAi(INITIAL_DATA, 2);
    const owner = pickOwnerForTaskTitle('Migrate billing API schema', ctx.members);
    expect(owner).toBe('Jordan Lee');
  });

  test('applyAiTaskSuggestions fills owner and due', () => {
    const ctx = buildTeamContextForAi(INITIAL_DATA, 2);
    const out = applyAiTaskSuggestions([{ title: 'QA pass', priority: 'medium' }], ctx);
    expect(out[0].owner).toBeTruthy();
    expect(out[0].due).toMatch(/2026-05/);
  });
});
