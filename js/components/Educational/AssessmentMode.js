// js/components/Educational/AssessmentMode.js
class AssessmentMode {
    constructor(circuit, canvasManager) {
        this.circuit = circuit;
        this.canvasManager = canvasManager;
        this.questionGenerator = new QuestionGenerator();
        
        // Assessment state
        this.state = {
            active: false,
            started: false,
            completed: false,
            paused: false
        };
        
        // Assessment configuration
        this.config = {
            title: 'Logic Gates Assessment',
            duration: 1800, // 30 minutes default
            questionCount: 10,
            passingScore: 70,
            allowReview: true,
            randomizeQuestions: true,
            showFeedback: false, // Show feedback after each question
            allowSkip: true,
            penaltyForWrong: false,
            partialCredit: true
        };
        
        // Assessment data
        this.assessmentData = {
            startTime: null,
            endTime: null,
            timeRemaining: 0,
            questions: [],
            currentQuestionIndex: 0,
            responses: [],
            score: 0,
            percentage: 0,
            passed: false
        };
        
        // UI elements
        this.container = null;
        this.timerInterval = null;
        
        // Initialize
        this.init();
    }
    
    init() {
        this.createUI();
        this.setupEventListeners();
        this.loadSavedAssessments();
    }
    
    createUI() {
        // Check if assessment section exists
        let assessmentSection = document.getElementById('assessment-section');
        if (!assessmentSection) {
            assessmentSection = document.createElement('section');
            assessmentSection.id = 'assessment-section';
            assessmentSection.className = 'assessment-mode-container';
            assessmentSection.style.display = 'none';
            
            const propertiesPanel = document.querySelector('.properties-panel');
            if (propertiesPanel) {
                propertiesPanel.appendChild(assessmentSection);
            }
        }
        
        assessmentSection.innerHTML = `
            <!-- Assessment Setup -->
            <div id="assessment-setup" class="assessment-setup">
                <h2>Assessment Setup</h2>
                
                <div class="assessment-presets">
                    <h3>Quick Start Presets</h3>
                    <div class="preset-buttons">
                        <button class="preset-btn" data-preset="quick">
                            <div class="preset-icon">⚡</div>
                            <div class="preset-name">Quick Test</div>
                            <div class="preset-info">5 questions, 10 minutes</div>
                        </button>
                        <button class="preset-btn" data-preset="standard">
                            <div class="preset-icon">📝</div>
                            <div class="preset-name">Standard Test</div>
                            <div class="preset-info">10 questions, 30 minutes</div>
                        </button>
                        <button class="preset-btn" data-preset="comprehensive">
                            <div class="preset-icon">📚</div>
                            <div class="preset-name">Comprehensive</div>
                            <div class="preset-info">20 questions, 60 minutes</div>
                        </button>
                        <button class="preset-btn" data-preset="custom">
                            <div class="preset-icon">⚙️</div>
                            <div class="preset-name">Custom</div>
                            <div class="preset-info">Configure settings</div>
                        </button>
                    </div>
                </div>
                
                <div id="custom-settings" class="custom-settings" style="display: none;">
                    <h3>Custom Assessment Settings</h3>
                    
                    <div class="setting-group">
                        <label>Assessment Title:</label>
                        <input type="text" id="assessment-title" value="Logic Gates Assessment" class="setting-input">
                    </div>
                    
                    <div class="setting-group">
                        <label>Number of Questions:</label>
                        <input type="number" id="question-count" min="1" max="50" value="10" class="setting-input">
                    </div>
                    
                    <div class="setting-group">
                        <label>Time Limit (minutes):</label>
                        <input type="number" id="time-limit" min="5" max="120" value="30" class="setting-input">
                    </div>
                    
                    <div class="setting-group">
                        <label>Passing Score (%):</label>
                        <input type="number" id="passing-score" min="0" max="100" value="70" class="setting-input">
                    </div>
                    
                    <div class="setting-group">
                        <label>Difficulty Level:</label>
                        <select id="difficulty-level" class="setting-select">
                            <option value="beginner">Beginner</option>
                            <option value="intermediate" selected>Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="mixed">Mixed</option>
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
                                <input type="checkbox" value="truthTableCompletion" checked>
                                Truth Table Completion
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="circuitDebugging">
                                Circuit Debugging
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="gateIdentification" checked>
                                Gate Identification
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="simplification">
                                Expression Simplification
                            </label>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <label>Options:</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="randomize-questions" checked>
                                Randomize question order
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="allow-skip" checked>
                                Allow skipping questions
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="show-feedback">
                                Show immediate feedback
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="allow-review" checked>
                                Allow review after completion
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="partial-credit" checked>
                                Give partial credit
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="assessment-actions">
                    <button id="start-assessment" class="btn-primary">Start Assessment</button>
                    <button id="load-previous" class="btn-secondary">Load Previous Results</button>
                </div>
            </div>
            
            <!-- Assessment In Progress -->
            <div id="assessment-progress" class="assessment-progress" style="display: none;">
                <div class="assessment-header">
                    <h2 id="assessment-title-display">Logic Gates Assessment</h2>
                    <div class="assessment-timer">
                        <span class="timer-icon">⏱️</span>
                        <span id="time-remaining">30:00</span>
                    </div>
                </div>
                
                <div class="progress-indicator">
                    <div class="question-counter">
                        Question <span id="current-question">1</span> of <span id="total-questions">10</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="assessment-progress-bar"></div>
                    </div>
                </div>
                
                <div id="question-container" class="question-container">
                    <!-- Question content will be inserted here -->
                </div>
                
                <div class="assessment-controls">
                    <button id="prev-question" class="btn-secondary" disabled>Previous</button>
                    <button id="skip-question" class="btn-secondary">Skip</button>
                    <button id="submit-answer" class="btn-primary">Submit Answer</button>
                    <button id="next-question" class="btn-secondary" style="display: none;">Next</button>
                    <button id="finish-assessment" class="btn-primary" style="display: none;">Finish Assessment</button>
                </div>
                
                <div class="assessment-warnings">
                    <div id="time-warning" class="warning-message" style="display: none;">
                        ⚠️ Less than 5 minutes remaining!
                    </div>
                </div>
            </div>
            
            <!-- Assessment Results -->
            <div id="assessment-results" class="assessment-results" style="display: none;">
                <div class="results-header">
                    <h2>Assessment Complete!</h2>
                    <div class="completion-time">
                        Completed in: <span id="completion-time">0:00</span>
                    </div>
                </div>
                
                <div class="score-display">
                    <div class="score-circle">
                        <svg viewBox="0 0 200 200">
                            <circle cx="100" cy="100" r="90" fill="none" stroke="#e0e0e0" stroke-width="20"/>
                            <circle id="score-arc" cx="100" cy="100" r="90" fill="none" stroke="#3498db" 
                                    stroke-width="20" stroke-linecap="round" 
                                    stroke-dasharray="565.48" stroke-dashoffset="565.48"
                                    transform="rotate(-90 100 100)"/>
                        </svg>
                        <div class="score-text">
                            <div class="score-number" id="final-score">0</div>
                            <div class="score-label">Score</div>
                        </div>
                    </div>
                    <div class="score-details">
                        <div class="detail-item">
                            <span class="detail-label">Percentage:</span>
                            <span class="detail-value" id="percentage">0%</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Grade:</span>
                            <span class="detail-value" id="grade">F</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value" id="pass-status">Failed</span>
                        </div>
                    </div>
                </div>
                
                <div class="results-breakdown">
                    <h3>Question Breakdown</h3>
                    <div id="question-breakdown" class="question-breakdown">
                        <!-- Individual question results -->
                    </div>
                </div>
                
                <div class="results-analysis">
                    <h3>Performance Analysis</h3>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <h4>Strengths</h4>
                            <ul id="strengths-list"></ul>
                        </div>
                        <div class="analysis-item">
                            <h4>Areas for Improvement</h4>
                            <ul id="improvements-list"></ul>
                        </div>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button id="review-answers" class="btn-secondary">Review Answers</button>
                    <button id="export-results" class="btn-secondary">Export Results</button>
                    <button id="retake-assessment" class="btn-primary">Retake Assessment</button>
                    <button id="back-to-setup" class="btn-secondary">New Assessment</button>
                </div>
            </div>
            
            <!-- Review Mode -->
            <div id="assessment-review" class="assessment-review" style="display: none;">
                <h2>Review Answers</h2>
                <div id="review-container" class="review-container">
                    <!-- Review content -->
                </div>
                <button id="back-to-results" class="btn-primary">Back to Results</button>
            </div>
        `;
        
        this.container = assessmentSection;
    }
    
