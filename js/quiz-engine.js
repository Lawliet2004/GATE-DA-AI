/* ============================================================
   QUIZ-ENGINE.JS — Universal quiz logic: scoring, timer, review, progress
   ============================================================ */

const QuizEngine = {
  questions: [],
  currentIndex: 0,
  answers: {},
  markedForReview: new Set(),
  visitedQuestions: new Set(),
  timerInterval: null,
  elapsedSeconds: 0,
  timerEnabled: false,
  timerLimit: 0,
  submitted: false,
  quizId: '',

  /* --- Initialize Quiz --- */
  init(config) {
    this.quizId = config.quizId || 'default-quiz';
    this.questions = config.questions || [];
    this.timerLimit = config.timeLimit || 1800; // 30 min default
    this.timerEnabled = config.timerEnabled !== false;
    this.currentIndex = 0;
    this.answers = {};
    this.markedForReview = new Set();
    this.visitedQuestions = new Set();
    this.elapsedSeconds = 0;
    this.submitted = false;

    if (this.questions.length === 0) return;

    this.renderPalette();
    this.showQuestion(0);
    this.startTimer();
    this.bindNavigation();
  },

  /* --- Render Question Palette --- */
  renderPalette() {
    const container = Utils.$('.question-palette');
    if (!container) return;

    container.innerHTML = '';
    this.questions.forEach((q, i) => {
      const btn = Utils.createElement('button', {
        className: 'palette-btn',
        textContent: String(i + 1),
        'aria-label': `Question ${i + 1}`,
        onClick: () => this.showQuestion(i)
      });
      container.appendChild(btn);
    });
  },

  updatePalette() {
    const btns = Utils.$$('.palette-btn');
    btns.forEach((btn, i) => {
      btn.className = 'palette-btn';
      if (i === this.currentIndex) btn.classList.add('current');
      if (this.answers[i] !== undefined) btn.classList.add('answered');
      else if (this.visitedQuestions.has(i)) btn.classList.add('visited');
      if (this.markedForReview.has(i)) btn.classList.add('marked');
    });
  },

  /* --- Show Question --- */
  showQuestion(index) {
    if (index < 0 || index >= this.questions.length) return;
    this.currentIndex = index;
    this.visitedQuestions.add(index);

    const q = this.questions[index];
    const container = Utils.$('.question-display');
    if (!container) return;

    let optionsHTML = '';
    const savedAnswer = this.answers[index];

    switch (q.type) {
      case 'mcq':
        optionsHTML = '<ul class="options-list">' + q.options.map((opt, oi) => {
          const letter = String.fromCharCode(65 + oi);
          const selected = savedAnswer === oi ? 'selected' : '';
          return `<li class="option-item ${selected}" data-index="${oi}" onclick="QuizEngine.selectOption(${oi})">
            <span class="option-label">${letter}</span>
            <span class="option-text">${opt}</span>
          </li>`;
        }).join('') + '</ul>';
        break;

      case 'msq':
        const selArr = Array.isArray(savedAnswer) ? savedAnswer : [];
        optionsHTML = '<ul class="options-list">' + q.options.map((opt, oi) => {
          const letter = String.fromCharCode(65 + oi);
          const selected = selArr.includes(oi) ? 'selected' : '';
          return `<li class="option-item ${selected}" data-index="${oi}" onclick="QuizEngine.toggleOption(${oi})">
            <span class="option-label">${letter}</span>
            <span class="option-text">${opt}</span>
          </li>`;
        }).join('') + '</ul>';
        break;

      case 'nat':
        const natVal = savedAnswer !== undefined ? savedAnswer : '';
        optionsHTML = `<div class="nat-input">
          <label>Your Answer:</label>
          <input type="number" step="any" value="${natVal}" 
                 oninput="QuizEngine.setNATAnswer(this.value)" 
                 placeholder="Enter numerical value">
        </div>`;
        break;

      case 'tf':
        optionsHTML = `<div class="tf-options">
          <div class="tf-option ${savedAnswer === true ? 'selected' : ''}" onclick="QuizEngine.selectTF(true)">True</div>
          <div class="tf-option ${savedAnswer === false ? 'selected' : ''}" onclick="QuizEngine.selectTF(false)">False</div>
        </div>`;
        break;

      case 'match':
        optionsHTML = '<div class="match-container">';
        q.left_items.forEach((item, mi) => {
          const savedMatch = (savedAnswer && savedAnswer[mi]) !== undefined ? savedAnswer[mi] : '';
          optionsHTML += `<div class="match-item">${item}</div>
            <div class="match-arrow">→</div>
            <select class="match-select" onchange="QuizEngine.setMatch(${mi}, this.value)">
              <option value="">Select...</option>
              ${q.right_items.map((r, ri) => `<option value="${ri}" ${savedMatch == ri ? 'selected' : ''}>${r}</option>`).join('')}
            </select>`;
        });
        optionsHTML += '</div>';
        break;

      case 'assertion':
        optionsHTML = `<div class="note-box"><div class="box-title">Assertion-Reasoning</div>
          <p><strong>Assertion (A):</strong> ${q.assertion}</p>
          <p><strong>Reason (R):</strong> ${q.reason}</p></div>`;
        optionsHTML += '<ul class="options-list">' + q.options.map((opt, oi) => {
          const letter = String.fromCharCode(65 + oi);
          const selected = savedAnswer === oi ? 'selected' : '';
          return `<li class="option-item ${selected}" data-index="${oi}" onclick="QuizEngine.selectOption(${oi})">
            <span class="option-label">${letter}</span>
            <span class="option-text">${opt}</span>
          </li>`;
        }).join('') + '</ul>';
        break;

      default:
        optionsHTML = '<ul class="options-list">' + (q.options || []).map((opt, oi) => {
          const letter = String.fromCharCode(65 + oi);
          const selected = savedAnswer === oi ? 'selected' : '';
          return `<li class="option-item ${selected}" data-index="${oi}" onclick="QuizEngine.selectOption(${oi})">
            <span class="option-label">${letter}</span>
            <span class="option-text">${opt}</span>
          </li>`;
        }).join('') + '</ul>';
    }

    const diffClass = (q.difficulty || 'medium').toLowerCase();
    container.innerHTML = `
      <div class="question-card active">
        <div class="question-number">
          Question ${index + 1} of ${this.questions.length}
          <span class="question-difficulty ${diffClass}">${q.difficulty || 'Medium'}</span>
          ${q.gate_year ? `<span class="gate-tag">${q.gate_year}</span>` : ''}
        </div>
        <div class="question-text">${q.question_html}</div>
        ${optionsHTML}
        <div class="question-actions">
          <div>
            <button class="btn btn-secondary btn-sm" onclick="QuizEngine.toggleMark()">
              ${this.markedForReview.has(index) ? '🔖 Unmark' : '🔖 Mark for Review'}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="QuizEngine.clearAnswer()">Clear</button>
          </div>
          <div>
            ${index > 0 ? '<button class="btn btn-secondary btn-sm" onclick="QuizEngine.prev()">← Previous</button>' : ''}
            ${index < this.questions.length - 1 ? 
              '<button class="btn btn-primary btn-sm" onclick="QuizEngine.next()">Next →</button>' :
              '<button class="submit-quiz-btn" onclick="QuizEngine.confirmSubmit()">Submit Quiz</button>'}
          </div>
        </div>
      </div>
    `;

    this.updatePalette();
  },

  /* --- Answer Handlers --- */
  selectOption(optIndex) {
    if (this.submitted) return;
    this.answers[this.currentIndex] = optIndex;
    this.showQuestion(this.currentIndex);
  },

  toggleOption(optIndex) {
    if (this.submitted) return;
    let sel = Array.isArray(this.answers[this.currentIndex]) ? [...this.answers[this.currentIndex]] : [];
    const idx = sel.indexOf(optIndex);
    if (idx >= 0) sel.splice(idx, 1);
    else sel.push(optIndex);
    this.answers[this.currentIndex] = sel.length > 0 ? sel : undefined;
    if (sel.length === 0) delete this.answers[this.currentIndex];
    this.showQuestion(this.currentIndex);
  },

  setNATAnswer(value) {
    if (this.submitted) return;
    if (value === '' || value === null) {
      delete this.answers[this.currentIndex];
    } else {
      this.answers[this.currentIndex] = parseFloat(value);
    }
    this.updatePalette();
  },

  selectTF(value) {
    if (this.submitted) return;
    this.answers[this.currentIndex] = value;
    this.showQuestion(this.currentIndex);
  },

  setMatch(itemIndex, value) {
    if (this.submitted) return;
    if (!this.answers[this.currentIndex]) this.answers[this.currentIndex] = {};
    if (value === '') delete this.answers[this.currentIndex][itemIndex];
    else this.answers[this.currentIndex][itemIndex] = parseInt(value);
    this.updatePalette();
  },

  toggleMark() {
    if (this.markedForReview.has(this.currentIndex)) {
      this.markedForReview.delete(this.currentIndex);
    } else {
      this.markedForReview.add(this.currentIndex);
    }
    this.showQuestion(this.currentIndex);
  },

  clearAnswer() {
    delete this.answers[this.currentIndex];
    this.showQuestion(this.currentIndex);
  },

  prev() { this.showQuestion(this.currentIndex - 1); },
  next() { this.showQuestion(this.currentIndex + 1); },

  /* --- Timer --- */
  startTimer() {
    const timerEl = Utils.$('.quiz-timer');
    if (!timerEl) return;

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      const remaining = this.timerLimit - this.elapsedSeconds;

      if (this.timerEnabled) {
        timerEl.textContent = `⏱ ${Utils.formatTime(Math.max(0, remaining))}`;
        if (remaining <= 60) timerEl.classList.add('warning');
        if (remaining <= 0) {
          this.submit();
        }
      } else {
        timerEl.textContent = `⏱ ${Utils.formatTime(this.elapsedSeconds)}`;
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  /* --- Navigation Bindings --- */
  bindNavigation() {
    document.addEventListener('keydown', (e) => {
      if (this.submitted) return;
      if (e.key === 'ArrowRight' || e.key === 'n') this.next();
      if (e.key === 'ArrowLeft' || e.key === 'p') this.prev();
    });
  },

  /* --- Submit --- */
  confirmSubmit() {
    const answered = Object.keys(this.answers).length;
    const total = this.questions.length;
    const unanswered = total - answered;

    if (unanswered > 0) {
      const proceed = confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
      if (!proceed) return;
    }
    this.submit();
  },

  submit() {
    this.submitted = true;
    this.stopTimer();

    let score = 0;
    const results = [];

    this.questions.forEach((q, i) => {
      const userAnswer = this.answers[i];
      let isCorrect = false;

      switch (q.type) {
        case 'mcq':
        case 'assertion':
          isCorrect = userAnswer === q.correct_answer;
          break;
        case 'msq':
          if (Array.isArray(userAnswer) && Array.isArray(q.correct_answer)) {
            isCorrect = userAnswer.length === q.correct_answer.length && 
                        userAnswer.every(a => q.correct_answer.includes(a));
          }
          break;
        case 'nat':
          if (userAnswer !== undefined && q.correct_answer !== undefined) {
            const tolerance = q.tolerance || 0.01;
            isCorrect = Math.abs(userAnswer - q.correct_answer) <= tolerance;
          }
          break;
        case 'tf':
          isCorrect = userAnswer === q.correct_answer;
          break;
        case 'match':
          if (userAnswer && q.correct_answer) {
            isCorrect = Object.keys(q.correct_answer).every(k => 
              userAnswer[k] === q.correct_answer[k]
            );
          }
          break;
      }

      if (isCorrect) score++;
      results.push({ question: q, userAnswer, isCorrect, index: i });
    });

    // Save score
    ProgressTracker.saveQuizScore(this.quizId, score, this.questions.length, this.elapsedSeconds);

    // Show results
    this.showResults(score, results);
  },

  /* --- Show Results --- */
  showResults(score, results) {
    const total = this.questions.length;
    const pct = Math.round((score / total) * 100);
    const timeTaken = Utils.formatTime(this.elapsedSeconds);

    // Count by difficulty
    const byDifficulty = {};
    const byType = {};
    results.forEach(r => {
      const diff = r.question.difficulty || 'Medium';
      const type = r.question.type || 'mcq';
      if (!byDifficulty[diff]) byDifficulty[diff] = { correct: 0, total: 0 };
      if (!byType[type]) byType[type] = { correct: 0, total: 0 };
      byDifficulty[diff].total++;
      byType[type].total++;
      if (r.isCorrect) {
        byDifficulty[diff].correct++;
        byType[type].correct++;
      }
    });

    const container = Utils.$('.quiz-content');
    if (!container) return;

    let breakdownHTML = '';
    Object.entries(byDifficulty).forEach(([diff, data]) => {
      breakdownHTML += `<div class="score-stat">
        <div class="stat-value">${data.correct}/${data.total}</div>
        <div class="stat-label">${diff}</div>
      </div>`;
    });

    let detailedHTML = '';
    results.forEach((r, i) => {
      const statusClass = r.isCorrect ? 'correct' : 'incorrect';
      const statusIcon = r.isCorrect ? '✓' : '✗';
      
      let correctDisplay = '';
      if (r.question.type === 'mcq' || r.question.type === 'assertion') {
        correctDisplay = `Correct: ${String.fromCharCode(65 + r.question.correct_answer)}`;
      } else if (r.question.type === 'nat') {
        correctDisplay = `Correct: ${r.question.correct_answer}`;
      } else if (r.question.type === 'tf') {
        correctDisplay = `Correct: ${r.question.correct_answer ? 'True' : 'False'}`;
      } else if (r.question.type === 'msq') {
        correctDisplay = `Correct: ${r.question.correct_answer.map(a => String.fromCharCode(65 + a)).join(', ')}`;
      }

      detailedHTML += `
        <div class="question-card" style="border-left:4px solid ${r.isCorrect ? '#27ae60' : '#e74c3c'}">
          <div class="question-number">
            ${statusIcon} Question ${i + 1}
            <span class="question-difficulty ${(r.question.difficulty||'medium').toLowerCase()}">${r.question.difficulty || 'Medium'}</span>
          </div>
          <div class="question-text">${r.question.question_html}</div>
          <p><strong>${correctDisplay}</strong></p>
          ${r.userAnswer !== undefined ? `<p>Your answer: <strong>${this.formatAnswer(r)}</strong></p>` : '<p><em>Not answered</em></p>'}
          <div class="explanation-box">
            <div class="explanation-title">Explanation</div>
            <div class="explanation-text">${r.question.explanation_html}</div>
          </div>
        </div>`;
    });

    // Previous attempts
    const prevScores = ProgressTracker.getQuizScores(this.quizId);
    let prevHTML = '';
    if (prevScores.length > 1) {
      prevHTML = '<h3>Previous Attempts</h3><table><thead><tr><th>#</th><th>Score</th><th>%</th><th>Time</th><th>Date</th></tr></thead><tbody>';
      prevScores.forEach((s, i) => {
        prevHTML += `<tr><td>${i+1}</td><td>${s.score}/${s.total}</td><td>${s.percentage}%</td><td>${Utils.formatTime(s.time)}</td><td>${new Date(s.date).toLocaleDateString()}</td></tr>`;
      });
      prevHTML += '</tbody></table>';
    }

    container.innerHTML = `
      <div class="score-card">
        <div class="score-value">${score} / ${total}</div>
        <div class="score-label">${pct}% — Time: ${timeTaken}</div>
        <div class="score-breakdown">
          ${breakdownHTML}
          <div class="score-stat">
            <div class="stat-value">${timeTaken}</div>
            <div class="stat-label">Time Taken</div>
          </div>
        </div>
      </div>
      ${prevHTML}
      <h2>Detailed Solutions</h2>
      ${detailedHTML}
      <div style="text-align:center;margin-top:32px;">
        <button class="btn btn-primary btn-lg" onclick="location.reload()">Retry Quiz</button>
      </div>
    `;
  },

  formatAnswer(result) {
    const r = result;
    if (r.question.type === 'mcq' || r.question.type === 'assertion') {
      return r.userAnswer !== undefined ? String.fromCharCode(65 + r.userAnswer) : 'N/A';
    }
    if (r.question.type === 'msq') {
      return Array.isArray(r.userAnswer) ? r.userAnswer.map(a => String.fromCharCode(65+a)).join(', ') : 'N/A';
    }
    if (r.question.type === 'nat') {
      return r.userAnswer !== undefined ? String(r.userAnswer) : 'N/A';
    }
    if (r.question.type === 'tf') {
      return r.userAnswer !== undefined ? (r.userAnswer ? 'True' : 'False') : 'N/A';
    }
    return String(r.userAnswer || 'N/A');
  }
};
