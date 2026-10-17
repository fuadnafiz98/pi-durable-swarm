# Visual language and layout

The page reads like a technical bulletin: one reading column of prose, wide figures drawn in one monochrome line language, colour only where it means something.

## Page

- **Header**: the title (`h1`) and one dek sentence — nothing else: no metadata grid, badges, version labels, stat rows or author lines.
- **Contents** list at the top of the first prose block (`<!-- toc -->`).
- **Sections**: `h2` with a kicker (`<span class="n">03 · STRUCTURE</span>`), a lead paragraph, the figure, then an optional table or honest note.
- **Widths**: prose 680 px; figures 1080 px; in code mode, figures with a pane grow to `min(1760px, 100vw − 64px)` with the drawing left and code right from 1360 px up, and stack below that.
- **Long pages** may split into tabs (`.tabs`), one per audience or subsystem; the URL hash keeps the tab.

## Colour and type

Tokens live in `assets/style.css` (`:root`, with dark values under `prefers-color-scheme` and `[data-theme]`). Use only:

| Token / class | Means |
| --- | --- |
| ink (`ln`, `lbl`, `cap` stroke) | everything by default |
| `ok` (`ok-f`, `ok-l`, `lbl-g`) | the current element, healthy, done |
| `alert` (`bad-f`, `bad-l`, `lbl-b`) | failed, rejected, dangerous |
| `warn` (`warn-f`, `lbl-w`) | degraded, waiting, needs attention |
| `cut` (hatched) | a separate process or untrusted input |
| `side`, `dk` | stores, secondary boxes, shaded isometric faces |
| `guide` (dashed) | a region, something absent, a what-if |

Fonts, all inlined from `assets/fonts` so a page makes no outside request: Libron (serif, OFL) for prose, Paper Mono (OFL) for figures and code, Departure Mono (MIT) for all-caps labels — the kit switches to it automatically. A page may swap in its own licensed serif via `page.json` → `"fonts": {"serif": {"name": "…", "files": [{"path": "…woff2", "weight": 400}]}}`.

## Restraint

Sharp corners, hairline strokes, flat fills, a 4 px offset shadow only on callouts. One accent per figure: the current thing. Motion only when it shows cause and effect ([diagrams.md](diagrams.md#motion)). Diagrams carry their own small labels; the caption carries the explanation.

## Accessibility and robustness

- Every figure has an `aria-label` that states what the picture shows, and every step's meaning is in its caption, so the page reads without the drawing.
- Reduced motion: the kit stops all loops and turns clock players into event steppers.
- Phones: a figure scrolls sideways inside its frame (min 760 px), the page itself never does.
- Light and dark mode come from the tokens; never hard-code a colour in `figures.js`.

## Artifact hosting

When the host is claude.ai artifacts: one HTML file with everything inline (the kit and fonts already are); add no external scripts, stylesheets or fonts; stay well under the size limit (a typical page is 400–600 KiB, mostly fonts; code mode adds the embedded source). If the host's artifact skill asks for its own design steps, follow them and keep this page's content and figures.
