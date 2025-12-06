export class Router {
    constructor(routes, rootElementId = 'app') {
        this.routes = routes;
        this.rootElement = document.getElementById(rootElementId);
        this.currentView = null;

        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // Initial load
    }

    handleRoute() {
        let hash = window.location.hash.slice(1) || '/';
        let queryParams = {};

        if (hash.includes('?')) {
            const parts = hash.split('?');
            hash = parts[0];
            const searchParams = new URLSearchParams(parts[1]);
            for (const [key, value] of searchParams) {
                queryParams[key] = value;
            }
        }

        const route = this.routes[hash] || this.routes['/404'] || this.routes['/'];

        if (this.currentView) {
            // Optional: Cleanup current view if needed
        }

        this.rootElement.innerHTML = ''; // Clear app
        
        // Check auth if needed (simple check)
        const user = localStorage.getItem('adminUser');
        if (route.requiresAuth && !user) {
            window.location.hash = '/login';
            return;
        }

        if (route.view) {
            this.currentView = new route.view(queryParams);
            this.currentView.mount(this.rootElement);
            if (window.lucide) window.lucide.createIcons();
        }
    }

    static navigate(path) {
        window.location.hash = path;
    }
}