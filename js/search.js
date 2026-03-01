/* ============================================================
   SEARCH.JS — Client-side full-text search across all topics
   ============================================================ */

const SearchEngine = {
  index: [],
  initialized: false,

  init() {
    this.buildIndex();
    this.bindSearch();
    this.initialized = true;
  },

  buildIndex() {
    // Comprehensive search index mapping keywords to pages
    this.index = [
      // Chapter 0
      { title: "What is AI?", chapter: "Introduction", url: "chapters/00-introduction/what-is-ai.html", keywords: "artificial intelligence definition turing test rational agent ai overview" },
      { title: "History of AI", chapter: "Introduction", url: "chapters/00-introduction/history-of-ai.html", keywords: "history timeline dartmouth turing mccarthy minsky ai winter" },
      { title: "Types of AI", chapter: "Introduction", url: "chapters/00-introduction/types-of-ai.html", keywords: "narrow ai general agi superintelligence weak strong types classification" },
      { title: "AI vs ML vs DL", chapter: "Introduction", url: "chapters/00-introduction/ai-vs-ml-vs-dl.html", keywords: "machine learning deep learning comparison differences subset" },
      { title: "GATE DA Exam Overview", chapter: "Introduction", url: "chapters/00-introduction/gate-da-exam-overview.html", keywords: "gate exam pattern syllabus data science artificial intelligence" },

      // Chapter 1
      { title: "Agents and Environments", chapter: "Intelligent Agents", url: "chapters/01-intelligent-agents/agents-and-environments.html", keywords: "agent environment percept action sensor actuator" },
      { title: "Rationality", chapter: "Intelligent Agents", url: "chapters/01-intelligent-agents/rationality.html", keywords: "rational agent performance measure rationality omniscience" },
      { title: "Task Environment (PEAS)", chapter: "Intelligent Agents", url: "chapters/01-intelligent-agents/task-environment-peas.html", keywords: "peas performance environment actuators sensors observable deterministic" },
      { title: "Agent Types", chapter: "Intelligent Agents", url: "chapters/01-intelligent-agents/agent-types.html", keywords: "simple reflex model based goal utility learning agent table driven" },

      // Chapter 2
      { title: "Problem Formulation", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/problem-formulation.html", keywords: "problem formulation state space initial goal actions transition" },
      { title: "State Space Representation", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/state-space-representation.html", keywords: "state space graph tree representation search" },
      { title: "Breadth-First Search", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/breadth-first-search.html", keywords: "bfs breadth first search fifo queue complete optimal uniform cost" },
      { title: "Depth-First Search", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/depth-first-search.html", keywords: "dfs depth first search lifo stack backtracking" },
      { title: "Depth-Limited Search", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/depth-limited-search.html", keywords: "depth limited search dls limit cutoff" },
      { title: "Iterative Deepening DFS", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/iterative-deepening-dfs.html", keywords: "iterative deepening iddfs ids combination bfs dfs" },
      { title: "Uniform Cost Search", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/uniform-cost-search.html", keywords: "ucs uniform cost search priority queue dijkstra cheapest path" },
      { title: "Bidirectional Search", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/bidirectional-search.html", keywords: "bidirectional search forward backward meet middle" },
      { title: "Comparison of Uninformed Strategies", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/comparison-of-uninformed-strategies.html", keywords: "comparison bfs dfs ucs iddfs complete optimal time space complexity" },
      { title: "Complexity Analysis", chapter: "Uninformed Search", url: "chapters/02-uninformed-search/complexity-analysis.html", keywords: "time complexity space complexity branching factor depth completeness optimality" },

      // Chapter 3
      { title: "Heuristic Functions", chapter: "Informed Search", url: "chapters/03-informed-search/heuristic-functions.html", keywords: "heuristic function h(n) estimate admissible consistent" },
      { title: "Greedy Best-First Search", chapter: "Informed Search", url: "chapters/03-informed-search/greedy-best-first-search.html", keywords: "greedy best first search heuristic f(n)=h(n) expand closest" },
      { title: "A* Search", chapter: "Informed Search", url: "chapters/03-informed-search/a-star-search.html", keywords: "a star astar search f(n)=g(n)+h(n) optimal admissible consistent" },
      { title: "Admissibility and Consistency", chapter: "Informed Search", url: "chapters/03-informed-search/admissibility-and-consistency.html", keywords: "admissible heuristic consistent monotone triangle inequality" },
      { title: "IDA*", chapter: "Informed Search", url: "chapters/03-informed-search/ida-star.html", keywords: "ida star iterative deepening a star memory efficient" },
      { title: "RBFS", chapter: "Informed Search", url: "chapters/03-informed-search/rbfs.html", keywords: "recursive best first search rbfs linear memory" },
      { title: "SMA*", chapter: "Informed Search", url: "chapters/03-informed-search/sma-star.html", keywords: "simplified memory bounded a star sma" },
      { title: "Heuristic Design Techniques", chapter: "Informed Search", url: "chapters/03-informed-search/heuristic-design-techniques.html", keywords: "relaxed problem pattern database heuristic design dominance" },
      { title: "Hill Climbing & Local Search", chapter: "Informed Search", url: "chapters/03-informed-search/local-search-hill-climbing.html", keywords: "hill climbing local search steepest ascent stochastic random restart local maxima plateau" },
      { title: "Simulated Annealing", chapter: "Informed Search", url: "chapters/03-informed-search/simulated-annealing.html", keywords: "simulated annealing temperature schedule cooling acceptance probability metropolis" },
      { title: "Genetic Algorithms", chapter: "Informed Search", url: "chapters/03-informed-search/genetic-algorithms.html", keywords: "genetic algorithm crossover mutation selection fitness population evolution" },

      // Chapter 4
      { title: "Game Theory Basics", chapter: "Adversarial Search", url: "chapters/04-adversarial-search/game-theory-basics.html", keywords: "game theory adversarial zero sum two player" },
      { title: "Minimax Algorithm", chapter: "Adversarial Search", url: "chapters/04-adversarial-search/minimax-algorithm.html", keywords: "minimax algorithm game tree max min backup value" },
      { title: "Alpha-Beta Pruning", chapter: "Adversarial Search", url: "chapters/04-adversarial-search/alpha-beta-pruning.html", keywords: "alpha beta pruning minimax prune branch optimization" },
      { title: "Move Ordering", chapter: "Adversarial Search", url: "chapters/04-adversarial-search/move-ordering.html", keywords: "move ordering killer heuristic transposition table iterative deepening" },
      { title: "Evaluation Functions", chapter: "Adversarial Search", url: "chapters/04-adversarial-search/evaluation-functions.html", keywords: "evaluation function heuristic cutoff depth limited" },
      { title: "Stochastic Games", chapter: "Adversarial Search", url: "chapters/04-adversarial-search/stochastic-games.html", keywords: "expectiminimax stochastic games chance nodes backgammon dice" },
      { title: "Monte Carlo Tree Search", chapter: "Adversarial Search", url: "chapters/04-adversarial-search/monte-carlo-tree-search.html", keywords: "mcts monte carlo tree search ucb exploration exploitation" },

      // Chapter 5
      { title: "Syntax and Semantics (PL)", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/syntax-and-semantics.html", keywords: "propositional logic syntax semantics proposition atomic sentence" },
      { title: "Logical Connectives", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/logical-connectives.html", keywords: "and or not implies biconditional conjunction disjunction negation implication" },
      { title: "Truth Tables", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/truth-tables.html", keywords: "truth table tautology contradiction contingency satisfiable" },
      { title: "Logical Equivalences", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/logical-equivalences.html", keywords: "logical equivalence de morgan distribution contrapositive commutative associative" },
      { title: "Normal Forms (CNF/DNF)", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/normal-forms.html", keywords: "cnf dnf conjunctive normal form disjunctive clause literal" },
      { title: "Inference Rules", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/inference-rules.html", keywords: "modus ponens modus tollens hypothetical syllogism disjunctive resolution" },
      { title: "Propositional Resolution", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/propositional-resolution.html", keywords: "resolution refutation proof clause complementary literal" },
      { title: "Forward & Backward Chaining", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/forward-backward-chaining.html", keywords: "forward chaining backward chaining horn clause data driven goal driven" },
      { title: "Satisfiability (SAT)", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/satisfiability-sat.html", keywords: "sat satisfiability np complete dpll walksat" },
      { title: "Horn Clauses", chapter: "Propositional Logic", url: "chapters/05-propositional-logic/horn-clauses.html", keywords: "horn clause definite goal fact rule" },

      // Chapter 6
      { title: "First-Order Logic Syntax", chapter: "Predicate Logic", url: "chapters/06-predicate-logic/first-order-logic-syntax.html", keywords: "first order logic fol predicate syntax term sentence" },
      { title: "Quantifiers", chapter: "Predicate Logic", url: "chapters/06-predicate-logic/quantifiers.html", keywords: "universal existential quantifier for all there exists nested scope" },
      { title: "Unification", chapter: "Predicate Logic", url: "chapters/06-predicate-logic/unification.html", keywords: "unification algorithm substitution most general unifier mgu occurs check" },
      { title: "Skolemization", chapter: "Predicate Logic", url: "chapters/06-predicate-logic/skolemization.html", keywords: "skolemization skolem function constant existential elimination prenex" },
      { title: "Resolution in FOL", chapter: "Predicate Logic", url: "chapters/06-predicate-logic/resolution-in-fol.html", keywords: "resolution first order logic fol refutation unification clause" },

      // Chapter 7
      { title: "Probability Review", chapter: "Uncertainty", url: "chapters/07-reasoning-under-uncertainty/probability-review.html", keywords: "bayes theorem probability joint conditional marginalization prior posterior" },
      { title: "Conditional Independence", chapter: "Uncertainty", url: "chapters/07-reasoning-under-uncertainty/conditional-independence.html", keywords: "conditional independence marginal independence d-separation" },
      { title: "Bayesian Networks", chapter: "Uncertainty", url: "chapters/07-reasoning-under-uncertainty/bayesian-networks.html", keywords: "bayesian network dag cpt conditional probability table belief network" },
      { title: "Variable Elimination", chapter: "Uncertainty", url: "chapters/07-reasoning-under-uncertainty/variable-elimination.html", keywords: "variable elimination factor multiplication marginalization exact inference" },
      { title: "Gibbs Sampling", chapter: "Uncertainty", url: "chapters/07-reasoning-under-uncertainty/gibbs-sampling.html", keywords: "gibbs sampling mcmc markov chain monte carlo burn-in markov blanket" },
      { title: "Hidden Markov Models", chapter: "Uncertainty", url: "chapters/07-reasoning-under-uncertainty/hidden-markov-models.html", keywords: "hmm hidden markov model viterbi forward backward filtering" },

      // Chapter 8
      { title: "ML Paradigms", chapter: "ML Foundations", url: "chapters/08-machine-learning-foundations/ml-paradigms.html", keywords: "supervised unsupervised reinforcement learning classification regression clustering" },
      { title: "Bias-Variance Tradeoff", chapter: "ML Foundations", url: "chapters/08-machine-learning-foundations/bias-variance-tradeoff.html", keywords: "bias variance tradeoff error decomposition underfitting overfitting" },
      { title: "Cross-Validation", chapter: "ML Foundations", url: "chapters/08-machine-learning-foundations/cross-validation.html", keywords: "cross validation k-fold leave one out stratified train test split" },
      { title: "Evaluation Metrics", chapter: "ML Foundations", url: "chapters/08-machine-learning-foundations/evaluation-metrics.html", keywords: "accuracy precision recall f1 score roc auc confusion matrix" },

      // Chapter 9
      { title: "Perceptron", chapter: "Neural Networks", url: "chapters/09-neural-networks-deep-learning/perceptron.html", keywords: "perceptron single layer linear classifier weight threshold activation" },
      { title: "Backpropagation", chapter: "Neural Networks", url: "chapters/09-neural-networks-deep-learning/backpropagation.html", keywords: "backpropagation gradient descent chain rule error propagation" },
      { title: "Activation Functions", chapter: "Neural Networks", url: "chapters/09-neural-networks-deep-learning/activation-functions.html", keywords: "relu sigmoid tanh softmax activation function vanishing gradient" },
      { title: "CNNs", chapter: "Neural Networks", url: "chapters/09-neural-networks-deep-learning/convolutional-neural-networks.html", keywords: "cnn convolutional neural network convolution pooling filter kernel feature map" },
      { title: "RNNs", chapter: "Neural Networks", url: "chapters/09-neural-networks-deep-learning/recurrent-neural-networks.html", keywords: "rnn recurrent neural network sequence hidden state temporal" },
      { title: "Transformers", chapter: "Neural Networks", url: "chapters/09-neural-networks-deep-learning/transformers.html", keywords: "transformer attention self-attention multi-head positional encoding" },

      // Chapter 10
      { title: "Word Embeddings", chapter: "NLP", url: "chapters/10-natural-language-processing/word-embeddings.html", keywords: "word2vec glove embedding vector representation word" },
      { title: "Large Language Models", chapter: "NLP", url: "chapters/10-natural-language-processing/large-language-models.html", keywords: "llm large language model gpt bert scaling" },

      // Chapter 12
      { title: "Markov Decision Processes", chapter: "Reinforcement Learning", url: "chapters/12-reinforcement-learning/mdp.html", keywords: "mdp markov decision process state action reward transition policy" },
      { title: "Q-Learning", chapter: "Reinforcement Learning", url: "chapters/12-reinforcement-learning/q-learning.html", keywords: "q-learning temporal difference off-policy exploration exploitation epsilon greedy" },
      { title: "Value Iteration", chapter: "Reinforcement Learning", url: "chapters/12-reinforcement-learning/value-iteration.html", keywords: "value iteration bellman equation optimal policy convergence" },

      // Chapter 14
      { title: "CSP Formulation", chapter: "Constraint Satisfaction", url: "chapters/14-constraint-satisfaction/csp-formulation.html", keywords: "constraint satisfaction problem variables domains constraints csp" },
      { title: "Arc Consistency", chapter: "Constraint Satisfaction", url: "chapters/14-constraint-satisfaction/arc-consistency.html", keywords: "arc consistency ac-3 constraint propagation domain reduction" },

      // Chapter 16
      { title: "Exam Pattern & Strategy", chapter: "GATE Preparation", url: "chapters/16-gate-da-preparation/exam-pattern-strategy.html", keywords: "gate exam pattern strategy mcq msq nat time management" },
      { title: "Formula Sheet", chapter: "GATE Preparation", url: "chapters/16-gate-da-preparation/formula-sheet.html", keywords: "formula sheet reference quick revision all formulas" },
      { title: "Mock Test 1", chapter: "GATE Preparation", url: "chapters/16-gate-da-preparation/mock-test-1.html", keywords: "mock test practice exam simulation" },

      // Main Pages
      { title: "Complete Syllabus", chapter: "Main", url: "syllabus.html", keywords: "syllabus gate da complete topics covered" },
      { title: "Learning Roadmap", chapter: "Main", url: "roadmap.html", keywords: "roadmap path learning order sequence beginner advanced" },
      { title: "Glossary", chapter: "Main", url: "glossary.html", keywords: "glossary terms definitions a-z terminology dictionary" }
    ];
  },

  search(query) {
    if (!query || query.length < 2) return [];
    const terms = query.toLowerCase().split(/\s+/);
    
    const results = this.index.map(item => {
      const searchText = `${item.title} ${item.chapter} ${item.keywords}`.toLowerCase();
      let score = 0;
      terms.forEach(term => {
        if (searchText.includes(term)) score++;
        if (item.title.toLowerCase().includes(term)) score += 3;
        if (item.keywords.includes(term)) score += 2;
      });
      return { ...item, score };
    }).filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return results;
  },

  bindSearch() {
    const input = Utils.$('.search-input');
    const dropdown = Utils.$('.search-results-dropdown');
    if (!input || !dropdown) return;

    const doSearch = Utils.debounce(() => {
      const query = input.value.trim();
      const results = this.search(query);
      
      if (results.length === 0) {
        dropdown.classList.remove('active');
        return;
      }

      const root = Utils.getRelativeRoot();
      dropdown.innerHTML = results.map(r => `
        <a class="search-result-item" href="${root}${r.url}">
          <div class="result-title">${r.title}</div>
          <div class="result-chapter">${r.chapter}</div>
        </a>
      `).join('');
      dropdown.classList.add('active');
    }, 200);

    input.addEventListener('input', doSearch);
    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) doSearch();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        dropdown.classList.remove('active');
      }
    });

    // Keyboard shortcut: Ctrl+K or / to focus search
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.target.closest('input,textarea'))) {
        e.preventDefault();
        input.focus();
      }
      if (e.key === 'Escape') {
        dropdown.classList.remove('active');
        input.blur();
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => SearchEngine.init());
