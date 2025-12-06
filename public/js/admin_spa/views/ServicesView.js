import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class ServicesView extends Component {
    constructor() {
        super();
        this.state = {
            services: [],
            loading: true
        };
        this.loadServices();
    }

    async loadServices() {
        try {
            const data = await API.get('/api/services');
            this.state.services = data;
            this.state.loading = false;
            this.refresh();
        } catch (error) {
            console.error('Failed to load services', error);
            this.state.loading = false;
        }
    }

    refresh() {
        const tableBody = document.getElementById('services-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';
            this.renderTableRows().forEach(row => tableBody.appendChild(row));
            if (window.lucide) window.lucide.createIcons();
        }
    }

    renderTableRows() {
        if (this.state.loading) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 4, className: 'p-4 text-center' }, ['Ładowanie...'])
            ])];
        }

        return this.state.services.map(service => 
            this.createElement('tr', { className: 'border-b hover:bg-slate-50' }, [
                this.createElement('td', { className: 'p-4 font-medium' }, [service.name]),
                this.createElement('td', { className: 'p-4' }, [service.category || 'Ogólne']),
                this.createElement('td', { className: 'p-4 font-bold text-slate-700' }, [`${service.price} PLN`]),
                this.createElement('td', { className: 'p-4 flex gap-2' }, [
                    this.createElement('button', { 
                        className: 'text-blue-600 hover:text-blue-800',
                        onclick: () => this.openEditModal(service)
                    }, ['Edytuj']),
                    this.createElement('button', { 
                        className: 'text-red-600 hover:text-red-800',
                        onclick: () => this.deleteService(service.id)
                    }, ['Usuń'])
                ])
            ])
        );
    }

    renderContent() {
        return this.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-slate-200' }, [
            // Toolbar
            this.createElement('div', { className: 'p-4 border-b border-slate-200 flex justify-between items-center' }, [
                this.createElement('h3', { className: 'font-semibold text-lg' }, ['Cennik Usług']),
                this.createElement('button', { 
                    className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2',
                    onclick: () => this.openAddModal()
                }, [
                    this.createElement('i', { 'data-lucide': 'plus', className: 'w-4 h-4' }),
                    'Dodaj Usługę'
                ])
            ]),
            // Table
            this.createElement('div', { className: 'overflow-x-auto' }, [
                this.createElement('table', { className: 'w-full text-left text-sm' }, [
                    this.createElement('thead', { className: 'bg-slate-50 text-slate-600 uppercase text-xs' }, [
                        this.createElement('tr', {}, [
                            this.createElement('th', { className: 'p-4' }, ['Nazwa Usługi']),
                            this.createElement('th', { className: 'p-4' }, ['Kategoria']),
                            this.createElement('th', { className: 'p-4' }, ['Cena']),
                            this.createElement('th', { className: 'p-4' }, ['Akcje'])
                        ])
                    ]),
                    this.createElement('tbody', { id: 'services-table-body' }, this.renderTableRows())
                ])
            ])
        ]);
    }

    createInput(label, type, value, onChange) {
        return this.createElement('div', {}, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, [label]),
            this.createElement('input', { 
                type: type, 
                value: value || '',
                className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                oninput: (e) => onChange(e.target.value)
            })
        ]);
    }

    createSelect(label, options, value, onChange) {
        return this.createElement('div', {}, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, [label]),
            this.createElement('select', { 
                className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                onchange: (e) => onChange(e.target.value)
            }, options.map(opt => 
                this.createElement('option', { value: opt.value, selected: opt.value === value ? 'selected' : undefined }, [opt.label])
            ))
        ]);
    }

    openAddModal() {
        const newService = { name: '', category: 'primary', price: '', slug: '' };
        
        const modal = new Modal({
            title: 'Dodaj Nową Usługę',
            content: [
                this.createInput('Nazwa Usługi', 'text', '', v => {
                    newService.name = v;
                    // Auto-generate slug
                    newService.slug = v.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                }),
                this.createSelect('Kategoria', [
                    { value: 'primary', label: 'Usługi Główne' },
                    { value: 'additional', label: 'Usługi Dodatkowe' }
                ], 'primary', v => newService.category = v),
                this.createInput('Cena (PLN)', 'number', '', v => newService.price = parseFloat(v))
            ],
            onConfirm: async () => {
                try {
                    await API.post('/api/admin/services', newService);
                    modal.close();
                    this.loadServices();
                } catch (err) {
                    alert('Błąd dodawania usługi: ' + err.message);
                }
            }
        });
        modal.mount();
    }

    openEditModal(service) {
        const editedService = { ...service };
        
        const modal = new Modal({
            title: 'Edytuj Usługę',
            content: [
                this.createInput('Nazwa Usługi', 'text', editedService.name, v => editedService.name = v),
                this.createSelect('Kategoria', [
                    { value: 'primary', label: 'Usługi Główne' },
                    { value: 'additional', label: 'Usługi Dodatkowe' }
                ], editedService.category, v => editedService.category = v),
                this.createInput('Cena (PLN)', 'number', editedService.price, v => editedService.price = parseFloat(v))
            ],
            onConfirm: async () => {
                try {
                    await API.put(`/api/admin/services/${service.id}`, editedService);
                    modal.close();
                    this.loadServices();
                } catch (err) {
                    alert('Błąd edycji usługi: ' + err.message);
                }
            }
        });
        modal.mount();
    }

    async deleteService(id) {
        if (confirm('Czy na pewno chcesz usunąć tę usługę?')) {
            try {
                await API.delete(`/api/admin/services/${id}`);
                this.loadServices();
            } catch (err) {
                alert('Błąd usuwania: ' + err.message);
            }
        }
    }

    render() {
        return new AdminLayout({
            title: 'Zarządzanie Usługami',
            contentComponent: this.renderContent()
        }).render();
    }
}