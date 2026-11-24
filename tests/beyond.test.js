// Checks the game-tree, CSP and 8-queens engines against answers worked out
// by hand from the lecture decks and the textbook.
// Run: node tests/beyond.test.js
const assert = require('assert');
const B = require('../src/beyond-engine.js');

let failed = 0, total = 0;
function check(name, fn) {
  total++;
  try { fn(); console.log(`ok    ${name}`); }
  catch (e) { failed++; console.log(`FAIL  ${name}: ${e.message}`); }
}

// Game trees: root value, best move and pruned leaves
const games = [
  ['aima', 'mm', 3, 'A', []],
  ['aima', 'ab', 3, 'A', [4, 6]],            // textbook figure: B's 4 and 6 are pruned
  ['deck', 'mm', 6, 'A', []],
  ['deck', 'ab', 6, 'A', [9, 0, 1]],         // deck slides 22-41
  ['practice', 'ab', 8, 'A', [2, 2, 3, 11, 12]], // deck slide 42
  ['p253', 'ab', 5, 'C', [2, 9, 5, 3, 1, 5]],     // Fall 2025 Q5
  ['p253', 'mm', 5, 'C', []],
  ['p261', 'ab', 9, 'A', [2, 7, 16, 15, 9, 7]],    // Spring 2026 Q5
  ['p261', 'mm', 9, 'A', []],
  ['p262', 'ab', 2, 'A', [12, 6, 20]],             // Summer 2026 Q5 (the root is a MIN node)
  ['p262', 'mm', 2, 'A', []],
];
for (const [t, mode, value, best, pruned] of games) {
  check(`${mode === 'ab' ? 'alpha-beta' : 'minimax'} on ${B.GAMES[t].name}: value ${value}, pruned [${pruned}]`, () => {
    const r = B.gameRun(B.GAMES[t].tree, mode, B.GAMES[t].rootMin);
    assert.strictEqual(r.value, value);
    assert.strictEqual(r.best, best);
    assert.deepStrictEqual(r.pruned, pruned);
  });
}

// CSP: every run finds a valid colouring; dead ends match the hand count
const P = B.CSPS.aus, tricky = ['NSW', 'WA', 'Q', 'V', 'SA', 'NT', 'T'];
const csps = [
  ['none', 'fixed', 9], ['fc', 'fixed', 9], ['ac3', 'fixed', 3], ['none', 'mrv', 0], ['fc', 'mrv', 0], ['ac3', 'mrv', 0],
];
for (const [filter, varOrder, fails] of csps) {
  check(`map colouring, ${filter} + ${varOrder}: valid solution, ${fails} dead ends`, () => {
    const r = B.cspRun(P, { filter, varOrder, valOrder: 'fixed', order: tricky });
    assert.ok(r.sol, 'no solution');
    P.edges.forEach(([a, b]) => assert.notStrictEqual(r.sol[a], r.sol[b], `${a} and ${b} share a colour`));
    assert.strictEqual(r.fails, fails);
  });
}
check('forward checking after NSW=R, WA=R, Q=G leaves NT and SA with only B (deck slide 27)', () => {
  const r = B.cspRun(P, { filter: 'fc', varOrder: 'fixed', valOrder: 'fixed', order: tricky });
  const s = r.steps.find((x) => x.kind === 'assign' && x.A.Q === 'G');
  assert.deepStrictEqual(s.D.NT, ['B']);
  assert.deepStrictEqual(s.D.SA, ['B']);
});

// 8-queens heuristic
check('8-queens: h of the textbook-style board is 17', () => assert.strictEqual(B.queensH([4, 5, 6, 3, 4, 5, 6, 5]), 17));
check('8-queens: a solution has h = 0', () => assert.strictEqual(B.queensH([0, 4, 7, 5, 2, 6, 1, 3]), 0));

// Simulated annealing as the midterms ask it
check('Fall 2025 Q4(a): Santa goes to T at timestep 4', () => {
  const nb = [['P', 17], ['Q', 13], ['R', 20], ['S', 9], ['T', 25], ['U', 21], ['V', 11], ['W', 13]];
  const r = B.annealRun({ current: ['A', 22], neighbours: nb, T: (t) => t - 2 * t * t + 67, N: (t) => Math.abs(Math.cos(B.deg(185 + 2.7 * t))) });
  assert.strictEqual(r.chosen, 'T'); assert.strictEqual(r.at, 4);
  assert.deepStrictEqual(r.steps.map((s) => s.T), [67, 66, 61, 52, 39]);
  assert.ok(r.steps.slice(0, 4).every((s) => !s.accept));
});
check('Spring 2026 Q4(a): Garfield accepts C at timestep 2', () => {
  const r = B.annealRun({ current: ['A', 15], neighbours: [['B', 12], ['C', 14], ['D', 18]], T: () => 2, N: (t) => Math.abs(Math.sin(B.deg(25 + 5 * (t + 1)))) });
  assert.strictEqual(r.chosen, 'C'); assert.strictEqual(r.at + 1, 2);
});
check('Spring 2026 Q4(b): B needs T above 3 / ln 2 = 4.33, so 5 is the smallest whole temperature', () => {
  const take = (T) => B.annealRun({ current: ['A', 15], neighbours: [['B', 12]], T: () => T, N: () => 0.5 }).chosen === 'B';
  assert.ok(!take(4) && take(5)); assert.ok(Math.abs(3 / Math.log(2) - 4.328) < 0.001);
});
check('Summer 2026 Q4(i): at T = 10 a drop of 1 is allowed (p = 0.905) and a drop of 2 is not (p = 0.819)', () => {
  assert.ok(Math.exp(-1 / 10) >= 0.9 && Math.exp(-2 / 10) < 0.9);
});

console.log(`\n${total - failed} of ${total} passed`);
process.exit(failed ? 1 : 0);
