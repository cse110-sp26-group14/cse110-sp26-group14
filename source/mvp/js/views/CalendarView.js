/**
 * Sprint calendar: meetings, tasks, Google events, per-day team check-ins.
 * @module views/CalendarView
 */

import { BaseView } from './BaseView.js';
import { buildMonthGrid, formatSidebarDate, isDateInRange } from '../utils/calendarHelpers.js';
import { getDayTeamContext } from '../utils/calendarDayContext.js';
import {
  connectAndFetchGoogleEvents,
  formatGoogleEvent,
  isGoogleCalendarConnected,
} from '../services/googleCalendarService.js';
import { useGoogleCalendar } from '../config/appConfig.js';
import { todayISO } from '../utils/dates.js';
import { getSprintTasksWithoutDue } from '../utils/taskHelpers.js';
import { renderTemplate } from '../utils/templateEngine.js';
import { showToast } from '../utils/toast.js';
import {
  renderCalendarDayCell,
  renderCalendarLayout,
  renderMeetingCard,
  renderSidebarSection,
} from './renderers/calendarRenderer.js';

/**
 * @typedef {object} DayChip
 * @property {string} text
 * @property {string} chipClass
 */

/**
 * Sprint calendar view.
 * @extends BaseView
 */
export class CalendarView extends BaseView {
  /**
   * @param {import('../core/store.js').Store} store
   */
  constructor(store) {
    super(store);
    this.selectedDate = todayISO();
    const sprint = store.getSelectedSprint();
    const anchor = sprint?.start || todayISO();
    const [y, m] = anchor.split('-').map(Number);
    this.viewYear = y;
    this.viewMonth = m - 1;
  }

  /**
   * Build chip list for a calendar day cell.
   * @param {object} dayEvents
   * @returns {DayChip[]}
   */
  buildDayChips(dayEvents) {
    const chips = [];
    if (dayEvents.isDeadline) {
      chips.push({ text: 'Sprint ends', chipClass: 'cal-chip-deadline' });
    }
    dayEvents.dayMeetings.slice(0, 1).forEach((m) => {
      chips.push({
        text: `${m.time} ${m.title}`.slice(0, 22),
        chipClass: 'cal-chip-meeting',
      });
    });
    dayEvents.dayGoogle.slice(0, 1).forEach((g) => {
      chips.push({ text: `G: ${g.title}`.slice(0, 22), chipClass: 'cal-chip-google' });
    });
    dayEvents.dayTasks.slice(0, 1).forEach((t) => {
      chips.push({ text: `Due: ${t.title}`.slice(0, 22), chipClass: 'cal-chip-task' });
    });
    return chips;
  }

  /**
   * @returns {string}
   */
  renderSidebarBody(selected, dayContext) {
    const meetingsHtml = selected.dayMeetings.length
      ? selected.dayMeetings.map((m) => renderMeetingCard({
        title: m.title,
        meta: `${m.time} • ${m.format || 'meeting'}`,
        extra: m.goal ? `<p class="cal-event-card-meta">${m.goal}</p>` : '',
      }, 'default')).join('')
      : '<p class="cal-empty">No meetings this day</p>';

    const googleHtml = selected.dayGoogle.length
      ? selected.dayGoogle.map((g) => renderMeetingCard({
        title: g.title,
        meta: g.time,
      }, 'google')).join('')
      : '';

    const tasksHtml = selected.dayTasks.length
      ? selected.dayTasks.map((t) => renderMeetingCard({
        title: t.title,
        meta: `${t.owner || 'Unassigned'} • ${t.priority}`,
      })).join('')
      : '<p class="cal-empty">Nothing due</p>';

    const checkinsHtml = dayContext.byUser.map(({ user, report, tasks }) => {
      let body = '<div class="cal-checkin-card-muted">No check-in</div>';
      if (report) {
        body = `
          <div class="cal-checkin-card-meta">${report.status} • ${report.mood}</div>
          <div class="cal-checkin-card-muted">${report.progress || ''}</div>
          ${report.blockers && report.blockers !== 'None'
            ? `<div class="cal-checkin-card-blocker">Blocker: ${report.blockers}</div>`
            : ''}
          ${report.notes ? `<div class="cal-checkin-card-muted">Note: ${report.notes}</div>` : ''}`;
      }
      if (tasks.length) {
        body += `<div class="cal-checkin-card-muted">Tasks due: ${tasks.map((t) => t.title).join(', ')}</div>`;
      }
      return renderTemplate('tpl-cal-checkin-card', { name: user.name, body }, { raw: ['body'] });
    }).join('');

    const undated = getSprintTasksWithoutDue(this.store, this.store.getSelectedSprint()?.id);
    const undatedHtml = undated.length
      ? undated.map((t) => renderMeetingCard({
        title: t.title,
        meta: `${t.owner || 'Unassigned'} • ${t.priority} • set a due date`,
      })).join('')
      : '';

    const sections = [
      renderSidebarSection('Meetings', meetingsHtml + googleHtml),
      renderSidebarSection('Tasks due', tasksHtml),
    ];
    if (undatedHtml) {
      sections.push(renderSidebarSection('Tasks without due date', undatedHtml));
    }
    sections.push(renderSidebarSection('Team check-ins', checkinsHtml));
    return sections.join('');
  }

