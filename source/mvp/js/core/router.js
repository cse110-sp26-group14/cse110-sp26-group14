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

    /**
     * Initializes the router: on first call, subscribes to `hashchange` and
     * routes the current hash; on subsequent calls, just re-routes (the
     * listener is registered only once).
     * @returns {void}
     */
    init() {
        if (this._inited) {
            this.handleRoute();
            return;
        }
        this._inited = true;
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    /**
     * Resolves the current location hash (defaulting to `#dashboard`) to a view
     * class and renders it; if no route matches, logs an error and redirects to
     * `#dashboard`.
     * @returns {void}
     */
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

    /**
     * Updates the navigation items' active state, marking the item whose `href`
     * matches the given hash as active and clearing the rest.
     * @param {string} hash - The current route hash (e.g. `#dashboard`).
     * @returns {void}
     */
    updateNav(hash) {
        this.navItems.forEach(item => {
            if (item.getAttribute('href') === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Instantiates the given view class with the store, renders its HTML into
     * the app container, and invokes the view's `mount` hook.
     * @param {typeof import('../views/BaseView.js').BaseView} ViewClass - The view class to instantiate and render.
     * @returns {void}
     */
    renderView(ViewClass) {
        const view = new ViewClass(this.store);
        this.appContainer.innerHTML = view.render();
        view.mount(this.appContainer);
    }
}