/* Engines for the topics after classical search: game trees (minimax and
   alpha-beta), constraint satisfaction (backtracking with filtering and
   ordering) and local search (8-queens). Each returns a list of steps that the
   interface replays one at a time. */

/* ---------------- game trees ---------------- */
var GAMES = {
  aima: { name: 'Three moves each (textbook figure)', tree: [[3, 12, 8], [2, 4, 6], [14, 5, 2]] },
  deck: { name: 'Deck slides 22-41', tree: [[[4, 6], [7, 9]], [[1, 2], [0, 1]]] },
  practice: { name: 'Deck slide 42 (practice)', tree: [[[6, 8], [9, 2], [1, 10]], [[4, 5], [2, 3], [11, 12]]] },
  p253: { name: 'Fall 2025 Q5 (midterm 253)', tree: [[[4, 3], [6, 2]], [[2, 1], [9, 5], [3, 1]], [[5, 4], [7, 5]]] },
  p261: { name: 'Spring 2026 Q5 (midterm 261)', tree: [[[5, 9], [6, [14, 10], 2], [12, [7, 16]]], [[2, 6], [15, 9, 7]]] },
  p262: { name: 'Summer 2026 Q5 (MIN root)', rootMin: true, tree: [[[5, 7, 1], [9, 2]], [[5, 10], [12, 6], [20]]] }
};

