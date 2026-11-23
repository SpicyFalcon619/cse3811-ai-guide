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
];
for (const [t, mode, value, best, pruned] of games) {
  check(`${mode === 'ab' ? 'alpha-beta' : 'minimax'} on ${B.GAMES[t].name}: value ${value}, pruned [${pruned}]`, () => {
    const r = B.gameRun(B.GAMES[t].tree, mode);
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

console.log(`\n${total - failed} of ${total} passed`);
process.exit(failed ? 1 : 0);
