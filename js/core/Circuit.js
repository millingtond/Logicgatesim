class Circuit {
    constructor() {
        this.components = new Map(); // Using Map for O(1) lookup by ID
        this.connections = new Map();
        this.history = []; // For undo/redo functionality
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this.idCounter = 0;
        this.selectedComponents = new Set();
        this.listeners = new Map(); // Event listeners for circuit changes
    }
    
    // Generate unique IDs
    generateId(prefix = 'component') {
        return `${prefix}-${Date.now()}-${this.idCounter++}`;
    }
    
    // Add a component to the circuit
    addComponent(component) {
        if (!component.id) {
            component.id = this.generateId(component.type);
        }
        
        this.components.set(component.id, component);
        this.saveToHistory();
        this.notifyListeners('componentAdded', component);
        
        return component;
    }
    
    // Remove a component and all its connections
    removeComponent(componentId) {
        const component = this.components.get(componentId);
        if (!component) return false;
        
        // Remove all connections to/from this component
        const connectionsToRemove = [];
        this.connections.forEach((connection, id) => {
            if (connection.fromComponent.id === componentId || 
                connection.toComponent.id === componentId) {
                connectionsToRemove.push(id);
            }
        });
        
        connectionsToRemove.forEach(id => this.removeConnection(id));
        
        // Remove the component
        this.components.delete(componentId);
        this.selectedComponents.delete(componentId);
        
        this.saveToHistory();
        this.notifyListeners('componentRemoved', component);
        
        return true;
    }
    
    // Add a connection between components
    addConnection(fromComponent, fromPort, toComponent, toPort) {
        // Validate connection
        if (!this.isValidConnection(fromComponent, fromPort, toComponent, toPort)) {
            return null;
        }
        
        // Remove existing connection to the input port (inputs can only have one connection)
        if (toPort.type === 'input') {
            this.connections.forEach((connection, id) => {
                if (connection.toComponent.id === toComponent.id && 
                    connection.toPort.index === toPort.index) {
                    this.removeConnection(id);
                }
            });
        }
        
const connection = {
    id: this.generateId('connection'),
    fromComponent: fromComponent,  // This is the actual component object
    fromPort: fromPort,
    toComponent: toComponent,      // This is the actual component object
    toPort: toPort,
    selected: false
};
        
        this.connections.set(connection.id, connection);
        
        // Update component's connection references
        if (fromComponent.outputConnections) {
            fromComponent.outputConnections.push(connection);
        }
        if (toComponent.inputConnections && toPort.type === 'input') {
            toComponent.inputConnections[toPort.index] = connection;
        }
        
        this.saveToHistory();
        this.notifyListeners('connectionAdded', connection);
        
        return connection;
    }
    
    // Remove a connection
    removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return false;
        
        // Remove references from components
        if (connection.fromComponent.outputConnections) {
            const index = connection.fromComponent.outputConnections.indexOf(connection);
            if (index > -1) {
                connection.fromComponent.outputConnections.splice(index, 1);
            }
        }
        
        if (connection.toComponent.inputConnections && connection.toPort.type === 'input') {
            connection.toComponent.inputConnections[connection.toPort.index] = null;
        }
        
        this.connections.delete(connectionId);
        
        this.saveToHistory();
        this.notifyListeners('connectionRemoved', connection);
        
        return true;
    }
    
    // Validate if a connection is allowed
    isValidConnection(fromComponent, fromPort, toComponent, toPort) {
        // Can't connect to itself
        if (fromComponent.id === toComponent.id) {
            return false;
        }
        
        // Output must connect to input
        if (fromPort.type !== 'output' || toPort.type !== 'input') {
            return false;
        }
        
        // Check for circular dependencies
        if (this.wouldCreateCycle(fromComponent, toComponent)) {
            return false;
        }
        
        return true;
    }
    
    // Check if adding a connection would create a cycle
    wouldCreateCycle(fromComponent, toComponent) {
        const visited = new Set();
        const recStack = new Set();
        
        const hasCycle = (componentId) => {
            visited.add(componentId);
            recStack.add(componentId);
            
            const component = this.components.get(componentId);
            if (!component) return false;
            
            // Get all components this one connects to
            const connections = Array.from(this.connections.values()).filter(
                conn => conn.fromComponent.id === componentId
            );
            
            for (const conn of connections) {
                const nextId = conn.toComponent.id;
                
                if (!visited.has(nextId)) {
                    if (hasCycle(nextId)) return true;
                } else if (recStack.has(nextId)) {
                    return true;
                }
            }
            
            recStack.delete(componentId);
            return false;
        };
        
        // Temporarily add the connection to check
        const tempConnection = {
            fromComponent: fromComponent,
            toComponent: toComponent
        };
        
        // Check if adding this connection would create a cycle
        return hasCycle(toComponent.id);
    }
    
    // Get component at a specific position
    getComponentAt(x, y) {
        for (const [id, component] of this.components) {
            if (component.isPointInside && component.isPointInside(x, y)) {
                return component;
            }
        }
        return null;
    }
    
    // Get connection at a specific position
    getConnectionAt(x, y, threshold = 5) {
        for (const [id, connection] of this.connections) {
            const from = this.getPortPosition(connection.fromComponent, connection.fromPort);
            const to = this.getPortPosition(connection.toComponent, connection.toPort);
            
            // Check if point is near the connection line
            if (this.isPointNearLine(x, y, from.x, from.y, to.x, to.y, threshold)) {
                return connection;
            }
        }
        return null;
    }
    
    // Helper to check if a point is near a line
    isPointNearLine(px, py, x1, y1, x2, y2, threshold) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= threshold;
    }
    
    // Get the position of a port
    getPortPosition(component, port) {
        if (port.type === 'input') {
            return component.getInputPosition(port.index);
        } else {
            return component.getOutputPosition();
        }
    }
    
    // Selection methods
    selectComponent(componentId) {
        const component = this.components.get(componentId);
        if (component) {
            component.selected = true;
            this.selectedComponents.add(componentId);
            this.notifyListeners('selectionChanged', this.selectedComponents);
        }
    }
    
    deselectComponent(componentId) {
        const component = this.components.get(componentId);
        if (component) {
            component.selected = false;
            this.selectedComponents.delete(componentId);
            this.notifyListeners('selectionChanged', this.selectedComponents);
        }
    }
    
    clearSelection() {
        this.selectedComponents.forEach(id => {
            const component = this.components.get(id);
            if (component) component.selected = false;
        });
        this.selectedComponents.clear();
        this.notifyListeners('selectionChanged', this.selectedComponents);
    }
    
    selectAll() {
        this.components.forEach((component, id) => {
            component.selected = true;
            this.selectedComponents.add(id);
        });
        this.notifyListeners('selectionChanged', this.selectedComponents);
    }
    
    // Delete selected components
    deleteSelected() {
        const toDelete = Array.from(this.selectedComponents);
        toDelete.forEach(id => this.removeComponent(id));
        this.clearSelection();
    }
    
    // Move components
    moveComponent(componentId, dx, dy) {
        const component = this.components.get(componentId);
        if (component) {
            component.x += dx;
            component.y += dy;
            this.notifyListeners('componentMoved', component);
        }
    }
    
    moveSelected(dx, dy) {
        this.selectedComponents.forEach(id => {
            this.moveComponent(id, dx, dy);
        });
        this.saveToHistory();
    }
    
    // History management
    saveToHistory() {
        // Remove any history after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Create snapshot
        const snapshot = {
            components: this.serializeComponents(),
            connections: this.serializeConnections()
        };
        
        this.history.push(snapshot);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadFromSnapshot(this.history[this.historyIndex]);
            this.notifyListeners('historyChanged', 'undo');
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadFromSnapshot(this.history[this.historyIndex]);
            this.notifyListeners('historyChanged', 'redo');
        }
    }
    
    // Serialization
    serializeComponents() {
        const serialized = [];
        this.components.forEach(component => {
            serialized.push({
                id: component.id,
                type: component.type,
                subtype: component.subtype,
                x: component.x,
                y: component.y,
                inputs: component.inputs,
                output: component.output,
                label: component.label,
                value: component.value
            });
        });
        return serialized;
    }
    
    serializeConnections() {
        const serialized = [];
        this.connections.forEach(connection => {
            serialized.push({
                id: connection.id,
                fromComponentId: connection.fromComponent.id,
                fromPortType: connection.fromPort.type,
                fromPortIndex: connection.fromPort.index,
                toComponentId: connection.toComponent.id,
                toPortType: connection.toPort.type,
                toPortIndex: connection.toPort.index
            });
        });
        return serialized;
    }
    
    loadFromSnapshot(snapshot) {
        // Clear current circuit
        this.clear();
        
        // Load components
        snapshot.components.forEach(compData => {
            let component;
            if (compData.type === 'gate') {
                component = new Gate(compData.subtype, compData.x, compData.y, compData.id);
            } else if (compData.type === 'input') {
                component = new InputComponent(compData.subtype, compData.x, compData.y, compData.id);
                component.value = compData.value;
            } else if (compData.type === 'output') {
                component = new OutputComponent(compData.subtype, compData.x, compData.y, compData.id);
            }
            
            if (component) {
                component.label = compData.label;
                this.components.set(component.id, component);
            }
        });
        
        // Load connections
        snapshot.connections.forEach(connData => {
            const fromComponent = this.components.get(connData.fromComponentId);
            const toComponent = this.components.get(connData.toComponentId);
            
            if (fromComponent && toComponent) {
                const fromPort = {
                    type: connData.fromPortType,
                    index: connData.fromPortIndex
                };
                const toPort = {
                    type: connData.toPortType,
                    index: connData.toPortIndex
                };
                
                this.addConnection(fromComponent, fromPort, toComponent, toPort);
            }
        });
    }
        loadFromData(data) {
        // If data has components and connections, use loadFromSnapshot
        if (data && data.components && data.connections) {
            this.loadFromSnapshot(data);
        } else {
            console.error('Invalid circuit data format');
        }
    }
    
    // Clear the circuit
    clear() {
        this.components.clear();
        this.connections.clear();
        this.selectedComponents.clear();
        this.notifyListeners('circuitCleared', null);
    }
    
    // Event listener management
    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    removeEventListener(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                callback(data);
            });
        }
    }
    
    // Export/Import functionality
    exportToJSON() {
        return JSON.stringify({
            components: this.serializeComponents(),
            connections: this.serializeConnections(),
            metadata: {
                version: '1.0',
                created: new Date().toISOString()
            }
        }, null, 2);
    }
    
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.loadFromSnapshot(data);
            this.saveToHistory();
            return true;
        } catch (error) {
            console.error('Failed to import circuit:', error);
            return false;
        }
    }
    
    // Get all components of a specific type
    getComponentsByType(type) {
        const result = [];
        this.components.forEach(component => {
            if (component.type === type) {
                result.push(component);
            }
        });
        return result;
    }
    
    // Get the boolean expression for the circuit
    getExpression() {
        const analyzer = new CircuitAnalyzer(this);
        return analyzer.generateExpression();
    }
    
    // Get truth table for the circuit
    getTruthTable() {
        const analyzer = new CircuitAnalyzer(this);
        return analyzer.generateTruthTable();
    }
}