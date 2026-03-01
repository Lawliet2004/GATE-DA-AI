/* ============================================================
   INTERACTIVE-DEMOS.JS — Visualization logic for search, games, etc.
   ============================================================ */

/* ====================== SEARCH TREE VISUALIZER ====================== */
const SearchTreeViz = {
  graph: null,
  algorithm: 'bfs',
  frontier: [],
  explored: [],
  currentNode: null,
  goalNode: null,
  stepCount: 0,
  running: false,
  speed: 500,

  init(containerId, graphData) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.graph = graphData;
    this.reset();
    this.render();
  },

  reset() {
    this.frontier = [this.graph.start];
    this.explored = [];
    this.currentNode = null;
    this.stepCount = 0;
    this.running = false;
    this.goalNode = this.graph.goal;
    this.render();
    this.updateInfo();
  },

  setAlgorithm(algo) {
    this.algorithm = algo;
    this.reset();
  },

  step() {
    if (this.frontier.length === 0 || this.currentNode === this.goalNode) return false;

    let node;
    switch (this.algorithm) {
      case 'bfs':
        node = this.frontier.shift(); // FIFO
        break;
      case 'dfs':
        node = this.frontier.pop(); // LIFO
        break;
      case 'ucs':
        this.frontier.sort((a, b) => (this.graph.costs[a] || 0) - (this.graph.costs[b] || 0));
        node = this.frontier.shift();
        break;
      default:
        node = this.frontier.shift();
    }

    if (this.explored.includes(node)) return this.step();
    
    this.currentNode = node;
    this.explored.push(node);
    this.stepCount++;

    if (node === this.goalNode) {
      this.running = false;
      this.render();
      this.updateInfo();
      return false;
    }

    const neighbors = this.graph.adjacency[node] || [];
    neighbors.forEach(n => {
      if (!this.explored.includes(n) && !this.frontier.includes(n)) {
        this.frontier.push(n);
      }
    });

    this.render();
    this.updateInfo();
    return true;
  },

  async run() {
    this.running = true;
    while (this.running && this.step()) {
      await new Promise(r => setTimeout(r, this.speed));
    }
    this.running = false;
  },

  stop() {
    this.running = false;
  },

  render() {
    if (!this.container) return;
    const canvas = this.container.querySelector('.tree-viz') || this.container;
    
    let html = '';
    const positions = this.graph.positions || {};
    
    // Draw edges first
    Object.entries(this.graph.adjacency || {}).forEach(([from, neighbors]) => {
      neighbors.forEach(to => {
        const p1 = positions[from] || { x: 0, y: 0 };
        const p2 = positions[to] || { x: 0, y: 0 };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const active = this.explored.includes(from) && this.explored.includes(to) ? 'active' : '';
        html += `<div class="tree-edge ${active}" style="left:${p1.x+20}px;top:${p1.y+20}px;width:${length}px;transform:rotate(${angle}deg)"></div>`;
      });
    });

    // Draw nodes
    Object.keys(positions).forEach(nodeId => {
      const pos = positions[nodeId];
      let cls = 'tree-node unexplored';
      if (nodeId === this.currentNode && nodeId === this.goalNode) cls = 'tree-node goal-found';
      else if (nodeId === this.currentNode) cls = 'tree-node current';
      else if (this.explored.includes(nodeId)) cls = 'tree-node explored';
      else if (this.frontier.includes(nodeId)) cls = 'tree-node frontier';
      
      html += `<div class="${cls}" style="left:${pos.x}px;top:${pos.y}px">${nodeId}</div>`;
    });

    canvas.innerHTML = html;
  },

  updateInfo() {
    const frontierEl = document.getElementById('search-frontier');
    const exploredEl = document.getElementById('search-explored');
    const stepsEl = document.getElementById('search-steps');
    
    if (frontierEl) frontierEl.textContent = `[${this.frontier.join(', ')}]`;
    if (exploredEl) exploredEl.textContent = `[${this.explored.join(', ')}]`;
    if (stepsEl) stepsEl.textContent = this.stepCount;
  }
};

