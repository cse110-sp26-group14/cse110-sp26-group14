/**
 * Hash-based client router for view classes.
 * @module core/router
 */

/**
 * @typedef {typeof import('./store.js').Store} Store
 */

/**
 * Client-side hash router.
 */
export class Router {
  /**
   * @param {Record<string, typeof import('../views/BaseView.js').BaseView>} routes
   * @param {Store} store
   */
    constructor(routes, store) {
        this.routes = routes;
        this.store = store;
        this.appContainer = document.getElementById('app');
        this.navItems = document.querySelectorAll('.nav-item');
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    handleRoute() {
        const hash = window.location.hash || '#dashboard';
        const ViewClass = this.routes[hash];

        if (ViewClass) {
            this.updateNav(hash);
            this.renderView(ViewClass);
        } else {
            console.error('Route not found:', hash);
            window.location.hash = '#dashboard';
        }
    }

    updateNav(hash) {
        this.navItems.forEach(item => {
            if (item.getAttribute('href') === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    renderView(ViewClass) {
        const view = new ViewClass(this.store);
        this.appContainer.innerHTML = view.render();
        view.mount(this.appContainer);
    }
}
