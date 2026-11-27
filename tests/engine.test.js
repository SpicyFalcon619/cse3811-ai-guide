// Checks the search engine against answers worked out by hand from past
// papers, the lecture decks and the course teacher's examples.
// Run: node tests/engine.test.js
const assert = require('assert');
const { GRAPHS, runSearch } = require('../src/engine.js');

const cases = [
  // [graph, algorithm, mode, expected path, expected cost]
  ['q253u', 'BFS', 'tree', 'S-C-G', 11],
  ['q253u', 'DFS', 'tree', 'S-A-B-C-G', 9],
  ['q253u', 'UCS', 'tree', 'S-A-B-C-G', 9],
  ['q253u', 'IDS', 'tree', 'S-C-G', 11],
  ['q253i', 'ASTAR', 'tree', 'S-A-B-G', 6],   // Fall 2025 Q3, tree search
  ['q253i', 'ASTAR', 'graph', 'S-C-B-G', 7],  // inconsistent h: graph search loses
  ['q261i', 'ASTAR', 'tree', 'S-C-D-G', 9],   // Spring 2026 Q3
  ['q261i', 'GREEDY', 'tree', 'S-B-G', 14],
  ['q262i', 'RBFS', 'tree', 'P-R-G', 5],      // Summer 2026 Q3(a)
  ['tA', 'ASTAR', 'tree', 'S-B-C-E-G', 8],    // teacher's A* example
  ['tA', 'GREEDY', 'tree', 'S-C-E-G', 9],
  ['tR', 'RBFS', 'tree', 'A-D-F-G', 15],      // teacher's and deck's RBFS example
  ['tI', 'IDASTAR', 'tree', 'S-A-C-G', 10],   // teacher's IDA* example
  ['q253u', 'DLS', 'tree', 'S-C-G', 11, { limit: 2 }],        // depth-limited, limit 2
  ['q253u', 'DLS', 'tree', 'S-A-B-G', 11, { limit: 3 }],      // a bigger limit, still not the cheapest
  ['q253u', 'DLS', 'tree', 'S-A-B-C-G', 9, { limit: 4 }],
];

let failed = 0;
for (const [g, alg, mode, path, cost, extra] of cases) {
  const name = `${alg} ${mode} search on ${GRAPHS[g].name}`;
  try {
    const r = runSearch(GRAPHS[g], alg, Object.assign({ mode }, extra)).result;
    assert.ok(r, 'no solution found');
    assert.strictEqual(r.path.join('-'), path);
    assert.strictEqual(r.cost, cost);
    console.log(`ok    ${name}: ${path}, cost ${cost}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}: ${e.message}`);
  }
}
// DLS: cutoff (a limit stopped something) versus failure (nothing was stopped)
function lastText(G, limit) { return runSearch(G, 'DLS', { mode: 'tree', limit }).steps.slice(-1)[0].text; }
const noGoal = { name: 'no goal', dir: true, start: 'S', goal: 'Z', vb: '0 0 9 9', nodes: { S: [0, 0, 0], A: [0, 0, 0], Z: [0, 0, 0] }, edges: [['S', 'A', 1]] };
for (const [name, ok] of [
  ['DLS limit 1 on Fall 2025 Q2(a) reports cutoff', /cutoff/.test(lastText(GRAPHS.q253u, 1))],
  ['DLS on a graph with no path to the goal reports failure', /failure/.test(lastText(noGoal, 5))],
]) {
  cases.push(0);
  if (ok) console.log(`ok    ${name}`); else { failed++; console.log(`FAIL  ${name}`); }
}

// SMA*: the deck's example (informed deck slides 52-54), then the general behaviour
{
  const { smaRun } = require('../src/engine.js');
  const plain = (t) => t.replace(/<[^>]+>/g, '').replace(/&rarr;/g, '→').replace(/&[a-z]+;/g, '');
  const deck = smaRun(GRAPHS.tSM, 3);
  const dropOrder = deck.steps.map((s) => (s.x.match(/worst leaf<\/b> already in memory: <b>(\w)<\/b>/) || [])[1]).filter(Boolean);
  const adjust1 = deck.steps.find((s) => /^ADJUST/.test(s.k));
  const big = smaRun(GRAPHS.q253i, 20), astar = runSearch(GRAPHS.q253i, 'ASTAR', { mode: 'tree' }).result;
  let over = 0;
  [['tSM', 2], ['tSM', 3], ['tSM', 4], ['q253i', 3], ['q253i', 4], ['q261i', 4], ['tA', 3], ['tR', 4]].forEach(([g, m]) => smaRun(GRAPHS[g], m).steps.forEach((s) => { if (s.used > m) over++; }));
  for (const [name, ok] of [
    ['SMA* deck example, memory 3: S-B-G with cost 5', deck.result && deck.result.path.join('-') === 'S-B-G' && deck.result.cost === 5],
    ['SMA* deck example drops B, C, G, A and C in that order (slides 53-54)', dropOrder.join('') === 'BCGAC'],
    ['SMA* deck example: after generating the children, f(S) goes from 3 to 4', /f\(S\) 3 → 4/.test(plain(adjust1.x))],
    ['SMA* deck example, memory 2: no answer fits', smaRun(GRAPHS.tSM, 2).result === null],
    ['SMA* with plenty of memory finds what A* finds (Fall 2025 Q3: S-A-B-G, cost 6)', big.result.path.join('-') === astar.path.join('-') && big.result.cost === astar.cost],
    ['SMA* never holds more nodes than its limit', over === 0],
  ]) { cases.push(0); if (ok) console.log(`ok    ${name}`); else { failed++; console.log(`FAIL  ${name}`); } }
}

// RBFS: the panel registers (successors, Best, Alt, limit in, next limit) must match the deck (slides 56-57)
{
  const steps = runSearch(GRAPHS.tR, 'RBFS', { mode: 'tree' }).steps;
  const first = steps.find((s) => s.kind === 'call');
  const fail = steps.find((s) => s.kind === 'backup');
  for (const [name, ok] of [
    ['RBFS deck example: A\'s successors are B = 17, C = 14, D = 12', first.regs['Successors'] === 'B = 17, C = 14, D = 12'],
    ['RBFS deck example: Best D (12), Alt C (14), next f_limit 14', first.regs['Best'] === 'D (12)' && first.regs['Alt'] === 'C (14)' && /= 14$/.test(first.regs['Next f_limit'])],
    ['RBFS deck example: D fails with F = 15 above the limit 14', fail.regs['Best'] === 'F (15)' && /^fail/.test(fail.regs['Next f_limit'])],
  ]) { cases.push(0); if (ok) console.log(`ok    ${name}`); else { failed++; console.log(`FAIL  ${name}`); } }
}

console.log(`\n${cases.length - failed} of ${cases.length} passed`);
process.exit(failed ? 1 : 0);