/* ====================== A* GRID VISUALIZER ====================== */
const AStarGrid = {
  rows: 12,
  cols: 16,
  grid: [],
  start: null,
  goal: null,
  mode: 'wall', // wall, start, goal
  algorithm: 'astar',
  openList: [],
  closedList: [],
  running: false,
  speed: 50,
  path: [],

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.createGrid();
    this.render();
  },

  createGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = { r, c, wall: false, g: Infinity, h: 0, f: Infinity, parent: null, visited: false, inOpen: false, inPath: false };
      }
    }
    this.start = { r: 1, c: 1 };
    this.goal = { r: this.rows - 2, c: this.cols - 2 };
    this.openList = [];
    this.closedList = [];
    this.path = [];
  },

  reset() {
    this.grid.forEach(row => row.forEach(cell => {
      cell.g = Infinity; cell.h = 0; cell.f = Infinity;
      cell.parent = null; cell.visited = false; cell.inOpen = false; cell.inPath = false;
    }));
    this.openList = [];
    this.closedList = [];
    this.path = [];
    this.running = false;
    this.render();
  },

  clearWalls() {
    this.grid.forEach(row => row.forEach(cell => { cell.wall = false; }));
    this.reset();
  },

  randomWalls(density = 0.25) {
    this.grid.forEach(row => row.forEach(cell => {
      cell.wall = Math.random() < density;
    }));
    this.grid[this.start.r][this.start.c].wall = false;
    this.grid[this.goal.r][this.goal.c].wall = false;
    this.reset();
  },

  heuristic(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c); // Manhattan
  },

  getNeighbors(cell) {
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    return dirs.map(([dr, dc]) => {
      const nr = cell.r + dr, nc = cell.c + dc;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && !this.grid[nr][nc].wall) {
        return this.grid[nr][nc];
      }
      return null;
    }).filter(Boolean);
  },

  async run() {
    this.reset();
    this.running = true;
    
    const startCell = this.grid[this.start.r][this.start.c];
    const goalCell = this.grid[this.goal.r][this.goal.c];
    
    startCell.g = 0;
    startCell.h = this.heuristic(startCell, goalCell);
    startCell.f = startCell.h;
    this.openList = [startCell];
    startCell.inOpen = true;

    while (this.running && this.openList.length > 0) {
      // Find node with lowest f
      this.openList.sort((a, b) => a.f - b.f);
      const current = this.openList.shift();
      current.inOpen = false;
      current.visited = true;
      this.closedList.push(current);

      if (current.r === goalCell.r && current.c === goalCell.c) {
        // Reconstruct path
        let node = current;
        while (node) {
          node.inPath = true;
          this.path.unshift(node);
          node = node.parent;
        }
        this.render();
        this.running = false;
        return;
      }

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (neighbor.visited) continue;
        const tentG = current.g + 1;
        if (tentG < neighbor.g) {
          neighbor.parent = current;
          neighbor.g = tentG;
          neighbor.h = this.heuristic(neighbor, goalCell);
          neighbor.f = this.algorithm === 'greedy' ? neighbor.h : neighbor.g + neighbor.h;
          if (!neighbor.inOpen) {
            this.openList.push(neighbor);
            neighbor.inOpen = true;
          }
        }
      }

      this.render();
      await new Promise(r => setTimeout(r, this.speed));
    }
    this.running = false;
  },

  render() {
    if (!this.container) return;
    let html = `<div class="grid-viz" style="grid-template-columns:repeat(${this.cols},1fr)">`;
    
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        let cls = 'grid-cell';
        let content = '';
        
        if (r === this.start.r && c === this.start.c) { cls += ' start'; content = 'S'; }
        else if (r === this.goal.r && c === this.goal.c) { cls += ' goal'; content = 'G'; }
        else if (cell.wall) { cls += ' wall'; }
        else if (cell.inPath) { cls += ' path'; }
        else if (cell.visited) { cls += ' explored'; }
        else if (cell.inOpen) { cls += ' frontier'; }

        if (!cell.wall && cell.g !== Infinity && !(r === this.start.r && c === this.start.c)) {
          content = `<div class="cell-values">g:${cell.g}<br>h:${cell.h}<br>f:${cell.f}</div>`;
        }

        html += `<div class="${cls}" data-r="${r}" data-c="${c}" onclick="AStarGrid.cellClick(${r},${c})">${content}</div>`;
      }
    }
    html += '</div>';
    this.container.innerHTML = html;
  },

  cellClick(r, c) {
    if (this.running) return;
    if (this.mode === 'start') { this.start = { r, c }; this.grid[r][c].wall = false; }
    else if (this.mode === 'goal') { this.goal = { r, c }; this.grid[r][c].wall = false; }
    else {
      if ((r === this.start.r && c === this.start.c) || (r === this.goal.r && c === this.goal.c)) return;
      this.grid[r][c].wall = !this.grid[r][c].wall;
    }
    this.reset();
  }
};

