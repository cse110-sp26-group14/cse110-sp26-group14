/**
 * Bind a single submit handler on a modal form (avoids duplicate listeners).
 * @param {string} formId
 * @param {(formData: FormData, form: HTMLFormElement) => Promise<void>|void} onSubmit
 */
export function bindModalForm(formId, onSubmit) {
  const form = document.getElementById(formId);
  if (!form) return;

  const handler = async (event) => {
    event.preventDefault();
    form.removeEventListener('submit', handler);
    await onSubmit(new FormData(form), form);
  };
  form.addEventListener('submit', handler);
}
