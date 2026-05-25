export function todayISO() {
    return new Date().toISOString().split('T')[0];
}

export function currentTimestamp() {
    return new Date().toISOString();
}

export function toISODate(date) {
    return date.toISOString().split('T')[0];
}

export function getISOWeekKey(inputDate = new Date()) {
    const date = new Date(inputDate);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
    return `${utcDate.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function getWeekdayDates(inputDate = new Date()) {
    const date = new Date(inputDate);
    const day = date.getDay() || 7;
    const monday = new Date(date);
    monday.setDate(date.getDate() - day + 1);

    return Array.from({ length: 5 }, (_, index) => {
        const next = new Date(monday);
        next.setDate(monday.getDate() + index);
        return toISODate(next);
    });
}

export function formatShortDate(isoDate) {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
