import { Badge } from '../components/Badge.js';

export class BaseView {
    constructor(store) {
        this.store = store;
    }
    render() { return ''; }
    mount(container) {}
    
    // Helper to generate badges
    getBadgeHTML(type, label) {
        return Badge(type, label);
    }
}