/* ====================== MINIMAX TIC-TAC-TOE ====================== */
const TicTacToe = {
  board: Array(9).fill(null),
  humanPlayer: 'X',
  aiPlayer: 'O',
  currentPlayer: 'X',
  gameOver: false,
  alphaBeta: true,
  nodesEvaluated: 0,

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.reset();
    this.render();
  },

  reset() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.nodesEvaluated = 0;
    this.render();
  },

  makeMove(index) {
    if (this.board[index] || this.gameOver || this.currentPlayer !== this.humanPlayer) return;
    
    this.board[index] = this.humanPlayer;
    if (this.checkWin(this.humanPlayer)) {
      this.gameOver = true;
      this.render();
      this.showMessage('You win! 🎉');
      return;
    }
    if (this.board.every(c => c !== null)) {
      this.gameOver = true;
      this.render();
      this.showMessage("It's a draw!");
      return;
    }
    
    this.currentPlayer = this.aiPlayer;
    this.render();
    
    setTimeout(() => this.aiMove(), 300);
  },

  aiMove() {
    this.nodesEvaluated = 0;
    const bestMove = this.findBestMove();
    this.board[bestMove] = this.aiPlayer;
    
    if (this.checkWin(this.aiPlayer)) {
      this.gameOver = true;
      this.render();
      this.showMessage('AI wins!');
      return;
    }
    if (this.board.every(c => c !== null)) {
      this.gameOver = true;
      this.render();
      this.showMessage("It's a draw!");
      return;
    }
    
    this.currentPlayer = this.humanPlayer;
    this.render();
  },

  findBestMove() {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = this.aiPlayer;
        const score = this.alphaBeta ? 
          this.minimaxAB(0, false, -Infinity, Infinity) :
          this.minimax(0, false);
        this.board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  },

  minimax(depth, isMaximizing) {
    this.nodesEvaluated++;
    if (this.checkWin(this.aiPlayer)) return 10 - depth;
    if (this.checkWin(this.humanPlayer)) return depth - 10;
    if (this.board.every(c => c !== null)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === null) {
          this.board[i] = this.aiPlayer;
          best = Math.max(best, this.minimax(depth + 1, false));
          this.board[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === null) {
          this.board[i] = this.humanPlayer;
          best = Math.min(best, this.minimax(depth + 1, true));
          this.board[i] = null;
        }
      }
      return best;
    }
  },

  minimaxAB(depth, isMaximizing, alpha, beta) {
    this.nodesEvaluated++;
    if (this.checkWin(this.aiPlayer)) return 10 - depth;
    if (this.checkWin(this.humanPlayer)) return depth - 10;
    if (this.board.every(c => c !== null)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === null) {
          this.board[i] = this.aiPlayer;
          best = Math.max(best, this.minimaxAB(depth + 1, false, alpha, beta));
          this.board[i] = null;
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (this.board[i] === null) {
          this.board[i] = this.humanPlayer;
          best = Math.min(best, this.minimaxAB(depth + 1, true, alpha, beta));
          this.board[i] = null;
          beta = Math.min(beta, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    }
  },

  checkWin(player) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(([a,b,c]) => this.board[a] === player && this.board[b] === player && this.board[c] === player);
  },

  showMessage(msg) {
    const el = document.getElementById('ttt-message');
    if (el) el.textContent = msg;
  },

  render() {
    if (!this.container) return;
    let html = '<div class="ttt-board">';
    this.board.forEach((cell, i) => {
      const cls = cell ? (cell === 'X' ? 'x' : 'o') : '';
      html += `<div class="ttt-cell ${cls}" onclick="TicTacToe.makeMove(${i})" role="button" tabindex="0" aria-label="Cell ${i+1}">${cell || ''}</div>`;
    });
    html += '</div>';
    
    const infoEl = document.getElementById('ttt-info');
    if (infoEl) {
      infoEl.innerHTML = `<div class="info-panel">
        <div class="info-row"><span class="info-label">Current Player</span><span class="info-value">${this.gameOver ? 'Game Over' : this.currentPlayer}</span></div>
        <div class="info-row"><span class="info-label">Algorithm</span><span class="info-value">${this.alphaBeta ? 'Minimax + α-β' : 'Minimax'}</span></div>
        <div class="info-row"><span class="info-label">Nodes Evaluated</span><span class="info-value">${this.nodesEvaluated}</span></div>
      </div>`;
    }

    const boardEl = this.container.querySelector('.ttt-board-container') || this.container;
    boardEl.innerHTML = html;
  }
};

