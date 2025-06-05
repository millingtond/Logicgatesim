class Gate {
    constructor(type, x, y, id) {
        this.id = id || 'gate-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        this.type = type; // AND, OR, NOT, XOR, NAND, NOR
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 60;
        this.inputs = this.getInputCount();
        this.output = false;
        this.inputConnections = new Array(this.inputs).fill(null);
        this.outputConnections = [];
        this.selected = false;
    }
    
    getInputCount() {
        return this.type === 'NOT' ? 1 : 2;
    }
    
    getInputPosition(index) {
        const spacing = this.height / (this.inputs + 1);
        return {
            x: this.x,
            y: this.y + spacing * (index + 1)
        };
    }
    
    getOutputPosition() {
        return {
            x: this.x + this.width,
            y: this.y + this.height / 2
        };
    }
    
    evaluate() {
        const inputValues = this.inputConnections.map(conn => {
            if (!conn) return false;
            
            // Get the value from the connected component
            if (conn.fromComponent) {
                return conn.fromComponent.output || false;
            }
            
            return false;
        });
        
        switch(this.type) {
            case 'AND':
                this.output = inputValues.every(v => v);
                break;
            case 'OR':
                this.output = inputValues.some(v => v);
                break;
            case 'NOT':
                this.output = !inputValues[0];
                break;
            case 'XOR':
                this.output = inputValues[0] !== inputValues[1];
                break;
            case 'NAND':
                this.output = !inputValues.every(v => v);
                break;
            case 'NOR':
                this.output = !inputValues.some(v => v);
                break;
        }
        
        return this.output;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Draw gate body
        ctx.fillStyle = this.selected ? '#3498db' : '#ffffff';
        ctx.strokeStyle = this.selected ? '#2980b9' : '#2c3e50';
        ctx.lineWidth = 2;
        
        switch(this.type) {
            case 'AND':
                this.drawANDGate(ctx);
                break;
            case 'OR':
                this.drawORGate(ctx);
                break;
            case 'NOT':
                this.drawNOTGate(ctx);
                break;
            case 'XOR':
                this.drawXORGate(ctx);
                break;
            case 'NAND':
                this.drawNANDGate(ctx);
                break;
            case 'NOR':
                this.drawNORGate(ctx);
                break;
        }
        
        // Draw connection points
        this.drawConnectionPoints(ctx);
        
        // Draw label
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type, this.x + this.width/2, this.y + this.height/2);
        
        ctx.restore();
    }
    
    drawANDGate(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width * 0.5, this.y);
        ctx.arc(
            this.x + this.width * 0.5, 
            this.y + this.height/2,
            this.height/2,
            -Math.PI/2,
            Math.PI/2
        );
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x, this.y);
        ctx.fill();
        ctx.stroke();
    }
    
    drawORGate(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(
            this.x + this.width * 0.2, this.y + this.height * 0.5,
            this.x, this.y + this.height
        );
        ctx.quadraticCurveTo(
            this.x + this.width * 0.6, this.y + this.height,
            this.x + this.width, this.y + this.height * 0.5
        );
        ctx.quadraticCurveTo(
            this.x + this.width * 0.6, this.y,
            this.x, this.y
        );
        ctx.fill();
        ctx.stroke();
    }
    
    drawNOTGate(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height/2);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw the NOT bubble
        ctx.beginPath();
        ctx.arc(
            this.x + this.width * 0.9,
            this.y + this.height/2,
            this.width * 0.1,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
    }
    
    drawXORGate(ctx) {
        // Draw the OR gate shape
        this.drawORGate(ctx);
        
        // Draw the additional curve for XOR
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y);
        ctx.quadraticCurveTo(
            this.x - 10 + this.width * 0.2, this.y + this.height * 0.5,
            this.x - 10, this.y + this.height
        );
        ctx.stroke();
    }
    
    drawNANDGate(ctx) {
        // Draw AND gate
        this.drawANDGate(ctx);
        
        // Draw NOT bubble
        ctx.beginPath();
        ctx.arc(
            this.x + this.width + 5,
            this.y + this.height/2,
            5,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
    }
    
    drawNORGate(ctx) {
        // Draw OR gate
        this.drawORGate(ctx);
        
        // Draw NOT bubble
        ctx.beginPath();
        ctx.arc(
            this.x + this.width + 5,
            this.y + this.height/2,
            5,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
    }
    
    drawConnectionPoints(ctx) {
        // Draw input connection points
        for (let i = 0; i < this.inputs; i++) {
            const pos = this.getInputPosition(i);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = this.inputConnections[i] ? '#27ae60' : '#95a5a6';
            ctx.fill();
        }
        
        // Draw output connection point
        const outPos = this.getOutputPosition();
        ctx.beginPath();
        ctx.arc(outPos.x, outPos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.output ? '#27ae60' : '#95a5a6';
        ctx.fill();
    }
    
    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    getConnectionPointAt(x, y) {
        const threshold = 10;
        
        // Check input points
        for (let i = 0; i < this.inputs; i++) {
            const pos = this.getInputPosition(i);
            const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
            if (dist <= threshold) {
                return { type: 'input', index: i, component: this };
            }
        }
        
        // Check output point
        const outPos = this.getOutputPosition();
        const outDist = Math.sqrt((x - outPos.x) ** 2 + (y - outPos.y) ** 2);
        if (outDist <= threshold) {
            return { type: 'output', index: 0, component: this };
        }
        
        return null;
    }
}