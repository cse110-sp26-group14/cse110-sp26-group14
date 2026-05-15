/**
 * main.js - Application Entry Point
 */
import { router } from './router.js';
import { db } from './db.js';
import { store } from './store.js';
import { aiEngine } from './ai-engine.js';

// Import Web Components
import './components/sidebar.js';
import './components/status-badge.js';
import './components/bento-card.js';
import './components/checkin-modal.js';

// Import Views
import './views/dashboard.js';
import './views/checkins.js';
import './views/sprint.js';
import './views/analytics.js';

async function init() {
    console.log('SE SitRep Initializing...');
    
    // Initialize DB
    await db.open();
    
    // Load historical check-ins into store
    const history = await db.getAllCheckins();
    store.setState({ checkins: history });
    
    // Initialize Router
    router.init();

    // Start AI Simulation
    aiEngine.init();
    
    // Replace Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

document.addEventListener('DOMContentLoaded', init);
