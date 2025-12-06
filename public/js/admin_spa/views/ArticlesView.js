import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class ArticlesView extends Component {
    constructor() {
        super();
        this.state = {
            articles: [],
            categories: [],
            loading: true
        };
        this.loadData();
    }

    async loadData() {
        try {
            const [articles, categories] = await Promise.all([
                API.get('/api/admin/articles'),
                API.get('/api/categories')
            ]);
            this.state.articles = articles;
            this.state.categories = categories;
            this.state.loading = false;
            this.refresh();
        } catch (error) {
            console.error('Failed to load data', error);
            this.state.loading = false;
        }
    }

    refresh() {
        const tableBody = document.getElementById('articles-table-body');
        if (tableBody) {
            tableBody.innerHTML = '';
            this.renderTableRows().forEach(row => tableBody.appendChild(row));
            if (window.lucide) window.lucide.createIcons();
        }
    }

    renderTableRows() {
        if (this.state.loading) {
            return [this.createElement('tr', {}, [
                this.createElement('td', { colSpan: 6, className: 'p-4 text-center' }, ['Ładowanie...'])
            ])];
        }

        return this.state.articles.map(article => 
            this.createElement('tr', { className: 'border-b hover:bg-slate-50' }, [
                this.createElement('td', { className: 'p-4 font-medium' }, [article.title]),
                this.createElement('td', { className: 'p-4' }, [article.category || '-']),
                this.createElement('td', { className: 'p-4' }, [article.date || '-']),
                this.createElement('td', { className: 'p-4' }, [article.readTime ? `${article.readTime} min` : '-']),
                this.createElement('td', { className: 'p-4' }, [
                    this.createElement('span', { 
                        className: `px-2 py-1 rounded text-xs ${article.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`
                    }, [article.isVisible ? 'Widoczny' : 'Ukryty'])
                ]),
                this.createElement('td', { className: 'p-4 flex gap-2' }, [
                    this.createElement('button', { 
                        className: 'text-blue-600 hover:text-blue-800',
                        onclick: () => this.openEditModal(article)
                    }, ['Edytuj']),
                    this.createElement('button', { 
                        className: 'text-red-600 hover:text-red-800',
                        onclick: () => this.deleteArticle(article.id)
                    }, ['Usuń'])
                ])
            ])
        );
    }

    renderContent() {
        return this.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-slate-200' }, [
            // Toolbar
            this.createElement('div', { className: 'p-4 border-b border-slate-200 flex justify-between items-center' }, [
                this.createElement('h3', { className: 'font-semibold text-lg' }, ['Lista Artykułów']),
                this.createElement('div', { className: 'flex gap-2' }, [
                    this.createElement('button', { 
                        className: 'bg-slate-100 text-slate-700 px-4 py-2 rounded hover:bg-slate-200 flex items-center gap-2',
                        onclick: () => this.openCategoriesModal()
                    }, ['Zarządzaj Kategoriami']),
                    this.createElement('button', { 
                        className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2',
                        onclick: () => this.openAddModal()
                    }, [
                        this.createElement('i', { 'data-lucide': 'plus', className: 'w-4 h-4' }),
                        'Dodaj Artykuł'
                    ])
                ])
            ]),
            // Table
            this.createElement('div', { className: 'overflow-x-auto' }, [
                this.createElement('table', { className: 'w-full text-left text-sm' }, [
                    this.createElement('thead', { className: 'bg-slate-50 text-slate-600 uppercase text-xs' }, [
                        this.createElement('tr', {}, [
                            this.createElement('th', { className: 'p-4' }, ['Tytuł']),
                            this.createElement('th', { className: 'p-4' }, ['Kategoria']),
                            this.createElement('th', { className: 'p-4' }, ['Data']),
                            this.createElement('th', { className: 'p-4' }, ['Czas czytania']),
                            this.createElement('th', { className: 'p-4' }, ['Status']),
                            this.createElement('th', { className: 'p-4' }, ['Akcje'])
                        ])
                    ]),
                    this.createElement('tbody', { id: 'articles-table-body' }, this.renderTableRows())
                ])
            ])
        ]);
    }

    createInput(label, type, value, onChange, isTextarea = false) {
        return this.createElement('div', { className: 'mb-4' }, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, [label]),
            this.createElement(isTextarea ? 'textarea' : 'input', { 
                type: isTextarea ? undefined : type,
                value: value || '',
                className: `w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isTextarea ? 'h-32' : ''}`,
                oninput: (e) => onChange(e.target.value)
            })
        ]);
    }

    createSelect(label, options, value, onChange) {
        return this.createElement('div', { className: 'mb-4' }, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, [label]),
            this.createElement('select', { 
                className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                onchange: (e) => onChange(e.target.value)
            }, [
                this.createElement('option', { value: '' }, ['-- Wybierz kategorię --']),
                ...options.map(opt => 
                    this.createElement('option', { value: opt.name, selected: opt.name === value ? 'selected' : undefined }, [opt.name])
                )
            ])
        ]);
    }

    createCheckbox(label, checked, onChange) {
        return this.createElement('div', { className: 'mb-4 flex items-center' }, [
            this.createElement('input', { 
                type: 'checkbox',
                checked: checked ? 'checked' : undefined,
                className: 'w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500',
                onchange: (e) => onChange(e.target.checked)
            }),
            this.createElement('label', { className: 'ml-2 block text-sm text-slate-900' }, [label])
        ]);
    }

    openCategoriesModal() {
        const renderCategoriesList = () => {
            return this.createElement('div', { className: 'space-y-2 mb-4' }, 
                this.state.categories.map(cat => 
                    this.createElement('div', { className: 'flex justify-between items-center p-2 bg-slate-50 rounded' }, [
                        this.createElement('span', {}, [cat.name]),
                        this.createElement('button', { 
                            className: 'text-red-600 hover:text-red-800 text-sm',
                            onclick: async () => {
                                if(confirm(`Usunąć kategorię ${cat.name}?`)) {
                                    await API.delete(`/api/admin/categories/${cat.id}`);
                                    this.state.categories = await API.get('/api/categories');
                                    modal.close();
                                    this.openCategoriesModal();
                                }
                            }
                        }, ['Usuń'])
                    ])
                )
            );
        };

        let newCategoryName = '';

        const modal = new Modal({
            title: 'Zarządzaj Kategoriami',
            content: [
                renderCategoriesList(),
                this.createElement('div', { className: 'flex gap-2 mt-4 border-t pt-4' }, [
                    this.createElement('input', { 
                        type: 'text', 
                        placeholder: 'Nowa kategoria...',
                        className: 'flex-1 px-3 py-2 border border-slate-300 rounded-md',
                        oninput: (e) => newCategoryName = e.target.value
                    }),
                    this.createElement('button', { 
                        className: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700',
                        onclick: async () => {
                            if (!newCategoryName) return;
                            await API.post('/api/admin/categories', { name: newCategoryName });
                            this.state.categories = await API.get('/api/categories');
                            modal.close();
                            this.openCategoriesModal();
                        }
                    }, ['Dodaj'])
                ])
            ],
            confirmText: 'Zamknij',
            onConfirm: () => modal.close()
        });
        modal.mount();
    }

    openAddModal() {
        const newArticle = { 
            title: '', 
            category: '', 
            content: '', 
            readTime: '', 
            date: new Date().toISOString().split('T')[0],
            isVisible: true 
        };
        
        const modal = new Modal({
            title: 'Dodaj Nowy Artykuł',
            content: [
                this.createInput('Tytuł', 'text', '', v => newArticle.title = v),
                this.createSelect('Kategoria', this.state.categories, '', v => newArticle.category = v),
                this.createInput('Data', 'date', newArticle.date, v => newArticle.date = v),
                this.createInput('Czas czytania (min)', 'number', '', v => newArticle.readTime = v),
                this.createCheckbox('Widoczny na stronie', true, v => newArticle.isVisible = v),
                this.createInput('Treść', 'text', '', v => newArticle.content = v, true)
            ],
            onConfirm: async () => {
                try {
                    await API.post('/api/admin/articles', newArticle);
                    modal.close();
                    this.loadData();
                } catch (err) {
                    alert('Błąd dodawania artykułu: ' + err.message);
                }
            }
        });
        modal.mount();
    }

    openEditModal(article) {
        const editedArticle = { ...article };
        
        const modal = new Modal({
            title: 'Edytuj Artykuł',
            content: [
                this.createInput('Tytuł', 'text', editedArticle.title, v => editedArticle.title = v),
                this.createSelect('Kategoria', this.state.categories, editedArticle.category, v => editedArticle.category = v),
                this.createInput('Data', 'date', editedArticle.date, v => editedArticle.date = v),
                this.createInput('Czas czytania (min)', 'number', editedArticle.readTime, v => editedArticle.readTime = v),
                this.createCheckbox('Widoczny na stronie', editedArticle.isVisible, v => editedArticle.isVisible = v),
                this.createInput('Treść', 'text', editedArticle.content, v => editedArticle.content = v, true)
            ],
            onConfirm: async () => {
                try {
                    await API.put(`/api/admin/articles/${article.id}`, editedArticle);
                    modal.close();
                    this.loadData();
                } catch (err) {
                    alert('Błąd edycji artykułu: ' + err.message);
                }
            }
        });
        modal.mount();
    }

    async deleteArticle(id) {
        if (confirm('Czy na pewno chcesz usunąć ten artykuł?')) {
            try {
                await API.delete(`/api/admin/articles/${id}`);
                this.loadData();
            } catch (err) {
                alert('Błąd usuwania: ' + err.message);
            }
        }
    }

    render() {
        return new AdminLayout({
            title: 'Zarządzanie Artykułami',
            contentComponent: this.renderContent()
        }).render();
    }
}