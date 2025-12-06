import { Component } from '../core/Component.js';
import { Router } from '../core/Router.js';

export class AdminLayout extends Component {
    constructor(props = {}) {
        super(props);
        this.contentComponent = props.contentComponent;
    }

    handleLogout() {
        localStorage.removeItem('adminUser');
        Router.navigate('/login');
    }

    render() {
        return this.createElement('div', { className: 'flex h-screen bg-slate-100' }, [
            // Sidebar
            this.createElement('aside', { className: 'w-64 bg-slate-900 text-white flex flex-col flex-shrink-0' }, [
                this.createElement('div', { className: 'p-6 font-bold text-xl border-b border-slate-800' }, ['CemeteryHub']),
                this.createElement('nav', { className: 'flex-1 p-4 space-y-2 overflow-y-auto' }, [
                    this.createNavItem('Dashboard', '/dashboard', 'layout-dashboard'),
                    this.createNavItem('Groby', '/graves', 'layers'),
                    this.createNavItem('Artykuły', '/articles', 'file-text'),
                    this.createNavItem('Usługi', '/services', 'dollar-sign'),
                    this.createNavItem('Zgłoszenia', '/requests', 'clipboard-list'),
                    this.createNavItem('Wiadomości', '/messages', 'mail'),
                    this.createNavItem('Rezerwacje', '/reservations', 'calendar'),
                    this.createNavItem('FAQ', '/faq', 'help-circle'),
                    this.createNavItem('Użytkownicy', '/users', 'users'),
                    this.createNavItem('Developer', '/developer', 'code'),
                ]),
                this.createElement('div', { className: 'p-4 border-t border-slate-800' }, [
                    this.createElement('button', { 
                        className: 'flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-slate-800 rounded transition-colors',
                        onclick: () => this.handleLogout()
                    }, [
                        this.createElement('i', { 'data-lucide': 'log-out', className: 'w-5 h-5' }),
                        'Wyloguj'
                    ])
                ])
            ]),
            
            // Main Content Wrapper
            this.createElement('main', { className: 'flex-1 flex flex-col overflow-hidden' }, [
                // Top Header
                this.createElement('header', { className: 'h-16 bg-white border-b flex items-center justify-between px-8 shadow-sm z-10' }, [
                    this.createElement('h2', { className: 'text-xl font-semibold text-slate-800' }, [this.props.title || 'Panel Administratora']),
                    this.createElement('div', { className: 'flex items-center gap-4' }, [
                        this.createElement('span', { className: 'text-sm text-slate-600' }, ['Administrator']),
                        this.createElement('div', { className: 'w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center' }, [
                            this.createElement('i', { 'data-lucide': 'user', className: 'w-4 h-4 text-slate-600' })
                        ])
                    ])
                ]),
                
                // Content Area
                this.createElement('div', { className: 'flex-1 overflow-auto p-8' }, [
                    this.contentComponent
                ])
            ])
        ]);
    }

    createNavItem(label, path, icon) {
        const isActive = window.location.hash.slice(1) === path;
        return this.createElement('button', { 
            className: `flex items-center gap-3 w-full px-4 py-2 rounded transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`,
            onclick: () => Router.navigate(path)
        }, [
            this.createElement('i', { 'data-lucide': icon, className: 'w-5 h-5' }),
            label
        ]);
    }

    mount(parent) {
        super.mount(parent);
        if (window.lucide) window.lucide.createIcons();
    }
}