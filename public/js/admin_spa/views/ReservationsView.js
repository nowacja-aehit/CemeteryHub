import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class ReservationsView extends Component {
    constructor(params = {}) {
        super();
        this.params = params;
        this.state = {
            reservations: [],
            loading: true,
            activeStatus: 'Nowa'
        };
        this.loadReservations();
    }

    async loadReservations() {
        try {
            const data = await API.get('/api/admin/reservations');
            this.state.reservations = data.reverse(); // Newest first
            this.state.loading = false;
            this.refresh();

            if (this.params.id) {
                const reservation = this.state.reservations.find(r => r.id == this.params.id);
                if (reservation) {
                    this.openDetailsModal(reservation);
                    this.params.id = null;
                }
            }
        } catch (error) {
            console.error('Failed to load reservations', error);
            this.state.loading = false;
        }
    }

    refresh() {
        const tableBody = document.getElementById('reservations-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';
            this.renderTableRows().forEach(row => tableBody.appendChild(row));
        }
        
        // Refresh tabs active state
        const tabsContainer = document.getElementById('reservations-tabs');
        if (tabsContainer) {
            tabsContainer.innerHTML = '';
            tabsContainer.appendChild(this.renderTabs());
        }

        if (window.lucide) window.lucide.createIcons();
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'Nowa': return 'bg-blue-100 text-blue-800';
            case 'Potwierdzona': return 'bg-green-100 text-green-800';
            case 'Anulowana': return 'bg-red-100 text-red-800';
            case 'Zakończona': return 'bg-gray-100 text-gray-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

    renderTableRows() {
        if (this.state.loading) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 6, className: 'p-4 text-center' }, ['Ładowanie...'])
            ])];
        }

        const filteredReservations = this.state.reservations.filter(res => 
            this.state.activeStatus === 'Wszystkie' || res.status === this.state.activeStatus
        );

        if (filteredReservations.length === 0) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 6, className: 'p-4 text-center text-slate-500' }, ['Brak rezerwacji w tej kategorii'])
            ])];
        }

        return filteredReservations.map(res => 
            this.createElement('tr', { className: 'border-b hover:bg-slate-50' }, [
                this.createElement('td', { className: 'p-4' }, [res.scheduled_date || '-']),
                this.createElement('td', { className: 'p-4 font-medium' }, [res.name]),
                this.createElement('td', { className: 'p-4' }, [res.email]),
                this.createElement('td', { className: 'p-4' }, [res.phone]),
                this.createElement('td', { className: 'p-4' }, [
                    this.createElement('span', { 
                        className: `px-2 py-1 rounded-full text-xs font-medium ${this.getStatusBadgeClass(res.status)}` 
                    }, [res.status])
                ]),
                this.createElement('td', { className: 'p-4 flex gap-2' }, [
                    this.createElement('button', { 
                        className: 'text-blue-600 hover:text-blue-800',
                        onclick: () => this.openEditModal(res)
                    }, ['Szczegóły']),
                    this.createElement('button', { 
                        className: 'text-red-600 hover:text-red-800 ml-2',
                        onclick: () => this.deleteReservation(res.id)
                    }, ['Usuń'])
                ])
            ])
        );
    }

    openEditModal(res) {
        const content = this.createElement('div', { className: 'space-y-4' }, [
            this.createFormGroup('Imię i Nazwisko', 'text', 'name', res.name),
            this.createFormGroup('Email', 'email', 'email', res.email),
            this.createFormGroup('Telefon', 'tel', 'phone', res.phone),
            this.createFormGroup('Data rezerwacji', 'date', 'scheduled_date', res.scheduled_date),
            this.createFormGroup('Sekcja', 'text', 'section', res.section),
            this.createFormGroup('Rodzaj miejsca', 'text', 'plot_type', res.plot_type),
            this.createElement('div', { className: 'flex items-center gap-2' }, [
                this.createElement('input', { type: 'checkbox', id: 'edit-consultation', checked: res.consultation ? 'checked' : undefined }),
                this.createElement('label', { htmlFor: 'edit-consultation' }, ['Wymagana konsultacja'])
            ]),
            this.createElement('div', { className: 'space-y-1' }, [
                this.createElement('label', { className: 'block text-sm font-medium text-slate-700' }, ['Status']),
                this.createElement('select', { id: 'edit-status', className: 'w-full border rounded p-2' }, [
                    this.createOption('Nowa', 'Nowa', res.status),
                    this.createOption('Potwierdzona', 'Potwierdzona', res.status),
                    this.createOption('Anulowana', 'Anulowana', res.status),
                    this.createOption('Zakończona', 'Zakończona', res.status)
                ])
            ]),
            this.createElement('div', { className: 'space-y-1' }, [
                this.createElement('label', { className: 'block text-sm font-medium text-slate-700' }, ['Notatki klienta']),
                this.createElement('textarea', { id: 'edit-notes', className: 'w-full border rounded p-2', rows: 3, readonly: true }, [res.notes || ''])
            ]),
            this.createElement('div', { className: 'space-y-1' }, [
                this.createElement('label', { className: 'block text-sm font-medium text-slate-700' }, ['Uwagi pracownika']),
                this.createElement('textarea', { id: 'edit-admin-notes', className: 'w-full border rounded p-2', rows: 3 }, [res.admin_notes || ''])
            ])
        ]);

        Modal.show({
            title: 'Szczegóły Rezerwacji',
            content: [content],
            onConfirm: () => this.handleEditSubmit(res.id)
        });
    }

    createFormGroup(label, type, id, value) {
        return this.createElement('div', { className: 'space-y-1' }, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700' }, [label]),
            this.createElement('input', { 
                type: type, 
                id: `edit-${id}`, 
                value: value || '', 
                className: 'w-full border rounded p-2' 
            })
        ]);
    }

    createOption(value, label, currentStatus) {
        return this.createElement('option', { 
            value: value, 
            selected: value === currentStatus ? 'selected' : undefined 
        }, [label]);
    }

    async handleEditSubmit(id) {
        const data = {
            name: document.getElementById('edit-name').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            scheduled_date: document.getElementById('edit-scheduled_date').value,
            section: document.getElementById('edit-section').value,
            plot_type: document.getElementById('edit-plot_type').value,
            consultation: document.getElementById('edit-consultation').checked,
            status: document.getElementById('edit-status').value,
            notes: document.getElementById('edit-notes').value,
            admin_notes: document.getElementById('edit-admin-notes').value
        };

        try {
            await API.put(`/api/admin/reservations/${id}`, data);
            this.loadReservations();
            Modal.close();
        } catch (err) {
            alert('Błąd zapisu: ' + err.message);
        }
    }

    renderTabs() {
        const statuses = ['Nowa', 'Potwierdzona', 'Zakończona', 'Anulowana', 'Wszystkie'];
        
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
                        // Re-render tabs to update active state
                        const tabsContainer = document.getElementById('reservations-tabs');
                        if (tabsContainer) {
                            tabsContainer.innerHTML = '';
                            const newTabs = this.renderTabs();
                            Array.from(newTabs.children).forEach(child => tabsContainer.appendChild(child));
                        }
                    }
                }, [status]);
            })
        );
    }

    renderContent() {
        return this.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-slate-200' }, [
            // Toolbar
            this.createElement('div', { className: 'p-4 border-b border-slate-200 flex justify-between items-center' }, [
                this.createElement('h3', { className: 'font-semibold text-lg' }, ['Rezerwacje Miejsc']),
                this.createElement('div', {}, [])
            ]),
            // Tabs
            this.createElement('div', { id: 'reservations-tabs' }, [this.renderTabs()]),
            // Table
            this.createElement('div', { className: 'overflow-x-auto' }, [
                this.createElement('table', { className: 'w-full text-left text-sm' }, [
                    this.createElement('thead', { className: 'bg-slate-50 text-slate-600 uppercase text-xs' }, [
                        this.createElement('tr', {}, [
                            this.createElement('th', { className: 'p-4' }, ['Data']),
                            this.createElement('th', { className: 'p-4' }, ['Imię i Nazwisko']),
                            this.createElement('th', { className: 'p-4' }, ['Email']),
                            this.createElement('th', { className: 'p-4' }, ['Telefon']),
                            this.createElement('th', { className: 'p-4' }, ['Status']),
                            this.createElement('th', { className: 'p-4' }, ['Akcje'])
                        ])
                    ]),
                    this.createElement('tbody', { id: 'reservations-table-body' }, this.renderTableRows())
                ])
            ])
        ]);
    }

    async updateStatus(id, newStatus) {
        try {
            await API.put(`/api/admin/reservations/${id}`, { status: newStatus });
            // Update local state
            const res = this.state.reservations.find(r => r.id === id);
            if (res) res.status = newStatus;
            this.refresh();
        } catch (err) {
            alert('Błąd aktualizacji statusu: ' + err.message);
        }
    }

    async deleteReservation(id) {
        if (confirm('Czy na pewno chcesz usunąć tę rezerwację?')) {
            try {
                await API.delete(`/api/admin/reservations/${id}`);
                this.loadReservations();
            } catch (err) {
                alert('Błąd usuwania: ' + err.message);
            }
        }
    }

    render() {
        return new AdminLayout({
            title: 'Zarządzanie Rezerwacjami',
            contentComponent: this.renderContent()
        }).render();
    }
}