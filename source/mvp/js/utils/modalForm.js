/**
 * Bind a single submit handler on a modal form (avoids duplicate listeners).
 * Closes the modal immediately and shows non-blocking toasts for sync feedback.
 * @module utils/modalForm
 */

import { showToast } from './toast.js';

/**
 * @param {string} formId
 * @param {(formData: FormData, form: HTMLFormElement) => Promise<void>|void} onSubmit
 * @param {{
 *   onClose?: () => void,
 *   pendingToast?: string,
 *   successToast?: string|false,
 *   submittingLabel?: string,
 * }} [options]
 */
export function bindModalForm(formId, onSubmit, options = {}) {
  const form = document.getElementById(formId);
  if (!form || form.dataset.sitrepSubmitBound === '1') return;
  form.dataset.sitrepSubmitBound = '1';

  const {
    onClose,
    pendingToast = 'Submitted — saving…',
    successToast = 'Saved.',
    submittingLabel = 'Saving…',
  } = options;

  const handler = async (event) => {
    event.preventDefault();
    form.removeEventListener('submit', handler);

    const submitBtn = form.querySelector('button[type="submit"], .primary-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = submittingLabel;
    }

    if (onClose) onClose();
    if (pendingToast) showToast(pendingToast, 'info', 2200);

    try {
      await onSubmit(new FormData(form), form);
      if (successToast) showToast(successToast, 'success', 4200);
    } catch (err) {
      showToast(err?.message || 'Could not save. Please try again.', 'error', 6000);
    }
  };

  form.addEventListener('submit', handler);
}
