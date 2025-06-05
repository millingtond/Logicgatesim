class CanvasManager {
    constructor(canvas, circuit) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.circuit = circuit;
        
        // State management
        this.state = {
            mode: 'select', // select, pan, wire, delete
            isMouseDown: false,
            isPanning: false,
            isWiring: false,
            isDragging: false,
            isSelecting: false,
            isDropping: false
        };
        
        // View transformation
        this.view = {
            x: 0,
            y: 0,
            zoom: 1,
            gridSize: 20,
            showGrid: true,
            snapToGrid: true
        };
        
        // Mouse tracking
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0
        };
        
        // Drag and selection
        this.dragInfo = {
            component: null,
            offsetX: 0,
            offsetY: 0,
            hasMoved: false
        };
        
        this.selectionBox = {
            active: false,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0
        };
        
        // Wiring
        this.wireInfo = {
            startComponent: null,
            startPort: null,
            tempEndX: 0,
            tempEndY: 0
        };
        
        // Hover effects
        this.hoverInfo = {
            component: null,
            connection: null,
            port: null
        };
        
        // Drop target for palette items
        this.dropTarget = {
            x: 0,
            y: 0,
            visible: false
        };
        
        // Animation
        this.animationId = null;
        this.lastFrameTime = 0;
        
        // Initialize
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupCircuitListeners();
        this.startRenderLoop();
        this.resize();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        
        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Drag and drop from palette
        this.canvas.addEventListener('dragover', this.handleDragOver.bind(this));
        this.canvas.addEventListener('drop', this.handleDrop.bind(this));
        this.canvas.addEventListener('dragleave', this.handleDragLeave.bind(this));
        
        // Window resize
        window.addEventListener('resize', this.resize.bind(this));
    }
    
    setupCircuitListeners() {
        // Listen to circuit changes for re-rendering
        this.circuit.addEventListener('componentAdded', () => this.render());
        this.circuit.addEventListener('componentRemoved', () => this.render());
        this.circuit.addEventListener('connectionAdded', () => this.render());
        this.circuit.addEventListener('connectionRemoved', () => this.render());
        this.circuit.addEventListener('componentMoved', () => this.render());
        this.circuit.addEventListener('selectionChanged', () => this.render());
    }
    
    // Coordinate transformation
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.view.x) / this.view.zoom,
            y: (screenY - this.view.y) / this.view.zoom
        };
    }
    
    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.view.zoom + this.view.x,
            y: worldY * this.view.zoom + this.view.y
        };
    }
    
    snapToGrid(value) {
        if (!this.view.snapToGrid) return value;
        return Math.round(value / this.view.gridSize) * this.view.gridSize;
    }
    
    // Mouse event handlers
handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        const worldPos = this.screenToWorld(this.mouse.x, this.mouse.y);
        this.mouse.worldX = worldPos.x;
        this.mouse.worldY = worldPos.y;
        this.mouse.startX = this.mouse.x;
        this.mouse.startY = this.mouse.y;
        
        this.state.isMouseDown = true;
        
        // Right click for pan
        if (e.button === 2) {
            this.state.isPanning = true;
            this.canvas.style.cursor = 'grabbing';
            return;
        }
        
        // Check if clicking on a component
        const component = this.circuit.getComponentAt(this.mouse.worldX, this.mouse.worldY);
        
        if (component) {
            // Handle input component clicks (switches, buttons)
            if (component.type === 'input' && component.handleClick) {
                const handled = component.handleClick(this.mouse.worldX, this.mouse.worldY);
                if (handled) {
                    // Don't start dragging if the component handled the click
                    return;
                }
            }
            
            // Check if clicking on a port for wiring
            const port = component.getConnectionPointAt(this.mouse.worldX, this.mouse.worldY);
            if (port && port.type === 'output') {
                this.startWiring(port.component, port);
                return;
            }
            
            // Selection and dragging logic
            if (e.ctrlKey || e.metaKey) {
                // Toggle selection with Ctrl/Cmd
                if (component.selected) {
                    this.circuit.deselectComponent(component.id);
                } else {
                    this.circuit.selectComponent(component.id);
                }
            } else if (!component.selected) {
                // Select only this component
                this.circuit.clearSelection();
                this.circuit.selectComponent(component.id);
            }
            
            // Start dragging
            this.dragInfo.component = component;
            this.dragInfo.offsetX = this.mouse.worldX - component.x;
            this.dragInfo.offsetY = this.mouse.worldY - component.y;
            this.dragInfo.hasMoved = false;
            this.state.isDragging = true;
            
            this.canvas.style.cursor = 'move';
        } else {
            // Start selection box
            if (!e.ctrlKey && !e.metaKey) {
                this.circuit.clearSelection();
            }
            
            this.selectionBox.active = true;
            this.selectionBox.startX = this.mouse.worldX;
            this.selectionBox.startY = this.mouse.worldY;
            this.selectionBox.endX = this.mouse.worldX;
            this.selectionBox.endY = this.mouse.worldY;
            this.state.isSelecting = true;
        }
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.lastX = this.mouse.x;
        this.mouse.lastY = this.mouse.y;
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        const worldPos = this.screenToWorld(this.mouse.x, this.mouse.y);
        this.mouse.worldX = worldPos.x;
        this.mouse.worldY = worldPos.y;
        
        // Update hover state
        this.updateHoverState();
        
        // Handle panning
        if (this.state.isPanning) {
            const dx = this.mouse.x - this.mouse.lastX;
            const dy = this.mouse.y - this.mouse.lastY;
            this.view.x += dx;
            this.view.y += dy;
            this.render();
            return;
        }
        
        // Handle wiring
        if (this.state.isWiring) {
            this.wireInfo.tempEndX = this.snapToGrid(this.mouse.worldX);
            this.wireInfo.tempEndY = this.snapToGrid(this.mouse.worldY);
            this.render();
            return;
        }
        
        // Handle dragging
        if (this.state.isDragging && this.dragInfo.component) {
            const newX = this.snapToGrid(this.mouse.worldX - this.dragInfo.offsetX);
            const newY = this.snapToGrid(this.mouse.worldY - this.dragInfo.offsetY);
            
            const dx = newX - this.dragInfo.component.x;
            const dy = newY - this.dragInfo.component.y;
            
            if (dx !== 0 || dy !== 0) {
                this.dragInfo.hasMoved = true;
                this.circuit.moveSelected(dx, dy);
            }
            return;
        }
        
        // Handle selection box
        if (this.state.isSelecting) {
            this.selectionBox.endX = this.mouse.worldX;
            this.selectionBox.endY = this.mouse.worldY;
            this.updateSelectionBox();
            this.render();
        }
        
        // Update cursor based on hover
        this.updateCursor();
    }
    
