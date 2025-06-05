class OutputComponent {
    constructor(subtype, x, y, id) {
        this.id = id || 'output-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        this.type = 'output';
        this.subtype = subtype; // 'bulb', 'display', 'probe', 'speaker'
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.value = false;
        this.inputConnections = [null];
        this.selected = false;
        this.label = '';
        
        // Subtype-specific properties
        this.setupSubtype();
    }
    
    setupSubtype() {
        switch(this.subtype) {
            case 'bulb':
                this.brightness = 0;
                this.targetBrightness = 0;
                break;
            case 'display':
                this.width = 80;
                this.height = 100;
                this.inputConnections = [null, null, null, null]; // 4-bit display
                this.values = [false, false, false, false];
                break;
            case 'probe':
                this.history = [];
                this.maxHistory = 50;
                break;
            case 'speaker':
                this.frequency = 440; // Hz
                this.audioContext = null;
                this.oscillator = null;
                break;
        }
    }
    
    getInputPosition(index) {
        if (this.subtype === 'display') {
            // 4 inputs for 4-bit display
            const spacing = this.height / 5;
            return {
                x: this.x,
                y: this.y + spacing * (index + 1)
            };
        } else {
            // Single input for other outputs
            return {
                x: this.x,
                y: this.y + this.height / 2
            };
        }
    }
    
evaluate() {
        switch(this.subtype) {
            case 'bulb':
                const input = this.inputConnections[0];
                this.value = input && input.fromComponent ? input.fromComponent.output : false;
                this.targetBrightness = this.value ? 1 : 0;
                // Smooth brightness transition
                const diff = this.targetBrightness - this.brightness;
                this.brightness += diff * 0.2;
                break;
                
            case 'display':
                // Read all 4 inputs for the display
                for (let i = 0; i < 4; i++) {
                    const input = this.inputConnections[i];
                    this.values[i] = input && input.fromComponent ? input.fromComponent.output : false;
                }
                // Calculate decimal value
                this.value = this.values.reduce((acc, bit, index) => 
                    acc + (bit ? Math.pow(2, index) : 0), 0
                );
                break;
                
            case 'probe':
                const probeInput = this.inputConnections[0];
                this.value = probeInput && probeInput.fromComponent ? probeInput.fromComponent.output : false;
                // Add to history
                this.history.push(this.value);
                if (this.history.length > this.maxHistory) {
                    this.history.shift();
                }
                break;
                
            case 'speaker':
                const speakerInput = this.inputConnections[0];
                this.value = speakerInput && speakerInput.fromComponent ? speakerInput.fromComponent.output : false;
                this.updateSound();
                break;
        }
        
        return this.value;
    }
    
    draw(ctx) {
        ctx.save();
        
        switch(this.subtype) {
            case 'bulb':
                this.drawBulb(ctx);
                break;
            case 'display':
                this.drawDisplay(ctx);
                break;
            case 'probe':
                this.drawProbe(ctx);
                break;
            case 'speaker':
                this.drawSpeaker(ctx);
                break;
        }
        
        // Draw input connection points
        this.drawInputPorts(ctx);
        
        // Draw label if exists
        if (this.label) {
            this.drawLabel(ctx);
        }
        
        ctx.restore();
    }
    
    drawBulb(ctx) {
        // Draw bulb base
        ctx.fillStyle = this.selected ? '#3498db' : '#34495e';
        ctx.fillRect(this.x + this.width/2 - 10, this.y + this.height - 15, 20, 15);
        
        // Draw bulb glass
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2 - 5);
        
        // Outer glass
        ctx.fillStyle = this.selected ? '#3498db' : '#ecf0f1';
        ctx.strokeStyle = this.selected ? '#2980b9' : '#95a5a6';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Inner glow (when on)
        if (this.brightness > 0.1) {
            ctx.globalAlpha = this.brightness;
            
            // Yellow glow
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
            gradient.addColorStop(0, '#f1c40f');
            gradient.addColorStop(0.5, '#f39c12');
            gradient.addColorStop(1, 'rgba(243, 156, 18, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Outer glow
            ctx.shadowBlur = 20 * this.brightness;
            ctx.shadowColor = '#f1c40f';
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // Draw filament
        ctx.strokeStyle = this.brightness > 0.5 ? '#f39c12' : '#7f8c8d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 - 5, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/2 + 5, this.y + this.height/2);
        ctx.stroke();
    }
    
    drawDisplay(ctx) {
        // Draw display body
        ctx.fillStyle = this.selected ? '#3498db' : '#2c3e50';
        ctx.strokeStyle = this.selected ? '#2980b9' : '#34495e';
        ctx.lineWidth = 2;
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw display screen
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 40);
        
        // Draw 7-segment display
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + 35);
        this.draw7Segment(ctx, this.value);
        ctx.restore();
        
        // Draw bit indicators
        ctx.font = '10px Arial';
        ctx.fillStyle = '#7f8c8d';
        ctx.textAlign = 'center';
        for (let i = 0; i < 4; i++) {
            const x = this.x + 15 + i * 15;
            const y = this.y + this.height - 15;
            
            // Bit label
            ctx.fillText(`B${i}`, x, y + 10);
            
            // LED indicator
            ctx.fillStyle = this.values[i] ? '#27ae60' : '#7f8c8d';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    draw7Segment(ctx, value) {
        const segments = [
            // Each segment: [x1, y1, x2, y2, x3, y3, x4, y4] (clockwise from top-left)
            [-10, -20, 10, -20, 8, -18, -8, -18], // A (top)
            [10, -20, 10, 0, 8, -2, 8, -18],      // B (top right)
            [10, 0, 10, 20, 8, 18, 8, 2],         // C (bottom right)
            [-10, 20, 10, 20, 8, 18, -8, 18],     // D (bottom)
            [-10, 0, -10, 20, -8, 18, -8, 2],     // E (bottom left)
            [-10, -20, -10, 0, -8, -2, -8, -18],  // F (top left)
            [-10, 0, 10, 0, 8, -2, -8, -2]        // G (middle)
        ];
        
        // Segment patterns for digits 0-F
        const patterns = [
            0x3F, // 0: ABCDEF
            0x06, // 1: BC
            0x5B, // 2: ABDEG
            0x4F, // 3: ABCDG
            0x66, // 4: BCFG
            0x6D, // 5: ACDFG
            0x7D, // 6: ACDEFG
            0x07, // 7: ABC
            0x7F, // 8: ABCDEFG
            0x6F, // 9: ABCDFG
            0x77, // A: ABCEFG
            0x7C, // B: CDEFG
            0x39, // C: ADEF
            0x5E, // D: BCDEG
            0x79, // E: ADEFG
            0x71  // F: AEFG
        ];
        
        const pattern = patterns[value % 16];
        
        segments.forEach((segment, index) => {
            const isOn = (pattern >> index) & 1;
            
            ctx.fillStyle = isOn ? '#e74c3c' : '#2c3e50';
            ctx.beginPath();
            ctx.moveTo(segment[0], segment[1]);
            ctx.lineTo(segment[2], segment[3]);
            ctx.lineTo(segment[4], segment[5]);
            ctx.lineTo(segment[6], segment[7]);
            ctx.closePath();
            ctx.fill();
        });
    }
    
    drawProbe(ctx) {
        // Draw probe body
        ctx.fillStyle = this.selected ? '#3498db' : '#34495e';
        ctx.strokeStyle = this.selected ? '#2980b9' : '#2c3e50';
        ctx.lineWidth = 2;
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw current state
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + 20);
        
        ctx.fillStyle = this.value ? '#27ae60' : '#e74c3c';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.value ? '1' : '0', 0, 0);
        
        ctx.restore();
        
        // Draw mini waveform
        if (this.history.length > 1) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            const startX = this.x + 5;
            const startY = this.y + 35;
            const width = this.width - 10;
            const height = 20;
            
            this.history.forEach((value, index) => {
                const x = startX + (index / this.maxHistory) * width;
                const y = startY + (value ? 0 : height);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    const prevValue = this.history[index - 1];
                    if (prevValue !== value) {
                        ctx.lineTo(x, startY + (prevValue ? 0 : height));
                    }
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        }
    }
    
    drawSpeaker(ctx) {
        // Draw speaker body
        ctx.fillStyle = this.selected ? '#3498db' : '#34495e';
        ctx.strokeStyle = this.selected ? '#2980b9' : '#2c3e50';
        ctx.lineWidth = 2;
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Draw speaker icon
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Speaker cone
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.lineTo(-5, 5);
        ctx.lineTo(5, 15);
        ctx.lineTo(5, -15);
        ctx.lineTo(-5, -5);
        ctx.closePath();
        ctx.fill();
        
        // Sound waves (when on)
        if (this.value) {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(10, 0, i * 5, -Math.PI/3, Math.PI/3);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    drawInputPorts(ctx) {
        const numInputs = this.inputConnections.length;
        
        for (let i = 0; i < numInputs; i++) {
            const pos = this.getInputPosition(i);
            const connection = this.inputConnections[i];
            const hasSignal = connection && connection.getValue && connection.getValue();
            
            ctx.fillStyle = hasSignal ? '#27ae60' : '#95a5a6';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw connection line
            ctx.strokeStyle = hasSignal ? '#27ae60' : '#95a5a6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(this.x + 10, pos.y);
            ctx.stroke();
        }
    }
    
    drawLabel(ctx) {
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#2c3e50';
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x + this.width/2, this.y - 5);
    }
    
    updateSound() {
        if (this.subtype !== 'speaker') return;
        
        if (this.value && !this.oscillator) {
            // Start sound
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            this.oscillator = this.audioContext.createOscillator();
            this.gainNode = this.audioContext.createGain();
            
            this.oscillator.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            this.oscillator.frequency.value = this.frequency;
            this.gainNode.gain.value = 0.1; // Low volume
            
            this.oscillator.start();
        } else if (!this.value && this.oscillator) {
            // Stop sound
            this.oscillator.stop();
            this.oscillator = null;
            this.gainNode = null;
        }
    }
    
    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    getConnectionPointAt(x, y) {
        const threshold = 10;
        
        for (let i = 0; i < this.inputConnections.length; i++) {
            const pos = this.getInputPosition(i);
            const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
            
            if (dist <= threshold) {
                return { type: 'input', index: i, component: this };
            }
        }
        
        return null;
    }
    
    setLabel(label) {
        this.label = label;
    }
    
    getValue() {
        return this.value;
    }
    
    // Cleanup method for audio
    destroy() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}