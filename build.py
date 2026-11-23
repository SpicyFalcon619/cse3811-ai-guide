"""Build the site into dist/index.html.

The page is one self-contained HTML file: the styles, the pages and the scripts
from src/ are inlined, so it can be opened straight from disk or served by any
static host. Run:  python build.py
"""
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
DIST = os.path.join(ROOT, "dist")


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()


def order_pages(pages):
    """Show 'Tree vs graph search' after IDS, once BFS and DFS have been met."""
    m = re.search(r'<article class="page" id="tree-graph".*?</article>\n', pages, re.S)
    block = m.group(0)
    pages = pages.replace(block, "")
    anchor = '<article class="page" id="compare-u"'
    assert pages.count(anchor) == 1, "anchor page missing"
    return pages.replace(anchor, block + "\n" + anchor)


FAVICON = (
    "data:image/svg+xml,"
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E"
    "%3Ccircle cx='16' cy='16' r='15' fill='%238EADFF'/%3E"
    "%3Cg stroke='%2316223A' stroke-width='2.2' fill='none'%3E%3Cpath d='M10 10l12 2M10 10l3 12M22 12l-9 10'/%3E%3C/g%3E"
    "%3Cg fill='%2316223A'%3E%3Ccircle cx='10' cy='10' r='3.2'/%3E%3Ccircle cx='22' cy='12' r='3.2'/%3E%3Ccircle cx='13' cy='22' r='3.2'/%3E%3C/g%3E"
    "%3C/svg%3E"
)

HEAD = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>CSE 3811 AI Guide</title>
<meta name="description" content="An interactive guide to the first half of artificial intelligence: agents, uninformed and informed search, local search, constraint satisfaction and game playing, with step-by-step visualisers and worked exam answers.">
<meta name="theme-color" content="#16223A">
<meta property="og:title" content="CSE 3811 AI Guide">
<meta property="og:description" content="Learn the first half of the AI course step by step: search, local search, CSP and games, with visualisers, a graph editor and worked exam answers.">
<meta property="og:type" content="website">
<link rel="icon" href="{FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
  [hidden] {{ display: none !important; }}
  img {{ max-width: 100%; }}
"""


def build():
    strip = lambda js: re.sub(r"^if \(typeof module !== 'undefined'\) module\.exports = .*$", "", js, flags=re.M)
    engine = strip(read("engine.js")) + "\n" + strip(read("beyond-engine.js")) + "\n" + read("beyond-ui.js") + "\n" + read("dropdown.js") + "\n" + read("editor.js")
    html = (
        HEAD
        + read("style.css")
        + "</style>\n</head>\n<body>\n"
        + order_pages(read("pages.html"))
        + "\n<script>\n"
        + engine + "\n" + read("data.js") + "\n" + read("ui.js")
        + "</script>\n</body>\n</html>\n"
    )
    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, "index.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    ids = re.findall(r'\sid="([^"]+)"', html)
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise SystemExit(f"duplicate element ids: {dupes}")
    print(f"built {out} ({len(html):,} bytes)")


if __name__ == "__main__":
    build()
