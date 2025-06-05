class Toolbar {
    constructor(app) {
        this.app = app;
        this.container = document.querySelector('.toolbar');
        this.buttons = new Map();
        this.shortcuts = new Map();
        
        this.init();
    }
    
    init() {
        this.setupButtons();
        this.setupShortcuts();
        this.setupEventListeners();
        this.updateButtonStates();
    }
    
    setupButtons() {
        // Define toolbar buttons
        const buttonConfigs = [
            {
                id: 'btn-new',
                icon: '📄',
                tooltip: 'New Circuit (Ctrl+N)',
                action: () => this.newCircuit(),
                shortcut: 'ctrl+n'
            },
            {
                id: 'btn-open',
                icon: '📁',
                tooltip: 'Open Circuit (Ctrl+O)',
                action: () => this.openCircuit(),
                shortcut: 'ctrl+o'
            },
            {
                id: 'btn-save',
                icon: '💾',
                tooltip: 'Save Circuit (Ctrl+S)',
                action: () => this.saveCircuit(),
                shortcut: 'ctrl+s'
            },
            {
                id: 'btn-export',
                icon: '📤',
                tooltip: 'Export as Image',
                action: () => this.exportImage()
            },
            { type: 'separator' },
            {
                id: 'btn-undo',
                icon: '↶',
                tooltip: 'Undo (Ctrl+Z)',
                action: () => this.app.circuit.undo(),
                shortcut: 'ctrl+z',
                enabledCheck: () => this.app.circuit.historyIndex > 0
            },
            {
                id: 'btn-redo',
                icon: '↷',
                tooltip: 'Redo (Ctrl+Shift+Z)',
                action: () => this.app.circuit.redo(),
                shortcut: 'ctrl+shift+z',
                enabledCheck: () => this.app.circuit.historyIndex < this.app.circuit.history.length - 1
            },
            { type: 'separator' },
            {
                id: 'btn-cut',
                icon: '✂️',
                tooltip: 'Cut (Ctrl+X)',
                action: () => this.cut(),
                shortcut: 'ctrl+x',
                enabledCheck: () => this.app.circuit.selectedComponents.size > 0
            },
            {
                id: 'btn-copy',
                icon: '📋',
                tooltip: 'Copy (Ctrl+C)',
                action: () => this.copy(),
                shortcut: 'ctrl+c',
                enabledCheck: () => this.app.circuit.selectedComponents.size > 0
            },
            {
                id: 'btn-paste',
                icon: '📌',
                tooltip: 'Paste (Ctrl+V)',
                action: () => this.paste(),
                shortcut: 'ctrl+v',
                enabledCheck: () => this.clipboard !== null
            },
            {
                id: 'btn-delete',
                icon: '🗑️',
                tooltip: 'Delete (Delete)',
                action: () => this.app.circuit.deleteSelected(),
                shortcut: 'delete',
                enabledCheck: () => this.app.circuit.selectedComponents.size > 0
            },
            { type: 'separator' },
            {
                id: 'btn-select-all',
                icon: '⬚',
                tooltip: 'Select All (Ctrl+A)',
                action: () => this.app.circuit.selectAll(),
                shortcut: 'ctrl+a'
            },
            {
                id: 'btn-clear',
                icon: '🧹',
                tooltip: 'Clear All',
                action: () => this.clearAll()
            },
            { type: 'separator' },
            {
                id: 'btn-zoom-in',
                icon: '🔍+',
                tooltip: 'Zoom In',
                action: () => this.zoomIn()
            },
            {
                id: 'btn-zoom-out',
                icon: '🔍-',
                tooltip: 'Zoom Out',
                action: () => this.zoomOut()
            },
            {
                id: 'btn-zoom-fit',
                icon: '⊡',
                tooltip: 'Zoom to Fit',
                action: () => this.app.canvasManager.zoomToFit()
            },
            { type: 'separator' },
            {
                id: 'btn-simulate',
                icon: '▶️',
                tooltip: 'Run/Pause Simulation (Space)',
                action: () => this.toggleSimulation(),
                shortcut: 'space',
                toggle: true,
                activeIcon: '⏸️'
            },
            {
                id: 'btn-step',
                icon: '⏭️',
                tooltip: 'Step Simulation',
                action: () => this.app.simulator.step(),
                enabledCheck: () => !this.app.simulator.running
            },
            {
                id: 'btn-reset',
                icon: '⏹️',
                tooltip: 'Reset Simulation',
                action: () => this.app.simulator.reset()
            },
            { type: 'separator' },
            {
                id: 'btn-grid',
                icon: '⊞',
                tooltip: 'Toggle Grid (G)',
                action: () => this.app.canvasManager.toggleGrid(),
                shortcut: 'g',
                toggle: true
            },
            {
                id: 'btn-snap',
                icon: '🧲',
                tooltip: 'Toggle Snap to Grid',
                action: () => this.app.canvasManager.toggleSnapToGrid(),
                toggle: true
            },
            {
                id: 'btn-wiring',
                icon: '〰️',
                tooltip: 'Wire Routing Style',
                action: () => this.cycleWiringStyle()
            },
            { type: 'separator' },
            {
                id: 'btn-help',
                icon: '❓',
                tooltip: 'Help (F1)',
                action: () => this.showHelp(),
                shortcut: 'f1'
            },
            {
                id: 'btn-tutorial',
                icon: '🎓',
                tooltip: 'Interactive Tutorial',
                action: () => this.startTutorial()
            }
        ];
        
        // Create toolbar HTML
        this.container.innerHTML = '';
        
        buttonConfigs.forEach(config => {
            if (config.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'toolbar-separator';
                this.container.appendChild(separator);
            } else {
                const button = this.createButton(config);
                this.container.appendChild(button);
                this.buttons.set(config.id, { element: button, config: config });
                
                if (config.shortcut) {
                    this.shortcuts.set(config.shortcut, config.action);
                }
            }
        });
        
        // Add speed control
        this.addSpeedControl();
        
        // Add mode indicator
        this.addModeIndicator();
    }
    
    createButton(config) {
        const button = document.createElement('button');
        button.className = 'tool-btn';
        button.id = config.id;
        button.innerHTML = config.icon;
        button.title = config.tooltip;
        
        if (config.toggle) {
            button.dataset.toggle = 'true';
            button.dataset.activeIcon = config.activeIcon || config.icon;
            button.dataset.inactiveIcon = config.icon;
        }
        
        button.addEventListener('click', () => {
            config.action();
            this.updateButtonStates();
            
            if (config.toggle) {
                button.classList.toggle('active');
                const isActive = button.classList.contains('active');
                button.innerHTML = isActive ? button.dataset.activeIcon : button.dataset.inactiveIcon;
            }
        });
        
        return button;
    }
    
    addSpeedControl() {
        const speedControl = document.createElement('div');
        speedControl.className = 'speed-control';
        speedControl.innerHTML = `
            <label>Speed:</label>
            <input type="range" 
                   id="simulation-speed" 
                   min="0.1" 
                   max="5" 
                   step="0.1" 
                   value="1">
            <span id="speed-display">1.0x</span>
        `;
        this.container.appendChild(speedControl);
        
        const speedSlider = document.getElementById('simulation-speed');
        const speedDisplay = document.getElementById('speed-display');
        
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.app.simulator.setSpeed(speed);
            speedDisplay.textContent = `${speed.toFixed(1)}x`;
        });
    }
    
    addModeIndicator() {
        const modeIndicator = document.createElement('div');
        modeIndicator.className = 'mode-indicator';
        modeIndicator.innerHTML = `
            <span class="mode-label">Mode:</span>
            <span id="current-mode" class="mode-value">Build</span>
        `;
        this.container.appendChild(modeIndicator);
    }
    
    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Build shortcut string
            let shortcut = '';
            if (e.ctrlKey || e.metaKey) shortcut += 'ctrl+';
            if (e.shiftKey) shortcut += 'shift+';
            if (e.altKey) shortcut += 'alt+';
            
            // Special keys
            if (e.key === ' ') shortcut += 'space';
            else if (e.key === 'Delete' || e.key === 'Backspace') shortcut += 'delete';
            else if (e.key === 'F1') shortcut += 'f1';
            else shortcut += e.key.toLowerCase();
            
            // Check if shortcut exists
            if (this.shortcuts.has(shortcut)) {
                e.preventDefault();
                this.shortcuts.get(shortcut)();
                this.updateButtonStates();
            }
        });
    }
    
    setupEventListeners() {
        // Update button states on circuit changes
        this.app.circuit.addEventListener('selectionChanged', () => this.updateButtonStates());
        this.app.circuit.addEventListener('historyChanged', () => this.updateButtonStates());
        
        // Update mode indicator
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('current-mode').textContent = 
                    btn.textContent.replace(' Mode', '');
            });
        });
    }
    
    updateButtonStates() {
        this.buttons.forEach((buttonInfo, id) => {
            const { element, config } = buttonInfo;
            
            if (config.enabledCheck) {
                const enabled = config.enabledCheck();
                element.disabled = !enabled;
                element.classList.toggle('disabled', !enabled);
            }
        });
    }
    
    // Clipboard functionality
    clipboard = null;
    
    copy() {
        const selectedComponents = Array.from(this.app.circuit.selectedComponents)
            .map(id => this.app.circuit.components.get(id));
        
        const selectedConnections = Array.from(this.app.circuit.connections.values())
            .filter(conn => 
                this.app.circuit.selectedComponents.has(conn.fromComponent.id) &&
                this.app.circuit.selectedComponents.has(conn.toComponent.id)
            );
        
        this.clipboard = {
            components: this.app.circuit.serializeComponents()
                .filter(comp => this.app.circuit.selectedComponents.has(comp.id)),
            connections: selectedConnections.map(conn => ({
                fromComponentId: conn.fromComponent.id,
                fromPortType: conn.fromPort.type,
                fromPortIndex: conn.fromPort.index,
                toComponentId: conn.toComponent.id,
                toPortType: conn.toPort.type,
                toPortIndex: conn.toPort.index
            }))
        };
        
        this.showNotification('Copied to clipboard');
    }
    
    cut() {
        this.copy();
        this.app.circuit.deleteSelected();
        this.showNotification('Cut to clipboard');
    }
    
    paste() {
        if (!this.clipboard) return;
        
        // Calculate offset for pasted components
        const offset = 40;
        const idMap = new Map();
        
        // Paste components
        this.clipboard.components.forEach(compData => {
            const oldId = compData.id;
            const newId = this.app.circuit.generateId(compData.type);
            idMap.set(oldId, newId);
            
            let component;
            if (compData.type === 'gate') {
                component = new Gate(compData.subtype, compData.x + offset, compData.y + offset, newId);
            } else if (compData.type === 'input') {
                component = new InputComponent(compData.subtype, compData.x + offset, compData.y + offset, newId);
            } else if (compData.type === 'output') {
                component = new OutputComponent(compData.subtype, compData.x + offset, compData.y + offset, newId);
            }
            
            if (component) {
                component.label = compData.label;
                this.app.circuit.addComponent(component);
                this.app.circuit.selectComponent(component.id);
            }
        });
        
        // Paste connections
        this.clipboard.connections.forEach(connData => {
            const fromId = idMap.get(connData.fromComponentId);
            const toId = idMap.get(connData.toComponentId);
            
            if (fromId && toId) {
                const fromComponent = this.app.circuit.components.get(fromId);
                const toComponent = this.app.circuit.components.get(toId);
                
                if (fromComponent && toComponent) {
                    this.app.circuit.addConnection(
                        fromComponent,
                        { type: connData.fromPortType, index: connData.fromPortIndex },
                        toComponent,
                        { type: connData.toPortType, index: connData.toPortIndex }
                    );
                }
            }
        });
        
        this.showNotification('Pasted from clipboard');
    }
    
    // File operations
    newCircuit() {
        if (this.app.circuit.components.size > 0) {
            if (confirm('Create new circuit? Unsaved changes will be lost.')) {
                this.app.circuit.clear();
                this.showNotification('New circuit created');
            }
        }
    }
    
    saveCircuit() {
        const data = this.app.circuit.exportToJSON();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `logic_circuit_${new Date().getTime()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Circuit saved');
    }
    
    openCircuit() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        this.app.circuit.importFromJSON(e.target.result);
                        this.showNotification('Circuit loaded');
                    } catch (error) {
                        this.showNotification('Failed to load circuit', 'error');
                        console.error(error);
                    }
                };
                reader.readAsText(file);
            }
        });
        
        input.click();
    }
    
    exportImage() {
        const canvas = this.app.canvas;
        const link = document.createElement('a');
        link.download = `logic_circuit_${new Date().getTime()}.png`;
        
        // Create temporary canvas with white background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // White background
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw circuit
        tempCtx.drawImage(canvas, 0, 0);
        
        // Export
        link.href = tempCanvas.toDataURL();
        link.click();
        
        this.showNotification('Circuit exported as image');
    }
    
    clearAll() {
        if (confirm('Clear all components? This cannot be undone.')) {
            this.app.circuit.clear();
            this.showNotification('Circuit cleared');
        }
    }
    
    // View controls
    zoomIn() {
        const currentZoom = this.app.canvasManager.view.zoom;
        this.app.canvasManager.view.zoom = Math.min(5, currentZoom * 1.2);
        this.app.canvasManager.render();
    }
    
    zoomOut() {
        const currentZoom = this.app.canvasManager.view.zoom;
        this.app.canvasManager.view.zoom = Math.max(0.1, currentZoom / 1.2);
        this.app.canvasManager.render();
    }
    
    // Simulation controls
    toggleSimulation() {
        if (this.app.simulator.running) {
            this.app.simulator.pause();
        } else {
            this.app.simulator.resume();
        }
    }
    
    cycleWiringStyle() {
        const styles = ['bezier', 'straight', 'orthogonal'];
        const currentStyle = this.app.canvasManager.wireRoutingStyle || 'bezier';
        const currentIndex = styles.indexOf(currentStyle);
        const nextStyle = styles[(currentIndex + 1) % styles.length];
        
        this.app.circuit.connections.forEach(connection => {
            if (connection.wire) {
                connection.wire.setRoutingStyle(nextStyle);
            }
        });
        
        this.app.canvasManager.wireRoutingStyle = nextStyle;
        this.app.canvasManager.render();
        
        this.showNotification(`Wire style: ${nextStyle}`);
    }
    
    // Help and tutorials
    showHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'modal';
        helpModal.innerHTML = `
            <div class="modal-content">
                <h2>Logic Gate Simulator Help</h2>
                <div class="help-content">
                    <h3>Keyboard Shortcuts</h3>
                    <table class="shortcuts-table">
                        <tr><td>Ctrl+N</td><td>New Circuit</td></tr>
                        <tr><td>Ctrl+O</td><td>Open Circuit</td></tr>
                        <tr><td>Ctrl+S</td><td>Save Circuit</td></tr>
                        <tr><td>Ctrl+Z</td><td>Undo</td></tr>
                        <tr><td>Ctrl+Shift+Z</td><td>Redo</td></tr>
                        <tr><td>Ctrl+C</td><td>Copy</td></tr>
                        <tr><td>Ctrl+V</td><td>Paste</td></tr>
                        <tr><td>Delete</td><td>Delete Selected</td></tr>
                        <tr><td>Space</td><td>Play/Pause Simulation</td></tr>
                        <tr><td>G</td><td>Toggle Grid</td></tr>
                    </table>
                    
                    <h3>Mouse Controls</h3>
                    <ul>
                        <li>Left Click: Select component</li>
                        <li>Ctrl+Click: Add to selection</li>
                        <li>Drag: Move component or create selection box</li>
                        <li>Right Drag: Pan canvas</li>
                        <li>Scroll: Zoom in/out</li>
                        <li>Click output port: Start wiring</li>
                    </ul>
                </div>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(helpModal);
    }
    
    startTutorial() {
        // This would start an interactive tutorial
        this.showNotification('Tutorial coming soon!');
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `toolbar-notification ${type}`;
        notification.textContent = message;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}