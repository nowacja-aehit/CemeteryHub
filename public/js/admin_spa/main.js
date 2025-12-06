import { Router } from './core/Router.js';
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Admin SPA...');
    new Router(routes);
});