/**
 * Build calendar view HTML from data + HTML templates (no inline markup in view class).
 * @module views/renderers/calendarRenderer
 */

import { renderTemplate } from '../../utils/templateEngine.js';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/**
 * @param {{ text: string, chipClass: string }} chip
 * @returns {string}
 */
function renderChip(chip) {
  const ellipsis = chip.text.length >= 22 ? '…' : '';
  return renderTemplate('tpl-cal-chip', {
    text: chip.text.slice(0, 22),
    ellipsis,
    chipClass: chip.chipClass,
  });
}

/**
 * @param {object} params
 * @returns {string}
 */
export function renderCalendarDayCell(params) {
  const {
    iso, day, inMonth, inSprint, isToday, isSelected, chips,
  } = params;
  const dayClasses = [
    'calendar-day',
    isSelected ? 'calendar-day--selected' : '',
    isToday && !isSelected ? 'calendar-day--today' : '',
  ].filter(Boolean).join(' ');

  let dayNumClass = 'calendar-day__num--muted';
  if (inMonth) {
    dayNumClass = inSprint ? 'calendar-day__num--sprint' : 'calendar-day__num--muted';
  }

  return renderTemplate('tpl-cal-day', {
    iso,
    day: String(day),
    dayClasses,
    dayNumClass,
    chips: chips.map(renderChip).join(''),
  }, { raw: ['dayClasses', 'chips'] });
}

/**
 * @param {string} heading
 * @param {string} bodyHtml
 * @returns {string}
 */
export function renderSidebarSection(heading, bodyHtml) {
  return renderTemplate('tpl-cal-sidebar-section', {
    heading,
    body: bodyHtml,
  }, { raw: ['body'] });
}

/**
 * @param {{ title: string, meta: string, extra?: string }} event
 * @param {'default'|'google'} [variant]
 * @returns {string}
 */
export function renderMeetingCard(event, variant = 'default') {
  const extra = event.extra || '';
  const card = renderTemplate('tpl-cal-meeting-card', {
    title: event.title,
    meta: event.meta,
    extra,
  }, { raw: ['extra'] });
  return variant === 'google'
    ? card.replace('cal-event-card"', 'cal-event-card cal-event-card--google"')
    : card;
}

/**
 * @param {object} params
 * @returns {string}
 */
export function renderCalendarLayout(params) {
  const weekdayHeaders = WEEKDAYS.map(
    (d) => `<div class="cal-grid__weekday">${d}</div>`,
  ).join('');

  const legend = [
    { dot: 'var(--primary)', label: 'Sprint range' },
    { dot: 'var(--danger)', label: 'Sprint deadline' },
    { dot: 'var(--info)', label: 'Meetings' },
    { dot: '#6366f1', label: 'Google' },
    { dot: 'var(--warning)', label: 'Tasks due' },
  ].map(({ dot, label }) => `
    <span class="cal-legend__item"><span class="dot" style="background:${dot};"></span> ${label}</span>
  `).join('');

  return renderTemplate('tpl-cal-layout', {
    subtitle: params.subtitle,
    monthLabel: params.monthLabel,
    gcalToolbar: params.gcalToolbar,
    weekdayHeaders,
    dayCells: params.dayCells,
    legend,
    sidebarTitle: params.sidebarTitle,
    sidebarBody: params.sidebarBody,
  }, { raw: ['gcalToolbar', 'weekdayHeaders', 'dayCells', 'legend', 'sidebarBody'] });
}
