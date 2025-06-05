class PracticeMode {
    constructor(circuit, canvasManager) {
        this.circuit = circuit;
        this.canvasManager = canvasManager;
        this.questionGenerator = new QuestionGenerator();
        this.currentQuestion = null;
        this.score = 0;
        this.streak = 0;
        this.questionsCompleted = 0;
        this.startTime = null;
        this.questionStartTime = null;
        
        // UI elements
        this.container = null;
        this.questionPanel = null;
        this.feedbackPanel = null;
        this.progressBar = null;
        
        // Practice settings
        this.settings = {
            difficulty: 'beginner',
            questionTypes: ['expressionToCircuit', 'circuitToExpression'],
            showHints: true,
            timedMode: false,
            timeLimit: 300 // seconds
        };
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.loadProgress();
        this.setupEventListeners();
    }
    
    createUI() {
        // Find or create practice section
        let practiceSection = document.getElementById('practice-section');
        if (!practiceSection) {
            practiceSection = document.createElement('section');
            practiceSection.id = 'practice-section';
            practiceSection.className = 'practice-mode-container';
            practiceSection.style.display = 'none';
            
            // Insert into properties panel or create separate panel
            const propertiesPanel = document.querySelector('.properties-panel');
            if (propertiesPanel) {
                propertiesPanel.appendChild(practiceSection);
            }
        }
        
        practiceSection.innerHTML = `
            <div class="practice-header">
                <h2>Practice Mode</h2>
                <div class="practice-stats">
                    <div class="stat-item">
                        <span class="stat-label">Score:</span>
                        <span class="stat-value" id="practice-score">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Streak:</span>
                        <span class="stat-value" id="practice-streak">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Level:</span>
                        <span class="stat-value" id="practice-level">Beginner</span>
                    </div>
                </div>
            </div>
            
            <div class="practice-settings">
                <h3>Settings</h3>
                <div class="setting-group">
                    <label>Difficulty:</label>
                    <select id="practice-difficulty" class="setting-select">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label>Question Types:</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" value="expressionToCircuit" checked>
                            Expression → Circuit
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="circuitToExpression" checked>
                            Circuit → Expression
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="truthTableCompletion">
                            Truth Table
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="circuitDebugging">
                            Debug Circuit
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="gateIdentification">
                            Gate ID
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" value="simplification">
                            Simplify
                        </label>
                    </div>
                </div>
                <div class="setting-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="practice-hints" checked>
                        Show Hints
                    </label>
                </div>
                <div class="setting-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="practice-timed">
                        Timed Mode
                    </label>
                </div>
                <button id="start-practice" class="btn-primary">Start Practice</button>
            </div>
            
            <div id="question-panel" class="question-panel" style="display: none;">
                <div class="question-header">
                    <h3 id="question-type">Question Type</h3>
                    <div class="question-timer" id="question-timer" style="display: none;">
                        <span class="timer-icon">⏱️</span>
                        <span class="timer-value">5:00</span>
                    </div>
                </div>
                <div class="question-content" id="question-content">
                    <!-- Dynamic content -->
                </div>
                <div class="hint-section" id="hint-section" style="display: none;">
                    <button class="hint-btn" id="show-hint">💡 Show Hint</button>
                    <div class="hint-content" id="hint-content" style="display: none;"></div>
                </div>
                <div class="answer-section" id="answer-section">
                    <!-- Dynamic answer input -->
                </div>
                <div class="question-actions">
                    <button id="check-answer" class="btn-primary">Check Answer</button>
                    <button id="skip-question" class="btn-secondary">Skip</button>
                    <button id="end-practice" class="btn-secondary">End Practice</button>
                </div>
            </div>
            
            <div id="feedback-panel" class="feedback-panel" style="display: none;">
                <div class="feedback-content" id="feedback-content">
                    <!-- Dynamic feedback -->
                </div>
                <button id="next-question" class="btn-primary">Next Question</button>
            </div>
            
            <div class="progress-section">
                <h3>Progress</h3>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                </div>
                <div class="achievement-list" id="achievement-list">
                    <!-- Dynamic achievements -->
                </div>
            </div>
        `;
        
        this.container = practiceSection;
        this.questionPanel = document.getElementById('question-panel');
        this.feedbackPanel = document.getElementById('feedback-panel');
        this.progressBar = document.getElementById('progress-fill');
    }
    
    setupEventListeners() {
        // Settings
        document.getElementById('practice-difficulty').addEventListener('change', (e) => {
            this.settings.difficulty = e.target.value;
            this.questionGenerator.setDifficulty(e.target.value);
        });
        
        document.getElementById('practice-hints').addEventListener('change', (e) => {
            this.settings.showHints = e.target.checked;
        });
        
        document.getElementById('practice-timed').addEventListener('change', (e) => {
            this.settings.timedMode = e.target.checked;
        });
        
        // Question type checkboxes
        document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateQuestionTypes();
            });
        });
        
        // Buttons
        document.getElementById('start-practice').addEventListener('click', () => {
            this.startPractice();
        });
        
        document.getElementById('check-answer').addEventListener('click', () => {
            this.checkAnswer();
        });
        
        document.getElementById('skip-question').addEventListener('click', () => {
            this.skipQuestion();
        });
        
        document.getElementById('show-hint').addEventListener('click', () => {
            this.showHint();
        });
        
        document.getElementById('next-question').addEventListener('click', () => {
            this.nextQuestion();
        });
        
        document.getElementById('end-practice').addEventListener('click', () => {
            this.endPractice();
        });
    }
    
    updateQuestionTypes() {
        const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
        this.settings.questionTypes = Array.from(checkboxes).map(cb => cb.value);
    }
    
    startPractice() {
        this.startTime = Date.now();
        this.score = 0;
        this.streak = 0;
        this.questionsCompleted = 0;
        
        // Hide settings, show question
        document.querySelector('.practice-settings').style.display = 'none';
        this.questionPanel.style.display = 'block';
        
        // Generate first question
        this.generateQuestion();
        
        // Start timer if timed mode
        if (this.settings.timedMode) {
            this.startTimer();
        }
    }
    
    generateQuestion() {
        // Select random question type from enabled types
        const questionType = this.settings.questionTypes[
            Math.floor(Math.random() * this.settings.questionTypes.length)
        ];
        
        this.currentQuestion = this.questionGenerator.generateQuestion(questionType);
        this.questionStartTime = Date.now();
        
        // Update UI
        this.displayQuestion();
        
        // Clear previous circuit if needed
        if (this.currentQuestion.type === 'expressionToCircuit') {
            this.circuit.clear();
        }
    }
    
    displayQuestion() {
        const questionContent = document.getElementById('question-content');
        const answerSection = document.getElementById('answer-section');
        const questionType = document.getElementById('question-type');
        
        // Update question type header
        const typeLabels = {
            'expressionToCircuit': 'Build Circuit from Expression',
            'circuitToExpression': 'Write Expression from Circuit',
            'truthTableCompletion': 'Complete Truth Table',
            'circuitDebugging': 'Debug Circuit',
            'gateIdentification': 'Identify Gate',
            'simplification': 'Simplify Expression'
        };
        
        questionType.textContent = typeLabels[this.currentQuestion.type] || 'Question';
        
        // Display question content
        switch (this.currentQuestion.type) {
            case 'expressionToCircuit':
                this.displayExpressionToCircuit();
                break;
            case 'circuitToExpression':
                this.displayCircuitToExpression();
                break;
            case 'truthTableCompletion':
                this.displayTruthTableCompletion();
                break;
            case 'circuitDebugging':
                this.displayCircuitDebugging();
                break;
            case 'gateIdentification':
                this.displayGateIdentification();
                break;
            case 'simplification':
                this.displaySimplification();
                break;
        }
        
        // Show hints section if enabled
        if (this.settings.showHints && this.currentQuestion.hints) {
            document.getElementById('hint-section').style.display = 'block';
            document.getElementById('hint-content').style.display = 'none';
        } else {
            document.getElementById('hint-section').style.display = 'none';
        }
    }
    
    displayExpressionToCircuit() {
        const content = document.getElementById('question-content');
        content.innerHTML = `
            <div class="expression-question">
                <p>${this.currentQuestion.question}</p>
                <div class="expression-display-large">
                    ${this.formatExpression(this.currentQuestion.expression)}
                </div>
                <div class="variable-info">
                    <strong>Variables:</strong> ${this.currentQuestion.variables.join(', ')}
                </div>
                <p class="instruction">Build the circuit in the canvas to the left.</p>
            </div>
        `;
        
        // Clear answer section for this type
        document.getElementById('answer-section').innerHTML = '';
        
        // Enable circuit building
        this.canvasManager.setMode('build');
    }
    
    displayCircuitToExpression() {
        // Load the circuit
        this.circuit.loadFromSnapshot(this.currentQuestion.circuit);
        this.canvasManager.zoomToFit();
        
        const content = document.getElementById('question-content');
        content.innerHTML = `
            <div class="circuit-question">
                <p>${this.currentQuestion.question}</p>
                <p class="instruction">Look at the circuit on the canvas.</p>
            </div>
        `;
        
        const answerSection = document.getElementById('answer-section');
        answerSection.innerHTML = `
            <div class="expression-input-group">
                <label>Enter Boolean Expression:</label>
                <input type="text" 
                       id="expression-answer" 
                       class="expression-input-field" 
                       placeholder="e.g., (A AND B) OR (NOT C)">
                <div class="expression-help">
                    Use AND, OR, NOT, XOR, NAND, NOR. Use parentheses for grouping.
                </div>
            </div>
        `;
    }
    
    displayTruthTableCompletion() {
        const content = document.getElementById('question-content');
        content.innerHTML = `
            <div class="truth-table-question">
                <p>${this.currentQuestion.question}</p>
                <div class="expression-display-medium">
                    ${this.formatExpression(this.currentQuestion.expression)}
                </div>
            </div>
        `;
        
        const answerSection = document.getElementById('answer-section');
        let tableHTML = '<table class="truth-table-interactive">';
        
        // Header
        tableHTML += '<thead><tr>';
        this.currentQuestion.variables.forEach(v => {
            tableHTML += `<th>${v}</th>`;
        });
        tableHTML += '<th class="separator"></th><th>Output</th></tr></thead>';
        
        // Body
        tableHTML += '<tbody>';
        this.currentQuestion.incompleteTable.forEach((row, index) => {
            tableHTML += '<tr>';
            
            // Input values
            this.currentQuestion.variables.forEach(v => {
                tableHTML += `<td>${row.inputs[v] ? '1' : '0'}</td>`;
            });
            
            // Separator
            tableHTML += '<td class="separator"></td>';
            
            // Output value (editable if null)
            if (row.output === null) {
                tableHTML += `<td>
                    <select class="truth-table-answer" data-row="${index}">
                        <option value="">?</option>
                        <option value="0">0</option>
                        <option value="1">1</option>
                    </select>
                </td>`;
            } else {
                tableHTML += `<td class="${row.output ? 'high' : 'low'}">${row.output ? '1' : '0'}</td>`;
            }
            
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';
        
        answerSection.innerHTML = tableHTML;
    }
    
    displayCircuitDebugging() {
        // Load the faulty circuit
        this.circuit.loadFromSnapshot(this.currentQuestion.faultyCircuit);
        this.canvasManager.zoomToFit();
        
        const content = document.getElementById('question-content');
        content.innerHTML = `
            <div class="debugging-question">
                <p>${this.currentQuestion.question}</p>
                <div class="fault-info">
                    <p><strong>Expected behavior:</strong></p>
                    <div class="expression-display-medium">
                        ${this.formatExpression(this.currentQuestion.expression)}
                    </div>
                    <p class="instruction">Fix the circuit to match the expected expression.</p>
                    <p class="hint-text">There are ${this.currentQuestion.faults.length} error(s) to find.</p>
                </div>
            </div>
        `;
        
        document.getElementById('answer-section').innerHTML = '';
    }
    
    displayGateIdentification() {
        const content = document.getElementById('question-content');
        let tableHTML = '<table class="truth-table-display">';
        
        // Create truth table
        tableHTML += '<thead><tr>';
        const firstRow = this.currentQuestion.truthTable[0];
        Object.keys(firstRow.inputs).forEach(input => {
            tableHTML += `<th>${input}</th>`;
        });
        tableHTML += '<th class="separator"></th><th>Output</th></tr></thead>';
        
        tableHTML += '<tbody>';
        this.currentQuestion.truthTable.forEach(row => {
            tableHTML += '<tr>';
            Object.values(row.inputs).forEach(value => {
                tableHTML += `<td>${value ? '1' : '0'}</td>`;
            });
            tableHTML += `<td class="separator"></td>`;
            tableHTML += `<td class="${row.output ? 'high' : 'low'}">${row.output ? '1' : '0'}</td>`;
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';
        
        content.innerHTML = `
            <div class="gate-id-question">
                <p>${this.currentQuestion.question}</p>
                ${tableHTML}
            </div>
        `;
        
        const answerSection = document.getElementById('answer-section');
        answerSection.innerHTML = `
            <div class="gate-options">
                ${this.currentQuestion.options.map(gate => `
                    <label class="gate-option">
                        <input type="radio" name="gate-answer" value="${gate}">
                        <span class="gate-label">${gate}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }
    
    displaySimplification() {
        const content = document.getElementById('question-content');
        content.innerHTML = `
            <div class="simplification-question">
                <p>${this.currentQuestion.question}</p>
                <div class="expression-display-large">
                    ${this.formatExpression(this.currentQuestion.expression)}
                </div>
            </div>
        `;
        
        const answerSection = document.getElementById('answer-section');
        answerSection.innerHTML = `
            <div class="expression-input-group">
                <label>Enter Simplified Expression:</label>
                <input type="text" 
                       id="simplified-answer" 
                       class="expression-input-field" 
                       placeholder="Enter your simplified expression">
                <div class="expression-help">
                    Apply Boolean algebra laws to simplify.
                </div>
            </div>
        `;
    }
    
    formatExpression(expression) {
        return expression
            .replace(/AND/g, '<span class="operator">∧</span>')
            .replace(/OR/g, '<span class="operator">∨</span>')
            .replace(/NOT/g, '<span class="operator">¬</span>')
            .replace(/XOR/g, '<span class="operator">⊕</span>')
            .replace(/NAND/g, '<span class="operator">⊼</span>')
            .replace(/NOR/g, '<span class="operator">⊽</span>')
            .replace(/\(/g, '<span class="paren">(</span>')
            .replace(/\)/g, '<span class="paren">)</span>');
    }
    
    checkAnswer() {
        let isCorrect = false;
        let userAnswer = null;
        
        switch (this.currentQuestion.type) {
            case 'expressionToCircuit':
                userAnswer = this.circuit;
                isCorrect = this.checkCircuitAnswer();
                break;
                
            case 'circuitToExpression':
                userAnswer = document.getElementById('expression-answer').value;
                isCorrect = this.checkExpressionAnswer(userAnswer);
                break;
                
            case 'truthTableCompletion':
                userAnswer = this.getTruthTableAnswers();
                isCorrect = this.checkTruthTableAnswer(userAnswer);
                break;
                
            case 'circuitDebugging':
                userAnswer = this.circuit;
                isCorrect = this.checkDebuggingAnswer();
                break;
                
            case 'gateIdentification':
                const selected = document.querySelector('input[name="gate-answer"]:checked');
                userAnswer = selected ? selected.value : null;
                isCorrect = userAnswer === this.currentQuestion.correctAnswer;
                break;
                
            case 'simplification':
                userAnswer = document.getElementById('simplified-answer').value;
                isCorrect = this.checkSimplificationAnswer(userAnswer);
                break;
        }
        
        this.showFeedback(isCorrect, userAnswer);
    }
    
    checkCircuitAnswer() {
        // Generate truth table for user's circuit
        const generator = new TruthTableGenerator(this.circuit);
        const userTable = generator.generate();
        
        if (!userTable || userTable.rows.length === 0) {
            return false;
        }
        
        // Compare with correct truth table
        return this.compareTruthTables(userTable.rows, this.currentQuestion.truthTable);
    }
    
    checkExpressionAnswer(userExpression) {
        try {
            const parser = new ExpressionParser();
            
            // Normalize both expressions
            const userNormalized = this.normalizeExpression(userExpression);
            const correctNormalized = this.normalizeExpression(this.currentQuestion.correctAnswer);
            
            // First check if they're textually identical
            if (userNormalized === correctNormalized) {
                return true;
            }
            
            // If not, check logical equivalence via truth tables
            const userTable = parser.calculateTruthTable(userExpression, this.currentQuestion.circuit.variables);
            const correctTable = parser.calculateTruthTable(this.currentQuestion.correctAnswer, this.currentQuestion.circuit.variables);
            
            return this.compareTruthTables(userTable, correctTable);
        } catch (error) {
            return false;
        }
    }
    
    checkTruthTableAnswer(answers) {
        return this.currentQuestion.hiddenIndices.every(index => {
            const userAnswer = answers[index];
            const correctAnswer = this.currentQuestion.completeTable[index].output;
            return (userAnswer === '1') === correctAnswer;
        });
    }
    
    checkDebuggingAnswer() {
        // Check if the circuit now matches the expected expression
        const analyzer = new CircuitAnalyzer(this.circuit);
        const analysis = analyzer.analyze();
        
        if (!analysis.expression) {
            return false;
        }
        
        // Compare truth tables
        const parser = new ExpressionParser();
        const userTable = parser.calculateTruthTable(analysis.expression, this.currentQuestion.variables);
        const correctTable = parser.calculateTruthTable(this.currentQuestion.expression, this.currentQuestion.variables);
        
        return this.compareTruthTables(userTable, correctTable);
    }
    
    checkSimplificationAnswer(userExpression) {
        try {
            const parser = new ExpressionParser();
            
            // Check if the user's expression is logically equivalent to both
            // the original and the simplified version
            const originalTable = parser.calculateTruthTable(this.currentQuestion.expression, this.getVariables(this.currentQuestion.expression));
            const userTable = parser.calculateTruthTable(userExpression, this.getVariables(userExpression));
            
            return this.compareTruthTables(originalTable, userTable);
        } catch (error) {
            return false;
        }
    }
    
    normalizeExpression(expr) {
        return expr
            .toUpperCase()
            .replace(/\s+/g, ' ')
            .replace(/[∧·*]/g, 'AND')
            .replace(/[∨+]/g, 'OR')
            .replace(/[¬!']/g, 'NOT')
            .replace(/⊕/g, 'XOR')
            .replace(/⊼/g, 'NAND')
            .replace(/⊽/g, 'NOR')
            .trim();
    }
    
    compareTruthTables(table1, table2) {
        if (table1.length !== table2.length) return false;
        
        return table1.every((row1, index) => {
            const row2 = table2[index];
            
            // Handle different table formats
            const output1 = row1.output !== undefined ? row1.output : 
                          (row1.outputs ? Object.values(row1.outputs)[0] : false);
            const output2 = row2.output !== undefined ? row2.output : 
                          (row2.outputs ? Object.values(row2.outputs)[0] : false);
            
            return output1 === output2;
        });
    }
    
    getTruthTableAnswers() {
        const answers = {};
        document.querySelectorAll('.truth-table-answer').forEach(select => {
            const row = parseInt(select.dataset.row);
            answers[row] = select.value;
        });
        return answers;
    }
    
    getVariables(expression) {
        const matches = expression.match(/\b[A-Z]\b/g);
        return [...new Set(matches || [])].sort();
    }
    
    showFeedback(isCorrect, userAnswer) {
        const feedbackContent = document.getElementById('feedback-content');
        const timeTaken = Math.round((Date.now() - this.questionStartTime) / 1000);
        
        if (isCorrect) {
            this.score += this.currentQuestion.points;
            this.streak++;
            this.questionsCompleted++;
            
            feedbackContent.innerHTML = `
                <div class="feedback-success">
                    <div class="success-icon">✅</div>
                    <h3>Correct!</h3>
                    <p>Great job! You earned ${this.currentQuestion.points} points.</p>
                    <p class="time-info">Time taken: ${timeTaken} seconds</p>
                    ${this.streak >= 3 ? `<p class="streak-info">🔥 ${this.streak} in a row!</p>` : ''}
                </div>
            `;
            
            // Check for achievements
            this.checkAchievements();
        } else {
            this.streak = 0;
            
            feedbackContent.innerHTML = `
                <div class="feedback-error">
                    <div class="error-icon">❌</div>
                    <h3>Not Quite Right</h3>
                    <p>Let's review the correct answer.</p>
                    ${this.getDetailedFeedback(userAnswer)}
                </div>
            `;
        }
        
        // Update UI
        this.updateStats();
        this.questionPanel.style.display = 'none';
        this.feedbackPanel.style.display = 'block';
    }
    
    getDetailedFeedback(userAnswer) {
        let feedback = '<div class="detailed-feedback">';
        
        switch (this.currentQuestion.type) {
            case 'expressionToCircuit':
                feedback += `
                    <p><strong>Expected expression:</strong></p>
                    <div class="expression-display-small">
                        ${this.formatExpression(this.currentQuestion.expression)}
                    </div>
                    <p>Your circuit didn't match this expression. Check your connections and gate types.</p>
                `;
                break;
                
            case 'circuitToExpression':
                feedback += `
                    <p><strong>Correct expression:</strong></p>
                    <div class="expression-display-small">
                        ${this.formatExpression(this.currentQuestion.correctAnswer)}
                    </div>
                    ${userAnswer ? `<p><strong>Your answer:</strong> ${userAnswer}</p>` : ''}
                `;
                break;
                
            case 'truthTableCompletion':
                feedback += '<p>Here\'s the complete truth table:</p>';
                feedback += this.generateCompleteTruthTableHTML();
                break;
                
            case 'gateIdentification':
                feedback += `
                    <p><strong>Correct answer:</strong> ${this.currentQuestion.correctAnswer}</p>
                    ${userAnswer ? `<p><strong>Your answer:</strong> ${userAnswer}</p>` : ''}
                `;
                break;
        }
        
        feedback += '</div>';
        return feedback;
    }
    
    generateCompleteTruthTableHTML() {
        let html = '<table class="truth-table-complete">';
        
        // Header
        html += '<thead><tr>';
        this.currentQuestion.variables.forEach(v => {
            html += `<th>${v}</th>`;
        });
        html += '<th class="separator"></th><th>Output</th></tr></thead>';
        
        // Body
        html += '<tbody>';
        this.currentQuestion.completeTable.forEach((row, index) => {
            const wasHidden = this.currentQuestion.hiddenIndices.includes(index);
            html += `<tr class="${wasHidden ? 'was-hidden' : ''}">`;
            
            // Input values
            this.currentQuestion.variables.forEach(v => {
                html += `<td>${row.inputs[v] ? '1' : '0'}</td>`;
            });
            
            // Output
            html += `<td class="separator"></td>`;
            html += `<td class="${row.output ? 'high' : 'low'}">${row.output ? '1' : '0'}</td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        return html;
    }
    
    showHint() {
        const hintContent = document.getElementById('hint-content');
        const hints = this.currentQuestion.hints;
        
        if (hints && hints.length > 0) {
            // Show next hint
            const currentHintCount = hintContent.children.length;
            if (currentHintCount < hints.length) {
                const hintElement = document.createElement('div');
                hintElement.className = 'hint-item';
                hintElement.innerHTML = `💡 ${hints[currentHintCount]}`;
                hintContent.appendChild(hintElement);
                hintContent.style.display = 'block';
                
                // Reduce points for using hint
                this.currentQuestion.points = Math.max(
                    Math.floor(this.currentQuestion.points * 0.8),
                    1
                );
            }
        }
    }
    
    skipQuestion() {
        this.streak = 0;
        this.showFeedback(false, null);
    }
    
    nextQuestion() {
        this.feedbackPanel.style.display = 'none';
        this.questionPanel.style.display = 'block';
        this.generateQuestion();
    }
    
    endPractice() {
        const totalTime = Math.round((Date.now() - this.startTime) / 1000);
        
        // Show summary
        this.container.innerHTML = `
            <div class="practice-summary">
                <h2>Practice Complete!</h2>
                <div class="summary-stats">
                    <div class="stat-card">
                        <div class="stat-value">${this.score}</div>
                        <div class="stat-label">Total Score</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.questionsCompleted}</div>
                        <div class="stat-label">Questions Completed</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}</div>
                        <div class="stat-label">Time Spent</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.getAccuracy()}%</div>
                        <div class="stat-label">Accuracy</div>
                    </div>
                </div>
                <div class="achievements-earned">
                    ${this.getEarnedAchievements()}
                </div>
                <button class="btn-primary" onclick="location.reload()">Back to Main</button>
            </div>
        `;
        
        // Save progress
        this.saveProgress();
    }
    
    updateStats() {
        document.getElementById('practice-score').textContent = this.score;
        document.getElementById('practice-streak').textContent = this.streak;
        document.getElementById('practice-level').textContent = 
            this.settings.difficulty.charAt(0).toUpperCase() + this.settings.difficulty.slice(1);
    }
    
    checkAchievements() {
        const achievements = [];
        
        if (this.streak === 3) {
            achievements.push({
                icon: '🔥',
                title: 'On Fire!',
                description: '3 correct answers in a row'
            });
        }
        
        if (this.streak === 5) {
            achievements.push({
                icon: '⚡',
                title: 'Lightning Fast!',
                description: '5 correct answers in a row'
            });
        }
        
        if (this.score >= 100) {
            achievements.push({
                icon: '💯',
                title: 'Century!',
                description: 'Reached 100 points'
            });
        }
        
        if (achievements.length > 0) {
            this.showAchievements(achievements);
        }
    }
    
    showAchievements(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                const notification = document.createElement('div');
                notification.className = 'achievement-notification';
                notification.innerHTML = `
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-text">
                        <div class="achievement-title">${achievement.title}</div>
                        <div class="achievement-description">${achievement.description}</div>
                    </div>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.classList.add('show'), 10);
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
            }, index * 500);
        });
    }
    
    getAccuracy() {
        // This would need to track correct vs incorrect answers
        return 75; // Placeholder
    }
    
    getEarnedAchievements() {
        // Return HTML for earned achievements
        return '<p>Great practice session!</p>';
    }
    
    startTimer() {
        const timerDisplay = document.getElementById('question-timer');
        const timerValue = timerDisplay.querySelector('.timer-value');
        timerDisplay.style.display = 'flex';
        
        let timeRemaining = this.settings.timeLimit;
        
        this.timerInterval = setInterval(() => {
            timeRemaining--;
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeRemaining <= 30) {
                timerValue.style.color = '#e74c3c';
            }
            
            if (timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                this.endPractice();
            }
        }, 1000);
    }
    
    saveProgress() {
        const progress = {
            totalScore: this.score,
            questionsCompleted: this.questionsCompleted,
            lastPractice: Date.now(),
            achievements: [] // Would track earned achievements
        };
        
        localStorage.setItem('logicSim_practiceProgress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('logicSim_practiceProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            // Could display lifetime stats, etc.
        }
    }
}