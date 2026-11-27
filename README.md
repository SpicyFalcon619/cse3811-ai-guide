# CSE 3811 · Artificial Intelligence Study Guide

**[Open the live Artificial Intelligence guide](https://spicyfalcon619.github.io/cse3811-ai-guide/)**

Learn to formulate search problems, trace algorithms by hand, and check each step in a visualiser. The guide covers the CSE 3811 course through the midterm, from intelligent agents to game trees.

## Start studying

- **New to search?** Follow [the search loop](https://spicyfalcon619.github.io/cse3811-ai-guide/#loop), then step through [breadth-first search](https://spicyfalcon619.github.io/cse3811-ai-guide/#bfs) and watch how the queue changes.
- **Trying an example of your own?** Draw a graph or tree in the [simulator lab](https://spicyfalcon619.github.io/cse3811-ai-guide/#lab), set the costs and heuristics, and step through the resulting trace.
- **Preparing for the midterm?** Practise [Q1–Q5 from Fall 2025, Spring 2026 and Summer 2026](https://spicyfalcon619.github.io/cse3811-ai-guide/#papers), then check your understanding with the [quiz](https://spicyfalcon619.github.io/cse3811-ai-guide/#quiz).

## Course coverage

| Topic | What you can learn and practise |
| --- | --- |
| [Intelligent agents](https://spicyfalcon619.github.io/cse3811-ai-guide/#agents) | Describe an agent’s environment, apply PEAS, and formulate a search problem. |
| [Uninformed search](https://spicyfalcon619.github.io/cse3811-ai-guide/#bfs) | Trace BFS, DFS, uniform-cost, depth-limited, iterative deepening and bidirectional search. Compare tree search with graph search. |
| [Informed search](https://spicyfalcon619.github.io/cse3811-ai-guide/#heuristic) | Check heuristics for admissibility and consistency. Compare greedy best-first search, A\*, IDA\*, RBFS and SMA\*. |
| [Local search](https://spicyfalcon619.github.io/cse3811-ai-guide/#local) | Follow hill climbing on an 8-queens board and explore how simulated annealing accepts moves. |
| [Constraint satisfaction](https://spicyfalcon619.github.io/cse3811-ai-guide/#csp) | Trace map colouring with backtracking, forward checking, arc consistency, and the MRV and LCV heuristics. |
| [Games](https://spicyfalcon619.github.io/cse3811-ai-guide/#games) | Evaluate a game tree with minimax and watch alpha-beta pruning skip branches. |

The visualisers let you step forward and back to see which path the algorithm expands, how the queue or stack changes, and how to write the final path, cost and expansion order. The guide saves your progress and theme choice in your browser.

## Build and test locally

Use Python 3.12 or later and Node.js. The build and tests use their standard libraries.

```sh
node tests/engine.test.js
node tests/beyond.test.js
python build.py
```

Open `dist/index.html` in your browser. The build bundles the lessons, styles and scripts into that one file.

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/pages.html`, `src/data.js` | Lessons, worked past papers, quiz and walkthrough data |
| `src/engine.js`, `src/ui.js` | Path search, navigation and search visualisers |
| `src/beyond-engine.js`, `src/beyond-ui.js` | Games, constraint satisfaction and local-search visualisers |
| `src/editor.js` | Graph and tree editor |
| `src/style.css`, `src/dropdown.js` | Themes, layout and form controls |
| `tests/`, `build.py` | Checks against worked examples and the static HTML build |

The tests compare algorithm results with examples worked by hand from the course slides and past papers. For Fall 2025 Q3, for example, A\* returns cost 6 in tree-search mode and 7 in graph-search mode with the question’s inconsistent heuristic.

## GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) tests, builds and deploys the guide on pushes to `main`. It can also be run manually. [Deployment history](https://github.com/SpicyFalcon619/cse3811-ai-guide/actions/workflows/pages.yml)

## Author

Ahmad Maruf Hossain ([@SpicyFalcon619](https://github.com/SpicyFalcon619))
