class CircuitAnalyzer {
    constructor(circuit) {
        this.circuit = circuit;
        this.analyzed = false;
        this.analysis = {
            inputs: [],
            outputs: [],
            gates: [],
            connections: [],
            expression: '',
            complexity: 0,
            depth: 0,
            warnings: []
        };
    }
    
    analyze() {
        this.reset();
        
        // Identify components
        this.identifyComponents();
        
        // Check for issues
        this.checkCircuitValidity();
        
        // Calculate circuit properties
        this.calculateDepth();
        this.calculateComplexity();
        
        // Generate expression
        if (this.analysis.outputs.length > 0) {
            this.analysis.expression = this.generateExpression();
        }
        
        this.analyzed = true;
        return this.analysis;
    }
    
    reset() {
        this.analysis = {
            inputs: [],
            outputs: [],
            gates: [],
            connections: [],
            expression: '',
            complexity: 0,
            depth: 0,
            warnings: []
        };
        this.analyzed = false;
    }
    
    identifyComponents() {
        this.circuit.components.forEach(component => {
            if (component.type === 'input') {
                this.analysis.inputs.push({
                    id: component.id,
                    label: component.label || component.id,
                    subtype: component.subtype
                });
            } else if (component.type === 'output') {
                this.analysis.outputs.push({
                    id: component.id,
                    label: component.label || component.id,
                    subtype: component.subtype
                });
            } else if (component.type === 'gate') {
                this.analysis.gates.push({
                    id: component.id,
                    subtype: component.subtype,
                    inputs: component.inputConnections ? component.inputConnections.length : 0
                });
            }
        });
        
        this.circuit.connections.forEach(connection => {
            this.analysis.connections.push({
                from: connection.fromComponent.id,
                to: connection.toComponent.id
            });
        });
    }
    
    checkCircuitValidity() {
        // Check for unconnected inputs
        this.circuit.components.forEach(component => {
            if (component.type === 'gate') {
                const connectedInputs = component.inputConnections.filter(c => c !== null).length;
                if (connectedInputs < component.inputConnections.length) {
                    this.analysis.warnings.push({
                        type: 'unconnected_input',
                        componentId: component.id,
                        message: `Gate ${component.id} has unconnected inputs`
                    });
                }
            }
        });
        
        // Check for feedback loops
        if (this.hasCycles()) {
            this.analysis.warnings.push({
                type: 'feedback_loop',
                message: 'Circuit contains feedback loops'
            });
        }
        
        // Check for floating outputs
        this.analysis.outputs.forEach(output => {
            const component = this.circuit.components.get(output.id);
            if (component && !component.inputConnections[0]) {
                this.analysis.warnings.push({
                    type: 'floating_output',
                    componentId: output.id,
                    message: `Output ${output.label} is not connected`
                });
            }
        });
    }
    
    hasCycles() {
        const visited = new Set();
        const recursionStack = new Set();
        
        const hasCycleDFS = (componentId) => {
            visited.add(componentId);
            recursionStack.add(componentId);
            
            // Get all components this one connects to
            const connections = this.analysis.connections.filter(c => c.from === componentId);
            
            for (const conn of connections) {
                if (!visited.has(conn.to)) {
                    if (hasCycleDFS(conn.to)) return true;
                } else if (recursionStack.has(conn.to)) {
                    return true;
                }
            }
            
            recursionStack.delete(componentId);
            return false;
        };
        
        // Check from each component
        for (const component of this.circuit.components.values()) {
            if (!visited.has(component.id)) {
                if (hasCycleDFS(component.id)) return true;
            }
        }
        
        return false;
    }
    
    calculateDepth() {
        const depths = new Map();
        
        // Initialize inputs with depth 0
        this.analysis.inputs.forEach(input => {
            depths.set(input.id, 0);
        });
        
        // Calculate depth for each component
        const calculateComponentDepth = (componentId) => {
            if (depths.has(componentId)) {
                return depths.get(componentId);
            }
            
            const component = this.circuit.components.get(componentId);
            if (!component) return 0;
            
            let maxInputDepth = 0;
            
            if (component.inputConnections) {
                component.inputConnections.forEach(conn => {
                    if (conn && conn.fromComponent) {
                        const inputDepth = calculateComponentDepth(conn.fromComponent.id);
                        maxInputDepth = Math.max(maxInputDepth, inputDepth);
                    }
                });
            }
            
            const depth = maxInputDepth + 1;
            depths.set(componentId, depth);
            return depth;
        };
        
        // Calculate depth for all components
        this.circuit.components.forEach(component => {
            calculateComponentDepth(component.id);
        });
        
        // Find maximum depth
        this.analysis.depth = Math.max(...Array.from(depths.values()));
    }
    
