import { Router } from './core/Router.js';
import { API } from './core/API.js';
import { LoginView } from './views/LoginView.js';
import { DashboardView } from './views/DashboardView.js';
import { GravesView } from './views/GravesView.js';
import { ArticlesView } from './views/ArticlesView.js';
import { ServicesView } from './views/ServicesView.js';
import { RequestsView } from './views/RequestsView.js';
import { MessagesView } from './views/MessagesView.js';
import { ReservationsView } from './views/ReservationsView.js';
import { FAQView } from './views/FAQView.js';
import { UsersView } from './views/UsersView.js';
import { DeveloperView } from './views/DeveloperView.js';

const routes = {
    '/login': { view: LoginView, requiresAuth: false },
    '/dashboard': { view: DashboardView, requiresAuth: true },
    '/graves': { view: GravesView, requiresAuth: true },
    '/articles': { view: ArticlesView, requiresAuth: true },
    '/services': { view: ServicesView, requiresAuth: true },
    '/requests': { view: RequestsView, requiresAuth: true },
    '/messages': { view: MessagesView, requiresAuth: true },
    '/reservations': { view: ReservationsView, requiresAuth: true },
    '/faq': { view: FAQView, requiresAuth: true },
    '/users': { view: UsersView, requiresAuth: true },
    '/developer': { view: DeveloperView, requiresAuth: true },
    '/': { view: DashboardView, requiresAuth: true } // Default to dashboard
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Admin SPA...');

    // Security Fix: Check for credentials in URL and clean them up
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('username') || urlParams.has('password')) {
        const username = urlParams.get('username');
        const password = urlParams.get('password');

        if (username && password) {
            try {
                // Attempt auto-login
                const response = await API.post('/api/login', { username, password });
                if (response.success) {
                    localStorage.setItem('adminUser', JSON.stringify(response.user || { username }));
                }
            } catch (e) {
                console.error('Auto-login failed', e);
            }
        }
        
        // Remove sensitive data from URL
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
    }

    new Router(routes);
});