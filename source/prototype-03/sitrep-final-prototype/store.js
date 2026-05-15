/**
 * store.js - Proxy-based Reactive State Management
 */
class SitRepStore {
    constructor(initialState = {}) {
        this.observers = [];
        this.state = new Proxy(initialState, {
            set: (target, key, value) => {
                target[key] = value;
                this.notify();
                return true;
            }
        });
    }

    subscribe(observer) {
        this.observers.push(observer);
        // Immediate notification for initial render
        observer(this.state);
    }

    notify() {
        this.observers.forEach(observer => observer(this.state));
    }

    // Helper to update specific fields
    setState(newState) {
        Object.assign(this.state, newState);
    }
}

// Initial default data based on Image 72
export const store = new SitRepStore({
    sprint: {
        name: "Sprint 2: Design & Prototype",
        completion: 63,
        daysRemaining: 14,
        stats: { done: 12, inProgress: 5, blockers: 2, checkins: 19 }
    },
    team: [
        { id: 1, name: "Owen Atis", focus: "Auth Middleware & JWT", status: "IN PROGRESS", blockers: null, mood: "🙂", coverage: 100 },
        { id: 2, name: "Aria Chen", focus: "UI Bento Grid Fixes", status: "REVIEW", blockers: "Asset missing", mood: "😐", coverage: 85 },
        { id: 3, name: "SIT-BOT", focus: "Aggregating daily commits...", status: "SCANNING", blockers: null, mood: "🤖", coverage: 100, isAI: true }
    ],
    checkins: [],
    currentView: 'dashboard'
});
