class ExpressionParser {
constructor() {
    // Token types
    this.TokenType = {
        VARIABLE: 'VARIABLE',
        AND: 'AND',
        OR: 'OR',
        NOT: 'NOT',
        XOR: 'XOR',
        NAND: 'NAND',
        NOR: 'NOR',
        LPAREN: 'LPAREN',
        RPAREN: 'RPAREN',
        EOF: 'EOF'
    };
    
    // Operator precedence
    this.precedence = {
        'OR': 1,
        'NOR': 1,
        'XOR': 2,
        'AND': 3,
        'NAND': 3,
        'NOT': 4
    };
    
    // Token patterns - ORDER MATTERS! Longer patterns must come first
    this.patterns = [
        // Multi-character operators first
        { regex: /^NAND\b/i, type: this.TokenType.NAND },
        { regex: /^NOR\b/i, type: this.TokenType.NOR },
        { regex: /^AND\b/i, type: this.TokenType.AND },
        { regex: /^XOR\b/i, type: this.TokenType.XOR },
        { regex: /^NOT\b/i, type: this.TokenType.NOT },
        { regex: /^OR\b/i, type: this.TokenType.OR },
        // Parentheses
        { regex: /^\(/, type: this.TokenType.LPAREN },
        { regex: /^\)/, type: this.TokenType.RPAREN },
        // Alternative symbols
        { regex: /^·|^∧|^\*/, type: this.TokenType.AND },
        { regex: /^\+|^∨/, type: this.TokenType.OR },
        { regex: /^'|^¬|^!/, type: this.TokenType.NOT },
        { regex: /^⊕/, type: this.TokenType.XOR },
        // Variables - must come after keywords
        { regex: /^[A-Za-z][A-Za-z0-9]*/, type: this.TokenType.VARIABLE }
    ];
    
    this.reset();
}
    
    reset() {
        this.tokens = [];
        this.current = 0;
        this.expression = '';
        this.variables = new Set();
        this.ast = null;
    }
    
    // Main parsing method
    parseToCircuit(expression) {
        this.reset();
        this.expression = expression;
        
        // Tokenize
        this.tokenize(expression);
        
        // Parse to AST
        this.ast = this.parseExpression();
        
        // Check for remaining tokens
        if (!this.isAtEnd()) {
            throw new Error(`Unexpected token: ${this.peek().value}`);
        }
        
        // Convert AST to circuit
        return this.astToCircuit(this.ast);
    }
    
    // Tokenization
tokenize(expression) {
    let remaining = expression.trim();
    
    while (remaining.length > 0) {
        // Skip whitespace
        const whitespaceMatch = remaining.match(/^\s+/);
        if (whitespaceMatch) {
            remaining = remaining.substring(whitespaceMatch[0].length);
            continue;
        }
        
        // Try to match patterns
        let matched = false;
        for (const pattern of this.patterns) {
            const match = remaining.match(pattern.regex);
            if (match) {
                const value = match[0];
                
                // For operators, check if it's actually a keyword (not part of a variable name)
                if (pattern.type !== this.TokenType.VARIABLE && pattern.type !== this.TokenType.LPAREN && pattern.type !== this.TokenType.RPAREN) {
                    // Check if followed by word boundary
                    const afterMatch = remaining.substring(value.length);
                    if (afterMatch.length > 0 && /^[A-Za-z0-9]/.test(afterMatch)) {
                        // This is part of a variable name, not an operator
                        continue;
                    }
                }
                
                this.tokens.push({
                    type: pattern.type,
                    value: value.toUpperCase() // Normalize to uppercase
                });
                
                // Track variables
                if (pattern.type === this.TokenType.VARIABLE) {
                    this.variables.add(value);
                }
                
                remaining = remaining.substring(value.length);
                matched = true;
                break;
            }
        }
        
        if (!matched) {
            throw new Error(`Invalid character in expression: ${remaining[0]}`);
        }
    }
    
    // Add EOF token
    this.tokens.push({ type: this.TokenType.EOF, value: '' });
}
    
    // Recursive descent parser
    parseExpression() {
        return this.parseOr();
    }
    
    parseOr() {
        let left = this.parseXor();
        
        while (this.match(this.TokenType.OR, this.TokenType.NOR)) {
            const operator = this.previous();
            const right = this.parseXor();
            left = {
                type: 'BINARY',
                operator: operator.type,
                left: left,
                right: right
            };
        }
        
        return left;
    }
    
    parseXor() {
        let left = this.parseAnd();
        
        while (this.match(this.TokenType.XOR)) {
            const operator = this.previous();
            const right = this.parseAnd();
            left = {
                type: 'BINARY',
                operator: operator.type,
                left: left,
                right: right
            };
        }
        
        return left;
    }
    
    parseAnd() {
        let left = this.parseNot();
        
        while (this.match(this.TokenType.AND, this.TokenType.NAND)) {
            const operator = this.previous();
            const right = this.parseNot();
            left = {
                type: 'BINARY',
                operator: operator.type,
                left: left,
                right: right
            };
        }
        
        return left;
    }
    
    parseNot() {
        if (this.match(this.TokenType.NOT)) {
            const operator = this.previous();
            const operand = this.parseNot(); // Right associative
            return {
                type: 'UNARY',
                operator: operator.type,
                operand: operand
            };
        }
        
        return this.parsePrimary();
    }
    
    parsePrimary() {
        // Variable
        if (this.match(this.TokenType.VARIABLE)) {
            return {
                type: 'VARIABLE',
                name: this.previous().value
            };
        }
        
        // Parentheses
        if (this.match(this.TokenType.LPAREN)) {
            const expr = this.parseExpression();
            this.consume(this.TokenType.RPAREN, "Expected ')' after expression");
            return expr;
        }
        
        throw new Error(`Unexpected token: ${this.peek().value}`);
    }
    
    // Parser utilities
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    
    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }
    
    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }
    
    isAtEnd() {
        return this.peek().type === this.TokenType.EOF;
    }
    
    peek() {
        return this.tokens[this.current];
    }
    
    previous() {
        return this.tokens[this.current - 1];
    }
    
    consume(type, message) {
        if (this.check(type)) return this.advance();
        throw new Error(message);
    }
    
    // AST to Circuit conversion
    astToCircuit(ast) {
        const circuit = {
            components: [],
            connections: []
        };
        
        // Create input components for variables
        const inputComponents = new Map();
        let inputX = 50;
        const inputSpacing = 100;
        
        Array.from(this.variables).sort().forEach(varName => {
            const input = {
                id: `input-${varName}`,
                type: 'input',
                subtype: 'switch',
                x: inputX,
                y: 100,
                label: varName
            };
            circuit.components.push(input);
            inputComponents.set(varName, input);
            inputX += inputSpacing;
        });
        
        // Build circuit from AST
        const outputNode = this.buildCircuitNode(ast, circuit, inputComponents, 200);
        
        // Add output component
        const output = {
            id: 'output-main',
            type: 'output',
            subtype: 'bulb',
            x: outputNode.x + 150,
            y: outputNode.y,
            label: 'Output'
        };
        circuit.components.push(output);
        
        // Connect to output
        circuit.connections.push({
            fromComponentId: outputNode.id,
            fromPortType: 'output',
            fromPortIndex: 0,
            toComponentId: output.id,
            toPortType: 'input',
            toPortIndex: 0
        });
        
        // Optimize layout
        this.optimizeLayout(circuit);
        
        return circuit;
    }
    
    buildCircuitNode(node, circuit, inputComponents, baseY, depth = 0) {
        const x = 200 + depth * 150;
        
        switch (node.type) {
            case 'VARIABLE':
                return inputComponents.get(node.name);
                
            case 'UNARY':
                return this.buildUnaryGate(node, circuit, inputComponents, x, baseY, depth);
                
            case 'BINARY':
                return this.buildBinaryGate(node, circuit, inputComponents, x, baseY, depth);
                
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }
    
    buildUnaryGate(node, circuit, inputComponents, x, y, depth) {
        // Create NOT gate
        const gate = {
            id: `gate-${circuit.components.length}`,
            type: 'gate',
            subtype: 'NOT',
            x: x,
            y: y
        };
        circuit.components.push(gate);
        
        // Build input
        const input = this.buildCircuitNode(node.operand, circuit, inputComponents, y, depth + 1);
        
        // Connect input to gate
        circuit.connections.push({
            fromComponentId: input.id,
            fromPortType: 'output',
            fromPortIndex: 0,
            toComponentId: gate.id,
            toPortType: 'input',
            toPortIndex: 0
        });
        
        return gate;
    }
    
    buildBinaryGate(node, circuit, inputComponents, x, baseY, depth) {
        // Determine gate type
        let gateType = node.operator;
        if (gateType === 'BINARY') {
            gateType = 'AND'; // Default
        }
        
        // Calculate Y positions for inputs
        const spacing = 80;
        const y1 = baseY - spacing / 2;
        const y2 = baseY + spacing / 2;
        
        // Build left and right inputs
        const leftInput = this.buildCircuitNode(node.left, circuit, inputComponents, y1, depth + 1);
        const rightInput = this.buildCircuitNode(node.right, circuit, inputComponents, y2, depth + 1);
        
        // Calculate gate Y position (between inputs)
        const gateY = (leftInput.y + rightInput.y) / 2;
        
        // Create gate
        const gate = {
            id: `gate-${circuit.components.length}`,
            type: 'gate',
            subtype: gateType,
            x: x,
            y: gateY
        };
        circuit.components.push(gate);
        
        // Connect inputs to gate
        circuit.connections.push({
            fromComponentId: leftInput.id,
            fromPortType: 'output',
            fromPortIndex: 0,
            toComponentId: gate.id,
            toPortType: 'input',
            toPortIndex: 0
        });
        
        circuit.connections.push({
            fromComponentId: rightInput.id,
            fromPortType: 'output',
            fromPortIndex: 0,
            toComponentId: gate.id,
            toPortType: 'input',
            toPortIndex: 1
        });
        
        return gate;
    }
    
    optimizeLayout(circuit) {
        // Simple layout optimization
        // Group components by depth
        const depths = new Map();
        const processed = new Set();
        
        // Calculate depth for each component
        const calculateDepth = (compId, depth = 0) => {
            if (processed.has(compId)) return;
            processed.add(compId);
            
            const currentDepth = depths.get(compId) || 0;
            depths.set(compId, Math.max(currentDepth, depth));
            
            // Find connected components
            circuit.connections.forEach(conn => {
                if (conn.fromComponentId === compId) {
                    calculateDepth(conn.toComponentId, depth + 1);
                }
            });
        };
        
        // Start from inputs
        circuit.components.forEach(comp => {
            if (comp.type === 'input') {
                calculateDepth(comp.id, 0);
            }
        });
        
        // Position components by depth
        const depthGroups = new Map();
        depths.forEach((depth, compId) => {
            if (!depthGroups.has(depth)) {
                depthGroups.set(depth, []);
            }
            depthGroups.get(depth).push(compId);
        });
        
        // Reposition components
        const xSpacing = 150;
        const ySpacing = 100;
        
        depthGroups.forEach((compIds, depth) => {
            const x = 100 + depth * xSpacing;
            let y = 100;
            
            compIds.forEach(compId => {
                const comp = circuit.components.find(c => c.id === compId);
                if (comp) {
                    comp.x = x;
                    comp.y = y;
                    y += ySpacing;
                }
            });
        });
    }
    
    // Expression simplification
    simplifyExpression(expression) {
        // Parse expression
        this.reset();
        this.tokenize(expression);
        const ast = this.parseExpression();
        
        // Simplify AST
        const simplified = this.simplifyAST(ast);
        
        // Convert back to string
        return this.astToString(simplified);
    }
    
    simplifyAST(node) {
        switch (node.type) {
            case 'VARIABLE':
                return node;
                
            case 'UNARY':
                // NOT NOT A = A
                if (node.operator === 'NOT' && 
                    node.operand.type === 'UNARY' && 
                    node.operand.operator === 'NOT') {
                    return this.simplifyAST(node.operand.operand);
                }
                return {
                    ...node,
                    operand: this.simplifyAST(node.operand)
                };
                
            case 'BINARY':
                const left = this.simplifyAST(node.left);
                const right = this.simplifyAST(node.right);
                
                // A AND A = A, A OR A = A
                if (this.nodesEqual(left, right)) {
                    if (node.operator === 'AND' || node.operator === 'OR') {
                        return left;
                    }
                }
                
                // A XOR A = 0
                if (node.operator === 'XOR' && this.nodesEqual(left, right)) {
                    return { type: 'CONSTANT', value: false };
                }
                
                return {
                    ...node,
                    left: left,
                    right: right
                };
                
            default:
                return node;
        }
    }
    
    nodesEqual(node1, node2) {
        if (node1.type !== node2.type) return false;
        
        switch (node1.type) {
            case 'VARIABLE':
                return node1.name === node2.name;
            case 'UNARY':
                return node1.operator === node2.operator && 
                       this.nodesEqual(node1.operand, node2.operand);
            case 'BINARY':
                return node1.operator === node2.operator &&
                       this.nodesEqual(node1.left, node2.left) &&
                       this.nodesEqual(node1.right, node2.right);
            default:
                return false;
        }
    }
    
    astToString(node) {
        switch (node.type) {
            case 'VARIABLE':
                return node.name;
            case 'CONSTANT':
                return node.value ? '1' : '0';
            case 'UNARY':
                return `NOT ${this.astToString(node.operand)}`;
            case 'BINARY':
                const left = this.astToString(node.left);
                const right = this.astToString(node.right);
                return `(${left} ${node.operator} ${right})`;
            default:
                return '';
        }
    }
}