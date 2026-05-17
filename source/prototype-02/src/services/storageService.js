export function loadState(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.warn('Failed to load saved state:', error);
        return fallback;
    }
}

export function saveState(key, state) {
    localStorage.setItem(key, JSON.stringify(state));
}
