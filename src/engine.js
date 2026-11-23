/* ===== Search engine: every algorithm records steps for the visualiser ===== */
var GRAPHS = {
  q253u: { name: 'Fall 2025 Q2(a)', dir: true, start: 'S', goal: 'G', vb: '0 0 400 230',
    nodes: { S: [40, 180, 0], A: [40, 50, 0], B: [200, 50, 0], C: [200, 180, 0], G: [360, 180, 0] },
    edges: [['S', 'A', 1], ['S', 'C', 10], ['A', 'B', 5], ['A', 'C', 10], ['B', 'C', 2], ['B', 'G', 5], ['C', 'G', 1]] },
  q262u: { name: 'Summer 2026 Q2(a)', dir: true, start: 'S', goal: 'G', vb: '0 0 480 230',
    nodes: { S: [36, 115, 0], A: [130, 50, 0], B: [130, 180, 0], C: [240, 30, 0], D: [240, 115, 0], E: [240, 200, 0], F: [345, 65, 0], G: [445, 120, 0] },
    edges: [['S', 'A', 1], ['S', 'B', 4], ['A', 'C', 2], ['A', 'D', 5], ['B', 'D', 1], ['B', 'E', 3], ['C', 'F', 3], ['D', 'F', 2], ['D', 'G', 6], ['E', 'G', 2], ['F', 'G', 1]] },
  q261u: { name: 'Spring 2026 Q2 (undirected, goal T)', dir: false, start: 'S', goal: 'T', vb: '0 0 480 230',
    nodes: { T: [40, 190, 0], V: [125, 40, 0], U: [125, 120, 0], R: [235, 190, 0], P: [335, 40, 0], S: [335, 120, 0], Q: [440, 190, 0] },
    edges: [['T', 'V', 2], ['T', 'U', 5], ['T', 'R', 9], ['V', 'R', 8], ['U', 'R', 3], ['R', 'P', 3], ['R', 'Q', 5], ['P', 'S', 4], ['P', 'Q', 1], ['S', 'Q', 1]] },
  q253i: { name: 'Fall 2025 Q3 (heuristic graph)', dir: true, start: 'S', goal: 'G', vb: '0 0 400 302', inf: true,
    nodes: { S: [200, 34, 6], A: [95, 115, 4], C: [305, 115, 3], B: [110, 215, 1], D: [300, 215, 1], G: [205, 262, 0] },
    edges: [['S', 'A', 2], ['S', 'C', 2], ['A', 'B', 1], ['C', 'B', 2], ['C', 'D', 2], ['B', 'G', 3], ['D', 'G', 3]] },
  q261i: { name: 'Spring 2026 Q3 (heuristic graph)', dir: true, start: 'S', goal: 'G', vb: '0 0 480 240', inf: true,
    nodes: { S: [50, 40, 8], B: [260, 40, 1], G: [430, 80, 0], A: [50, 190, 5], C: [235, 190, 2], D: [410, 200, 1] },
    edges: [['S', 'B', 11], ['S', 'A', 4], ['S', 'C', 6], ['A', 'C', 3], ['C', 'B', 1], ['B', 'G', 3], ['C', 'G', 5], ['C', 'D', 2], ['D', 'G', 1]] },
  q262i: { name: 'Summer 2026 Q3(a) (RBFS graph)', dir: true, start: 'P', goal: 'G', vb: '0 0 420 230', inf: true,
    nodes: { P: [50, 115, 4], Q: [210, 45, 2], R: [210, 185, 2], G: [370, 115, 0] },
    edges: [['P', 'Q', 2], ['P', 'R', 3], ['Q', 'G', 6], ['R', 'G', 2]] },
  q262t: { name: 'Summer 2026 Q3(b) (tree with f values)', dir: true, start: 'root', goal: 'LG', vb: '0 0 440 240', inf: true, fOnly: true,
    nodes: { root: [220, 36, 3], L: [120, 120, 6], R: [320, 120, 5], LL: [55, 205, 9], LG: [175, 205, 6], RL: [270, 205, 8], RR: [380, 205, 7] },
    edges: [['root', 'L', 0], ['root', 'R', 0], ['L', 'LL', 0], ['L', 'LG', 0], ['R', 'RL', 0], ['R', 'RR', 0]] },
  tA: { name: 'Teacher: A* example', dir: true, start: 'S', goal: 'G', vb: '0 0 420 250', inf: true,
    nodes: { S: [45, 125, 5], B: [160, 45, 4], C: [160, 205, 2], D: [285, 45, 6], E: [285, 205, 1], G: [380, 125, 0] },
    edges: [['S', 'B', 1], ['S', 'C', 4], ['B', 'C', 2], ['B', 'D', 5], ['C', 'E', 3], ['D', 'E', 2], ['D', 'G', 6], ['E', 'G', 2]] },
  tR: { name: 'Teacher and deck: RBFS example', dir: true, start: 'A', goal: 'G', vb: '0 0 420 302', inf: true,
    nodes: { A: [210, 34, 12], B: [70, 110, 12], C: [210, 120, 10], D: [350, 110, 7], E: [110, 205, 2], F: [310, 205, 6], G: [210, 262, 0] },
    edges: [['A', 'B', 5], ['A', 'C', 4], ['A', 'D', 5], ['B', 'E', 7], ['C', 'E', 9], ['C', 'F', 7], ['D', 'F', 4], ['E', 'G', 4], ['F', 'G', 6]] },
  tI: { name: 'Teacher: IDA* example', dir: true, start: 'S', goal: 'G', vb: '0 0 420 256', inf: true,
    nodes: { S: [45, 125, 10], A: [160, 55, 9], B: [160, 200, 7], C: [280, 35, 4], D: [280, 125, 8], E: [280, 215, 6], G: [380, 125, 0] },
    edges: [['S', 'A', 3], ['S', 'B', 6], ['A', 'C', 5], ['A', 'D', 4], ['B', 'E', 4], ['C', 'G', 2], ['D', 'G', 5], ['E', 'G', 3]] },
  s36: { name: 'Slide 36: A* graph search gone wrong', dir: true, start: 'S', goal: 'G', vb: '0 0 420 230', inf: true,
    nodes: { S: [45, 115, 2], A: [160, 45, 4], B: [160, 185, 1], C: [280, 115, 1], G: [385, 115, 0] },
    edges: [['S', 'A', 1], ['S', 'B', 1], ['A', 'C', 1], ['B', 'C', 2], ['C', 'G', 3]] },
  s18: { name: 'Slide 18: is A* optimal?', dir: true, start: 'S', goal: 'G', vb: '0 0 420 200', inf: true,
    nodes: { S: [50, 140, 7], A: [210, 45, 6], G: [370, 140, 0] },
    edges: [['S', 'A', 1], ['A', 'G', 3], ['S', 'G', 5]] }
};

