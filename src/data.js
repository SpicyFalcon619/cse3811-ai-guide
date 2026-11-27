/* SMA* with room for 3 nodes: the example on informed-deck slides 52 to 54, step for step.
   Each node is [id, f, state]. States: cur (being expanded), open, done, cut (dropped in this step),
   forgot (dropped earlier), path. "rem" is the forgotten f-value a parent remembers. */
var SMA_POS = { S: [260, 40, null], A: [120, 135, 'S'], B: [260, 135, 'S'], C: [400, 135, 'S'], GA: [120, 235, 'A'], GB: [260, 235, 'B'] };
var SMA_STEPS = [
  { k: 'START', n: [['S', 3, 'cur']], rem: {},
    x: 'Start with S in memory. f(S) = g + h = 0 + 3 = 3. Memory holds at most <b>3 nodes</b>, so only two more can fit. The graph above is the one on slide 52.' },
  { k: 'STEP 1 &middot; GENERATE THE CHILDREN ONE BY ONE', n: [['S', 3, 'cur'], ['A', 4, 'open'], ['B', 5, 'open']], rem: {},
    x: 'Expand S. A: g = 4, h = 0, f = 4. B: g = 3, h = 2, f = 5. S, A and B now fill all 3 slots. S still has a third child, C, that does not fit.' },
  { k: 'STEP 2 &middot; MEMORY FULL', bad: 1, n: [['S', 3, 'cur'], ['A', 4, 'open'], ['B', 5, 'cut'], ['C', 6, 'open']], rem: { S: 5 },
    x: 'Generate C: g = 5, h = 1, f = 6. Memory is full, so SMA* drops the <b>worst leaf</b> already in memory: B (f = 5). S writes the forgotten value beside itself, <b>(5)</b>: &ldquo;a child worth 5 was dropped.&rdquo; C takes the free slot.' },
  { k: 'STEP 3 &middot; ALL CHILDREN EXPLORED, ADJUST F', n: [['S', 4, 'cur'], ['A', 4, 'open'], ['B', 5, 'forgot'], ['C', 6, 'open']], rem: { S: 5 },
    x: 'S has generated all its children, so update f(S) to the smallest value among them: A = 4, C = 6 and the remembered 5. <b>f(S) = 4.</b>' },
  { k: 'STEP 4 &middot; EXPAND A, MEMORY FULL', bad: 1, n: [['S', 4, 'done'], ['A', 4, 'cur'], ['B', 5, 'forgot'], ['C', 6, 'cut'], ['GA', 6, 'open']], rem: { S: 5 },
    x: 'The best leaf is A (f = 4), so expand it. Its child G has g = 4 + 2 = 6, h = 0, f = 6. Memory is full: drop the worst leaf, C (f = 6). S already remembers 5, which is smaller than 6, so it keeps <b>(5)</b>.' },
  { k: 'STEP 5 &middot; ALL CHILDREN EXPLORED, ADJUST F', n: [['S', 5, 'cur'], ['A', 6, 'done'], ['B', 5, 'forgot'], ['C', 6, 'forgot'], ['GA', 6, 'open']], rem: { S: 5 },
    x: 'A&rsquo;s only child G has f = 6, so <b>f(A) = 6</b>. Update S: min(A = 6, remembered 5) = <b>5</b>. The forgotten branch through B now looks better than anything still in memory.' },
  { k: 'STEP 6 &middot; REGENERATE B', bad: 1, n: [['S', 5, 'cur'], ['A', 6, 'open'], ['B', 5, 'open'], ['C', 6, 'forgot'], ['GA', 6, 'cut']], rem: { S: 6, A: 6 },
    x: 'S is the best node (f = 5), because of the remembered B. To build B again (g = 3, h = 2, f = 5) a slot is needed: drop the worst leaf, G (f = 6). A has lost its only child, so it now remembers <b>(6)</b>.' },
  { k: 'STEP 6 &middot; REGENERATE C', bad: 1, n: [['S', 5, 'cur'], ['A', 6, 'cut'], ['B', 5, 'open'], ['C', 6, 'open']], rem: { S: 6 },
    x: 'Build S&rsquo;s other child C again (f = 6). Memory is full and the worst leaf is A (f = 6), so drop it. S now remembers <b>(6)</b>, the value of the forgotten A.' },
  { k: 'STEP 7 &middot; EXPAND B, REACH THE GOAL', goal: 1, n: [['S', 5, 'path'], ['A', 6, 'forgot'], ['B', 5, 'path'], ['C', 6, 'cut'], ['GB', 5, 'path']], rem: { S: 6 },
    x: 'Expand B (f = 5, the best leaf). Its child G has g = 3 + 2 = 5, h = 0, f = 5. Memory is full, so drop the worst leaf, C (f = 6). G is the goal and has the lowest f, so SMA* stops: <b>S &#8594; B &#8594; G, cost 5</b>, the optimal path, found with only 3 slots.' }
];

