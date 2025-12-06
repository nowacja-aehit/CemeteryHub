import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class FAQView extends Component {
    constructor() {
        super();
        this.state = {
            faqs: [],
            loading: true
        };
        this.loadFAQs();
    }

    async loadFAQs() {
        try {
            const data = await API.get('/api/faqs');
            // Sort by display_order
            this.state.faqs = data.sort((a, b) => a.display_order - b.display_order);
            this.state.loading = false;
            this.refresh();
        } catch (error) {
            console.error('Failed to load FAQs', error);
            this.state.loading = false;
        }
    }

    refresh() {
        const tableBody = document.getElementById('faq-table-body');
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

        if (this.state.faqs.length === 0) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 4, className: 'p-4 text-center text-slate-500' }, ['Brak pytań FAQ'])
            ])];
        }

        return this.state.faqs.map(faq => 
            this.createElement('tr', { className: 'border-b hover:bg-slate-50' }, [
                this.createElement('td', { className: 'p-4 text-center' }, [faq.display_order || 0]),
                this.createElement('td', { className: 'p-4 font-medium' }, [faq.question]),
                this.createElement('td', { className: 'p-4 truncate max-w-xs' }, [faq.answer]),
                this.createElement('td', { className: 'p-4 flex gap-2' }, [
                    this.createElement('button', { 
                        className: 'text-blue-600 hover:text-blue-800',
                        onclick: () => this.openEditModal(faq)
                    }, ['Edytuj']),
                    this.createElement('button', { 
                        className: 'text-red-600 hover:text-red-800',
                        onclick: () => this.deleteFAQ(faq.id)
                    }, ['Usuń'])
                ])
            ])
        );
    }

    renderContent() {
        return this.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-slate-200' }, [
            // Toolbar
            this.createElement('div', { className: 'p-4 border-b border-slate-200 flex justify-between items-center' }, [
                this.createElement('h3', { className: 'font-semibold text-lg' }, ['Zarządzanie FAQ']),
                this.createElement('button', { 
                    className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2',
                    onclick: () => this.openAddModal()
                }, [
                    this.createElement('i', { 'data-lucide': 'plus', className: 'w-4 h-4' }),
                    'Dodaj Pytanie'
                ])
            ]),
            // Table
            this.createElement('div', { className: 'overflow-x-auto' }, [
                this.createElement('table', { className: 'w-full text-left text-sm' }, [
                    this.createElement('thead', { className: 'bg-slate-50 text-slate-600 uppercase text-xs' }, [
                        this.createElement('tr', {}, [
                            this.createElement('th', { className: 'p-4 w-20 text-center' }, ['Kolejność']),
                            this.createElement('th', { className: 'p-4' }, ['Pytanie']),
                            this.createElement('th', { className: 'p-4' }, ['Odpowiedź']),
                            this.createElement('th', { className: 'p-4 w-32' }, ['Akcje'])
                        ])
                    ]),
                    this.createElement('tbody', { id: 'faq-table-body' }, this.renderTableRows())
                ])
            ])
        ]);
    }

    createInput(label, type, value, onChange, isTextarea = false) {
        return this.createElement('div', {}, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, [label]),
            this.createElement(isTextarea ? 'textarea' : 'input', { 
                type: isTextarea ? undefined : type,
                value: value || '',
                className: `w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isTextarea ? 'h-32' : ''}`,
                oninput: (e) => onChange(e.target.value)
            })
        ]);
    }

    openAddModal() {
        const newFAQ = { question: '', answer: '', display_order: 0 };
        
        const modal = new Modal({
            title: 'Dodaj Pytanie FAQ',
            content: [
                this.createInput('Pytanie', 'text', '', v => newFAQ.question = v),
                this.createInput('Kolejność wyświetlania', 'number', '0', v => newFAQ.display_order = parseInt(v)),
                this.createInput('Odpowiedź', 'text', '', v => newFAQ.answer = v, true)
            ],
            onConfirm: async () => {
                try {
                    await API.post('/api/admin/faqs', newFAQ);
                    modal.close();
                    this.loadFAQs();
                } catch (err) {
                    alert('Błąd dodawania FAQ: ' + err.message);
                }
            }
        });
        modal.mount();
    }

    openEditModal(faq) {
        const editedFAQ = { ...faq };
        
        const modal = new Modal({
            title: 'Edytuj Pytanie FAQ',
            content: [
                this.createInput('Pytanie', 'text', editedFAQ.question, v => editedFAQ.question = v),
                this.createInput('Kolejność wyświetlania', 'number', editedFAQ.display_order, v => editedFAQ.display_order = parseInt(v)),
                this.createInput('Odpowiedź', 'text', editedFAQ.answer, v => editedFAQ.answer = v, true)
            ],
            onConfirm: async () => {
                try {
                    await API.put(`/api/admin/faqs/${faq.id}`, editedFAQ);
                    modal.close();
                    this.loadFAQs();
                } catch (err) {
                    alert('Błąd edycji FAQ: ' + err.message);
                }
            }
        });
        modal.mount();
    }

    async deleteFAQ(id) {
        if (confirm('Czy na pewno chcesz usunąć to pytanie?')) {
            try {
                await API.delete(`/api/admin/faqs/${id}`);
                this.loadFAQs();
            } catch (err) {
                alert('Błąd usuwania: ' + err.message);
            }
        }
    }

    render() {
        return new AdminLayout({
            title: 'Zarządzanie FAQ',
            contentComponent: this.renderContent()
        }).render();
    }
}