function gameRun(tree, mode, rootMin) {
  // Build nodes with ids, kinds and labels.
  var nodes = [], steps = [];
  function mk(t, depth, parent, label) {
    var n = { id: nodes.length, depth: depth, parent: parent, label: label, leaf: typeof t === 'number', kind: (depth + (rootMin ? 1 : 0)) % 2 ? 'min' : 'max', kids: [] };
    if (n.leaf) { n.value = t; n.kind = 'leaf'; }
    nodes.push(n);
    if (!n.leaf) t.forEach(function (c, i) { n.kids.push(mk(c, depth + 1, n.id, label + (depth === 0 ? String.fromCharCode(65 + i) : String(i + 1))).id); });
    return n;
  }
  mk(tree, 0, null, '');
  nodes[0].label = 'root';
  var st = nodes.map(function () { return { v: null, a: null, b: null, s: 'idle' }; });
  var cut = {};
  var INF = Infinity;
  function snap(kind, text, cur) {
    steps.push({ kind: kind, text: text, cur: cur, st: st.map(function (x) { return { v: x.v, a: x.a, b: x.b, s: x.s }; }), cut: Object.assign({}, cut) });
  }
  function fmt(x) { return x === INF ? '+&infin;' : x === -INF ? '&minus;&infin;' : String(x); }
  function name(n) { return n.leaf ? 'leaf ' + n.value : (n.kind === 'max' ? 'MAX' : 'MIN') + ' node ' + n.label; }
  function pruneRest(n, from) {
    var gone = [];
    n.kids.slice(from).forEach(function (k) { cut[k] = 1; (function mark(id) { st[id].s = 'pruned'; nodes[id].kids.forEach(mark); if (nodes[id].leaf) gone.push(nodes[id].value); })(k); });
    return gone;
  }
  function visit(id, a, b) {
    var n = nodes[id];
    if (n.leaf) { st[id].v = n.value; st[id].s = 'done'; snap('leaf', 'Reach a leaf: its utility is <b>' + n.value + '</b>.', id); return n.value; }
    var isMax = n.kind === 'max';
    st[id].v = isMax ? -INF : INF; st[id].s = 'active';
    if (mode === 'ab') { st[id].a = a; st[id].b = b; }
    snap('enter', 'Enter ' + name(n) + '. Start v at ' + fmt(st[id].v) + (mode === 'ab' ? ', with &alpha; = ' + fmt(a) + ' and &beta; = ' + fmt(b) + ' passed down from above' : '') + '.', id);
    for (var i = 0; i < n.kids.length; i++) {
      var cv = visit(n.kids[i], st[id].a, st[id].b);
      var old = st[id].v;
      st[id].v = isMax ? Math.max(old, cv) : Math.min(old, cv);
      st[id].s = 'active';
      var txt = 'Back at ' + name(n) + ': the child returned ' + cv + ', so v = ' + (isMax ? 'max' : 'min') + '(' + fmt(old) + ', ' + cv + ') = <b>' + st[id].v + '</b>.';
      if (mode === 'ab') {
        if (isMax && st[id].v >= st[id].b) {
          var g1 = pruneRest(n, i + 1);
          snap('prune', txt + ' Now v &ge; &beta; (' + st[id].v + ' &ge; ' + fmt(st[id].b) + '): MIN above will never let play reach here, so ' + (g1.length ? 'the remaining children are <b>pruned</b>' : 'stop') + '. Return ' + st[id].v + '.', id);
          st[id].s = 'done'; return st[id].v;
        }
        if (!isMax && st[id].v <= st[id].a) {
          var g2 = pruneRest(n, i + 1);
          snap('prune', txt + ' Now v &le; &alpha; (' + st[id].v + ' &le; ' + fmt(st[id].a) + '): MAX above already has something at least this good, so ' + (g2.length ? 'the remaining children are <b>pruned</b>' : 'stop') + '. Return ' + st[id].v + '.', id);
          st[id].s = 'done'; return st[id].v;
        }
        if (isMax) st[id].a = Math.max(st[id].a, st[id].v); else st[id].b = Math.min(st[id].b, st[id].v);
        txt += ' Update ' + (isMax ? '&alpha; = ' + fmt(st[id].a) : '&beta; = ' + fmt(st[id].b)) + '.';
      }
      snap('update', txt, id);
    }
    st[id].s = 'done';
    snap('return', name(n) + ' has seen all its children. It returns <b>' + st[id].v + '</b>.', id);
    return st[id].v;
  }
  var val = visit(0, -INF, INF);
  var best = nodes[0].kids.filter(function (k) { return st[k].v === val && st[k].s !== 'pruned'; })[0];
  var pruned = nodes.filter(function (n) { return n.leaf && st[n.id].s === 'pruned'; }).map(function (n) { return n.value; });
  var seen = nodes.filter(function (n) { return n.leaf && st[n.id].s !== 'pruned'; }).length;
  steps.push({ kind: 'done', text: 'Done. The root value is <b>' + val + '</b>, so MAX plays the move to <b>' + nodes[best].label + '</b>.' + (mode === 'ab' ? ' Leaves looked at: ' + seen + ' of ' + (seen + pruned.length) + (pruned.length ? '. Never looked at: ' + pruned.join(', ') + '.' : '.') : ''), cur: 0, st: steps[steps.length - 1].st, cut: Object.assign({}, cut), done: true });
  return { nodes: nodes, steps: steps, value: val, best: nodes[best].label, pruned: pruned, seen: seen };
}

/* ---------------- constraint satisfaction ---------------- */
var CSPS = {
  aus: {
    name: 'Map of Australia',
    vars: ['WA', 'NT', 'SA', 'Q', 'NSW', 'V', 'T'],
    pos: { WA: [70, 140], NT: [170, 60], SA: [190, 160], Q: [290, 70], NSW: [310, 175], V: [255, 245], T: [300, 305] },
    vals: ['R', 'G', 'B'],
    edges: [['WA', 'NT'], ['WA', 'SA'], ['NT', 'SA'], ['NT', 'Q'], ['SA', 'Q'], ['SA', 'NSW'], ['SA', 'V'], ['Q', 'NSW'], ['NSW', 'V']]
  }
};

