/**
 * @jest-environment jsdom
 */

import {
  signUp,
  login,
  logout,
  getSessionUser,
  ensureDemoAccount,
} from '../js/services/authService.js';

beforeEach(() => {
  localStorage.clear();
});

describe('authService', () => {
  test('signUp and login flow', () => {
    const created = signUp({
      name: 'Test User',
      email: 'test@example.com',
      password: 'pass1234',
      role: 'QA',
    });
    expect(created.ok).toBe(true);

    logout();
    const bad = login({ email: 'test@example.com', password: 'wrong' });
    expect(bad.ok).toBe(false);

    const good = login({ email: 'test@example.com', password: 'pass1234' });
    expect(good.ok).toBe(true);
    expect(getSessionUser()?.email).toBe('test@example.com');
  });

  test('ensureDemoAccount seeds demo users', () => {
    ensureDemoAccount();
    const result = login({ email: 'maya@team.local', password: 'demo1234' });
    expect(result.ok).toBe(true);
    expect(result.user?.name).toBe('Maya Patel');
  });
});
