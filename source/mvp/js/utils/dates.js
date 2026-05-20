export function todayISO() {
    return new Date().toISOString().split('T')[0];
}

export function currentTimestamp() {
    return new Date().toISOString();
}