/* ====================== TRUTH TABLE GENERATOR ====================== */
const TruthTableGen = {
  init(containerId) {
    this.container = document.getElementById(containerId);
  },

  generate(formula) {
    // Extract variables (single uppercase letters)
    const vars = [...new Set(formula.match(/[A-Z]/g) || [])].sort();
    if (vars.length === 0) return;

    const rows = Math.pow(2, vars.length);
    let html = '<table class="comparison-table"><thead><tr>';
    vars.forEach(v => { html += `<th>${v}</th>`; });
    html += `<th>${formula}</th></tr></thead><tbody>`;

    for (let i = 0; i < rows; i++) {
      html += '<tr>';
      const vals = {};
      vars.forEach((v, j) => {
        const val = Boolean((i >> (vars.length - 1 - j)) & 1);
        vals[v] = val;
        html += `<td>${val ? 'T' : 'F'}</td>`;
      });

      try {
        const result = this.evaluate(formula, vals);
        html += `<td><strong>${result ? 'T' : 'F'}</strong></td>`;
      } catch (e) {
        html += '<td>Error</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    
    if (this.container) this.container.innerHTML = html;
    return html;
  },

  evaluate(formula, vals) {
    let expr = formula;
    // Replace variables with values
    Object.entries(vals).forEach(([k, v]) => {
      expr = expr.replace(new RegExp(k, 'g'), v ? '1' : '0');
    });
    // Replace logical operators
    expr = expr.replace(/↔|<->|≡/g, '===');
    expr = expr.replace(/→|->|⊃/g, '<=');  // p→q is ¬p∨q, same as p<=q for {0,1}
    expr = expr.replace(/∧|&&|&|\bAND\b/gi, '&&');
    expr = expr.replace(/∨|\|\||\||\bOR\b/gi, '||');
    expr = expr.replace(/¬|~|!\b|\bNOT\b/gi, '!');
    
    // Handle implication properly: convert <= back
    expr = expr.replace(/(\d)\s*<=\s*(\d)/g, '(!$1 || $2)');
    expr = expr.replace(/===>/g, '<=');
    
    // Evaluate
    const result = new Function(`return Boolean(${expr})`)();
    return result;
  }
};

/* ====================== Q-LEARNING GRID WORLD ====================== */
const QLearning = {
  rows: 5,
  cols: 5,
  qTable: {},
  episodes: 0,
  alpha: 0.1,
  gamma: 0.9,
  epsilon: 0.3,
  goalPos: { r: 0, c: 4 },
  agentPos: { r: 4, c: 0 },
  walls: [],
  rewards: {},
  running: false,
  speed: 100,

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.reset();
    this.render();
  },

  reset() {
    this.qTable = {};
    this.episodes = 0;
    this.agentPos = { r: 4, c: 0 };
    this.walls = [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 3, c: 3 }];
    this.rewards = {};
    this.rewards[`${this.goalPos.r},${this.goalPos.c}`] = 10;
    this.rewards[`2,3`] = -5; // penalty
    this.running = false;
    this.render();
  },

  getState(pos) { return `${pos.r},${pos.c}`; },
  
  getActions() { return ['up', 'down', 'left', 'right']; },

  getQ(state, action) {
    const key = `${state}:${action}`;
    return this.qTable[key] || 0;
  },

  setQ(state, action, value) {
    this.qTable[`${state}:${action}`] = value;
  },

  getNextPos(pos, action) {
    let nr = pos.r, nc = pos.c;
    switch (action) {
      case 'up': nr--; break;
      case 'down': nr++; break;
      case 'left': nc--; break;
      case 'right': nc++; break;
    }
    if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) return pos;
    if (this.walls.some(w => w.r === nr && w.c === nc)) return pos;
    return { r: nr, c: nc };
  },

  chooseAction(state) {
    if (Math.random() < this.epsilon) {
      const actions = this.getActions();
      return actions[Math.floor(Math.random() * actions.length)];
    }
    const actions = this.getActions();
    let bestAction = actions[0];
    let bestQ = this.getQ(state, bestAction);
    actions.forEach(a => {
      const q = this.getQ(state, a);
      if (q > bestQ) { bestQ = q; bestAction = a; }
    });
    return bestAction;
  },

  async runEpisode() {
    this.agentPos = { r: 4, c: 0 };
    let steps = 0;
    const maxSteps = 100;

    while (steps < maxSteps) {
      const state = this.getState(this.agentPos);
      const action = this.chooseAction(state);
      const newPos = this.getNextPos(this.agentPos, action);
      const newState = this.getState(newPos);
      const reward = this.rewards[newState] || -0.1;

      // Q-learning update
      const maxNextQ = Math.max(...this.getActions().map(a => this.getQ(newState, a)));
      const oldQ = this.getQ(state, action);
      const newQ = oldQ + this.alpha * (reward + this.gamma * maxNextQ - oldQ);
      this.setQ(state, action, Math.round(newQ * 100) / 100);

      this.agentPos = newPos;
      steps++;

      if (newPos.r === this.goalPos.r && newPos.c === this.goalPos.c) break;

      if (this.running && this.speed > 10) {
        this.render();
        await new Promise(r => setTimeout(r, this.speed));
      }
    }

    this.episodes++;
    this.render();
  },

  async runMultiple(n) {
    this.running = true;
    for (let i = 0; i < n && this.running; i++) {
      await this.runEpisode();
    }
    this.running = false;
  },

  stop() { this.running = false; },

  render() {
    if (!this.container) return;
    let html = `<div class="grid-viz" style="grid-template-columns:repeat(${this.cols},1fr)">`;
    
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let cls = 'grid-cell';
        let content = '';
        
        if (r === this.agentPos.r && c === this.agentPos.c) { cls += ' frontier'; content = '🤖'; }
        else if (r === this.goalPos.r && c === this.goalPos.c) { cls += ' goal'; content = '⭐'; }
        else if (this.walls.some(w => w.r === r && w.c === c)) { cls += ' wall'; }
        else if (this.rewards[`${r},${c}`] === -5) { cls += ' explored'; content = '⚡'; }
        
        // Show best action arrow
        if (!this.walls.some(w => w.r === r && w.c === c)) {
          const state = `${r},${c}`;
          const actions = this.getActions();
          let bestAction = null, bestQ = -Infinity;
          actions.forEach(a => {
            const q = this.getQ(state, a);
            if (q > bestQ) { bestQ = q; bestAction = a; }
          });
          if (bestQ > 0 && !content) {
            const arrows = { up: '↑', down: '↓', left: '←', right: '→' };
            content = `<div class="cell-values">${arrows[bestAction] || ''}<br>${bestQ.toFixed(1)}</div>`;
          }
        }
        
        html += `<div class="${cls}">${content}</div>`;
      }
    }
    html += '</div>';

    const infoEl = document.getElementById('ql-info');
    if (infoEl) {
      infoEl.innerHTML = `<div class="info-panel">
        <div class="info-row"><span class="info-label">Episodes</span><span class="info-value">${this.episodes}</span></div>
        <div class="info-row"><span class="info-label">α (learning rate)</span><span class="info-value">${this.alpha}</span></div>
        <div class="info-row"><span class="info-label">γ (discount)</span><span class="info-value">${this.gamma}</span></div>
        <div class="info-row"><span class="info-label">ε (exploration)</span><span class="info-value">${this.epsilon}</span></div>
      </div>`;
    }

    const gridEl = this.container.querySelector('.ql-grid') || this.container;
    gridEl.innerHTML = html;
  }
};

