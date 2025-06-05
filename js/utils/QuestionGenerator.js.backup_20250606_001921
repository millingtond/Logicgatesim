class QuestionGenerator {
    constructor() {
        this.difficulty = 'beginner'; // beginner, intermediate, advanced, expert
        this.questionTypes = [
            'expressionToCircuit',
            'circuitToExpression',
            'truthTableCompletion',
            'circuitDebugging',
            'gateIdentification',
            'simplification'
        ];
        
        // Question templates
        this.templates = {
            beginner: {
                variables: ['A', 'B'],
                operators: ['AND', 'OR', 'NOT'],
                maxDepth: 2,
                maxGates: 3
            },
            intermediate: {
                variables: ['A', 'B', 'C'],
                operators: ['AND', 'OR', 'NOT', 'XOR'],
                maxDepth: 3,
                maxGates: 5
            },
            advanced: {
                variables: ['A', 'B', 'C', 'D'],
                operators: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
                maxDepth: 4,
                maxGates: 7
            },
            expert: {
                variables: ['A', 'B', 'C', 'D', 'E'],
                operators: ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'],
                maxDepth: 5,
                maxGates: 10
            }
        };
        
        this.currentQuestion = null;
    }
    
    setDifficulty(difficulty) {
        if (this.templates[difficulty]) {
            this.difficulty = difficulty;
        }
    }
    
    generateQuestion(type = null) {
        // Select random question type if not specified
        if (!type) {
            type = this.questionTypes[Math.floor(Math.random() * this.questionTypes.length)];
        }
        
        switch (type) {
            case 'expressionToCircuit':
                return this.generateExpressionToCircuit();
            case 'circuitToExpression':
                return this.generateCircuitToExpression();
            case 'truthTableCompletion':
                return this.generateTruthTableCompletion();
            case 'circuitDebugging':
                return this.generateCircuitDebugging();
            case 'gateIdentification':
                return this.generateGateIdentification();
            case 'simplification':
                return this.generateSimplification();
            default:
                return this.generateExpressionToCircuit();
        }
    }
    
    generateExpressionToCircuit() {
        const template = this.templates[this.difficulty];
        const expression = this.generateRandomExpression(template);
        
        // Parse expression to get the correct circuit
        const parser = new ExpressionParser();
        const correctCircuit = parser.parseToCircuit(expression);
        
        // Calculate truth table for validation
        const truthTable = this.calculateTruthTable(expression, template.variables);
        
        return {
            type: 'expressionToCircuit',
            difficulty: this.difficulty,
            question: `Build a circuit for the following Boolean expression:`,
            expression: expression,
            variables: template.variables,
            correctCircuit: correctCircuit,
            truthTable: truthTable,
            hints: this.generateHints(expression),
            points: this.calculatePoints()
        };
    }
    
    generateCircuitToExpression() {
        const template = this.templates[this.difficulty];
        
        // Generate a random expression first
        const expression = this.generateRandomExpression(template);
        
        // Create circuit from expression
        const parser = new ExpressionParser();
        const circuit = parser.parseToCircuit(expression);
        
        // Generate some wrong answers
        const wrongAnswers = this.generateWrongExpressions(expression, template);
        
        return {
            type: 'circuitToExpression',
            difficulty: this.difficulty,
            question: `Write the Boolean expression for this circuit:`,
            circuit: circuit,
            correctAnswer: expression,
            wrongAnswers: wrongAnswers,
            hints: [
                'Start from the inputs and work your way to the output',
                'Remember operator precedence: NOT > AND > OR',
                'Use parentheses to make the expression clear'
            ],
            points: this.calculatePoints()
        };
    }
    
    generateTruthTableCompletion() {
        const template = this.templates[this.difficulty];
        const expression = this.generateRandomExpression(template);
        
        // Calculate complete truth table
        const truthTable = this.calculateTruthTable(expression, template.variables);
        
        // Hide some values
        const hiddenIndices = [];
        const numToHide = Math.floor(truthTable.length * 0.4); // Hide 40% of outputs
        
        while (hiddenIndices.length < numToHide) {
            const index = Math.floor(Math.random() * truthTable.length);
            if (!hiddenIndices.includes(index)) {
                hiddenIndices.push(index);
            }
        }
        
        // Create incomplete table
        const incompleteTable = truthTable.map((row, index) => ({
            ...row,
            output: hiddenIndices.includes(index) ? null : row.output
        }));
        
        return {
            type: 'truthTableCompletion',
            difficulty: this.difficulty,
            question: `Complete the truth table for: ${expression}`,
            expression: expression,
            variables: template.variables,
            incompleteTable: incompleteTable,
            completeTable: truthTable,
            hiddenIndices: hiddenIndices,
            hints: [
                'Evaluate the expression for each row',
                'Work through the expression step by step',
                'Check your work with the rows that are already filled'
            ],
            points: this.calculatePoints()
        };
    }
    
    generateCircuitDebugging() {
        const template = this.templates[this.difficulty];
        const correctExpression = this.generateRandomExpression(template);
        
        // Create correct circuit
        const parser = new ExpressionParser();
        const correctCircuit = parser.parseToCircuit(correctExpression);
        
        // Introduce errors
        const faultyCircuit = this.introduceFaults(correctCircuit);
        
        return {
            type: 'circuitDebugging',
            difficulty: this.difficulty,
            question: `This circuit should implement: ${correctExpression}\nFind and fix the errors!`,
            expression: correctExpression,
            faultyCircuit: faultyCircuit.circuit,
            faults: faultyCircuit.faults,
            correctCircuit: correctCircuit,
            hints: [
                'Compare the circuit output with the expected expression',
                'Check each gate type carefully',
                'Verify all connections are correct'
            ],
            points: this.calculatePoints() * 1.5 // Debugging is harder
        };
    }
    
    generateGateIdentification() {
        const gates = ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'];
        const selectedGate = gates[Math.floor(Math.random() * gates.length)];
        
        // Generate truth table for the gate
        const truthTable = this.getGateTruthTable(selectedGate);
        
        return {
            type: 'gateIdentification',
            difficulty: this.difficulty,
            question: `Identify the logic gate from its truth table:`,
            truthTable: truthTable,
            correctAnswer: selectedGate,
            options: gates,
            hints: [
                'Look at when the output is 1',
                'Consider how many inputs the gate has',
                'Think about basic gate behaviors'
            ],
            points: this.calculatePoints() * 0.5 // Easier question
        };
    }
    
    generateSimplification() {
        const template = this.templates[this.difficulty];
        
        // Generate a complex expression
        const complexExpression = this.generateComplexExpression(template);
        
        // Simplify it
        const parser = new ExpressionParser();
        const simplifiedExpression = parser.simplifyExpression(complexExpression);
        
        return {
            type: 'simplification',
            difficulty: this.difficulty,
            question: `Simplify the following Boolean expression:`,
            expression: complexExpression,
            correctAnswer: simplifiedExpression,
            steps: this.generateSimplificationSteps(complexExpression, simplifiedExpression),
            hints: [
                'Look for repeated terms',
                'Apply Boolean algebra laws',
                'Remember: A + A = A, A · A = A'
            ],
            points: this.calculatePoints()
        };
    }
    
    // Helper methods
    generateRandomExpression(template, depth = 0) {
        if (depth >= template.maxDepth || Math.random() < 0.3) {
            // Return a variable
            return template.variables[Math.floor(Math.random() * template.variables.length)];
        }
        
        const operator = template.operators[Math.floor(Math.random() * template.operators.length)];
        
        if (operator === 'NOT') {
            return `NOT ${this.generateRandomExpression(template, depth + 1)}`;
        } else {
            const left = this.generateRandomExpression(template, depth + 1);
            const right = this.generateRandomExpression(template, depth + 1);
            return `(${left} ${operator} ${right})`;
        }
    }
    
    generateComplexExpression(template) {
        // Generate expression with redundancy for simplification
        const vars = template.variables.slice(0, 3);
        const patterns = [
            `(A AND B) OR (A AND NOT B)`, // Simplifies to A
            `(A OR B) AND (A OR NOT B)`, // Simplifies to A
            `(A AND B) OR (NOT A AND B)`, // Simplifies to B
            `NOT (NOT A)`, // Simplifies to A
            `A AND (A OR B)`, // Simplifies to A
            `A OR (A AND B)`, // Simplifies to A
        ];
        
        let pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        // Replace A, B, C with actual variables
        vars.forEach((v, i) => {
            pattern = pattern.replace(new RegExp(String.fromCharCode(65 + i), 'g'), v);
        });
        
        return pattern;
    }
    
    calculateTruthTable(expression, variables) {
        const parser = new ExpressionParser();
        const table = [];
        const numRows = Math.pow(2, variables.length);
        
        for (let i = 0; i < numRows; i++) {
            const values = {};
            const row = { inputs: {} };
            
            // Set variable values based on binary representation
            variables.forEach((v, j) => {
                const bit = (i >> (variables.length - j - 1)) & 1;
                values[v] = bit === 1;
                row.inputs[v] = bit === 1;
            });
            
            // Evaluate expression
            const modifiedExpression = this.substituteValues(expression, values);
            row.output = this.evaluateExpression(modifiedExpression);
            
            table.push(row);
        }
        
        return table;
    }
    
    substituteValues(expression, values) {
        let result = expression;
        Object.entries(values).forEach(([variable, value]) => {
            result = result.replace(new RegExp(`\\b${variable}\\b`, 'g'), value ? '1' : '0');
        });
        return result;
    }
    
    evaluateExpression(expression) {
        // Simple expression evaluator for 0s and 1s
        let expr = expression;
        
        // Replace operators with JavaScript equivalents
        expr = expr.replace(/\bAND\b/gi, '&&');
        expr = expr.replace(/\bOR\b/gi, '||');
        expr = expr.replace(/\bNOT\s+1/gi, '0');
        expr = expr.replace(/\bNOT\s+0/gi, '1');
        expr = expr.replace(/\bXOR\b/gi, '^');
        expr = expr.replace(/\bNAND\b/gi, '!&');
        expr = expr.replace(/\bNOR\b/gi, '!|');
        
        // Handle NAND and NOR
        expr = expr.replace(/(\d)\s*!&\s*(\d)/g, '!($1 && $2)');
        expr = expr.replace(/(\d)\s*!\|\s*(\d)/g, '!($1 || $2)');
        
        try {
            // Safely evaluate the expression
            return new Function('return ' + expr)() ? true : false;
        } catch (e) {
            console.error('Error evaluating expression:', expression, e);
            return false;
        }
    }
    
    getGateTruthTable(gateType) {
        switch (gateType) {
            case 'AND':
                return [
                    { inputs: { A: false, B: false }, output: false },
                    { inputs: { A: false, B: true }, output: false },
                    { inputs: { A: true, B: false }, output: false },
                    { inputs: { A: true, B: true }, output: true }
                ];
            case 'OR':
                return [
                    { inputs: { A: false, B: false }, output: false },
                    { inputs: { A: false, B: true }, output: true },
                    { inputs: { A: true, B: false }, output: true },
                    { inputs: { A: true, B: true }, output: true }
                ];
            case 'NOT':
                return [
                    { inputs: { A: false }, output: true },
                    { inputs: { A: true }, output: false }
                ];
            case 'XOR':
                return [
                    { inputs: { A: false, B: false }, output: false },
                    { inputs: { A: false, B: true }, output: true },
                    { inputs: { A: true, B: false }, output: true },
                    { inputs: { A: true, B: true }, output: false }
                ];
            case 'NAND':
                return [
                    { inputs: { A: false, B: false }, output: true },
                    { inputs: { A: false, B: true }, output: true },
                    { inputs: { A: true, B: false }, output: true },
                    { inputs: { A: true, B: true }, output: false }
                ];
            case 'NOR':
                return [
                    { inputs: { A: false, B: false }, output: true },
                    { inputs: { A: false, B: true }, output: false },
                    { inputs: { A: true, B: false }, output: false },
                    { inputs: { A: true, B: true }, output: false }
                ];
        }
    }
    
    generateWrongExpressions(correct, template) {
        const wrong = [];
        
        // Swap operators
        let swapped = correct.replace(/AND/g, 'TEMP')
                            .replace(/OR/g, 'AND')
                            .replace(/TEMP/g, 'OR');
        if (swapped !== correct) wrong.push(swapped);
        
        // Add/remove NOT
        if (correct.includes('NOT')) {
            wrong.push(correct.replace(/NOT\s+/g, ''));
        } else {
            wrong.push(`NOT (${correct})`);
        }
        
        // Change parentheses
        if (correct.includes('(')) {
            let noParens = correct.replace(/[()]/g, '');
            if (noParens !== correct) wrong.push(noParens);
        }
        
        return wrong.slice(0, 3); // Return up to 3 wrong answers
    }
    
    introduceFaults(circuit) {
        const faults = [];
        const faultyCircuit = JSON.parse(JSON.stringify(circuit)); // Deep copy
        
        // Select number of faults based on difficulty
        const numFaults = this.difficulty === 'beginner' ? 1 : 
                         this.difficulty === 'intermediate' ? 2 : 3;
        
        // Possible fault types
        const faultTypes = ['wrongGate', 'missingConnection', 'wrongConnection'];
        
        for (let i = 0; i < numFaults; i++) {
            const faultType = faultTypes[Math.floor(Math.random() * faultTypes.length)];
            
            switch (faultType) {
                case 'wrongGate':
                    // Change a gate type
                    const gates = faultyCircuit.components.filter(c => c.type === 'gate');
                    if (gates.length > 0) {
                        const gate = gates[Math.floor(Math.random() * gates.length)];
                        const oldType = gate.subtype;
                        const newTypes = ['AND', 'OR', 'XOR', 'NAND', 'NOR'].filter(t => t !== oldType);
                        gate.subtype = newTypes[Math.floor(Math.random() * newTypes.length)];
                        
                        faults.push({
                            type: 'wrongGate',
                            componentId: gate.id,
                            correctType: oldType,
                            wrongType: gate.subtype
                        });
                    }
                    break;
                    
                case 'missingConnection':
                    // Remove a connection
                    if (faultyCircuit.connections.length > 0) {
                        const index = Math.floor(Math.random() * faultyCircuit.connections.length);
                        const removed = faultyCircuit.connections.splice(index, 1)[0];
                        
                        faults.push({
                            type: 'missingConnection',
                            connection: removed
                        });
                    }
                    break;
                    
                case 'wrongConnection':
                    // Swap a connection
                    if (faultyCircuit.connections.length > 1) {
                        const conn = faultyCircuit.connections[Math.floor(Math.random() * faultyCircuit.connections.length)];
                        const gates = faultyCircuit.components.filter(c => c.type === 'gate' && c.id !== conn.toComponentId);
                        
                        if (gates.length > 0) {
                            const oldTo = conn.toComponentId;
                            conn.toComponentId = gates[Math.floor(Math.random() * gates.length)].id;
                            
                            faults.push({
                                type: 'wrongConnection',
                                connectionId: conn.id,
                                correctTo: oldTo,
                                wrongTo: conn.toComponentId
                            });
                        }
                    }
                    break;
            }
        }
        
        return { circuit: faultyCircuit, faults: faults };
    }
    
    generateHints(expression) {
        const hints = [];
        
        // Count operators
        const andCount = (expression.match(/AND/gi) || []).length;
        const orCount = (expression.match(/OR/gi) || []).length;
        const notCount = (expression.match(/NOT/gi) || []).length;
        
        hints.push(`You'll need ${andCount + orCount + notCount} gates in total`);
        
        if (notCount > 0) {
            hints.push(`Remember to include ${notCount} NOT gate${notCount > 1 ? 's' : ''}`);
        }
        
        if (expression.includes('(')) {
            hints.push('Pay attention to parentheses - they affect the order of operations');
        }
        
        return hints;
    }
    
    generateSimplificationSteps(complex, simplified) {
        // This would ideally show step-by-step simplification
        // For now, return basic steps
        return [
            { step: 1, expression: complex, rule: 'Original expression' },
            { step: 2, expression: simplified, rule: 'Apply Boolean algebra laws' }
        ];
    }
    
    calculatePoints() {
        const basePoints = {
            beginner: 10,
            intermediate: 20,
            advanced: 30,
            expert: 50
        };
        
        return basePoints[this.difficulty] || 10;
    }
    
    checkAnswer(question, answer) {
        switch (question.type) {
            case 'expressionToCircuit':
                return this.checkCircuitAnswer(question, answer);
            case 'circuitToExpression':
                return this.checkExpressionAnswer(question, answer);
            case 'truthTableCompletion':
                return this.checkTruthTableAnswer(question, answer);
            case 'gateIdentification':
                return answer === question.correctAnswer;
            default:
                return false;
        }
    }
    
    checkCircuitAnswer(question, circuit) {
        // Compare truth tables of the student's circuit and correct circuit
        const studentTruthTable = this.calculateCircuitTruthTable(circuit, question.variables);
        return this.compareTruthTables(studentTruthTable, question.truthTable);
    }
    
    checkExpressionAnswer(question, expression) {
        // Normalize and compare expressions
        const normalized = this.normalizeExpression(expression);
        const correct = this.normalizeExpression(question.correctAnswer);
        
        // Could also compare truth tables for logical equivalence
        return normalized === correct;
    }
    
    checkTruthTableAnswer(question, answers) {
        // Check if all hidden values are correct
        return question.hiddenIndices.every(index => 
            answers[index] === question.completeTable[index].output
        );
    }
    
    normalizeExpression(expression) {
        return expression
            .toUpperCase()
            .replace(/\s+/g, ' ')
            .replace(/\s*([()'])\s*/g, '$1')
            .trim();
    }
    
    compareTruthTables(table1, table2) {
        if (table1.length !== table2.length) return false;
        
        return table1.every((row1, index) => {
            const row2 = table2[index];
            return row1.output === row2.output;
        });
    }
    
    calculateCircuitTruthTable(circuit, variables) {
        // This would evaluate the actual circuit for all input combinations
        // Placeholder for now
        return [];
    }
}