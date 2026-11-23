var SMA_STEPS = [
  { k: 'START', t: [['S', 3, 260, 40, 'cur', null]], ram: ['S (f=3)', '', ''],
    x: 'Put the start node S in memory with f(S) = 0 + 3 = 3. One of the three memory slots is used.' },
  { k: 'EXPAND S', t: [['S', 3, 260, 40, 'done', null], ['A', 4, 165, 130, 'open', 'S'], ['B', 5, 355, 130, 'open', 'S']], ram: ['S (f=3)', 'A (f=4)', 'B (f=5)'],
    x: 'Expand S. Its children A (f = 4 + 0 = 4) and B (f = 3 + 2 = 5) go into memory. <b>Memory is now full: 3 of 3.</b>' },
  { k: 'MEMORY FULL: DROP THE WORST LEAF', bad: 1, t: [['S', 4, 260, 40, 'done', null], ['A', 4, 130, 130, 'open', 'S'], ['B', 5, 260, 130, 'forgot', 'S'], ['C', 6, 390, 130, 'open', 'S']], ram: ['S (f=4, remembers 5)', 'A (f=4)', 'C (f=6)'],
    x: 'S still has a third child, C (f = 5 + 1 = 6), but there is no free slot. SMA* <b>drops the worst leaf</b>, B (f = 5), and S <b>remembers</b> that a forgotten child was worth 5. S now shows f = 4, the best of what it still has.' },
  { k: 'EXPAND A', bad: 1, t: [['S', 5, 260, 32, 'done', null], ['A', 6, 165, 112, 'done', 'S'], ['B', 5, 355, 112, 'forgot', 'S'], ['G', 6, 165, 198, 'cut', 'A']], ram: ['S (f=5)', 'A (f=6)', 'G (f=6)'],
    x: 'A (f = 4) is the best node in memory. Expanding it gives G with f = 4 + 2 + 0 = 6. To make room, the worst leaf C (6) is dropped. A is updated to f = 6. S becomes min(6, remembered 5) = <b>5</b>: the forgotten B now looks better than anything in memory.' },
  { k: 'GOAL', t: [['S', 5, 260, 32, 'path', null], ['A', 6, 155, 112, 'forgot', 'S'], ['B', 5, 345, 112, 'path', 'S'], ['G', 5, 345, 198, 'path', 'B']], ram: ['S (f=5)', 'B (f=5)', 'G (f=5)'],
    x: 'Because the remembered value 5 beats A (6), SMA* drops A and G, <b>regenerates B</b> (f = 5) and expands it: G with f = 3 + 2 + 0 = 5. <b>Goal reached: S &#8594; B &#8594; G, cost 5</b>, the optimal path, using only 3 slots.' }
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
