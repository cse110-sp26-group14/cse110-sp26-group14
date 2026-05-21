import { todayISO } from '../js/utils/dates.js';

describe('dates', () => {
  afterEach(() => {
    delete globalThis.SITREP_CONFIG;
  });

  test('todayISO uses sitrepToday override when set', () => {
    globalThis.SITREP_CONFIG = { sitrepToday: '2026-05-15' };
    expect(todayISO()).toBe('2026-05-15');
  });

  test('todayISO ignores invalid override', () => {
    globalThis.SITREP_CONFIG = { sitrepToday: 'not-a-date' };
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
