import { Component } from './Component.js';

export class Modal extends Component {
    constructor(props = {}) {
        super(props);
        this.title = props.title || '';
        this.content = props.content || []; // Array of Components or strings
        this.onClose = props.onClose || (() => {});
        this.onConfirm = props.onConfirm || null;
        this.confirmText = props.confirmText || 'Zapisz';
        this.cancelText = props.cancelText || 'Anuluj';
    }

    static show(props) {
        const modal = new Modal(props);
        modal.mount(document.body);
        return modal;
    }

    static close() {
        const modals = document.querySelectorAll('.fixed.inset-0');
        modals.forEach(m => m.remove());
    }

    close() {
        if (this.element) {
            this.element.remove();
            this.element = null;
            this.onClose();
        }
    }

    render() {
        // Overlay
        return this.createElement('div', { 
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' 
        }, [
            // Modal Content
            this.createElement('div', { 
                className: 'bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]' 
            }, [
                // Header
                this.createElement('div', { className: 'p-4 border-b flex justify-between items-center' }, [
                    this.createElement('h3', { className: 'font-bold text-lg' }, [this.title]),
                    this.createElement('button', { 
                        className: 'text-slate-400 hover:text-slate-600',
                        onclick: () => this.close()
                    }, [
                        this.createElement('i', { 'data-lucide': 'x', className: 'w-5 h-5' })
                    ])
                ]),
                
                // Body
                this.createElement('div', { className: 'p-4 overflow-y-auto flex-1 space-y-4' }, Array.isArray(this.content) ? this.content : [this.content]),
                
                // Footer
                this.createElement('div', { className: 'p-4 border-t flex justify-end gap-2' }, [
                    this.createElement('button', { 
                        className: 'px-4 py-2 text-slate-600 hover:bg-slate-100 rounded',
                        onclick: () => this.close()
                    }, [this.cancelText]),
                    
                    this.onConfirm ? this.createElement('button', { 
                        className: 'px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded',
                        onclick: () => this.onConfirm()
                    }, [this.confirmText]) : null
                ])
            ])
        ]);
    }

    mount(parent) {
        // Modals are usually mounted to body
        super.mount(document.body);
        if (window.lucide) window.lucide.createIcons();
    }
}