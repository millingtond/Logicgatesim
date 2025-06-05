class Wire {
    constructor(connection, circuit) {
        this.connection = connection;
        this.circuit = circuit;
        this.selected = false;
        this.hovering = false;
        
        // Wire appearance
        this.color = '#95a5a6';
        this.activeColor = '#27ae60';
        this.selectedColor = '#3498db';
        this.hoverColor = '#2980b9';
        this.errorColor = '#e74c3c';
        
        // Animation properties
        this.signalAnimation = {
            active: false,
            progress: 0,
            duration: 500, // milliseconds
            lastUpdate: 0
        };
        
        // Path calculation cache
        this.pathCache = null;
        this.lastFromPos = null;
        this.lastToPos = null;
        
        // Wire routing style
        this.routingStyle = 'bezier'; // 'bezier', 'straight', 'orthogonal'
    }
    
    update(deltaTime) {
        // Update signal animation
        if (this.signalAnimation.active) {
            this.signalAnimation.progress += deltaTime / this.signalAnimation.duration;
            if (this.signalAnimation.progress >= 1) {
                this.signalAnimation.progress = 0;
                this.signalAnimation.active = false;
            }
        }
    }
    
    draw(ctx) {
        const from = this.circuit.getPortPosition(
            this.connection.fromComponent,
            this.connection.fromPort
        );
        const to = this.circuit.getPortPosition(
            this.connection.toComponent,
            this.connection.toPort
        );
        
        // Check if we need to recalculate path
        if (!this.pathCache || 
            !this.positionsEqual(from, this.lastFromPos) || 
            !this.positionsEqual(to, this.lastToPos)) {
            this.calculatePath(from, to);
            this.lastFromPos = { ...from };
            this.lastToPos = { ...to };
        }
        
        // Determine wire state and color
        const isActive = this.connection.fromComponent.output || false;
        let wireColor = isActive ? this.activeColor : this.color;
        
        if (this.selected) {
            wireColor = this.selectedColor;
        } else if (this.hovering) {
            wireColor = this.hoverColor;
        }
        
        // Draw wire shadow for depth
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 4;
        ctx.translate(2, 2);
        this.drawPath(ctx);
        ctx.restore();
        
        // Draw main wire
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = this.selected || this.hovering ? 3 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        this.drawPath(ctx);
        
        // Draw signal animation
        if (isActive && this.signalAnimation.active) {
            this.drawSignalAnimation(ctx);
        }
        
        // Draw connection points
        this.drawConnectionPoints(ctx, from, to, isActive);
        
        // Draw wire joints if orthogonal routing
        if (this.routingStyle === 'orthogonal' && this.pathCache) {
            this.drawJoints(ctx);
        }
    }
    
    calculatePath(from, to) {
        switch (this.routingStyle) {
            case 'straight':
                this.pathCache = this.calculateStraightPath(from, to);
                break;
            case 'orthogonal':
                this.pathCache = this.calculateOrthogonalPath(from, to);
                break;
            case 'bezier':
            default:
                this.pathCache = this.calculateBezierPath(from, to);
                break;
        }
    }
    
    calculateStraightPath(from, to) {
        return {
            type: 'straight',
            points: [from, to]
        };
    }
    
    calculateBezierPath(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate control points for smooth curve
        const controlOffset = Math.min(distance * 0.5, 100);
        
        return {
            type: 'bezier',
            points: [from, to],
            controlPoints: [
                { x: from.x + controlOffset, y: from.y },
                { x: to.x - controlOffset, y: to.y }
            ]
        };
    }
    
    calculateOrthogonalPath(from, to) {
        const points = [from];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            // Very close, just connect directly
            points.push(to);
        } else {
            // Calculate intermediate points for orthogonal routing
            const midX = from.x + dx / 2;
            
            if (dx > 40) {
                // Horizontal first, then vertical
                points.push({ x: midX, y: from.y });
                points.push({ x: midX, y: to.y });
            } else {
                // Need to route around
                const offsetX = dx > 0 ? 30 : -30;
                points.push({ x: from.x + offsetX, y: from.y });
                points.push({ x: from.x + offsetX, y: to.y + (dy > 0 ? -30 : 30) });
                points.push({ x: to.x - offsetX, y: to.y + (dy > 0 ? -30 : 30) });
                points.push({ x: to.x - offsetX, y: to.y });
            }
            
            points.push(to);
        }
        
        return {
            type: 'orthogonal',
            points: points
        };
    }
    
    drawPath(ctx) {
        if (!this.pathCache) return;
        
        ctx.beginPath();
        
        switch (this.pathCache.type) {
            case 'straight':
                ctx.moveTo(this.pathCache.points[0].x, this.pathCache.points[0].y);
                ctx.lineTo(this.pathCache.points[1].x, this.pathCache.points[1].y);
                break;
                
            case 'bezier':
                const [from, to] = this.pathCache.points;
                const [cp1, cp2] = this.pathCache.controlPoints;
                ctx.moveTo(from.x, from.y);
                ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, to.x, to.y);
                break;
                
            case 'orthogonal':
                ctx.moveTo(this.pathCache.points[0].x, this.pathCache.points[0].y);
                for (let i = 1; i < this.pathCache.points.length; i++) {
                    ctx.lineTo(this.pathCache.points[i].x, this.pathCache.points[i].y);
                }
                break;
        }
        
        ctx.stroke();
    }
    
    drawSignalAnimation(ctx) {
        if (!this.pathCache) return;
        
        ctx.save();
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 1 - this.signalAnimation.progress;
        
        // Create a clipping path along the wire
        const progress = this.signalAnimation.progress;
        const startProgress = Math.max(0, progress - 0.2);
        
        ctx.beginPath();
        
        switch (this.pathCache.type) {
            case 'bezier':
                const [from, to] = this.pathCache.points;
                const [cp1, cp2] = this.pathCache.controlPoints;
                
                // Draw partial bezier curve for animation
                const t1 = startProgress;
                const t2 = progress;
                
                const p1 = this.getPointOnBezier(from, cp1, cp2, to, t1);
                const p2 = this.getPointOnBezier(from, cp1, cp2, to, t2);
                
                ctx.moveTo(p1.x, p1.y);
                
                // Approximate the bezier segment
                for (let t = t1; t <= t2; t += 0.05) {
                    const p = this.getPointOnBezier(from, cp1, cp2, to, t);
                    ctx.lineTo(p.x, p.y);
                }
                break;
                
            case 'straight':
            case 'orthogonal':
                // For straight/orthogonal, interpolate along the path
                const totalLength = this.getPathLength();
                const start = totalLength * startProgress;
                const end = totalLength * progress;
                
                const startPoint = this.getPointAtLength(start);
                const endPoint = this.getPointAtLength(end);
                
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(endPoint.x, endPoint.y);
                break;
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    drawConnectionPoints(ctx, from, to, isActive) {
        const radius = 4;
        
        // From point
        ctx.fillStyle = isActive ? this.activeColor : this.color;
        ctx.beginPath();
        ctx.arc(from.x, from.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add ring for selected/hover state
        if (this.selected || this.hovering) {
            ctx.strokeStyle = this.selected ? this.selectedColor : this.hoverColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(from.x, from.y, radius + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // To point
        ctx.fillStyle = isActive ? this.activeColor : this.color;
        ctx.beginPath();
        ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.selected || this.hovering) {
            ctx.beginPath();
            ctx.arc(to.x, to.y, radius + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawJoints(ctx) {
        if (this.pathCache.type !== 'orthogonal') return;
        
        ctx.fillStyle = this.selected ? this.selectedColor : this.color;
        
        // Draw small circles at each joint (except first and last)
        for (let i = 1; i < this.pathCache.points.length - 1; i++) {
            const point = this.pathCache.points[i];
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Helper methods
    getPointOnBezier(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        
        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
        };
    }
    
    getPathLength() {
        if (!this.pathCache) return 0;
        
        let length = 0;
        const points = this.pathCache.points;
        
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i-1].x;
            const dy = points[i].y - points[i-1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        
        return length;
    }
    
    getPointAtLength(targetLength) {
        if (!this.pathCache) return { x: 0, y: 0 };
        
        let currentLength = 0;
        const points = this.pathCache.points;
        
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i-1].x;
            const dy = points[i].y - points[i-1].y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);
            
            if (currentLength + segmentLength >= targetLength) {
                const ratio = (targetLength - currentLength) / segmentLength;
                return {
                    x: points[i-1].x + dx * ratio,
                    y: points[i-1].y + dy * ratio
                };
            }
            
            currentLength += segmentLength;
        }
        
        return points[points.length - 1];
    }
    
    isPointNear(x, y, threshold = 5) {
        if (!this.pathCache) return false;
        
        switch (this.pathCache.type) {
            case 'straight':
                return this.isPointNearLine(
                    x, y,
                    this.pathCache.points[0],
                    this.pathCache.points[1],
                    threshold
                );
                
            case 'bezier':
                // Sample points along the bezier curve
                for (let t = 0; t <= 1; t += 0.05) {
                    const point = this.getPointOnBezier(
                        this.pathCache.points[0],
                        this.pathCache.controlPoints[0],
                        this.pathCache.controlPoints[1],
                        this.pathCache.points[1],
                        t
                    );
                    const dist = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                    if (dist <= threshold) return true;
                }
                return false;
                
            case 'orthogonal':
                // Check each segment
                for (let i = 1; i < this.pathCache.points.length; i++) {
                    if (this.isPointNearLine(
                        x, y,
                        this.pathCache.points[i-1],
                        this.pathCache.points[i],
                        threshold
                    )) {
                        return true;
                    }
                }
                return false;
        }
        
        return false;
    }
    
    isPointNearLine(px, py, p1, p2, threshold) {
        const A = px - p1.x;
        const B = py - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = p1.x;
            yy = p1.y;
        } else if (param > 1) {
            xx = p2.x;
            yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy) <= threshold;
    }
    
    positionsEqual(pos1, pos2) {
        if (!pos1 || !pos2) return false;
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }
    
    startSignalAnimation() {
        this.signalAnimation.active = true;
        this.signalAnimation.progress = 0;
        this.signalAnimation.lastUpdate = Date.now();
    }
    
    setRoutingStyle(style) {
        if (['straight', 'bezier', 'orthogonal'].includes(style)) {
            this.routingStyle = style;
            this.pathCache = null; // Force recalculation
        }
    }
    
    setSelected(selected) {
        this.selected = selected;
    }
    
    setHovering(hovering) {
        this.hovering = hovering;
    }
}