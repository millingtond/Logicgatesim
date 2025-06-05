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
        this.expressionDisplay = document.getElementById('expression-display');
        
        // Truth table container
        this.truthTableContainer = document.getElementById('truth-table-container');
        
        // Component properties - create if doesn't exist
        let propertiesSection = document.getElementById('component-properties-section');
        if (!propertiesSection && this.container) {
            propertiesSection = document.createElement('section');
            propertiesSection.className = 'panel-section';
            propertiesSection.id = 'component-properties-section';
            propertiesSection.innerHTML = `
                <h3>Component Properties</h3>
                <div class="component-properties" id="component-properties">
                    <p class="placeholder-text">Select a component to view properties</p>
                </div>
            `;
            this.container.appendChild(propertiesSection);
        }
        this.componentPropertiesContainer = document.getElementById('component-properties');
        
        // Circuit analysis - create if doesn't exist
        let analysisSection = document.getElementById('circuit-analysis-section');
        if (!analysisSection && this.container) {
            analysisSection = document.createElement('section');
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
        
        // Add expression controls if they don't exist
        const expressionSection = this.expressionDisplay?.parentElement;
        if (expressionSection && !document.getElementById('copy-expression')) {
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'expression-controls';
            controlsDiv.innerHTML = `
                <button class="btn-small" id="copy-expression">Copy</button>
                <button class="btn-small" id="simplify-expression">Simplify</button>
            `;
            expressionSection.appendChild(controlsDiv);
        }
        
        // Add truth table controls if they don't exist
        const truthTableSection = this.truthTableContainer?.parentElement;
        if (truthTableSection && !document.getElementById('export-truth-table')) {
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'truth-table-controls';
            controlsDiv.innerHTML = `
                <button class="btn-small" id="export-truth-table">Export CSV</button>
                <button class="btn-small" id="show-k-map">K-Map</button>
            `;
            truthTableSection.appendChild(controlsDiv);
        }
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
        
        // Button events - check if elements exist before adding listeners
        const copyBtn = document.getElementById('copy-expression');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyExpression());
        }
        
        const simplifyBtn = document.getElementById('simplify-expression');
        if (simplifyBtn) {
            simplifyBtn.addEventListener('click', () => this.simplifyExpression());
        }
        
        const exportBtn = document.getElementById('export-truth-table');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTruthTable());
        }
        
        const kmapBtn = document.getElementById('show-k-map');
        if (kmapBtn) {
            kmapBtn.addEventListener('click', () => this.showKarnaughMap());
        }
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
        if (!this.expressionDisplay) return;
        
        const analyzer = new CircuitAnalyzer(this.circuit);
        const analysis = analyzer.analyze();
        
        const expressionText = this.expressionDisplay.querySelector('.expression-text');
        if (expressionText) {
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
        if (!this.truthTableContainer) return;
        
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
        
        // Update counts if elements exist
        const componentCount = document.getElementById('component-count');
        if (componentCount) {
            componentCount.textContent = summary.inputCount + summary.outputCount + summary.gateCount;
        }
        
        const connectionCount = document.getElementById('connection-count');
        if (connectionCount) {
            connectionCount.textContent = summary.connectionCount;
        }
        
        const circuitDepth = document.getElementById('circuit-depth');
        if (circuitDepth) {
            circuitDepth.textContent = summary.depth;
        }
        
        const circuitComplexity = document.getElementById('circuit-complexity');
        if (circuitComplexity) {
            circuitComplexity.textContent = summary.complexity.toFixed(1);
        }
        
        // Show warnings
        const warningsContainer = document.getElementById('analysis-warnings');
        if (warningsContainer) {
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
    }
    
    updateComponentProperties() {
        if (!this.componentPropertiesContainer) return;
        
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
                    <span class="value">${output.value ? output.value.toString(16).toUpperCase() : '0'}</span>
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
                               value="${output.frequency || 440}">
                        <span class="value">${output.frequency || 440} Hz</span>
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
                if (component.setLabel) {
                    component.setLabel(e.target.value);
                } else {
                    component.label = e.target.value;
                }
                this.update();
            });
        }
        
        // Clock frequency
        const freqInput = document.getElementById('clock-frequency');
        if (freqInput) {
            freqInput.addEventListener('input', (e) => {
                if (component.setFrequency) {
                    component.setFrequency(parseFloat(e.target.value));
                }
                const display = e.target.nextElementSibling;
                if (display) {
                    display.textContent = `${e.target.value} Hz`;
                }
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
                const display = e.target.nextElementSibling;
                if (display) {
                    display.textContent = `${e.target.value} Hz`;
                }
            });
        }
    }
    
    copyExpression() {
        const analyzer = new CircuitAnalyzer(this.circuit);
        const analysis = analyzer.analyze();
        
        if (analysis.expression) {
            navigator.clipboard.writeText(analysis.expression).then(() => {
                this.showNotification('Expression copied to clipboard!');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = analysis.expression;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showNotification('Expression copied to clipboard!');
            });
        }
    }
    
    simplifyExpression() {
        const analyzer = new CircuitAnalyzer(this.circuit);
        const analysis = analyzer.analyze();
        
        if (analysis.expression) {
            try {
                const parser = new ExpressionParser();
                const simplified = parser.simplifyExpression(analysis.expression);
                
                this.showSimplificationDialog(analysis.expression, simplified);
            } catch (error) {
                this.showNotification('Could not simplify expression', 'error');
            }
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
        
        this.showNotification('Expression simplified! Check console for details.');
    }
    
    showKMapDialog(kMap) {
        // This would show a dialog with the K-map
        // For now, just show in console
        console.log('K-Map:', kMap);
        
        this.showNotification('K-Map generated! Check console for details.');
    }
}