// Also add this to handleMouseUp to handle button releases
    handleMouseUp(e) {
        this.state.isMouseDown = false;
        
        // Handle button release
        this.circuit.components.forEach(component => {
            if (component.type === 'input' && component.handleMouseUp) {
                component.handleMouseUp();
            }
        });
        
        // End panning
        if (this.state.isPanning) {
            this.state.isPanning = false;
            this.canvas.style.cursor = 'default';
            return;
        }
        
        // End wiring
        if (this.state.isWiring) {
            const port = this.getPortAt(this.mouse.worldX, this.mouse.worldY);
            if (port && port.type === 'input') {
                this.circuit.addConnection(
                    this.wireInfo.startComponent,
                    this.wireInfo.startPort,
                    port.component,
                    port
                );
            }
            this.endWiring();
            return;
        }
        
        // End dragging
        if (this.state.isDragging) {
            this.state.isDragging = false;
            this.dragInfo.component = null;
            this.canvas.style.cursor = 'default';
            
            if (this.dragInfo.hasMoved) {
                this.circuit.saveToHistory();
            }
            return;
        }
        
        // End selection box
        if (this.state.isSelecting) {
            this.state.isSelecting = false;
            this.selectionBox.active = false;
            this.render();
        }
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Get world position before zoom
        const worldBefore = this.screenToWorld(mouseX, mouseY);
        
        // Apply zoom
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        this.view.zoom = Math.max(0.1, Math.min(5, this.view.zoom * zoomDelta));
        
        // Get world position after zoom
        const worldAfter = this.screenToWorld(mouseX, mouseY);
        
        // Adjust view to keep mouse position stable
        this.view.x += (worldAfter.x - worldBefore.x) * this.view.zoom;
        this.view.y += (worldAfter.y - worldBefore.y) * this.view.zoom;
        
        this.render();
    }
    
    handleContextMenu(e) {
        e.preventDefault();
    }
    
    // Keyboard handlers
    handleKeyDown(e) {
        // Delete selected components
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.circuit.selectedComponents.size > 0) {
                e.preventDefault();
                this.circuit.deleteSelected();
            }
        }
        
        // Select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            this.circuit.selectAll();
        }
        
        // Undo/Redo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                this.circuit.redo();
            } else {
                this.circuit.undo();
            }
        }
        
        // Copy/Paste (implement later)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            // TODO: Implement copy
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
            e.preventDefault();
            // TODO: Implement paste
        }
        
        // Escape to cancel operations
        if (e.key === 'Escape') {
            if (this.state.isWiring) {
                this.endWiring();
            }
            if (this.state.isSelecting) {
                this.state.isSelecting = false;
                this.selectionBox.active = false;
                this.render();
            }
        }
    }
    
    handleKeyUp(e) {
        // Handle key releases if needed
    }
    
    // Drag and drop handlers
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const worldPos = this.screenToWorld(x, y);
        
        this.dropTarget.x = this.snapToGrid(worldPos.x);
        this.dropTarget.y = this.snapToGrid(worldPos.y);
        this.dropTarget.visible = true;
        
        this.render();
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const worldPos = this.screenToWorld(x, y);
        
        const componentType = e.dataTransfer.getData('component-type');
        const componentSubtype = e.dataTransfer.getData('component-subtype');
        
        if (componentType && componentSubtype) {
            const snappedX = this.snapToGrid(worldPos.x);
            const snappedY = this.snapToGrid(worldPos.y);
            
            let component;
            if (componentType === 'gate') {
                component = new Gate(componentSubtype, snappedX, snappedY);
            } else if (componentType === 'input') {
                component = new InputComponent(componentSubtype, snappedX, snappedY);
            } else if (componentType === 'output') {
                component = new OutputComponent(componentSubtype, snappedX, snappedY);
            }
            
            if (component) {
                this.circuit.addComponent(component);
            }
        }
        
        this.dropTarget.visible = false;
        this.render();
    }
    
    handleDragLeave(e) {
        this.dropTarget.visible = false;
        this.render();
    }
    
    // Touch event handlers (mobile support)
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0
        });
        this.handleMouseDown(mouseEvent);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {
            button: 0
        });
        this.handleMouseUp(mouseEvent);
    }
    
    // Wiring methods
    startWiring(component, port) {
        this.state.isWiring = true;
        this.wireInfo.startComponent = component;
        this.wireInfo.startPort = port;
        this.wireInfo.tempEndX = this.mouse.worldX;
        this.wireInfo.tempEndY = this.mouse.worldY;
        this.canvas.style.cursor = 'crosshair';
    }
    
    endWiring() {
        this.state.isWiring = false;
        this.wireInfo.startComponent = null;
        this.wireInfo.startPort = null;
        this.canvas.style.cursor = 'default';
        this.render();
    }
    
    // Selection box
    updateSelectionBox() {
        const minX = Math.min(this.selectionBox.startX, this.selectionBox.endX);
        const minY = Math.min(this.selectionBox.startY, this.selectionBox.endY);
        const maxX = Math.max(this.selectionBox.startX, this.selectionBox.endX);
        const maxY = Math.max(this.selectionBox.startY, this.selectionBox.endY);
        
        // Select components within box
        this.circuit.components.forEach((component, id) => {
            const inBox = component.x >= minX && component.x <= maxX &&
                         component.y >= minY && component.y <= maxY;
            
            if (inBox && !component.selected) {
                this.circuit.selectComponent(id);
            } else if (!inBox && component.selected && !this.mouse.ctrlKey) {
                this.circuit.deselectComponent(id);
            }
        });
    }
    
    // Helper methods
    getPortAt(x, y) {
        for (const [id, component] of this.circuit.components) {
            if (component.getConnectionPointAt) {
                const port = component.getConnectionPointAt(x, y);
                if (port) return port;
            }
        }
        return null;
    }
    
    updateHoverState() {
        // Check for hovered component
        const component = this.circuit.getComponentAt(this.mouse.worldX, this.mouse.worldY);
        if (component !== this.hoverInfo.component) {
            this.hoverInfo.component = component;
            this.render();
        }
        
        // Check for hovered connection
        const connection = this.circuit.getConnectionAt(this.mouse.worldX, this.mouse.worldY);
        if (connection !== this.hoverInfo.connection) {
            this.hoverInfo.connection = connection;
            this.render();
        }
        
        // Check for hovered port
        const port = this.getPortAt(this.mouse.worldX, this.mouse.worldY);
        if (port !== this.hoverInfo.port) {
            this.hoverInfo.port = port;
            this.render();
        }
    }
    
    updateCursor() {
        // Check what we're hovering over
        const component = this.hoverInfo.component;
        
        if (component) {
            // Check if it's an interactive input component
            if (component.type === 'input' && 
                (component.subtype === 'switch' || 
                 component.subtype === 'button' || 
                 component.subtype === 'clock')) {
                this.canvas.style.cursor = 'pointer';
                return;
            }
            
            // Check if hovering over a connection point
            if (this.hoverInfo.port) {
                if (this.hoverInfo.port.type === 'output') {
                    this.canvas.style.cursor = 'crosshair';
                } else {
                    this.canvas.style.cursor = 'crosshair';
                }
                return;
            }
            
            // Default to move cursor for other components
            this.canvas.style.cursor = 'move';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    // Rendering
    startRenderLoop() {
        const animate = (timestamp) => {
            if (timestamp - this.lastFrameTime > 16) { // Cap at ~60fps
                this.render();
                this.lastFrameTime = timestamp;
            }
            this.animationId = requestAnimationFrame(animate);
        };
        this.animationId = requestAnimationFrame(animate);
    }
    
    stopRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state
        this.ctx.save();
        
        // Apply view transformation
        this.ctx.translate(this.view.x, this.view.y);
        this.ctx.scale(this.view.zoom, this.view.zoom);
        
        // Draw grid
        if (this.view.showGrid) {
            this.drawGrid();
        }
        
        // Draw drop target
        if (this.dropTarget.visible) {
            this.drawDropTarget();
        }
        
        // Draw connections
        this.circuit.connections.forEach(connection => {
            this.drawConnection(connection);
        });
        
        // Draw temporary wire while wiring
        if (this.state.isWiring) {
            this.drawTempWire();
        }
        
        // Draw components
        this.circuit.components.forEach(component => {
            if (component.draw) {
                component.draw(this.ctx);
            }
            
            // Draw hover effect
            if (component === this.hoverInfo.component && !component.selected) {
                this.drawHoverEffect(component);
            }
        });
        
        // Draw selection box
        if (this.selectionBox.active) {
            this.drawSelectionBox();
        }
        
        // Restore context state
        this.ctx.restore();
        
        // Draw UI elements (not affected by view transformation)
        this.drawUI();
    }
    
    drawGrid() {
        const gridSize = this.view.gridSize;
        const left = -this.view.x / this.view.zoom;
        const top = -this.view.y / this.view.zoom;
        const right = (this.canvas.width - this.view.x) / this.view.zoom;
        const bottom = (this.canvas.height - this.view.y) / this.view.zoom;
        
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1 / this.view.zoom;
        
        // Vertical lines
        for (let x = Math.floor(left / gridSize) * gridSize; x <= right; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, top);
            this.ctx.lineTo(x, bottom);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = Math.floor(top / gridSize) * gridSize; y <= bottom; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(left, y);
            this.ctx.lineTo(right, y);
            this.ctx.stroke();
        }
    }
    
    drawConnection(connection) {
        const from = this.circuit.getPortPosition(connection.fromComponent, connection.fromPort);
        const to = this.circuit.getPortPosition(connection.toComponent, connection.toPort);
        
        this.ctx.strokeStyle = connection.fromComponent.output ? '#27ae60' : '#95a5a6';
        this.ctx.lineWidth = connection === this.hoverInfo.connection ? 3 : 2;
        
        // Draw wire with Bezier curve
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        
        const controlOffset = Math.abs(to.x - from.x) * 0.5;
        this.ctx.bezierCurveTo(
            from.x + controlOffset, from.y,
            to.x - controlOffset, to.y,
            to.x, to.y
        );
        
        this.ctx.stroke();
        
        // Draw connection points
        this.ctx.fillStyle = connection.fromComponent.output ? '#27ae60' : '#95a5a6';
        this.ctx.beginPath();
        this.ctx.arc(from.x, from.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(to.x, to.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawTempWire() {
        const from = this.circuit.getPortPosition(
            this.wireInfo.startComponent,
            this.wireInfo.startPort
        );
        
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        
        const controlOffset = Math.abs(this.wireInfo.tempEndX - from.x) * 0.5;
        this.ctx.bezierCurveTo(
            from.x + controlOffset, from.y,
            this.wireInfo.tempEndX - controlOffset, this.wireInfo.tempEndY,
            this.wireInfo.tempEndX, this.wireInfo.tempEndY
        );
        
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawSelectionBox() {
        const minX = Math.min(this.selectionBox.startX, this.selectionBox.endX);
        const minY = Math.min(this.selectionBox.startY, this.selectionBox.endY);
        const width = Math.abs(this.selectionBox.endX - this.selectionBox.startX);
        const height = Math.abs(this.selectionBox.endY - this.selectionBox.startY);
        
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 1;
        
        this.ctx.fillRect(minX, minY, width, height);
        this.ctx.strokeRect(minX, minY, width, height);
    }
    
    drawDropTarget() {
        this.ctx.save();
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            this.dropTarget.x - 40,
            this.dropTarget.y - 30,
            80,
            60
        );
        this.ctx.restore();
    }
    
    drawHoverEffect(component) {
        this.ctx.save();
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeRect(
            component.x - 5,
            component.y - 5,
            component.width + 10,
            component.height + 10
        );
        this.ctx.restore();
    }
    
    drawUI() {
        // Draw zoom level
        this.ctx.save();
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.fillText(`Zoom: ${Math.round(this.view.zoom * 100)}%`, 10, this.canvas.height - 10);
        this.ctx.restore();
    }
    
    // Public methods
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }
    
    setMode(mode) {
        this.state.mode = mode;
        this.canvas.style.cursor = mode === 'pan' ? 'grab' : 'default';
    }
    
    resetView() {
        this.view.x = 0;
        this.view.y = 0;
        this.view.zoom = 1;
        this.render();
    }
    
    zoomToFit() {
        if (this.circuit.components.size === 0) return;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.circuit.components.forEach(component => {
            minX = Math.min(minX, component.x);
            minY = Math.min(minY, component.y);
            maxX = Math.max(maxX, component.x + component.width);
            maxY = Math.max(maxY, component.y + component.height);
        });
        
        const padding = 50;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;
        
        const scaleX = this.canvas.width / contentWidth;
        const scaleY = this.canvas.height / contentHeight;
        this.view.zoom = Math.min(scaleX, scaleY, 1);
        
        this.view.x = (this.canvas.width - contentWidth * this.view.zoom) / 2 - minX * this.view.zoom + padding * this.view.zoom;
        this.view.y = (this.canvas.height - contentHeight * this.view.zoom) / 2 - minY * this.view.zoom + padding * this.view.zoom;
        
        this.render();
    }
    
    toggleGrid() {
        this.view.showGrid = !this.view.showGrid;
        this.render();
    }
    
    toggleSnapToGrid() {
        this.view.snapToGrid = !this.view.snapToGrid;
    }
}