function build(G) {
  var adj = {}, cost = {};
  Object.keys(G.nodes).forEach(function (k) { adj[k] = []; });
  G.edges.forEach(function (e) {
    adj[e[0]].push([e[1], e[2]]); cost[e[0] + '>' + e[1]] = e[2];
    if (!G.dir) { adj[e[1]].push([e[0], e[2]]); cost[e[1] + '>' + e[0]] = e[2]; }
  });
  Object.keys(adj).forEach(function (k) { adj[k].sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; }); });
  return { adj: adj, cost: cost, h: function (s) { return G.nodes[s][2]; } };
}

var ALG = {
  BFS: { name: 'Breadth-first search', short: 'BFS', ds: 'queue', key: null },
  DFS: { name: 'Depth-first search', short: 'DFS', ds: 'stack', key: null },
  UCS: { name: 'Uniform cost search', short: 'UCS', ds: 'pq', key: 'g' },
  DLS: { name: 'Depth-limited', short: 'DLS', ds: 'stack', key: null },
  IDS: { name: 'Iterative deepening', short: 'IDS', ds: 'stack', key: null },
  GREEDY: { name: 'Greedy best-first search', short: 'Greedy', ds: 'pq', key: 'h' },
  ASTAR: { name: 'A* search', short: 'A*', ds: 'pq', key: 'f' },
  IDASTAR: { name: 'IDA* search', short: 'IDA*', ds: 'rec', key: 'f' },
  RBFS: { name: 'Recursive best-first search', short: 'RBFS', ds: 'rec', key: 'f' }
};

