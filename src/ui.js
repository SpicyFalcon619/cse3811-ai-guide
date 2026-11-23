(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var REC = { IDASTAR: 1, RBFS: 1 };
  var KIND = { init: 'START', pop: 'TAKE OUT, THEN EXPAND', skip: 'SKIP', goal: 'GOAL', fail: 'NO SOLUTION', round: 'NEW ROUND', roundend: 'ROUND OVER',
    cutoff: 'CUT OFF', call: 'RECURSE', backup: 'BACK UP', back: 'RETURN', loop: 'STOPPED' };

  /* ---------------- drawing ---------------- */
  function nodeLabelSize(s) { return s.length > 3 ? 11 : s.length > 1 ? 13 : 15; }
  function valueOf(run, n, step) {
    var a = run.alg;
    if (a === 'RBFS') { var v = step && step.val[n.id] !== undefined ? step.val[n.id] : n.f; return 'f=' + v; }
    if (a === 'UCS') return 'g=' + n.g;
    if (a === 'GREEDY') return 'h=' + n.h;
    if (a === 'ASTAR' || a === 'IDASTAR') return 'f=' + n.f;
    return '';
  }
  function visibleNodes(run, step) {
    var multi = run.alg === 'IDS' || run.alg === 'IDASTAR';
    return run.T.filter(function (n) { return n.id < step.tcount && (!multi || n.round === step.round); });
  }
  function nodeStatus(step, id) {
    if (step.cur === id && step.st[id] !== 'goal' && step.st[id] !== 'path') return 'cur';
    return step.st[id] || 'open';
  }
  var RANK = { cur: 9, goal: 8, path: 8, open: 6, done: 5, cut: 4, fail: 4, skip: 3, forgot: 2 };

  function drawGraph(G, run, step, opt) {
    opt = opt || {};
    var vb = G.vb.split(' ').map(Number), W = vb[2], H = vb[3], R = 19;
    var stat = {}, onE = {}, solE = {}, genE = {};
    if (run && step) (step.kids || []).forEach(function (id) { var k = run.T[id]; if (k.parent !== null) genE[run.T[k.parent].s + '>' + k.s] = 1; });
    if (run && step) {
      visibleNodes(run, step).forEach(function (n) {
        var s = nodeStatus(step, n.id);
        if (s === 'path' && !step.done) s = 'done';
        if (!stat[n.s] || RANK[s] > RANK[stat[n.s]]) stat[n.s] = s;
      });
      if (step.cur !== undefined && run.T[step.cur]) { var p = run.T[step.cur].path; for (var i = 0; i < p.length - 1; i++) onE[p[i] + '>' + p[i + 1]] = 1; }
      if (step.done && run.result) { var q = run.result.path; for (var j = 0; j < q.length - 1; j++) solE[q[j] + '>' + q[j + 1]] = 1; q.forEach(function (s) { stat[s] = 'path'; }); }
    }
    if (opt.lit) { Object.keys(opt.lit.st).forEach(function (k) { stat[k] = opt.lit.st[k]; }); genE = opt.lit.e; }
    var o = '<svg class="gsvg gfull" viewBox="' + G.vb + '" width="' + W + '" role="img" aria-label="' + esc(G.name) + '">';
    G.edges.forEach(function (e) {
      var a = G.nodes[e[0]], b = G.nodes[e[1]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
      var x1 = a[0] + ux * R, y1 = a[1] + uy * R, x2 = b[0] - ux * (R + (G.dir ? 3 : 0)), y2 = b[1] - uy * (R + (G.dir ? 3 : 0));
      var k = e[0] + '>' + e[1], k2 = e[1] + '>' + e[0];
      var cls = solE[k] || (!G.dir && solE[k2]) ? 'sol' : onE[k] || (!G.dir && onE[k2]) ? 'on' : genE[k] || (!G.dir && genE[k2]) ? 'gen' : '';
      o += '<line pathLength="1" class="edge ' + cls + '" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
      if (G.dir) {
        var tx = x2, ty = y2, s = 9, w = 5;
        o += '<polygon class="arrow ' + cls + '" points="' + (tx + ux * 3).toFixed(1) + ',' + (ty + uy * 3).toFixed(1) + ' ' + (tx - ux * s - uy * w).toFixed(1) + ',' + (ty - uy * s + ux * w).toFixed(1) + ' ' + (tx - ux * s + uy * w).toFixed(1) + ',' + (ty - uy * s - ux * w).toFixed(1) + '"/>';
      }
      if (!G.fOnly) {
        var off = Math.abs(uy) > .75 ? 20 : 11, mx = (a[0] + b[0]) / 2 - uy * off, my = (a[1] + b[1]) / 2 + ux * off;
        o += '<rect class="ecost" x="' + (mx - 9) + '" y="' + (my - 9) + '" width="18" height="18" rx="4"/><text class="etxt" x="' + mx + '" y="' + my + '">' + e[2] + '</text>';
      }
    });
    Object.keys(G.nodes).forEach(function (k) {
      var n = G.nodes[k], s = stat[k] || '';
      if (s === 'cur') o += '<circle class="halo" cx="' + n[0] + '" cy="' + n[1] + '" r="' + R + '"/><circle class="halo h2" cx="' + n[0] + '" cy="' + n[1] + '" r="' + R + '"/>';
      o += '<g class="node ' + s + '"><circle cx="' + n[0] + '" cy="' + n[1] + '" r="' + R + '"/><text class="l" x="' + n[0] + '" y="' + (n[1] + 1) + '" style="font-size:' + nodeLabelSize(k) + 'px">' + esc(k) + '</text>';
      if (G.inf) o += '<text class="h" x="' + n[0] + '" y="' + (n[1] + R + 13) + '">' + (G.fOnly ? 'f=' : 'h=') + n[2] + '</text>';
      if (k === G.start) o += '<text class="startlbl" x="' + n[0] + '" y="' + (n[1] - R - 6) + '">START</text>';
      else if (k === G.goal) o += '<text class="startlbl" x="' + n[0] + '" y="' + (n[1] - R - 6) + '">GOAL</text>';
      o += '</g>';
    });
    return o + '</svg>';
  }

  function drawTree(run, step) {
    var ns = visibleNodes(run, step), kids = {}, byId = {};
    ns.forEach(function (n) { byId[n.id] = n; kids[n.id] = []; });
    ns.forEach(function (n) { if (n.parent !== null && byId[n.parent]) kids[n.parent].push(n.id); });
    var root = ns.filter(function (n) { return n.parent === null || !byId[n.parent]; })[0];
    if (!root) return '<p class="empty">Nothing yet.</p>';
    var GX = 54, GY = 66, pos = {}, leaf = 0, maxD = 0;
    (function lay(id, d) {
      maxD = Math.max(maxD, d);
      if (!kids[id].length) { pos[id] = [leaf * GX, d]; leaf++; return; }
      kids[id].forEach(function (c) { lay(c, d + 1); });
      var xs = kids[id].map(function (c) { return pos[c][0]; });
      pos[id] = [(Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, d];
    })(root.id, 0);
    var W = Math.max(leaf * GX, 160) + 40, H = (maxD + 1) * GY + 26, ox = 20 + GX / 2 - (leaf > 0 ? 0 : 0);
    var onPath = {};
    if (step.cur !== undefined && byId[step.cur]) { var c = byId[step.cur]; while (c) { onPath[c.id] = 1; c = c.parent !== null ? byId[c.parent] : null; } }
    var o = '<svg class="gsvg' + (W > 620 ? ' wide' : '') + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="Search tree">';
    function X(id) { return ox + pos[id][0] - GX / 2 + 10; } function Y(id) { return 26 + pos[id][1] * GY; }
    ns.forEach(function (n) {
      if (n.parent === null || !byId[n.parent]) return;
      var s = step.st[n.id], ps = step.st[n.parent];
      var cls = (s === 'path' || s === 'goal') && step.done ? 'sol' : onPath[n.id] ? 'on' : '';
      if (s === 'forgot') cls += ' forgot';
      o += '<line class="tedge ' + cls + '" x1="' + X(n.parent) + '" y1="' + Y(n.parent) + '" x2="' + X(n.id) + '" y2="' + Y(n.id) + '"/>';
      if (!run.G.fOnly) { var cx = X(n.parent) + (X(n.id) - X(n.parent)) * .62, cy = Y(n.parent) + (Y(n.id) - Y(n.parent)) * .62; o += '<text class="tcost" x="' + (cx + (X(n.id) > X(n.parent) ? 10 : X(n.id) < X(n.parent) ? -10 : 11)) + '" y="' + (cy + 1) + '">' + n.step + '</text>'; }
    });
    ns.forEach(function (n) {
      var s = nodeStatus(step, n.id); if (s === 'path' && !step.done) s = 'done';
      var x = X(n.id), y = Y(n.id), v = valueOf(run, n, step), chg = step.change && step.change[0] === n.id, born = (step.kids || []).indexOf(n.id) >= 0;
      o += '<g class="node ' + s + (born ? ' born' : '') + '" style="transform-origin:' + x + 'px ' + y + 'px"><circle cx="' + x + '" cy="' + y + '" r="15"/><text class="l" x="' + x + '" y="' + (y + 1) + '" style="font-size:' + Math.min(13, nodeLabelSize(n.s)) + 'px">' + esc(n.s) + '</text>';
      if (chg) o += '<text class="tval chg" x="' + x + '" y="' + (y + 29) + '">f=' + step.change[1] + '&#8594;' + step.change[2] + '</text>';
      else if (v) o += '<text class="tval" x="' + x + '" y="' + (y + 29) + '">' + v + '</text>';
      o += '</g>';
    });
    return o + '</svg>';
  }


  /* ---------- full tree representation of a graph (every path from the start, no state repeated on a path, goal is a leaf) ---------- */
  function fullTree(G) {
    var B = build(G), out = [];
    (function add(parent, s, g, path) {
      var n = { id: out.length, parent: parent, s: s, g: g, h: G.nodes[s][2], depth: path.length - 1, path: path, key: path.join('-') };
      n.f = n.g + n.h; out.push(n);
      if (s === G.goal || out.length > 150) return;
      B.adj[s].forEach(function (x) { if (path.indexOf(x[0]) < 0) add(n.id, x[0], g + x[1], path.concat([x[0]])); });
    })(null, G.start, 0, [G.start]);
    return out;
  }
  function layoutTree(ns, GX) {
    var kids = {}, pos = {}, leaf = 0, maxD = 0;
    ns.forEach(function (n) { kids[n.id] = []; });
    ns.forEach(function (n) { if (n.parent !== null && kids[n.parent]) kids[n.parent].push(n.id); });
    (function lay(id, d) {
      maxD = Math.max(maxD, d);
      if (!kids[id].length) { pos[id] = [leaf * GX, d]; leaf++; return; }
      kids[id].forEach(function (c) { lay(c, d + 1); });
      var xs = kids[id].map(function (c) { return pos[c][0]; });
      pos[id] = [(Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, d];
    })(ns[0].id, 0);
    return { pos: pos, leaves: leaf, maxD: maxD };
  }
  /* opts: { run, step, upto (max depth shown), valKey ('g' | 'h' | 'f' | 'none'), cost: show edge costs } */
  function drawFull(G, opts) {
    opts = opts || {};
    var ns = fullTree(G), run = opts.run, step = opts.step, GX = 58, GY = 72;
    var L = layoutTree(ns, GX), W = Math.max(L.leaves * GX, 180) + 40, H = (L.maxD + 1) * GY + 34;
    var stat = {}, orderNo = {}, onKey = {}, solKey = {}, bornKey = {}, ghosts = !!run;
    if (run && step) (step.kids || []).forEach(function (id) { bornKey[run.T[id].path.join('-')] = 1; });
    if (run && step) {
      visibleNodes(run, step).forEach(function (n) {
        var k = n.path.join('-'), s = nodeStatus(step, n.id); if (s === 'path' && !step.done) s = 'done';
        if (!stat[k] || RANK[s] > RANK[stat[k]]) stat[k] = s;
      });
      var cnt = 0, multi = run.alg === 'IDS' || run.alg === 'IDASTAR';
      for (var i = 0; i <= run.steps.indexOf(step); i++) {
        var st = run.steps[i];
        if (multi && st.round !== step.round) continue;
        var id = st.popped !== undefined ? st.popped : (REC[run.alg] && st.kind === 'pop' ? st.cur : undefined);
        if (id === undefined || (st.kind !== 'pop' && st.kind !== 'goal')) continue;
        var key = run.T[id].path.join('-'); if (!orderNo[key]) orderNo[key] = ++cnt;
      }
      if (step.cur !== undefined && run.T[step.cur]) { var p = run.T[step.cur].path; for (var j = 1; j <= p.length; j++) onKey[p.slice(0, j).join('-')] = 1; }
      if (step.done && run.result) { var q = run.result.path; for (var m = 1; m <= q.length; m++) solKey[q.slice(0, m).join('-')] = 1; }
    }
    var vk = opts.valKey || 'g';
    function X(n) { return 30 + L.pos[n.id][0]; } function Y(n) { return 30 + L.pos[n.id][1] * GY; }
    var o = '<svg class="gsvg' + (W > 640 ? ' wide' : ' gfull') + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="Full search tree">';
    var byId = {}; ns.forEach(function (n) { byId[n.id] = n; });
    ns.forEach(function (n) {
      if (n.parent === null || (opts.upto !== undefined && n.depth > opts.upto)) return;
      var pa = byId[n.parent], cls = solKey[n.key] ? 'sol' : onKey[n.key] ? 'on' : '';
      if (ghosts && !stat[n.key]) cls += ' ghost';
      if (opts.level !== undefined) cls = n.depth === opts.level ? 'fresh' : 'old';
      o += '<line pathLength="1" class="tedge ' + cls + '" x1="' + X(pa) + '" y1="' + Y(pa) + '" x2="' + X(n) + '" y2="' + Y(n) + '"/>';
      if (opts.cost) { var mx = X(pa) + (X(n) - X(pa)) * .62, my = Y(pa) + (Y(n) - Y(pa)) * .62, sx = X(n) > X(pa) ? 10 : X(n) < X(pa) ? -10 : 11; o += '<text class="tcost" x="' + (mx + sx) + '" y="' + (my + 1) + '">' + (n.g - pa.g) + '</text>'; }
    });
    ns.forEach(function (n) {
      if (opts.upto !== undefined && n.depth > opts.upto) return;
      var s = stat[n.key] || (ghosts ? 'ghost' : ''), x = X(n), y = Y(n), born = bornKey[n.key];
      if (solKey[n.key]) s = 'path';
      if (opts.level !== undefined) { s = n.s === G.goal ? 'goal' : n.depth === opts.level ? 'open' : 'done'; born = n.depth === opts.level; }
      var v = vk === 'none' ? '' : vk === 'f' ? (G.fOnly ? 'f=' + n.f : 'f=' + n.g + '+' + n.h) : vk + '=' + n[vk];
      if (run && run.alg === 'RBFS' && step) { var best = null; visibleNodes(run, step).forEach(function (t) { if (t.path.join('-') === n.key) best = t; }); if (best && step.val[best.id] !== undefined) v = 'f=' + step.val[best.id]; }
      o += '<g class="node ' + s + (born ? ' born' : '') + '" style="transform-origin:' + x + 'px ' + y + 'px"><circle cx="' + x + '" cy="' + y + '" r="15"/><text class="l" x="' + x + '" y="' + (y + 1) + '" style="font-size:' + Math.min(13, nodeLabelSize(n.s)) + 'px">' + esc(n.s) + '</text>';
      if (v) o += '<text class="tval" x="' + x + '" y="' + (y + 29) + '">' + v + '</text>';
      if (orderNo[n.key]) o += '<circle class="ordb" cx="' + (x + 14) + '" cy="' + (y - 13) + '" r="8"/><text class="ordt" x="' + (x + 14) + '" y="' + (y - 13) + '">' + orderNo[n.key] + '</text>';
      o += '</g>';
    });
    return o + '</svg>';
  }
  function treeValKey(alg) { return alg === 'GREEDY' ? 'h' : (alg === 'ASTAR' || alg === 'IDASTAR' || alg === 'RBFS') ? 'f' : 'g'; }
  window.__drawFull = drawFull;

  var LEGEND = '<span><i style="border-color:var(--S);background:var(--S)"></i>current</span><span><i style="border-color:var(--W);background:var(--Wbg)"></i>waiting in fringe</span><span><i style="border-color:var(--A);background:var(--Abg)"></i>expanded</span><span><i style="border-color:var(--G);background:var(--G)"></i>solution</span>';
  var LEGEND_X = { IDASTAR: '<span><i style="border-color:var(--R);background:var(--Rbg);border-style:dashed"></i>cut off</span>', RBFS: '<span><i style="border-color:var(--R);background:var(--Rbg);border-style:dashed"></i>failed, backed up</span><span><i style="border-color:var(--muted);border-style:dashed"></i>forgotten</span>', IDS: '<span><i style="border-color:var(--R);background:var(--Rbg);border-style:dashed"></i>at the limit, not expanded</span>' };

  /* ---------------- visualiser ---------------- */
  function chip(run, n, cls, val) {
    var a = ALG[run.alg], v = val !== undefined ? val : a.key === 'g' ? n.g : a.key === 'h' ? n.h : a.key === 'f' ? n.f : null;
    return '<span class="chip ' + (cls || '') + '" data-id="' + n.id + '">' + esc(n.path.join('-')) + (v !== null && v !== undefined ? '<span class="pv">' + a.key + '=' + v + '</span>' : '') + (a.key === 'g' && n.parent !== null && n.parent !== undefined && val === undefined ? '<span class="ps" title="cost so far of the parent + the cost of this one step">(' + run.T[n.parent].g + '+' + n.step + ')</span>' : '') + '</span>';
  }

  function Sim(el) {
    this.el = el; var d = el.dataset;
    this.algs = (d.algs || 'BFS').split(','); this.alg = d.alg || this.algs[0];
    this.graphs = (d.graphs || 'q253u').split(','); this.graph = d.graph || this.graphs[0];
    this.mode = d.mode || 'tree'; this.modectl = d.modectl === '1'; this.tiesctl = d.ties === '1';
    this.limit = d.limit === undefined ? 2 : +d.limit; this.ties = 'alpha'; this.view = d.view || 'graph'; this.code = d.code ? document.getElementById(d.code) : null;
    this.predict = false; this.asking = false; this.i = 0; this.timer = null;
    this.build(); this.run();
  }
  Sim.prototype.build = function () {
    var self = this, o = '<div class="sim-top">';
    if (this.algs.length > 1) o += '<div class="seg" data-r="alg" role="group" aria-label="Algorithm">' + this.algs.map(function (a) { return '<button type="button" data-v="' + a + '">' + ALG[a].short + '</button>'; }).join('') + '</div>';
    if (this.graphs.length > 1) o += '<label class="f">GRAPH <select data-r="graph" aria-label="Graph">' + this.graphs.map(function (g) { return '<option value="' + g + '">' + esc(GRAPHS[g].name) + '</option>'; }).join('') + '</select></label>';
    else o += '<span class="f mono" style="font-size:.74rem;color:var(--muted)">' + esc(GRAPHS[this.graph].name) + '</span>';
    if (this.algs.indexOf('DLS') >= 0) o += '<div class="seg" data-r="lim" role="group" aria-label="Depth limit"><span class="seglab">LIMIT</span>' + [0, 1, 2, 3, 4].map(function (v) { return '<button type="button" data-v="' + v + '">' + v + '</button>'; }).join('') + '</div>';
    if (this.modectl) o += '<div class="seg" data-r="mode" role="group" aria-label="Search type"><button type="button" data-v="tree">Tree search</button><button type="button" data-v="graph">Graph search</button></div>';
    if (this.tiesctl) o += '<div class="seg" data-r="ties" role="group" aria-label="Ties"><button type="button" data-v="alpha">Ties: A&#8594;Z</button><button type="button" data-v="fifo">Ties: first in</button></div>';
    o += '<label class="chk" title="Guess which path comes out next before you see it"><input type="checkbox" data-r="predict"> Predict mode</label></div>';
    o += '<div class="ctrl"><button class="btn" type="button" data-r="reset" aria-label="Restart"><svg viewBox="0 0 24 24"><path d="M4 4v6h6"/><path d="M4.5 15a8 8 0 1 0 2-8.5L4 10"/></svg>Restart</button><button class="btn" type="button" data-r="prev"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Back</button><button class="btn pri" type="button" data-r="next">Next<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button><button class="btn" type="button" data-r="play">Play</button><input type="range" min="0" value="0" data-r="range" aria-label="Step"><span class="cnt" data-r="cnt"></span><span class="keys">keys &#8592; &#8594;</span></div>';
    o += '<div class="sim-body"><div class="viz"><div class="tabs" role="group" aria-label="View"><button type="button" data-v="graph">State graph</button><button type="button" data-v="full">Full search tree</button><button type="button" data-v="tree">Generated so far</button></div><div class="dock" aria-label="Step controls"><div class="dock-in"><button class="btn pri" type="button" data-d="next" title="Next step">Next<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button><button class="btn" type="button" data-d="prev" title="Back one step"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Back</button><button class="btn" type="button" data-d="reset" title="Restart"><svg viewBox="0 0 24 24"><path d="M4 4v6h6"/><path d="M4.5 15a8 8 0 1 0 2-8.5L4 10"/></svg>Start</button><span class="dcnt" data-r="dcnt"></span></div></div><div class="canvas" data-r="canvas"></div><div class="legend" data-r="legend"></div></div>';
    o += '<div class="side"><div><div class="panel-h"><span data-r="frh">Fringe</span><b data-r="frn"></b></div><div class="fringe" data-r="fringe"></div></div><div class="regs" data-r="regs"></div><div class="say" data-r="say" aria-live="polite"></div></div></div>';
    o += '<details class="exam"><summary>Exam answer and full trace table</summary><div class="in" data-r="exam"></div></details>';
    this.el.innerHTML = o;
    this.r = {}; $$('[data-r]', this.el).forEach(function (x) { self.r[x.dataset.r] = x; });
    if (this.r.graph) this.r.graph.value = this.graph;
    function segs(name, cb) { var s = self.r[name]; if (!s) return; s.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; cb(b.dataset.v); }); }
    segs('alg', function (v) { self.alg = v; self.run(); });
    segs('mode', function (v) { self.mode = v; self.run(); });
    segs('ties', function (v) { self.ties = v; self.run(); });
    segs('lim', function (v) { self.limit = +v; self.run(); });
    if (this.r.graph) this.r.graph.addEventListener('change', function () { self.graph = this.value; self.run(); });
    $('.tabs', this.el).addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; self.view = b.dataset.v; self.render(); });
    this.r.predict.addEventListener('change', function () { self.predict = this.checked; self.asking = false; self.render(); });
    this.r.next.addEventListener('click', function () { self.stop(); self.next(); });
    $$('[data-d]', this.el).forEach(function (b) { b.addEventListener('click', function () { self.r[b.dataset.d].click(); }); });
    this.r.prev.addEventListener('click', function () { self.stop(); self.asking = false; if (self.i > 0) self.i--; self.render(); });
    this.r.reset.addEventListener('click', function () { self.stop(); self.asking = false; self.i = 0; self.render(); });
    this.r.play.addEventListener('click', function () { if (self.timer) self.stop(); else self.play(); });
    this.r.range.addEventListener('input', function () { self.stop(); self.asking = false; self.i = +this.value; self.render(); });
    this.r.say.addEventListener('click', function (e) { var c = e.target.closest('.chip.pick'); if (c) self.guess(+c.dataset.id, c); });
  };
  Sim.prototype.set = function (cfg) {
    if (cfg.graph) { if (this.graphs.indexOf(cfg.graph) < 0) { this.graphs.push(cfg.graph); if (this.r.graph) this.r.graph.insertAdjacentHTML('beforeend', '<option value="' + cfg.graph + '">' + esc(GRAPHS[cfg.graph].name) + '</option>'); } this.graph = cfg.graph; if (this.r.graph) { this.r.graph.value = cfg.graph; this.r.graph.dispatchEvent(new Event('sync')); } }
    if (cfg.alg) this.alg = cfg.alg; if (cfg.mode) this.mode = cfg.mode;
    this.run();
  };
  Sim.prototype.run = function () {
    this.stop(); this.asking = false;
    var G = GRAPHS[this.graph], alg = this.alg;
    if (G.fOnly && !REC[alg]) { alg = this.alg = 'IDASTAR'; }
    this.R = runSearch(G, alg, { mode: this.mode, ties: this.ties, limit: this.limit });
    if (this.r.lim) { var lim = this.limit; this.r.lim.hidden = alg !== 'DLS'; $$('button', this.r.lim).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.v === lim)); }); }
    this.i = 0; this.r.range.max = this.R.steps.length - 1;
    var self = this;
    ['alg', 'mode', 'ties'].forEach(function (k) { if (self.r[k]) $$('button', self.r[k]).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === self[k])); }); });
    if (this.r.ties) this.r.ties.hidden = ALG[alg].ds !== 'pq';
    if (this.r.mode) this.r.mode.hidden = !!REC[alg];
    this.buildExam(); this.render();
  };
  Sim.prototype.stop = function () { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.r.play.textContent = 'Play'; };
  Sim.prototype.play = function () {
    var self = this; if (this.i >= this.R.steps.length - 1) this.i = 0;
    this.r.play.textContent = 'Pause';
    this.timer = setInterval(function () { if (self.i >= self.R.steps.length - 1 || self.asking) return self.stop(); self.next(); }, 1100);
  };
  Sim.prototype.isFringe = function () { return !REC[this.R.alg]; };
  Sim.prototype.next = function () {
    if (this.i >= this.R.steps.length - 1) return;
    var nx = this.R.steps[this.i + 1];
    if (this.predict && this.isFringe() && nx.popped !== undefined && !this.asking && (this.R.steps[this.i].fr || []).length > 1) { this.asking = true; this.render(); return; }
    if (this.asking && this.predict) return;
    this.i++; this.render();
  };
  Sim.prototype.guess = function (id, el) {
    var nx = this.R.steps[this.i + 1], self = this, fb = $('.fb', this.r.say);
    if (id === nx.popped) {
      el.classList.add('goalc');
      fb.innerHTML = '<b>Right.</b> Moving on.';
      setTimeout(function () { self.asking = false; self.i++; self.render(); }, 650);
    } else {
      el.classList.add('skipc');
      var a = ALG[this.R.alg], hint = a.ds === 'queue' ? 'A queue hands out the path that has waited longest: the one at the <b>front</b>.' : a.ds === 'stack' ? 'A stack hands out the <b>newest</b> path: the one on top.' : 'A priority queue hands out the <b>lowest ' + a.key + '</b>. On a tie, the alphabetically first state.';
      fb.innerHTML = '<b>Not that one.</b> ' + hint;
    }
  };
  Sim.prototype.render = function () {
    var R = this.R, s = R.steps[this.i], G = R.G, A = ALG[R.alg], self = this;
    $$('.tabs button', this.el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === self.view)); });
    this.r.canvas.innerHTML = this.view === 'graph' ? drawGraph(G, R, s) : this.view === 'full' ? drawFull(G, { run: R, step: s, valKey: treeValKey(R.alg), cost: !G.fOnly }) : drawTree(R, s);
    this.r.legend.innerHTML = LEGEND + (this.view === 'graph' ? '<span>number on an arrow = cost of that one step</span>' : '<span>g under a node = total cost of the whole path</span><span>grey number on an edge = cost of that one step</span>') + (this.view === 'full' ? '<span><i style="border-color:var(--rule);border-style:dashed"></i>not reached yet</span><span><i style="border-color:var(--S);background:var(--S)"></i>number = expansion order</span>' : '') + (LEGEND_X[R.alg] || '') + (this.mode === 'graph' && !REC[R.alg] ? '<span><i style="border-color:var(--muted);border-style:dashed"></i>skipped repeat</span>' : '');
    // fringe
    var fh = '', fr = s.fr || [];
    if (REC[R.alg]) {
      this.r.frh.textContent = R.alg === 'RBFS' ? 'Recursion stack (current path)' : 'Depth-first stack (current path)';
      var ids = s.stack || [];
      fh = ids.length ? ids.map(function (id) { var n = R.T[id]; return chip(R, n, id === s.cur ? 'out' : '', R.alg === 'RBFS' ? s.val[id] : n.f); }).join('<span class="end">&#8594;</span>') : '<span class="empty">empty</span>';
      this.r.fringe.className = 'fringe'; this.r.frn.textContent = '';
    } else {
      var lab = A.ds === 'queue' ? 'Fringe: queue (FIFO)' : A.ds === 'stack' ? 'Fringe: stack (LIFO)' : 'Fringe: priority queue, lowest ' + A.key + ' first';
      this.r.frh.textContent = lab; this.r.frn.textContent = fr.length + (fr.length === 1 ? ' path' : ' paths');
      var kids = s.kids || [], asking = this.asking;
      var cells = fr.map(function (n, k) { return chip(R, n, (kids.indexOf(n.id) >= 0 ? 'new ' : '') + (k === 0 && !asking && !s.done ? 'next' : '')); });
      this.r.fringe.className = 'fringe' + (A.ds === 'queue' ? '' : ' v');
      if (!cells.length) fh = '<span class="empty">empty</span>';
      else if (A.ds === 'queue') fh = '<span class="end">FRONT</span>' + cells.join('') + '<span class="end">BACK</span>';
      else if (A.ds === 'stack') fh = '<span class="end">TOP</span>' + cells.join('');
      else fh = cells.join('');
      if (s.popped !== undefined) fh = '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;width:100%"><span class="end">JUST TAKEN OUT</span>' + chip(R, R.T[s.popped], s.kind === 'skip' ? 'skipc' : s.kind === 'goal' ? 'goalc' : 'out') + '</div>' + fh;
    }
    this.r.fringe.innerHTML = fh;
    // registers
    var regs = Object.assign({}, s.regs);
    if (!REC[R.alg]) { regs['Expanded, in order'] = s.order.length ? s.order.join(', ') : '–'; if (this.mode === 'graph') regs['Closed set'] = s.closed.length ? '{' + s.closed.join(', ') + '}' : '{ }'; }
    this.r.regs.innerHTML = Object.keys(regs).map(function (k) { return '<div class="reg"><span>' + esc(k) + '</span><b>' + esc(regs[k]) + '</b></div>'; }).join('');
    // explanation
    var say = this.r.say;
    if (this.asking) {
      say.className = 'say ask';
      say.innerHTML = '<span class="kind">YOUR TURN</span><p>Which path comes out of the fringe next? Click it.</p><div class="picks">' + fr.map(function (n) { return chip(R, n, 'pick'); }).join('') + '</div><p class="fb"></p>';
    } else {
      say.className = 'say' + (s.kind === 'goal' ? ' goal' : s.kind === 'backup' || s.kind === 'cutoff' || s.kind === 'fail' || s.kind === 'loop' || s.kind === 'roundend' ? ' bad' : '');
      if (s.kind === 'goal' && !REC[R.alg] && s.popped !== undefined) { say.className = 'say goal'; say.innerHTML = '<span class="kind">STEP ' + this.i + ' &middot; GOAL</span><p>' + s.text + '</p>' + readHTML(R); }
      else say.innerHTML = '<span class="kind">STEP ' + this.i + ' &middot; ' + (KIND[s.kind] || s.kind).replace('TAKE OUT, THEN EXPAND', REC[R.alg] ? 'EXPAND' : 'TAKE OUT, THEN EXPAND') + '</span><p>' + s.text + '</p>';
    }
    say.classList.remove('flash'); void say.offsetWidth; say.classList.add('flash');
    this.r.range.value = this.i; this.r.cnt.textContent = 'step ' + this.i + ' / ' + (R.steps.length - 1);
    this.r.prev.disabled = this.i === 0; this.r.next.disabled = this.i >= R.steps.length - 1;
    var dk = this.el; $$('[data-d]', dk).forEach(function (b) { b.disabled = b.dataset.d === 'reset' ? self.i === 0 : self.r[b.dataset.d].disabled; });
    if (this.r.dcnt) this.r.dcnt.textContent = this.i + ' / ' + (R.steps.length - 1);
    // exam table highlight
    $$('tr[data-s]', this.r.exam).forEach(function (tr) { tr.classList.toggle('hl', +tr.dataset.s === self.i); });
    if (this.code) {
      var map = { init: [1], pop: [4, 7], skip: [6], goal: [5], fail: [3], round: [1], roundend: [3], loop: [2] };
      var hl = map[s.kind] || []; if (s.kind === 'pop' && this.mode === 'graph') hl = [4, 6, 7];
      $$('div[data-l]', this.code).forEach(function (d) { d.classList.toggle('hl', hl.indexOf(+d.dataset.l) >= 0); });
    }
  };
  Sim.prototype.buildExam = function () { this.r.exam.innerHTML = examHTML(this.R); };

  function examHTML(R) {
    var A = ALG[R.alg], o = '', res = R.result, G = R.G;
    var last = R.steps[R.steps.length - 1];
    o += '<div class="write"><span class="k">WRITE THIS</span>';
    if (!REC[R.alg]) o += '<div><b>Expansion order:</b> ' + (R.alg === 'IDS' ? idsOrder(R) : last.order.join(', ')) + (res ? ', then ' + G.goal + ' is taken out (goal)' : '') + '</div>';
    if (R.alg === 'IDASTAR') o += '<div><b>Thresholds:</b> ' + R.rows.map(function (r) { return r.thr; }).join(' &#8594; ') + '</div>';
    o += res ? '<div><b>Solution path:</b> ' + res.path.join(' &#8594; ') + '</div><div><b>Path cost:</b> ' + (G.fOnly ? 'f(goal) = ' + res.cost : costSum(G, res.path)) + '</div>' : '<div>No solution.</div>';
    o += '</div>';
    if (R.alg === 'RBFS') {
      o += '<div class="scroll"><table><thead><tr><th>#</th><th>Call</th><th>f_limit</th><th>Successors (f)</th><th>Best</th><th>Alt</th><th>Outcome</th></tr></thead><tbody>' +
        R.rows.map(function (r, i) { return '<tr><td class="m">' + (i + 1) + '</td><td class="m">' + r.call + '</td><td class="m">' + r.lim + '</td><td class="m">' + r.succ + '</td><td class="m">' + r.best + '</td><td class="m">' + r.alt + '</td><td>' + r.out + '</td></tr>'; }).join('') + '</tbody></table></div>';
    } else if (R.alg === 'IDASTAR') {
      o += '<div class="scroll"><table><thead><tr><th>Iteration</th><th>Threshold</th><th>Expanded (f &le; threshold)</th><th>Cut off (f)</th><th>Next threshold</th></tr></thead><tbody>' +
        R.rows.map(function (r) { return '<tr><td class="m">' + r.it + '</td><td class="m">' + r.thr + '</td><td class="m">' + r.exp + '</td><td class="m">' + r.cut + '</td><td class="m">' + r.next + '</td></tr>'; }).join('') + '</tbody></table></div>';
    } else {
      var vh = A.key ? ' (' + A.key + ')' : '';
      o += '<div class="scroll"><table><thead><tr><th>Step</th><th>Taken out' + vh + '</th><th>Fringe after this step' + vh + '</th><th>Expanded</th></tr></thead><tbody>';
      R.steps.forEach(function (s, i) {
        if (s.kind === 'round') { o += '<tr data-s="' + i + '"><td colspan="4"><b>Round ' + (s.round + 1) + ', depth limit ' + s.round + '</b></td></tr>'; return; }
        if (['init', 'pop', 'skip', 'goal'].indexOf(s.kind) < 0 || (s.kind === 'goal' && s.popped === undefined)) return;
        var out = s.popped !== undefined ? R.T[s.popped] : null;
        o += '<tr data-s="' + i + '"><td class="m">' + i + '</td><td class="m">' + (out ? esc(out.path.join('-')) + (A.key ? ' (' + out[A.key] + ')' : '') + (s.kind === 'skip' ? ' skip' : s.kind === 'goal' ? ' GOAL' : '') : '&ndash;') + '</td><td class="m">' +
          ((s.fr || []).map(function (n) { return esc(n.path.join('-')) + (A.key ? '(' + n[A.key] + ')' : ''); }).join(', ') || '&ndash;') + '</td><td class="m">' + (s.order.join(', ') || '&ndash;') + '</td></tr>';
      });
      o += '</tbody></table></div>' + readHTML(R) + '<p class="mono" style="font-size:.66rem;letter-spacing:.1em;color:var(--muted)">THE ' + (A.ds === 'queue' ? 'QUEUE' : A.ds === 'stack' ? 'STACK' : 'PRIORITY QUEUE') + ', DRAWN STEP BY STEP</p>' + snapsHTML(R);
      if (A.ds === 'queue') o += '<p class="note"><b class="k">ORDER</b>The fringe column lists the queue from front to back.</p>';
      if (A.ds === 'stack') o += '<p class="note"><b class="k">ORDER</b>The fringe column lists the stack from top to bottom.</p>';
    }
    return o;
  }

  /* ---------- reading the answer straight from the fringe ---------- */
  function snapsHTML(R) {
    var A = ALG[R.alg], o = '<div class="snaps" role="list">';
    function lab(n) { return esc(n.path.join('-')) + (A.key ? ' <i>' + n[A.key] + '</i>' : ''); }
    R.steps.forEach(function (s, i) {
      if (s.kind === 'round') { o += '<div class="snap rnd" role="listitem"><h5>ROUND ' + (s.round + 1) + '</h5><span>limit ' + s.round + '</span></div>'; return; }
      if (['init', 'pop', 'skip', 'goal'].indexOf(s.kind) < 0 || (s.kind === 'goal' && s.popped === undefined)) return;
      var out = s.popped !== undefined ? R.T[s.popped] : null;
      o += '<div class="snap" role="listitem"><h5>STEP ' + i + '</h5>';
      if (out) o += '<div class="e ' + (s.kind === 'goal' ? 'goal' : 'out') + '">' + lab(out) + '</div>';
      o += '<span class="lbl">' + (A.ds === 'queue' ? 'front' : A.ds === 'stack' ? 'top' : 'lowest ' + A.key) + '</span>';
      (s.fr || []).forEach(function (n) { o += '<div class="e' + ((s.kids || []).indexOf(n.id) >= 0 ? ' nw' : '') + '">' + lab(n) + '</div>'; });
      if (!(s.fr || []).length) o += '<span class="lbl">empty</span>';
      o += '</div>';
    });
    return o + '</div><p class="note"><b class="k">HOW TO READ</b>Each column is the ' + (A.ds === 'queue' ? 'queue' : A.ds === 'stack' ? 'stack' : 'priority queue') + ' after one step. The crossed-out entry on top is the one just taken out; the green one is the goal. ' + (A.ds === 'queue' ? 'New paths join the bottom (back).' : A.ds === 'stack' ? 'New paths are pushed on top.' : 'The list stays sorted by ' + A.key + '.') + '</p>';
  }
  function readHTML(R) {
    var res = R.result; if (!res) return '';
    var A = ALG[R.alg], g = R.T[res.node], outs = [];
    R.steps.forEach(function (s) { if ((s.kind === 'pop' || s.kind === 'skip') && s.popped !== undefined && (R.alg !== 'IDS' || s.round === res.round)) outs.push(R.T[s.popped]); });
    var chain = [], n = g; while (n) { chain.push(n); n = n.parent === null ? null : R.T[n.parent]; }
    var o = '<div class="readbox"><span class="k">READ THE ANSWER FROM THE FRINGE</span>';
    o += '<div class="rrow"><b>1. Path</b><span>The goal came out inside the entry <code class="ent">' + esc(g.path.join('-')) + '</code>. That entry <i>is</i> the path: read its letters left to right, <b>' + g.path.join(' &#8594; ') + '</b>.</span></div>';
    o += '<div class="rrow"><b>2. Cost</b><span>' + (A.key === 'g' ? 'The number stored with it, g = <b>' + res.cost + '</b>.' : 'Add the edge costs along that path: <b>' + costSum(R.G, g.path) + '</b>' + (A.key === 'f' ? ' (also its g; f = g + h with h(goal) = 0).' : '.')) + '</span></div>';
    o += '<div class="rrow"><b>3. Order</b><span>List what was taken out before the goal, in order' + (R.alg === 'IDS' ? ' (last round only; write every round in the exam)' : '') + ': ' + (outs.length ? outs.map(function (x) { return '<code class="ent' + (x.id !== undefined && R.steps.some(function (s) { return s.kind === 'skip' && s.popped === x.id; }) ? ' sk' : '') + '">' + esc(x.path.join('-')) + '</code>'; }).join(' ') : '&ndash;') + ' and keep only the last letter of each: <b>' + outs.filter(function (x) { return !R.steps.some(function (s) { return s.kind === 'skip' && s.popped === x.id; }); }).map(function (x) { return x.s; }).join(', ') + '</b>.</span></div>';
    o += '<div class="rrow"><b>Or</b><span>If you write entries as <i>node(parent)</i>, trace parents back from the goal: <b>' + chain.map(function (x) { return x.s; }).join(' &#8592; ') + '</b>, then reverse it.</span></div></div>';
    return o;
  }

  function idsOrder(R) {
    var out = [], cur = null;
    R.steps.forEach(function (s) { if (s.kind === 'round') { cur = []; out.push(cur); } if (s.kind === 'pop' && cur) cur.push(R.T[s.popped].s); });
    return out.map(function (r, i) { return 'limit ' + i + ': ' + (r.join(', ') || '&ndash;'); }).join('; ');
  }
  function costSum(G, p) {
    var B = {}; G.edges.forEach(function (e) { B[e[0] + '>' + e[1]] = e[2]; if (!G.dir) B[e[1] + '>' + e[0]] = e[2]; });
    var parts = []; for (var i = 0; i < p.length - 1; i++) parts.push(B[p[i] + '>' + p[i + 1]]);
    return parts.join(' + ') + ' = ' + parts.reduce(function (a, b) { return a + b; }, 0);
  }
  window.__examHTML = examHTML; window.__drawGraph = drawGraph;

  /* ---------------- pages ---------------- */
  var pages = $$('article.page'), sims = {}, current = null;
  var groups = [];
  function buildNav() {
    var n = 0;
    pages.forEach(function (p) {
      n++; p.dataset.num = n;
      var g = groups.filter(function (x) { return x.name === p.dataset.group; })[0];
      if (!g) { g = { name: p.dataset.group, tag: '', pages: [] }; groups.push(g); }
      g.pages.push(p);
    });
    $('#groups').innerHTML = groups.map(function (g, i) { return '<a href="#' + g.pages[0].id + '" data-g="' + i + '">' + g.name + (g.tag ? '<span class="ct' + (g.tag === 'CT1' ? ' t1' : '') + '">' + g.tag + '</span>' : '') + '</a>'; }).join('');
    pages.forEach(function (p, i) {
      var prev = pages[i - 1], next = pages[i + 1], pg = document.createElement('nav'); pg.className = 'pager'; pg.setAttribute('aria-label', 'Page');
      pg.innerHTML = (prev ? '<a href="#' + prev.id + '"><span>&#8592; PREVIOUS</span><b>' + prev.dataset.title + '</b></a>' : '') + (next ? '<a class="nx" href="#' + next.id + '"><span>NEXT &#8594;</span><b>' + next.dataset.title + '</b></a>' : '');
      if (p.dataset.skip !== '1') {
        var db = document.createElement('button'); db.type = 'button'; db.className = 'btn donebtn'; db.dataset.done = p.id; p.appendChild(db);
      }
      p.appendChild(pg);
    });
  }
  function buildSub(p) {
    var g = groups.filter(function (x) { return x.name === p.dataset.group; })[0];
    $$('#groups a').forEach(function (a) {
      var on = groups[+a.dataset.g] === g; a.setAttribute('aria-current', String(on));
      if (on) { var t = $('#groups'); t.scrollTo({ left: a.offsetLeft - t.clientWidth / 2 + a.clientWidth / 2 }); }
    });
    var hero = $('header.hero', p);
    if (hero && !$('.chips', hero) && g.pages.length > 1) {
      var ch = document.createElement('nav'); ch.className = 'chips'; ch.setAttribute('aria-label', 'Pages in ' + g.name);
      ch.innerHTML = g.pages.map(function (q) { return '<a href="#' + q.id + '" data-p="' + q.id + '"' + (q === p ? ' aria-current="page"' : '') + '><span class="n">' + String(q.dataset.num).padStart(2, '0') + '</span>' + q.dataset.title + (q.dataset.skip === '1' ? '' : '<span class="ok" aria-hidden="true"></span>') + '</a>'; }).join('');
      hero.appendChild(ch);
    }
    refreshDone();
  }
  function doneSet() { try { return JSON.parse(store('cse3811-done') || '{}'); } catch (e) { return {}; } }
  function refreshDone() {
    var d = doneSet(), cnt = 0, tot = 0;
    $$('.chips a[data-p]').forEach(function (a) { var on = !!d[a.dataset.p]; a.classList.toggle('done', on); });
    pages.forEach(function (p) { if (p.dataset.skip !== '1') { tot++; if (d[p.id]) cnt++; } });
    $$('button[data-done]').forEach(function (b) { var on = !!d[b.dataset.done]; b.classList.toggle('on', on); b.innerHTML = on ? '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>Understood' : 'Mark this page as understood'; });
    $('#progT').textContent = cnt + '/' + tot; refreshRoute(); $('#progB').style.width = (tot ? cnt / tot * 100 : 0) + '%';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-done]'); if (b) { var d = doneSet(); d[b.dataset.done] = !d[b.dataset.done]; store('cse3811-done', JSON.stringify(d)); refreshDone(); }
    var l = e.target.closest('[data-lab]'); if (l) { var c = l.dataset.lab.split(','); location.hash = 'lab'; setTimeout(function () { if (sims.labsim) sims.labsim.set({ graph: c[0], alg: c[1], mode: c[2] || 'tree' }); }, 30); }
  });
  /* ---------- page heroes: numbered kicker, meta line, actions, and a plate ---------- */
  var META = {
    start: '41 pages &middot; about 10 hours with practice', course: '2 min', local: '15 min', hill: '20 min', anneal: '15 min', csp: 'deck 05 &middot; 20 min', backtrack: 'deck 05 &middot; 15 min', filtering: 'deck 05 &middot; 25 min', ordering: 'deck 05 &middot; 15 min', games: 'deck 06 &middot; 15 min', minimax: 'deck 06 &middot; 20 min', alphabeta: 'deck 06 &middot; 30 min', loop: '15 min', words: '10 min', 'ai-views': 'deck 02 &middot; 10 min', agents: 'deck 02 &middot; 10 min', rational: 'deck 02 &middot; 10 min',
    peas: 'deck 02 &middot; 15 min', env: 'deck 02 &middot; 20 min', problem: 'deck 03 &middot; 15 min', 'graph-tree': '15 min', 'read-answer': '10 min', bfs: 'deck 03 &middot; 15 min', dfs: 'deck 03 &middot; 15 min',
    ucs: 'deck 03 &middot; 15 min', ids: 'deck 03 &middot; 15 min', 'tree-graph': 'deck 04 &middot; 10 min', bidir: 'deck 03 &middot; 10 min', 'compare-u': '10 min', heuristic: 'deck 04 &middot; 30 min',
    greedy: 'deck 04 &middot; 15 min', astar: 'deck 04 &middot; 30 min', idastar: 'solved deck &middot; 25 min', rbfs: 'solved deck &middot; 30 min', smastar: 'deck 04 &middot; 15 min', 'compare-i': '10 min',
    qtypes: '15 min', papers: '60 min', lab: 'any time', quiz: '15 min', pairs: '5 min'
  };
  var ROUTE = [
    { k: 'S', t: 'The one loop', to: 'loop', pages: ['loop', 'words'] },
    { k: 'Ag', t: 'Agents', to: 'ai-views', pages: ['ai-views', 'agents', 'rational', 'peas', 'env', 'problem'] },
    { k: 'U', t: 'Uninformed', to: 'graph-tree', pages: ['graph-tree', 'read-answer', 'bfs', 'dfs', 'ucs', 'ids', 'tree-graph', 'bidir', 'compare-u'] },
    { k: 'h', t: 'Heuristics', to: 'heuristic', pages: ['heuristic'] },
    { k: 'A*', t: 'Greedy, A*', to: 'greedy', pages: ['greedy', 'astar'] },
    { k: 'M', t: 'IDA*, RBFS, SMA*', to: 'idastar', pages: ['idastar', 'rbfs', 'smastar', 'compare-i'] },
    { k: 'L', t: 'Local search', to: 'local', pages: ['local', 'hill', 'anneal'] },
    { k: 'C', t: 'CSP', to: 'csp', pages: ['csp', 'backtrack', 'filtering', 'ordering'] },
    { k: '&#945;&#946;', t: 'Games', to: 'games', pages: ['games', 'minimax', 'alphabeta'] },
    { k: 'G', t: 'Exam', to: 'papers', pages: ['qtypes', 'papers', 'quiz', 'pairs'] }
  ];
  function routeSVG() {
    var d = doneSet(), W = 92 + (ROUTE.length - 1) * 66, H = 250, xs = [], o = '<svg class="ill route" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="The course as a search graph">';
    ROUTE.forEach(function (r, i) { xs.push([46 + i * 66, i % 2 ? 150 : 70]); });
    o += '<g class="d">';
    for (var i = 0; i < ROUTE.length - 1; i++) o += '<path style="--i:' + i + '" d="M' + xs[i][0] + ' ' + xs[i][1] + ' L' + xs[i + 1][0] + ' ' + xs[i + 1][1] + '"/>';
    o += '<path class="t" style="--i:7" d="M' + xs[1][0] + ' ' + xs[1][1] + ' Q 200 228 ' + xs[3][0] + ' ' + xs[3][1] + '"/></g>';
    ROUTE.forEach(function (r, i) {
      var n = r.pages.filter(function (p) { return d[p]; }).length, st = n === r.pages.length ? 'done' : n ? 'open' : '', x = xs[i][0], y = xs[i][1];
      if (i === ROUTE.length - 1) st += ' goal';
      o += '<a href="#' + r.to + '" class="rnode ' + st + '"><circle cx="' + x + '" cy="' + y + '" r="22"/>' + (i === ROUTE.length - 1 ? '<circle class="ring" cx="' + x + '" cy="' + y + '" r="27"/>' : '') +
        '<text class="k" x="' + x + '" y="' + (y + 1) + '">' + r.k + '</text><text class="s" x="' + x + '" y="' + (y + (i % 2 ? 42 : -32)) + '">' + r.t + '</text>' +
        '<text class="c" x="' + x + '" y="' + (y + (i % 2 ? 56 : -46)) + '">' + n + '/' + r.pages.length + '</text></a>';
    });
    o += '<path id="routepath" class="rpath" d="M' + xs.map(function (x) { return x[0] + ' ' + x[1]; }).join(' L') + '"/><circle class="trav" r="6"><animateMotion dur="11s" repeatCount="indefinite" rotate="auto"><mpath href="#routepath"/></animateMotion></circle>';
    return o + '</svg>';
  }
  var PLATES = {
    loop: ['<svg class="ill" viewBox="0 0 520 220" role="img" aria-label="Queue, stack and priority queue"><g class="d"><rect x="20" y="70" width="150" height="40" rx="4" style="--i:0"/><path d="M60 70 V110 M100 70 V110 M140 70 V110" class="t" style="--i:1"/><path class="o" d="M10 140 H180" style="--i:2"/><rect x="220" y="40" width="80" height="140" rx="4" style="--i:3"/><path d="M220 75 H300 M220 110 H300 M220 145 H300" class="t" style="--i:4"/><rect x="350" y="40" width="150" height="140" rx="4" style="--i:5"/><path d="M350 75 H500 M350 110 H500 M350 145 H500" class="t" style="--i:6"/></g><g class="f"><text x="95" y="56" text-anchor="middle">queue</text><text x="260" y="30" text-anchor="middle">stack</text><text x="425" y="30" text-anchor="middle">priority queue</text><text class="s" x="95" y="160" text-anchor="middle">out at the front, in at the back</text><text class="s" x="260" y="200" text-anchor="middle">out and in at the top</text><text class="s" x="425" y="200" text-anchor="middle">out: the smallest number</text><text class="s" x="400" y="63">S-B</text><text class="ox" x="470" y="63">4</text><text class="s" x="400" y="98">S-A-C</text><text class="ox" x="470" y="98">6</text><text class="s" x="400" y="133">S-C</text><text class="ox" x="470" y="133">9</text></g></svg>', 'Three containers, one loop. Which path comes out next is the whole algorithm.'],
    agents: ['<svg class="ill" viewBox="0 0 520 230" role="img" aria-label="Agent and environment"><g class="d"><rect x="40" y="40" width="190" height="150" rx="6" style="--i:0"/><rect x="330" y="30" width="160" height="170" rx="60" style="--i:1"/><path d="M330 80 C 290 70 270 70 232 80" style="--i:2"/><path class="o" d="M232 150 C 270 160 290 160 330 150" style="--i:3"/><path d="M226 74 l8 6 -8 6" style="--i:4"/><path class="o" d="M324 144 l8 6 -8 6" style="--i:5"/><rect x="95" y="90" width="80" height="50" rx="4" class="t" style="--i:6"/></g><g class="f"><text x="135" y="30" text-anchor="middle">agent</text><text x="410" y="22" text-anchor="middle">environment</text><text class="s" x="280" y="60" text-anchor="middle">percepts</text><text class="s ox" x="280" y="180" text-anchor="middle">actions</text><text class="s" x="62" y="84">sensors</text><text class="s" x="62" y="176">actuators</text><text x="135" y="120" text-anchor="middle" style="font-size:22px">?</text></g></svg>', 'Slide 10. You design the box with the question mark: percept sequence in, action out.'],
    peas: ['<svg class="ill" viewBox="0 0 520 220" role="img" aria-label="PEAS"><g class="d"><circle cx="260" cy="110" r="38" style="--i:0"/><rect x="40" y="30" width="150" height="56" rx="4" style="--i:1"/><rect x="330" y="30" width="150" height="56" rx="4" style="--i:2"/><rect x="40" y="134" width="150" height="56" rx="4" style="--i:3"/><rect x="330" y="134" width="150" height="56" rx="4" style="--i:4"/><path class="t" d="M190 70 L226 96 M330 70 L294 96 M190 150 L226 124 M330 150 L294 124" style="--i:5"/></g><g class="f"><text x="260" y="116" text-anchor="middle">agent</text><text x="115" y="56" text-anchor="middle">P</text><text class="s" x="115" y="74" text-anchor="middle">how success is scored</text><text x="405" y="56" text-anchor="middle">E</text><text class="s" x="405" y="74" text-anchor="middle">the world it works in</text><text x="115" y="160" text-anchor="middle" class="ox">A</text><text class="s" x="115" y="178" text-anchor="middle">what it acts with</text><text x="405" y="160" text-anchor="middle">S</text><text class="s" x="405" y="178" text-anchor="middle">what it senses with</text></g></svg>', 'Four labelled lines, every time. Build each from a phrase in the story.'],
    heuristic: ['<svg class="ill" viewBox="0 0 520 220" role="img" aria-label="8-puzzle heuristics"><g class="d"><rect x="40" y="30" width="162" height="162" rx="4" style="--i:0"/><path class="t" d="M94 30 V192 M148 30 V192 M40 84 H202 M40 138 H202" style="--i:1"/><rect x="300" y="30" width="162" height="162" rx="4" style="--i:2"/><path class="t" d="M354 30 V192 M408 30 V192 M300 84 H462 M300 138 H462" style="--i:3"/><path class="o" d="M215 111 H285 M277 104 l8 7 -8 7" style="--i:4"/></g><g class="f">' +
      [7, 2, 4, 5, 0, 6, 8, 3, 1].map(function (t, i) { return t ? '<text x="' + (67 + (i % 3) * 54) + '" y="' + (64 + Math.floor(i / 3) * 54) + '" text-anchor="middle" style="font-size:20px">' + t + '</text>' : ''; }).join('') +
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (t, i) { return t ? '<text x="' + (327 + (i % 3) * 54) + '" y="' + (64 + Math.floor(i / 3) * 54) + '" text-anchor="middle" style="font-size:20px">' + t + '</text>' : ''; }).join('') +
      '<text class="s ox" x="250" y="100" text-anchor="middle">h1 = 8</text><text class="s ox" x="250" y="140" text-anchor="middle">h2 = 18</text></g></svg>', 'Slides 25&ndash;26. Relax the rules, solve the easy version exactly, and you have an admissible guess.'],
    bidir: ['<svg class="ill" viewBox="0 0 520 220" role="img" aria-label="Bidirectional search"><g class="d"><circle cx="190" cy="110" r="90" class="t" style="--i:0"/><circle cx="330" cy="110" r="90" class="t o" style="--i:1"/><circle cx="110" cy="110" r="7" style="--i:2"/><circle class="o" cx="410" cy="110" r="7" style="--i:3"/><path d="M117 110 C 170 80 220 90 260 110" style="--i:4"/><path class="o" d="M403 110 C 350 140 300 130 260 110" style="--i:5"/></g><g class="f"><circle class="fo" cx="260" cy="110" r="6"/><text x="110" y="140" text-anchor="middle">S</text><text x="410" y="140" text-anchor="middle" class="ox">G</text><text class="s" x="260" y="135" text-anchor="middle">meet</text></g></svg>', 'Slide 40. Two searches of depth d/2 instead of one of depth d.'],
    'read-answer': ['<svg class="ill" viewBox="0 0 520 220" role="img" aria-label="Reading the goal entry"><g class="d"><rect x="40" y="20" width="200" height="180" rx="4" style="--i:0"/><path class="t" d="M40 66 H240 M40 110 H240 M40 155 H240" style="--i:1"/><rect class="o" x="46" y="25" width="188" height="36" rx="3" style="--i:2"/><path class="o" d="M250 43 C 300 43 300 100 340 100" style="--i:3"/></g><g class="f"><text class="ox" x="60" y="49">S-A-B-C-G</text><text class="ox" x="205" y="49">9</text><text class="s" x="60" y="93">S-A-B-G</text><text class="s" x="210" y="93">11</text><text class="s" x="60" y="137">S-A-C</text><text class="s" x="210" y="137">11</text><text class="s" x="60" y="182">S-C</text><text class="s" x="210" y="182">10</text><text x="350" y="80">path S&#8594;A&#8594;B&#8594;C&#8594;G</text><text x="350" y="106">cost 9</text><text class="s" x="350" y="132">order: S, A, B, C</text></g></svg>', 'The entry the goal came out in already holds the whole answer.'],
    'ai-views': ['<svg class="ill" viewBox="0 0 520 220" role="img" aria-label="Four views of AI"><g class="d"><rect x="120" y="20" width="180" height="85" rx="4" style="--i:0"/><rect x="310" y="20" width="180" height="85" rx="4" style="--i:1"/><rect x="120" y="115" width="180" height="85" rx="4" style="--i:2"/><rect class="o" x="310" y="115" width="180" height="85" rx="4" style="--i:3"/></g><g class="f"><text class="s" x="210" y="14" text-anchor="middle">humanly</text><text class="s" x="400" y="14" text-anchor="middle">rationally</text><text class="s" x="100" y="66" text-anchor="end">thinking</text><text class="s" x="100" y="161" text-anchor="end">acting</text><text x="210" y="68" text-anchor="middle">cognitive model</text><text x="400" y="68" text-anchor="middle">laws of thought</text><text x="210" y="163" text-anchor="middle">Turing test</text><text class="ox" x="400" y="163" text-anchor="middle">rational agent</text></g></svg>', 'Slide 3. This course lives in the bottom-right box.']
  };
  Object.assign(PLATES, window.EXTRA_PLATES || {});
  function autoPlate(p) {
    var el = $('.sim', p); if (!el) return null;
    var algs = (el.dataset.algs || 'BFS').split(','), alg = el.dataset.alg || algs[0], g = (el.dataset.graphs || '').split(',')[0];
    if (!GRAPHS[g]) return null;
    var R = runSearch(GRAPHS[g], alg, { mode: el.dataset.mode || 'tree' }), s = R.steps[R.steps.length - 1];
    var svg = drawGraph(GRAPHS[g], R, s).replace('class="gsvg gfull"', 'class="gsvg ill"');
    return [svg, ALG[alg].short + ' on ' + GRAPHS[g].name + (R.result ? ': ' + R.result.path.join('&#8594;') + ', cost ' + R.result.cost : '') + '. Run it below, one step at a time.'];
  }
  var plateNo = 0;
  function buildHero(p) {
    var h = $('header.hero', p); if (!h || h.__done) return; h.__done = 1;
    var left = document.createElement('div'); left.className = 'hl';
    while (h.firstChild) left.appendChild(h.firstChild);
    h.appendChild(left);
    var eb = $('.eyebrow', left);
    if (eb) eb.outerHTML = '<p class="kick"><span class="num">' + String(p.dataset.num).padStart(2, '0') + '</span><span>' + eb.innerHTML + '</span></p>';
    if (META[p.id]) { var m = document.createElement('p'); m.className = 'meta'; m.innerHTML = META[p.id]; var ld = $('.lede', left); (ld || left.lastChild).insertAdjacentElement('afterend', m); }
    var acts = document.createElement('div'); acts.className = 'acts';
    if ($('.sim', p)) acts.innerHTML += '<button type="button" class="hbtn cream" data-jump="sim">Step through it</button>';
    if (p.dataset.skip !== '1') acts.innerHTML += '<button type="button" class="hbtn line" data-done="' + p.id + '"></button>';
    if (acts.innerHTML) (($('.meta', left) || $('.lede', left)) || left.lastChild).insertAdjacentElement('afterend', acts);
    addField(h);
    var pl = p.id === 'start' ? [routeSVG(), 'The course as a search graph, S to the goal G. Nodes fill in as you mark pages understood: amber when started, green when done.'] : PLATES[p.id] || autoPlate(p);
    if (pl) {
            h.classList.add('has-plate');
      var f = document.createElement('figure'); f.className = 'plate';
      f.innerHTML = '<div class="pin">' + pl[0] + '</div><figcaption><b>Plate ' + String(p.dataset.num).padStart(2, '0') + '.</b> ' + pl[1] + '</figcaption>';
      h.appendChild(f);
      var ill = $('.ill', f); if (ill) { $$('.d *', ill).forEach(function (e) { e.setAttribute('pathLength', '1'); }); ill.classList.remove('inking'); void ill.getBoundingClientRect(); ill.classList.add('inking'); }
    }
  }
  function refreshRoute() { var s = $('#start .plate .pin'); if (s) s.innerHTML = routeSVG(); }
  document.addEventListener('click', function (e) {
    var j = e.target.closest('[data-jump]'); if (!j) return;
    var pg = j.closest('.page'), t = $('.sim', pg); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ---------- motion: a live search behind every title band ---------- */
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function SearchField(hero) {
    var cv = document.createElement('canvas'); cv.className = 'field'; cv.setAttribute('aria-hidden', 'true');
    hero.insertBefore(cv, hero.firstChild);
    this.cv = cv; this.hero = hero; this.ctx = cv.getContext('2d'); this.t0 = 0; this.reset();
  }
  SearchField.prototype.reset = function () {
    var r = this.hero.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(320, r.width); this.h = Math.max(200, r.height);
    this.cv.width = this.w * dpr; this.cv.height = this.h * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = Math.ceil(this.w / 120), rows = Math.ceil(this.h / 110), N = [], E = [];
    for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) N.push({ x: (i + .5) * this.w / cols + (Math.random() - .5) * 60, y: (j + .5) * this.h / rows + (Math.random() - .5) * 50, d: Infinity });
    N.forEach(function (a, ia) {
      var near = N.map(function (b, ib) { return [ib, Math.hypot(a.x - b.x, a.y - b.y)]; }).filter(function (x) { return x[0] !== ia; }).sort(function (x, y) { return x[1] - y[1]; }).slice(0, 3);
      near.forEach(function (n) { if (n[1] < 190 && !E.some(function (e) { return (e[0] === ia && e[1] === n[0]) || (e[1] === ia && e[0] === n[0]); })) E.push([ia, n[0]]); });
    });
    var adj = N.map(function () { return []; }); E.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); });
    var s = Math.floor(Math.random() * N.length); N[s].d = 0; var q = [s];
    while (q.length) { var u = q.shift(); adj[u].forEach(function (v) { if (N[v].d === Infinity) { N[v].d = N[u].d + 1; q.push(v); } }); }
    this.N = N; this.E = E; this.max = Math.max.apply(null, N.map(function (n) { return n.d === Infinity ? 0 : n.d; })); this.t0 = performance.now();
  };
  SearchField.prototype.draw = function (now) {
    var c = this.ctx, N = this.N, step = 520, t = RM ? this.max + .9 : (now - this.t0) / step, wave = t, fade = this.max + 4;
    if (!RM && t > fade + 3) { this.reset(); return; }
    c.clearRect(0, 0, this.w, this.h);
    this.E.forEach(function (e) {
      var a = N[e[0]], b = N[e[1]], lit = Math.min(a.d, b.d) < wave - .4 && Math.max(a.d, b.d) <= wave;
      c.strokeStyle = lit ? 'rgba(142,173,255,' + (t > fade ? .28 * Math.max(0, 1 - (t - fade) / 3) : .28) + ')' : 'rgba(238,242,243,.07)';
      c.lineWidth = lit ? 1.4 : 1; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    });
    N.forEach(function (n) {
      var k = wave - n.d, r = 3.2, col = 'rgba(238,242,243,.14)';
      if (n.d === 0) r = 5;
      if (k >= 0 && k < 1) { col = 'rgba(142,173,255,' + (.85 - k * .4) + ')'; r = 4 + (1 - k) * 4; c.beginPath(); c.arc(n.x, n.y, 10 + k * 18, 0, 7); c.strokeStyle = 'rgba(142,173,255,' + (.35 * (1 - k)) + ')'; c.lineWidth = 1.2; c.stroke(); }
      else if (k >= 1) col = 'rgba(102,189,177,' + (t > fade ? .45 * Math.max(0, 1 - (t - fade) / 3) : .45) + ')';
      c.fillStyle = col; c.beginPath(); c.arc(n.x, n.y, r, 0, 7); c.fill();
    });
  };
  var fields = [], rafOn = false;
  function tick(now) {
    var any = false;
    fields.forEach(function (f) { if (!f.hero.closest('.page').hidden && f.hero.getBoundingClientRect().bottom > 0) { f.draw(now); any = true; } });
    if (any && !RM && !document.hidden && !CALM()) requestAnimationFrame(tick); else rafOn = false;
  }
  function CALM() { return document.documentElement.classList.contains('calm'); }
  function wakeFields() { if (!rafOn) { rafOn = true; requestAnimationFrame(tick); } }
  function addField(hero) { var f = new SearchField(hero); fields.push(f); wakeFields(); }
  window.addEventListener('scroll', wakeFields, { passive: true });
  document.addEventListener('visibilitychange', wakeFields);
  window.addEventListener('resize', function () { fields.forEach(function (f) { if (!f.hero.closest('.page').hidden) f.reset(); }); });
  function enterPage(p) {
    p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter');
    var f = fields.filter(function (x) { return x.hero.closest('.page') === p; })[0];
    if (f) { f.reset(); } wakeFields();
  }

  document.addEventListener('pointermove', function (e) {
    if (RM || e.pointerType !== 'mouse') return;
    var pl = e.target.closest && e.target.closest('header.hero'); var f = pl && $('.plate', pl); if (!f) return;
    var r = pl.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    f.style.transform = 'perspective(900px) rotateY(' + (x * 7).toFixed(2) + 'deg) rotateX(' + (-y * 6).toFixed(2) + 'deg) translateY(-4px)';
  });
  document.addEventListener('pointerout', function (e) { if (e.target.closest && e.target.matches('header.hero') && !e.relatedTarget?.closest?.('header.hero')) { var f = $('.plate', e.target); if (f) f.style.transform = ''; } });
  function show() {
    var id = location.hash.replace('#', '') || 'start', p = document.getElementById(id);
    if (!p || !p.classList.contains('page')) { id = 'start'; p = document.getElementById(id); }
    pages.forEach(function (x) { x.hidden = x !== p; });
    buildSub(p); buildHero(p); refreshDone(); enterPage(p);
    lastY = 0; setHidden(false); setTimeout(adaptNav, 80);
    window.__sims = sims;
    $$('.sim', p).forEach(function (el) { if (!el.__sim) { el.__sim = new Sim(el); if (el.id) sims[el.id] = el.__sim; } });
    $$('[data-widget]', p).forEach(function (el) { if (!el.__w && WIDGETS[el.dataset.widget]) { el.__w = 1; WIDGETS[el.dataset.widget](el); } });
    if (current !== id) { window.scrollTo(0, 0); requestAnimationFrame(function () { window.scrollTo(0, 0); }); setTimeout(function () { window.scrollTo(0, 0); }, 60); current = id; }
  }

  /* ---------------- widgets ---------------- */
  var WIDGETS = {};
  Object.assign(WIDGETS, window.EXTRA_WIDGETS || {});
  WIDGETS.quiz = function (el) {
    var qs = QUIZ[el.dataset.set] || [], o = '';
    qs.forEach(function (q, i) {
      o += '<div class="card q"><span class="k">Question ' + (i + 1) + ' of ' + qs.length + '</span><p>' + q.q + '</p><div class="opts">' + q.o.map(function (t, j) { return '<button type="button" data-q="' + i + '" data-j="' + j + '">' + t + '</button>'; }).join('') + '</div><p class="why" hidden></p></div>';
    });
    el.innerHTML = '<p class="mono" data-r="score" style="font-size:.8rem;color:var(--muted);grid-column:1/-1"></p>' + o;
    var got = {};
    function score() { var r = 0; for (var k in got) if (got[k]) r++; $('[data-r=score]', el).textContent = 'Score: ' + r + ' of ' + qs.length + ' right first time. Answered ' + Object.keys(got).length + '.'; }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-q]'); if (!b) return;
      var i = +b.dataset.q, j = +b.dataset.j, q = qs[i], card = b.closest('.q'), why = $('.why', card);
      if (!(i in got)) got[i] = j === q.a;
      $$('button', card).forEach(function (x) { x.classList.remove('wrong'); if (+x.dataset.j === q.a && j === q.a) x.classList.add('right'); });
      b.classList.add(j === q.a ? 'right' : 'wrong');
      why.hidden = false; why.innerHTML = (j === q.a ? '<b class="yes">Correct.</b> ' : '<b class="no">Not quite.</b> ') + q.w;
      score();
    });
    score();
  };
  WIDGETS.hcheck = function (el) {
    var keys = el.dataset.graphs.split(','), o = '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><label class="mono" style="font-size:.74rem;color:var(--muted)">GRAPH <select data-r="g" style="border:1px solid var(--rule);border-radius:8px;padding:5px 8px;background:var(--surface)">' + keys.map(function (k) { return '<option value="' + k + '">' + esc(GRAPHS[k].name) + '</option>'; }).join('') + '</select></label></div><div class="cols" style="align-items:start"><div class="figure" data-r="fig"></div><div style="display:flex;flex-direction:column;gap:10px;min-width:0" data-r="out"></div></div>';
    el.innerHTML = o;
    var sel = $('[data-r=g]', el);
    function go() {
      var G = GRAPHS[sel.value], N = Object.keys(G.nodes), hs = {}, INF = 1e9;
      N.forEach(function (k) { hs[k] = k === G.goal ? 0 : INF; });
      for (var it = 0; it < N.length; it++) G.edges.forEach(function (e) { if (hs[e[1]] + e[2] < hs[e[0]]) hs[e[0]] = hs[e[1]] + e[2]; if (!G.dir && hs[e[0]] + e[2] < hs[e[1]]) hs[e[1]] = hs[e[0]] + e[2]; });
      var adm = true, con = true, t1 = '', t2 = '';
      N.forEach(function (k) { var h = G.nodes[k][2], ok = h <= hs[k]; if (!ok) adm = false; t1 += '<tr><td class="m"><b>' + k + '</b></td><td class="m">' + h + '</td><td class="m">' + (hs[k] >= INF ? '&infin;' : hs[k]) + '</td><td class="' + (ok ? 'yes' : 'no') + '">' + (ok ? h + ' &le; ' + (hs[k] >= INF ? '&infin;' : hs[k]) : h + ' &gt; ' + hs[k] + ': overestimates') + '</td></tr>'; });
      G.edges.forEach(function (e) { var d = G.nodes[e[0]][2] - G.nodes[e[1]][2], ok = d <= e[2]; if (!ok) con = false; t2 += '<tr><td class="m">' + e[0] + ' &#8594; ' + e[1] + '</td><td class="m">' + G.nodes[e[0]][2] + ' &minus; ' + G.nodes[e[1]][2] + ' = ' + d + '</td><td class="m">' + e[2] + '</td><td class="' + (ok ? 'yes' : 'no') + '">' + (ok ? 'OK' : d + ' &gt; ' + e[2] + ': breaks') + '</td></tr>'; });
      $('[data-r=fig]', el).innerHTML = drawGraph(G, null, null);
      $('[data-r=out]', el).innerHTML = '<p class="big">Admissible: <span class="' + (adm ? 'yes' : 'no') + '">' + (adm ? 'yes' : 'no') + '</span> &middot; Consistent: <span class="' + (con ? 'yes' : 'no') + '">' + (con ? 'yes' : 'no') + '</span></p>' +
        '<p class="note">' + (con ? 'Consistent, so A* graph search is guaranteed optimal here (and so is tree search, since consistent implies admissible).' : adm ? '<b>Admissible but not consistent.</b> A* tree search is still optimal, but A* graph search can return a worse path. Look at the edge marked &ldquo;breaks&rdquo;.' : '<b>Not admissible.</b> Even A* tree search may return a worse path.') + '</p>' +
        '<details class="exam" open><summary>Admissibility: h(n) &le; h*(n), the true cheapest cost to the goal</summary><div class="in"><div class="scroll"><table><thead><tr><th>Node</th><th>h(n)</th><th>h*(n) true cost</th><th>Check</th></tr></thead><tbody>' + t1 + '</tbody></table></div></div></details>' +
        '<details class="exam"><summary>Consistency: h(u) &minus; h(v) &le; cost(u, v) on every edge</summary><div class="in"><div class="scroll"><table><thead><tr><th>Edge</th><th>h(u) &minus; h(v)</th><th>cost</th><th>Check</th></tr></thead><tbody>' + t2 + '</tbody></table></div></div></details>';
    }
    sel.addEventListener('change', go); go();
  };
  WIDGETS.puzzle = function (el) {
    var GOAL = [0, 1, 2, 3, 4, 5, 6, 7, 8], START = [7, 2, 4, 5, 0, 6, 8, 3, 1], b = START.slice();
    el.innerHTML = '<div class="puz"><div><p class="mono" style="font-size:.68rem;letter-spacing:.12em;color:var(--muted);margin-bottom:6px">CURRENT (CLICK A TILE NEXT TO THE GAP)</p><div class="board" data-r="b"></div></div><div><p class="mono" style="font-size:.68rem;letter-spacing:.12em;color:var(--muted);margin-bottom:6px">GOAL</p><div class="board">' + GOAL.map(function (t) { return t ? '<div>' + t + '</div>' : '<div class="blank"></div>'; }).join('') + '</div></div><div class="meter"><div class="row"><span>h1: tiles misplaced</span><b data-r="h1"></b></div><div class="row"><span>h2: Manhattan distance</span><b data-r="h2"></b></div><p class="mono" style="font-size:.78rem;color:var(--muted)" data-r="d"></p><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" type="button" data-r="reset">Slide 25 start</button><button class="btn" type="button" data-r="mix">Shuffle 3 moves</button></div></div></div>';
    function draw() {
      var h1 = 0, h2 = 0, parts = [];
      b.forEach(function (t, i) { if (!t) return; var g = GOAL.indexOf(t); if (g !== i) h1++; var d = Math.abs(Math.floor(i / 3) - Math.floor(g / 3)) + Math.abs(i % 3 - g % 3); h2 += d; parts.push(t + ':' + d); });
      var z = b.indexOf(0);
      $('[data-r=b]', el).innerHTML = b.map(function (t, i) { if (!t) return '<div class="blank"></div>'; var adj = Math.abs(Math.floor(i / 3) - Math.floor(z / 3)) + Math.abs(i % 3 - z % 3) === 1; return '<button type="button" data-i="' + i + '" class="' + (GOAL.indexOf(t) !== i ? 'mis' : '') + '"' + (adj ? '' : ' disabled') + ' aria-label="Tile ' + t + '">' + t + '</button>'; }).join('');
      $('[data-r=h1]', el).textContent = h1; $('[data-r=h2]', el).textContent = h2;
      $('[data-r=d]', el).textContent = 'Manhattan per tile: ' + parts.sort().join(', ');
    }
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-i]'); if (t) { var i = +t.dataset.i, z = b.indexOf(0); b[z] = b[i]; b[i] = 0; draw(); }
      if (e.target.closest('[data-r=reset]')) { b = START.slice(); draw(); }
      if (e.target.closest('[data-r=mix]')) { b = GOAL.slice(); for (var k = 0; k < 3; k++) { var z = b.indexOf(0), opts = [z - 3, z + 3, z % 3 ? z - 1 : -1, z % 3 < 2 ? z + 1 : -1].filter(function (x) { return x >= 0 && x < 9; }); var n = opts[Math.floor(Math.random() * opts.length)]; b[z] = b[n]; b[n] = 0; } draw(); }
    });
    draw();
  };
  WIDGETS.builder = function (el) {
    var keys = el.dataset.graphs.split(','), d = 0, timer = null;
    el.innerHTML = '<div class="sim"><div class="sim-top"><label class="f">GRAPH <select data-r="g">' + keys.map(function (k) { return '<option value="' + k + '">' + esc(GRAPHS[k].name) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="ctrl"><button class="btn" type="button" data-r="z"><svg viewBox="0 0 24 24"><path d="M4 4v6h6"/><path d="M4.5 15a8 8 0 1 0 2-8.5L4 10"/></svg>Restart</button><button class="btn" type="button" data-r="p"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Back</button><button class="btn pri" type="button" data-r="n">Next level<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button><button class="btn" type="button" data-r="a">Show all</button><input type="range" min="0" value="0" data-r="rg" aria-label="Level"><span class="cnt" data-r="cnt" style="width:auto"></span></div>' +
      '<div class="sim-body bsplit"><div class="viz"><div class="tabs"><span class="tlabel">State graph</span></div><div class="canvas" data-r="g1"></div><div class="legend"><span><i style="border-color:var(--A);background:var(--Abg)"></i>already in the tree</span><span><i style="border-color:var(--W);background:var(--Wbg)"></i>added at this level</span><span><i style="border-color:var(--hl)"></i>arrow used just now</span></div></div>' +
      '<div class="viz" style="border-right:0"><div class="tabs"><span class="tlabel">Search tree so far &middot; under a node: g, the path cost</span></div><div class="canvas tall" data-r="g2"></div><div class="legend"><span><i style="border-color:var(--W);background:var(--Wbg)"></i>new level</span><span><i style="border-color:var(--G);background:var(--G)"></i>goal: a leaf</span><span>small grey numbers: edge costs</span></div></div></div>' +
      '<div class="say" data-r="say" style="margin:0 16px 16px"></div></div>';
    var sel = $('[data-r=g]', el), rg = $('[data-r=rg]', el);
    function draw() {
      var G = GRAPHS[sel.value], ns = fullTree(G), maxD = Math.max.apply(null, ns.map(function (n) { return n.depth; }));
      d = Math.max(0, Math.min(d, maxD)); rg.max = maxD; rg.value = d;
      var lit = { st: {}, e: {} }, byId = {};
      ns.forEach(function (n) { byId[n.id] = n; });
      ns.forEach(function (n) { if (n.depth < d) lit.st[n.s] = 'done'; });
      ns.forEach(function (n) { if (n.depth === d) { lit.st[n.s] = 'open'; if (n.parent !== null) lit.e[byId[n.parent].s + '>' + n.s] = 1; } });
      $('[data-r=g1]', el).innerHTML = drawGraph(G, null, null, { lit: lit });
      $('[data-r=g2]', el).innerHTML = drawFull(G, { upto: d, level: d, valKey: G.fOnly ? 'f' : 'g', cost: !G.fOnly });
      var lvl = ns.filter(function (n) { return n.depth === d; }), cnt = {};
      ns.filter(function (n) { return n.depth <= d; }).forEach(function (n) { cnt[n.s] = (cnt[n.s] || 0) + 1; });
      var rep = Object.keys(cnt).filter(function (k) { return cnt[k] > 1; });
      var t = d === 0 ? 'Level 0 is just the start state <b>' + G.start + '</b>, with g = 0. Every tree is built down from here.' :
        'Level ' + d + ': for every node on level ' + (d - 1) + ', draw one child for each arrow leaving its state (alphabetical, left to right), skipping states already on that path. ' +
        'New nodes: ' + lvl.map(function (n) { return '<b>' + n.key + '</b> (g = ' + n.g + ')'; }).join(', ') + '.';
      if (lvl.some(function (n) { return n.s === G.goal; })) t += ' A goal node is a <b>leaf</b>: that branch stops there.';
      if (rep.length) t += ' Notice ' + rep.map(function (k) { return '<b>' + k + '</b> appears ' + cnt[k] + ' times'; }).join(', ') + ': each copy is a different path, so it is a different tree node.';
      if (d === maxD) t += ' <b>The tree is complete.</b> Now run any search on it: switch a visualiser to the Full search tree view.';
      var say = $('[data-r=say]', el); say.className = 'say' + (d === maxD ? ' goal' : ''); say.innerHTML = '<span class="kind">LEVEL ' + d + ' OF ' + maxD + '</span><p>' + t + '</p>';
      void say.offsetWidth; say.classList.add('flash');
      $('[data-r=cnt]', el).textContent = ns.filter(function (n) { return n.depth <= d; }).length + ' of ' + ns.length + ' tree nodes drawn';
      $('[data-r=p]', el).disabled = d === 0; $('[data-r=z]', el).disabled = d === 0; $('[data-r=n]', el).disabled = d === maxD; $('[data-r=a]', el).disabled = d === maxD;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function go(n) { stop(); d = n; draw(); }
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-r=p]')) go(d - 1);
      if (e.target.closest('[data-r=n]')) go(d + 1);
      if (e.target.closest('[data-r=z]')) go(0);
      if (e.target.closest('[data-r=a]')) { stop(); timer = setInterval(function () { d++; draw(); if (+rg.value >= +rg.max) stop(); }, 650); }
    });
    rg.addEventListener('input', function () { go(+this.value); });
    el.tabIndex = -1;
    el.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(d + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(d - 1); } });
    sel.addEventListener('change', function () { go(0); });
    draw();
  };
  WIDGETS.readout = function (el) {
    var gs = el.dataset.graphs.split(','), algs = ['BFS', 'DFS', 'UCS'], cg = gs[0], ca = 'UCS';
    el.innerHTML = '<div class="sim"><div class="sim-top"><div class="seg" data-r="a">' + algs.map(function (a) { return '<button type="button" data-v="' + a + '">' + ALG[a].short + '</button>'; }).join('') + '</div><label class="f">GRAPH <select data-r="g">' + gs.map(function (k) { return '<option value="' + k + '">' + esc(GRAPHS[k].name) + '</option>'; }).join('') + '</select></label></div><div class="rdgrid"><div class="figure" data-r="fig"></div><div data-r="out" style="display:flex;flex-direction:column;gap:12px;min-width:0"></div></div><div style="padding:0 16px 16px;display:flex;flex-direction:column;gap:10px" data-r="snap"></div></div>';
    function go() {
      var G = GRAPHS[cg], R = runSearch(G, ca, { mode: 'tree' });
      $$('[data-r=a] button', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === ca)); });
      $('[data-r=fig]', el).innerHTML = drawGraph(G, null, null);
      var rows = '', A = ALG[ca];
      R.T.forEach(function (n) { if (n.parent === null) return; rows += '<tr><td class="m"><b>' + n.s + '</b>(' + R.T[n.parent].s + ')</td><td class="m">' + esc(n.path.join('-')) + '</td><td class="m">' + n.g + '</td></tr>'; });
      $('[data-r=out]', el).innerHTML = readHTML(R) + '<details class="exam"><summary>Every entry, both notations</summary><div class="in"><div class="scroll"><table><thead><tr><th>node(parent)</th><th>whole path</th><th>g</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></details>';
      $('[data-r=snap]', el).innerHTML = '<p class="mono" style="font-size:.66rem;letter-spacing:.1em;color:var(--muted)">THE ' + (A.ds === 'queue' ? 'QUEUE' : A.ds === 'stack' ? 'STACK' : 'PRIORITY QUEUE') + ', STEP BY STEP</p>' + snapsHTML(R);
    }
    el.addEventListener('click', function (e) { var b = e.target.closest('[data-r=a] button'); if (b) { ca = b.dataset.v; go(); } });
    $('[data-r=g]', el).addEventListener('change', function () { cg = this.value; go(); });
    go();
  };
  WIDGETS.aitype = function (el) {
    var K = ['Thinking humanly', 'Thinking rationally', 'Acting humanly', 'Acting rationally'];
    var IT = [['Siri telling a joke', 2], ['AI solving a maths theorem logically', 1], ['AI modelling human memory errors', 0], ['Self-driving car deciding when to stop', 3],
      ['ChatGPT writing in a friendly tone', 2], ['Netflix recommending a movie', 3], ['Customer-service bot apologising politely', 2], ['Google Maps avoiding traffic', 3]];
    el.innerHTML = '<span class="k">Pick a box for each. The slide&rsquo;s answers are the key.</span>' + IT.map(function (it, i) {
      return '<div class="aiq"><b>' + it[0] + '</b><div class="q"><div class="opts">' + K.map(function (k, j) { return '<button type="button" data-i="' + i + '" data-j="' + j + '">' + k + '</button>'; }).join('') + '</div></div></div>';
    }).join('');
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]'); if (!b) return;
      var it = IT[+b.dataset.i], row = b.closest('.aiq');
      $$('button', row).forEach(function (x) { x.disabled = true; if (+x.dataset.j === it[1]) x.classList.add('right'); });
      if (+b.dataset.j !== it[1]) b.classList.add('wrong');
    });
  };
  WIDGETS.vacuum = function (el) {
    var s;
    function reset() { s = { loc: 'A', dirt: { A: true, B: true }, t: 0, score: 0, last: '' }; }
    el.innerHTML = '<div class="sim"><div class="ctrl"><button class="btn pri" type="button" data-r="step">Step</button><button class="btn" type="button" data-r="dirt">Drop dirt</button><button class="btn" type="button" data-r="reset">Reset</button><span class="cnt" data-r="cnt" style="width:auto"></span></div><div class="sim-body"><div class="viz"><div class="canvas" data-r="c" style="height:220px"></div></div><div class="side"><div class="regs" data-r="regs"></div><div class="say" data-r="say"></div></div></div></div>';
    function act() { return s.dirt[s.loc] ? 'Suck' : s.loc === 'A' ? 'Right' : 'Left'; }
    function draw() {
      var o = '<svg class="gsvg gfull" viewBox="0 0 420 180" width="420" role="img" aria-label="Vacuum world">';
      ['A', 'B'].forEach(function (k, i) {
        var x = 30 + i * 190;
        o += '<rect x="' + x + '" y="30" width="170" height="120" rx="8" style="fill:var(--bg);stroke:var(--rule);stroke-width:2"/><text class="startlbl" x="' + (x + 85) + '" y="22">SQUARE ' + k + '</text>';
        if (s.dirt[k]) for (var d = 0; d < 7; d++) o += '<circle cx="' + (x + 30 + (d * 37) % 120) + '" cy="' + (60 + (d * 23) % 70) + '" r="5" style="fill:var(--W)"/>';
      });
      var rx = s.loc === 'A' ? 115 : 305;
      o += '<g><circle cx="' + rx + '" cy="90" r="26" style="fill:var(--S)"/><rect x="' + (rx - 14) + '" y="80" width="28" height="8" rx="3" style="fill:var(--on-fill)"/><circle cx="' + (rx - 8) + '" cy="100" r="3" style="fill:var(--on-fill)"/><circle cx="' + (rx + 8) + '" cy="100" r="3" style="fill:var(--on-fill)"/></g>';
      $('[data-r=c]', el).innerHTML = o + '</svg>';
      var per = '[' + s.loc + ', ' + (s.dirt[s.loc] ? 'Dirty' : 'Clean') + ']';
      $('[data-r=regs]', el).innerHTML = '<div class="reg"><span>Percept</span><b>' + per + '</b></div><div class="reg"><span>Rule chooses</span><b>' + act() + '</b></div><div class="reg"><span>Time step</span><b>' + s.t + '</b></div><div class="reg"><span>Score</span><b>' + s.score + '</b></div>';
      $('[data-r=say]', el).innerHTML = '<span class="kind">AGENT FUNCTION</span><p>' + (s.last || 'Dirty square: suck. Clean square: move to the other one. Press Step.') + '</p>';
      $('[data-r=cnt]', el).textContent = 'score = clean squares, added each step';
    }
    el.addEventListener('click', function (e) {
      var r = e.target.closest('[data-r]'); if (!r) return;
      if (r.dataset.r === 'step') { var a = act(), per = '[' + s.loc + ', ' + (s.dirt[s.loc] ? 'Dirty' : 'Clean') + ']'; if (a === 'Suck') s.dirt[s.loc] = false; else s.loc = s.loc === 'A' ? 'B' : 'A'; s.t++; s.score += (!s.dirt.A ? 1 : 0) + (!s.dirt.B ? 1 : 0); s.last = 'Percept ' + per + ', so the action is <b>' + a + '</b>.'; draw(); }
      if (r.dataset.r === 'dirt') { var k = Math.random() < .5 ? 'A' : 'B'; s.dirt[k] = true; s.last = 'Dirt appeared in ' + k + ' by itself. The next state was not fixed by the state and the action: that makes the world <b>stochastic</b> (slide 28).'; draw(); }
      if (r.dataset.r === 'reset') { reset(); draw(); }
    });
    reset(); draw();
  };
  WIDGETS.peas = function (el) {
    var S = [
      ['Taxi driver (slide 20)', 'Safe, fast, legal, comfortable trip; maximise profits', 'Roads, other traffic, pedestrians, customers', 'Steering, accelerator, brake, signal, horn, display', 'Cameras, sonar, speedometer, GPS, odometer, accelerometer, engine sensors, keyboard'],
      ['Medical diagnosis system', 'Healthy patient, reduced costs', 'Patient, hospital, staff', 'Display of questions, tests, diagnoses, treatments, referrals', 'Keyboard entry of symptoms, findings, patient&rsquo;s answers'],
      ['Satellite image analysis', 'Correct image categorisation', 'Downlink from orbiting satellite', 'Display of scene categorisation', 'Colour pixel arrays'],
      ['Part-picking robot', 'Percentage of parts in correct bins', 'Conveyor belt with parts; bins', 'Jointed arm and hand', 'Camera, joint angle sensors'],
      ['Refinery controller', 'Purity, yield, safety', 'Refinery, operators', 'Valves, pumps, heaters, displays', 'Temperature, pressure, chemical sensors'],
      ['Interactive English tutor', 'Student&rsquo;s score on test', 'Set of students, testing agency', 'Display of exercises, suggestions, corrections', 'Keyboard entry'],
      ['Hospital delivery robot (Fall 2025 Q1a)', 'Correct medicine to the right room; minimum battery used; no collisions', 'Corridors, intersections, rooms; pharmacy (start); patient rooms (goal)', 'Wheel and steering motors; arm or gripper', 'Camera, distance sensors (blocked corridors), battery sensor, location sensor'],
      ['Robot soccer player (slide 22)', 'Goals scored minus conceded; matches won', 'Field, ball, goals, teammates, opponents, referee', 'Legs or wheels, kicker, camera turn', 'Camera, ball and distance sensors, orientation sensor, team signals'],
      ['Internet shopping agent (Summer 2026 Q1b)', 'Low price, matches preferences, short delivery, correct order', 'Websites, vendors, shipping and payment systems, the user', 'Display results, follow links, fill forms, place order', 'Web page contents, the user&rsquo;s preferences (keyboard)']
    ], hide = false;
    el.innerHTML = '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><select data-r="s" aria-label="Scenario" style="border:1px solid var(--rule);border-radius:6px;padding:6px 8px;background:var(--surface)">' + S.map(function (x, i) { return '<option value="' + i + '">' + x[0] + '</option>'; }).join('') + '</select><button class="btn" type="button" data-r="h">Hide answers</button></div><div class="peasgrid" data-r="g"></div>';
    function draw() {
      var x = S[+$('[data-r=s]', el).value], L = ['P &middot; Performance', 'E &middot; Environment', 'A &middot; Actuators', 'S &middot; Sensors'];
      $('[data-r=g]', el).innerHTML = L.map(function (l, i) { return '<div class="pcell' + (hide ? ' covered' : '') + '" tabindex="0" role="button" aria-label="' + l.replace('&middot;', '') + '"><span class="k">' + l + '</span><p>' + x[i + 1] + '</p></div>'; }).join('');
      $('[data-r=h]', el).textContent = hide ? 'Show answers' : 'Hide answers';
    }
    el.addEventListener('click', function (e) { if (e.target.closest('[data-r=h]')) { hide = !hide; draw(); } var c = e.target.closest('.pcell.covered'); if (c) c.classList.remove('covered'); });
    $('[data-r=s]', el).addEventListener('change', draw); draw();
  };
  WIDGETS.envtable = function (el) {
    var E = [['Crossword puzzle', 'Fully', 'Single', 'Deterministic', 'Sequential', 'Static', 'Discrete'], ['Chess with a clock', 'Fully', 'Multi', 'Deterministic', 'Sequential', 'Semi', 'Discrete'],
      ['Poker', 'Partially', 'Multi', 'Stochastic', 'Sequential', 'Static', 'Discrete'], ['Backgammon', 'Fully', 'Multi', 'Stochastic', 'Sequential', 'Static', 'Discrete'],
      ['Taxi driving', 'Partially', 'Multi', 'Stochastic', 'Sequential', 'Dynamic', 'Continuous'], ['Medical diagnosis', 'Partially', 'Single', 'Stochastic', 'Sequential', 'Dynamic', 'Continuous'],
      ['Image analysis', 'Fully', 'Single', 'Deterministic', 'Episodic', 'Semi', 'Continuous'], ['Part-picking robot', 'Partially', 'Single', 'Stochastic', 'Episodic', 'Dynamic', 'Continuous'],
      ['Refinery controller', 'Partially', 'Single', 'Stochastic', 'Sequential', 'Dynamic', 'Continuous'], ['Interactive English tutor', 'Partially', 'Multi', 'Stochastic', 'Sequential', 'Dynamic', 'Discrete']];
    var HARD = ['Partially', 'Multi', 'Stochastic', 'Sequential', 'Dynamic', 'Continuous'], hide = false;
    el.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-r="h">Hide answers</button><button class="btn" type="button" data-r="a">Reveal all</button><span class="mono" style="font-size:.72rem;color:var(--muted);align-self:center">green easy &middot; red hard &middot; amber semi</span></div><div class="scroll"><table class="envt"><thead><tr><th>Environment</th><th>Observable</th><th>Agents</th><th>Deterministic</th><th>Episodic</th><th>Static</th><th>Discrete</th><th>Hard</th></tr></thead><tbody data-r="b"></tbody></table></div>';
    function draw() {
      $('[data-r=b]', el).innerHTML = E.map(function (r) {
        var hard = r.slice(1).filter(function (v) { return HARD.indexOf(v) >= 0; }).length;
        return '<tr><td><b>' + r[0] + '</b></td>' + r.slice(1).map(function (v) { var c = v === 'Semi' ? 'semi' : HARD.indexOf(v) >= 0 ? 'hard' : 'easy'; return '<td class="c ' + c + (hide ? ' cov' : '') + '">' + v + '</td>'; }).join('') + '<td class="m">' + hard + ' / 6</td></tr>';
      }).join('');
      $('[data-r=h]', el).textContent = hide ? 'Show answers' : 'Hide answers';
    }
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-r=h]')) { hide = !hide; draw(); }
      if (e.target.closest('[data-r=a]')) { hide = false; draw(); }
      var c = e.target.closest('td.cov'); if (c) c.classList.remove('cov');
    });
    draw();
  };
  WIDGETS.bidircalc = function (el) {
    el.innerHTML = '<span class="k">How much does meeting in the middle save?</span><div class="calc"><label>Branching factor b <input type="range" min="2" max="12" value="10" data-r="b"><b data-r="bv"></b></label><label>Solution depth d <input type="range" min="2" max="12" step="2" value="6" data-r="d"><b data-r="dv"></b></label></div><div class="regs" data-r="o"></div><p class="mono" style="font-size:.72rem;color:var(--muted)">My illustration of slide 41: O(b<sup>d</sup>) against 2&middot;b<sup>d/2</sup>.</p>';
    function fmt(n) { return n >= 1e9 ? n.toExponential(2) : Math.round(n).toLocaleString('en-US'); }
    function go() {
      var b = +$('[data-r=b]', el).value, d = +$('[data-r=d]', el).value, x = Math.pow(b, d), y = 2 * Math.pow(b, d / 2);
      $('[data-r=bv]', el).textContent = b; $('[data-r=dv]', el).textContent = d;
      $('[data-r=o]', el).innerHTML = '<div class="reg"><span>BFS: b^d</span><b>' + fmt(x) + '</b></div><div class="reg"><span>Bidirectional: 2 b^(d/2)</span><b>' + fmt(y) + '</b></div><div class="reg"><span>Times fewer nodes</span><b>' + fmt(x / y) + '&times;</b></div>';
    }
    $$('input', el).forEach(function (i) { i.addEventListener('input', go); }); go();
  };
  WIDGETS.ladder = function (el) {
    var R = runSearch(GRAPHS[el.dataset.graph], 'IDASTAR', {});
    el.innerHTML = R.rows.map(function (r) { var win = typeof r.next === 'string'; return '<div class="rung' + (win ? ' win' : '') + '"><span>ITERATION ' + r.it + '</span><b>threshold ' + r.thr + '</b><span>' + (win ? 'goal found' : 'cut: ' + r.cut + ' &#8594; next ' + r.next) + '</span></div>'; }).join('');
  };
  WIDGETS.sma = function (el) {
    var i = 0, S = SMA_STEPS;
    el.innerHTML = '<div class="sim"><div class="sim-body"><div class="viz"><div class="canvas" data-r="c"></div><div class="legend">' + LEGEND + '<span><i style="border-color:var(--muted);border-style:dashed"></i>dropped from memory</span><span><i style="border-color:var(--R);background:var(--Rbg);border-style:dashed"></i>worst leaf</span></div></div><div class="side"><div><div class="panel-h"><span>Memory: 3 slots</span></div><div class="ram" data-r="ram"></div></div><div class="say" data-r="say"></div></div></div><div class="ctrl"><button class="btn" type="button" data-r="p"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Back</button><button class="btn pri" type="button" data-r="n">Next<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button><span class="cnt" data-r="cnt"></span></div></div>';
    function draw() {
      var s = S[i], o = '<svg class="gsvg" viewBox="0 0 520 260" width="520" role="img" aria-label="SMA* tree">';
      var pos = {}; s.t.forEach(function (n) { pos[n[0]] = n; });
      s.t.forEach(function (n) { if (n[5]) { var p = pos[n[5]]; o += '<line class="tedge ' + (n[4] === 'forgot' ? 'forgot' : n[4] === 'path' ? 'sol' : '') + '" x1="' + p[2] + '" y1="' + p[3] + '" x2="' + n[2] + '" y2="' + n[3] + '"/>'; } });
      s.t.forEach(function (n) { o += '<g class="node ' + n[4] + '"><circle cx="' + n[2] + '" cy="' + n[3] + '" r="17"/><text class="l" x="' + n[2] + '" y="' + (n[3] + 1) + '">' + n[0].charAt(0) + '</text><text class="tval" x="' + n[2] + '" y="' + (n[3] + 32) + '">f=' + n[1] + '</text></g>'; });
      $('[data-r=c]', el).innerHTML = o + '</svg>';
      $('[data-r=ram]', el).innerHTML = s.ram.map(function (r, k) { return '<div class="' + (r ? (i === S.length - 1 ? 'goalr' : 'full') : '') + '"><span>SLOT ' + (k + 1) + '</span>' + (r || 'empty') + '</div>'; }).join('');
      var sy = $('[data-r=say]', el); sy.className = 'say' + (i === S.length - 1 ? ' goal' : s.bad ? ' bad' : '');
      sy.innerHTML = '<span class="kind">STEP ' + (i + 1) + ' &middot; ' + s.k + '</span><p>' + s.x + '</p>';
      $('[data-r=cnt]', el).textContent = 'step ' + (i + 1) + ' / ' + S.length;
      $('[data-r=p]', el).disabled = i === 0; $('[data-r=n]', el).disabled = i === S.length - 1;
    }
    el.addEventListener('click', function (e) { if (e.target.closest('[data-r=p]') && i > 0) { i--; draw(); } if (e.target.closest('[data-r=n]') && i < S.length - 1) { i++; draw(); } });
    draw();
  };
  WIDGETS.paper = function (el) {
    var G = GRAPHS[el.dataset.graph];
    var fig = $('.figure', el); if (fig) fig.innerHTML = drawGraph(G, null, null);
    var ft = $('.fulltree', el); if (ft) ft.innerHTML = '<p class="mono" style="font-size:.66rem;letter-spacing:.1em;color:var(--muted);margin-bottom:4px">TREE REPRESENTATION (' + (G.fOnly ? 'f' : G.inf ? 'f = g + h' : 'g, the path cost,') + ' UNDER EACH NODE)</p>' + drawFull(G, { valKey: G.inf && !G.fOnly ? 'f' : (G.fOnly ? 'f' : 'g'), cost: !G.fOnly });
    $$('[data-run]', el).forEach(function (box) {
      var c = box.dataset.run.split(','), R = runSearch(G, c[0], { mode: c[1] || 'tree' });
      box.innerHTML = examHTML(R) + '<div><button class="btn" type="button" data-lab="' + el.dataset.graph + ',' + c[0] + ',' + (c[1] || 'tree') + '">Step through it in the lab</button></div>';
    });
  };
  /* the graph and tree editor for the lab lives in editor.js */

  /* ---------------- theme ---------------- */
  function calmInit() {
    var btn = $('#calmBtn'); if (!btn) return;
    var ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="9" r="1.6"/><circle cx="8" cy="17" r="1.6"/><circle cx="17" cy="18" r="1.6"/><path d="M6.4 6.6l4.2-1.2M13.5 5.6l4.1 2.6M5.8 8.4l1.6 7.1M9.6 17.2l5.8.7M18.6 10.5l-1.2 6"/></svg>';
    var OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="7" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="9" r="1.6"/><circle cx="8" cy="17" r="1.6"/><circle cx="17" cy="18" r="1.6"/><path d="M3.5 3.5l17 17"/></svg>';
    function paint() {
      var c = CALM(); btn.innerHTML = c ? OFF : ON; btn.setAttribute('aria-pressed', c ? 'true' : 'false');
      btn.setAttribute('aria-label', c ? 'Turn background animation on' : 'Turn background animation off');
      btn.title = c ? 'Background: off' : 'Background: on';
    }
    if (store('cse3811-calm') === '1') document.documentElement.classList.add('calm');
    btn.addEventListener('click', function () {
      var c = !CALM(); document.documentElement.classList.toggle('calm', c); store('cse3811-calm', c ? '1' : '0'); paint();
      if (!c) wakeFields();
    });
    paint();
  }
  function themeInit() {
    var t = store('cse3811-theme'); if (t === 'light' || t === 'dark' || t === 'black') document.documentElement.setAttribute('data-theme', t);
    var btn = $('#themeBtn'), mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>';
    var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
    function cur() { return document.documentElement.getAttribute('data-theme') || (mq && mq.matches ? 'dark' : 'light'); }
    var BLACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor"/></svg>';
    var NEXT = { light: 'dark', dark: 'black', black: 'light' }, NAME = { light: 'paper', dark: 'dark', black: 'charcoal' };
    function paint() {
      var nx = NEXT[cur()] || 'dark';
      btn.innerHTML = nx === 'light' ? SUN : nx === 'black' ? BLACK : MOON;
      btn.setAttribute('aria-label', 'Switch to ' + NAME[nx] + ' theme');
      btn.title = 'Theme: ' + NAME[cur()] + ' (next: ' + NAME[nx] + ')';
    }
    btn.addEventListener('click', function () {
      var nx = NEXT[cur()] || 'dark'; document.documentElement.setAttribute('data-theme', nx); store('cse3811-theme', nx); paint();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', paint);
    paint();
  }
  /* ---------- floating nav: adapts to what is behind it, hides on scroll down ---------- */
  var topBar = $('.top'), handle = $('.nav-handle'), lastY = 0, ticking = false;
  function setHidden(h) { topBar.classList.toggle('hide', h); document.body.classList.toggle('nav-off', h); }
  function adaptNav() {
    var r = topBar.getBoundingClientRect(); if (r.bottom < 0) return;
    var y = r.top + r.height / 2, d = 0, l = 0;
    for (var i = 0; i < 7; i++) {
      var x = r.left + r.width * (i + .5) / 7;
      var el = (document.elementsFromPoint ? document.elementsFromPoint(x, y) : []).filter(function (e) { return !topBar.contains(e) && e !== handle && e !== document.documentElement && e !== document.body; })[0];
      if (!el) continue;
      if (el.closest('header.hero, .code')) d++; else l++;
    }
    topBar.classList.toggle('light', d === 0 && l > 0);
    topBar.classList.toggle('scrolled', window.scrollY > 10);
  }
  function onScroll() {
    var y = window.scrollY;
    if (y < 90) setHidden(false);
    else if (Math.abs(y - lastY) > 6) { if (y > lastY) { if (!topBar.matches(':hover') && !topBar.querySelector(':focus-visible')) setHidden(true); } else setHidden(false); }
    if (Math.abs(y - lastY) > 6 || y < 90) lastY = y;
    adaptNav();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', adaptNav);
  handle.addEventListener('click', function () { setHidden(false); lastY = window.scrollY; });
  topBar.addEventListener('focusin', function () { setHidden(false); });
  buildNav(); themeInit(); calmInit();
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName || '')) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var pg = document.getElementById(current), el = pg && $('.sim', pg); if (!el || !el.__sim) return;
    e.preventDefault(); var s = el.__sim; s.stop();
    if (e.key === 'ArrowRight') s.next(); else { s.asking = false; if (s.i > 0) s.i--; s.render(); }
  }); window.addEventListener('hashchange', show); show();
})();
