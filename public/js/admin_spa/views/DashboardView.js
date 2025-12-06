import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';

export class DashboardView extends Component {
    constructor() {
        super();
        const now = new Date();
        this.state = {
            loading: true,
            stats: {
                graves: 0,
                requests: 0,
                messages: 0,
                reservations: 0
            },
            events: [],
            currentMonth: now.getMonth(),
            currentYear: now.getFullYear(),
            selectedDate: null
        };
        this.loadData();
    }

    async loadData() {
        try {
            const data = await API.get('/api/admin/dashboard');
            this.state.stats = data.stats;
            this.state.events = data.events;
            this.state.loading = false;
            this.refresh();
        } catch (error) {
            console.error('Failed to load dashboard data', error);
            this.state.loading = false;
            this.refresh();
        }
    }

    refresh() {
        const container = document.getElementById('dashboard-content');
        if (container) {
            container.innerHTML = '';
            container.appendChild(this.renderContent());
            if (window.lucide) window.lucide.createIcons();
        }
    }

    render() {
        return new AdminLayout({ 
            title: 'Dashboard', 
            contentComponent: this.createElement('div', { id: 'dashboard-content' }, [
                this.renderContent()
            ])
        }).render();
    }

    renderContent() {
        if (this.state.loading) {
            return this.createElement('div', { className: 'p-8 text-center text-slate-500' }, ['Ładowanie danych...']);
        }

        return this.createElement('div', { className: 'space-y-6' }, [
            // Stats Grid
            this.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' }, [
                this.createStatCard('Groby', this.state.stats.graves, 'layers', 'bg-blue-500'),
                this.createStatCard('Zgłoszenia', this.state.stats.requests, 'clipboard-list', 'bg-yellow-500'),
                this.createStatCard('Wiadomości', this.state.stats.messages, 'mail', 'bg-green-500'),
                this.createStatCard('Rezerwacje', this.state.stats.reservations, 'calendar', 'bg-purple-500')
            ]),

            // Calendar Section
            this.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' }, [
                // Calendar
                this.createElement('div', { className: 'lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200' }, [
                    this.renderCalendarHeader(),
                    this.renderCalendarGrid()
                ]),
                // Events List (Side)
                this.createElement('div', { className: 'bg-white p-6 rounded-lg shadow-sm border border-slate-200' }, [
                    this.createElement('h3', { className: 'font-bold text-lg mb-4' }, ['Nadchodzące wydarzenia']),
                    this.renderUpcomingEvents()
                ])
            ])
        ]);
    }

    createStatCard(title, value, icon, colorClass) {
        return this.createElement('div', { className: 'bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex items-center gap-4' }, [
            this.createElement('div', { className: `w-12 h-12 rounded-lg flex items-center justify-center text-white ${colorClass}` }, [
                this.createElement('i', { 'data-lucide': icon, className: 'w-6 h-6' })
            ]),
            this.createElement('div', {}, [
                this.createElement('p', { className: 'text-sm text-slate-500' }, [title]),
                this.createElement('p', { className: 'text-2xl font-bold text-slate-900' }, [value])
            ])
        ]);
    }

    // --- Calendar Logic ---

    renderCalendarHeader() {
        const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
        
        return this.createElement('div', { className: 'flex justify-between items-center mb-6' }, [
            this.createElement('h2', { className: 'text-xl font-bold text-slate-800' }, [
                `${monthNames[this.state.currentMonth]} ${this.state.currentYear}`
            ]),
            this.createElement('div', { className: 'flex gap-2' }, [
                this.createElement('button', { 
                    className: 'p-2 hover:bg-slate-100 rounded-full transition-colors',
                    onclick: () => this.changeMonth(-1)
                }, [this.createElement('i', { 'data-lucide': 'chevron-left', className: 'w-5 h-5' })]),
                this.createElement('button', { 
                    className: 'p-2 hover:bg-slate-100 rounded-full transition-colors',
                    onclick: () => this.changeMonth(1)
                }, [this.createElement('i', { 'data-lucide': 'chevron-right', className: 'w-5 h-5' })])
            ])
        ]);
    }

    renderCalendarGrid() {
        const daysInMonth = new Date(this.state.currentYear, this.state.currentMonth + 1, 0).getDate();
        const firstDay = new Date(this.state.currentYear, this.state.currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
        
        // Adjust for Monday start (0 = Mon, 6 = Sun)
        const startDay = firstDay === 0 ? 6 : firstDay - 1;

        const grid = this.createElement('div', { className: 'grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden' });

        // Headers
        ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].forEach(day => {
            grid.appendChild(this.createElement('div', { className: 'bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500' }, [day]));
        });

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            grid.appendChild(this.createElement('div', { className: 'bg-white min-h-[100px]' }));
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.state.currentYear}-${String(this.state.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = this.state.events.filter(e => e.date === dateStr);
            const isToday = new Date().toDateString() === new Date(this.state.currentYear, this.state.currentMonth, day).toDateString();

            const cell = this.createElement('div', { 
                className: `bg-white min-h-[100px] p-2 hover:bg-slate-50 transition-colors cursor-pointer ${isToday ? 'bg-blue-50' : ''}`,
                onclick: () => {
                    this.state.selectedDate = dateStr;
                    this.refresh(); // Or show modal
                }
            }, [
                this.createElement('div', { className: `text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-slate-700'}` }, [day]),
                this.createElement('div', { className: 'space-y-1' }, dayEvents.map(event => 
                    this.createElement('div', { 
                        className: `text-[10px] p-1 rounded truncate ${this.getEventColor(event.type)} hover:opacity-80`,
                        title: `${event.title} (${event.status})`,
                        onclick: (e) => {
                            e.stopPropagation();
                            this.handleEventClick(event);
                        }
                    }, [event.title])
                ))
            ]);
            grid.appendChild(cell);
        }

        return grid;
    }

    handleEventClick(event) {
        const id = event.id.split('_')[1];
        switch(event.type) {
            case 'request':
                window.location.hash = `/requests?id=${id}`;
                break;
            case 'reservation':
                window.location.hash = `/reservations?id=${id}`;
                break;
            case 'message':
                window.location.hash = `/messages?id=${id}`;
                break;
        }
    }

    renderUpcomingEvents() {
        // Sort events by date, filter for future or today
        const today = new Date().toISOString().split('T')[0];
        const upcoming = this.state.events
            .filter(e => e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5);

        if (upcoming.length === 0) {
            return this.createElement('div', { className: 'text-slate-500 text-sm' }, ['Brak nadchodzących wydarzeń.']);
        }

        return this.createElement('div', { className: 'space-y-3' }, upcoming.map(event => 
            this.createElement('div', { 
                className: 'flex gap-3 items-start p-3 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors',
                onclick: () => this.handleEventClick(event)
            }, [
                this.createElement('div', { className: `w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${this.getEventDotColor(event.type)}` }),
                this.createElement('div', {}, [
                    this.createElement('p', { className: 'text-sm font-medium text-slate-900' }, [event.title]),
                    this.createElement('p', { className: 'text-xs text-slate-500' }, [event.date]),
                    event.details ? this.createElement('p', { className: 'text-xs text-slate-400 mt-1' }, [event.details]) : null
                ])
            ])
        ));
    }

    getEventColor(type) {
        switch(type) {
            case 'request': return 'bg-yellow-100 text-yellow-800';
            case 'reservation': return 'bg-purple-100 text-purple-800';
            case 'message': return 'bg-green-100 text-green-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }

    getEventDotColor(type) {
        switch(type) {
            case 'request': return 'bg-yellow-500';
            case 'reservation': return 'bg-purple-500';
            case 'message': return 'bg-green-500';
            default: return 'bg-slate-500';
        }
    }

    changeMonth(delta) {
        let newMonth = this.state.currentMonth + delta;
        let newYear = this.state.currentYear;

        if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        } else if (newMonth < 0) {
            newMonth = 11;
            newYear--;
        }

        this.state.currentMonth = newMonth;
        this.state.currentYear = newYear;
        this.refresh();
    }
}