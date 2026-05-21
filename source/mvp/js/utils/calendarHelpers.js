/**
 * Build a month grid (Mon–Sun) with leading/trailing days from adjacent months.
 * @param {number} year
 * @param {number} month 0-based
 * @returns {{ iso: string, day: number, inMonth: boolean }[]}
 */
export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startPad; i += 1) {
    const d = new Date(year, month, -startPad + i + 1);
    cells.push({
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      inMonth: false,
    });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, month, day);
    cells.push({
      iso: d.toISOString().slice(0, 10),
      day,
      inMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const d = new Date(last.iso);
    d.setDate(d.getDate() + 1);
    cells.push({
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      inMonth: false,
    });
  }
  return cells;
}

/**
 * @param {string} iso YYYY-MM-DD
 * @param {string} start
 * @param {string} end
 */
export function isDateInRange(iso, start, end) {
  if (!start || !end) return false;
  return iso >= start && iso <= end;
}

/**
 * @param {string} iso
 */
export function formatSidebarDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