function cspRun(P, opt) {
  // opt: { filter: 'none' | 'fc' | 'ac3', varOrder: 'fixed' | 'mrv', valOrder: 'fixed' | 'lcv', order: [vars] }
  var V = P.vars, nb = {}, steps = [], fails = 0, assigns = 0;
  V.forEach(function (v) { nb[v] = []; });
  P.edges.forEach(function (e) { nb[e[0]].push(e[1]); nb[e[1]].push(e[0]); });
  var order = opt.order || V;
  function copy(D) { var o = {}; V.forEach(function (v) { o[v] = D[v].slice(); }); return o; }
  function snap(kind, text, A, D, cur, extra) {
    steps.push(Object.assign({ kind: kind, text: text, A: Object.assign({}, A), D: copy(D), cur: cur }, extra || {}));
  }
  function unassigned(A) { return order.filter(function (v) { return !(v in A); }); }
  function selectVar(A, D) {
    var u = unassigned(A);
    if (opt.varOrder !== 'mrv') return { v: u[0], why: 'next in the fixed order' };
    var L = {};
    u.forEach(function (v) { L[v] = D[v].filter(function (c) { return !nb[v].some(function (x) { return A[x] === c; }); }).length; });
    var best = u[0];
    u.forEach(function (v) {
      var dv = L[v], db = L[best];
      var degV = nb[v].filter(function (x) { return !(x in A); }).length, degB = nb[best].filter(function (x) { return !(x in A); }).length;
      if (dv < db || (dv === db && degV > degB)) best = v;
    });
    var tied = u.filter(function (v) { return L[v] === L[best]; });
    return { v: best, why: 'MRV: ' + best + ' has the fewest legal values left (' + L[best] + ')' + (tied.length > 1 ? '; tie with ' + tied.filter(function (x) { return x !== best; }).join(', ') + ' broken by degree (most unassigned neighbours)' : '') };
  }
  function orderVals(v, A, D) {
    var vs = D[v].slice();
    if (opt.valOrder !== 'lcv') return { vs: vs, why: '' };
    var cost = {};
    vs.forEach(function (c) { cost[c] = nb[v].filter(function (x) { return !(x in A) && D[x].indexOf(c) >= 0; }).length; });
    vs.sort(function (a, b) { return cost[a] - cost[b] || P.vals.indexOf(a) - P.vals.indexOf(b); });
    return { vs: vs, why: 'LCV order ' + vs.map(function (c) { return c + ' (rules out ' + cost[c] + ')'; }).join(', ') };
  }
  function ac3(A, D, start) {
    var q = [], removed = [];
    nb[start].forEach(function (x) { if (!(x in A)) q.push([x, start]); });
    while (q.length) {
      var arc = q.shift(), xi = arc[0], xj = arc[1];
      var keep = D[xi].filter(function (c) { return D[xj].some(function (d) { return d !== c; }); });
      if (keep.length < D[xi].length) {
        D[xi].filter(function (c) { return keep.indexOf(c) < 0; }).forEach(function (c) { removed.push(xi + '&ne;' + c); });
        D[xi] = keep;
        if (!keep.length) return { ok: false, removed: removed, wipe: xi };
        nb[xi].forEach(function (xk) { if (xk !== xj && !(xk in A)) q.push([xk, xi]); });
      }
    }
    return { ok: true, removed: removed };
  }
  var D0 = {}; V.forEach(function (v) { D0[v] = P.vals.slice(); });
  snap('start', 'Every variable starts with the full domain {' + P.vals.join(', ') + '}. Nothing is assigned yet.', {}, D0, null);
  function bt(A, D) {
    if (unassigned(A).length === 0) return A;
    var sel = selectVar(A, D), v = sel.v, ov = orderVals(v, A, D);
    snap('select', 'Choose <b>' + v + '</b> (' + sel.why + '). Its domain: {' + D[v].join(', ') + '}.' + (ov.why ? ' ' + ov.why + '.' : ''), A, D, v);
    for (var i = 0; i < ov.vs.length; i++) {
      var c = ov.vs[i];
      var clash = nb[v].filter(function (x) { return A[x] === c; });
      if (clash.length) { snap('skip', 'Try ' + v + ' = ' + c + ': it clashes with ' + clash.map(function (x) { return x + ' = ' + c; }).join(', ') + '. Skip it.', A, D, v); continue; }
      var A2 = Object.assign({}, A); A2[v] = c; assigns++;
      var D2 = copy(D); D2[v] = [c];
      var note = '', ok = true, wipe = null;
      if (opt.filter === 'fc') {
        var cut = [];
        nb[v].forEach(function (x) { if (!(x in A2) && D2[x].indexOf(c) >= 0) { D2[x] = D2[x].filter(function (d) { return d !== c; }); cut.push(x); if (!D2[x].length && !wipe) wipe = x; } });
        note = cut.length ? ' Forward checking crosses ' + c + ' off ' + cut.join(', ') + '.' : ' Forward checking: no neighbour still had ' + c + '.';
        if (wipe) ok = false;
      } else if (opt.filter === 'ac3') {
        var r = ac3(A2, D2, v);
        note = r.removed.length ? ' Arc consistency removes ' + r.removed.join(', ') + '.' : ' Arc consistency removes nothing.';
        if (!r.ok) { ok = false; wipe = r.wipe; }
      }
      if (!ok) {
        fails++;
        snap('wipe', 'Try ' + v + ' = <b>' + c + '</b>.' + note + ' <b>' + wipe + '</b> has no values left, so this cannot work. Undo it.', A2, D2, v, { wipe: wipe });
        continue;
      }
      snap('assign', 'Assign <b>' + v + ' = ' + c + '</b>.' + note, A2, D2, v);
      var res = bt(A2, D2);
      if (res) return res;
      fails++;
      snap('back', 'Nothing below ' + v + ' = ' + c + ' worked, so <b>backtrack</b>: undo it and try the next value.', A, D, v);
    }
    snap('fail', 'No value of ' + v + ' works with the assignments above. Return failure.', A, D, v);
    return null;
  }
  var sol = bt({}, D0);
  steps.push({ kind: 'done', done: true, text: sol ? 'Solution: ' + V.map(function (v) { return v + ' = ' + sol[v]; }).join(', ') + '. Assignments tried: ' + assigns + ', dead ends: ' + fails + '.' : 'No solution.', A: sol || {}, D: steps[steps.length - 1].D, cur: null });
  return { steps: steps, sol: sol, assigns: assigns, fails: fails };
}

