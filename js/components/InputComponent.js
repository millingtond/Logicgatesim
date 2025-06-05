class InputComponent {
    constructor(subtype, x, y, id) {
        this.id = id || 'input-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        this.type = 'input';
        this.subtype = subtype; // 'switch', 'button', 'clock', 'high', 'low'
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.value = false;
        this.output = false;
        this.outputConnections = [];
        this.selected = false;
        this.label = '';
        
        // Subtype-specific properties
        this.setupSubtype();
    }
    
    setupSubtype() {
        switch(this.subtype) {
            case 'switch':
                this.value = false;
                this.output = false;
                break;
            case 'button':
                this.value = false;
                this.output = false;
                this.isPressed = false;
                break;
            case 'clock':
                this.value = false;
                this.output = false;
                this.frequency = 1; // Hz
                this.lastToggle = Date.now();
                this.enabled = true;
                break;
            case 'high':
                this.value = true;
                this.output = true;
                break;
            case 'low':
                this.value = false;
                this.output = false;
                break;
        }
    }
    
    getOutputPosition() {
        return {
            x: this.x + this.width,
            y: this.y + this.height / 2
        };
    }
    
    evaluate() {
        switch(this.subtype) {
            case 'switch':
                this.output = this.value;
                break;
            case 'button':
                this.output = this.isPressed;
                break;
            case 'clock':
                if (this.enabled) {
                    const now = Date.now();
                    const period = 1000 / this.frequency; // milliseconds
                    if (now - this.lastToggle >= period / 2) {
                        this.value = !this.value;
                        this.lastToggle = now;
                    }
                }
                this.output = this.value;
                break;
            case 'high':
                this.output = true;
                break;
            case 'low':
                this.output = false;
                break;
        }
        
        return this.output;
    }
    
    draw(ctx) {
        ctx.save();
        
        switch(this.subtype) {
            case 'switch':
                this.drawSwitch(ctx);
                break;
            case 'button':
                this.drawButton(ctx);
                break;
            case 'clock':
                this.drawClock(ctx);
                break;
            case 'high':
                this.drawConstant(ctx, '1');
                break;
            case 'low':
                this.drawConstant(ctx, '0');
                break;
        }
        
        // Draw output connection point
        this.drawOutputPort(ctx);
        
        // Draw label if exists
        if (this.label) {
            this.drawLabel(ctx);
        }
        
        ctx.restore();
    }
    
    drawSwitch(ctx) {
        // Draw switch body
        ctx.fillStyle = this.selected ? '#3498db' : '#ecf0f1';
        ctx.strokeStyle = this.selected ? '#2980b9' : '#95a5a6';
        ctx.lineWidth = 2;
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw switch lever
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        if (this.value) {
            // ON position
            ctx.moveTo(-15, 5);
            ctx.lineTo(0, -5);
            ctx.lineTo(15, -15);
        } else {
            // OFF position
            ctx.moveTo(-15, -15);
            ctx.lineTo(0, -5);
            ctx.lineTo(15, 5);
        }
        ctx.stroke();
        
        // Draw pivot point
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(0, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Draw ON/OFF labels
        ctx.font = '10px Arial';
        ctx.fillStyle = '#7f8c8d';
        ctx.textAlign = 'center';
        ctx.fillText(this.value ? 'ON' : 'OFF', this.x + this.width/2, this.y + this.height - 5);
    }
    
    drawButton(ctx) {
        // Draw button body
        const isPressed = this.isPressed;
        const offset = isPressed ? 2 : 0;
        
        // Shadow
        if (!isPressed) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        }
        
        // Button
        ctx.fillStyle = this.selected ? '#3498db' : (isPressed ? '#34495e' : '#95a5a6');
        ctx.strokeStyle = this.selected ? '#2980b9' : '#7f8c8d';
        ctx.lineWidth = 2;
        
        ctx.fillRect(this.x + offset, this.y + offset, this.width - offset, this.height - offset);
        ctx.strokeRect(this.x + offset, this.y + offset, this.width - offset, this.height - offset);
        
        // Draw button symbol
        ctx.save();
        ctx.translate(this.x + this.width/2 + offset, this.y + this.height/2 + offset);
        
        ctx.fillStyle = isPressed ? '#ecf0f1' : '#2c3e50';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        if (isPressed) {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Label
        ctx.font = '10px Arial';
        ctx.fillStyle = '#7f8c8d';
        ctx.textAlign = 'center';
        ctx.fillText('PUSH', this.x + this.width/2, this.y + this.height - 5);
    }
    
    drawClock(ctx) {
        // Draw clock body
        ctx.fillStyle = this.selected ? '#3498db' : '#ecf0f1';
        ctx.strokeStyle = this.selected ? '#2980b9' : '#95a5a6';
        ctx.lineWidth = 2;
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw clock symbol
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Clock circle
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        // Clock wave
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        if (this.value) {
            ctx.lineTo(-7, 0);
            ctx.lineTo(-7, -10);
            ctx.lineTo(7, -10);
            ctx.lineTo(7, 0);
            ctx.lineTo(15, 0);
        } else {
            ctx.lineTo(-7, 0);
            ctx.lineTo(-7, 10);
            ctx.lineTo(7, 10);
            ctx.lineTo(7, 0);
            ctx.lineTo(15, 0);
        }
        ctx.stroke();
        
        ctx.restore();
        
        // Frequency label
        ctx.font = '10px Arial';
        ctx.fillStyle = '#7f8c8d';
        ctx.textAlign = 'center';
        ctx.fillText(this.frequency + ' Hz', this.x + this.width/2, this.y + this.height - 5);
    }
    
    drawConstant(ctx, value) {
        // Draw constant body
        ctx.fillStyle = this.selected ? '#3498db' : '#ecf0f1';
        ctx.strokeStyle = this.selected ? '#2980b9' : '#95a5a6';
        ctx.lineWidth = 2;
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw value
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = value === '1' ? '#27ae60' : '#e74c3c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, this.x + this.width/2, this.y + this.height/2);
    }
    
    drawOutputPort(ctx) {
        const pos = this.getOutputPosition();
        ctx.fillStyle = this.output ? '#27ae60' : '#95a5a6';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw connection line
        ctx.strokeStyle = this.output ? '#27ae60' : '#95a5a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 10, this.y + this.height/2);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
    
    drawLabel(ctx) {
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x + this.width/2, this.y - 5);
    }
    
    handleClick(x, y) {
        if (!this.isPointInside(x, y)) return false;
        
        switch(this.subtype) {
            case 'switch':
                this.value = !this.value;
                return true;
            case 'clock':
                this.enabled = !this.enabled;
                return true;
            default:
                return false;
        }
    }
    
    handleMouseDown(x, y) {
        if (!this.isPointInside(x, y)) return false;
        
        if (this.subtype === 'button') {
            this.isPressed = true;
            return true;
        }
        return false;
    }
    
    handleMouseUp() {
        if (this.subtype === 'button') {
            this.isPressed = false;
        }
    }
    
    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    getConnectionPointAt(x, y) {
        const threshold = 10;
        const pos = this.getOutputPosition();
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        
        if (dist <= threshold) {
            return { type: 'output', index: 0, component: this };
        }
        
        return null;
    }
    
    setFrequency(freq) {
        if (this.subtype === 'clock') {
            this.frequency = Math.max(0.1, Math.min(10, freq));
        }
    }
    
    setLabel(label) {
        this.label = label;
    }
    
    getValue() {
        return this.output;
    }
}