class Simulator {
    constructor(circuit) {
        this.circuit = circuit;
        this.running = true;
        this.speed = 1; // Simulation speed multiplier
        this.updateInterval = 50; // milliseconds
        this.lastUpdate = Date.now();
        
        // Simulation state
        this.evaluationOrder = [];
        this.componentStates = new Map();
        this.previousStates = new Map();
        this.stateHistory = [];
        this.maxHistorySize = 100;
        
        // Performance monitoring
        this.stats = {
            evaluationsPerSecond: 0,
            totalEvaluations: 0,
            lastStatUpdate: Date.now(),
            evaluationCount: 0
        };
        
        // Oscillation detection
        this.oscillationDetector = {
            enabled: true,
            windowSize: 10,
            threshold: 5
        };
        
        // Event listeners
        this.listeners = new Map();
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up circuit listeners
        this.circuit.addEventListener('componentAdded', () => this.rebuild());
        this.circuit.addEventListener('componentRemoved', () => this.rebuild());
        this.circuit.addEventListener('connectionAdded', () => this.rebuild());
        this.circuit.addEventListener('connectionRemoved', () => this.rebuild());
        
        // Initial build
        this.rebuild();
    }
    
    rebuild() {
        // Rebuild evaluation order based on circuit topology
        this.evaluationOrder = this.calculateEvaluationOrder();
        this.resetStates();
    }
    
    calculateEvaluationOrder() {
        // Topological sort to determine evaluation order
        const order = [];
        const visited = new Set();
        const visiting = new Set();
        
        // Helper function for DFS
        const visit = (component) => {
            if (visited.has(component.id)) return;
            if (visiting.has(component.id)) {
                console.warn('Circular dependency detected in circuit');
                return;
            }
            
            visiting.add(component.id);
            
            // Visit all components that this one depends on
            if (component.inputConnections) {
                component.inputConnections.forEach(connection => {
                    if (connection && connection.fromComponent) {
                        visit(connection.fromComponent);
                    }
                });
            }
            
            visiting.delete(component.id);
            visited.add(component.id);
            order.push(component);
        };
        
        // Start with output components and work backwards
        const outputs = this.circuit.getComponentsByType('output');
        outputs.forEach(output => visit(output));
        
        // Also process any unvisited components (disconnected parts)
        this.circuit.components.forEach(component => {
            if (!visited.has(component.id)) {
                visit(component);
            }
        });
        
        return order;
    }
    
    simulate() {
        if (!this.running) return;
        
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) * this.speed;
        
