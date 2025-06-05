// Main Application Entry Point
class LogicGateSimulator {
    constructor() {
        this.canvas = document.getElementById('circuit-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.circuit = new Circuit();
        this.canvasManager = new CanvasManager(this.canvas, this.circuit);
        this.simulator = new Simulator(this.circuit);
        this.palette = new Palette();
        this.propertiesPanel = new PropertiesPanel(this.circuit);
        this.toolbar = new Toolbar(this);
        
        this.mode = 'build';
        this.init();
        this.practiceMode = null;
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.startSimulation();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.canvasManager.render();
    }
    
    setupEventListeners() {
        // Mode switching
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.mode = e.target.dataset.mode;
                this.updateMode();
            });
        });
        
        // Expression to circuit
        document.getElementById('btn-expression-to-circuit').addEventListener('click', () => {
            const expression = document.getElementById('expression-input').value;
            if (expression) {
                this.buildCircuitFromExpression(expression);
            }
        });
    }
    
updateMode() {
    const practiceSection = document.getElementById('practice-section');
    if (this.mode === 'practice') {
        practiceSection.style.display = 'block';
        if (!this.practiceMode) {
            this.practiceMode = new PracticeMode(this.circuit, this.canvasManager);
        }
    } else {
        practiceSection.style.display = 'none';
    }
}
    
    buildCircuitFromExpression(expression) {
        try {
            const parser = new ExpressionParser();
            const circuitData = parser.parseToCircuit(expression);
            this.circuit.loadFromData(circuitData);
            this.canvasManager.render();
            this.simulator.simulate();
        } catch (error) {
            alert('Invalid expression: ' + error.message);
        }
    }
    
    startSimulation() {
        setInterval(() => {
            if (this.mode === 'build') {
                this.simulator.simulate();
                this.canvasManager.render();
                this.propertiesPanel.update();
            }
        }, 100);
    }
    
    startPracticeMode() {
        const generator = new QuestionGenerator();
        const question = generator.generateQuestion();
        // Display question in practice section
        // Implementation continues...
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.logicSimulator = new LogicGateSimulator();
});