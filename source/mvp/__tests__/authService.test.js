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
  test('signUp and login flow', async () => {
    const created = await signUp({
      name: 'Test User',
      email: 'test@example.com',
      password: 'pass1234',
      role: 'QA',
    });
    expect(created.ok).toBe(true);

    await logout();
    const bad = await login({ email: 'test@example.com', password: 'wrong' });
    expect(bad.ok).toBe(false);

    const good = await login({ email: 'test@example.com', password: 'pass1234' });
    expect(good.ok).toBe(true);
    expect((await getSessionUser())?.email).toBe('test@example.com');
  });

  test('ensureDemoAccount seeds demo users', async () => {
    ensureDemoAccount();
    const result = await login({ email: 'maya@team.local', password: 'demo1234' });
    expect(result.ok).toBe(true);
    expect(result.user?.name).toBe('Maya Patel');
  });
});
