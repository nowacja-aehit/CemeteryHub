import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class GravesView extends Component {
    constructor() {
        super();
        this.state = {
            graves: [],
            sections: [],
            loading: true,
            activeTab: 'graves', // 'graves', 'sections', 'map'
            searchTerm: '',
            mapSelectedSection: null
        };
        this.loadData();
    }

    async loadData() {
        try {
            const [graves, sections] = await Promise.all([
                API.get('/api/admin/graves'),
                API.get('/api/sections')
            ]);
            this.state.graves = graves;
            this.state.sections = sections;
            this.state.loading = false;
            this.refresh();
        } catch (error) {
            console.error('Failed to load data', error);
            this.state.loading = false;
        }
    }

    refresh() {
        const container = document.getElementById('graves-view-content');
        if (container) {
            container.innerHTML = '';
            container.appendChild(this.renderTabsContent());
            if (window.lucide) window.lucide.createIcons();
        }
    }

    // --- Tabs ---

    renderTabsContent() {
        if (this.state.loading) {
            return this.createElement('div', { className: 'p-8 text-center text-slate-500' }, ['Ładowanie danych...']);
        }

        switch (this.state.activeTab) {
            case 'graves': return this.renderGravesTab();
            case 'sections': return this.renderSectionsTab();
            case 'map': return this.renderMapTab();
            default: return this.renderGravesTab();
        }
    }

    switchTab(tab) {
        this.state.activeTab = tab;
        this.refresh();
        
        // Update tab buttons styles
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('border-blue-600', 'text-blue-600');
                btn.classList.remove('border-transparent', 'text-slate-500');
            } else {
                btn.classList.remove('border-blue-600', 'text-blue-600');
                btn.classList.add('border-transparent', 'text-slate-500');
            }
        });
    }

    // --- Map Logic ---

    renderMapTab() {
        const sectionOptions = [
            { value: '', label: '-- Wybierz sekcję --' },
            ...this.state.sections.map(s => ({ value: s.name, label: s.name }))
        ];

        return this.createElement('div', { className: 'space-y-4' }, [
            // Controls
            this.createElement('div', { className: 'bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4' }, [
                this.createElement('div', { className: 'w-64' }, [
                    this.createSelect('Wybierz Sekcję', this.state.mapSelectedSection || '', sectionOptions, (val) => {
                        this.state.mapSelectedSection = val;
                        this.refresh();
                    })
                ]),
                this.createElement('div', { className: 'flex-1 flex items-end gap-4 text-sm text-slate-600' }, [
                    this.createElement('div', { className: 'flex items-center gap-2' }, [
                        this.createElement('div', { className: 'w-4 h-4 border rounded bg-white' }), 'Wolne'
                    ]),
                    this.createElement('div', { className: 'flex items-center gap-2' }, [
                        this.createElement('div', { className: 'w-4 h-4 border rounded bg-red-100 border-red-200' }), 'Zajęte'
                    ])
                ])
            ]),

            // Map Container
            this.createElement('div', { className: 'bg-white p-6 rounded-lg shadow-sm border border-slate-200 min-h-[400px]' }, [
                this.renderInteractiveMap()
            ])
        ]);
    }

    renderInteractiveMap() {
        if (!this.state.mapSelectedSection) {
            return this.createElement('div', { className: 'h-full flex items-center justify-center text-slate-400' }, [
                'Wybierz sekcję, aby wyświetlić mapę'
            ]);
        }

        const section = this.state.sections.find(s => s.name === this.state.mapSelectedSection);
        if (!section) return this.createElement('div', {}, ['Sekcja nie istnieje']);

        const rows = section.rows || 10;
        const cols = section.cols || 10;
        const sectionGraves = this.state.graves.filter(g => g.section === section.name);

        // Wrapper for scrolling
        const mapWrapper = this.createElement('div', { className: 'overflow-x-auto pb-4' });

        // Grid with fixed minimum width cells
        const grid = this.createElement('div', { 
            className: 'grid gap-2 mx-auto',
            style: `grid-template-columns: repeat(${cols}, 100px); width: max-content;` 
        });

        for (let r = 1; r <= rows; r++) {
            for (let c = 1; c <= cols; c++) {
                const grave = sectionGraves.find(g => g.row == r && g.plot == c);
                const isOccupied = !!grave;
                
                let bgClass = 'bg-white border-slate-300 hover:bg-blue-50 cursor-pointer hover:scale-105 transition-transform';
                if (isOccupied) bgClass = 'bg-red-100 border-red-200 hover:bg-red-200 cursor-pointer';

                const cell = this.createElement('div', {
                    className: `aspect-square border rounded-lg flex flex-col items-center justify-center text-xs p-1 relative group ${bgClass}`,
                    onclick: () => {
                        if (isOccupied) {
                            this.openEditGraveModal(grave);
                        } else {
                            this.openAddGraveModal({ section: section.name, row: r, plot: c });
                        }
                    }
                }, [
                    this.createElement('span', { className: 'font-bold text-slate-400 mb-1 text-[10px]' }, [`${r}-${c}`]),
                    isOccupied ? this.createElement('span', { 
                        className: 'text-[11px] text-center leading-tight font-medium text-slate-900 w-full break-words line-clamp-3 px-1' 
                    }, [grave.name]) : null,
                    // Tooltip
                    this.createElement('div', { 
                        className: 'absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs p-2 rounded z-10 whitespace-nowrap shadow-lg'
                    }, [
                        isOccupied ? `${grave.name} (R:${r}, M:${c})` : `Wolne miejsce (R:${r}, M:${c})`
                    ])
                ]);
                grid.appendChild(cell);
            }
        }

        mapWrapper.appendChild(grid);
        return mapWrapper;
    }

    // --- Graves Logic ---

    getFilteredGraves() {
        if (!this.state.searchTerm) return this.state.graves;
        const term = this.state.searchTerm.toLowerCase();
        return this.state.graves.filter(g => 
            g.name.toLowerCase().includes(term) || 
            (g.section && g.section.toLowerCase().includes(term))
        );
    }

    renderGravesTab() {
        const filteredGraves = this.getFilteredGraves();

        return this.createElement('div', { className: 'space-y-4' }, [
            // Actions Bar
            this.createElement('div', { className: 'flex justify-between items-center gap-4' }, [
                this.createElement('div', { className: 'relative flex-1 max-w-md' }, [
                    this.createElement('input', {
                        type: 'text',
                        placeholder: 'Szukaj grobu...',
                        className: 'w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                        value: this.state.searchTerm,
                        oninput: (e) => {
                            this.state.searchTerm = e.target.value;
                            this.refresh();
                        }
                    }),
                    this.createElement('i', { 
                        'data-lucide': 'search', 
                        className: 'absolute left-3 top-2.5 w-5 h-5 text-slate-400' 
                    })
                ]),
                this.createElement('button', { 
                    className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors',
                    onclick: () => this.openAddGraveModal()
                }, [
                    this.createElement('i', { 'data-lucide': 'plus', className: 'w-4 h-4' }),
                    'Dodaj Grób'
                ])
            ]),

            // Table
            this.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden' }, [
                this.createElement('div', { className: 'overflow-x-auto' }, [
                    this.createElement('table', { className: 'w-full text-left text-sm' }, [
                        this.createElement('thead', { className: 'bg-slate-50 text-slate-600 uppercase text-xs font-semibold' }, [
                            this.createElement('tr', {}, [
                                this.createElement('th', { className: 'p-4' }, ['Imię i Nazwisko']),
                                this.createElement('th', { className: 'p-4' }, ['Sekcja']),
                                this.createElement('th', { className: 'p-4' }, ['Rząd / Miejsce']),
                                this.createElement('th', { className: 'p-4' }, ['Daty']),
                                this.createElement('th', { className: 'p-4 text-right' }, ['Akcje'])
                            ])
                        ]),
                        this.createElement('tbody', {}, filteredGraves.length > 0 ? filteredGraves.map(grave => 
                            this.createElement('tr', { className: 'border-b border-slate-100 hover:bg-slate-50 last:border-0 transition-colors' }, [
                                this.createElement('td', { className: 'p-4 font-medium text-slate-900' }, [grave.name]),
                                this.createElement('td', { className: 'p-4' }, [
                                    this.createElement('span', { className: 'px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600' }, [grave.section || '-'])
                                ]),
                                this.createElement('td', { className: 'p-4 text-slate-600' }, [`R: ${grave.row || '-'} / M: ${grave.plot || '-'}`]),
                                this.createElement('td', { className: 'p-4 text-slate-600' }, [
                                    this.createElement('div', { className: 'text-xs' }, [`Ur. ${grave.birthDate || '-'}`]),
                                    this.createElement('div', { className: 'text-xs' }, [`Zm. ${grave.deathDate || '-'}`])
                                ]),
                                this.createElement('td', { className: 'p-4 flex justify-end gap-2' }, [
                                    this.createElement('button', { 
                                        className: 'p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-1',
                                        title: 'Edytuj',
                                        onclick: () => this.openEditGraveModal(grave)
                                    }, [
                                        this.createElement('i', { 'data-lucide': 'edit-2', className: 'w-4 h-4' }),
                                        this.createElement('span', { className: 'text-xs font-medium' }, ['Edytuj'])
                                    ]),
                                    this.createElement('button', { 
                                        className: 'p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors flex items-center gap-1',
                                        title: 'Usuń',
                                        onclick: () => this.deleteGrave(grave.id)
                                    }, [
                                        this.createElement('i', { 'data-lucide': 'trash-2', className: 'w-4 h-4' }),
                                        this.createElement('span', { className: 'text-xs font-medium' }, ['Usuń'])
                                    ])
                                ])
                            ])
                        ) : [
                            this.createElement('tr', {}, [
                                this.createElement('td', { colSpan: 5, className: 'p-8 text-center text-slate-500' }, ['Brak wyników'])
                            ])
                        ])
                    ])
                ])
            ])
        ]);
    }

    // --- Sections Logic ---

    renderSectionsTab() {
        return this.createElement('div', { className: 'space-y-4' }, [
            // Actions Bar
            this.createElement('div', { className: 'flex justify-end' }, [
                this.createElement('button', { 
                    className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors',
                    onclick: () => this.openAddSectionModal()
                }, [
                    this.createElement('i', { 'data-lucide': 'plus', className: 'w-4 h-4' }),
                    'Dodaj Sekcję'
                ])
            ]),

            // Grid of Sections
            this.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' }, 
                this.state.sections.map(section => 
                    this.createElement('div', { className: 'bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow' }, [
                        this.createElement('div', { className: 'flex justify-between items-start mb-4' }, [
                            this.createElement('div', {}, [
                                this.createElement('h4', { className: 'text-lg font-bold text-slate-900' }, [section.name]),
                                this.createElement('p', { className: 'text-sm text-slate-500' }, [`${section.rows} rzędów × ${section.cols} miejsc`])
                            ]),
                            this.createElement('div', { className: 'flex gap-2' }, [
                                this.createElement('button', { 
                                    className: 'p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-1',
                                    title: 'Edytuj sekcję',
                                    onclick: () => this.openEditSectionModal(section)
                                }, [
                                    this.createElement('i', { 'data-lucide': 'edit-2', className: 'w-4 h-4' }),
                                    this.createElement('span', { className: 'text-xs font-medium' }, ['Edytuj'])
                                ]),
                                this.createElement('button', { 
                                    className: 'p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors flex items-center gap-1',
                                    title: 'Usuń sekcję',
                                    onclick: () => this.deleteSection(section.id)
                                }, [
                                    this.createElement('i', { 'data-lucide': 'trash-2', className: 'w-4 h-4' }),
                                    this.createElement('span', { className: 'text-xs font-medium' }, ['Usuń'])
                                ])
                            ])
                        ]),
                        this.createElement('p', { className: 'text-sm text-slate-600 mb-4 line-clamp-2' }, [section.description || 'Brak opisu']),
                        this.createElement('div', { className: 'flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded' }, [
                            this.createElement('i', { 'data-lucide': 'info', className: 'w-3 h-3' }),
                            `Pojemność: ${section.rows * section.cols} grobów`
                        ]),
                        this.createElement('button', {
                            className: 'w-full mt-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors text-sm font-medium',
                            onclick: () => {
                                this.state.mapSelectedSection = section.name;
                                this.switchTab('map');
                            }
                        }, [
                            this.createElement('i', { 'data-lucide': 'map', className: 'w-4 h-4' }),
                            'Zarządzaj Mapą'
                        ])
                    ])
                )
            )
        ]);
    }

    // --- Modals ---

    createInput(label, type, value, onChange, options = {}) {
        const wrapper = this.createElement('div', { className: options.className || '' }, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, [label]),
            this.createElement('input', { 
                type: type, 
                value: value || '',
                className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm',
                oninput: (e) => onChange(e.target.value),
                ...options.attrs
            })
        ]);
        return wrapper;
    }

    createSelect(label, value, options, onChange) {
        return this.createElement('div', {}, [
            this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, [label]),
            this.createElement('select', {
                className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm',
                onchange: (e) => onChange(e.target.value)
            }, options.map(opt => 
                this.createElement('option', { value: opt.value, selected: opt.value == value ? 'selected' : undefined }, [opt.label])
            ))
        ]);
    }

    openAddGraveModal(initialData = {}) {
        const newGrave = { 
            name: '', 
            birthDate: '', 
            deathDate: '', 
            section: this.state.sections[0]?.name || '', 
            row: '', 
            plot: '',
            ...initialData 
        };
        
        const sectionOptions = [
            { value: '', label: '-- Wybierz sekcję --' },
            ...this.state.sections.map(s => ({ value: s.name, label: s.name }))
        ];

        // Container for the visual map
        const mapContainer = this.createElement('div', { className: 'mt-4 border rounded p-2 bg-slate-50 min-h-[200px] flex items-center justify-center' });

        const updateMap = () => {
            const section = this.state.sections.find(s => s.name === newGrave.section);
            if (!section) {
                mapContainer.innerHTML = '<div class="text-slate-400">Wybierz sekcję, aby zobaczyć mapę</div>';
                return;
            }

            const rows = section.rows || 10;
            const cols = section.cols || 10;
            const sectionGraves = this.state.graves.filter(g => g.section === section.name);

            let gridHTML = `<div class="grid gap-1" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); width: 100%;">`;
            
            for (let r = 1; r <= rows; r++) {
                for (let c = 1; c <= cols; c++) {
                    const isOccupied = sectionGraves.some(g => g.row == r && g.plot == c);
                    const isSelected = newGrave.row == r && newGrave.plot == c;
                    
                    let bgClass = 'bg-white border-slate-300 hover:bg-blue-50 cursor-pointer';
                    if (isOccupied) bgClass = 'bg-red-100 border-red-200 cursor-not-allowed';
                    if (isSelected) bgClass = 'bg-blue-600 border-blue-700 text-white';

                    gridHTML += `
                        <div 
                            class="aspect-square border rounded flex items-center justify-center text-xs ${bgClass}"
                            title="Rząd ${r}, Miejsce ${c}${isOccupied ? ' (Zajęte)' : ''}"
                            onclick="${!isOccupied ? `document.dispatchEvent(new CustomEvent('select-plot', { detail: { row: ${r}, plot: ${c} } }))` : ''}"
                        >
                            ${r}-${c}
                        </div>
                    `;
                }
            }
            gridHTML += '</div>';
            mapContainer.innerHTML = gridHTML;
        };

        // Listen for selection from map
        const handleSelect = (e) => {
            newGrave.row = e.detail.row;
            newGrave.plot = e.detail.plot;
            // Update inputs
            const rowInput = document.getElementById('input-row');
            const plotInput = document.getElementById('input-plot');
            if (rowInput) rowInput.value = newGrave.row;
            if (plotInput) plotInput.value = newGrave.plot;
            updateMap();
        };
        document.addEventListener('select-plot', handleSelect);

        const modal = new Modal({
            title: 'Dodaj Nowy Grób',
            content: [
                this.createInput('Imię i Nazwisko', 'text', '', v => newGrave.name = v),
                this.createElement('div', { className: 'grid grid-cols-2 gap-4' }, [
                    this.createInput('Data Urodzenia', 'date', '', v => newGrave.birthDate = v),
                    this.createInput('Data Śmierci', 'date', '', v => newGrave.deathDate = v),
                ]),
                this.createElement('hr', { className: 'my-4 border-slate-100' }),
                this.createElement('h4', { className: 'text-sm font-semibold text-slate-900 mb-3' }, ['Lokalizacja']),
                this.createSelect('Sekcja', '', sectionOptions, v => {
                    newGrave.section = v;
                    newGrave.row = '';
                    newGrave.plot = '';
                    updateMap();
                }),
                this.createElement('div', { className: 'grid grid-cols-2 gap-4 mt-3' }, [
                    this.createInput('Rząd', 'number', '', v => { newGrave.row = v; updateMap(); }, { attrs: { id: 'input-row', readonly: true } }),
                    this.createInput('Miejsce', 'number', '', v => { newGrave.plot = v; updateMap(); }, { attrs: { id: 'input-plot', readonly: true } }),
                ]),
                this.createElement('div', { className: 'mt-2 text-xs text-slate-500' }, ['Kliknij na mapie poniżej, aby wybrać miejsce.']),
                mapContainer
            ],
            onClose: () => document.removeEventListener('select-plot', handleSelect),
            onConfirm: async () => {
                if (!newGrave.section || !newGrave.row || !newGrave.plot) {
                    alert('Proszę wybrać lokalizację (Sekcja, Rząd, Miejsce)');
                    return;
                }
                try {
                    await API.post('/api/admin/graves', newGrave);
                    this.loadData();
                    Modal.close();
                } catch (err) {
                    alert('Błąd dodawania grobu: ' + err.message);
                }
            }
        });
        
        modal.mount();
        setTimeout(updateMap, 100); // Initial render
    }

    openEditGraveModal(grave) {
        const editedGrave = { ...grave };
        const sectionOptions = [
            { value: '', label: '-- Wybierz sekcję --' },
            ...this.state.sections.map(s => ({ value: s.name, label: s.name }))
        ];
        
        const mapContainer = this.createElement('div', { className: 'mt-4 border rounded p-2 bg-slate-50 min-h-[200px] flex items-center justify-center' });

        const updateMap = () => {
            const section = this.state.sections.find(s => s.name === editedGrave.section);
            if (!section) {
                mapContainer.innerHTML = '<div class="text-slate-400">Wybierz sekcję, aby zobaczyć mapę</div>';
                return;
            }

            const rows = section.rows || 10;
            const cols = section.cols || 10;
            const sectionGraves = this.state.graves.filter(g => g.section === section.name && g.id !== grave.id); // Exclude current grave

            let gridHTML = `<div class="grid gap-1" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); width: 100%;">`;
            
            for (let r = 1; r <= rows; r++) {
                for (let c = 1; c <= cols; c++) {
                    const isOccupied = sectionGraves.some(g => g.row == r && g.plot == c);
                    const isSelected = editedGrave.row == r && editedGrave.plot == c;
                    
                    let bgClass = 'bg-white border-slate-300 hover:bg-blue-50 cursor-pointer';
                    if (isOccupied) bgClass = 'bg-red-100 border-red-200 cursor-not-allowed';
                    if (isSelected) bgClass = 'bg-blue-600 border-blue-700 text-white';

                    gridHTML += `
                        <div 
                            class="aspect-square border rounded flex items-center justify-center text-xs ${bgClass}"
                            title="Rząd ${r}, Miejsce ${c}${isOccupied ? ' (Zajęte)' : ''}"
                            onclick="${!isOccupied ? `document.dispatchEvent(new CustomEvent('select-plot-edit', { detail: { row: ${r}, plot: ${c} } }))` : ''}"
                        >
                            ${r}-${c}
                        </div>
                    `;
                }
            }
            gridHTML += '</div>';
            mapContainer.innerHTML = gridHTML;
        };

        const handleSelect = (e) => {
            editedGrave.row = e.detail.row;
            editedGrave.plot = e.detail.plot;
            const rowInput = document.getElementById('edit-input-row');
            const plotInput = document.getElementById('edit-input-plot');
            if (rowInput) rowInput.value = editedGrave.row;
            if (plotInput) plotInput.value = editedGrave.plot;
            updateMap();
        };
        document.addEventListener('select-plot-edit', handleSelect);

        const modal = new Modal({
            title: 'Edytuj Grób',
            content: [
                this.createInput('Imię i Nazwisko', 'text', editedGrave.name, v => editedGrave.name = v),
                this.createElement('div', { className: 'grid grid-cols-2 gap-4' }, [
                    this.createInput('Data Urodzenia', 'date', editedGrave.birthDate, v => editedGrave.birthDate = v),
                    this.createInput('Data Śmierci', 'date', editedGrave.deathDate, v => editedGrave.deathDate = v),
                ]),
                this.createElement('hr', { className: 'my-4 border-slate-100' }),
                this.createElement('h4', { className: 'text-sm font-semibold text-slate-900 mb-3' }, ['Lokalizacja']),
                this.createSelect('Sekcja', editedGrave.section, sectionOptions, v => {
                    editedGrave.section = v;
                    editedGrave.row = '';
                    editedGrave.plot = '';
                    updateMap();
                }),
                this.createElement('div', { className: 'grid grid-cols-2 gap-4 mt-3' }, [
                    this.createInput('Rząd', 'number', editedGrave.row, v => { editedGrave.row = v; updateMap(); }, { attrs: { id: 'edit-input-row', readonly: true } }),
                    this.createInput('Miejsce', 'number', editedGrave.plot, v => { editedGrave.plot = v; updateMap(); }, { attrs: { id: 'edit-input-plot', readonly: true } }),
                ]),
                this.createElement('div', { className: 'mt-2 text-xs text-slate-500' }, ['Kliknij na mapie poniżej, aby zmienić miejsce.']),
                mapContainer
            ],
            onClose: () => document.removeEventListener('select-plot-edit', handleSelect),
            onConfirm: async () => {
                try {
                    await API.put(`/api/admin/graves/${grave.id}`, editedGrave);
                    this.loadData();
                    Modal.close();
                } catch (err) {
                    alert('Błąd edycji grobu: ' + err.message);
                }
            }
        });
        modal.mount();
        setTimeout(updateMap, 100);
    }

    openAddSectionModal() {
        const newSection = { name: '', description: '', rows: 10, cols: 10 };
        
        const modal = new Modal({
            title: 'Dodaj Nową Sekcję',
            content: [
                this.createInput('Nazwa Sekcji (np. A, B, C)', 'text', '', v => newSection.name = v),
                this.createElement('div', { className: 'grid grid-cols-2 gap-4' }, [
                    this.createInput('Liczba Rzędów', 'number', 10, v => newSection.rows = parseInt(v)),
                    this.createInput('Liczba Miejsc w Rzędzie', 'number', 10, v => newSection.cols = parseInt(v)),
                ]),
                this.createElement('div', { className: 'mt-3' }, [
                    this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, ['Opis']),
                    this.createElement('textarea', {
                        className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24',
                        oninput: (e) => newSection.description = e.target.value
                    })
                ])
            ],
            onConfirm: async () => {
                try {
                    await API.post('/api/admin/sections', newSection);
                    this.loadData();
                    Modal.close();
                } catch (err) {
                    alert('Błąd dodawania sekcji: ' + err.message);
                }
            }
        });
        modal.mount();
    }

    openEditSectionModal(section) {
        const editedSection = { ...section };
        
        const modal = new Modal({
            title: 'Edytuj Sekcję',
            content: [
                this.createInput('Nazwa Sekcji', 'text', editedSection.name, v => editedSection.name = v),
                this.createElement('div', { className: 'grid grid-cols-2 gap-4' }, [
                    this.createInput('Liczba Rzędów', 'number', editedSection.rows, v => editedSection.rows = parseInt(v)),
                    this.createInput('Liczba Miejsc w Rzędzie', 'number', editedSection.cols, v => editedSection.cols = parseInt(v)),
                ]),
                this.createElement('div', { className: 'mt-3' }, [
                    this.createElement('label', { className: 'block text-sm font-medium text-slate-700 mb-1' }, ['Opis']),
                    this.createElement('textarea', {
                        className: 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24',
                        oninput: (e) => editedSection.description = e.target.value
                    }, [editedSection.description || ''])
                ])
            ],
            onConfirm: async () => {
                try {
                    await API.put(`/api/admin/sections/${section.id}`, editedSection);
                    this.loadData();
                    Modal.close();
                } catch (err) {
                    alert('Błąd edycji sekcji: ' + err.message);
                }
            }
        });
        modal.mount();
    }

    async deleteGrave(id) {
        if (confirm('Czy na pewno chcesz usunąć ten grób?')) {
            try {
                await API.delete(`/api/graves/${id}`);
                this.loadData();
            } catch (err) {
                alert('Błąd usuwania: ' + err.message);
            }
        }
    }

    async deleteSection(id) {
        if (confirm('Czy na pewno chcesz usunąć tę sekcję? Wszystkie groby w niej przypisane mogą stracić powiązanie.')) {
            try {
                await API.delete(`/api/admin/sections/${id}`);
                this.loadData();
            } catch (err) {
                alert('Błąd usuwania sekcji: ' + err.message);
            }
        }
    }

    renderContent() {
        return this.createElement('div', { className: 'space-y-6' }, [
            // Header & Tabs
            this.createElement('div', { className: 'bg-white rounded-lg shadow-sm border border-slate-200' }, [
                this.createElement('div', { className: 'p-4 border-b border-slate-200' }, [
                    this.createElement('h2', { className: 'text-xl font-bold text-slate-900' }, ['Zarządzanie Cmentarzem'])
                ]),
                this.createElement('div', { className: 'flex px-4 gap-6' }, [
                    this.createElement('button', {
                        className: `tab-btn py-3 text-sm font-medium border-b-2 transition-colors ${this.state.activeTab === 'graves' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`,
                        'data-tab': 'graves',
                        onclick: () => this.switchTab('graves')
                    }, ['Groby']),
                    this.createElement('button', {
                        className: `tab-btn py-3 text-sm font-medium border-b-2 transition-colors ${this.state.activeTab === 'sections' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`,
                        'data-tab': 'sections',
                        onclick: () => this.switchTab('sections')
                    }, ['Sekcje']),
                    this.createElement('button', {
                        className: `tab-btn py-3 text-sm font-medium border-b-2 transition-colors ${this.state.activeTab === 'map' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`,
                        'data-tab': 'map',
                        onclick: () => this.switchTab('map')
                    }, ['Mapa'])
                ])
            ]),

            // Content Area
            this.createElement('div', { id: 'graves-view-content' }, [
                this.renderTabsContent()
            ])
        ]);
    }

    render() {
        return new AdminLayout({
            title: 'Zarządzanie Grobami i Sekcjami',
            contentComponent: this.renderContent()
        }).render();
    }
}