    setupEventListeners() {
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.applyPreset(preset);
            });
        });
        
        // Start assessment
        document.getElementById('start-assessment').addEventListener('click', () => {
            this.startAssessment();
        });
        
        // Navigation buttons
        document.getElementById('prev-question').addEventListener('click', () => {
            this.navigateQuestion(-1);
        });
        
        document.getElementById('next-question').addEventListener('click', () => {
            this.navigateQuestion(1);
        });
        
        document.getElementById('skip-question').addEventListener('click', () => {
            this.skipQuestion();
        });
        
        document.getElementById('submit-answer').addEventListener('click', () => {
            this.submitAnswer();
        });
        
        document.getElementById('finish-assessment').addEventListener('click', () => {
            this.finishAssessment();
        });
        
        // Results actions
        document.getElementById('review-answers').addEventListener('click', () => {
            this.showReview();
        });
        
        document.getElementById('export-results').addEventListener('click', () => {
            this.exportResults();
        });
        
        document.getElementById('retake-assessment').addEventListener('click', () => {
            this.retakeAssessment();
        });
        
        document.getElementById('back-to-setup').addEventListener('click', () => {
            this.backToSetup();
        });
        
        document.getElementById('back-to-results').addEventListener('click', () => {
            this.backToResults();
        });
        
        // Load previous results
        document.getElementById('load-previous').addEventListener('click', () => {
            this.loadPreviousResults();
        });
    }
    
    applyPreset(preset) {
        const presets = {
            quick: {
                title: 'Quick Logic Gates Test',
                questionCount: 5,
                duration: 600, // 10 minutes
                difficulty: 'beginner',
                questionTypes: ['expressionToCircuit', 'gateIdentification']
            },
            standard: {
                title: 'Standard Logic Gates Assessment',
                questionCount: 10,
                duration: 1800, // 30 minutes
                difficulty: 'intermediate',
                questionTypes: ['expressionToCircuit', 'circuitToExpression', 'truthTableCompletion', 'gateIdentification']
            },
            comprehensive: {
                title: 'Comprehensive Logic Gates Exam',
                questionCount: 20,
                duration: 3600, // 60 minutes
                difficulty: 'mixed',
                questionTypes: ['expressionToCircuit', 'circuitToExpression', 'truthTableCompletion', 'circuitDebugging', 'gateIdentification', 'simplification']
            },
            custom: null
        };
        
        if (preset === 'custom') {
            document.getElementById('custom-settings').style.display = 'block';
        } else {
            document.getElementById('custom-settings').style.display = 'none';
            
            const settings = presets[preset];
            document.getElementById('assessment-title').value = settings.title;
            document.getElementById('question-count').value = settings.questionCount;
            document.getElementById('time-limit').value = settings.duration / 60;
            document.getElementById('difficulty-level').value = settings.difficulty;
            
            // Update question types
            document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
                cb.checked = settings.questionTypes.includes(cb.value);
            });
        }
        
        // Highlight selected preset
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === preset);
        });
    }
    
    gatherSettings() {
        this.config.title = document.getElementById('assessment-title').value;
        this.config.questionCount = parseInt(document.getElementById('question-count').value);
        this.config.duration = parseInt(document.getElementById('time-limit').value) * 60;
        this.config.passingScore = parseInt(document.getElementById('passing-score').value);
        this.config.randomizeQuestions = document.getElementById('randomize-questions').checked;
        this.config.allowSkip = document.getElementById('allow-skip').checked;
        this.config.showFeedback = document.getElementById('show-feedback').checked;
        this.config.allowReview = document.getElementById('allow-review').checked;
        this.config.partialCredit = document.getElementById('partial-credit').checked;
        
        // Get selected question types
        const questionTypes = [];
        document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked').forEach(cb => {
            if (cb.value && cb.value !== 'on') {
                questionTypes.push(cb.value);
            }
        });
        
        // Set difficulty
        const difficulty = document.getElementById('difficulty-level').value;
        this.questionGenerator.setDifficulty(difficulty === 'mixed' ? 'intermediate' : difficulty);
        
        return { questionTypes, difficulty };
    }
    
    generateQuestions(questionTypes, difficulty) {
        const questions = [];
        const questionsPerType = Math.ceil(this.config.questionCount / questionTypes.length);
        
        questionTypes.forEach(type => {
            for (let i = 0; i < questionsPerType && questions.length < this.config.questionCount; i++) {
                if (difficulty === 'mixed') {
                    // Randomly select difficulty for each question
                    const difficulties = ['beginner', 'intermediate', 'advanced'];
                    this.questionGenerator.setDifficulty(difficulties[Math.floor(Math.random() * difficulties.length)]);
                }
                
                const question = this.questionGenerator.generateQuestion(type);
                question.index = questions.length;
                question.answered = false;
                question.skipped = false;
                question.timeSpent = 0;
                question.startTime = null;
                questions.push(question);
            }
        });
        
        // Randomize if enabled
        if (this.config.randomizeQuestions) {
            for (let i = questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questions[i], questions[j]] = [questions[j], questions[i]];
            }
        }
        
        return questions;
    }
    
    startAssessment() {
        const { questionTypes, difficulty } = this.gatherSettings();
        
        if (questionTypes.length === 0) {
            alert('Please select at least one question type.');
            return;
        }
        
        // Initialize assessment data
        this.assessmentData = {
            startTime: Date.now(),
            endTime: null,
            timeRemaining: this.config.duration,
            questions: this.generateQuestions(questionTypes, difficulty),
            currentQuestionIndex: 0,
            responses: [],
            score: 0,
            percentage: 0,
            passed: false
        };
        
        // Update UI
        document.getElementById('assessment-setup').style.display = 'none';
        document.getElementById('assessment-progress').style.display = 'block';
        document.getElementById('assessment-title-display').textContent = this.config.title;
        document.getElementById('total-questions').textContent = this.config.questionCount;
        
        // Start timer
        this.startTimer();
        
        // Display first question
        this.displayQuestion(0);
        
        // Mark as active
        this.state.active = true;
        this.state.started = true;
        
        // Clear canvas for assessment
        this.circuit.clear();
    }
    
    startTimer() {
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.assessmentData.timeRemaining--;
            this.updateTimerDisplay();
            
            // Show warning at 5 minutes
            if (this.assessmentData.timeRemaining === 300) {
                document.getElementById('time-warning').style.display = 'block';
            }
            
            // Auto-submit when time runs out
            if (this.assessmentData.timeRemaining <= 0) {
                this.finishAssessment(true);
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.assessmentData.timeRemaining / 60);
        const seconds = this.assessmentData.timeRemaining % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('time-remaining').textContent = display;
        
        // Change color when time is low
        if (this.assessmentData.timeRemaining < 300) {
            document.getElementById('time-remaining').style.color = '#e74c3c';
        }
    }
    
    displayQuestion(index) {
        const question = this.assessmentData.questions[index];
        if (!question) return;
        
        // Track time spent on previous question
        if (this.assessmentData.questions[this.assessmentData.currentQuestionIndex].startTime) {
            const prevQuestion = this.assessmentData.questions[this.assessmentData.currentQuestionIndex];
            prevQuestion.timeSpent += Date.now() - prevQuestion.startTime;
        }
        
        // Update current question
        this.assessmentData.currentQuestionIndex = index;
        question.startTime = Date.now();
        
        // Update UI
        document.getElementById('current-question').textContent = index + 1;
        this.updateProgressBar();
        
        // Enable/disable navigation buttons
        document.getElementById('prev-question').disabled = index === 0;
        document.getElementById('skip-question').style.display = 
            this.config.allowSkip && !question.answered ? 'inline-block' : 'none';
        
        // Show appropriate action buttons
        const isLastQuestion = index === this.assessmentData.questions.length - 1;
        document.getElementById('submit-answer').style.display = 
            question.answered ? 'none' : 'inline-block';
        document.getElementById('next-question').style.display = 
            question.answered && !isLastQuestion ? 'inline-block' : 'none';
        document.getElementById('finish-assessment').style.display = 
            this.allQuestionsAnswered() || isLastQuestion ? 'inline-block' : 'none';
        
        // Display question content
        const container = document.getElementById('question-container');
        container.innerHTML = this.renderQuestion(question);
        
        // Clear circuit for new question
        if (question.type !== 'circuitToExpression' && question.type !== 'circuitDebugging') {
            this.circuit.clear();
        } else if (question.circuit) {
            // Load circuit for the question
            this.circuit.loadFromSnapshot(question.circuit);
            this.canvasManager.zoomToFit();
        }
        
        // Restore previous answer if revisiting
        if (question.userAnswer) {
            this.restoreAnswer(question);
        }
    }
    
    renderQuestion(question) {
        let html = `<div class="question-content">`;
        
        // Question header
        html += `
            <div class="question-header">
                <span class="question-type">${this.getQuestionTypeLabel(question.type)}</span>
                <span class="question-difficulty">${question.difficulty}</span>
                <span class="question-points">${question.points} points</span>
            </div>
        `;
        
        // Question specific content
        switch (question.type) {
            case 'expressionToCircuit':
                html += `
                    <div class="question-text">${question.question}</div>
                    <div class="expression-display-large">
                        ${this.formatExpression(question.expression)}
                    </div>
                    <div class="variable-info">
                        <strong>Variables:</strong> ${question.variables.join(', ')}
                    </div>
                    <p class="instruction">Build the circuit in the canvas.</p>
                `;
                break;
                
            case 'circuitToExpression':
                html += `
                    <div class="question-text">${question.question}</div>
                    <p class="instruction">Study the circuit on the canvas.</p>
                    <div class="expression-input-group">
                        <label>Enter Boolean Expression:</label>
                        <input type="text" 
                               id="expression-answer" 
                               class="expression-input-field" 
                               placeholder="e.g., (A AND B) OR (NOT C)"
                               value="${question.userAnswer || ''}">
                        <div class="expression-help">
                            Use AND, OR, NOT, XOR, NAND, NOR. Use parentheses for grouping.
                        </div>
                    </div>
                `;
                break;
                
            case 'truthTableCompletion':
                html += `
                    <div class="question-text">${question.question}</div>
                    <div class="expression-display-medium">
                        ${this.formatExpression(question.expression)}
                    </div>
                `;
                html += this.renderTruthTableQuestion(question);
                break;
                
            case 'gateIdentification':
                html += `
                    <div class="question-text">${question.question}</div>
                `;
                html += this.renderGateIdentificationQuestion(question);
                break;
                
            case 'circuitDebugging':
                html += `
                    <div class="question-text">${question.question}</div>
                    <div class="expression-display-medium">
                        Expected: ${this.formatExpression(question.expression)}
                    </div>
                    <p class="instruction">Fix the circuit to match the expected expression.</p>
                    <p class="hint-text">There are ${question.faults.length} error(s) to find.</p>
                `;
                break;
                
            case 'simplification':
                html += `
                    <div class="question-text">${question.question}</div>
                    <div class="expression-display-large">
                        ${this.formatExpression(question.expression)}
                    </div>
                    <div class="expression-input-group">
                        <label>Enter Simplified Expression:</label>
                        <input type="text" 
                               id="simplified-answer" 
                               class="expression-input-field" 
                               placeholder="Enter your simplified expression"
                               value="${question.userAnswer || ''}">
                    </div>
                `;
                break;
        }
        
        html += `</div>`;
        return html;
    }
    
    renderTruthTableQuestion(question) {
        let html = '<table class="truth-table-interactive">';
        
        // Header
        html += '<thead><tr>';
        question.variables.forEach(v => {
            html += `<th>${v}</th>`;
        });
        html += '<th class="separator"></th><th>Output</th></tr></thead>';
        
        // Body
        html += '<tbody>';
        question.incompleteTable.forEach((row, index) => {
            html += '<tr>';
            
            // Input values
            question.variables.forEach(v => {
                html += `<td>${row.inputs[v] ? '1' : '0'}</td>`;
            });
            
            // Separator
            html += '<td class="separator"></td>';
            
            // Output value (editable if null)
            if (row.output === null) {
                const previousAnswer = question.userAnswer && question.userAnswer[index];
                html += `<td>
                    <select class="truth-table-answer" data-row="${index}">
                        <option value="">?</option>
                        <option value="0" ${previousAnswer === '0' ? 'selected' : ''}>0</option>
                        <option value="1" ${previousAnswer === '1' ? 'selected' : ''}>1</option>
                    </select>
                </td>`;
            } else {
                html += `<td class="${row.output ? 'high' : 'low'}">${row.output ? '1' : '0'}</td>`;
            }
            
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        return html;
    }
    
    renderGateIdentificationQuestion(question) {
        let html = '<table class="truth-table-display">';
        
        // Create truth table
        html += '<thead><tr>';
        const firstRow = question.truthTable[0];
        Object.keys(firstRow.inputs).forEach(input => {
            html += `<th>${input}</th>`;
        });
        html += '<th class="separator"></th><th>Output</th></tr></thead>';
        
        html += '<tbody>';
        question.truthTable.forEach(row => {
            html += '<tr>';
            Object.values(row.inputs).forEach(value => {
                html += `<td>${value ? '1' : '0'}</td>`;
            });
            html += `<td class="separator"></td>`;
            html += `<td class="${row.output ? 'high' : 'low'}">${row.output ? '1' : '0'}</td>`;
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        // Gate options
        html += '<div class="gate-options">';
        question.options.forEach(gate => {
            const isSelected = question.userAnswer === gate;
            html += `
                <label class="gate-option ${isSelected ? 'selected' : ''}">
                    <input type="radio" name="gate-answer" value="${gate}" 
                           ${isSelected ? 'checked' : ''}>
                    <span class="gate-label">${gate}</span>
                </label>
            `;
        });
        html += '</div>';
        
        return html;
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
    
    getQuestionTypeLabel(type) {
        const labels = {
            'expressionToCircuit': 'Build Circuit',
            'circuitToExpression': 'Write Expression',
            'truthTableCompletion': 'Complete Truth Table',
            'circuitDebugging': 'Debug Circuit',
            'gateIdentification': 'Identify Gate',
            'simplification': 'Simplify Expression'
        };
        return labels[type] || type;
    }
    
    collectAnswer() {
        const question = this.assessmentData.questions[this.assessmentData.currentQuestionIndex];
        
        switch (question.type) {
            case 'expressionToCircuit':
                // Capture current circuit state
                question.userAnswer = {
                    circuit: this.circuit.exportToJSON(),
                    components: this.circuit.components.size,
                    connections: this.circuit.connections.size
                };
                break;
                
            case 'circuitToExpression':
                question.userAnswer = document.getElementById('expression-answer').value;
                break;
                
            case 'truthTableCompletion':
                const answers = {};
                document.querySelectorAll('.truth-table-answer').forEach(select => {
                    const row = parseInt(select.dataset.row);
                    answers[row] = select.value;
                });
                question.userAnswer = answers;
                break;
                
            case 'gateIdentification':
                const selected = document.querySelector('input[name="gate-answer"]:checked');
                question.userAnswer = selected ? selected.value : null;
                break;
                
            case 'circuitDebugging':
                question.userAnswer = {
                    circuit: this.circuit.exportToJSON(),
                    components: this.circuit.components.size,
                    connections: this.circuit.connections.size
                };
                break;
                
            case 'simplification':
                question.userAnswer = document.getElementById('simplified-answer').value;
                break;
        }
        
        return question.userAnswer;
    }
    
    submitAnswer() {
        const answer = this.collectAnswer();
        const question = this.assessmentData.questions[this.assessmentData.currentQuestionIndex];
        
        if (!answer || (typeof answer === 'string' && !answer.trim())) {
            if (!confirm('No answer provided. Submit anyway?')) {
                return;
            }
        }
        
        // Mark as answered
        question.answered = true;
        question.timeSpent += Date.now() - question.startTime;
        
        // Store response
        this.assessmentData.responses[this.assessmentData.currentQuestionIndex] = {
            questionIndex: this.assessmentData.currentQuestionIndex,
            answer: answer,
            timeSpent: question.timeSpent,
            submitted: Date.now()
        };
        
        // Check answer and calculate score
        const isCorrect = this.checkAnswer(question, answer);
        question.isCorrect = isCorrect;
        
        if (isCorrect) {
            question.score = question.points;
        } else if (this.config.partialCredit) {
            question.score = this.calculatePartialCredit(question, answer);
        } else {
            question.score = 0;
        }
        
        // Show feedback if enabled
        if (this.config.showFeedback) {
            this.showQuestionFeedback(question, isCorrect);
        }
        
        // Update UI
        this.updateProgressBar();
        
        // Move to next question or show finish button
        if (this.assessmentData.currentQuestionIndex < this.assessmentData.questions.length - 1) {
            document.getElementById('submit-answer').style.display = 'none';
            document.getElementById('next-question').style.display = 'inline-block';
        } else {
            document.getElementById('submit-answer').style.display = 'none';
            document.getElementById('finish-assessment').style.display = 'inline-block';
        }
    }
    
    checkAnswer(question, answer) {
        if (!answer) return false;
        
        switch (question.type) {
            case 'expressionToCircuit':
                return this.checkCircuitAnswer(question, answer);
                
            case 'circuitToExpression':
                return this.checkExpressionAnswer(question, answer);
                
            case 'truthTableCompletion':
                return this.checkTruthTableAnswer(question, answer);
                
            case 'gateIdentification':
                return answer === question.correctAnswer;
                
            case 'circuitDebugging':
                return this.checkDebuggingAnswer(question, answer);
                
            case 'simplification':
                return this.checkSimplificationAnswer(question, answer);
                
            default:
                return false;
        }
    }
    
    checkCircuitAnswer(question, answer) {
        try {
            // Parse the user's circuit
            const userCircuit = JSON.parse(answer.circuit);
            
            // Create a temporary circuit to evaluate
            const tempCircuit = new Circuit();
            tempCircuit.importFromJSON(answer.circuit);
            
            // Generate truth table for user's circuit
            const generator = new TruthTableGenerator(tempCircuit);
            const userTable = generator.generate();
            
            if (!userTable || userTable.rows.length === 0) {
                return false;
            }
            
            // Compare with expected truth table
            return this.compareTruthTables(userTable.rows, question.truthTable);
        } catch (error) {
            console.error('Error checking circuit answer:', error);
            return false;
        }
    }
    
checkExpressionAnswer(question, userExpression) {
    try {
        const parser = new ExpressionParser();
        
        // Normalize both expressions to use word operators
        const userNormalized = this.normalizeExpression(userExpression);
        const correctNormalized = this.normalizeExpression(question.correctAnswer);
        
        console.log('Comparing expressions:');
        console.log('User (normalized):', userNormalized);
        console.log('Correct (normalized):', correctNormalized);
        
        // Get variables from both expressions
        const userVars = this.extractVariables(userNormalized);
        const correctVars = this.extractVariables(correctNormalized);
        const allVars = [...new Set([...userVars, ...correctVars])].sort();
        
        console.log('Variables:', allVars);
        
        // Generate truth tables for both expressions
        const userTable = this.generateTruthTable(userNormalized, allVars);
        const correctTable = this.generateTruthTable(correctNormalized, allVars);
        
        console.log('User truth table:', userTable);
        console.log('Correct truth table:', correctTable);
        
        // Compare truth tables
        return this.compareTruthTables(userTable, correctTable);
    } catch (error) {
        console.error('Error checking expression:', error);
        return false;
    }
}
    
    checkTruthTableAnswer(question, answers) {
        return question.hiddenIndices.every(index => {
            const userAnswer = answers[index];
            const correctAnswer = question.completeTable[index].output;
            return (userAnswer === '1') === correctAnswer;
        });
    }
    // Helper method to extract variables from expression
extractVariables(expression) {
    // Remove operators and parentheses, then find all variables
    const cleaned = expression
        .replace(/\b(AND|OR|NOT|XOR|NAND|NOR)\b/g, ' ')
        .replace(/[()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    const vars = cleaned.split(' ').filter(token => 
        token && /^[A-Z][A-Z0-9]*$/i.test(token)
    );
    
    return [...new Set(vars)].sort();
}
// Generate truth table for an expression
generateTruthTable(expression, variables) {
    const table = [];
    const numRows = Math.pow(2, variables.length);
    
    for (let i = 0; i < numRows; i++) {
        const values = {};
        
        // Set variable values based on binary representation
        variables.forEach((v, j) => {
            values[v] = (i >> (variables.length - j - 1)) & 1 ? true : false;
        });
        
        // Evaluate expression with these values
        try {
            const result = this.evaluateExpression(expression, values);
            table.push(result);
        } catch (error) {
            console.error('Error evaluating expression:', error);
            table.push(false);
        }
    }
    
    return table;
}

    checkDebuggingAnswer(question, answer) {
        try {
            // Parse the user's circuit
            const tempCircuit = new Circuit();
            tempCircuit.importFromJSON(answer.circuit);
            
            // Check if it matches the expected expression
            const analyzer = new CircuitAnalyzer(tempCircuit);
            const analysis = analyzer.analyze();
            
            if (!analysis.expression) {
                return false;
            }
            
            // Compare with expected expression
            const parser = new ExpressionParser();
            const userTable = parser.calculateTruthTable(analysis.expression, question.variables);
            const correctTable = parser.calculateTruthTable(question.expression, question.variables);
            
            return this.compareTruthTables(userTable, correctTable);
        } catch (error) {
            return false;
        }
    }
    evaluateExpression(expression, values) {
    // Replace variables with their boolean values
    let expr = expression;
    
    // Sort variables by length (longest first) to avoid partial replacements
    const sortedVars = Object.keys(values).sort((a, b) => b.length - a.length);
    
    sortedVars.forEach(variable => {
        const value = values[variable] ? '1' : '0';
        // Use word boundaries to match whole variables only
        const regex = new RegExp(`\\b${variable}\\b`, 'g');
        expr = expr.replace(regex, value);
    });
    
    console.log('Expression after variable substitution:', expr);
    
    // Convert to JavaScript expression
    expr = expr
        .replace(/\bAND\b/gi, '&&')
        .replace(/\bOR\b/gi, '||')
        .replace(/\bXOR\b/gi, '!==')
        .replace(/\bNAND\b/gi, '!&&')
        .replace(/\bNOR\b/gi, '!||')
        .replace(/\bNOT\s+/gi, '!')
        .replace(/\b1\b/g, 'true')
        .replace(/\b0\b/g, 'false');
    
    // Handle NAND and NOR specially
    expr = expr.replace(/!&&/g, '&&!');
    expr = expr.replace(/!\|\|/g, '||!');
    
    // Fix NAND: A NAND B = !(A && B)
    expr = expr.replace(/(\w+|\))\s*&&!\s*(\w+|\()/g, '!($1 && $2)');
    
    // Fix NOR: A NOR B = !(A || B)
    expr = expr.replace(/(\w+|\))\s*\|\|!\s*(\w+|\()/g, '!($1 || $2)');
    
    console.log('JavaScript expression:', expr);
    
    try {
        // Use Function constructor for safe evaluation
        const func = new Function('return ' + expr);
        return func();
    } catch (error) {
        console.error('Evaluation error:', error, 'Expression:', expr);
        throw error;
    }
}

    checkSimplificationAnswer(question, answer) {
        try {
            const parser = new ExpressionParser();
            
            // Check if the user's expression is logically equivalent to both
            // the original and the simplified version
            const originalTable = parser.calculateTruthTable(question.expression, this.getVariables(question.expression));
            const userTable = parser.calculateTruthTable(answer, this.getVariables(answer));
            
            return this.compareTruthTables(originalTable, userTable);
        } catch (error) {
            return false;
        }
    }
    
normalizeExpression(expr) {
    // First, normalize all operator symbols to words
    return expr
        .toUpperCase()
        .replace(/\s+/g, ' ')
        // Convert symbols to words
        .replace(/[∧·*&]/g, ' AND ')
        .replace(/[∨+|]/g, ' OR ')
        .replace(/[¬!~]/g, ' NOT ')
        .replace(/⊕/g, ' XOR ')
        .replace(/⊼/g, ' NAND ')
        .replace(/⊽/g, ' NOR ')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        // Remove spaces around parentheses
        .replace(/\s*\(\s*/g, '(')
        .replace(/\s*\)\s*/g, ')')
        // Ensure spaces around operators
        .replace(/(\w)(AND|OR|NOT|XOR|NAND|NOR)/g, '$1 $2')
        .replace(/(AND|OR|NOT|XOR|NAND|NOR)(\w)/g, '$1 $2')
        .trim();
}
    
compareTruthTables(table1, table2) {
    if (!table1 || !table2) return false;
    if (table1.length !== table2.length) return false;
    
    // Compare each row
    for (let i = 0; i < table1.length; i++) {
        // Convert to boolean to ensure consistent comparison
        const val1 = !!table1[i];
        const val2 = !!table2[i];
        
        if (val1 !== val2) {
            console.log(`Truth table mismatch at row ${i}: ${val1} vs ${val2}`);
            return false;
        }
    }
    
    console.log('Truth tables match!');
    return true;
}
    getVariables(expression) {
        const matches = expression.match(/\b[A-Z]\b/g);
        return [...new Set(matches || [])].sort();
    }
    
    calculatePartialCredit(question, answer) {
        // Implement partial credit logic based on question type
        let partialScore = 0;
        
        switch (question.type) {
            case 'truthTableCompletion':
                // Give partial credit for each correct answer
                let correctCount = 0;
                question.hiddenIndices.forEach(index => {
                    if (answer[index] && (answer[index] === '1') === question.completeTable[index].output) {
                        correctCount++;
                    }
                });
                partialScore = (correctCount / question.hiddenIndices.length) * question.points;
                break;
                
            case 'expressionToCircuit':
            case 'circuitDebugging':
                // Give partial credit based on circuit similarity
                // This is a simplified approach - could be more sophisticated
                if (answer && answer.components > 0) {
                    partialScore = question.points * 0.25; // 25% for trying
                }
                break;
                
            default:
                // No partial credit for other types
                partialScore = 0;
        }
        
        return Math.round(partialScore);
    }
    
    showQuestionFeedback(question, isCorrect) {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `question-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedbackDiv.innerHTML = `
            <div class="feedback-icon">${isCorrect ? '✓' : '✗'}</div>
            <div class="feedback-text">
                ${isCorrect ? 'Correct!' : 'Incorrect'}
                ${!isCorrect && question.correctAnswer ? `<br>Correct answer: ${question.correctAnswer}` : ''}
            </div>
        `;
        
        document.getElementById('question-container').appendChild(feedbackDiv);
    }
    
    skipQuestion() {
        const question = this.assessmentData.questions[this.assessmentData.currentQuestionIndex];
        question.skipped = true;
        question.timeSpent += Date.now() - question.startTime;
        
        // Move to next question
        if (this.assessmentData.currentQuestionIndex < this.assessmentData.questions.length - 1) {
            this.navigateQuestion(1);
        }
    }
    
    navigateQuestion(direction) {
        const newIndex = this.assessmentData.currentQuestionIndex + direction;
        if (newIndex >= 0 && newIndex < this.assessmentData.questions.length) {
            this.displayQuestion(newIndex);
        }
    }
    
    allQuestionsAnswered() {
        return this.assessmentData.questions.every(q => q.answered || q.skipped);
    }
    
    updateProgressBar() {
        const answered = this.assessmentData.questions.filter(q => q.answered).length;
        const total = this.assessmentData.questions.length;
        const percentage = (answered / total) * 100;
        
        document.getElementById('assessment-progress-bar').style.width = `${percentage}%`;
    }
    
    finishAssessment(timeUp = false) {
        if (!timeUp && !this.allQuestionsAnswered()) {
            const unanswered = this.assessmentData.questions.filter(q => !q.answered && !q.skipped).length;
            if (!confirm(`You have ${unanswered} unanswered questions. Finish anyway?`)) {
                return;
            }
        }
        
        // Stop timer
        clearInterval(this.timerInterval);
        
        // Collect final answer if on a question
        if (!this.assessmentData.questions[this.assessmentData.currentQuestionIndex].answered) {
            this.collectAnswer();
        }
        
        // Calculate final score
        this.calculateFinalScore();
        
        // Save results
        this.saveResults();
        
        // Show results
        this.showResults();
    }
    
    calculateFinalScore() {
        let totalScore = 0;
        let maxScore = 0;
        
        this.assessmentData.questions.forEach(question => {
            totalScore += question.score || 0;
            maxScore += question.points;
        });
        
        this.assessmentData.score = totalScore;
        this.assessmentData.maxScore = maxScore;
        this.assessmentData.percentage = Math.round((totalScore / maxScore) * 100);
        this.assessmentData.passed = this.assessmentData.percentage >= this.config.passingScore;
        this.assessmentData.endTime = Date.now();
        
        // Calculate grade
        this.assessmentData.grade = this.calculateGrade(this.assessmentData.percentage);
    }
    
    calculateGrade(percentage) {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    }
    
    showResults() {
        // Hide progress view
        document.getElementById('assessment-progress').style.display = 'none';
        document.getElementById('assessment-results').style.display = 'block';
        
        // Calculate completion time
        const duration = this.assessmentData.endTime - this.assessmentData.startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        document.getElementById('completion-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Animate score display
        this.animateScore();
        
        // Display grade and status
        document.getElementById('percentage').textContent = `${this.assessmentData.percentage}%`;
        document.getElementById('grade').textContent = this.assessmentData.grade;
        document.getElementById('pass-status').textContent = this.assessmentData.passed ? 'Passed' : 'Failed';
        document.getElementById('pass-status').className = `detail-value ${this.assessmentData.passed ? 'passed' : 'failed'}`;
        
        // Show question breakdown
        this.showQuestionBreakdown();
        
        // Show performance analysis
        this.showPerformanceAnalysis();
        
        // Enable/disable review button
        document.getElementById('review-answers').disabled = !this.config.allowReview;
    }
    
    animateScore() {
        const scoreElement = document.getElementById('final-score');
        const scoreArc = document.getElementById('score-arc');
        const targetScore = this.assessmentData.score;
        const maxScore = this.assessmentData.maxScore;
        const percentage = this.assessmentData.percentage;
        
        // Animate number
        let currentScore = 0;
        const increment = targetScore / 50;
        const scoreInterval = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(scoreInterval);
            }
            scoreElement.textContent = Math.round(currentScore);
        }, 20);
        
        // Animate arc
        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (percentage / 100) * circumference;
        scoreArc.style.strokeDashoffset = offset;
        
        // Color based on grade
        if (percentage >= 90) scoreArc.style.stroke = '#2ecc71';
        else if (percentage >= 80) scoreArc.style.stroke = '#3498db';
        else if (percentage >= 70) scoreArc.style.stroke = '#f39c12';
        else if (percentage >= 60) scoreArc.style.stroke = '#e67e22';
        else scoreArc.style.stroke = '#e74c3c';
    }
    
    showQuestionBreakdown() {
        const container = document.getElementById('question-breakdown');
        let html = '';
        
        this.assessmentData.questions.forEach((question, index) => {
            const icon = question.isCorrect ? '✓' : question.skipped ? '−' : '✗';
            const className = question.isCorrect ? 'correct' : question.skipped ? 'skipped' : 'incorrect';
            
            html += `
                <div class="breakdown-item ${className}">
                    <span class="breakdown-number">Q${index + 1}</span>
                    <span class="breakdown-type">${this.getQuestionTypeLabel(question.type)}</span>
                    <span class="breakdown-score">${question.score || 0}/${question.points}</span>
                    <span class="breakdown-icon">${icon}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    showPerformanceAnalysis() {
        const strengths = [];
        const improvements = [];
        
        // Analyze performance by question type
        const typePerformance = {};
        this.assessmentData.questions.forEach(question => {
            if (!typePerformance[question.type]) {
                typePerformance[question.type] = { correct: 0, total: 0 };
            }
            typePerformance[question.type].total++;
            if (question.isCorrect) {
                typePerformance[question.type].correct++;
            }
        });
        
        // Identify strengths and weaknesses
        Object.entries(typePerformance).forEach(([type, performance]) => {
            const percentage = (performance.correct / performance.total) * 100;
            if (percentage >= 80) {
                strengths.push(`${this.getQuestionTypeLabel(type)} (${Math.round(percentage)}% correct)`);
            } else if (percentage < 60) {
                improvements.push(`${this.getQuestionTypeLabel(type)} (${Math.round(percentage)}% correct)`);
            }
        });
        
        // Time management
        const avgTimePerQuestion = (this.config.duration - this.assessmentData.timeRemaining) / this.assessmentData.questions.length;
        if (avgTimePerQuestion < 60) {
            strengths.push('Efficient time management');
        } else if (this.assessmentData.timeRemaining < 60) {
            improvements.push('Time management - try to work more efficiently');
        }
        
        // Display analysis
        const strengthsList = document.getElementById('strengths-list');
        strengthsList.innerHTML = strengths.length > 0 
            ? strengths.map(s => `<li>${s}</li>`).join('')
            : '<li>Keep practicing to identify your strengths!</li>';
            
        const improvementsList = document.getElementById('improvements-list');
        improvementsList.innerHTML = improvements.length > 0
            ? improvements.map(i => `<li>${i}</li>`).join('')
            : '<li>Great job! Continue challenging yourself with harder questions.</li>';
    }
    
    showReview() {
        if (!this.config.allowReview) return;
        
        document.getElementById('assessment-results').style.display = 'none';
        document.getElementById('assessment-review').style.display = 'block';
        
        const container = document.getElementById('review-container');
        let html = '';
        
        this.assessmentData.questions.forEach((question, index) => {
            html += `
                <div class="review-question">
                    <h3>Question ${index + 1} - ${this.getQuestionTypeLabel(question.type)}</h3>
                    <div class="review-status ${question.isCorrect ? 'correct' : 'incorrect'}">
                        ${question.isCorrect ? 'Correct' : 'Incorrect'} 
                        (${question.score || 0}/${question.points} points)
                    </div>
                    
                    <div class="review-question-content">
                        <strong>Question:</strong> ${question.question}
                        ${question.expression ? `<div class="expression-display-small">${this.formatExpression(question.expression)}</div>` : ''}
                    </div>
                    
                    <div class="review-answer">
                        <strong>Your Answer:</strong> 
                        ${this.formatUserAnswer(question)}
                    </div>
                    
                    ${!question.isCorrect ? `
                        <div class="review-correct-answer">
                            <strong>Correct Answer:</strong> 
                            ${this.formatCorrectAnswer(question)}
                        </div>
                    ` : ''}
                    
                    <div class="review-time">
                        Time spent: ${Math.round(question.timeSpent / 1000)} seconds
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    formatUserAnswer(question) {
        if (!question.userAnswer) return '<em>No answer provided</em>';
        
        switch (question.type) {
            case 'expressionToCircuit':
            case 'circuitDebugging':
                return `Circuit with ${question.userAnswer.components} components and ${question.userAnswer.connections} connections`;
            case 'truthTableCompletion':
                return 'See completed table above';
            default:
                return question.userAnswer;
        }
    }
    
    formatCorrectAnswer(question) {
        switch (question.type) {
            case 'expressionToCircuit':
                return `Circuit implementing: ${question.expression}`;
            case 'circuitToExpression':
                return question.correctAnswer;
            case 'truthTableCompletion':
                return 'See correct values in review';
            case 'gateIdentification':
                return question.correctAnswer;
            case 'circuitDebugging':
                return `Circuit correctly implementing: ${question.expression}`;
            case 'simplification':
                return question.correctAnswer;
            default:
                return 'N/A';
        }
    }
    
    backToResults() {
        document.getElementById('assessment-review').style.display = 'none';
        document.getElementById('assessment-results').style.display = 'block';
    }
    
    exportResults() {
        const results = {
            assessment: {
                title: this.config.title,
                date: new Date(this.assessmentData.startTime).toISOString(),
                duration: Math.round((this.assessmentData.endTime - this.assessmentData.startTime) / 1000),
                config: this.config
            },
            student: {
                // Could add student info here if available
                timestamp: new Date().toISOString()
            },
            performance: {
                score: this.assessmentData.score,
                maxScore: this.assessmentData.maxScore,
                percentage: this.assessmentData.percentage,
                grade: this.assessmentData.grade,
                passed: this.assessmentData.passed,
                timeRemaining: this.assessmentData.timeRemaining
            },
            questions: this.assessmentData.questions.map(q => ({
                type: q.type,
                difficulty: q.difficulty,
                points: q.points,
                score: q.score || 0,
                correct: q.isCorrect,
                skipped: q.skipped,
                timeSpent: Math.round(q.timeSpent / 1000)
            }))
        };
        
        // Create CSV
        let csv = 'Assessment Results\n';
        csv += `Title,${results.assessment.title}\n`;
        csv += `Date,${new Date(results.assessment.date).toLocaleDateString()}\n`;
        csv += `Score,${results.performance.score}/${results.performance.maxScore}\n`;
        csv += `Percentage,${results.performance.percentage}%\n`;
        csv += `Grade,${results.performance.grade}\n`;
        csv += `Status,${results.performance.passed ? 'Passed' : 'Failed'}\n`;
        csv += '\nQuestion Details\n';
        csv += 'Question,Type,Difficulty,Points,Score,Correct,Time(s)\n';
        
        results.questions.forEach((q, i) => {
            csv += `${i + 1},${q.type},${q.difficulty},${q.points},${q.score},${q.correct ? 'Yes' : 'No'},${q.timeSpent}\n`;
        });
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assessment_results_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    retakeAssessment() {
        if (confirm('Start a new assessment with the same settings?')) {
            this.startAssessment();
        }
    }
    
    backToSetup() {
        document.getElementById('assessment-results').style.display = 'none';
        document.getElementById('assessment-setup').style.display = 'block';
        
        // Reset state
        this.state = {
            active: false,
            started: false,
            completed: false,
            paused: false
        };
    }
    
    saveResults() {
        const results = {
            id: `assessment_${Date.now()}`,
            title: this.config.title,
            date: this.assessmentData.startTime,
            score: this.assessmentData.score,
            maxScore: this.assessmentData.maxScore,
            percentage: this.assessmentData.percentage,
            grade: this.assessmentData.grade,
            passed: this.assessmentData.passed,
            duration: this.assessmentData.endTime - this.assessmentData.startTime,
            config: this.config,
            questions: this.assessmentData.questions.length
        };
        
        // Get existing results
        const saved = localStorage.getItem('logicSim_assessmentResults');
        const allResults = saved ? JSON.parse(saved) : [];
        
        // Add new result
        allResults.push(results);
        
        // Keep only last 50 results
        if (allResults.length > 50) {
            allResults.shift();
        }
        
        // Save
        localStorage.setItem('logicSim_assessmentResults', JSON.stringify(allResults));
    }
    
    loadSavedAssessments() {
        const saved = localStorage.getItem('logicSim_assessmentResults');
        this.savedAssessments = saved ? JSON.parse(saved) : [];
    }
    
    loadPreviousResults() {
        if (this.savedAssessments.length === 0) {
            alert('No previous assessment results found.');
            return;
        }
        
        // Create modal to show previous results
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Previous Assessment Results</h2>
                <div class="results-list">
                    <table class="previous-results-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Score</th>
                                <th>Grade</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.savedAssessments.reverse().map(result => `
                                <tr>
                                    <td>${new Date(result.date).toLocaleDateString()}</td>
                                    <td>${result.title}</td>
                                    <td>${result.score}/${result.maxScore} (${result.percentage}%)</td>
                                    <td>${result.grade}</td>
                                    <td class="${result.passed ? 'passed' : 'failed'}">${result.passed ? 'Passed' : 'Failed'}</td>
                                    <td>
                                        <button class="btn-small" onclick="window.logicSimulator.assessmentMode.viewResult('${result.id}')">View</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    viewResult(resultId) {
        // This would load and display a specific result
        console.log('View result:', resultId);
        // Implementation would show the detailed result view
    }
    
    restoreAnswer(question) {
        // Restore previous answer when navigating back to a question
        switch (question.type) {
            case 'expressionToCircuit':
            case 'circuitDebugging':
                if (question.userAnswer && question.userAnswer.circuit) {
                    this.circuit.importFromJSON(question.userAnswer.circuit);
                }
                break;
                
            case 'truthTableCompletion':
                // Answers are restored in renderTruthTableQuestion
                break;
                
            case 'gateIdentification':
                // Answer is restored in renderGateIdentificationQuestion
                break;
        }
    }
}