/* ---------------- simulated annealing, as the midterms ask it ---------------- */
/* cfg: { current, neighbours: [[name, value], ...] in the order they are checked, T: t => temperature, N: t => random number, maximise }
   At timestep t the neighbour number t is checked. A better move is always taken; a worse one is taken when N(t) < e^(dE/T). */
function annealRun(cfg) {
  var steps = [], cur = cfg.current, max = cfg.maximise !== false;
  for (var t = 0; t < cfg.neighbours.length; t++) {
    var nb = cfg.neighbours[t], dE = max ? nb[1] - cur[1] : cur[1] - nb[1], T = cfg.T(t), N = cfg.N(t);
    var better = dE > 0, p = better ? 1 : Math.exp(dE / T), accept = better || N < p;
    steps.push({ t: t, node: nb[0], dE: dE, T: T, N: N, p: p, better: better, accept: accept });
    if (accept) return { chosen: nb[0], at: t, steps: steps };
  }
  return { chosen: null, at: null, steps: steps };
}
function deg(x) { return x * Math.PI / 180; }

/* ---------------- 8-queens for hill climbing ---------------- */
function queensH(b) {
  var h = 0;
  for (var i = 0; i < b.length; i++) for (var j = i + 1; j < b.length; j++) if (b[i] === b[j] || Math.abs(b[i] - b[j]) === j - i) h++;
  return h;
}
function queensNeighbours(b) {
  return b.map(function (r0, c) { return b.map(function (_, r) { if (r === r0) return null; var n = b.slice(); n[c] = r; return queensH(n); }); });
}

if (typeof module !== 'undefined') module.exports = { annealRun: annealRun, deg: deg, GAMES: GAMES, gameRun: gameRun, CSPS: CSPS, cspRun: cspRun, queensH: queensH, queensNeighbours: queensNeighbours };
