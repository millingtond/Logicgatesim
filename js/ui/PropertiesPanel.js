class PropertiesPanel {
    constructor(circuit) {
        this.circuit = circuit;
        this.container = document.querySelector('.properties-panel');
        this.selectedComponent = null;
        this.expressionDisplay = null;
        this.truthTableContainer = null;
        this.componentPropertiesContainer = null;
        
        this.init();
    }
    
    init() {
        this.setupContainers();
        this.setupEventListeners();
        this.render();
    }
    
    setupContainers() {
        // Expression display
        const expressionSection = document.getElementById('expression-display');
        if (!expressionSection) {
            const section = document.createElement('section');
            section.className = 'panel-section';
            section.innerHTML = `
                <h3>Boolean Expression</h3>
                <div class="expression-display" id="expression-display">
                    <p class="expression-text">No circuit</p>
                </div>
                <div class="expression-controls">
                    <button class="btn-small" id="copy-expression">Copy</button>
                    <button class="btn-small" id="simplify-expression">Simplify</button>
                </div>
            `;
            this.container.appendChild(section);
        }
        this.expressionDisplay = document.getElementById('expression-display');
        
        // Truth table container
        if (!document.getElementById('truth-table-container')) {
            const section = document.createElement('section');
            section.className = 'panel-section';
            section.innerHTML = `
                <h3>Truth Table</h3>
                <div class="truth-table-container" id="truth-table-container">
                    <p class="placeholder-text">Build a circuit to see truth table</p>
                </div>
                <div class="truth-table-controls">
                    <button class="btn-small" id="export-truth-table">Export CSV</button>
                    <button class="btn-small" id="show-k-map">K-Map</button>
                </div>
            `;
            this.container.appendChild(section);
        }
        this.truthTableContainer = document.getElementById('truth-table-container');
        
        // Component properties
        const propertiesSection = document.createElement('section');
        propertiesSection.className = 'panel-section';
        propertiesSection.id = 'component-properties-section';
        propertiesSection.innerHTML = `
            <h3>Component Properties</h3>
            <div class="component-properties" id="component-properties">
                <p class="placeholder-text">Select a component to view properties</p>
            </div>
        `;
        this.container.appendChild(propertiesSection);
        this.componentPropertiesContainer = document.getElementById('component-properties');
        
        // Circuit analysis
        const analysisSection = document.createElement('section');
        analysisSection.className = 'panel-section';
        analysisSection.innerHTML = `
            <h3>Circuit Analysis</h3>
            <div class="circuit-analysis" id="circuit-analysis">
                <div class="analysis-item">
                    <span class="label">Components:</span>
                    <span class="value" id="component-count">0</span>
                </div>
                <div class="analysis-item">
                    <span class="label">Connections:</span>
                    <span class="value" id="connection-count">0</span>
                </div>
                <div class="analysis-item">
                    <span class="label">Depth:</span>
                    <span class="value" id="circuit-depth">0</span>
                </div>
                <div class="analysis-item">
                    <span class="label">Complexity:</span>
                    <span class="value" id="circuit-complexity">0</span>
                </div>
            </div>
            <div class="analysis-warnings" id="analysis-warnings"></div>
        `;
        this.container.appendChild(analysisSection);
    }
    
    setupEventListeners() {
        // Circuit events
        this.circuit.addEventListener('selectionChanged', (selection) => {
            this.handleSelectionChange(selection);
        });
        
        this.circuit.addEventListener('componentAdded', () => this.update());
        this.circuit.addEventListener('componentRemoved', () => this.update());
        this.circuit.addEventListener('connectionAdded', () => this.update());
        this.circuit.addEventListener('connectionRemoved', () => this.update());
        
        // Button events
        document.getElementById('copy-expression').addEventListener('click', () => {
            this.copyExpression();
        });
        
        document.getElementById('simplify-expression').addEventListener('click', () => {
            this.simplifyExpression();
        });
        
        document.getElementById('export-truth-table').addEventListener('click', () => {
            this.exportTruthTable();
        });
        
        document.getElementById('show-k-map').addEventListener('click', () => {
            this.showKarnaughMap();
        });
    }
    
    render() {
        this.updateExpression();
        this.updateTruthTable();
        this.updateAnalysis();
        this.updateComponentProperties();
    }
    
    update() {
        this.render();
    }
    
    updateExpression() {
        const analyzer = new CircuitAnalyzer(this.circuit);
        const analysis = analyzer.analyze();
        
        const expressionText = this.expressionDisplay.querySelector('.expression-text');
        if (analysis.expression) {
            expressionText.innerHTML = `
                <div class="expression-main">${this.formatExpression(analysis.expression)}</div>
                <div class="expression-info">
                    <span class="inputs">Inputs: ${analysis.inputs.map(i => i.label).join(', ')}</span>
                    <span class="outputs">Outputs: ${analysis.outputs.map(o => o.label).join(', ')}</span>
                </div>
            `;
        } else {
            expressionText.innerHTML = '<p class="placeholder-text">No complete circuit</p>';
        }
    }
    
    formatExpression(expression) {
        // Format expression with better typography
        return expression
            .replace(/AND/g, '<span class="operator">∧</span>')
            .replace(/OR/g, '<span class="operator">∨</span>')
            .replace(/NOT/g, '<span class="operator">¬</span>')
            .replace(/XOR/g, '<span class="operator">⊕</span>')
            .replace(/\(/g, '<span class="paren">(</span>')
            .replace(/\)/g, '<span class="paren">)</span>');
    }
    
    updateTruthTable() {
        const generator = new TruthTableGenerator(this.circuit);
        const tableHTML = generator.generateHTML();
        
        this.truthTableContainer.innerHTML = tableHTML;
        
        // Add interactivity
        const table = this.truthTableContainer.querySelector('table');
        if (table) {
            this.addTruthTableInteractivity(table);
        }
    }
    
    addTruthTableInteractivity(table) {
        // Highlight rows on hover
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            row.addEventListener('mouseenter', () => {
                row.classList.add('highlighted');
                // Could highlight corresponding circuit state
                this.highlightCircuitState(index);
            });
            
            row.addEventListener('mouseleave', () => {
                row.classList.remove('highlighted');
                this.clearCircuitHighlight();
            });
        });
    }
    
    highlightCircuitState(rowIndex) {
        // This would set the circuit to show the state for this truth table row
        // Implementation depends on how you want to visualize it
    }
    
    clearCircuitHighlight() {
        // Clear any circuit highlighting
    }
    
    updateAnalysis() {
        const analyzer = new CircuitAnalyzer(this.circuit);
        const summary = analyzer.getSummary();
        
        document.getElementById('component-count').textContent = 
            summary.inputCount + summary.outputCount + summary.gateCount;
        document.getElementById('connection-count').textContent = summary.connectionCount;
        document.getElementById('circuit-depth').textContent = summary.depth;
        document.getElementById('circuit-complexity').textContent = 
            summary.complexity.toFixed(1);
        
        // Show warnings
        const warningsContainer = document.getElementById('analysis-warnings');
        if (summary.hasWarnings) {
            warningsContainer.innerHTML = `
                <div class="warning-header">⚠️ Issues Found:</div>
                ${summary.warnings.map(w => `
                    <div class="warning-item">${w.message}</div>
                `).join('')}
            `;
        } else {
            warningsContainer.innerHTML = '';
        }
    }
    
    updateComponentProperties() {
        if (this.selectedComponent) {
            this.showComponentProperties(this.selectedComponent);
        } else {
            this.componentPropertiesContainer.innerHTML = 
                '<p class="placeholder-text">Select a component to view properties</p>';
        }
    }
    
    handleSelectionChange(selection) {
        if (selection.size === 1) {
            const componentId = Array.from(selection)[0];
            this.selectedComponent = this.circuit.components.get(componentId);
            this.updateComponentProperties();
        } else {
            this.selectedComponent = null;
            this.updateComponentProperties();
        }
    }
    
    showComponentProperties(component) {
        let propertiesHTML = `
            <div class="property-item">
                <span class="label">Type:</span>
                <span class="value">${component.type}</span>
            </div>
            <div class="property-item">
                <span class="label">ID:</span>
                <span class="value">${component.id}</span>
            </div>
        `;
        
        // Component-specific properties
        if (component.type === 'gate') {
            propertiesHTML += this.getGateProperties(component);
        } else if (component.type === 'input') {
            propertiesHTML += this.getInputProperties(component);
        } else if (component.type === 'output') {
            propertiesHTML += this.getOutputProperties(component);
        }
        
        // Label editor
        propertiesHTML += `
            <div class="property-item">
                <span class="label">Label:</span>
                <input type="text" 
                       class="property-input" 
                       id="component-label" 
                       value="${component.label || ''}" 
                       placeholder="Enter label">
            </div>
        `;
        
        // Position
        propertiesHTML += `
            <div class="property-item">
                <span class="label">Position:</span>
                <span class="value">X: ${Math.round(component.x)}, Y: ${Math.round(component.y)}</span>
            </div>
        `;
        
        this.componentPropertiesContainer.innerHTML = propertiesHTML;
        
        // Setup property change handlers
        this.setupPropertyHandlers(component);
    }
    
    getGateProperties(gate) {
        let html = `
            <div class="property-item">
                <span class="label">Gate Type:</span>
                <span class="value">${gate.subtype}</span>
            </div>
            <div class="property-item">
                <span class="label">Inputs:</span>
                <span class="value">${gate.inputs || 2}</span>
            </div>
            <div class="property-item">
                <span class="label">Current Output:</span>
                <span class="value ${gate.output ? 'high' : 'low'}">${gate.output ? '1' : '0'}</span>
            </div>
        `;
        
        // Truth table for this gate
        html += `
            <div class="gate-truth-table">
                <h4>Truth Table</h4>
                ${this.getGateTruthTableHTML(gate.subtype)}
            </div>
        `;
        
        return html;
    }
    
    getInputProperties(input) {
        let html = `
            <div class="property-item">
                <span class="label">Input Type:</span>
                <span class="value">${input.subtype}</span>
            </div>
            <div class="property-item">
                <span class="label">Current Value:</span>
                <span class="value ${input.value ? 'high' : 'low'}">${input.value ? '1' : '0'}</span>
            </div>
        `;
        
        // Clock-specific properties
        if (input.subtype === 'clock') {
            html += `
                <div class="property-item">
                    <span class="label">Frequency:</span>
                    <div class="property-control">
                        <input type="range" 
                               id="clock-frequency" 
                               min="0.1" 
                               max="10" 
                               step="0.1" 
                               value="${input.frequency}">
                        <span class="value">${input.frequency} Hz</span>
                    </div>
                </div>
                <div class="property-item">
                    <span class="label">Enabled:</span>
                    <label class="switch">
                        <input type="checkbox" 
                               id="clock-enabled" 
                               ${input.enabled ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            `;
        }
        
        return html;
    }
    
    getOutputProperties(output) {
        let html = `
            <div class="property-item">
                <span class="label">Output Type:</span>
                <span class="value">${output.subtype}</span>
            </div>
            <div class="property-item">
                <span class="label">Current Value:</span>
                <span class="value ${output.value ? 'high' : 'low'}">${output.value ? '1' : '0'}</span>
            </div>
        `;
        
        // Display-specific properties
        if (output.subtype === 'display') {
            html += `
                <div class="property-item">
                    <span class="label">Display Value:</span>
                    <span class="value">${output.value.toString(16).toUpperCase()}</span>
                </div>
            `;
        }
        
        // Speaker-specific properties
        if (output.subtype === 'speaker') {
            html += `
                <div class="property-item">
                    <span class="label">Frequency:</span>
                    <div class="property-control">
                        <input type="range" 
                               id="speaker-frequency" 
                               min="100" 
                               max="2000" 
                               step="10" 
                               value="${output.frequency}">
                        <span class="value">${output.frequency} Hz</span>
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    getGateTruthTableHTML(gateType) {
        const tables = {
            'AND': `
                <table class="mini-truth-table">
                    <tr><th>A</th><th>B</th><th>Out</th></tr>
                    <tr><td>0</td><td>0</td><td>0</td></tr>
                    <tr><td>0</td><td>1</td><td>0</td></tr>
                    <tr><td>1</td><td>0</td><td>0</td></tr>
                    <tr><td>1</td><td>1</td><td class="high">1</td></tr>
                </table>`,
            'OR': `
                <table class="mini-truth-table">
                    <tr><th>A</th><th>B</th><th>Out</th></tr>
                    <tr><td>0</td><td>0</td><td>0</td></tr>
                    <tr><td>0</td><td>1</td><td class="high">1</td></tr>
                    <tr><td>1</td><td>0</td><td class="high">1</td></tr>
                    <tr><td>1</td><td>1</td><td class="high">1</td></tr>
                </table>`,
            'NOT': `
                <table class="mini-truth-table">
                    <tr><th>In</th><th>Out</th></tr>
                    <tr><td>0</td><td class="high">1</td></tr>
                    <tr><td>1</td><td>0</td></tr>
                </table>`,
            'XOR': `
                <table class="mini-truth-table">
                    <tr><th>A</th><th>B</th><th>Out</th></tr>
                    <tr><td>0</td><td>0</td><td>0</td></tr>
                    <tr><td>0</td><td>1</td><td class="high">1</td></tr>
                    <tr><td>1</td><td>0</td><td class="high">1</td></tr>
                    <tr><td>1</td><td>1</td><td>0</td></tr>
                </table>`,
            'NAND': `
                <table class="mini-truth-table">
                    <tr><th>A</th><th>B</th><th>Out</th></tr>
                    <tr><td>0</td><td>0</td><td class="high">1</td></tr>
                    <tr><td>0</td><td>1</td><td class="high">1</td></tr>
                    <tr><td>1</td><td>0</td><td class="high">1</td></tr>
                    <tr><td>1</td><td>1</td><td>0</td></tr>
                </table>`,
            'NOR': `
                <table class="mini-truth-table">
                    <tr><th>A</th><th>B</th><th>Out</th></tr>
                    <tr><td>0</td><td>0</td><td class="high">1</td></tr>
                    <tr><td>0</td><td>1</td><td>0</td></tr>
                    <tr><td>1</td><td>0</td><td>0</td></tr>
                    <tr><td>1</td><td>1</td><td>0</td></tr>
                </table>`
        };
        
        return tables[gateType] || '';
    }
    
    setupPropertyHandlers(component) {
        // Label change
        const labelInput = document.getElementById('component-label');
        if (labelInput) {
            labelInput.addEventListener('change', (e) => {
                component.setLabel(e.target.value);
                this.update();
            });
        }
        
        // Clock frequency
        const freqInput = document.getElementById('clock-frequency');
        if (freqInput) {
            freqInput.addEventListener('input', (e) => {
                component.setFrequency(parseFloat(e.target.value));
                e.target.nextElementSibling.textContent = `${e.target.value} Hz`;
            });
        }
        
        // Clock enabled
        const enabledInput = document.getElementById('clock-enabled');
        if (enabledInput) {
            enabledInput.addEventListener('change', (e) => {
                component.enabled = e.target.checked;
            });
        }
        
        // Speaker frequency
        const speakerFreqInput = document.getElementById('speaker-frequency');
        if (speakerFreqInput) {
            speakerFreqInput.addEventListener('input', (e) => {
                component.frequency = parseInt(e.target.value);
                e.target.nextElementSibling.textContent = `${e.target.value} Hz`;
            });
        }
    }
    
    copyExpression() {
        const analyzer = new CircuitAnalyzer(this.circuit);
        const analysis = analyzer.analyze();
        
        if (analysis.expression) {
            navigator.clipboard.writeText(analysis.expression).then(() => {
                this.showNotification('Expression copied to clipboard!');
            });
        }
    }
    
    simplifyExpression() {
        const analyzer = new CircuitAnalyzer(this.circuit);
        const analysis = analyzer.analyze();
        
        if (analysis.expression) {
            const parser = new ExpressionParser();
            const simplified = parser.simplifyExpression(analysis.expression);
            
            this.showSimplificationDialog(analysis.expression, simplified);
        }
    }
    
    exportTruthTable() {
        const generator = new TruthTableGenerator(this.circuit);
        const csv = generator.generateCSV();
        
        if (csv) {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'truth_table.csv';
            a.click();
            URL.revokeObjectURL(url);
            
            this.showNotification('Truth table exported!');
        }
    }
    
    showKarnaughMap() {
        const generator = new TruthTableGenerator(this.circuit);
        const kMap = generator.generateKarnaughMap();
        
        if (kMap) {
            this.showKMapDialog(kMap);
        } else {
            this.showNotification('K-Map requires 2-4 input variables', 'warning');
        }
    }
    
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    showSimplificationDialog(original, simplified) {
        // This would show a dialog with the simplification
        // For now, just show in console
        console.log('Original:', original);
        console.log('Simplified:', simplified);
        
        this.showNotification('Expression simplified!');
    }
    
    showKMapDialog(kMap) {
        // This would show a dialog with the K-map
        // For now, just show in console
        console.log('K-Map:', kMap);
        
        this.showNotification('K-Map generated!');
    }
}