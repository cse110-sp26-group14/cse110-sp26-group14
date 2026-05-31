/**
 * Login and sign-up screen markup.
 * @module views/LoginView
 */

/**
 * Renders the authentication screen markup with login and sign-up tabs/forms.
 * @returns {string} HTML for auth UI
 */
export function renderLoginPage() {
  return `
    <div class="auth-card">
      <h1>SE SitRep</h1>
      <p class="auth-subtitle">Agile operations center — sign in to continue</p>
      <div class="auth-tabs">
        <button type="button" class="auth-tab active" data-auth-tab="login">Log in</button>
        <button type="button" class="auth-tab" data-auth-tab="signup">Sign up</button>
      </div>
      <p id="auth-error" class="auth-error" role="alert"></p>
      <form id="login-form" class="form-stack auth-panel" data-panel="login">
        <div class="form-field">
          <label for="login-email">Email</label>
          <input id="login-email" name="email" type="email" required autocomplete="username" />
        </div>
        <div class="form-field">
          <label for="login-password">Password</label>
          <input id="login-password" name="password" type="password" required autocomplete="current-password" />
        </div>
        <div class="form-actions">
          <button type="submit" class="primary-btn">Log in</button>
        </div>
      </form>
      <form id="signup-form" class="form-stack auth-panel hidden" data-panel="signup">
        <div class="form-field">
          <label for="signup-name">Full name</label>
          <input id="signup-name" name="name" type="text" required />
        </div>
        <div class="form-field">
          <label for="signup-email">Email</label>
          <input id="signup-email" name="email" type="email" required />
        </div>
        <div class="form-field">
          <label for="signup-role">Role</label>
          <input id="signup-role" name="role" type="text" placeholder="e.g. Frontend" />
        </div>
        <div class="form-field">
          <label for="signup-password">Password</label>
          <input id="signup-password" name="password" type="password" required minlength="4" />
        </div>
        <div class="form-actions">
          <button type="submit" class="primary-btn">Create account</button>
        </div>
      </form>
      <p class="auth-hint">Demo: <code>maya@team.local</code> / <code>demo1234</code></p>
    </div>
  `;
}

/**
 * Wire tab switching and form handlers.
 * @param {HTMLElement} root
 * @param {{ onSuccess: () => void }} handlers
 */
export function mountLoginPage(root, handlers) {
  root.innerHTML = renderLoginPage();

  const errorEl = root.querySelector('#auth-error');
  const tabs = root.querySelectorAll('.auth-tab');
  const panels = root.querySelectorAll('.auth-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.authTab;
      panels.forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.panel !== target);
      });
      errorEl.textContent = '';
      errorEl.classList.remove('auth-error-visible');
    });
  });

  /**
   * Displays an auth error message, making the error element visible and
   * scrolling it into view.
   * @param {string} message
   */
  function showAuthError(message) {
    errorEl.textContent = message;
    errorEl.classList.add('auth-error-visible');
    errorEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  root.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';
    errorEl.classList.remove('auth-error-visible');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn?.setAttribute('disabled', 'true');
    try {
      const { login } = await import('../services/authService.js');
      const formData = new FormData(event.target);
      const result = await login({
        email: formData.get('email'),
        password: formData.get('password'),
      });
      if (!result.ok) {
        showAuthError(result.error || 'Invalid email or password.');
        return;
      }
      handlers.onSuccess(result.user);
    } catch (err) {
      showAuthError(err.message || 'Login failed. Please try again.');
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });

  root.querySelector('#signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';
    errorEl.classList.remove('auth-error-visible');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn?.setAttribute('disabled', 'true');
    try {
      const { signUp } = await import('../services/authService.js');
      const formData = new FormData(event.target);
      const result = await signUp({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
      });
      if (!result.ok) {
        showAuthError(result.error || 'Sign up failed.');
        return;
      }
      handlers.onSuccess(result.user);
    } catch (err) {
      showAuthError(err.message || 'Sign up failed. Please try again.');
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });
}