        if (deltaTime >= this.updateInterval) {
            this.update(deltaTime);
            this.lastUpdate = now;
        }
    }
    
    update(deltaTime) {
        // Store previous states for comparison
        this.savePreviousStates();
        
        // Update time-based components (clocks, etc.)
        this.updateTimeBasedComponents(deltaTime);
        
        // Evaluate all components in order
        this.evaluateComponents();
        
        // Update connections/wires
        this.updateConnections(deltaTime);
        
        // Check for oscillations
        if (this.oscillationDetector.enabled) {
            this.detectOscillations();
        }
        
        // Update statistics
        this.updateStats();
        
        // Notify listeners
        this.notifyListeners('update', { deltaTime });
    }
    
    updateTimeBasedComponents(deltaTime) {
        this.circuit.components.forEach(component => {
            // Update clock components
            if (component.type === 'input' && component.subtype === 'clock') {
                if (component.enabled) {
                    const period = 1000 / component.frequency;
                    const elapsed = Date.now() - component.lastToggle;
                    
                    if (elapsed >= period / 2) {
                        component.value = !component.value;
                        component.lastToggle = Date.now();
                        
                        // Trigger wire animation for connected outputs
                        component.outputConnections.forEach(conn => {
                            if (conn.wire) {
                                conn.wire.startSignalAnimation();
                            }
                        });
                    }
                }
            }
            
            // Update any animated components
            if (component.update) {
                component.update(deltaTime);
            }
        });
    }
    
    evaluateComponents() {
        // Evaluate in topological order
        this.evaluationOrder.forEach(component => {
            if (component.evaluate) {
                const previousOutput = component.output;
                component.evaluate();
                
                // Track state changes
                if (component.output !== previousOutput) {
                    this.componentStates.set(component.id, {
                        output: component.output,
                        changed: true,
                        timestamp: Date.now()
                    });
                    
                    // Trigger animations for state changes
                    if (component.outputConnections) {
                        component.outputConnections.forEach(conn => {
                            if (conn.wire && component.output) {
                                conn.wire.startSignalAnimation();
                            }
                        });
                    }
                } else {
                    const state = this.componentStates.get(component.id) || {};
                    state.changed = false;
                    this.componentStates.set(component.id, state);
                }
                
                this.stats.evaluationCount++;
            }
        });
    }
    
    updateConnections(deltaTime) {
        this.circuit.connections.forEach(connection => {
            // Update wire animations
            if (connection.wire) {
                connection.wire.update(deltaTime);
            }
            
            // Propagate values through connections
            if (connection.fromComponent && connection.toComponent) {
                const value = connection.fromComponent.output || false;
                
                // Special handling for connection types
                if (connection.getValue) {
                    connection.getValue = () => value;
                }
            }
        });
    }
    
    savePreviousStates() {
        this.previousStates.clear();
        this.componentStates.forEach((state, componentId) => {
            this.previousStates.set(componentId, { ...state });
        });
    }
    
    detectOscillations() {
        // Simple oscillation detection
        const currentSnapshot = this.createStateSnapshot();
        this.stateHistory.push(currentSnapshot);
        
        if (this.stateHistory.length > this.oscillationDetector.windowSize) {
            this.stateHistory.shift();
        }
        
        // Check for repeating patterns
        if (this.stateHistory.length >= this.oscillationDetector.windowSize) {
            const patterns = new Map();
            
            for (let i = 0; i < this.stateHistory.length - 1; i++) {
                const pattern = this.stateHistory[i];
                const count = patterns.get(pattern) || 0;
                patterns.set(pattern, count + 1);
                
                if (count + 1 >= this.oscillationDetector.threshold) {
                    this.notifyListeners('oscillationDetected', {
                        pattern: pattern,
                        frequency: count + 1
                    });
                    
                    // Reset history to avoid spam
                    this.stateHistory = [];
                    break;
                }
            }
        }
    }
    
    createStateSnapshot() {
        // Create a string representation of current circuit state
        const states = [];
        this.circuit.components.forEach(component => {
            if (component.output !== undefined) {
                states.push(`${component.id}:${component.output ? '1' : '0'}`);
            }
        });
        return states.sort().join(',');
    }
    
    updateStats() {
        const now = Date.now();
        const elapsed = now - this.stats.lastStatUpdate;
        
        if (elapsed >= 1000) {
            this.stats.evaluationsPerSecond = Math.round(
                (this.stats.evaluationCount / elapsed) * 1000
            );
            this.stats.totalEvaluations += this.stats.evaluationCount;
            this.stats.evaluationCount = 0;
            this.stats.lastStatUpdate = now;
            
            this.notifyListeners('statsUpdate', this.stats);
        }
    }
    
    // Control methods
    start() {
        this.running = true;
        this.lastUpdate = Date.now();
        this.notifyListeners('started', null);
    }
    
    stop() {
        this.running = false;
        this.notifyListeners('stopped', null);
    }
    
    pause() {
        this.running = false;
        this.notifyListeners('paused', null);
    }
    
    resume() {
        this.running = true;
        this.lastUpdate = Date.now();
        this.notifyListeners('resumed', null);
    }
    
    step() {
        // Single step simulation
        const wasRunning = this.running;
        this.running = true;
        this.update(this.updateInterval);
        this.running = wasRunning;
        this.notifyListeners('stepped', null);
    }
    
    reset() {
        // Reset all components to initial state
        this.circuit.components.forEach(component => {
            if (component.type === 'input') {
                switch (component.subtype) {
                    case 'switch':
                        component.value = false;
                        component.output = false;
                        break;
                    case 'clock':
                        component.value = false;
                        component.output = false;
                        component.lastToggle = Date.now();
                        break;
                    case 'high':
                        component.value = true;
                        component.output = true;
                        break;
                    case 'low':
                        component.value = false;
                        component.output = false;
                        break;
                }
            } else if (component.reset) {
                component.reset();
            }
        });
        
        this.resetStates();
        this.rebuild();
        this.notifyListeners('reset', null);
    }
    
    resetStates() {
        this.componentStates.clear();
        this.previousStates.clear();
        this.stateHistory = [];
        this.stats.evaluationCount = 0;
        this.stats.totalEvaluations = 0;
    }
    
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(10, speed));
        this.notifyListeners('speedChanged', this.speed);
    }
    
    // State access methods
    getComponentState(componentId) {
        return this.componentStates.get(componentId);
    }
    
    getAllStates() {
        const states = {};
        this.componentStates.forEach((state, id) => {
            states[id] = state;
        });
        return states;
    }
    
    // Debugging methods
    traceSignal(componentId) {
        const component = this.circuit.components.get(componentId);
        if (!component) return null;
        
        const trace = {
            component: component,
            inputs: [],
            output: component.output,
            path: []
        };
        
        // Trace backwards through inputs
        if (component.inputConnections) {
            component.inputConnections.forEach((connection, index) => {
                if (connection && connection.fromComponent) {
                    trace.inputs.push({
                        index: index,
                        from: connection.fromComponent.id,
                        value: connection.fromComponent.output
                    });
                }
            });
        }
        
        return trace;
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
}