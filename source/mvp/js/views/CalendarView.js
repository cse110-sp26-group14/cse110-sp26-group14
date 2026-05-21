import { BaseView } from './BaseView.js';
import { buildMonthGrid, formatSidebarDate, isDateInRange } from '../utils/calendarHelpers.js';
import { todayISO } from '../utils/dates.js';

export class CalendarView extends BaseView {
  constructor(store) {
    super(store);
    this.selectedDate = todayISO();
    const active = store.getActiveSprint();
    const anchor = active?.start || todayISO();
    const [y, m] = anchor.split('-').map(Number);
    this.viewYear = y;
    this.viewMonth = m - 1;
  }

  render() {
    const activeSprint = this.store.getActiveSprint();
    const meetings = this.store.getMeetings().filter(
      (m) => !activeSprint || m.sprintId === activeSprint.id,
    );
    const tasks = this.store.getState().tasks.filter((t) => t.due);
    const today = todayISO();
    const cells = buildMonthGrid(this.viewYear, this.viewMonth);
    const monthLabel = new Date(this.viewYear, this.viewMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const eventsFor = (iso) => {
      const dayMeetings = meetings.filter((m) => m.date === iso);
      const dayTasks = tasks.filter((t) => t.due === iso);
      return { dayMeetings, dayTasks };
    };

    const selected = eventsFor(this.selectedDate);

    return `
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 class="view-title">Sprint Calendar</h1>
          <p class="view-subtitle">${activeSprint?.name || 'Sprint'} • ${activeSprint?.start || ''} – ${activeSprint?.end || ''}</p>
        </div>
        <div class="calendar-controls" style="display: flex; gap: 0.5rem; align-items: center; background: var(--white); padding: 0.25rem; border-radius: var(--radius-md); border: 1px solid var(--border);">
          <button type="button" class="action-btn" style="border:none;" id="cal-prev-month" aria-label="Previous month">‹</button>
          <span style="font-size: 0.875rem; font-weight: 600; padding: 0 0.5rem;">${monthLabel}</span>
          <button type="button" class="action-btn" style="border:none;" id="cal-next-month" aria-label="Next month">›</button>
          <div style="width: 1px; background: var(--border); height: 20px; margin: 0 0.25rem;"></div>
          <button type="button" class="action-btn" style="border:none;" id="cal-goto-today">Today</button>
        </div>
      </div>

      <div class="calendar-layout" style="display: grid; grid-template-columns: 1fr 300px; gap: 2rem;">
        <div class="card" style="padding: 1.5rem;">
          <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border);">
            ${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => `
              <div style="background: var(--bg-main); padding: 0.75rem; text-align: center; font-size: 0.7rem; font-weight: 600; color: var(--text-light);">${day}</div>
            `).join('')}
            ${cells.map(({ iso, day, inMonth }) => {
              const { dayMeetings, dayTasks } = eventsFor(iso);
              const inSprint = isDateInRange(iso, activeSprint?.start, activeSprint?.end);
              const isToday = iso === today;
              const isSelected = iso === this.selectedDate;
              const chips = [
                ...dayMeetings.slice(0, 1).map((m) => ({
                  text: `${m.time} ${m.title}`.slice(0, 22),
                  style: 'background: var(--primary-light); color: var(--primary);',
                })),
                ...dayTasks.slice(0, 1).map((t) => ({
                  text: `Due: ${t.title}`.slice(0, 22),
                  style: 'background: var(--warning-light); color: var(--warning);',
                })),
              ];
              return `
                <button type="button" data-cal-date="${iso}" class="calendar-day" style="background: white; height: 120px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; text-align: left; border: none; cursor: pointer;
                  ${isSelected ? 'outline: 2px solid var(--primary); z-index: 10;' : ''}
                  ${isToday && !isSelected ? 'box-shadow: inset 0 0 0 2px var(--info);' : ''}">
                  <div style="font-size: 0.875rem; font-weight: 500; color: ${inMonth ? (inSprint ? 'var(--text-main)' : 'var(--text-light)') : 'var(--text-light)'};">${day}</div>
                  ${chips.map((c) => `<div style="${c.style} font-size: 0.6rem; padding: 0.25rem; border-radius: 4px; font-weight: 600;">${c.text}${c.text.length >= 22 ? '…' : ''}</div>`).join('')}
                </button>
              `;
            }).join('')}
          </div>
          <div style="display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.75rem; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--primary);"></span> Sprint range</div>
            <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--info);"></span> Meetings</div>
            <div style="display: flex; align-items: center; gap: 0.4rem;"><span class="dot" style="background: var(--warning);"></span> Tasks due</div>
          </div>
        </div>

        <div class="card" id="calendar-sidebar">
          <div class="card-header">
            <h3 class="card-title">${formatSidebarDate(this.selectedDate)}</h3>
          </div>
          <div style="margin-bottom: 2rem;">
            <h4 style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-light); margin-bottom: 0.75rem;">Meetings</h4>
            ${selected.dayMeetings.length
              ? selected.dayMeetings.map((m) => `
                <div style="padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                  <div style="font-weight: 600; font-size: 0.875rem;">${m.title}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${m.time} • ${m.format || 'meeting'}</div>
                  ${m.location ? `<div style="font-size: 0.75rem;">${m.location}</div>` : ''}
                  ${m.zoomLink ? `<a href="${m.zoomLink}" target="_blank" rel="noopener" style="font-size: 0.75rem;">Join link</a>` : ''}
                  ${m.goal ? `<p style="font-size: 0.75rem; margin-top: 0.5rem;">${m.goal}</p>` : ''}
                </div>`).join('')
              : '<p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">No meetings this day</p>'}
          </div>
          <div>
            <h4 style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-light); margin-bottom: 0.75rem;">Tasks due</h4>
            ${selected.dayTasks.length
              ? selected.dayTasks.map((t) => `
                <div style="padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.5rem;">
                  <div style="font-weight: 600; font-size: 0.875rem;">${t.title}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${t.owner || 'Unassigned'} • ${t.priority}</div>
                </div>`).join('')
              : '<p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">Nothing due</p>'}
          </div>
        </div>
      </div>
    `;
  }

  mount(container) {
    const rerender = () => {
      container.innerHTML = this.render();
      this.mount(container);
    };

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
