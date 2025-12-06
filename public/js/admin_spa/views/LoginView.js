import { Component } from '../core/Component.js';
import { API } from '../core/API.js';
import { Router } from '../core/Router.js';

export class LoginView extends Component {
    constructor() {
        super();
        this.state = {
            username: '',
            password: '',
            error: null
        };
    }

    async handleLogin() {
        try {
            const response = await API.post('/api/login', {
                username: this.state.username,
                password: this.state.password
            });

            if (response.success) {
                localStorage.setItem('adminUser', JSON.stringify(response.user || { username: this.state.username }));
                Router.navigate('/dashboard');
            } else {
                this.showError('Nieprawidłowe dane logowania');
            }
        } catch (err) {
            this.showError('Błąd połączenia z serwerem');
        }
    }

    showError(msg) {
        const errorEl = this.element.querySelector('#login-error');
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove('hidden');
        }
    }

    render() {
        // Container
        return this.createElement('div', { className: 'flex items-center justify-center min-h-screen bg-slate-100' }, [
            // Card
            this.createElement('div', { className: 'bg-white p-8 rounded-lg shadow-lg w-full max-w-md' }, [
                // Header
                this.createElement('div', { className: 'text-center mb-8' }, [
                    this.createElement('div', { className: 'w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mx-auto mb-4' }, [
                        // Icon placeholder (Lucide icons need to be rendered after mount usually, or use SVG string)
                        this.createElement('i', { className: 'w-6 h-6 text-white', 'data-lucide': 'lock' })
                    ]),
                    this.createElement('h1', { className: 'text-2xl font-bold text-slate-900' }, ['Logowanie Administratora']),
                    this.createElement('p', { className: 'text-slate-500' }, ['Zaloguj się, aby kontynuować'])
                ]),
                
                // Form Container (Not a <form> tag to avoid submit issues)
                this.createElement('div', { className: 'space-y-4' }, [
                    // Username
                    this.createElement('div', {}, [
                        this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, ['Nazwa użytkownika']),
                        this.createElement('input', { 
                            type: 'text', 
                            className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                            oninput: (e) => this.state.username = e.target.value,
                            onkeydown: (e) => { if(e.key === 'Enter') this.handleLogin() }
                        })
                    ]),
                    // Password
                    this.createElement('div', {}, [
                        this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, ['Hasło']),
                        this.createElement('input', { 
                            type: 'password', 
                            className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                            oninput: (e) => this.state.password = e.target.value,
                            onkeydown: (e) => { if(e.key === 'Enter') this.handleLogin() }
                        })
                    ]),
                    // Error
                    this.createElement('div', { id: 'login-error', className: 'text-red-500 text-sm hidden' }, []),
                    // Button
                    this.createElement('button', { 
                        className: 'w-full py-2 px-4 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors',
                        onclick: () => this.handleLogin()
                    }, ['Zaloguj się'])
                ])
            ])
        ]);
    }

    mount(parent) {
        super.mount(parent);
        if (window.lucide) window.lucide.createIcons();
    }
}