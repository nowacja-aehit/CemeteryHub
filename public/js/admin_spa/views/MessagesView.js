import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class MessagesView extends Component {
    constructor(params = {}) {
        super();
        this.params = params;
        this.state = {
            messages: [],
            loading: true,
            activeStatus: 'Nowa'
        };
        this.loadMessages();
    }

    async loadMessages() {
        try {
            const data = await API.get('/api/admin/contact');
            this.state.messages = data.reverse(); // Newest first
            this.state.loading = false;
            this.refresh();

            if (this.params.id) {
                const message = this.state.messages.find(m => m.id == this.params.id);
                if (message) {
                    this.openDetailsModal(message);
                    this.params.id = null;
                }
            }
        } catch (error) {
            console.error('Failed to load messages', error);
            this.state.loading = false;
        }
    }

    refresh() {
        const tableBody = document.getElementById('messages-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';
            this.renderTableRows().forEach(row => tableBody.appendChild(row));
        }
        
        // Refresh tabs active state
        const tabsContainer = document.getElementById('messages-tabs');
        if (tabsContainer) {
            tabsContainer.innerHTML = '';
            tabsContainer.appendChild(this.renderTabs());
        }

        if (window.lucide) window.lucide.createIcons();
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'Nowa': return 'bg-blue-100 text-blue-800';
            case 'Przeczytana': return 'bg-yellow-100 text-yellow-800';
            case 'Odpowiedziano': return 'bg-green-100 text-green-800';
            case 'Archiwum': return 'bg-gray-100 text-gray-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

    renderTableRows() {
        if (this.state.loading) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 6, className: 'p-4 text-center' }, ['Ładowanie...'])
            ])];
        }

        const filteredMessages = this.state.messages.filter(msg => 
            this.state.activeStatus === 'Wszystkie' || msg.status === this.state.activeStatus
        );

        if (filteredMessages.length === 0) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 6, className: 'p-4 text-center text-slate-500' }, ['Brak wiadomości w tej kategorii'])
            ])];
        }

        return filteredMessages.map(msg => 
            this.createElement('tr', { className: 'border-b hover:bg-slate-50' }, [
                this.createElement('td', { className: 'p-4' }, [msg.created_at || '-']),
                this.createElement('td', { className: 'p-4 font-medium' }, [msg.name]),
                this.createElement('td', { className: 'p-4' }, [msg.email]),
                this.createElement('td', { className: 'p-4' }, [
                    this.createElement('span', { 
                        className: `px-2 py-1 rounded-full text-xs font-medium ${this.getStatusBadgeClass(msg.status)}` 
                    }, [msg.status])
                ]),
                this.createElement('td', { className: 'p-4 flex gap-2' }, [
                    this.createElement('button', { 
                        className: 'text-blue-600 hover:text-blue-800',
                        onclick: () => this.openDetailsModal(msg)
                    }, ['Szczegóły']),
                    this.createElement('button', { 
                        className: 'text-red-600 hover:text-red-800 ml-2',
                        onclick: () => this.deleteMessage(msg.id)
                    }, ['Usuń'])
                ])
            ])
        );
    }

    openDetailsModal(msg) {
        const content = this.createElement('div', { className: 'space-y-4' }, [
            this.createDetailRow('Data', msg.created_at),
            this.createDetailRow('Imię i Nazwisko', msg.name),
            this.createDetailRow('Email', msg.email),
            this.createDetailRow('Telefon', msg.phone || '-'),
            
            this.createElement('div', { className: 'space-y-1' }, [
                this.createElement('label', { className: 'block text-sm font-medium text-slate-700' }, ['Treść wiadomości']),
                this.createElement('div', { className: 'w-full border rounded p-3 bg-slate-50 text-sm' }, [msg.message])
            ]),

            this.createElement('div', { className: 'space-y-1' }, [
                this.createElement('label', { className: 'block text-sm font-medium text-slate-700' }, ['Status']),
                this.createElement('select', { id: 'edit-status', className: 'w-full border rounded p-2' }, [
                    this.createOption('Nowa', 'Nowa', msg.status),
                    this.createOption('Przeczytana', 'Przeczytana', msg.status),
                    this.createOption('Odpowiedziano', 'Odpowiedziano', msg.status),
                    this.createOption('Archiwum', 'Archiwum', msg.status)
                ])
            ]),

            this.createElement('div', { className: 'space-y-1' }, [
                this.createElement('label', { className: 'block text-sm font-medium text-slate-700' }, ['Uwagi pracownika']),
                this.createElement('textarea', { id: 'edit-admin-notes', className: 'w-full border rounded p-2', rows: 3 }, [msg.admin_notes || ''])
            ])
        ]);

        Modal.show({
            title: 'Szczegóły Wiadomości',
            content: [content],
            onConfirm: () => this.handleUpdate(msg.id)
        });
    }

    createDetailRow(label, value) {
        return this.createElement('div', { className: 'grid grid-cols-3 gap-4' }, [
            this.createElement('div', { className: 'text-sm font-medium text-slate-500' }, [label]),
            this.createElement('div', { className: 'col-span-2 text-sm text-slate-900' }, [value])
        ]);
    }

    createOption(value, label, currentStatus) {
        return this.createElement('option', { 
            value: value, 
            selected: value === currentStatus ? 'selected' : undefined 
        }, [label]);
    }

    async handleUpdate(id) {
        const data = {
            status: document.getElementById('edit-status').value,
            admin_notes: document.getElementById('edit-admin-notes').value
        };

        try {
            await API.put(`/api/admin/contact/${id}`, data);
            this.loadMessages();
            Modal.close();
        } catch (err) {
            alert('Błąd zapisu: ' + err.message);
        }
    }

    renderTabs() {
        const statuses = ['Nowa', 'Przeczytana', 'Odpowiedziano', 'Archiwum', 'Wszystkie'];
        
        return this.createElement('div', { className: 'flex border-b border-slate-200' }, 
            statuses.map(status => {
                const isActive = this.state.activeStatus === status;
                return this.createElement('button', {
                    className: `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        isActive 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`,
                    onclick: () => {
                        this.state.activeStatus = status;
                        this.refresh();
                    }
                }, [status]);
            })
        );
    }

    renderContent() {
        return this.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-slate-200' }, [
            // Toolbar
            this.createElement('div', { className: 'p-4 border-b border-slate-200 flex justify-between items-center' }, [
                this.createElement('h3', { className: 'font-semibold text-lg' }, ['Wiadomości']),
                this.createElement('div', {}, [])
            ]),
            // Tabs
            this.createElement('div', { id: 'messages-tabs' }, [this.renderTabs()]),
            // Table
            this.createElement('div', { className: 'overflow-x-auto' }, [
                this.createElement('table', { className: 'w-full text-left text-sm' }, [
                    this.createElement('thead', { className: 'bg-slate-50 text-slate-600 uppercase text-xs' }, [
                        this.createElement('tr', {}, [
                            this.createElement('th', { className: 'p-4' }, ['Data']),
                            this.createElement('th', { className: 'p-4' }, ['Imię i Nazwisko']),
                            this.createElement('th', { className: 'p-4' }, ['Email']),
                            this.createElement('th', { className: 'p-4' }, ['Status']),
                            this.createElement('th', { className: 'p-4' }, ['Akcje'])
                        ])
                    ]),
                    this.createElement('tbody', { id: 'messages-table-body' }, this.renderTableRows())
                ])
            ])
        ]);
    }

    async deleteMessage(id) {
        if (confirm('Czy na pewno chcesz usunąć tę wiadomość?')) {
            try {
                await API.delete(`/api/admin/contact/${id}`);
                this.loadMessages();
            } catch (err) {
                alert('Błąd usuwania: ' + err.message);
            }
        }
    }

    render() {
        return new AdminLayout({
            title: 'Skrzynka Odbiorcza',
            contentComponent: this.renderContent()
        }).render();
    }
}