var QUIZ = {
  pick: [
    { q: 'Every step costs 1 and you want the path with the fewest moves. Memory is not a problem.', o: ['BFS', 'DFS', 'Greedy'], a: 0, w: 'BFS reaches every depth-1 node before any depth-2 node, so the first goal it takes out has the fewest edges. With equal step costs, fewest edges = cheapest.' },
    { q: 'Step costs are all different and you must return the cheapest path. No heuristic is given.', o: ['BFS', 'UCS', 'IDS'], a: 1, w: 'UCS always takes out the path with the lowest g (cost so far), so the first goal it takes out is the cheapest. BFS and IDS count edges, not cost.' },
    { q: 'Memory is tiny and any solution will do.', o: ['BFS', 'DFS', 'UCS'], a: 1, w: 'DFS only keeps the current path plus the siblings along it: O(bm) memory. It is not optimal, but you said any solution will do.' },
    { q: 'You want BFS&rsquo;s shallowest answer but only DFS-sized memory.', o: ['DFS', 'IDS', 'Greedy'], a: 1, w: 'Iterative deepening runs depth-limited DFS with limit 0, 1, 2, &hellip; It finds the shallowest goal like BFS, with O(bd) memory like DFS.' },
    { q: 'You have a good heuristic and want the cheapest path. Memory is fine.', o: ['Greedy', 'A*', 'DFS'], a: 1, w: 'A* orders by f = g + h. With an admissible heuristic it is optimal. Greedy only looks at h, so it can return an expensive path.' },
    { q: 'You have a good heuristic and want the cheapest path, but memory is very tight.', o: ['A*', 'RBFS or IDA*', 'BFS'], a: 1, w: 'RBFS (O(bd)) and IDA* (O(d) per the deck) keep A*&rsquo;s optimality with an admissible heuristic while using linear memory. They pay for it by re-expanding nodes.' }
  ],
  final: [
    { q: 'Which fringe does BFS use?', o: ['Stack (LIFO)', 'Queue (FIFO)', 'Priority queue by g'], a: 1, w: 'A queue: the oldest path waiting comes out first, so BFS finishes a whole level before the next.' },
    { q: 'DFS pushes children in reverse alphabetical order. Why?', o: ['To make it optimal', 'So the alphabetically first child is on top and comes out first', 'Because the slides say costs matter'], a: 1, w: 'A stack gives back the last thing pushed. Push C, then B, then A, and A is on top.' },
    { q: 'In DFS, does a heavier edge get pushed first?', o: ['Yes, heaviest first', 'No, DFS ignores costs; order is alphabetical', 'Yes, lightest last'], a: 1, w: 'DFS never looks at edge costs. Only UCS and A* (and their memory-bounded versions) use costs.' },
    { q: 'When does A* stop?', o: ['When the goal is added to the fringe', 'When the goal is taken out of the fringe', 'When h = 0 anywhere'], a: 1, w: 'Slide 17: stop only when you dequeue the goal. A cheaper path to the goal might still be waiting in the fringe.' },
    { q: 'A heuristic is admissible when&hellip;', o: ['h(n) &le; true cost from n to the goal, for every n', 'h(u) &minus; h(v) &le; cost(u, v) on every edge', 'h(goal) = 1'], a: 0, w: 'Admissible = never overestimates. The edge rule is consistency, which is stronger.' },
    { q: 'A* graph search is guaranteed optimal when the heuristic is&hellip;', o: ['Admissible', 'Consistent', 'Zero only'], a: 1, w: 'Slide 44: tree search needs admissible; graph search needs consistent. Consistent implies admissible.' },
    { q: 'Greedy best-first search orders the fringe by&hellip;', o: ['g(n)', 'h(n)', 'g(n) + h(n)'], a: 1, w: 'Greedy only looks at the estimate to the goal, h(n). That is why it can run straight to an expensive goal.' },
    { q: 'IDA* finishes an iteration without finding the goal. The next threshold is&hellip;', o: ['Old threshold + 1', 'The smallest f value that was cut off', 'The largest f value seen'], a: 1, w: 'Deck checklist point 3: always derived, never guessed. It is the smallest f that exceeded the old threshold.' },
    { q: 'In RBFS a successor gets f(s) = &hellip;', o: ['g(s) + h(s)', 'max(g(s) + h(s), f(parent))', 'min(g(s) + h(s), f(parent))'], a: 1, w: 'A child can never look better than its parent&rsquo;s stored (possibly backed-up) value. This is the rule the 262 paper quotes.' },
    { q: 'RBFS recurses into Best with which f_limit?', o: ['Alt.f', 'min(current f_limit, Alt.f)', 'max(current f_limit, Alt.f)'], a: 1, w: 'The best child may only be explored while it stays better than both the inherited limit and the best alternative.' },
    { q: 'RBFS backs up a value when Best.f &gt; f_limit. What value does the node store?', o: ['Its original f', 'Best.f, the best child&rsquo;s f', '&infin;'], a: 1, w: 'The node remembers how good its subtree really is, so it can be compared fairly later without keeping the subtree in memory.' },
    { q: 'In the deck&rsquo;s IDA*, when is a node tested for being the goal?', o: ['When it is generated, before the threshold check', 'Only if its f &le; threshold', 'At the end of each iteration'], a: 0, w: 'Solved-examples deck, slide 17 and the checklist: the goal test comes before the bound check. The threshold only decides whether to expand.' },
    { q: 'SMA* runs out of memory. What does it drop?', o: ['The oldest node', 'The worst leaf (highest f), backing its value up to the parent', 'The start node'], a: 1, w: 'The parent remembers the forgotten value, so that branch can be regenerated if everything else turns out worse.' },
    { q: 'Graph search is&hellip;', o: ['Tree search plus a closed set of expanded states', 'Search on a graph instead of a tree, with no other change', 'DFS with a depth limit'], a: 0, w: 'Slide 35: never expand a state twice. Before expanding, check the closed set; if the state is there, skip it.' }
  ]
};
