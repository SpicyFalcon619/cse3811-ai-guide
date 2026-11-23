/* The graph and tree editor for the simulator lab.
   Click to add nodes, drag them around, connect them, type costs and heuristic
   values, and the simulator below follows along. Everything the editor makes is
   also written as plain text (the format on the question papers), and that text
   can be edited and applied back. */
(function () {
  var VW = 640, VH = 380, R = 20, NAMES = 'ABCDEFHIJKLMNOPQRTUVWXYZ';
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function Editor(el) {
    var S = { nodes: {}, edges: [], start: null, goal: null, dir: true, useH: true, tool: 'select', sel: null, selE: -1, from: null, live: true, drag: null, text: false };
    var examples = Object.keys(GRAPHS).filter(function (k) { return k !== 'custom' && !GRAPHS[k].fOnly; });
    el.classList.add('ged');
    el.innerHTML =
      '<div class="ged-bar"><div class="seg" data-g="tool" role="group" aria-label="Tool"><button type="button" data-v="select" title="Select and drag (V)">Select</button><button type="button" data-v="node" title="Click empty space to add a node (N)">Add node</button><button type="button" data-v="edge" title="Click a node, then another (E)">Add edge</button></div>' +
      '<div class="seg" data-g="dir" role="group" aria-label="Edge direction"><button type="button" data-v="1">Directed</button><button type="button" data-v="0">Undirected</button></div>' +
      '<label class="chk"><input type="checkbox" data-g="useh" checked> Heuristic h</label>' +
      '<label class="f">START FROM <select data-g="example" aria-label="Start from an example"><option value="">Choose&hellip;</option><option value="@blank">Blank canvas</option><option value="@tree">Small binary tree</option>' + examples.map(function (k) { return '<option value="' + k + '">' + esc(GRAPHS[k].name) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="ged-main"><div class="ged-stage" data-g="stage"></div><div class="ged-side"><div class="ged-insp" data-g="insp"></div><div class="ged-btns"><button class="btn" type="button" data-g="layout">Auto-layout</button><button class="btn" type="button" data-g="clear">Clear</button><button class="btn" type="button" data-g="textbtn" aria-expanded="false">Text</button></div></div></div>' +
      '<div class="ged-text" data-g="textwrap" hidden><textarea data-g="ta" aria-label="Graph as text" spellcheck="false"></textarea><div class="ged-btns"><button class="btn" type="button" data-g="apply">Apply text</button><span class="ged-hint">One line per fact: <code>S A 3</code> edge, <code>h A 5</code> heuristic, <code>start S</code>, <code>goal G</code>, <code>undirected</code>, <code>pos A 120 80</code> position.</span></div></div>' +
      '<div class="ged-foot"><button class="btn pri" type="button" data-g="run">Run in the simulator</button><label class="chk"><input type="checkbox" data-g="live" checked> Keep the simulator in sync</label><span class="ged-msg" data-g="msg" role="status"></span></div>';
    var G = {}; Array.prototype.forEach.call(el.querySelectorAll('[data-g]'), function (x) { G[x.dataset.g] = x; });

    /* ---------- model ---------- */
    function freeName() { for (var i = 0; i < NAMES.length; i++) if (!S.nodes[NAMES[i]]) return NAMES[i]; var n = 1; while (S.nodes['N' + n]) n++; return 'N' + n; }
    function addNode(x, y, name) {
      name = name || (!S.nodes.S && !S.start ? 'S' : freeName());
      S.nodes[name] = { x: Math.round(Math.max(R, Math.min(VW - R, x))), y: Math.round(Math.max(R + 8, Math.min(VH - R - 14, y))), h: 0 };
      if (!S.start) S.start = name;
      return name;
    }
    function hasEdge(a, b) { return S.edges.some(function (e) { return (e.a === a && e.b === b) || (!S.dir && e.a === b && e.b === a); }); }
    function addEdge(a, b, c) { if (a === b || hasEdge(a, b)) return -1; S.edges.push({ a: a, b: b, c: c === undefined ? 1 : c }); return S.edges.length - 1; }
    function delNode(id) {
      delete S.nodes[id]; S.edges = S.edges.filter(function (e) { return e.a !== id && e.b !== id; });
      if (S.start === id) S.start = null; if (S.goal === id) S.goal = null; S.sel = null; S.selE = -1;
    }
    function layout() {
      var ids = Object.keys(S.nodes); if (!ids.length) return;
      var adj = {}; ids.forEach(function (k) { adj[k] = []; });
      S.edges.forEach(function (e) { adj[e.a].push(e.b); if (!S.dir) adj[e.b].push(e.a); });
      var depth = {}, q = [], roots = S.start && S.nodes[S.start] ? [S.start] : [];
      ids.forEach(function (k) { if (!roots.length && !S.edges.some(function (e) { return e.b === k; })) roots.push(k); });
      if (!roots.length) roots.push(ids[0]);
      roots.forEach(function (r) { depth[r] = 0; q.push(r); });
      while (q.length) { var u = q.shift(); adj[u].forEach(function (v) { if (depth[v] === undefined) { depth[v] = depth[u] + 1; q.push(v); } }); }
      var maxd = 0; ids.forEach(function (k) { if (depth[k] === undefined) depth[k] = 0; maxd = Math.max(maxd, depth[k]); });
      var cols = {}; ids.sort().forEach(function (k) { (cols[depth[k]] = cols[depth[k]] || []).push(k); });
      Object.keys(cols).forEach(function (d) {
        cols[d].forEach(function (k, j) { S.nodes[k].x = Math.round(60 + (maxd ? d * (VW - 120) / maxd : (VW - 120) / 2)); S.nodes[k].y = Math.round((VH - 10) / (cols[d].length + 1) * (j + 1) + 5); });
      });
    }
    function loadExample(key) {
      S.nodes = {}; S.edges = []; S.start = S.goal = null; S.sel = null; S.selE = -1; S.from = null;
      if (key === '@blank') { S.dir = true; return; }
      if (key === '@tree') {
        S.dir = true; S.useH = false;
        var t = { S: [200, 'A', 'B'], A: ['C', 'D'], B: ['E', 'F'] };
        ['S', 'A', 'B', 'C', 'D', 'E', 'F'].forEach(function (k) { S.nodes[k] = { x: 0, y: 0, h: 0 }; });
        Object.keys(t).forEach(function (p) { t[p].forEach(function (c) { if (typeof c === 'string') S.edges.push({ a: p, b: c, c: 1 + (c.charCodeAt(0) % 3) }); }); });
        S.start = 'S'; S.goal = 'F'; layout(); return;
      }
      var g = GRAPHS[key], vb = g.vb.split(' ').map(Number);
      S.dir = g.dir !== false; S.useH = !!g.inf;
      Object.keys(g.nodes).forEach(function (k) { var n = g.nodes[k]; S.nodes[k] = { x: Math.round(n[0] / vb[2] * (VW - 80) + 40), y: Math.round(n[1] / vb[3] * (VH - 80) + 34), h: g.inf ? n[2] : 0 }; });
      g.edges.forEach(function (e) { S.edges.push({ a: e[0], b: e[1], c: e[2] }); });
      S.start = g.start; S.goal = g.goal;
    }
    /* ---------- text form ---------- */
    function toText() {
      var o = []; if (S.start) o.push('start ' + S.start); if (S.goal) o.push('goal ' + S.goal); if (!S.dir) o.push('undirected');
      S.edges.forEach(function (e) { o.push(e.a + ' ' + e.b + ' ' + e.c); });
      if (S.useH) Object.keys(S.nodes).forEach(function (k) { o.push('h ' + k + ' ' + S.nodes[k].h); });
      Object.keys(S.nodes).forEach(function (k) { o.push('pos ' + k + ' ' + S.nodes[k].x + ' ' + S.nodes[k].y); });
      return o.join('\n');
    }
    function fromText(txt) {
      var nodes = {}, edges = [], start = null, goal = null, dir = true, h = {}, pos = {}, bad = [], hs = false;
      txt.split('\n').forEach(function (ln, i) {
        var t = ln.trim().split(/\s+/); if (!t[0] || t[0].charAt(0) === '#') return;
        var w = t[0].toLowerCase();
        if (w === 'start' && t[1]) start = t[1]; else if (w === 'goal' && t[1]) goal = t[1]; else if (w === 'undirected') dir = false; else if (w === 'directed') dir = true;
        else if (w === 'h' && t.length === 3 && !isNaN(+t[2])) { h[t[1]] = +t[2]; hs = true; }
        else if (w === 'pos' && t.length === 4 && !isNaN(+t[2]) && !isNaN(+t[3])) pos[t[1]] = [+t[2], +t[3]];
        else if (t.length === 3 && !isNaN(+t[2])) { edges.push({ a: t[0], b: t[1], c: +t[2] }); nodes[t[0]] = nodes[t[0]] || 1; nodes[t[1]] = nodes[t[1]] || 1; }
        else bad.push(i + 1);
      });
      if (bad.length) return 'Line ' + bad.join(', ') + ' is not understood.';
      var keep = S.nodes; S.nodes = {}; S.edges = []; S.dir = dir; S.useH = hs; S.start = start; S.goal = goal; S.sel = null; S.selE = -1; S.from = null;
      Object.keys(nodes).concat(start && !nodes[start] ? [start] : [], goal && !nodes[goal] ? [goal] : []).forEach(function (k) {
        if (S.nodes[k]) return; var p = pos[k] || (keep[k] ? [keep[k].x, keep[k].y] : null);
        S.nodes[k] = { x: p ? p[0] : 0, y: p ? p[1] : 0, h: h[k] || 0, fresh: !p };
      });
      edges.forEach(function (e) { if (e.a !== e.b && !hasEdge(e.a, e.b)) S.edges.push(e); });
      if (Object.keys(S.nodes).some(function (k) { return S.nodes[k].fresh; })) layout();
      return null;
    }
    /* ---------- checking and the simulator ---------- */
    function problem() {
      if (!Object.keys(S.nodes).length) return 'Click the canvas to add a node.';
      if (!S.edges.length) return 'Add at least one edge: choose Add edge, then click two nodes.';
      if (!S.start || !S.nodes[S.start]) return 'Choose a start node: select a node and press Start.';
      if (!S.goal || !S.nodes[S.goal]) return 'Choose a goal node: select a node and press Goal.';
      return null;
    }
    function build() {
      var N = {}; Object.keys(S.nodes).forEach(function (k) { N[k] = [S.nodes[k].x, S.nodes[k].y, S.useH ? S.nodes[k].h : 0]; });
      GRAPHS.custom = { name: 'Your graph', dir: S.dir, start: S.start, goal: S.goal, vb: '0 0 ' + VW + ' ' + VH, inf: S.useH && Object.keys(S.nodes).some(function (k) { return S.nodes[k].h > 0; }), nodes: N, edges: S.edges.map(function (e) { return [e.a, e.b, e.c]; }) };
    }
    function push() { var sim = window.__sims && window.__sims.labsim; if (sim) sim.set({ graph: 'custom' }); }
    var timer = null;
    function changed(skipText) {
      draw(); var p = problem();
      G.msg.textContent = p || 'Ready. ' + Object.keys(S.nodes).length + ' nodes, ' + S.edges.length + ' edges.'; G.msg.classList.toggle('bad', !!p);
      G.run.disabled = !!p;
      if (!skipText && document.activeElement !== G.ta) G.ta.value = toText();
      if (!p) { build(); if (S.live) { clearTimeout(timer); timer = setTimeout(push, 250); } }
    }
    /* ---------- drawing ---------- */
    function pt(e) { var r = G.stage.firstChild.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * VW, (e.clientY - r.top) / r.height * VH]; }
    function draw() {
      var o = '<svg class="ged-svg tool-' + S.tool + '" viewBox="0 0 ' + VW + ' ' + VH + '" role="application" aria-label="Graph canvas">';
      o += '<defs><marker id="gedArrow" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>';
      S.edges.forEach(function (e, i) {
        var a = S.nodes[e.a], b = S.nodes[e.b]; if (!a || !b) return;
        var dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, sh = S.dir && hasRev(e) ? 7 : 0;
        var x1 = a.x + ux * R - uy * sh, y1 = a.y + uy * R + ux * sh, x2 = b.x - ux * (R + (S.dir ? 3 : 0)) - uy * sh, y2 = b.y - uy * (R + (S.dir ? 3 : 0)) + ux * sh;
        var mx = (a.x + b.x) / 2 - uy * (12 + sh), my = (a.y + b.y) / 2 + ux * (12 + sh);
        o += '<g class="ged-e' + (i === S.selE ? ' sel' : '') + '" data-e="' + i + '"><line class="hit" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/><line class="ln" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + (S.dir ? ' marker-end="url(#gedArrow)"' : '') + '/>';
        o += '<rect x="' + (mx - 11) + '" y="' + (my - 9) + '" width="22" height="18" rx="5"/><text x="' + mx + '" y="' + (my + 1) + '">' + esc(e.c) + '</text></g>';
      });
      Object.keys(S.nodes).forEach(function (k) {
        var n = S.nodes[k], cls = 'ged-n' + (k === S.sel ? ' sel' : '') + (k === S.from ? ' from' : '') + (k === S.start ? ' start' : '') + (k === S.goal ? ' goal' : '');
        o += '<g class="' + cls + '" data-n="' + esc(k) + '"><circle cx="' + n.x + '" cy="' + n.y + '" r="' + R + '"/><text class="nm" x="' + n.x + '" y="' + (n.y + 1) + '">' + esc(k) + '</text>';
        if (S.useH) o += '<text class="hv" x="' + n.x + '" y="' + (n.y + R + 13) + '">h=' + n.h + '</text>';
        if (k === S.start) o += '<text class="tag" x="' + n.x + '" y="' + (n.y - R - 6) + '">START</text>'; else if (k === S.goal) o += '<text class="tag" x="' + n.x + '" y="' + (n.y - R - 6) + '">GOAL</text>';
        o += '</g>';
      });
      if (!Object.keys(S.nodes).length) o += '<text class="empty" x="' + VW / 2 + '" y="' + VH / 2 + '">Click anywhere to add your first node</text>';
      G.stage.innerHTML = o + '</svg>';
    }
    function hasRev(e) { return S.edges.some(function (f) { return f.a === e.b && f.b === e.a; }); }
    /* ---------- the side panel ---------- */
    function panel() {
      var p = G.insp;
      if (S.sel && S.nodes[S.sel]) {
        var n = S.nodes[S.sel];
        p.innerHTML = '<div class="ged-title">Node</div><label>Name <input type="text" data-p="name" value="' + esc(S.sel) + '" maxlength="6" aria-label="Node name"></label>' +
          (S.useH ? '<label>Heuristic h <input type="number" data-p="h" value="' + n.h + '" min="0" step="1" aria-label="Heuristic"></label>' : '') +
          '<div class="ged-btns"><button class="btn' + (S.start === S.sel ? ' on' : '') + '" type="button" data-p="start">Start</button><button class="btn' + (S.goal === S.sel ? ' on' : '') + '" type="button" data-p="goal">Goal</button><button class="btn" type="button" data-p="child">Add child</button><button class="btn" type="button" data-p="del">Delete</button></div>';
      } else if (S.selE >= 0 && S.edges[S.selE]) {
        var e = S.edges[S.selE];
        p.innerHTML = '<div class="ged-title">Edge ' + esc(e.a) + (S.dir ? ' &#8594; ' : ' &ndash; ') + esc(e.b) + '</div><label>Cost <input type="number" data-p="cost" value="' + e.c + '" min="0" step="1" aria-label="Edge cost"></label>' +
          '<div class="ged-btns">' + (S.dir ? '<button class="btn" type="button" data-p="rev">Reverse</button>' : '') + '<button class="btn" type="button" data-p="del">Delete</button></div>';
      } else {
        p.innerHTML = '<div class="ged-title">How to build</div><ol class="ged-how"><li><b>Add node</b>, then click the canvas. Double-click works in any tool.</li><li><b>Add edge</b>, then click two nodes.</li><li>Select a node to name it, give it an h value, or make it the start or goal.</li><li>For a tree, select a node and press <b>Add child</b>.</li></ol>';
      }
    }
    function select(id, ei) { S.sel = id; S.selE = ei === undefined ? -1 : ei; panel(); draw(); }
    function setTool(t) { S.tool = t; S.from = null; $$tool(); draw(); }
    function $$tool() {
      Array.prototype.forEach.call(el.querySelectorAll('[data-g=tool] button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === S.tool)); });
      Array.prototype.forEach.call(el.querySelectorAll('[data-g=dir] button'), function (b) { b.setAttribute('aria-pressed', String((b.dataset.v === '1') === S.dir)); });
      G.useh.checked = S.useH;
    }
    /* ---------- events ---------- */
    G.stage.addEventListener('pointerdown', function (ev) {
      var nEl = ev.target.closest('[data-n]'), eEl = ev.target.closest('[data-e]'), p = pt(ev);
      if (nEl) {
        var id = nEl.dataset.n;
        if (S.tool === 'edge') {
          if (!S.from) { S.from = id; select(id); }
          else if (S.from !== id) { var i = addEdge(S.from, id); S.from = null; if (i >= 0) { select(null, i); changed(); var c = $('[data-p=cost]', G.insp); if (c) { c.focus(); c.select(); } } else { S.from = null; draw(); } }
          return;
        }
        select(id); S.drag = { id: id, dx: S.nodes[id].x - p[0], dy: S.nodes[id].y - p[1], moved: false };
        try { G.stage.setPointerCapture(ev.pointerId); } catch (x) { /* older browsers */ }
      } else if (eEl) { select(null, +eEl.dataset.e); }
      else if (S.tool === 'node') { var name = addNode(p[0], p[1]); select(name); changed(); }
      else { S.from = null; select(null); }
    });
    G.stage.addEventListener('pointermove', function (ev) {
      if (!S.drag) return; var p = pt(ev), n = S.nodes[S.drag.id]; if (!n) return;
      n.x = Math.round(Math.max(R, Math.min(VW - R, p[0] + S.drag.dx))); n.y = Math.round(Math.max(R + 8, Math.min(VH - R - 14, p[1] + S.drag.dy))); S.drag.moved = true; draw();
    });
    function endDrag() { if (S.drag) { var m = S.drag.moved; S.drag = null; if (m) changed(); } }
    G.stage.addEventListener('pointerup', endDrag); G.stage.addEventListener('pointercancel', endDrag);
    G.stage.addEventListener('dblclick', function (ev) { if (ev.target.closest('[data-n],[data-e]')) return; var p = pt(ev), name = addNode(p[0], p[1]); select(name); changed(); });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var tool = b.closest('[data-g=tool]'), dir = b.closest('[data-g=dir]');
      if (tool) { setTool(b.dataset.v); return; }
      if (dir) { S.dir = b.dataset.v === '1'; if (!S.dir) { var seen = {}; S.edges = S.edges.filter(function (e) { var k = [e.a, e.b].sort().join('|'); if (seen[k]) return false; seen[k] = 1; return true; }); } $$tool(); panel(); changed(); return; }
      var g = b.dataset.g, pa = b.dataset.p;
      if (g === 'layout') { layout(); changed(); }
      else if (g === 'clear') { loadExample('@blank'); panel(); $$tool(); changed(); }
      else if (g === 'textbtn') { S.text = !S.text; G.textwrap.hidden = !S.text; b.setAttribute('aria-expanded', String(S.text)); b.classList.toggle('on', S.text); G.ta.value = toText(); }
      else if (g === 'apply') { var err = fromText(G.ta.value); if (err) { G.msg.textContent = err; G.msg.classList.add('bad'); } else { panel(); $$tool(); changed(); } }
      else if (g === 'run') { build(); push(); var sim = $('#labsim'); if (sim) sim.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (pa === 'start') { S.start = S.sel; panel(); changed(); }
      else if (pa === 'goal') { S.goal = S.sel; panel(); changed(); }
      else if (pa === 'del') { if (S.sel) delNode(S.sel); else if (S.selE >= 0) { S.edges.splice(S.selE, 1); S.selE = -1; } panel(); changed(); }
      else if (pa === 'rev') { var e = S.edges[S.selE]; if (e && !hasEdge(e.b, e.a)) { var t = e.a; e.a = e.b; e.b = t; panel(); changed(); } }
      else if (pa === 'child') {
        var par = S.nodes[S.sel]; if (!par) return;
        var kids = S.edges.filter(function (e) { return e.a === S.sel; }).length, name = freeName();
        S.nodes[name] = { x: Math.min(VW - R, Math.max(R, par.x + (kids % 2 ? 70 : -70) * Math.ceil((kids + 1) / 2))), y: Math.min(VH - R - 14, par.y + 90), h: 0 };
        addEdge(S.sel, name); select(name); changed();
      }
    });
    el.addEventListener('input', function (ev) {
      var t = ev.target, k = t.dataset && t.dataset.p;
      if (k === 'h' && S.sel) { S.nodes[S.sel].h = Math.max(0, +t.value || 0); changed(); }
      else if (k === 'cost' && S.edges[S.selE]) { S.edges[S.selE].c = Math.max(0, +t.value || 0); changed(); }
    });
    el.addEventListener('change', function (ev) {
      var t = ev.target;
      if (t.dataset.p === 'name' && S.sel) {
        var nn = t.value.trim().replace(/\s+/g, ''), old = S.sel;
        if (!nn || nn === old || S.nodes[nn]) { t.value = old; return; }
        S.nodes[nn] = S.nodes[old]; delete S.nodes[old];
        S.edges.forEach(function (e) { if (e.a === old) e.a = nn; if (e.b === old) e.b = nn; });
        if (S.start === old) S.start = nn; if (S.goal === old) S.goal = nn; S.sel = nn; panel(); changed();
      } else if (t.dataset.g === 'example' && t.value) { loadExample(t.value); S.live = G.live.checked; panel(); $$tool(); changed(); t.selectedIndex = 0; t.dispatchEvent(new Event('sync')); }
      else if (t.dataset.g === 'useh') { S.useH = t.checked; panel(); changed(); }
      else if (t.dataset.g === 'live') { S.live = t.checked; if (S.live) changed(); }
    });
    el.addEventListener('keydown', function (ev) {
      var tag = ev.target.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { if (ev.key === 'Enter' && tag === 'INPUT') ev.target.blur(); return; }
      if (ev.key === 'Delete' || ev.key === 'Backspace') { if (S.sel) { delNode(S.sel); } else if (S.selE >= 0) { S.edges.splice(S.selE, 1); S.selE = -1; } else return; ev.preventDefault(); panel(); changed(); }
      else if (ev.key === 'Escape') { S.from = null; select(null); }
      else if (ev.key === 'v' || ev.key === 'V') setTool('select'); else if (ev.key === 'n' || ev.key === 'N') setTool('node'); else if (ev.key === 'e' || ev.key === 'E') setTool('edge');
    });
    el.tabIndex = -1;
    loadExample('q253u'); panel(); $$tool(); changed();
  }
  (window.EXTRA_WIDGETS = window.EXTRA_WIDGETS || {}).editor = Editor;
})();
