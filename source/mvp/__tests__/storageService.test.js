/**
 * @jest-environment jsdom
 */

import { loadState, saveState } from '../js/services/storageService.js';

describe('storageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saveState and loadState round-trip', () => {
    saveState('test-key', { a: 1, b: [2, 3] });
    expect(loadState('test-key', null)).toEqual({ a: 1, b: [2, 3] });
  });

  test('loadState returns fallback when missing', () => {
    expect(loadState('missing', { ok: true })).toEqual({ ok: true });
  });
});
