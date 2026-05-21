import { parseAuthApiError } from '../js/services/apiClient.js';

describe('apiClient auth errors', () => {
  test('parseAuthApiError reads JSON error field', () => {
    const msg = parseAuthApiError('{"ok":false,"error":"Invalid email or password."}', 401);
    expect(msg).toBe('Invalid email or password.');
  });

  test('parseAuthApiError falls back for 401', () => {
    expect(parseAuthApiError('', 401)).toBe('Invalid email or password.');
  });
});
