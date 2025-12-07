import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class RequestsView extends Component {
    constructor(params = {}) {
        super();
        this.params = params;
        this.state = {
            requests: [],
            availableServices: [],
            loading: true,
            filter: 'all' // all, pending, in_progress, completed
        };
        this.loadData();
    }

    async loadData() {
        try {
            const [requests, services] = await Promise.all([
                API.get('/api/admin/service-requests'),
                API.get('/api/services')
            ]);
            this.state.requests = requests;
            this.state.availableServices = services;
            this.state.loading = false;
            this.refresh();

            if (this.params.id) {
                const request = this.state.requests.find(r => r.id == this.params.id);
                if (request) {
                    this.openEditModal(request);
                    this.params.id = null;
                }
            }
        } catch (error) {
            console.error('Failed to load data', error);
            this.state.loading = false;
        }
    }

    loadRequests() {
        this.loadData();
    }

    refresh() {
        const tableBody = document.getElementById('requests-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';
            this.renderTableRows().forEach(row => tableBody.appendChild(row));
            if (window.lucide) window.lucide.createIcons();
        }

        // Update filter buttons state
        if (this.element) {
            const buttons = this.element.querySelectorAll('button[data-filter]');
            buttons.forEach(btn => {
                const filter = btn.dataset.filter;
                const isActive = this.state.filter === filter;
                btn.className = `px-3 py-1 rounded text-sm ${isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
            });
        }
    }

    getFilteredRequests() {
        if (this.state.filter === 'all') return this.state.requests;
        return this.state.requests.filter(r => r.status === this.state.filter);
    }

    getStatusBadgeClass(status) {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getStatusLabel(status) {
        switch (status) {
            case 'pending': return 'Oczekujące';
            case 'in_progress': return 'W trakcie';
            case 'completed': return 'Zakończone';
            default: return status;
        }
    }

    renderTableRows() {
        if (this.state.loading) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 6, className: 'p-4 text-center' }, ['Ładowanie...'])
            ])];
        }

        const filtered = this.getFilteredRequests();

        if (filtered.length === 0) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 6, className: 'p-4 text-center text-slate-500' }, ['Brak zgłoszeń'])
            ])];
        }

        return filtered.map(req => 
            this.createElement('tr', { className: 'border-b hover:bg-slate-50' }, [
                this.createElement('td', { className: 'p-4' }, [`#${req.id}`]),
                this.createElement('td', { className: 'p-4' }, [req.serviceType || 'Usługa']),
                this.createElement('td', { className: 'p-4' }, [req.date]),
                this.createElement('td', { className: 'p-4' }, [req.contactName || '-']),
                this.createElement('td', { className: 'p-4' }, [
                    this.createElement('span', { 
                        className: `px-2 py-1 rounded-full text-xs font-medium ${this.getStatusBadgeClass(req.status)}` 
                    }, [this.getStatusLabel(req.status)])
                ]),
                this.createElement('td', { className: 'p-4 flex gap-2' }, [
                    this.createElement('button', { 
                        className: 'text-blue-600 hover:text-blue-800 text-sm',
                        onclick: () => this.openDetailsModal(req)
                    }, ['Szczegóły']),
                    this.createElement('button', { 
                        className: 'text-indigo-600 hover:text-indigo-800 text-sm ml-2',
                        onclick: () => this.openEditModal(req)
                    }, ['Edytuj']),
                    this.createElement('select', {
                        className: 'text-sm border rounded p-1 ml-2',
                        onchange: (e) => this.updateStatus(req.id, e.target.value)
                    }, [
                        this.createOption('pending', 'Oczekujące', req.status),
                        this.createOption('in_progress', 'W trakcie', req.status),
                        this.createOption('completed', 'Zakończone', req.status)
                    ])
                ])
            ])
        );
    }

    createOption(value, label, currentStatus) {
        return this.createElement('option', { 
            value: value, 
            selected: value === currentStatus ? 'selected' : undefined 
        }, [label]);
    }

    renderContent() {
        return this.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-slate-200' }, [
            // Toolbar
            this.createElement('div', { className: 'p-4 border-b border-slate-200 flex justify-between items-center' }, [
                this.createElement('h3', { className: 'font-semibold text-lg' }, ['Zgłoszenia Usług']),
                this.createElement('div', { className: 'flex gap-2' }, [
                    this.createFilterButton('all', 'Wszystkie'),
                    this.createFilterButton('pending', 'Oczekujące'),
                    this.createFilterButton('in_progress', 'W trakcie'),
                    this.createFilterButton('completed', 'Zakończone'),
                ])
            ]),
            // Table
            this.createElement('div', { className: 'overflow-x-auto' }, [
                this.createElement('table', { className: 'w-full text-left text-sm' }, [
                    this.createElement('thead', { className: 'bg-slate-50 text-slate-600 uppercase text-xs' }, [
                        this.createElement('tr', {}, [
                            this.createElement('th', { className: 'p-4' }, ['ID']),
                            this.createElement('th', { className: 'p-4' }, ['Typ Usługi']),
                            this.createElement('th', { className: 'p-4' }, ['Data']),
                            this.createElement('th', { className: 'p-4' }, ['Zleceniodawca']),
                            this.createElement('th', { className: 'p-4' }, ['Status']),
                            this.createElement('th', { className: 'p-4' }, ['Akcje'])
                        ])
                    ]),
                    this.createElement('tbody', { id: 'requests-table-body' }, this.renderTableRows())
                ])
            ])
        ]);
    }

    createFilterButton(filter, label) {
        const isActive = this.state.filter === filter;
        return this.createElement('button', {
            className: `px-3 py-1 rounded text-sm ${isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`,
            'data-filter': filter,
            onclick: () => {
                this.state.filter = filter;
                this.refresh();
            }
        }, [label]);
    }

    openDetailsModal(req) {
        // Format services list
        let servicesContent = [this.createElement('div', { className: 'text-slate-500 italic' }, ['Brak szczegółów usług'])];
        if (req.services && Array.isArray(req.services) && req.services.length > 0) {
            servicesContent = req.services.map(s => 
                this.createElement('div', { className: 'flex justify-between text-sm py-1 border-b border-slate-100 last:border-0' }, [
                    this.createElement('span', {}, [s.name]),
                    this.createElement('span', { className: 'font-medium' }, [`${s.price} PLN`])
                ])
            );
        }

        const modal = new Modal({
            title: `Szczegóły Zgłoszenia #${req.id}`,
            content: [
                this.createDetailRow('Typ Usługi', req.serviceType),
                this.createDetailRow('Data Zgłoszenia', req.date),
                this.createDetailRow('Data Realizacji', req.scheduled_date || 'Nie ustalono'),
                this.createDetailRow('Status', this.getStatusLabel(req.status)),
                this.createElement('hr', { className: 'my-2' }),
                this.createElement('h4', { className: 'font-semibold mb-2' }, ['Dane Kontaktowe']),
                this.createDetailRow('Imię i Nazwisko', req.contactName),
                this.createDetailRow('Email', req.contactEmail),
                this.createDetailRow('Telefon', req.contactPhone),
                this.createElement('hr', { className: 'my-2' }),
                this.createElement('h4', { className: 'font-semibold mb-2' }, ['Szczegóły Zamówienia']),
                this.createElement('div', { className: 'bg-slate-50 p-3 rounded mb-2' }, servicesContent),
                this.createDetailRow('Uwagi klienta', req.notes || '-'),
                this.createDetailRow('Koszt całkowity', `${req.total_cost || 0} PLN`),
                this.createElement('div', { className: 'mt-4' }, [
                    this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, ['Notatki Administratora']),
                    this.createElement('textarea', {
                        className: 'w-full px-3 py-2 border border-slate-300 rounded-md h-24',
                        onchange: (e) => this.updateAdminNotes(req.id, e.target.value)
                    }, [req.admin_notes || ''])
                ])
            ],
            cancelText: 'Zamknij',
            confirmText: null
        });
        modal.mount();
    }

    openEditModal(req) {
        let formData = {
            status: req.status,
            scheduled_date: req.scheduled_date || '',
            admin_notes: req.admin_notes || '',
            discount: req.discount || 0,
            services: [...(req.services || [])]
        };

        const container = this.createElement('div', { className: 'space-y-4' });

        const calculateTotal = () => {
            const servicesTotal = formData.services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
            return Math.max(0, servicesTotal - (parseFloat(formData.discount) || 0)).toFixed(2);
        };

        const renderForm = () => {
            container.innerHTML = '';

            // 1. Status & Date
            const row1 = this.createElement('div', { className: 'grid grid-cols-2 gap-4' }, [
                this.createElement('div', {}, [
                    this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, ['Status']),
                    this.createElement('select', {
                        className: 'w-full px-3 py-2 border border-slate-300 rounded-md',
                        onchange: (e) => formData.status = e.target.value
                    }, [
                        this.createOption('pending', 'Oczekujące', formData.status),
                        this.createOption('in_progress', 'W trakcie', formData.status),
                        this.createOption('completed', 'Zakończone', formData.status)
                    ])
                ]),
                this.createElement('div', {}, [
                    this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, ['Data Realizacji']),
                    this.createElement('input', {
                        type: 'date',
                        value: formData.scheduled_date,
                        className: 'w-full px-3 py-2 border border-slate-300 rounded-md',
                        onchange: (e) => formData.scheduled_date = e.target.value
                    })
                ])
            ]);
            container.appendChild(row1);

            // 2. Services List
            const servicesLabel = this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mt-2 mb-1' }, ['Usługi']);
            container.appendChild(servicesLabel);

            if (formData.services.length === 0) {
                container.appendChild(this.createElement('div', { className: 'text-sm text-slate-500 italic mb-2' }, ['Brak wybranych usług']));
            } else {
                const list = this.createElement('div', { className: 'space-y-2 mb-2' });
                formData.services.forEach((s, index) => {
                    const item = this.createElement('div', { className: 'flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200' }, [
                        this.createElement('span', { className: 'text-sm' }, [`${s.name} (${s.price} PLN)`]),
                        this.createElement('button', {
                            className: 'text-red-500 hover:text-red-700',
                            onclick: () => {
                                formData.services.splice(index, 1);
                                renderForm();
                            }
                        }, [this.createElement('i', { 'data-lucide': 'trash-2', className: 'w-4 h-4' })])
                    ]);
                    list.appendChild(item);
                });
                container.appendChild(list);
            }

            // 3. Add Service
            const addServiceRow = this.createElement('div', { className: 'flex gap-2 mb-4' }, [
                this.createElement('select', {
                    id: 'add-service-select',
                    className: 'flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm'
                }, [
                    this.createElement('option', { value: '' }, ['-- Dodaj usługę --']),
                    ...this.state.availableServices.map(s => 
                        this.createElement('option', { value: s.slug }, [`${s.name} (${s.price} PLN)`])
                    )
                ]),
                this.createElement('button', {
                    className: 'px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm font-medium',
                    onclick: () => {
                        const select = document.getElementById('add-service-select');
                        const slug = select.value;
                        if (!slug) return;
                        const service = this.state.availableServices.find(s => s.slug === slug);
                        if (service) {
                            formData.services.push({ name: service.name, price: service.price, type: 'additional' });
                            renderForm();
                        }
                    }
                }, ['Dodaj'])
            ]);
            container.appendChild(addServiceRow);

            // 4. Discount & Total
            const row2 = this.createElement('div', { className: 'grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200' }, [
                this.createElement('div', {}, [
                    this.createElement('label', { className: 'block text-xs font-medium text-slate-500 mb-1' }, ['Rabat (PLN)']),
                    this.createElement('input', {
                        type: 'number',
                        step: '0.01',
                        value: formData.discount,
                        className: 'w-full px-2 py-1 border border-slate-300 rounded text-sm',
                        onchange: (e) => {
                            formData.discount = parseFloat(e.target.value) || 0;
                            renderForm();
                        }
                    })
                ]),
                this.createElement('div', { className: 'text-right' }, [
                    this.createElement('div', { className: 'text-xs font-medium text-slate-500 mb-1' }, ['Koszt Całkowity']),
                    this.createElement('div', { className: 'text-xl font-bold text-slate-900' }, [`${calculateTotal()} PLN`])
                ])
            ]);
            container.appendChild(row2);

            // 5. Admin Notes
            const notesDiv = this.createElement('div', { className: 'mt-4' }, [
                this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, ['Notatki Administratora']),
                this.createElement('textarea', {
                    className: 'w-full px-3 py-2 border border-slate-300 rounded-md h-24 text-sm',
                    onchange: (e) => formData.admin_notes = e.target.value
                }, [formData.admin_notes])
            ]);
            container.appendChild(notesDiv);
            
            if (window.lucide) window.lucide.createIcons();
        };

        renderForm();

        Modal.show({
            title: `Edycja Zgłoszenia #${req.id}`,
            content: [container],
            onConfirm: async () => {
                try {
                    const payload = {
                        ...formData,
                        total_cost: parseFloat(calculateTotal())
                    };
                    await API.put(`/api/admin/service-requests/${req.id}`, payload);
                    this.loadRequests();
                    Modal.close();
                } catch (error) {
                    alert('Błąd podczas edycji zgłoszenia: ' + (error.message || 'Nieznany błąd'));
                }
            }
        });
    }

    createDetailRow(label, value) {
        return this.createElement('div', { className: 'grid grid-cols-3 gap-4 py-1' }, [
            this.createElement('div', { className: 'text-slate-500 text-sm' }, [label]),
            this.createElement('div', { className: 'col-span-2 text-slate-900 font-medium' }, [value || '-'])
        ]);
    }

    async updateStatus(id, newStatus) {
        try {
            await API.request(`/api/admin/service-requests/${id}/status`, 'PATCH', { status: newStatus });
            // Update local state
            const req = this.state.requests.find(r => r.id === id);
            if (req) req.status = newStatus;
            this.refresh();
        } catch (err) {
            alert('Błąd aktualizacji statusu: ' + err.message);
        }
    }

    async updateAdminNotes(id, notes) {
        try {
            await API.request(`/api/admin/service-requests/${id}`, 'PATCH', { admin_notes: notes });
            // Update local state
            const req = this.state.requests.find(r => r.id === id);
            if (req) req.admin_notes = notes;
        } catch (err) {
            console.error('Failed to save notes', err);
        }
    }

    render() {
        return new AdminLayout({
            title: 'Zarządzanie Zgłoszeniami',
            contentComponent: this.renderContent()
        }).render();
    }
}