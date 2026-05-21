/**
 * Non-blocking toast notifications and button busy states.
 * @module utils/toast
 */

/** @type {HTMLElement|null} */
let host = null;

/**
 * @returns {HTMLElement}
 */
function getHost() {
  if (!host) {
    host = document.createElement('div');
    host.id = 'sitrep-toast-host';
    host.className = 'toast-host';
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-atomic', 'false');
    document.body.appendChild(host);
  }
  return host;
}

/**
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} [type]
 * @param {number} [durationMs]
 */
export function showToast(message, type = 'info', durationMs = 4000) {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.textContent = message;
  getHost().appendChild(el);
  const remove = () => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 200);
  };
  if (durationMs > 0) {
    setTimeout(remove, durationMs);
  }
  return remove;
}

/**
 * @param {HTMLButtonElement|null|undefined} btn
 * @param {boolean} busy
 * @param {string} [busyLabel]
 */
export function setButtonBusy(btn, busy, busyLabel = 'Working…') {
  if (!btn) return;
  if (busy) {
    if (!btn.dataset.sitrepPrevLabel) {
      btn.dataset.sitrepPrevLabel = btn.textContent || '';
    }
    btn.disabled = true;
    btn.classList.add('is-busy');
    btn.textContent = busyLabel;
    return;
  }
  btn.disabled = false;
  btn.classList.remove('is-busy');
  if (btn.dataset.sitrepPrevLabel) {
    btn.textContent = btn.dataset.sitrepPrevLabel;
    delete btn.dataset.sitrepPrevLabel;
  }
}

/**
 * Run async work with button busy state; optional toasts (no blocking dialogs).
 * @param {HTMLButtonElement|null|undefined} btn
 * @param {() => Promise<unknown>} fn
 * @param {{ busyLabel?: string, pendingToast?: string, successToast?: string|false, errorToast?: string|false }} [opts]
 */
export async function runWithButtonFeedback(btn, fn, opts = {}) {
  const {
    busyLabel = 'Working…',
    pendingToast,
    successToast,
    errorToast,
  } = opts;

  setButtonBusy(btn, true, busyLabel);
  if (pendingToast) showToast(pendingToast, 'info', 2500);

  try {
    const result = await fn();
    if (successToast) showToast(successToast, 'success', 4500);
    return result;
  } catch (err) {
    const msg = err?.message || 'Something went wrong.';
    showToast(errorToast === false ? msg : (errorToast || msg), 'error', 6000);
    throw err;
  } finally {
    setButtonBusy(btn, false);
  }
}
