class Palette {
    constructor() {
        this.container = document.getElementById('component-palette');
        this.searchInput = null;
        this.categoryFilters = new Set(['all']);
        this.favoriteComponents = new Set();
        
        // Component definitions
        this.components = {
            inputs: [
                {
                    type: 'input',
                    subtype: 'switch',
                    name: 'Toggle Switch',
                    icon: '⚡',
                    description: 'Click to toggle between ON/OFF',
                    category: 'basic'
                },
                {
                    type: 'input',
                    subtype: 'button',
                    name: 'Push Button',
                    icon: '🔘',
                    description: 'ON while pressed, OFF when released',
                    category: 'basic'
                },
                {
                    type: 'input',
                    subtype: 'clock',
                    name: 'Clock',
                    icon: '⏰',
                    description: 'Generates periodic signals',
                    category: 'advanced'
                },
                {
                    type: 'input',
                    subtype: 'high',
                    name: 'High Constant',
                    icon: '1',
                    description: 'Always outputs 1 (HIGH)',
                    category: 'basic'
                },
                {
                    type: 'input',
                    subtype: 'low',
                    name: 'Low Constant',
                    icon: '0',
                    description: 'Always outputs 0 (LOW)',
                    category: 'basic'
                }
            ],
            gates: [
                {
                    type: 'gate',
                    subtype: 'AND',
                    name: 'AND Gate',
                    icon: 'AND',
                    description: 'Output is 1 only when all inputs are 1',
                    category: 'basic',
                    truthTable: '00→0, 01→0, 10→0, 11→1'
                },
                {
                    type: 'gate',
                    subtype: 'OR',
                    name: 'OR Gate',
                    icon: 'OR',
                    description: 'Output is 1 when any input is 1',
                    category: 'basic',
                    truthTable: '00→0, 01→1, 10→1, 11→1'
                },
                {
                    type: 'gate',
                    subtype: 'NOT',
                    name: 'NOT Gate',
                    icon: 'NOT',
                    description: 'Inverts the input signal',
                    category: 'basic',
                    truthTable: '0→1, 1→0'
                },
                {
                    type: 'gate',
                    subtype: 'XOR',
                    name: 'XOR Gate',
                    icon: 'XOR',
                    description: 'Output is 1 when inputs are different',
                    category: 'intermediate',
                    truthTable: '00→0, 01→1, 10→1, 11→0'
                },
                {
                    type: 'gate',
                    subtype: 'NAND',
                    name: 'NAND Gate',
                    icon: 'NAND',
                    description: 'Inverted AND gate',
                    category: 'intermediate',
                    truthTable: '00→1, 01→1, 10→1, 11→0'
                },
                {
                    type: 'gate',
                    subtype: 'NOR',
                    name: 'NOR Gate',
                    icon: 'NOR',
                    description: 'Inverted OR gate',
                    category: 'intermediate',
                    truthTable: '00→1, 01→0, 10→0, 11→0'
                }
            ],
            outputs: [
                {
                    type: 'output',
                    subtype: 'bulb',
                    name: 'Light Bulb',
                    icon: '💡',
                    description: 'Lights up when input is HIGH',
                    category: 'basic'
                },
                {
                    type: 'output',
                    subtype: 'display',
                    name: '4-Bit Display',
                    icon: '📟',
                    description: 'Shows hexadecimal digit (0-F)',
                    category: 'advanced'
                },
                {
                    type: 'output',
                    subtype: 'probe',
                    name: 'Logic Probe',
                    icon: '📊',
                    description: 'Shows signal state and history',
                    category: 'advanced'
                },
                {
                    type: 'output',
                    subtype: 'speaker',
                    name: 'Speaker',
                    icon: '🔊',
                    description: 'Plays tone when input is HIGH',
                    category: 'advanced'
                }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.loadFavorites();
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        this.container.innerHTML = '';
        
        // Add search bar
        const searchSection = document.createElement('div');
        searchSection.className = 'palette-search';
        searchSection.innerHTML = `
            <input type="text" 
                   id="component-search" 
                   placeholder="Search components..." 
                   class="search-input">
            <div class="category-filters">
                <button class="filter-btn active" data-category="all">All</button>
                <button class="filter-btn" data-category="basic">Basic</button>
                <button class="filter-btn" data-category="intermediate">Intermediate</button>
                <button class="filter-btn" data-category="advanced">Advanced</button>
                <button class="filter-btn" data-category="favorites">★ Favorites</button>
            </div>
        `;
        this.container.appendChild(searchSection);
        
        this.searchInput = document.getElementById('component-search');
        
        // Add component sections
        this.renderSection('Input Controls', this.components.inputs);
        this.renderSection('Logic Gates', this.components.gates);
        this.renderSection('Output Controls', this.components.outputs);
        
        // Add custom components section if user has any
        this.renderCustomSection();
    }
    
    renderSection(title, components) {
        const section = document.createElement('section');
        section.className = 'palette-section';
        
        const header = document.createElement('h3');
        header.textContent = title;
        section.appendChild(header);
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'palette-items';
        
        components.forEach(component => {
            if (this.shouldShowComponent(component)) {
                const item = this.createPaletteItem(component);
                itemsContainer.appendChild(item);
            }
        });
        
        section.appendChild(itemsContainer);
        this.container.appendChild(section);
    }
    
    createPaletteItem(component) {
        const item = document.createElement('div');
        item.className = 'palette-item';
        item.draggable = true;
        item.dataset.componentType = component.type;
        item.dataset.componentSubtype = component.subtype;
        
        // Add favorite indicator
        const isFavorite = this.favoriteComponents.has(`${component.type}-${component.subtype}`);
        
        item.innerHTML = `
            <div class="component-header">
                <div class="component-icon ${component.type === 'gate' ? 'gate-icon' : ''}">
                    ${component.icon}
                </div>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        data-component-id="${component.type}-${component.subtype}">
                    ★
                </button>
            </div>
            <span class="component-name">${component.name}</span>
            <div class="component-tooltip">
                <p>${component.description}</p>
                ${component.truthTable ? `<p class="truth-table-preview">${component.truthTable}</p>` : ''}
            </div>
        `;
        
        // Setup drag events
        this.setupDragEvents(item, component);
        
        return item;
    }
    
    setupDragEvents(item, component) {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('component-type', component.type);
            e.dataTransfer.setData('component-subtype', component.subtype);
            
            // Create drag image
            const dragImage = this.createDragImage(component);
            e.dataTransfer.setDragImage(dragImage, 40, 30);
            
            // Add dragging class
            item.classList.add('dragging');
            
            // Track usage for smart sorting
            this.trackComponentUsage(component);
        });
        
        item.addEventListener('dragend', (e) => {
            item.classList.remove('dragging');
        });
        
        // Touch support for mobile
        item.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e, component);
        });
    }
    
    createDragImage(component) {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        
        // Draw component preview
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        
        if (component.type === 'gate') {
            // Draw simplified gate shape
            ctx.fillRect(10, 10, 60, 40);
            ctx.strokeRect(10, 10, 60, 40);
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(component.subtype, 40, 30);
        } else {
            // Draw generic component
            ctx.fillRect(10, 10, 60, 40);
            ctx.strokeRect(10, 10, 60, 40);
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(component.icon, 40, 30);
        }
        
        // Add to DOM temporarily
        canvas.style.position = 'absolute';
        canvas.style.left = '-1000px';
        document.body.appendChild(canvas);
        
        setTimeout(() => {
            document.body.removeChild(canvas);
        }, 0);
        
        return canvas;
    }
    
    setupEventListeners() {
        // Search functionality
        this.searchInput.addEventListener('input', (e) => {
            this.filterComponents(e.target.value);
        });
        
        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.toggleCategoryFilter(category);
                e.target.classList.toggle('active');
                this.filterComponents(this.searchInput.value);
            });
        });
        
        // Favorite buttons
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('favorite-btn')) {
                const componentId = e.target.dataset.componentId;
                this.toggleFavorite(componentId);
                e.target.classList.toggle('active');
            }
        });
    }
    
    filterComponents(searchTerm = '') {
        const items = this.container.querySelectorAll('.palette-item');
        const search = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const name = item.querySelector('.component-name').textContent.toLowerCase();
            const description = item.querySelector('.component-tooltip p').textContent.toLowerCase();
            const matchesSearch = !search || name.includes(search) || description.includes(search);
            
            const componentType = item.dataset.componentType;
            const componentSubtype = item.dataset.componentSubtype;
            const component = this.findComponent(componentType, componentSubtype);
            
            const matchesCategory = this.shouldShowComponent(component);
            
            item.style.display = matchesSearch && matchesCategory ? 'flex' : 'none';
        });
        
        // Update section visibility
        this.container.querySelectorAll('.palette-section').forEach(section => {
            const hasVisibleItems = section.querySelectorAll('.palette-item[style="display: flex;"]').length > 0;
            section.style.display = hasVisibleItems ? 'block' : 'none';
        });
    }
    
    shouldShowComponent(component) {
        if (this.categoryFilters.has('all')) return true;
        if (this.categoryFilters.has('favorites')) {
            return this.favoriteComponents.has(`${component.type}-${component.subtype}`);
        }
        return this.categoryFilters.has(component.category);
    }
    
    toggleCategoryFilter(category) {
        if (category === 'all') {
            this.categoryFilters.clear();
            this.categoryFilters.add('all');
            // Deactivate other filters
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.category === 'all');
            });
        } else {
            this.categoryFilters.delete('all');
            if (this.categoryFilters.has(category)) {
                this.categoryFilters.delete(category);
            } else {
                this.categoryFilters.add(category);
            }
            
            // Update all button
            document.querySelector('.filter-btn[data-category="all"]').classList.remove('active');
            
            // If no filters active, activate all
            if (this.categoryFilters.size === 0) {
                this.categoryFilters.add('all');
                document.querySelector('.filter-btn[data-category="all"]').classList.add('active');
            }
        }
    }
    
    findComponent(type, subtype) {
        const allComponents = [
            ...this.components.inputs,
            ...this.components.gates,
            ...this.components.outputs
        ];
        
        return allComponents.find(c => c.type === type && c.subtype === subtype);
    }
    
    toggleFavorite(componentId) {
        if (this.favoriteComponents.has(componentId)) {
            this.favoriteComponents.delete(componentId);
        } else {
            this.favoriteComponents.add(componentId);
        }
        this.saveFavorites();
    }
    
    loadFavorites() {
        const saved = localStorage.getItem('logicSim_favorites');
        if (saved) {
            this.favoriteComponents = new Set(JSON.parse(saved));
        }
    }
    
    saveFavorites() {
        localStorage.setItem('logicSim_favorites', 
            JSON.stringify(Array.from(this.favoriteComponents))
        );
    }
    
    trackComponentUsage(component) {
        const key = `usage_${component.type}_${component.subtype}`;
        const count = parseInt(localStorage.getItem(key) || '0') + 1;
        localStorage.setItem(key, count.toString());
    }
    
    // Touch support for mobile
    handleTouchStart(e, component) {
        const touch = e.touches[0];
        const dragElement = this.createMobileDragElement(component);
        
        const handleTouchMove = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            dragElement.style.left = touch.clientX - 40 + 'px';
            dragElement.style.top = touch.clientY - 30 + 'px';
        };
        
        const handleTouchEnd = (e) => {
            const touch = e.changedTouches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Check if dropped on canvas
            if (target && target.id === 'circuit-canvas') {
                const rect = target.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                // Trigger drop event
                this.handleMobileDrop(component, x, y);
            }
            
            dragElement.remove();
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
        
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
    }
    
    createMobileDragElement(component) {
        const element = document.createElement('div');
        element.className = 'mobile-drag-element';
        element.style.cssText = `
            position: fixed;
            width: 80px;
            height: 60px;
            background: white;
            border: 2px solid #3498db;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            opacity: 0.8;
        `;
        element.textContent = component.icon;
        document.body.appendChild(element);
        return element;
    }
    
    handleMobileDrop(component, x, y) {
        // This would interface with the main app to create the component
        if (window.logicSimulator && window.logicSimulator.canvasManager) {
            const worldPos = window.logicSimulator.canvasManager.screenToWorld(x, y);
            const snappedX = window.logicSimulator.canvasManager.snapToGrid(worldPos.x);
            const snappedY = window.logicSimulator.canvasManager.snapToGrid(worldPos.y);
            
            let newComponent;
            if (component.type === 'gate') {
                newComponent = new Gate(component.subtype, snappedX, snappedY);
            } else if (component.type === 'input') {
                newComponent = new InputComponent(component.subtype, snappedX, snappedY);
            } else if (component.type === 'output') {
                newComponent = new OutputComponent(component.subtype, snappedX, snappedY);
            }
            
            if (newComponent) {
                window.logicSimulator.circuit.addComponent(newComponent);
            }
        }
    }
    
    // Custom components support
    renderCustomSection() {
        const customComponents = this.loadCustomComponents();
        if (customComponents.length > 0) {
            this.renderSection('Custom Components', customComponents);
        }
    }
    
    loadCustomComponents() {
        const saved = localStorage.getItem('logicSim_customComponents');
        return saved ? JSON.parse(saved) : [];
    }
    
    addCustomComponent(name, circuit) {
        const customComponents = this.loadCustomComponents();
        const component = {
            type: 'custom',
            subtype: `custom_${Date.now()}`,
            name: name,
            icon: '📦',
            description: 'User-created component',
            category: 'custom',
            circuit: circuit
        };
        
        customComponents.push(component);
        localStorage.setItem('logicSim_customComponents', JSON.stringify(customComponents));
        
        this.render();
        return component;
    }
}