function pathStr(p) { return p.join('-'); }

/* opts: { mode: 'tree' | 'graph', ties: 'alpha' | 'fifo', cap } */
function runSearch(G, alg, opts) {
  opts = opts || {};
  var B = build(G), A = ALG[alg], graph = opts.mode === 'graph', ties = opts.ties || 'alpha';
  var T = [], steps = [], st = {}, valOv = {}, round = 0, seq = 0, regs = {}, closed = {}, order = [];
  var CAP = opts.cap || 400, rows = [];
  function tnode(parent, s, g, depth) {
    var h = B.h(s), n = { id: T.length, parent: parent, s: s, g: g, h: h, f: g + h, step: parent === null || parent === undefined ? 0 : g - T[parent].g, depth: depth, round: round, seq: seq++ };
    n.path = parent === null ? [s] : T[parent].path.concat([s]);
    T.push(n); return n;
  }
  function pri(n) { return A.key === 'g' ? n.g : A.key === 'h' ? n.h : n.f; }
  function snap(kind, text, extra) {
    var s = { kind: kind, text: text, st: JSON.parse(JSON.stringify(st)), val: JSON.parse(JSON.stringify(valOv)), tcount: T.length, round: round,
      closed: Object.keys(closed), order: order.slice(), regs: JSON.parse(JSON.stringify(regs)) };
    if (extra) for (var k in extra) s[k] = extra[k];
    steps.push(s);
    return s;
  }
  function kidsOf(n) {
    var out = [];
    B.adj[n.s].forEach(function (x) {
      if (graph && closed[x[0]]) return;
      if (!graph && G.dir === false && n.path.indexOf(x[0]) >= 0 && alg !== 'BFS' && alg !== 'UCS' && alg !== 'ASTAR' && alg !== 'GREEDY') return;
      out.push(x);
    });
    return out;
  }
  function valTxt(n) {
    if (A.key === 'g') return n.parent === null || n.parent === undefined ? 'g = 0' : 'g = ' + T[n.parent].g + ' + ' + n.step + ' = ' + n.g;
    if (A.key === 'h') return 'h = ' + n.h;
    if (A.key === 'f') return G.fOnly ? 'f = ' + n.f : 'f = ' + n.g + ' + ' + n.h + ' = ' + n.f;
    return '';
  }
  function lbl(n) { return '<b>' + pathStr(n.path) + '</b>' + (A.key ? ' (' + valTxt(n) + ')' : ''); }
  var result = null;

  /* ---------- fringe-based: BFS, DFS, UCS, Greedy, A*, and IDS rounds ---------- */
  if (A.ds === 'queue' || A.ds === 'pq' || alg === 'DFS' || alg === 'IDS' || alg === 'DLS') {
    var limited = alg === 'IDS' || alg === 'DLS', cutHit = false;
    var maxL = alg === 'IDS' ? Object.keys(G.nodes).length : 0, L = alg === 'IDS' ? 0 : alg === 'DLS' ? (opts.limit === undefined ? 2 : opts.limit) : Infinity;
    for (; ; L++) {
      if (limited) {
        round = L; closed = {}; order = []; st = {};
        regs = { 'Depth limit': L };
        if (alg === 'IDS' && L > maxL) { snap('fail', 'Every depth limit up to ' + maxL + ' failed. There is no path to the goal.'); break; }
      }
      var fr = [], r0 = tnode(null, G.start, 0, 0); fr.push(r0); st[r0.id] = 'open';
      var DSname = A.ds === 'queue' ? 'queue' : A.ds === 'pq' ? 'priority queue' : 'stack';
      if (alg === 'DLS') snap('init', 'Depth-limited search with limit <b>' + L + '</b>: no path may be expanded once it has ' + L + ' edge' + (L === 1 ? '' : 's') + '. Put the start state <b>' + G.start + '</b> on the stack.', { fr: fr.slice() });
      else if (alg === 'IDS') snap('round', 'Round ' + (L + 1) + ': depth limit ' + L + '. Start again from ' + G.start + ' with an empty stack. Nothing is remembered from the last round.', { fr: fr.slice() });
      else snap('init', 'Put the start state <b>' + G.start + '</b> into the ' + DSname + (A.key ? ' with ' + valTxt(r0) : '') + '. The fringe holds just this one path.', { fr: fr.slice() });
      var done = false;
      while (fr.length) {
        if (steps.length > CAP) { snap('loop', 'Stopped after ' + CAP + ' steps. Without a visited set, DFS keeps going round the same cycle and never finishes. Switch to graph search to fix it.', { fr: fr.slice() }); done = true; result = null; break; }
        var n = fr.shift(), cur = n.id;
        if (graph && closed[n.s]) {
          st[n.id] = 'skip';
          snap('skip', 'Take ' + lbl(n) + ' out. ' + n.s + ' was already expanded, so throw this path away. Graph search never expands the same state twice.', { fr: fr.slice(), cur: cur, popped: n.id });
          continue;
        }
        if (n.s === G.goal) {
          st[n.id] = 'goal';
          var p = n; while (p) { if (st[p.id] !== 'goal') st[p.id] = 'path'; p = p.parent === null ? null : T[p.parent]; }
          result = { path: n.path, cost: G.fOnly ? n.f : n.g, node: n.id, round: alg === 'IDS' ? L : undefined };
          snap('goal', 'Take ' + lbl(n) + ' out. <b>' + n.s + ' is the goal, so stop.</b> The answer is the path stored in this entry: <b>' + pathStr(n.path) + '</b>, cost ' + result.cost + '.' + (alg === 'IDS' ? ' Found in round ' + (L + 1) + ' (limit ' + L + ').' : ''), { fr: fr.slice(), cur: cur, popped: n.id, done: true });
          done = true; break;
        }
        if (limited && n.depth >= L) {
          st[n.id] = 'cut'; order.push(n.s);
          var more = kidsOf(n).length > 0; if (more) cutHit = true;
          snap('pop', 'Take ' + lbl(n) + ' out. ' + n.s + ' is not the goal. It is at depth ' + n.depth + ', which equals the limit ' + L + ', so it is <b>not expanded</b>' + (alg === 'DLS' ? (more ? ' (it has children we are not allowed to look at: a <b>cutoff</b>).' : ' (it has no children anyway, so nothing is lost here).') : '.'), { fr: fr.slice(), cur: cur, popped: n.id });
          continue;
        }
        order.push(n.s); if (graph) closed[n.s] = 1; st[n.id] = 'done';
        var ks = kidsOf(n), kids = ks.map(function (x) { return tnode(n.id, x[0], n.g + x[1], n.depth + 1); });
        kids.forEach(function (k) { st[k.id] = 'open'; });
        var why = '';
        if (A.ds === 'queue') { kids.forEach(function (k) { fr.push(k); }); why = 'They go to the <b>back</b> of the queue, in alphabetical order.'; }
        else if (A.ds === 'stack') { for (var i = kids.length - 1; i >= 0; i--) fr.unshift(kids[i]); why = 'They are pushed in <b>reverse</b> alphabetical order, so the alphabetically first child ends up on <b>top</b>.'; }
        else {
          kids.forEach(function (k) { fr.push(k); });
          fr.sort(function (a, b) { var d = pri(a) - pri(b); if (d) return d; if (ties === 'alpha' && a.s !== b.s) return a.s < b.s ? -1 : 1; return a.seq - b.seq; });
          why = 'The priority queue stays sorted by <b>' + (A.key === 'g' ? 'g (the total cost of the whole path so far, not just the last edge)' : A.key === 'h' ? 'h (estimated distance to goal)' : 'f = g + h') + '</b>, lowest first' + (ties === 'alpha' ? ', ties alphabetical.' : ', ties first-come-first-served.');
        }
        var kt = kids.length ? 'Its children: ' + kids.map(function (k) { return k.s + (A.key ? ' (' + valTxt(k) + ')' : G.dir === false || A.ds === 'queue' || A.ds === 'stack' ? '' : ''); }).join(', ') + '. ' + why : 'It has no children' + (graph && B.adj[n.s].length ? ' that are not already expanded' : '') + ', so nothing is added.';
        snap('pop', 'Take ' + lbl(n) + ' out. ' + n.s + ' is not the goal, so <b>expand</b> it. ' + kt, { fr: fr.slice(), cur: cur, popped: n.id, kids: kids.map(function (k) { return k.id; }) });
      }
      if (done) break;
      if (alg === 'DLS') { snap('fail', cutHit ? 'The stack is empty and the goal was not found. Some paths were stopped by the limit, so the answer is <b>cutoff</b>: a goal may exist deeper than ' + L + '. Try a larger limit.' : 'The stack is empty and no path was ever stopped by the limit, so the answer is <b>failure</b>: there is no solution at all.', { fr: [] }); break; }
      if (alg !== 'IDS') { snap('fail', 'The fringe is empty and the goal was never taken out. There is no solution.', { fr: [] }); break; }
      snap('roundend', 'The stack is empty and the goal was not found within limit ' + L + '. Raise the limit by one and start again.', { fr: [] });
    }
  }

  /* ---------- IDA*: threshold rounds, goal test on generation (solved-examples deck) ---------- */
  if (alg === 'IDASTAR') {
    var root = null, thr = B.h(G.start), it = 0, found = null;
    while (it < 30) {
      round = it; st = {}; valOv = {}; order = [];
      var cut = [], cutN = [];
      regs = { 'Iteration': it + 1, 'Threshold': thr, 'Cut-off f values': '–' };
      root = tnode(null, G.start, 0, 0); st[root.id] = 'cur';
      snap('round', 'Iteration ' + (it + 1) + ': threshold = ' + thr + (it === 0 ? ', which is f(' + G.start + ') = ' + root.f + '.' : ', the smallest f that was cut off last time.') + ' Start a fresh depth-first search from ' + G.start + '.', { stack: [root.id] });
      var stackIds = [root.id];
      var res = (function search(n) {
        if (n.s === G.goal) return n;
        if (n.f > thr) { st[n.id] = 'cut'; cut.push(n.f); cutN.push(n.s + ' (' + n.f + ')'); regs['Cut-off f values'] = cut.join(', ');
          snap('cutoff', '<b>' + pathStr(n.path) + '</b> has f = ' + n.f + ' &gt; threshold ' + thr + '. <b>Cut it off</b> and remember ' + n.f + '. Backtrack.', { stack: stackIds.slice(), cur: n.id }); return null; }
        st[n.id] = 'done'; order.push(n.s);
        var kids = kidsOf(n).map(function (x) { return tnode(n.id, x[0], n.g + x[1], n.depth + 1); });
        snap('pop', '<b>' + pathStr(n.path) + '</b>: f = ' + n.f + ' &le; ' + thr + ', so expand it. ' + (kids.length ? 'Children, left to right: ' + kids.map(function (k) { return k.s + ' (f = ' + k.f + ')'; }).join(', ') + '.' : 'No children: dead end.'), { stack: stackIds.slice(), cur: n.id });
        for (var i = 0; i < kids.length; i++) {
          var k = kids[i]; st[k.id] = 'open';
          if (k.s === G.goal) {
            st[k.id] = 'goal';
            snap('goal', 'Generate <b>' + k.s + '</b>. It is the goal: the deck tests the goal <b>the moment a node is generated</b>, before comparing f = ' + k.f + ' with the threshold. Stop.', { stack: stackIds.concat([k.id]), cur: k.id, done: true });
            return k;
          }
          stackIds.push(k.id);
          var r = search(k);
          if (r) return r;
          stackIds.pop();
        }
        return null;
      })(root);
      if (res) {
        found = res; var p = res; while (p) { if (st[p.id] !== 'goal') st[p.id] = 'path'; p = p.parent === null ? null : T[p.parent]; }
        result = { path: res.path, cost: G.fOnly ? res.f : res.g, node: res.id, round: it };
        rows.push({ it: it + 1, thr: thr, exp: order.join(', '), cut: cutN.length ? cutN.join(', ') : '–', next: 'goal ' + G.goal + ' found' });
        snap('goal', 'Solution: <b>' + pathStr(res.path) + '</b>, cost ' + result.cost + ', found in iteration ' + (it + 1) + ' (threshold ' + thr + ').', { stack: [], done: true });
        break;
      }
      if (!cut.length) { snap('fail', 'Nothing was cut off and the goal was not found. There is no solution.'); break; }
      var nt = Math.min.apply(null, cut);
      rows.push({ it: it + 1, thr: thr, exp: order.join(', '), cut: cutN.join(', '), next: nt });
      snap('roundend', 'Iteration ' + (it + 1) + ' failed. Cut-off f values: ' + cut.join(', ') + '. <b>Next threshold = the smallest of them = ' + nt + '.</b>', { stack: [] });
      thr = nt; it++;
    }
  }

  /* ---------- RBFS: f(s) = max(g + h, f(parent)), Best / Alt / f_limit ---------- */
  if (alg === 'RBFS') {
    round = 0; var stackIds2 = [];
    var r0 = tnode(null, G.start, 0, 0); valOv[r0.id] = r0.f; st[r0.id] = 'cur';
    regs = { 'Call': 'RBFS(' + G.start + ', ∞)', 'Best': '–', 'Alt': '–', 'f_limit': '∞' };
    snap('init', 'Start: call RBFS(' + G.start + ', f_limit = ∞). f(' + G.start + ') = ' + r0.g + ' + ' + r0.h + ' = ' + r0.f + '.', { stack: [r0.id], cur: r0.id });
    var calls = 0;
    function fmt(x) { return x === Infinity ? '∞' : x; }
    function rbfs(n, flimit) {
      if (++calls > 60) return { ok: false, f: Infinity };
      stackIds2.push(n.id);
      if (n.s === G.goal) { st[n.id] = 'goal'; return { ok: true, node: n }; }
      var ks = kidsOf(n);
      if (!ks.length) { st[n.id] = 'fail'; snap('backup', pathStr(n.path) + ' has no successors: it fails with f = ∞.', { stack: stackIds2.slice(), cur: n.id }); stackIds2.pop(); return { ok: false, f: Infinity }; }
      var kids = ks.map(function (x) { var k = tnode(n.id, x[0], n.g + x[1], n.depth + 1); k.F = Math.max(k.g + k.h, valOv[n.id]); valOv[k.id] = k.F; st[k.id] = 'open'; return k; });
      st[n.id] = 'done';
      regs = { 'Call': 'RBFS(' + n.s + ', ' + fmt(flimit) + ')', 'Best': '–', 'Alt': '–', 'f_limit': fmt(flimit) };
      snap('pop', 'Expand <b>' + n.s + '</b>. Each successor gets f = max(g + h, f(' + n.s + ') = ' + valOv[n.id] + '): ' + kids.map(function (k) { var raw = k.g + k.h; return k.s + ' = max(' + k.g + ' + ' + k.h + ', ' + valOv[n.id] + ') = ' + k.F; }).join('; ') + '.', { stack: stackIds2.slice(), cur: n.id });
      while (true) {
        kids.sort(function (a, b) { return a.F - b.F || (a.s < b.s ? -1 : a.s > b.s ? 1 : 0); });
        var best = kids[0], alt = kids.length > 1 ? kids[1].F : Infinity;
        regs = { 'Call': 'RBFS(' + n.s + ', ' + fmt(flimit) + ')', 'Best': best.s + ' (' + best.F + ')', 'Alt': kids.length > 1 ? kids[1].s + ' (' + alt + ')' : '–', 'f_limit': fmt(flimit) };
        kids.forEach(function (k) { if (st[k.id] !== 'forgot') st[k.id] = 'open'; });
        var succTxt = kids.slice().sort(function (a, b) { return a.s < b.s ? -1 : 1; }).map(function (k) { return k.s + ' = ' + fmt(k.F); }).join(', ');
        if (best.F > flimit) {
          rows.push({ call: 'RBFS(' + n.s + ')', lim: fmt(flimit), succ: succTxt, best: best.s + ' (' + best.F + ')', alt: kids.length > 1 ? kids[1].s + ' (' + alt + ')' : '–', out: best.F + ' > ' + fmt(flimit) + ': fail, f(' + n.s + ') = ' + best.F });
          var old = valOv[n.id]; valOv[n.id] = best.F;
          kids.forEach(function (k) { st[k.id] = 'forgot'; }); st[n.id] = 'fail';
          snap('backup', 'Best is ' + best.s + ' with f = ' + best.F + ', which is <b>more than f_limit = ' + fmt(flimit) + '</b>. ' + n.s + ' fails. Back up: f(' + n.s + ') changes from ' + old + ' to <b>' + best.F + '</b>, and its children are forgotten.', { stack: stackIds2.slice(), cur: n.id, change: [n.id, old, best.F] });
          stackIds2.pop(); return { ok: false, f: best.F };
        }
        st[best.id] = 'cur';
        var nl = Math.min(flimit, alt);
        rows.push({ call: 'RBFS(' + n.s + ')', lim: fmt(flimit), succ: succTxt, best: best.s + ' (' + best.F + ')', alt: kids.length > 1 ? kids[1].s + ' (' + alt + ')' : '–', out: best.s === G.goal ? best.F + ' ≤ ' + fmt(flimit) + ': ' + best.s + ' is the goal, success' : best.F + ' ≤ ' + fmt(flimit) + ': recurse into ' + best.s + ', limit ' + fmt(nl) });
        snap('call', 'Best = <b>' + best.s + ' (' + best.F + ')</b>, Alt = ' + (kids.length > 1 ? kids[1].s + ' (' + alt + ')' : 'none (∞)') + '. ' + best.F + ' &le; f_limit ' + fmt(flimit) + ', so recurse: <b>RBFS(' + best.s + ', min(' + fmt(flimit) + ', ' + fmt(alt) + ') = ' + fmt(nl) + ')</b>.', { stack: stackIds2.concat([best.id]), cur: best.id });
        var r = rbfs(best, nl);
        if (r.ok) return r;
        best.F = r.f; valOv[best.id] = r.f;
        st[n.id] = 'cur';
        snap('back', 'Back in RBFS(' + n.s + '). ' + best.s + ' now carries f = ' + fmt(r.f) + '. Compare the children again: ' + kids.map(function (k) { return k.s + ' = ' + fmt(k.F); }).join(', ') + '.', { stack: stackIds2.slice(), cur: n.id });
        st[n.id] = 'done';
      }
    }
    var rr = rbfs(r0, Infinity);
    if (rr.ok) {
      var p = rr.node; while (p) { if (st[p.id] !== 'goal') st[p.id] = 'path'; p = p.parent === null ? null : T[p.parent]; }
      result = { path: rr.node.path, cost: rr.node.g, node: rr.node.id };
      snap('goal', '<b>' + G.goal + ' is the goal</b> and its f = ' + valOv[rr.node.id] + ' is within the limit. Success: <b>' + pathStr(rr.node.path) + '</b>, cost ' + rr.node.g + '.', { stack: stackIds2.slice(), cur: rr.node.id, done: true });
    } else snap('fail', 'RBFS failed: no path to the goal.');
  }
  return { steps: steps, T: T, result: result, alg: alg, G: G, opts: opts, rows: rows };
}

if (typeof module !== 'undefined') module.exports = { GRAPHS: GRAPHS, runSearch: runSearch };
