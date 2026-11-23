/* Visualisers for local search, CSPs and game trees. They register into
   window.EXTRA_WIDGETS, which ui.js merges into its widget table. */
(function () {
  var W = window.EXTRA_WIDGETS = {};

  /* Title-band plates, drawn in the same line style as the rest of the guide. */
  var landPlate = (function () {
    var pts = [], w = 500;
    for (var i = 0; i <= 50; i++) { var x = i / 50; pts.push([20 + x * (w - 40), 190 - 40 * Math.exp(-Math.pow((x - .15) / .08, 2)) - 120 * Math.exp(-Math.pow((x - .72) / .1, 2)) - 70 * Math.exp(-Math.pow((x - .42) / .07, 2))]); }
    return '<svg class="ill" viewBox="0 0 520 220" role="img" aria-label="A state-space landscape"><g class="d"><path style="--i:0" d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + '"/><path class="t" style="--i:1" d="M20 196 H500"/></g>' +
      '<g class="f"><circle class="fo" cx="89" cy="152" r="7"/><text class="s" x="89" y="132" text-anchor="middle">local max</text><text class="s ox" x="352" y="56" text-anchor="middle">global max</text><text class="s" x="214" y="105" text-anchor="middle">local max</text><text class="s" x="260" y="214" text-anchor="middle">state</text></g></svg>';
  })();
  var auPos = { WA: [70, 115], NT: [170, 50], SA: [190, 140], Q: [290, 60], NSW: [310, 150], V: [250, 200], T: [330, 210] };
  var auCol = { WA: 'B', NT: 'G', SA: 'R', Q: 'B', NSW: 'G', V: 'B', T: 'R' };
  var auE = [['WA', 'NT'], ['WA', 'SA'], ['NT', 'SA'], ['NT', 'Q'], ['SA', 'Q'], ['SA', 'NSW'], ['SA', 'V'], ['Q', 'NSW'], ['NSW', 'V']];
  var cspPlate = '<svg class="ill" viewBox="0 0 380 240" role="img" aria-label="The map of Australia as a constraint graph"><g class="d">' + auE.map(function (e, i) { var a = auPos[e[0]], b = auPos[e[1]]; return '<path style="--i:' + i + '" d="M' + a[0] + ' ' + a[1] + ' L' + b[0] + ' ' + b[1] + '"/>'; }).join('') + '</g><g class="f">' +
    Object.keys(auPos).map(function (v) { var p = auPos[v]; return '<circle class="pc c' + auCol[v] + '" cx="' + p[0] + '" cy="' + p[1] + '" r="21"/><text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" class="pl">' + v + '</text>'; }).join('') + '</g></svg>';
  var gamePlate = (function () {
    var o = '<svg class="ill" viewBox="0 0 520 215" role="img" aria-label="A small game tree"><g class="d">', i = 0, L = [[3, 12, 8], [2, 4, 6], [14, 5, 2]];
    L.forEach(function (g, a) { var mx = 100 + a * 160; o += '<path style="--i:' + (i++) + '" d="M260 56 L' + mx + ' 92"/>'; g.forEach(function (v, b) { o += '<path class="t' + (a === 1 && b > 0 ? ' o' : '') + '" style="--i:' + (i++) + '" d="M' + mx + ' 124 L' + (mx - 45 + b * 45) + ' 172"/>'; }); });
    o += '</g><g class="f"><path class="tri" d="M260 20 L281 56 L239 56Z"/><text x="260" y="50" text-anchor="middle" class="pl">3</text>';
    L.forEach(function (g, a) { var mx = 100 + a * 160, mv = Math.min.apply(null, g); o += '<path class="tri" d="M' + mx + ' 126 L' + (mx + 20) + ' 92 L' + (mx - 20) + ' 92Z"/><text x="' + mx + '" y="108" text-anchor="middle" class="pl">' + mv + '</text>'; g.forEach(function (v, b) { var x = mx - 45 + b * 45; o += '<rect class="lf' + (a === 1 && b > 0 ? ' pr' : '') + '" x="' + (x - 14) + '" y="172" width="28" height="28" rx="2"/><text x="' + x + '" y="191" text-anchor="middle" class="pl">' + v + '</text>'; }); });
    return o + '<text class="s ox" x="500" y="30" text-anchor="end">pruned: 4, 6</text></g></svg>';
  })();
  window.EXTRA_PLATES = {
    local: [landPlate, 'A landscape of states. Height is the score; local search only feels the ground next to it.'],
    hill: [landPlate, 'Hill climbing stops on the first peak it reaches, which is not always the highest.'],
    anneal: [landPlate, 'Accepting a few downhill steps early lets annealing leave the small hills.'],
    csp: [cspPlate, 'Deck 05, slide 10. Variables are nodes, constraints are edges; Tasmania stands alone.'],
    backtrack: [cspPlate, 'One variable per level, skip clashing values, back up at a dead end.'],
    filtering: [cspPlate, 'Cross values off neighbours&rsquo; domains to find dead ends early.'],
    ordering: [cspPlate, 'MRV starts at SA, the region with the most neighbours.'],
    games: [gamePlate, 'MAX moves at the top, MIN below. Values flow up from the leaves.'],
    minimax: [gamePlate, 'The textbook tree: MIN values 3, 2, 2, so MAX plays the left move for 3.'],
    alphabeta: [gamePlate, 'Once B shows a 2, MAX already prefers A&rsquo;s 3: the 4 and 6 are never looked at.']
  };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var ICON = {
    reset: '<svg viewBox="0 0 24 24"><path d="M4 4v6h6"/><path d="M4.5 15a8 8 0 1 0 2-8.5L4 10"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'
  };
  function seg(name, label, opts, val) {
    return '<div class="seg" data-seg="' + name + '" role="group" aria-label="' + label + '">' + opts.map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (o[0] === val) + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  function fmt(x) { return x === null || x === undefined ? '' : x === Infinity ? '+&infin;' : x === -Infinity ? '&minus;&infin;' : String(x); }

  /* A step-through frame shared by the game-tree and CSP visualisers. */
  function Stepper(el, o) {
    var self = this; this.el = el; this.o = o; this.i = 0; this.timer = null;
    el.classList.add('sim', 'xsim');
    el.innerHTML = '<div class="sim-top">' + o.top + '</div>' +
      '<div class="ctrl"><button class="btn" type="button" data-c="reset">' + ICON.reset + 'Restart</button><button class="btn" type="button" data-c="prev">' + ICON.prev + 'Back</button><button class="btn pri" type="button" data-c="next">Next' + ICON.next + '</button><button class="btn" type="button" data-c="play">Play</button><input type="range" min="0" value="0" data-c="range" aria-label="Step"><span class="cnt" data-c="cnt"></span></div>' +
      '<div class="sim-body"><div class="viz"><div class="canvas" data-c="canvas"></div><div class="legend">' + (o.legend || '') + '</div></div><div class="side" data-c="side"></div></div>';
    this.c = {}; $$('[data-c]', el).forEach(function (x) { self.c[x.dataset.c] = x; });
    $$('[data-seg]', el).forEach(function (s) {
      s.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; $$('button', s).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); o.opt[s.dataset.seg] = b.dataset.v; self.run(); });
    });
    $$('select[data-sel]', el).forEach(function (s) { s.addEventListener('change', function () { o.opt[s.dataset.sel] = s.value; self.run(); }); });
    this.c.next.addEventListener('click', function () { self.stop(); self.go(self.i + 1); });
    this.c.prev.addEventListener('click', function () { self.stop(); self.go(self.i - 1); });
    this.c.reset.addEventListener('click', function () { self.stop(); self.go(0); });
    this.c.play.addEventListener('click', function () { if (self.timer) self.stop(); else self.play(); });
    this.c.range.addEventListener('input', function () { self.stop(); self.go(+this.value); });
    el.tabIndex = -1;
    el.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); self.c.next.click(); } if (e.key === 'ArrowLeft') { e.preventDefault(); self.c.prev.click(); } });
    this.run();
  }
  Stepper.prototype.run = function () { this.stop(); this.R = this.o.compute(this.o.opt); this.c.range.max = this.R.steps.length - 1; this.go(0); };
  Stepper.prototype.go = function (i) {
    var n = this.R.steps.length; this.i = Math.max(0, Math.min(n - 1, i));
    var s = this.R.steps[this.i];
    this.c.canvas.innerHTML = this.o.draw(this.R, s, this.i);
    this.c.side.innerHTML = this.o.side(this.R, s, this.i);
    this.c.range.value = this.i; this.c.cnt.textContent = 'step ' + this.i + ' / ' + (n - 1);
    this.c.prev.disabled = this.i === 0; this.c.next.disabled = this.i >= n - 1;
    var say = $('.say', this.c.side); if (say) { say.classList.remove('flash'); void say.offsetWidth; say.classList.add('flash'); }
  };
  Stepper.prototype.play = function () {
    var self = this; this.c.play.textContent = 'Pause';
    this.timer = setInterval(function () { if (self.i >= self.R.steps.length - 1) self.stop(); else self.go(self.i + 1); }, 900);
  };
  Stepper.prototype.stop = function () { if (this.timer) clearInterval(this.timer); this.timer = null; if (this.c) this.c.play.textContent = 'Play'; };

  /* ---------------- game trees: minimax and alpha-beta ---------------- */
  var KIND_NAME = { enter: 'ENTER', leaf: 'LEAF', update: 'UPDATE', prune: 'PRUNE', 'return': 'RETURN', done: 'ANSWER' };
  function drawGame(R, s, mode) {
    var N = R.nodes, leaves = N.filter(function (n) { return n.leaf; }), depth = Math.max.apply(null, N.map(function (n) { return n.depth; }));
    var gap = mode === 'ab' ? 58 : 48, Wd = Math.max(560, 60 + (leaves.length - 1) * gap), H = 70 + depth * 112 + 40;
    var X = {}, Y = {};
    leaves.forEach(function (n, i) { X[n.id] = 30 + i * (Wd - 60) / Math.max(1, leaves.length - 1); });
    for (var d = depth; d >= 0; d--) N.forEach(function (n) { if (n.depth === d && !n.leaf) X[n.id] = n.kids.reduce(function (a, k) { return a + X[k]; }, 0) / n.kids.length; });
    N.forEach(function (n) { Y[n.id] = 60 + n.depth * 112; });
    var o = '<svg class="gtree" viewBox="0 0 ' + Wd + ' ' + H + '" style="min-width:' + Math.min(Wd, 900) + 'px" role="img" aria-label="Game tree">';
    N.forEach(function (n) {
      n.kids.forEach(function (k) {
        var cut = s.cut[k], seen = s.st[k].s !== 'idle' && s.st[k].s !== 'pruned';
        o += '<line class="gedge' + (cut ? ' cut' : seen ? ' seen' : '') + '" x1="' + X[n.id] + '" y1="' + (Y[n.id] + 16) + '" x2="' + X[k] + '" y2="' + (Y[k] - 16) + '"/>';
        if (cut) { var mx = (X[n.id] + X[k]) / 2, my = (Y[n.id] + Y[k]) / 2; o += '<path class="gx" d="M' + (mx - 7) + ' ' + (my - 7) + 'l14 14M' + (mx + 7) + ' ' + (my - 7) + 'l-14 14"/>'; }
      });
    });
    N.forEach(function (n) {
      var t = s.st[n.id], x = X[n.id], y = Y[n.id], cls = 'gnode ' + n.kind + ' ' + t.s + (s.cur === n.id ? ' cur' : '');
      o += '<g class="' + cls + '">';
      if (n.leaf) o += '<rect x="' + (x - 16) + '" y="' + (y - 16) + '" width="32" height="32" rx="3"/><text x="' + x + '" y="' + (y + 1) + '">' + n.value + '</text>';
      else {
        o += n.kind === 'max' ? '<path d="M' + x + ' ' + (y - 19) + 'L' + (x + 21) + ' ' + (y + 16) + 'L' + (x - 21) + ' ' + (y + 16) + 'Z"/>' : '<path d="M' + x + ' ' + (y + 19) + 'L' + (x + 21) + ' ' + (y - 16) + 'L' + (x - 21) + ' ' + (y - 16) + 'Z"/>';
        o += '<text x="' + x + '" y="' + (y + (n.kind === 'max' ? 6 : -4)) + '">' + (t.v === null || !isFinite(t.v) ? '' : t.v) + '</text>';
        // the teacher's box: v, alpha, beta
        var bw = mode === 'ab' ? 3 : 1, cw = 26, bx = x - (bw * cw) / 2, by = y - 50;
        if (t.s !== 'idle' && t.s !== 'pruned') {
          o += '<g class="vbox">';
          var cells = mode === 'ab' ? [t.v, t.a, t.b] : [t.v];
          cells.forEach(function (c, i) { o += '<rect x="' + (bx + i * cw) + '" y="' + by + '" width="' + cw + '" height="18"/><text x="' + (bx + i * cw + cw / 2) + '" y="' + (by + 10) + '">' + fmt(c) + '</text>'; });
          o += '</g>';
        }
        o += '<text class="glabel" x="' + (x + 26) + '" y="' + (y + 4) + '">' + n.label + '</text>';
      }
      o += '</g>';
    });
    return o + '</svg>';
  }
  W.gametree = function (el) {
    var opt = { tree: el.dataset.tree || 'deck', mode: el.dataset.mode || 'ab' };
    var trees = (el.dataset.trees || 'deck,practice,aima').split(',');
    new Stepper(el, {
      opt: opt,
      top: seg('mode', 'Algorithm', [['mm', 'Minimax'], ['ab', 'Alpha-beta']], opt.mode) +
        '<label class="f">TREE <select data-sel="tree" aria-label="Tree">' + trees.map(function (t) { return '<option value="' + t + '"' + (t === opt.tree ? ' selected' : '') + '>' + GAMES[t].name + '</option>'; }).join('') + '</select></label>',
      legend: '<span><i class="lg-max"></i>MAX node</span><span><i class="lg-min"></i>MIN node</span><span><i style="border-color:var(--W);background:var(--Wbg)"></i>working on it</span><span><i style="border-color:var(--A);background:var(--Abg)"></i>finished</span><span><i style="border-color:var(--R);border-style:dashed"></i>pruned</span>',
      compute: function (o) { return gameRun(GAMES[o.tree].tree, o.mode); },
      draw: function (R, s) { return drawGame(R, s, opt.mode); },
      side: function (R, s, i) {
        var c = s.cur !== null ? s.st[s.cur] : null, n = s.cur !== null ? R.nodes[s.cur] : null;
        var regs = '<div class="regs"><div class="reg"><span>Node</span><b>' + (n ? (n.leaf ? 'leaf' : n.kind.toUpperCase() + ' ' + n.label) : '-') + '</b></div><div class="reg"><span>v</span><b>' + (c ? fmt(c.v) || '-' : '-') + '</b></div>' +
          (opt.mode === 'ab' ? '<div class="reg"><span>&alpha; (best for MAX)</span><b>' + (c && !n.leaf ? fmt(c.a) : '-') + '</b></div><div class="reg"><span>&beta; (best for MIN)</span><b>' + (c && !n.leaf ? fmt(c.b) : '-') + '</b></div>' : '') + '</div>';
        var cls = s.kind === 'done' ? ' goal' : s.kind === 'prune' ? ' bad' : '';
        var ans = s.done ? '<div class="readbox"><b class="k">EXAM ANSWER</b><p>Root value <b>' + R.value + '</b>; best move <b>' + R.best + '</b>.' + (opt.mode === 'ab' ? ' Pruned leaves: ' + (R.pruned.length ? R.pruned.join(', ') : 'none') + '.' : '') + '</p></div>' : '';
        return '<div class="say' + cls + '"><span class="kind">STEP ' + i + ' &middot; ' + KIND_NAME[s.kind] + '</span><p>' + s.text + '</p>' + ans + '</div>' + regs +
          '<p class="xnote">' + (opt.mode === 'ab' ? 'Each box reads <b>v | &alpha; | &beta;</b>, the same as the boxes on the deck slides.' : 'Each box holds the node&rsquo;s value v so far.') + '</p>';
      }
    });
  };

  /* ---------------- CSP: map colouring ---------------- */
  var CNAME = { R: 'red', G: 'green', B: 'blue' };
  var ORDERS = { tricky: ['NSW', 'WA', 'Q', 'V', 'SA', 'NT', 'T'], plain: ['WA', 'NT', 'Q', 'NSW', 'V', 'SA', 'T'] };
  function drawCSP(P, s) {
    var o = '<svg class="cspg" viewBox="0 0 380 340" role="img" aria-label="Constraint graph">';
    P.edges.forEach(function (e) { var a = P.pos[e[0]], b = P.pos[e[1]]; o += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>'; });
    P.vars.forEach(function (v) {
      var p = P.pos[v], val = s.A[v], cls = 'cv' + (val ? ' c' + val : '') + (s.cur === v ? ' cur' : '') + (s.wipe === v ? ' wipe' : '');
      o += '<g class="' + cls + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="27"/><text x="' + p[0] + '" y="' + (p[1] + 1) + '">' + v + '</text></g>';
    });
    return o + '</svg>';
  }
  W.csp = function (el) {
    var P = CSPS.aus, opt = { filter: el.dataset.filter || 'none', varOrder: el.dataset.var || 'fixed', valOrder: el.dataset.val || 'fixed', order: 'tricky' };
    new Stepper(el, {
      opt: opt,
      top: seg('filter', 'Filtering', [['none', 'Backtracking only'], ['fc', 'Forward checking'], ['ac3', 'Arc consistency']], opt.filter) +
        seg('varOrder', 'Variable order', [['fixed', 'Fixed order'], ['mrv', 'MRV']], opt.varOrder) +
        seg('valOrder', 'Value order', [['fixed', 'R, G, B'], ['lcv', 'LCV']], opt.valOrder) +
        '<label class="f">ORDER <select data-sel="order" aria-label="Fixed variable order"><option value="tricky">NSW, WA, Q, V, SA, NT, T</option><option value="plain">WA, NT, Q, NSW, V, SA, T</option></select></label>',
      legend: '<span><i style="background:var(--cR);border-color:var(--cR)"></i>red</span><span><i style="background:var(--cG);border-color:var(--cG)"></i>green</span><span><i style="background:var(--cB);border-color:var(--cB)"></i>blue</span><span><i style="border-color:var(--hl)"></i>variable being decided</span><span><i style="border-color:var(--R);border-style:dashed"></i>domain wiped out</span>',
      compute: function (o) { return cspRun(P, { filter: o.filter, varOrder: o.varOrder, valOrder: o.valOrder, order: ORDERS[o.order] }); },
      draw: function (R, s) { return drawCSP(P, s); },
      side: function (R, s, i) {
        var rows = P.vars.map(function (v) {
          return '<tr class="' + (s.cur === v ? 'cur' : '') + (s.wipe === v ? ' wipe' : '') + '"><th>' + v + '</th>' + P.vals.map(function (c) {
            var inD = s.D[v].indexOf(c) >= 0, asg = s.A[v] === c;
            return '<td class="' + (asg ? 'asg c' + c : inD ? 'c' + c + ' live' : 'gone') + '">' + c + '</td>';
          }).join('') + '<td class="dv">' + (s.A[v] ? '= ' + CNAME[s.A[v]] : '') + '</td></tr>';
        }).join('');
        var cls = s.kind === 'done' ? ' goal' : (s.kind === 'wipe' || s.kind === 'back' || s.kind === 'fail') ? ' bad' : '';
        return '<div class="say' + cls + '"><span class="kind">STEP ' + i + ' &middot; ' + s.kind.toUpperCase() + '</span><p>' + s.text + '</p></div>' +
          '<div><div class="panel-h"><span>Domains (crossed out = removed)</span><b>' + R.fails + ' dead ends in total</b></div><div class="scroll"><table class="dtab"><tbody>' + rows + '</tbody></table></div></div>';
      }
    });
  };

  /* ---------------- 8-queens: the heuristic and hill climbing ---------------- */
  W.queens = function (el) {
    var b = (el.dataset.board || '4,5,6,3,4,5,6,5').split(',').map(Number), moves = 0, msg = '';
    el.classList.add('qwrap');
    function rnd() { return b.map(function () { return Math.floor(Math.random() * 8); }); }
    function best() {
      var nb = queensNeighbours(b), m = Infinity, at = null;
      nb.forEach(function (col, c) { col.forEach(function (h, r) { if (h !== null && h < m) { m = h; at = [c, r]; } }); });
      return { h: m, at: at, nb: nb };
    }
    function render() {
      var h = queensH(b), B = best(), cells = '';
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
        var q = b[c] === r, v = B.nb[c][r];
        cells += '<button type="button" class="sq' + ((r + c) % 2 ? ' dk' : '') + (q ? ' q' : '') + (!q && v === B.h ? ' min' : '') + '" data-c="' + c + '" data-r="' + r + '" aria-label="Column ' + (c + 1) + ' row ' + (r + 1) + (q ? ', queen' : ', h ' + v) + '">' + (q ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16l1-10-5 4-4-7-4 7-5-4z"/><path d="M5 21h14"/></svg>' : v) + '</button>';
      }
      var state = h === 0 ? 'Solved: no queen attacks another.' : B.h < h ? 'Best neighbour has h = ' + B.h + ' (highlighted). Hill climbing would move there.' : B.h === h ? 'No neighbour is better, but some are equal: a <b>plateau</b>. Plain hill climbing stops here; sideways moves could continue.' : 'Every neighbour is worse: a <b>local minimum</b> of h. Hill climbing is stuck. Try a random restart.';
      el.innerHTML = '<div class="qboard" role="grid" aria-label="8-queens board">' + cells + '</div><div class="qside"><div class="regs"><div class="reg"><span>h now (attacking pairs)</span><b>' + h + '</b></div><div class="reg"><span>best neighbour h</span><b>' + B.h + '</b></div><div class="reg"><span>moves made</span><b>' + moves + '</b></div></div>' +
        '<div class="say' + (h === 0 ? ' goal' : B.h >= h ? ' bad' : '') + '"><span class="kind">STATE</span><p>' + (msg ? msg + ' ' : '') + state + '</p></div>' +
        '<div class="qbtns"><button class="btn pri" type="button" data-q="step"' + (B.h >= h ? ' disabled' : '') + '>Hill-climb one step</button><button class="btn" type="button" data-q="restart">Random restart</button></div>' +
        '<p class="xnote">Each empty square shows h if that column&rsquo;s queen moved there. Click any square to move a queen yourself.</p></div>';
      msg = '';
    }
    el.addEventListener('click', function (e) {
      var s = e.target.closest('.sq'); if (s) { var c = +s.dataset.c, r = +s.dataset.r; if (b[c] !== r) { b[c] = r; moves++; } render(); return; }
      var q = e.target.closest('[data-q]'); if (!q) return;
      if (q.dataset.q === 'step') { var B = best(); if (B.h < queensH(b)) { msg = 'Moved column ' + (B.at[0] + 1) + ' to row ' + (B.at[1] + 1) + '.'; b[B.at[0]] = B.at[1]; moves++; } }
      if (q.dataset.q === 'restart') { b = rnd(); moves = 0; msg = 'New random board.'; }
      render();
    });
    render();
  };

  /* ---------------- a one-dimensional landscape: hill climbing and annealing ---------------- */
  var LAND = (function () {
    var a = [];
    for (var x = 0; x < 60; x++) {
      var y = 10 + 9 * Math.exp(-Math.pow((x - 8) / 4, 2)) + 22 * Math.exp(-Math.pow((x - 44) / 5, 2)) + 14 * Math.exp(-Math.pow((x - 27) / 3.5, 2));
      a.push(Math.round(y));
    }
    for (var i = 15; i <= 20; i++) a[i] = 12; // a plateau
    return a;
  })();
  W.landscape = function (el) {
    var mode = el.dataset.mode || 'hill', x = 5, T = 20, path = [x], log = [], timer = null, done = false;
    var G = Math.max.apply(null, LAND), Wd = 600, H = 230, sx = (Wd - 40) / (LAND.length - 1), sy = 170 / G;
    function px(i) { return 20 + i * sx; } function py(v) { return H - 30 - v * sy; }
    function classify() {
      var v = LAND[x], l = LAND[x - 1], r = LAND[x + 1];
      if (v === G) return 'the <b>global maximum</b>';
      if ((l === undefined || l <= v) && (r === undefined || r <= v)) return (l === v || r === v) ? 'a <b>plateau</b> (flat: neighbours are equal)' : 'a <b>local maximum</b>: both neighbours are lower, but it is not the highest peak';
      return 'a slope';
    }
    function step() {
      if (done) return;
      if (mode === 'hill') {
        var l = LAND[x - 1], r = LAND[x + 1], v = LAND[x], bx = x;
        if (l !== undefined && l > LAND[bx]) bx = x - 1;
        if (r !== undefined && r > LAND[bx]) bx = x + 1;
        if (bx === x) { done = true; log.unshift('No neighbour is higher (' + (l === undefined ? '-' : l) + ' and ' + (r === undefined ? '-' : r) + ' vs ' + v + '). Stop at ' + classify() + '.'); }
        else { log.unshift('Step ' + path.length + ': neighbours ' + (l === undefined ? '-' : l) + ' and ' + (r === undefined ? '-' : r) + '. Move to the higher one: ' + v + ' &#8594; ' + LAND[bx] + '.'); x = bx; path.push(x); }
      } else {
        if (T < 0.05) { done = true; log.unshift('Temperature is close to 0: stop at height ' + LAND[x] + ', ' + classify() + '.'); return; }
        var nx = Math.max(0, Math.min(LAND.length - 1, x + (Math.random() < .5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2))));
        var dE = LAND[nx] - LAND[x], line = 'Step ' + path.length + ': T = ' + T.toFixed(2) + '. Random neighbour at height ' + LAND[nx] + ', &Delta;E = ' + dE + '. ';
        if (dE > 0) { line += 'Better: always move.'; x = nx; }
        else { var p = Math.exp(dE / T), rr = Math.random(); line += 'Worse or equal: p = e<sup>' + dE + '/' + T.toFixed(2) + '</sup> = ' + p.toFixed(2) + ', random r = ' + rr.toFixed(2) + (rr < p ? ' &lt; p: <b>accept</b> the downhill move.' : ' &ge; p: reject, stay.'); if (rr < p) x = nx; }
        path.push(x); log.unshift(line); T *= 0.93;
      }
    }
    function render() {
      var o = '<svg class="land" viewBox="0 0 ' + Wd + ' ' + H + '" role="img" aria-label="State-space landscape">';
      o += '<path class="area" d="M' + px(0) + ' ' + (H - 30) + LAND.map(function (v, i) { return ' L' + px(i) + ' ' + py(v); }).join('') + ' L' + px(LAND.length - 1) + ' ' + (H - 30) + 'Z"/>';
      o += '<path class="trail" d="M' + path.map(function (i) { return px(i) + ' ' + (py(LAND[i]) - 10); }).join(' L') + '"/>';
      o += '<text class="lt" x="' + px(44) + '" y="' + (py(G) - 14) + '">global max</text><text class="lt" x="' + px(27) + '" y="' + (py(LAND[27]) - 14) + '">local max</text><text class="lt" x="' + px(9) + '" y="' + (py(LAND[8]) - 14) + '">local max</text><text class="lt" x="' + px(17.5) + '" y="' + (py(12) - 10) + '">plateau</text>';
      o += '<circle class="me" cx="' + px(x) + '" cy="' + (py(LAND[x]) - 10) + '" r="8"/>';
      o += '<text class="ax" x="20" y="' + (H - 8) + '">state &#8594; (click to place the climber)</text><text class="ax" x="' + (Wd - 20) + '" y="' + (H - 8) + '" text-anchor="end">height = objective value</text></svg>';
      el.innerHTML = '<div class="sim-top">' + seg('m', 'Method', [['hill', 'Hill climbing'], ['sa', 'Simulated annealing']], mode) + '</div>' +
        '<div class="lwrap">' + o + '<div class="side"><div class="regs"><div class="reg"><span>height now</span><b>' + LAND[x] + '</b></div><div class="reg"><span>moves</span><b>' + (path.length - 1) + '</b></div>' + (mode === 'sa' ? '<div class="reg"><span>temperature T</span><b>' + T.toFixed(2) + '</b></div>' : '') + '</div>' +
        '<div class="qbtns"><button class="btn pri" type="button" data-l="step"' + (done ? ' disabled' : '') + '>Step</button><button class="btn" type="button" data-l="run"' + (done ? ' disabled' : '') + '>' + (timer ? 'Pause' : 'Run') + '</button><button class="btn" type="button" data-l="reset">Reset</button></div>' +
        '<ol class="llog">' + log.slice(0, 6).map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ol></div></div>';
      el.classList.add('sim', 'xsim');
    }
    function reset(nx) { x = nx === undefined ? x : nx; T = 20; path = [x]; log = []; done = false; if (timer) { clearInterval(timer); timer = null; } }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-seg] button'); if (b) { mode = b.dataset.v; reset(); render(); return; }
      var l = e.target.closest('[data-l]');
      if (l) {
        if (l.dataset.l === 'step') step();
        if (l.dataset.l === 'reset') reset(5);
        if (l.dataset.l === 'run') {
          if (timer) { clearInterval(timer); timer = null; }
          else timer = setInterval(function () { step(); if (done) { clearInterval(timer); timer = null; } render(); }, mode === 'sa' ? 160 : 450);
        }
        render(); return;
      }
      var sv = e.target.closest('svg.land');
      if (sv) { var r = sv.getBoundingClientRect(), i = Math.round(((e.clientX - r.left) / r.width * Wd - 20) / sx); if (i >= 0 && i < LAND.length) { reset(i); render(); } }
    });
    render();
  };
})();
