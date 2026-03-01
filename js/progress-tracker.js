/* ============================================================
   PROGRESS-TRACKER.JS — Track completed chapters, scores via localStorage
   ============================================================ */

const ProgressTracker = {
  COMPLETED_KEY: 'ai-completed-pages',
  SCORES_KEY: 'ai-quiz-scores',
  BOOKMARKS_KEY: 'ai-bookmarks',

  /* Total topics per chapter (approximate counts for progress calculation) */
  chapterTopics: {
    '00': { name: 'Introduction to AI', total: 5, pages: ['what-is-ai.html','history-of-ai.html','types-of-ai.html','ai-vs-ml-vs-dl.html','gate-da-exam-overview.html'] },
    '01': { name: 'Intelligent Agents', total: 4, pages: ['agents-and-environments.html','rationality.html','task-environment-peas.html','agent-types.html'] },
    '02': { name: 'Uninformed Search', total: 10, pages: ['problem-formulation.html','state-space-representation.html','breadth-first-search.html','depth-first-search.html','depth-limited-search.html','iterative-deepening-dfs.html','uniform-cost-search.html','bidirectional-search.html','comparison-of-uninformed-strategies.html','complexity-analysis.html'] },
    '03': { name: 'Informed Search', total: 11, pages: ['heuristic-functions.html','greedy-best-first-search.html','a-star-search.html','admissibility-and-consistency.html','ida-star.html','rbfs.html','sma-star.html','heuristic-design-techniques.html','local-search-hill-climbing.html','simulated-annealing.html','genetic-algorithms.html'] },
    '04': { name: 'Adversarial Search', total: 8, pages: ['game-theory-basics.html','minimax-algorithm.html','alpha-beta-pruning.html','move-ordering.html','evaluation-functions.html','stochastic-games.html','partially-observable-games.html','monte-carlo-tree-search.html'] },
    '05': { name: 'Propositional Logic', total: 10, pages: ['syntax-and-semantics.html','logical-connectives.html','truth-tables.html','logical-equivalences.html','normal-forms.html','inference-rules.html','propositional-resolution.html','forward-backward-chaining.html','satisfiability-sat.html','horn-clauses.html'] },
    '06': { name: 'Predicate Logic', total: 9, pages: ['first-order-logic-syntax.html','quantifiers.html','predicates-functions-constants.html','unification.html','skolemization.html','first-order-inference.html','generalized-modus-ponens.html','resolution-in-fol.html','knowledge-representation-fol.html'] },
    '07': { name: 'Reasoning Under Uncertainty', total: 15, pages: ['probability-review.html','conditional-independence.html','bayesian-networks.html','conditional-independence-in-bn.html','exact-inference-enumeration.html','variable-elimination.html','variable-elimination-complexity.html','approximate-inference-overview.html','prior-sampling.html','rejection-sampling.html','likelihood-weighting.html','gibbs-sampling.html','markov-chain-monte-carlo.html','hidden-markov-models.html','particle-filtering.html'] },
    '08': { name: 'ML Foundations', total: 6, pages: ['ml-paradigms.html','bias-variance-tradeoff.html','overfitting-underfitting.html','cross-validation.html','evaluation-metrics.html','feature-engineering.html'] },
    '09': { name: 'Neural Networks & DL', total: 10, pages: ['perceptron.html','multilayer-perceptron.html','backpropagation.html','activation-functions.html','optimization-algorithms.html','convolutional-neural-networks.html','recurrent-neural-networks.html','lstm-gru.html','attention-mechanism.html','transformers.html'] },
    '10': { name: 'NLP', total: 7, pages: ['text-preprocessing.html','word-embeddings.html','language-models.html','large-language-models.html','gpt-architecture.html','bert-and-variants.html','prompt-engineering.html'] },
    '11': { name: 'Computer Vision', total: 5, pages: ['image-fundamentals.html','cnn-architectures.html','object-detection.html','image-segmentation.html','generative-models-vision.html'] },
    '12': { name: 'Reinforcement Learning', total: 5, pages: ['mdp.html','value-iteration.html','policy-iteration.html','q-learning.html','deep-reinforcement-learning.html'] },
    '13': { name: 'Planning', total: 4, pages: ['classical-planning.html','strips.html','partial-order-planning.html','graph-planning.html'] },
    '14': { name: 'Constraint Satisfaction', total: 4, pages: ['csp-formulation.html','backtracking-csp.html','arc-consistency.html','constraint-propagation.html'] },
    '15': { name: 'Advanced Topics', total: 9, pages: ['explainable-ai.html','ai-ethics-fairness.html','federated-learning.html','neuromorphic-computing.html','quantum-machine-learning.html','ai-safety-alignment.html','multimodal-ai.html','autonomous-systems.html','recent-breakthroughs.html'] },
    '16': { name: 'GATE DA Preparation', total: 6, pages: ['exam-pattern-strategy.html','topic-wise-weightage.html','previous-year-compilation.html','formula-sheet.html','common-mistakes.html','final-revision-checklist.html'] }
  },

  init() {
    this.initCompleteButton();
    this.initBookmarkButton();
    this.updateSidebarChecks();
    this.updateOverallProgress();
  },

  /* --- Mark Page as Completed --- */
  markCompleted(page) {
    const completed = Utils.getJSON(this.COMPLETED_KEY, []);
    if (!completed.includes(page)) {
      completed.push(page);
      Utils.setJSON(this.COMPLETED_KEY, completed);
    }
    return completed;
  },

  unmarkCompleted(page) {
    let completed = Utils.getJSON(this.COMPLETED_KEY, []);
    completed = completed.filter(p => p !== page);
    Utils.setJSON(this.COMPLETED_KEY, completed);
    return completed;
  },

  isCompleted(page) {
    const completed = Utils.getJSON(this.COMPLETED_KEY, []);
    return completed.includes(page);
  },

  /* --- Init Complete Button --- */
  initCompleteButton() {
    const btn = Utils.$('.complete-btn');
    if (!btn) return;

    const page = Utils.getCurrentPage();
    if (this.isCompleted(page)) {
      btn.classList.add('completed');
      btn.innerHTML = '✓ Completed';
    }

    btn.addEventListener('click', () => {
      const page = Utils.getCurrentPage();
      if (this.isCompleted(page)) {
        this.unmarkCompleted(page);
        btn.classList.remove('completed');
        btn.innerHTML = '○ Mark as Complete';
      } else {
        this.markCompleted(page);
        btn.classList.add('completed');
        btn.innerHTML = '✓ Completed';
        Utils.showToast('Page marked as completed!');
      }
      this.updateSidebarChecks();
      this.updateOverallProgress();
    });
  },

  /* --- Bookmarks --- */
  toggleBookmark(page, title) {
    let bookmarks = Utils.getJSON(this.BOOKMARKS_KEY, []);
    const idx = bookmarks.findIndex(b => b.page === page);
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
    } else {
      bookmarks.push({ page, title, date: new Date().toISOString() });
    }
    Utils.setJSON(this.BOOKMARKS_KEY, bookmarks);
    return bookmarks;
  },

  isBookmarked(page) {
    const bookmarks = Utils.getJSON(this.BOOKMARKS_KEY, []);
    return bookmarks.some(b => b.page === page);
  },

  initBookmarkButton() {
    const btn = Utils.$('.bookmark-btn');
    if (!btn) return;

    const page = Utils.getCurrentPage();
    if (this.isBookmarked(page)) {
      btn.classList.add('bookmarked');
      btn.innerHTML = '★ Bookmarked';
    }

    btn.addEventListener('click', () => {
      const page = Utils.getCurrentPage();
      const title = Utils.$('h1') ? Utils.$('h1').textContent : document.title;
      this.toggleBookmark(page, title);
      if (this.isBookmarked(page)) {
        btn.classList.add('bookmarked');
        btn.innerHTML = '★ Bookmarked';
        Utils.showToast('Page bookmarked!');
      } else {
        btn.classList.remove('bookmarked');
        btn.innerHTML = '☆ Bookmark';
      }
    });
  },

  /* --- Update Sidebar Checks --- */
  updateSidebarChecks() {
    const completed = Utils.getJSON(this.COMPLETED_KEY, []);
    Utils.$$('.sidebar-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const checkEl = link.querySelector('.link-check');
      const fileName = href.split('/').pop();
      const isComplete = completed.some(p => p.endsWith(fileName));
      if (checkEl) {
        checkEl.textContent = isComplete ? '✓' : '';
      }
    });
  },

  /* --- Calculate Overall Progress --- */
  getOverallProgress() {
    const completed = Utils.getJSON(this.COMPLETED_KEY, []);
    let totalTopics = 0;
    let completedTopics = 0;

    Object.values(this.chapterTopics).forEach(chapter => {
      totalTopics += chapter.total;
      chapter.pages.forEach(page => {
        if (completed.some(p => p.endsWith(page))) {
          completedTopics++;
        }
      });
    });

    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  },

  getChapterProgress(chapterKey) {
    const completed = Utils.getJSON(this.COMPLETED_KEY, []);
    const chapter = this.chapterTopics[chapterKey];
    if (!chapter) return 0;

    let count = 0;
    chapter.pages.forEach(page => {
      if (completed.some(p => p.endsWith(page))) count++;
    });
    return chapter.total > 0 ? Math.round((count / chapter.total) * 100) : 0;
  },

  updateOverallProgress() {
    const pct = this.getOverallProgress();
    const el = Utils.$('.overall-progress');
    if (el) el.textContent = `${pct}% Complete`;
  },

  /* --- Quiz Scores --- */
  saveQuizScore(quizId, score, total, time) {
    const scores = Utils.getJSON(this.SCORES_KEY, {});
    if (!scores[quizId]) scores[quizId] = [];
    scores[quizId].push({
      score, total, percentage: Math.round((score/total)*100),
      time, date: new Date().toISOString()
    });
    Utils.setJSON(this.SCORES_KEY, scores);
  },

  getQuizScores(quizId) {
    const scores = Utils.getJSON(this.SCORES_KEY, {});
    return scores[quizId] || [];
  },

  getBestScore(quizId) {
    const scores = this.getQuizScores(quizId);
    if (scores.length === 0) return null;
    return scores.reduce((best, s) => s.percentage > best.percentage ? s : best, scores[0]);
  }
};

document.addEventListener('DOMContentLoaded', () => ProgressTracker.init());