  /**
   * @returns {string} HTML for route mount
   */
  render() {
    const sprint = this.store.getSelectedSprint();
    const sprintId = sprint?.id;
    const meetings = this.store.getMeetings().filter(
      (m) => !sprintId || m.sprintId === sprintId,
    );
    const tasks = this.store.getState().tasks.filter((t) => t.due && (!sprintId || t.sprintId === sprintId));
    const googleFormatted = this.store.getGoogleEvents().map(formatGoogleEvent);
    const today = todayISO();
    const cells = buildMonthGrid(this.viewYear, this.viewMonth);
    const monthLabel = new Date(this.viewYear, this.viewMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const sprintEnd = sprint?.end;

    const eventsFor = (iso) => ({
      dayMeetings: meetings.filter((m) => m.date === iso),
      dayTasks: tasks.filter((t) => t.due === iso),
      dayGoogle: googleFormatted.filter((g) => g.iso === iso),
      isDeadline: Boolean(sprintEnd && iso === sprintEnd),
    });

    const dayCells = cells.map(({ iso, day, inMonth }) => {
      const ev = eventsFor(iso);
      return renderCalendarDayCell({
        iso,
        day,
        inMonth,
        inSprint: isDateInRange(iso, sprint?.start, sprint?.end),
        isToday: iso === today,
        isSelected: iso === this.selectedDate,
        chips: this.buildDayChips(ev),
      });
    }).join('');

    const gcalToolbar = useGoogleCalendar()
      ? renderTemplate('tpl-gcal-connect-btn', {
        label: isGoogleCalendarConnected() ? 'Refresh Google Calendar' : 'Connect Google Calendar',
      })
      : renderTemplate('tpl-gcal-hint');

    const selected = eventsFor(this.selectedDate);
    const dayContext = getDayTeamContext(this.store, this.selectedDate, sprintId);

    return renderCalendarLayout({
      subtitle: `${sprint?.name || 'Sprint'} • ${sprint?.start || ''} – ${sprint?.end || ''}`,
      monthLabel,
      gcalToolbar,
      dayCells,
      sidebarTitle: formatSidebarDate(this.selectedDate),
      sidebarBody: this.renderSidebarBody(selected, dayContext),
    });
  }

  /**
   * Bind calendar interactions after HTML is injected.
   * @param {HTMLElement} container
   */
  mount(container) {
    const rerender = () => {
      container.innerHTML = this.render();
      this.mount(container);
    };

    container.querySelector('#btn-connect-gcal')?.addEventListener('click', async () => {
      const btn = container.querySelector('#btn-connect-gcal');
      try {
        showToast('Connecting to Google Calendar…', 'info', 2200);
        const events = await connectAndFetchGoogleEvents();
        this.store.setGoogleEvents(events);
        rerender();
        showToast(`Loaded ${events.length} upcoming event(s).`, 'success', 4200);
      } catch (err) {
        showToast(err.message || 'Google Calendar connection failed.', 'error', 6000);
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    container.querySelectorAll('[data-cal-date]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedDate = btn.dataset.calDate;
        rerender();
      });
    });

    container.querySelector('#cal-goto-today')?.addEventListener('click', () => {
      const t = todayISO();
      this.selectedDate = t;
      const [y, m] = t.split('-').map(Number);
      this.viewYear = y;
      this.viewMonth = m - 1;
      rerender();
    });

    container.querySelector('#cal-prev-month')?.addEventListener('click', () => {
      if (this.viewMonth === 0) {
        this.viewMonth = 11;
        this.viewYear -= 1;
      } else {
        this.viewMonth -= 1;
      }
      rerender();
    });

    container.querySelector('#cal-next-month')?.addEventListener('click', () => {
      if (this.viewMonth === 11) {
        this.viewMonth = 0;
        this.viewYear += 1;
      } else {
        this.viewMonth += 1;
      }
      rerender();
    });
  }
}
