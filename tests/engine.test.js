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

console.log(`\n${cases.length - failed} of ${cases.length} passed`);
process.exit(failed ? 1 : 0);
