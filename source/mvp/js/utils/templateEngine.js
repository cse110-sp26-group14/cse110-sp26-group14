/**
 * Load HTML partials and render `{{placeholder}}` templates (no logic in markup files).
 * @module utils/templateEngine
 */

/** @type {boolean} */
let templatesReady = false;

/**
 * Fetch `templates/partials.html` and inject hidden template nodes into the document.
 * @returns {Promise<void>}
 */
export async function loadHtmlTemplates() {
  if (templatesReady) return;
  const res = await fetch(new URL('templates/partials.html', window.location.href));
  if (!res.ok) {
    throw new Error(`Failed to load templates/partials.html (${res.status})`);
  }
  const html = await res.text();
  let host = document.getElementById('template-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'template-host';
    host.setAttribute('hidden', '');
    host.setAttribute('aria-hidden', 'true');
    document.body.appendChild(host);
  }
  host.innerHTML = html;
  templatesReady = true;
}

/**
 * Escape text for safe HTML interpolation.
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Replace `{{key}}` placeholders in a template string.
 * @param {string} html
 * @param {Record<string, string|number|null|undefined>} [data]
 * @param {{ raw?: string[] }} [opts] keys listed in `raw` are inserted without escaping
 * @returns {string}
 */
export function fillTemplate(html, data = {}, opts = {}) {
  const rawKeys = new Set(opts.raw || []);
  let out = html;
  Object.entries(data).forEach(([key, val]) => {
    const safe = rawKeys.has(key) ? String(val ?? '') : escapeHtml(val);
    out = out.replaceAll(`{{${key}}}`, safe);
  });
  return out;
}

/**
 * Read a `<template id="...">` from `#template-host` and fill placeholders.
 * @param {string} templateId
 * @param {Record<string, string|number|null|undefined>} [data]
 * @param {{ raw?: string[] }} [opts]
 * @returns {string}
 */
export function renderTemplate(templateId, data = {}, opts = {}) {
  const el = document.getElementById(templateId);
  if (!el || !(el instanceof HTMLTemplateElement)) {
    throw new Error(`HTML template #${templateId} not found. Call loadHtmlTemplates() first.`);
  }
  return fillTemplate(el.innerHTML.trim(), data, opts);
}

/**
 * @param {string} templateId
 * @returns {boolean}
 */
export function hasTemplate(templateId) {
  return Boolean(document.getElementById(templateId));
}
