import { Component } from '../core/Component.js';
import { AdminLayout } from '../layouts/AdminLayout.js';
import { API } from '../core/API.js';
import { Modal } from '../core/Modal.js';

export class DeveloperView extends Component {
    constructor() {
        super();
        this.state = {
            loading: true,
            systemInfo: null,
            testOutput: null,
            testResults: null,
            testRunning: false,
            actionLoading: false
        };
        this.loadSystemInfo();
    }

    async loadSystemInfo() {
        try {
            const info = await API.get('/api/admin/dev/system-info');
            this.state.systemInfo = info;
        } catch (error) {
            console.error('Failed to load system info', error);
        } finally {
            this.state.loading = false;
            this.refresh();
        }
    }

    async runTests() {
        this.state.testRunning = true;
        this.state.testOutput = null;
        this.state.testResults = [];
        this.refresh();

        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`${API.BASE_URL}/api/admin/dev/run-tests`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                const lines = buffer.split('\n\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        try {
                            const result = JSON.parse(jsonStr);
                            if (result.error) {
                                this.state.testOutput = `Error: ${result.error}`;
                            } else {
                                // Ensure we don't have duplicates if the stream sends same data twice (unlikely but safe)
                                if (!this.state.testResults.find(r => r.name === result.name)) {
                                    this.state.testResults.push(result);
                                }
                            }
                            this.refresh();
                        } catch (e) {
                            console.error('Error parsing JSON from stream', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Stream error:', error);
            this.state.testOutput = `Error running tests: ${error.message}`;
        } finally {
            this.state.testRunning = false;
            this.refresh();
        }
    }

    async seedData() {
        if (!confirm('Czy na pewno chcesz dodać przykładowe dane?')) return;
        
        this.state.actionLoading = true;
        this.refresh();
        try {
            const result = await API.post('/api/admin/dev/seed-data');
            Modal.show({
                title: 'Sukces',
                content: result.message,
                type: 'success'
            });
            this.loadSystemInfo(); // Refresh stats
        } catch (error) {
            Modal.show({
                title: 'Błąd',
                content: error.message,
                type: 'error'
            });
        } finally {
            this.state.actionLoading = false;
            this.refresh();
        }
    }

    async clearData() {
        if (!confirm('UWAGA! To usunie WSZYSTKIE dane z bazy (oprócz konta admina). Czy kontynuować?')) return;
        
        this.state.actionLoading = true;
        this.refresh();
        try {
            const result = await API.post('/api/admin/dev/clear-data');
            Modal.show({
                title: 'Sukces',
                content: result.message,
                type: 'success'
            });
            this.loadSystemInfo(); // Refresh stats
        } catch (error) {
            Modal.show({
                title: 'Błąd',
                content: error.message,
                type: 'error'
            });
        } finally {
            this.state.actionLoading = false;
            this.refresh();
        }
    }

    refresh() {
        const container = document.getElementById('developer-content');
        if (container) {
            try {
                const content = this.renderContent();
                container.innerHTML = '';
                container.appendChild(content);
                if (window.lucide) window.lucide.createIcons();
            } catch (error) {
                console.error('Error rendering DeveloperView:', error);
                container.innerHTML = `<div class="text-red-600 p-4">Błąd renderowania widoku: ${error.message}</div>`;
            }
        }
    }

    renderContent() {
        if (this.state.loading) {
            return this.createElement('div', { className: 'flex justify-center p-8' }, ['Ładowanie...']);
        }

        return this.createElement('div', { className: 'space-y-6' }, [
            // System Info Card
            this.createElement('div', { className: 'bg-white p-6 rounded-lg shadow-sm border' }, [
                this.createElement('h3', { className: 'text-lg font-semibold mb-4' }, ['Informacje o systemie']),
                this.createElement('div', { className: 'grid grid-cols-2 gap-4' }, [
                    this.createStatItem('OS', this.state.systemInfo?.os),
                    this.createStatItem('OS Release', this.state.systemInfo?.os_release),
                    this.createStatItem('Python', this.state.systemInfo?.python_version?.split(' ')[0]),
                    this.createStatItem('Baza danych', this.state.systemInfo?.db_path),
                    this.createStatItem('Liczba grobów', this.state.systemInfo?.graves_count),
                    this.createStatItem('Liczba użytkowników', this.state.systemInfo?.users_count),
                ])
            ]),

            // Actions Card
            this.createElement('div', { className: 'bg-white p-6 rounded-lg shadow-sm border' }, [
                this.createElement('h3', { className: 'text-lg font-semibold mb-4' }, ['Akcje developerskie']),
                this.createElement('div', { className: 'flex gap-4 flex-wrap' }, [
                    this.createElement('button', {
                        className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50',
                        onclick: () => this.runTests(),
                        disabled: this.state.testRunning || this.state.actionLoading
                    }, [this.state.testRunning ? 'Uruchamianie...' : 'Uruchom testy']),
                    
                    this.createElement('button', {
                        className: 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50',
                        onclick: () => this.seedData(),
                        disabled: this.state.testRunning || this.state.actionLoading
                    }, ['Załaduj przykładowe dane']),

                    this.createElement('button', {
                        className: 'px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50',
                        onclick: () => this.clearData(),
                        disabled: this.state.testRunning || this.state.actionLoading
                    }, ['Wyczyść bazę danych'])
                ])
            ]),

            // Test Output
            this.state.testOutput ? this.createElement('div', { className: 'bg-red-100 text-red-800 p-4 rounded-lg shadow-sm border border-red-200' }, [
                this.state.testOutput
            ]) : null,

            // Test Results List
            this.state.testResults ? this.createElement('div', { className: 'space-y-4' }, [
                this.createElement('h3', { className: 'text-lg font-semibold' }, ['Wyniki testów']),
                ...this.state.testResults.map(result => this.createTestResultItem(result))
            ]) : null
        ]);
    }

    createTestResultItem(result) {
        const isPass = result.status === 'PASS';
        return this.createElement('div', { className: `border rounded-lg overflow-hidden ${isPass ? 'border-green-200' : 'border-red-200'}` }, [
            this.createElement('div', { 
                className: `px-4 py-3 flex items-center justify-between cursor-pointer ${isPass ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}`,
                onclick: (e) => {
                    const details = e.currentTarget.nextElementSibling;
                    details.classList.toggle('hidden');
                }
            }, [
                this.createElement('div', { className: 'flex items-center gap-3' }, [
                    this.createElement('i', { 
                        'data-lucide': isPass ? 'check-circle' : 'x-circle', 
                        className: `w-5 h-5 ${isPass ? 'text-green-600' : 'text-red-600'}` 
                    }),
                    this.createElement('span', { className: 'font-medium' }, [result.name])
                ]),
                this.createElement('div', { className: 'flex items-center gap-4 text-sm' }, [
                    this.createElement('span', { className: 'text-slate-500' }, [`${result.duration.toFixed(2)}s`]),
                    this.createElement('span', { className: `font-bold ${isPass ? 'text-green-700' : 'text-red-700'}` }, [result.status])
                ])
            ]),
            this.createElement('div', { className: 'hidden bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto' }, [
                this.createElement('pre', {}, [result.output])
            ])
        ]);
    }

    createStatItem(label, value) {
        return this.createElement('div', { className: 'p-3 bg-slate-50 rounded' }, [
            this.createElement('div', { className: 'text-xs text-slate-500 uppercase' }, [label]),
            this.createElement('div', { className: 'font-medium' }, [String(value)])
        ]);
    }

    render() {
        return new AdminLayout({
            title: 'Developer Tools',
            contentComponent: this.createElement('div', { id: 'developer-content' }, [
                this.renderContent()
            ])
        }).render();
    }
}