    calculateComplexity() {
        // Simple complexity metric based on gate count and types
        let complexity = 0;
        
        const gateWeights = {
            'NOT': 1,
            'AND': 2,
            'OR': 2,
            'XOR': 3,
            'NAND': 2.5,
            'NOR': 2.5
        };
        
        this.analysis.gates.forEach(gate => {
            complexity += gateWeights[gate.subtype] || 1;
        });
        
        // Add complexity for depth
        complexity += this.analysis.depth * 0.5;
        
        this.analysis.complexity = complexity;
    }
    
    generateExpression() {
        if (this.analysis.outputs.length === 0) return '';
        
        // Generate expression for the first output
        const outputId = this.analysis.outputs[0].id;
        const output = this.circuit.components.get(outputId);
        
        if (!output || !output.inputConnections[0]) return '';
        
        return this.generateNodeExpression(output.inputConnections[0].fromComponent);
    }
    
    generateNodeExpression(component) {
        if (!component) return '';
        
        if (component.type === 'input') {
            return component.label || component.id;
        }
        
        if (component.type === 'gate') {
            const inputs = [];
            
            if (component.inputConnections) {
                component.inputConnections.forEach(conn => {
                    if (conn && conn.fromComponent) {
                        inputs.push(this.generateNodeExpression(conn.fromComponent));
                    }
                });
            }
            
            switch (component.subtype) {
                case 'NOT':
                    return inputs[0] ? `NOT ${inputs[0]}` : '';
                    
                case 'AND':
                    return inputs.length === 2 ? `(${inputs[0]} AND ${inputs[1]})` : '';
                    
                case 'OR':
                    return inputs.length === 2 ? `(${inputs[0]} OR ${inputs[1]})` : '';
                    
                case 'XOR':
                    return inputs.length === 2 ? `(${inputs[0]} XOR ${inputs[1]})` : '';
                    
                case 'NAND':
                    return inputs.length === 2 ? `NOT (${inputs[0]} AND ${inputs[1]})` : '';
                    
                case 'NOR':
                    return inputs.length === 2 ? `NOT (${inputs[0]} OR ${inputs[1]})` : '';
                    
                default:
                    return '';
            }
        }
        
        return '';
    }
    
    getSummary() {
        if (!this.analyzed) {
            this.analyze();
        }
        
        return {
            inputCount: this.analysis.inputs.length,
            outputCount: this.analysis.outputs.length,
            gateCount: this.analysis.gates.length,
            connectionCount: this.analysis.connections.length,
            depth: this.analysis.depth,
            complexity: this.analysis.complexity,
            hasWarnings: this.analysis.warnings.length > 0,
            warnings: this.analysis.warnings
        };
    }
    
    getGateUsage() {
        const usage = {};
        
        this.analysis.gates.forEach(gate => {
            usage[gate.subtype] = (usage[gate.subtype] || 0) + 1;
        });
        
        return usage;
    }
    
    suggestOptimizations() {
        const suggestions = [];
        
        // Check for double negation
        this.circuit.components.forEach(component => {
            if (component.type === 'gate' && component.subtype === 'NOT') {
                const input = component.inputConnections[0];
                if (input && input.fromComponent && 
                    input.fromComponent.type === 'gate' && 
                    input.fromComponent.subtype === 'NOT') {
                    suggestions.push({
                        type: 'double_negation',
                        components: [component.id, input.fromComponent.id],
                        message: 'Double negation can be removed'
                    });
                }
            }
        });
        
        // Check for redundant gates (A AND A = A, A OR A = A)
        this.circuit.components.forEach(component => {
            if (component.type === 'gate' && 
                (component.subtype === 'AND' || component.subtype === 'OR')) {
                if (component.inputConnections[0] && component.inputConnections[1]) {
                    const input1 = component.inputConnections[0].fromComponent;
                    const input2 = component.inputConnections[1].fromComponent;
                    
                    if (input1 && input2 && input1.id === input2.id) {
                        suggestions.push({
                            type: 'redundant_gate',
                            component: component.id,
                            message: `${component.subtype} gate with identical inputs can be simplified`
                        });
                    }
                }
            }
        });
        
        return suggestions;
    }
    
    exportAnalysis() {
        if (!this.analyzed) {
            this.analyze();
        }
        
        return {
            timestamp: new Date().toISOString(),
            circuit: {
                inputs: this.analysis.inputs,
                outputs: this.analysis.outputs,
                gates: this.analysis.gates,
                connections: this.analysis.connections
            },
            properties: {
                expression: this.analysis.expression,
                depth: this.analysis.depth,
                complexity: this.analysis.complexity
            },
            gateUsage: this.getGateUsage(),
            warnings: this.analysis.warnings,
            optimizations: this.suggestOptimizations()
        };
    }
}