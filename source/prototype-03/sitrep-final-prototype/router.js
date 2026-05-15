/**
 * router.js - Lightweight Hash Router
 */
import { store } from './store.js';

const routes = {
    '#/dashboard': 'view-dashboard',
    '#/check-ins': 'view-checkins',
    '#/sprint-board': 'view-sprint',
    '#/analytics': 'view-analytics'
};

export const router = {
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        // Handle initial load
        if (!window.location.hash) window.location.hash = '#/dashboard';
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash || '#/dashboard';
        const componentName = routes[hash] || 'view-dashboard';
        
        const container = document.getElementById('view-container');
        if (container) {
            // Clear current view and inject new component
            container.innerHTML = `<${componentName}></${componentName}>`;
        }
        
        // Update store with current view
        store.setState({ currentView: componentName });
    }
};
