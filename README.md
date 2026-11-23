# AI Search Guide

An interactive guide to artificial intelligence, written for CSE 3811 (Artificial Intelligence). It follows the course outline up to the midterm: intelligent agents, uninformed and informed search, local search, constraint satisfaction and game playing. The topics after the midterm will be added as the course reaches them. Each topic opens with a plain-language lesson and a worked example, and then gives you a visualiser you can step through one move at a time.

**[Open the guide](https://spicyfalcon619.github.io/ai-search-guide/)**

## What it covers

| Part | Topics |
|---|---|
| Start here | A map of the whole course outline, the one search loop every algorithm shares, and the words you need (state, fringe, expand, g, h, f) |
| Agents | Views of AI, agents and environments, rationality, PEAS, environment properties, search problems |
| Uninformed search | Graph to search tree, reading the answer from the fringe, BFS, DFS, UCS, depth-limited search and IDS, bidirectional search, tree search vs graph search |
| Informed search | Heuristics (admissible and consistent), Greedy best-first, A\*, IDA\*, RBFS, SMA\* |
| Local search | The state-space landscape, hill climbing on 8-queens and its variants, simulated annealing |
| CSP | Formulating constraint satisfaction problems, backtracking, forward checking, arc consistency, MRV and LCV |
| Games | Games as search, minimax, alpha-beta pruning |
| Exam | The question types that come up, past paper answers, a simulator lab, a quick check and pairs that are easy to mix up |

## What the site gives you

- **Lessons before rules.** Every search page starts with a short lesson: an everyday picture of the idea, then one worked example done by hand as a table, then questions to check yourself.
- **Visualisers you can step through.** Choose an algorithm and a graph, then step forward and back. Each step shows the state graph, the full search tree and the stack, queue or priority queue, with a sentence explaining that step.
- **Beyond path search.** Alpha-beta on game trees with the v, α, β box at every node, as on the lecture slides; map colouring with the domain table updated after each assignment; an 8-queens board that shows h for every move; and a landscape for hill climbing and simulated annealing.
- **The answer read from the fringe.** The guide shows how to write the path, the cost and the expansion order straight from the stack or queue, the way an exam answer is written.
- **Draw your own graph or tree.** The lab has a drag-and-drop editor: click to add nodes, connect them, type step costs and heuristic values, set the start and goal, or press Add child to grow a tree. The simulator follows every change, and the same graph is shown as plain text that you can edit.
- **Real exam graphs.** Questions from recent midterms and the lecture examples are built in, with the full trace table for each run.
- **Course conventions.** Ties are broken alphabetically, the goal test happens when a path is taken out, and DFS pushes children in reverse order, as in the lecture decks.
- **Progress and themes.** You can mark pages as understood, and choose a paper, dark or charcoal theme. The background animation can be turned off. These choices are saved in your browser only.

## Running it locally

You need Python 3 to build the site and Node.js to run the tests. There are no packages to install.

```bash
node tests/engine.test.js   # check the search engine against hand-worked answers
node tests/beyond.test.js   # check the game-tree, CSP and 8-queens engines
python build.py             # writes dist/index.html
```

Then open `dist/index.html` in a browser.

## Project layout

| Path | What it holds |
|---|---|
| `src/pages.html` | The content: one `<article>` per page |
| `src/style.css` | The design: theme tokens, layout and motion |
| `src/engine.js` | The search engine: the graphs and every algorithm, step by step |
| `src/ui.js` | The interface: navigation, visualisers, search trees and interactive widgets |
| `src/beyond-engine.js` | Minimax and alpha-beta, CSP backtracking with filtering and ordering, and the 8-queens heuristic |
| `src/beyond-ui.js` | The visualisers for games, CSPs and local search |
| `src/dropdown.js` | A themed replacement for the browser's native dropdown |
| `src/editor.js` | The graph and tree editor in the simulator lab |
| `src/data.js` | Quiz questions and the SMA\* walkthrough |
| `tests/engine.test.js`, `tests/beyond.test.js` | Check the engines against answers worked out by hand |
| `build.py` | Puts everything into a single self-contained `dist/index.html` |
| `.github/workflows/pages.yml` | Runs the tests, builds the site and publishes it to GitHub Pages on every push to `main` |

## How the answers are checked

The engine's results are compared with answers worked out by hand from past papers, the lecture decks and the course teacher's examples. For example, BFS on Fall 2025 Q2(a) gives S-C-G with cost 11, and A\* on Fall 2025 Q3 gives cost 6 with tree search but 7 with graph search, because that heuristic is not consistent. Alpha-beta on the deck's example returns 6 and prunes the leaf 9 and the whole 0, 1 branch. If a change to the engine breaks any of these, the tests fail and the site is not deployed.

## Author

Ahmad Maruf Hossain ([@SpicyFalcon619](https://github.com/SpicyFalcon619))
