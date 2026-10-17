---
name: visual-explainer
description: Build an interactive explainer page that teaches a repository, pull request, diff or feature top-down - big picture first, then workflows, structure, state machines, timelines and call stacks - each diagram drawn for this codebase with step-through, animation and hover notes; synced source code only when asked. Use when someone wants to understand or onboard onto code, wants a PR or set of changes explained visually, or asks for a walkthrough, explainer, diagrams or an artifact about how something works.
---

# Visual Explainer

One self-contained HTML page that teaches a codebase the way a senior engineer would at a whiteboard: the big picture first, then each part broken down, every claim traceable to a file and line. Every diagram is **bespoke** — composed for this project's real parts, boundaries and moments from the kit's primitives (a flat canvas and an isometric projection). The kit has no stock pictures; the example page shows technique, never a layout to copy.

## Defaults

- **Reading order**: big picture → workflows → structure → state → time → call stacks. Skip a kind the subject does not have; never pad.
- **Code panes off.** Build with `--code` only when the user asks to see code; then each figure gets a source pane that follows its steps, beside the drawing on wide screens.
- **One file.** Publish it as an artifact when the Artifact tool is available, otherwise hand over the HTML file.

`SKILL` below means this skill's folder.

## Steps

1. **Read.** Scope the subject (repo, PR, diff, feature) and read the code until you can state each fact with a file and line. For a PR, read the diff against its base, every touched file in full, and the callers of what changed. Done when you hold a fact list — every entry with `path:line` — plus the open questions you could not answer from the code. How to read and what to collect: [references/story.md](references/story.md).

2. **Outline.** One section per reader question, in the default order, each heading phrased as the question ("What happens when a worker dies mid-run?"). Done when every section names the one thing it teaches and the figure kind that teaches it. Writing rules: [references/story.md](references/story.md).

3. **Design each diagram.** Inventory the parts this figure is about using the project's own names, find the boundaries, pick the spatial metaphor that answers the section's question, and write the per-step change list. Done when each figure has a written sketch: canvas height, regions, elements with coordinates on the 960-wide grid, and what changes at every step, option or event. Method, figure kinds, isometric and motion: [references/diagrams.md](references/diagrams.md).

4. **Draw.** Make a page folder (`page.json`, `body.html`, `figures.js`, and `code.json` only for code mode) — `SKILL/assets/example/` shows the format. Write `figures.js` against the kit: [references/kit.md](references/kit.md). Visual language and layout: [references/design.md](references/design.md). Done when the build succeeds:

   ```sh
   python3 SKILL/scripts/build.py PAGE_DIR            # → PAGE_DIR/page.html
   python3 SKILL/scripts/build.py PAGE_DIR --code     # → PAGE_DIR/page.code.html
   ```

5. **Check.** Run the checker, then open and read every screenshot yourself — the script finds clipped and overlapping labels, page errors and sideways scroll, never a wrong fact or an arrow pointing at the wrong box. Done when it reports 0 errors, each warning is fixed, every screenshot has been viewed, and every caption's facts were re-checked against their `path:line`. Commands and the review checklist: [references/verify.md](references/verify.md).

6. **Publish.** Through the Artifact tool when present (follow the host's artifact rules first), else give the file path. Reply with the link and a few lines on what the page covers and what you could not verify.

## Hard rules

- **Facts from the code**, never from names or memory; anything uncertain is said as uncertain on the page.
- **Text copied from the repo is escaped** (`<` → `&lt;`) before it goes into captions, `INFO` notes or tables: captions are HTML.
- **Plain words.** Short sentences, each term defined once, files and functions in `<code>`.
- **Restraint.** One ink colour plus the ok, alert and warn tokens; hatching means a separate process or untrusted input; the header is the title and dek alone.
