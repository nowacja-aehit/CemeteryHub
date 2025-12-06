import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class UsersView extends Component {
    constructor() {
        super();
        this.state = {
            users: [],
            loading: true
        };
        this.loadUsers();
    }

    async loadUsers() {
        try {
            const data = await API.get('/api/admin/users');
            this.state.users = data;
            this.state.loading = false;
            this.refresh();
        } catch (error) {
            console.error('Failed to load users', error);
            this.state.loading = false;
        }
    }

    refresh() {
        const tableBody = document.getElementById('users-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';
            this.renderTableRows().forEach(row => tableBody.appendChild(row));
            if (window.lucide) window.lucide.createIcons();
        }
    }

    renderTableRows() {
        if (this.state.loading) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 3, className: 'p-4 text-center' }, ['Ładowanie...'])
            ])];
        }

        return this.state.users.map(user => 
            this.createElement('tr', { className: 'border-b hover:bg-slate-50' }, [
                this.createElement('td', { className: 'p-4' }, [user.username]),
                this.createElement('td', { className: 'p-4' }, [user.role]),
                this.createElement('td', { className: 'p-4 flex gap-2' }, [
                    this.createElement('button', { 
                        className: 'text-blue-600 hover:text-blue-800',
                        onclick: () => this.openEditModal(user)
                    }, ['Edytuj']),
                    this.createElement('button', { 
                        className: 'text-red-600 hover:text-red-800',
                        onclick: () => this.deleteUser(user.id)
                    }, ['Usuń'])
                ])
            ])
        );
    }

    renderContent() {
        return this.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-slate-200' }, [
            // Toolbar
            this.createElement('div', { className: 'p-4 border-b border-slate-200 flex justify-between items-center' }, [
                this.createElement('h3', { className: 'font-semibold text-lg' }, ['Lista Użytkowników']),
                this.createElement('button', { 
                    className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2',
                    onclick: () => this.openAddModal()
                }, [
                    this.createElement('i', { 'data-lucide': 'plus', className: 'w-4 h-4' }),
                    'Dodaj Użytkownika'
                ])
            ]),
            // Table
            this.createElement('div', { className: 'overflow-x-auto' }, [
                this.createElement('table', { className: 'w-full text-left text-sm' }, [
                    this.createElement('thead', { className: 'bg-slate-50 text-slate-600 uppercase text-xs' }, [
                        this.createElement('tr', {}, [
                            this.createElement('th', { className: 'p-4' }, ['Nazwa Użytkownika']),
                            this.createElement('th', { className: 'p-4' }, ['Rola']),
                            this.createElement('th', { className: 'p-4' }, ['Akcje'])
                        ])
                    ]),
                    this.createElement('tbody', { id: 'users-table-body' }, this.renderTableRows())
                ])
            ])
        ]);
    }

    createInput(label, type, value, onChange, placeholder = '') {
        return this.createElement('div', { className: 'mb-4' }, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, [label]),
            this.createElement('input', { 
                type: type, 
                value: value || '',
                placeholder: placeholder,
                className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                onchange: (e) => onChange(e.target.value)
            })
        ]);
    }

    createSelect(label, value, options, onChange) {
        return this.createElement('div', { className: 'mb-4' }, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, [label]),
            this.createElement('select', { 
                className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                onchange: (e) => onChange(e.target.value)
            }, options.map(opt => 
                this.createElement('option', { value: opt.value, selected: opt.value === value }, [opt.label])
            ))
        ]);
    }

    openAddModal() {
        let formData = { username: '', password: '', role: 'user' };
        
        const content = this.createElement('div', { className: 'space-y-4' }, [
            this.createInput('Nazwa Użytkownika', 'text', '', v => formData.username = v),
            this.createInput('Hasło', 'password', '', v => formData.password = v),
            this.createSelect('Rola', 'user', [
                { value: 'user', label: 'Użytkownik' },
                { value: 'admin', label: 'Administrator' }
            ], v => formData.role = v)
        ]);

        Modal.show({
            title: 'Dodaj Użytkownika',
            content: content,
            onConfirm: async () => {
                try {
                    await API.post('/api/admin/users', formData);
                    this.loadUsers();
                    Modal.close();
                } catch (error) {
                    alert('Błąd podczas dodawania użytkownika: ' + (error.message || 'Nieznany błąd'));
                }
            }
        });
    }

    openEditModal(user) {
        let formData = { ...user, password: '' };
        
        const content = this.createElement('div', { className: 'space-y-4' }, [
            this.createInput('Nazwa Użytkownika', 'text', formData.username, v => formData.username = v),
            this.createInput('Nowe Hasło (pozostaw puste aby nie zmieniać)', 'password', '', v => formData.password = v),
            this.createSelect('Rola', formData.role, [
                { value: 'user', label: 'Użytkownik' },
                { value: 'admin', label: 'Administrator' }
            ], v => formData.role = v)
        ]);

        Modal.show({
            title: 'Edytuj Użytkownika',
            content: content,
            onConfirm: async () => {
                try {
                    await API.put(`/api/admin/users/${user.id}`, formData);
                    this.loadUsers();
                    Modal.close();
                } catch (error) {
                    alert('Błąd podczas edycji użytkownika: ' + (error.message || 'Nieznany błąd'));
                }
            }
        });
    }

    async deleteUser(id) {
        if (confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
            try {
                await API.delete(`/api/admin/users/${id}`);
                this.loadUsers();
            } catch (error) {
                alert('Błąd podczas usuwania użytkownika: ' + (error.message || 'Nieznany błąd'));
            }
        }
    }

    render() {
        return new AdminLayout({
            title: 'Zarządzanie Użytkownikami',
            contentComponent: this.renderContent()
        }).render();
    }
}
