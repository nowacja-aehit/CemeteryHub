export class Component {
    constructor(props = {}) {
        this.props = props;
        this.element = null;
        this.children = [];
    }

    /**
     * Creates a DOM element with attributes and children
     * @param {string} tag - HTML tag name
     * @param {object} attributes - Key-value pairs for attributes (className, id, onclick, etc.)
     * @param {Array<string|HTMLElement|Component>} children - Child elements
     * @returns {HTMLElement}
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);

        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else if (key === 'dataset' && typeof value === 'object') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                if (typeof value === 'boolean') {
                    if (value) {
                        element.setAttribute(key, '');
                    }
                } else if (value !== undefined && value !== null) {
                    element.setAttribute(key, value);
                }
            }
        });

        children.forEach(child => {
            if (typeof child === 'string' || typeof child === 'number') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Component) {
                element.appendChild(child.render());
            } else if (child instanceof HTMLElement) {
                element.appendChild(child);
            }
        });

        return element;
    }

    render() {
        throw new Error('Component must implement render method');
    }

    mount(parent) {
        this.element = this.render();
        if (parent instanceof HTMLElement) {
            parent.appendChild(this.element);
        } else if (typeof parent === 'string') {
            document.querySelector(parent).appendChild(this.element);
        }
        return this.element;
    }
}