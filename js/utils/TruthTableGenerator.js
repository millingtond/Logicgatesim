class TruthTableGenerator {
    constructor(circuit) {
        this.circuit = circuit;
        this.inputs = [];
        this.outputs = [];
        this.truthTable = [];
        this.simulator = null;
    }
    
    generate() {
        // Identify inputs and outputs
        this.identifyInputsOutputs();
        
        if (this.inputs.length === 0 || this.outputs.length === 0) {
            return null;
        }
        
        // Generate all possible input combinations
        const combinations = this.generateInputCombinations();
        
        // Evaluate circuit for each combination
        this.truthTable = this.evaluateCombinations(combinations);
        
        return {
            inputs: this.inputs.map(i => ({ id: i.id, label: i.label || i.id })),
            outputs: this.outputs.map(o => ({ id: o.id, label: o.label || o.id })),
            rows: this.truthTable
        };
    }
    
    identifyInputsOutputs() {
        this.inputs = [];
        this.outputs = [];
        
        this.circuit.components.forEach(component => {
            if (component.type === 'input' && 
                (component.subtype === 'switch' || 
                 component.subtype === 'high' || 
                 component.subtype === 'low')) {
                this.inputs.push(component);
            } else if (component.type === 'output') {
                this.outputs.push(component);
            }
        });
        
        // Sort inputs by label/name for consistent ordering
        this.inputs.sort((a, b) => {
            const labelA = a.label || a.id;
            const labelB = b.label || b.id;
            return labelA.localeCompare(labelB);
        });
    }
    
    generateInputCombinations() {
        const numInputs = this.inputs.length;
        const numCombinations = Math.pow(2, numInputs);
        const combinations = [];
        
        for (let i = 0; i < numCombinations; i++) {
            const combination = {};
            
            for (let j = 0; j < numInputs; j++) {
                const input = this.inputs[j];
                const bitValue = (i >> (numInputs - j - 1)) & 1;
                combination[input.id] = bitValue === 1;
            }
            
            combinations.push(combination);
        }
        
        return combinations;
    }
    
    evaluateCombinations(combinations) {
        const rows = [];
        
        // Create a temporary simulator if needed
        if (!this.simulator) {
            this.simulator = new Simulator(this.circuit);
            this.simulator.stop(); // We'll manually control evaluation
        }
        
        combinations.forEach(combination => {
            // Set input values
            this.setInputValues(combination);
            
            // Run simulation step
            this.simulator.evaluateComponents();
            
            // Read output values
            const outputValues = this.readOutputValues();
            
            // Create row
            const row = {
                inputs: { ...combination },
                outputs: outputValues
            };
            
            rows.push(row);
        });
        
        return rows;
    }
    
    setInputValues(combination) {
        Object.entries(combination).forEach(([inputId, value]) => {
            const input = this.circuit.components.get(inputId);
            if (input) {
                input.value = value;
                input.output = value;
            }
        });
    }
    
    readOutputValues() {
        const values = {};
        
        this.outputs.forEach(output => {
            values[output.id] = output.value || false;
        });
        
        return values;
    }
    
    generateHTML() {
        const data = this.generate();
        if (!data) return '<p>No valid circuit to analyze</p>';
        
        let html = '<table class="truth-table">';
        
        // Header row
        html += '<thead><tr>';
        data.inputs.forEach(input => {
            html += `<th class="input-header">${input.label}</th>`;
        });
        html += '<th class="separator"></th>';
        data.outputs.forEach(output => {
            html += `<th class="output-header">${output.label}</th>`;
        });
        html += '</tr></thead>';
        
        // Data rows
        html += '<tbody>';
        data.rows.forEach((row, index) => {
            html += `<tr class="${index % 2 === 0 ? 'even' : 'odd'}">`;
            
            // Input values
            data.inputs.forEach(input => {
                const value = row.inputs[input.id];
                html += `<td class="input-value ${value ? 'high' : 'low'}">${value ? '1' : '0'}</td>`;
            });
            
            // Separator
            html += '<td class="separator"></td>';
            
            // Output values
            data.outputs.forEach(output => {
                const value = row.outputs[output.id];
                html += `<td class="output-value ${value ? 'high' : 'low'}">${value ? '1' : '0'}</td>`;
            });
            
            html += '</tr>';
        });
        html += '</tbody>';
        
        html += '</table>';
        
        return html;
    }
    
    generateCSV() {
        const data = this.generate();
        if (!data) return '';
        
        let csv = '';
        
        // Header row
        const headers = [
            ...data.inputs.map(i => i.label),
            '',
            ...data.outputs.map(o => o.label)
        ];
        csv += headers.join(',') + '\n';
        
        // Data rows
        data.rows.forEach(row => {
            const values = [
                ...data.inputs.map(i => row.inputs[i.id] ? '1' : '0'),
                '',
                ...data.outputs.map(o => row.outputs[o.id] ? '1' : '0')
            ];
            csv += values.join(',') + '\n';
        });
        
        return csv;
    }
    
    compareWithExpression(expression) {
        // Generate truth table for the expression
        const parser = new ExpressionParser();
        const expressionTable = parser.calculateTruthTable(
            expression, 
            this.inputs.map(i => i.label || i.id)
        );
        
        // Generate truth table for the circuit
        const circuitData = this.generate();
        
        // Compare the tables
        const matches = [];
        const mismatches = [];
        
        circuitData.rows.forEach((row, index) => {
            const exprRow = expressionTable[index];
            
            // Assuming single output for simplicity
            const circuitOutput = Object.values(row.outputs)[0];
            const exprOutput = exprRow.output;
            
            if (circuitOutput === exprOutput) {
                matches.push(index);
            } else {
                mismatches.push({
                    index: index,
                    inputs: row.inputs,
                    expected: exprOutput,
                    actual: circuitOutput
                });
            }
        });
        
        return {
            isEquivalent: mismatches.length === 0,
            matches: matches,
            mismatches: mismatches,
            accuracy: (matches.length / circuitData.rows.length) * 100
        };
    }
    
    findMinTerms() {
        const data = this.generate();
        if (!data || data.outputs.length === 0) return [];
        
        const minTerms = [];
        
        // For each output
        data.outputs.forEach(output => {
            const outputMinTerms = [];
            
            data.rows.forEach((row, index) => {
                if (row.outputs[output.id]) {
                    // This row produces a 1 for this output
                    const term = [];
                    
                    data.inputs.forEach(input => {
                        const value = row.inputs[input.id];
                        const variable = input.label || input.id;
                        term.push(value ? variable : `NOT ${variable}`);
                    });
                    
                    outputMinTerms.push({
                        index: index,
                        term: term.join(' AND '),
                        decimal: index
                    });
                }
            });
            
            minTerms.push({
                output: output.label || output.id,
                terms: outputMinTerms
            });
        });
        
        return minTerms;
    }
    
    findMaxTerms() {
        const data = this.generate();
        if (!data || data.outputs.length === 0) return [];
        
        const maxTerms = [];
        
        // For each output
        data.outputs.forEach(output => {
            const outputMaxTerms = [];
            
            data.rows.forEach((row, index) => {
                if (!row.outputs[output.id]) {
                    // This row produces a 0 for this output
                    const term = [];
                    
                    data.inputs.forEach(input => {
                        const value = row.inputs[input.id];
                        const variable = input.label || input.id;
                        term.push(value ? `NOT ${variable}` : variable);
                    });
                    
                    outputMaxTerms.push({
                        index: index,
                        term: term.join(' OR '),
                        decimal: index
                    });
                }
            });
            
            maxTerms.push({
                output: output.label || output.id,
                terms: outputMaxTerms
            });
        });
        
        return maxTerms;
    }
    
    generateKarnaughMap() {
        const data = this.generate();
        if (!data || data.inputs.length < 2 || data.inputs.length > 4) {
            return null; // K-maps work best with 2-4 variables
        }
        
        // This is a simplified K-map for 2-3 variables
        // Full implementation would handle 4 variables with proper Gray code ordering
        const kMap = {
            variables: data.inputs.map(i => i.label || i.id),
            map: []
        };
        
        if (data.inputs.length === 2) {
            // 2x2 K-map
            kMap.map = [
                [null, null],
                [null, null]
            ];
            
            data.rows.forEach((row, index) => {
                const a = row.inputs[data.inputs[0].id] ? 1 : 0;
                const b = row.inputs[data.inputs[1].id] ? 1 : 0;
                kMap.map[a][b] = Object.values(row.outputs)[0] ? 1 : 0;
            });
        } else if (data.inputs.length === 3) {
            // 2x4 K-map
            kMap.map = [
                [null, null, null, null],
                [null, null, null, null]
            ];
            
            // Gray code ordering for columns: 00, 01, 11, 10
            const grayCode = [0, 1, 3, 2];
            
            data.rows.forEach((row, index) => {
                const a = row.inputs[data.inputs[0].id] ? 1 : 0;
                const bc = (row.inputs[data.inputs[1].id] ? 2 : 0) + 
                          (row.inputs[data.inputs[2].id] ? 1 : 0);
                const col = grayCode.indexOf(bc);
                kMap.map[a][col] = Object.values(row.outputs)[0] ? 1 : 0;
            });
        }
        
        return kMap;
    }
}