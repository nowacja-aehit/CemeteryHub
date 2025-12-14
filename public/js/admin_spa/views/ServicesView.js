import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class ServicesView extends Component {
    constructor() {
        super();
        this.state = {
            services: [],
            categories: [],
            loading: true
        };
        this.loadData();
    }

    async loadData() {
        try {
            const [services, categories] = await Promise.all([
                API.get('/api/services'),
                API.get('/api/categories')
            ]);
            this.state.services = services;
            this.state.categories = categories;
            this.state.loading = false;
            this.refresh();
        } catch (error) {
            console.error('Failed to load data', error);
            this.state.loading = false;
        }
    }

    loadServices() {
        this.loadData();
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
                this.createElement('div', { className: 'flex gap-2' }, [
                    this.createElement('button', { 
                        className: 'bg-slate-100 text-slate-700 px-4 py-2 rounded hover:bg-slate-200 flex items-center gap-2',
                        onclick: () => this.openCategoriesModal()
                    }, [
                        this.createElement('i', { 'data-lucide': 'list', className: 'w-4 h-4' }),
                        'Kategorie'
                    ]),
                    this.createElement('button', { 
                        className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2',
                        onclick: () => this.openAddModal()
                    }, [
                        this.createElement('i', { 'data-lucide': 'plus', className: 'w-4 h-4' }),
                        'Dodaj Usługę'
                    ])
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
        const newService = { name: '', category: this.state.categories[0]?.name || '', price: '', slug: '' };
        
        const categoryOptions = this.state.categories.map(c => ({ value: c.name, label: c.name }));
        if (categoryOptions.length === 0) {
            categoryOptions.push({ value: '', label: 'Brak kategorii - dodaj najpierw kategorię' });
        }

        const modal = new Modal({
            title: 'Dodaj Nową Usługę',
            content: [
                this.createInput('Nazwa Usługi', 'text', '', v => {
                    newService.name = v;
                    // Auto-generate slug
                    newService.slug = v.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                }),
                this.createSelect('Kategoria', categoryOptions, newService.category, v => newService.category = v),
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
        
        const categoryOptions = this.state.categories.map(c => ({ value: c.name, label: c.name }));
        // Ensure current category is in options even if deleted (optional, but good for UX)
        if (editedService.category && !categoryOptions.find(c => c.value === editedService.category)) {
            categoryOptions.push({ value: editedService.category, label: editedService.category });
        }

        const modal = new Modal({
            title: 'Edytuj Usługę',
            content: [
                this.createInput('Nazwa Usługi', 'text', editedService.name, v => editedService.name = v),
                this.createSelect('Kategoria', categoryOptions, editedService.category, v => editedService.category = v),
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

    openCategoriesModal() {
        const renderCategoriesList = () => {
            const container = this.createElement('div', { className: 'space-y-4 mt-4' });

            const mainCategories = [
                { name: 'Usługi podstawowe', parent_id: null },
                { name: 'Usługi dodatkowe', parent_id: null }
            ];

            mainCategories.forEach(mainCat => {
                const subCategories = this.state.categories.filter(c => c.parent_id === mainCat.name);

                const categorySection = this.createElement('div', { className: 'p-3 rounded-lg border border-slate-200 bg-slate-50' }, [
                    this.createElement('h4', { className: 'font-semibold text-slate-800 mb-2' }, [mainCat.name]),
                    this.createElement('div', { className: 'space-y-2' }, 
                        subCategories.length > 0 
                            ? subCategories.map(cat => this.createCategoryItem(cat))
                            : [this.createElement('p', { className: 'text-sm text-slate-500 italic' }, ['Brak podkategorii'])]
                    )
                ]);
                container.appendChild(categorySection);
            });
            
            return container;
        };

        let newCategoryName = '';
        let selectedMainCategory = 'Usługi podstawowe';

        const inputContainer = this.createElement('div', { className: 'flex flex-col sm:flex-row gap-2' }, [
            this.createElement('input', {
                type: 'text',
                placeholder: 'Nazwa nowej podkategorii...',
                className: 'flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm',
                oninput: (e) => newCategoryName = e.target.value
            }),
            this.createSelect('', [
                { value: 'Usługi podstawowe', label: 'Do: Usługi podstawowe' },
                { value: 'Usługi dodatkowe', label: 'Do: Usługi dodatkowe' }
            ], selectedMainCategory, v => selectedMainCategory = v),
            this.createElement('button', {
                className: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm flex-shrink-0',
                onclick: () => this.addCategory(newCategoryName, selectedMainCategory, modal, inputContainer)
            }, ['Dodaj'])
        ]);

        const modal = new Modal({
            title: 'Zarządzanie Kategoriami',
            content: [
                this.createElement('p', { className: 'text-sm text-slate-600 mb-4' }, [
                    'Zarządzaj podkategoriami dla głównych grup usług. Kategorie główne są stałe.'
                ]),
                inputContainer,
                renderCategoriesList()
            ],
            confirmText: 'Zamknij',
            onConfirm: () => modal.close()
        });
        modal.mount();
        if (window.lucide) window.lucide.createIcons();
    }

    createCategoryItem(cat) {
        const item = this.createElement('div', { className: 'flex justify-between items-center bg-white p-2 rounded border border-slate-300' }, [
            this.createElement('span', { className: 'text-sm font-medium text-slate-700' }, [cat.name]),
            this.createElement('button', { 
                className: 'text-red-500 hover:text-red-700 p-1',
                onclick: () => this.deleteCategory(cat.id)
            }, [
                this.createElement('i', { 'data-lucide': 'trash-2', className: 'w-4 h-4' })
            ])
        ]);
        return item;
    }

    async addCategory(name, parent, modal, inputContainer) {
        if (!name.trim()) return;
        try {
            await API.post('/api/admin/categories', { name, parent_id: parent });
            await this.loadData();
            
            const newList = modal.element.querySelector('.space-y-4.mt-4');
            if (newList) {
                // Re-render categories list
                const freshList = this.openCategoriesModal.toString().match(/renderCategoriesList\s*=\s*\(\)\s*=>\s*({[\s\S]*?});/)[1];
                const newRenderedList = eval(`(${freshList})`)();
                newList.innerHTML = newRenderedList.innerHTML;
            }
            if (window.lucide) window.lucide.createIcons();
            
            inputContainer.querySelector('input').value = '';
        } catch (err) {
            alert('Błąd dodawania kategorii: ' + err.message);
        }
    }

    async deleteCategory(id) {
        if (!confirm('Czy na pewno chcesz usunąć tę kategorię? Usługi w tej kategorii zostaną bez kategorii.')) return;
        try {
            await API.delete(`/api/admin/categories/${id}`);
            await this.loadData(); // Reload all data
            // This is a bit of a hack. Ideally the modal should have its own state management.
            // For now, we rely on the main component's state.
            // A full re-render of the modal content is the simplest way.
            const modalElement = document.querySelector('.modal-container');
            if (modalElement) {
                const modalInstance = Modal.activeInstances[Modal.activeInstances.length - 1];
                if (modalInstance) {
                    modalInstance.close();
                    this.openCategoriesModal();
                }
            }
        } catch (err) {
            alert('Błąd usuwania kategorii: ' + err.message);
        }
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