/* ====================== PERCEPTRON DEMO ====================== */
const PerceptronDemo = {
  w1: 0.5,
  w2: 0.5,
  bias: -0.5,
  learningRate: 0.1,
  data: [],
  canvasSize: 300,

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.generateData();
    this.render();
  },

  generateData() {
    this.data = [];
    // AND gate data
    this.data.push({ x1: 0, x2: 0, label: 0 });
    this.data.push({ x1: 0, x2: 1, label: 0 });
    this.data.push({ x1: 1, x2: 0, label: 0 });
    this.data.push({ x1: 1, x2: 1, label: 1 });
  },

  predict(x1, x2) {
    const sum = x1 * this.w1 + x2 * this.w2 + this.bias;
    return sum >= 0 ? 1 : 0;
  },

  train() {
    let errors = 0;
    this.data.forEach(d => {
      const pred = this.predict(d.x1, d.x2);
      const error = d.label - pred;
      if (error !== 0) {
        this.w1 += this.learningRate * error * d.x1;
        this.w2 += this.learningRate * error * d.x2;
        this.bias += this.learningRate * error;
        errors++;
      }
    });
    this.w1 = Math.round(this.w1 * 1000) / 1000;
    this.w2 = Math.round(this.w2 * 1000) / 1000;
    this.bias = Math.round(this.bias * 1000) / 1000;
    this.render();
    return errors;
  },

  trainUntilConverge() {
    let maxIter = 100;
    while (maxIter-- > 0) {
      if (this.train() === 0) break;
    }
  },

  render() {
    if (!this.container) return;
    const canvas = this.container.querySelector('canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = this.canvasSize;
    const pad = 30;

    ctx.clearRect(0, 0, s, s);
    
    // Draw decision boundary region
    for (let px = 0; px < s; px += 3) {
      for (let py = 0; py < s; py += 3) {
        const x1 = (px - pad) / (s - 2*pad);
        const x2 = 1 - (py - pad) / (s - 2*pad);
        if (x1 >= -0.1 && x1 <= 1.1 && x2 >= -0.1 && x2 <= 1.1) {
          const pred = this.predict(x1, x2);
          ctx.fillStyle = pred === 1 ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.1)';
          ctx.fillRect(px, py, 3, 3);
        }
      }
    }

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, s - pad);
    ctx.lineTo(s - pad, s - pad);
    ctx.stroke();

    // Draw decision boundary line
    if (this.w2 !== 0 || this.w1 !== 0) {
      ctx.strokeStyle = '#2980b9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const toCanvasX = (x) => pad + x * (s - 2*pad);
      const toCanvasY = (y) => s - pad - y * (s - 2*pad);
      
      if (Math.abs(this.w2) > 0.001) {
        const x2_at_x1_0 = -this.bias / this.w2;
        const x2_at_x1_1 = -(this.w1 + this.bias) / this.w2;
        ctx.moveTo(toCanvasX(0), toCanvasY(x2_at_x1_0));
        ctx.lineTo(toCanvasX(1), toCanvasY(x2_at_x1_1));
      } else if (Math.abs(this.w1) > 0.001) {
        const x1_val = -this.bias / this.w1;
        ctx.moveTo(toCanvasX(x1_val), toCanvasY(0));
        ctx.lineTo(toCanvasX(x1_val), toCanvasY(1));
      }
      ctx.stroke();
    }

    // Draw data points
    this.data.forEach(d => {
      const cx = pad + d.x1 * (s - 2*pad);
      const cy = s - pad - d.x2 * (s - 2*pad);
      const pred = this.predict(d.x1, d.x2);
      
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
      ctx.fillStyle = d.label === 1 ? '#27ae60' : '#e74c3c';
      ctx.fill();
      ctx.strokeStyle = pred === d.label ? '#333' : '#f1c40f';
      ctx.lineWidth = pred === d.label ? 2 : 3;
      ctx.stroke();
    });

    // Update weight display
    const wEl = document.getElementById('perceptron-weights');
    if (wEl) {
      wEl.innerHTML = `w₁=${this.w1}, w₂=${this.w2}, bias=${this.bias}`;
    }
  }
};
