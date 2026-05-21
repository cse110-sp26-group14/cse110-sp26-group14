import { renderCalendarDayCell } from '../js/views/renderers/calendarRenderer.js';

describe('calendarRenderer', () => {
  test('renderCalendarDayCell marks selected day and deadline chip', () => {
    const html = renderCalendarDayCell({
      iso: '2026-05-19',
      day: 19,
      inMonth: true,
      inSprint: true,
      isToday: false,
      isSelected: true,
      chips: [{ text: 'Sprint ends', chipClass: 'cal-chip-deadline' }],
    });
    expect(html).toContain('data-cal-date="2026-05-19"');
    expect(html).toContain('calendar-day-selected');
    expect(html).toContain('cal-chip-deadline');
    expect(html).toContain('Sprint ends');
  });

  test('renderCalendarDayCell includes meeting chip class', () => {
    const html = renderCalendarDayCell({
      iso: '2026-05-14',
      day: 14,
      inMonth: true,
      inSprint: true,
      isToday: false,
      isSelected: false,
      chips: [{ text: '10:00 Standup', chipClass: 'cal-chip-meeting' }],
    });
    expect(html).toContain('cal-chip-meeting');
  });
});
